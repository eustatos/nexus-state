/**
 * Delta compression strategy interface and base classes
 * Provides strategies for creating full snapshots in delta chains
 */

import type {
  DeltaChain,
  DeltaCompressionMetadata,
  FullSnapshotStrategy,
  DeltaCompressionConfig,
} from "../types";

/**
 * Delta compression strategy
 */
export interface DeltaCompressionStrategy {
  /** Strategy name */
  name: string;
  /** Strategy description */
  description: string;
  /** Strategy type */
  type: FullSnapshotStrategy | string;

  /**
   * Check if compression should be applied
   */
  shouldCompress(chain: DeltaChain): boolean;

  /**
   * Compress the chain
   */
  compress(chain: DeltaChain): DeltaChain;

  /**
   * Get compression metadata
   */
  getMetadata(): DeltaCompressionMetadata | null;

  /**
   * Reset strategy state
   */
  reset?(): void;
}

/**
 * Base class for compression strategies
 */
export abstract class BaseDeltaCompressionStrategy implements DeltaCompressionStrategy {
  /** Strategy name */
  abstract name: string;

  /** Strategy description */
  abstract description: string;

  /** Strategy type */
  abstract type: FullSnapshotStrategy | string;

  /** Configuration */
  protected config: { enabled?: boolean; minChainLength?: number };

  /** Last compression metadata */
  private lastMetadata: DeltaCompressionMetadata | null = null;

  constructor(config: { enabled?: boolean; minChainLength?: number } = {}) {
    this.config = {
      minChainLength: 10,
      enabled: true,
      ...config,
    };
  }

  /**
   * Check if compression should be applied
   */
  shouldCompress(chain: DeltaChain): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // Check minimum chain length
    if (chain.deltas.length < (this.config.minChainLength || 10)) {
      return false;
    }

    return true;
  }

  /**
   * Compress chain - must be implemented by subclasses
   */
  abstract compress(chain: DeltaChain): DeltaChain;

  /**
   * Get compression metadata
   */
  getMetadata(): DeltaCompressionMetadata | null {
    return this.lastMetadata;
  }

  /**
   * Record compression metadata
   */
  protected recordMetadata(
    strategy: FullSnapshotStrategy | string,
    originalLength: number,
    compressedLength: number,
    memorySaved: number,
  ): void {
    this.lastMetadata = {
      strategy: strategy as FullSnapshotStrategy,
      timestamp: Date.now(),
      originalChainLength: originalLength,
      compressedChainLength: compressedLength,
      memorySaved,
    };
  }

  /**
   * Reset strategy state
   */
  reset(): void {
    this.lastMetadata = null;
  }
}

/**
 * No compression strategy
 */
export class NoDeltaCompressionStrategy extends BaseDeltaCompressionStrategy {
  name = "none";
  description = "No compression - keep all deltas";
  type = "manual" as const;

  constructor(config: { enabled?: boolean; minChainLength?: number } = {}) {
    super({ enabled: false, ...config });
  }

  shouldCompress(): boolean {
    return false;
  }

  compress(chain: DeltaChain): DeltaChain {
    return chain;
  }
}

/**
 * Time-based compression strategy
 */
export class TimeBasedDeltaCompressionStrategy extends BaseDeltaCompressionStrategy {
  name = "time";
  description = "Create full snapshot based on time";
  type = "time" as const;

  /** Maximum age of chain before compression (ms) */
  private maxAge: number;

  constructor(config: DeltaCompressionConfig = {}) {
    super({
      minChainLength: 5,
      enabled: true,
      ...config,
    });

    this.maxAge = config.maxAge || 5 * 60 * 1000; // 5 minutes
  }

  shouldCompress(chain: DeltaChain): boolean {
    if (!super.shouldCompress(chain)) {
      return false;
    }

    // Check chain age
    const age = Date.now() - chain.metadata.createdAt;
    return age > this.maxAge;
  }

