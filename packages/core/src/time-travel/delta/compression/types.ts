/**
 * Delta compression types
 */

import type { FullSnapshotStrategy } from "../types";

/**
 * Configuration for delta compression strategy
 */
export interface DeltaCompressionConfig {
  /** Enable/disable compression */
  enabled?: boolean;
  /** Minimum chain length before compression */
  minChainLength?: number;
  /** Maximum age of chain (time-based) */
  maxAge?: number;
  /** Maximum number of deltas (changes-based) */
  maxDeltas?: number;
  /** Maximum chain size in bytes (size-based) */
  maxSize?: number;
}

/**
 * Configuration for delta compression factory
 */
export interface DeltaCompressionFactoryConfig {
  /** Strategy to use */
  strategy: DeltaCompressionStrategyType | DeltaCompressionStrategy;
  /** Time-based strategy options */
  time?: {
    /** Maximum age in ms */
    maxAge?: number;
  };
  /** Changes-based strategy options */
  changes?: {
    /** Maximum deltas before compression */
    maxDeltas?: number;
  };
  /** Size-based strategy options */
  size?: {
    /** Maximum size in bytes */
    maxSize?: number;
  };
  /** Minimum chain length */
  minChainLength?: number;
  /** Enable/disable compression */
  enabled?: boolean;
}

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
  shouldCompress(chain: { deltas: any[]; metadata: any }): boolean;

  /**
   * Compress the chain
   */
  compress(chain: { deltas: any[]; metadata: any }): { deltas: any[]; metadata: any };

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
 * Delta compression metadata
 */
export interface DeltaCompressionMetadata {
  /** Strategy used */
  strategy: FullSnapshotStrategy | string;
  /** Timestamp of compression */
  timestamp: number;
  /** Chain length before compression */
  originalChainLength: number;
  /** Chain length after compression */
  compressedChainLength: number;
  /** Memory saved */
  memorySaved: number;
}

/**
 * Strategy name type
 */
export type DeltaCompressionStrategyType = 
  | "none" 
  | "time" 
  | "changes" 
  | "size" 
  | "significance";
