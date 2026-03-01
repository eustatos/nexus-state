/**
 * Compression strategy interface and base classes
 * for HistoryManager history compression
 */

import type { Snapshot } from "../types";
import type { CompressionMetadata } from "../types";

/**
 * Configuration for compression strategies
 */
export interface CompressionStrategyConfig {
  /** Minimum number of snapshots to keep (default: 10) */
  minSnapshots?: number;
  /** Enable/disable compression (default: true) */
  enabled?: boolean;
}

/**
 * Strategy for determining when and how to compress history
 */
export interface CompressionStrategy {
  /** Strategy name for identification */
  name: string;
  
  /**
   * Check if compression should be applied based on current history
   * @param history All snapshots in history (past + current + future)
   * @param currentIndex Current position in history
   * @returns True if compression should be applied
   */
  shouldCompress(history: Snapshot[], currentIndex: number): boolean;
  
  /**
   * Compress the history by removing or modifying snapshots
   * @param history All snapshots to compress
   * @returns Compressed history array
   */
  compress(history: Snapshot[]): Snapshot[];
  
  /**
   * Get metadata about the last compression operation
   * @returns CompressionMetadata or null if no compression has occurred
   */
  getMetadata(): CompressionMetadata | null;
  
  /**
   * Reset the strategy's state
   */
  reset?(): void;
}

/**
 * Base class for compression strategies with common functionality
 */
export abstract class BaseCompressionStrategy implements CompressionStrategy {
  /** Strategy name */
  abstract name: string;
  
  /** Configuration */
  protected config: CompressionStrategyConfig;
  
  /** Last compression metadata */
  private lastMetadata: CompressionMetadata | null = null;
  
  constructor(config: CompressionStrategyConfig = {}) {
    this.config = {
      minSnapshots: 10,
      enabled: true,
      ...config,
    };
  }
  
  /**
   * Check if compression should be applied
   */
  shouldCompress(history: Snapshot[], _currentIndex: number): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // Always keep at least minSnapshots
    if (history.length <= (this.config.minSnapshots ?? 10)) {
      return false;
    }

    return true;
  }
  
  /**
   * Compress history - must be implemented by subclasses
   */
  abstract compress(history: Snapshot[]): Snapshot[];
  
  /**
   * Get last compression metadata
   */
  getMetadata(): CompressionMetadata | null {
    return this.lastMetadata;
  }
  
  /**
   * Record compression metadata
   */
  protected recordMetadata(
    originalCount: number,
    compressedCount: number,
    removedCount: number,
  ): void {
    this.lastMetadata = {
      strategy: this.name,
      timestamp: Date.now(),
      originalCount,
      compressedCount,
      removedCount,
      compressionRatio: compressedCount / originalCount,
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
 * No compression strategy - keeps all snapshots
 */
export class NoCompressionStrategy extends BaseCompressionStrategy {
  name = "none";
  
  constructor(config: CompressionStrategyConfig = {}) {
    super({ enabled: false, ...config });
  }
  
  shouldCompress(): boolean {
    return false;
  }
  
  compress(history: Snapshot[]): Snapshot[] {
    return [...history];
  }
}
