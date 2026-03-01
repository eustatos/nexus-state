/**
 * Time-based compression strategy
 * Keeps recent snapshots at full resolution, compresses older ones
 */

import { BaseCompressionStrategy } from "./strategy";
import type { Snapshot } from "../types";

/**
 * Configuration for time-based compression
 */
export interface TimeBasedCompressionConfig {
  /** Keep snapshots newer than this (in milliseconds) at full resolution (default: 5 minutes) */
  keepRecentForMs?: number;
  /** Keep every Nth snapshot for older snapshots (default: 5) */
  keepEvery?: number;
  /** Enable/disable compression (default: true) */
  enabled?: boolean;
  /** Minimum number of snapshots to keep (default: 10) */
  minSnapshots?: number;
}

/**
 * Time-based compression strategy
 * Keeps recent snapshots at full resolution, compresses older ones
 */
export class TimeBasedCompression extends BaseCompressionStrategy {
  name = "time";
  
  private keepRecentForMs: number;
  private keepEvery: number;
  
  constructor(config: TimeBasedCompressionConfig = {}) {
    super({
      minSnapshots: 10,
      enabled: true,
      ...config,
    });
    
    this.keepRecentForMs = config.keepRecentForMs ?? 5 * 60 * 1000; // 5 minutes
    this.keepEvery = config.keepEvery ?? 5;
  }
  
  shouldCompress(history: Snapshot[], currentIndex: number): boolean {
    if (!super.shouldCompress(history, currentIndex)) {
      return false;
    }
    
    // Check if there are snapshots older than the threshold
    const now = Date.now();
    const recentThreshold = now - this.keepRecentForMs;
    
    return history.some((s) => s.metadata.timestamp < recentThreshold);
  }
  
  compress(history: Snapshot[]): Snapshot[] {
    const now = Date.now();
    const recentThreshold = now - this.keepRecentForMs;
    
    // Split into recent and old snapshots
    const recent = history.filter(
      (s) => s.metadata.timestamp >= recentThreshold,
    );
    const old = history.filter((s) => s.metadata.timestamp < recentThreshold);
    
    // Keep every Nth old snapshot
    const compressedOld = old.filter(
      (_, index) => index % this.keepEvery === 0,
    );
    
    // Combine: keep all recent snapshots + compressed old snapshots
    const result = [...recent, ...compressedOld];
    
    // Record compression metadata
    this.recordMetadata(
      history.length,
      result.length,
      history.length - result.length,
    );
    
    return result;
  }
  
  /**
   * Get the time threshold for recent snapshots
   */
  getKeepRecentForMs(): number {
    return this.keepRecentForMs;
  }
  
  /**
   * Get the compression factor for old snapshots
   */
  getKeepEvery(): number {
    return this.keepEvery;
  }
}