  compress(chain: DeltaChain): DeltaChain {
    // For time-based, we just clear the chain and create new base
    const memorySaved = chain.metadata.memoryUsage;
    chain.deltas = [];
    chain.metadata.memoryUsage = 0;
    chain.metadata.updatedAt = Date.now();

    this.recordMetadata(this.type, chain.deltas.length, 0, memorySaved);

    return chain;
  }
}

/**
 * Changes-based compression strategy
 */
export class ChangesBasedDeltaCompressionStrategy extends BaseDeltaCompressionStrategy {
  name = "changes";
  description = "Create full snapshot after N changes";
  type = "changes" as const;

  /** Maximum number of deltas before compression */
  private maxDeltas: number;

  constructor(config: DeltaCompressionConfig = {}) {
    super({
      minChainLength: 5,
      enabled: true,
      ...config,
    });

    this.maxDeltas = config.maxDeltas || 20;
  }

  shouldCompress(chain: DeltaChain): boolean {
    if (!super.shouldCompress(chain)) {
      return false;
    }

    // Check chain length
    return chain.deltas.length >= this.maxDeltas;
  }

  compress(chain: DeltaChain): DeltaChain {
    const memorySaved = chain.metadata.memoryUsage;
    chain.deltas = [];
    chain.metadata.memoryUsage = 0;
    chain.metadata.updatedAt = Date.now();

    this.recordMetadata(this.type, chain.deltas.length, 0, memorySaved);

    return chain;
  }
}

/**
 * Size-based compression strategy
 */
export class SizeBasedDeltaCompressionStrategy extends BaseDeltaCompressionStrategy {
  name = "size";
  description = "Create full snapshot when chain exceeds size limit";
  type = "size" as const;

  /** Maximum chain size in bytes */
  private maxSize: number;

  constructor(config: DeltaCompressionConfig = {}) {
    super({
      minChainLength: 5,
      enabled: true,
      ...config,
    });

    this.maxSize = config.maxSize || 1024 * 1024; // 1MB
  }

  shouldCompress(chain: DeltaChain): boolean {
    if (!super.shouldCompress(chain)) {
      return false;
    }

    // Check chain size
    return chain.metadata.memoryUsage > this.maxSize;
  }

  compress(chain: DeltaChain): DeltaChain {
    const memorySaved = chain.metadata.memoryUsage;
    chain.deltas = [];
    chain.metadata.memoryUsage = 0;
    chain.metadata.updatedAt = Date.now();

    this.recordMetadata(this.type, chain.deltas.length, 0, memorySaved);

    return chain;
  }
}

/**
 * Significance-based compression strategy
 */
export class SignificanceBasedDeltaCompressionStrategy extends BaseDeltaCompressionStrategy {
  name = "significance";
  description = "Create full snapshot for important changes";
  type = "significance" as const;

  constructor(config: DeltaCompressionConfig = {}) {
    super({
      minChainLength: 5,
      enabled: true,
      ...config,
    });
  }

  shouldCompress(chain: DeltaChain): boolean {
    if (!super.shouldCompress(chain)) {
      return false;
    }

    // Check for significant changes in chain
    const significantCount = chain.deltas.filter((d) => {
      // Consider significant if it changes many atoms
      return d.changes.size > 10;
    }).length;

    return significantCount > 0;
  }

  compress(chain: DeltaChain): DeltaChain {
    // Keep significant deltas, remove others
    const significantDeltas = chain.deltas.filter((d) => d.changes.size > 10);
    const removedCount = chain.deltas.length - significantDeltas.length;

    const memorySaved = chain.metadata.memoryUsage * (removedCount / chain.deltas.length);

    chain.deltas = significantDeltas;
    chain.metadata.memoryUsage = chain.deltas.reduce(
      (sum, d) => sum + d.metadata.compressedSize,
      0,
    );
    chain.metadata.updatedAt = Date.now();

    this.recordMetadata(
      this.type,
      chain.deltas.length + removedCount,
      chain.deltas.length,
      memorySaved,
    );

    return chain;
  }
}
