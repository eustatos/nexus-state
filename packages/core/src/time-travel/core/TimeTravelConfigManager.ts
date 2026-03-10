/**
 * TimeTravelConfigManager - Manages time travel configuration
 *
 * Responsibilities:
 * - Store configuration
 * - Update configuration
 * - Provide configuration access
 */

import type { TimeTravelControllerConfig } from './types';
import type { TimeTravelOptions } from '../types';

export interface TimeTravelConfigManagerConfig extends TimeTravelOptions {
  /** TTL in milliseconds */
  ttl?: number;
  /** Cleanup interval in milliseconds */
  cleanupInterval?: number;
}

export class TimeTravelConfigManager {
  private config: TimeTravelControllerConfig;

  constructor(options?: Partial<TimeTravelConfigManagerConfig>) {
    // Support both new (deltaSnapshots.enabled) and legacy formats
    const enableDeltaSnapshots = options?.deltaSnapshots?.enabled ?? false;

    this.config = {
      maxHistory: options?.maxHistory ?? 50,
      autoCapture: options?.autoCapture ?? false,
      ttl: options?.ttl ?? 300000, // 5 minutes
      cleanupInterval: options?.cleanupInterval ?? 60000, // 1 minute
      deltaSnapshots: options?.deltaSnapshots,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): TimeTravelControllerConfig {
    return { ...this.config };
  }

  /**
   * Get specific config value
   */
  getValue<K extends keyof TimeTravelControllerConfig>(
    key: K
  ): TimeTravelControllerConfig[K] {
    return this.config[key];
  }

  /**
   * Update configuration
   */
  configure(config: Partial<TimeTravelControllerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get max history
   */
  getMaxHistory(): number {
    return this.config.maxHistory ?? 50;
  }

  /**
   * Get auto-capture setting
   */
  getAutoCapture(): boolean {
    return this.config.autoCapture ?? false;
  }

  /**
   * Get TTL
   */
  getTTL(): number {
    return this.config.ttl ?? 300000;
  }

  /**
   * Get cleanup interval
   */
  getCleanupInterval(): number {
    return this.config.cleanupInterval ?? 60000;
  }

  /**
   * Check if delta snapshots are enabled
   */
  isDeltaSnapshotsEnabled(): boolean {
    return this.config.deltaSnapshots?.enabled ?? false;
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.config = {
      maxHistory: 50,
      autoCapture: false,
      ttl: 300000,
      cleanupInterval: 60000,
      deltaSnapshots: undefined,
    };
  }
}
