/**
 * Size-based compression strategy
 * When history exceeds size limit, keeps every Nth snapshot
 */

import { BaseCompressionStrategy } from "./strategy";
import type { Snapshot } from "../types";

/**
 * Configuration for size-based compression
 */
export interface SizeBasedCompressionConfig {
  /** Maximum number of snapshots before compression (default: 50) */
  maxSnapshots?: number;
  /** Keep every Nth snapshot when compressing (default: 5) */
  keepEvery?: number;
  /** Enable/disable compression (default: true) */
  enabled?: boolean;
  /** Minimum number of snapshots to keep (default: 10) */
  minSnapshots?: number;
}

/**
 * Size-based compression strategy
 * When history exceeds size limit, keeps every Nth snapshot
 */
export class SizeBasedCompression extends BaseCompressionStrategy {
  name = "size";
  
  private maxSnapshots: number;
  private keepEvery: number;
  
  constructor(config: SizeBasedCompressionConfig = {}) {
    super({
      minSnapshots: 10,
      enabled: true,
      ...config,
    });
    
    this.maxSnapshots = config.maxSnapshots ?? 50;
    this.keepEvery = config.keepEvery ?? 5;
  }
  
  shouldCompress(history: Snapshot[], currentIndex: number): boolean {
    if (!super.shouldCompress(history, currentIndex)) {
      return false;
    }
    
    // Check if history exceeds max snapshots
    return history.length > this.maxSnapshots;
  }
  
  compress(history: Snapshot[]): Snapshot[] {
    // If within limits, return a copy
    if (history.length <= this.maxSnapshots) {
      return [...history];
    }
    
    // Simple approach: keep every Nth snapshot
    const result: Snapshot[] = [];
    for (let i = 0; i < history.length; i += this.keepEvery) {
      result.push(history[i]);
    }
    
    // Always include the last snapshot if not already included
    if (result[result.length - 1]?.id !== history[history.length - 1].id) {
      result.push(history[history.length - 1]);
    }
    
    // Trim to maxSnapshots if needed
    while (result.length > this.maxSnapshots) {
      // Remove from the middle
      const middleIndex = Math.floor(result.length / 2);
      result.splice(middleIndex, 1);
    }
    
    // Record compression metadata
    this.recordMetadata(
      history.length,
      result.length,
      history.length - result.length,
    );
    
    return result;
  }
  
  /**
   * Get the maximum number of snapshots before compression
   */
  getMaxSnapshots(): number {
    return this.maxSnapshots;
  }
  
  /**
   * Get the compression factor
   */
  getKeepEvery(): number {
    return this.keepEvery;
  }
}
