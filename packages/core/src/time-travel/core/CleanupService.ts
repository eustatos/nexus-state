/**
 * CleanupService - Manages TTL and cleanup of stale atoms
 *
 * Handles time-to-live (TTL) tracking and cleanup of
 * atoms that are no longer needed.
 */

import type { TrackedAtom } from '../tracking/types';

export interface CleanupServiceConfig {
  /** Enable TTL tracking */
  enabled: boolean;
  /** Default TTL in milliseconds */
  defaultTTL: number;
  /** Cleanup interval in milliseconds */
  cleanupInterval: number;
  /** Minimum age before cleanup (ms) */
  minAgeBeforeCleanup: number;
}

export interface CleanupResult {
  /** Number of atoms cleaned up */
  cleanedCount: number;
  /** Number of atoms that failed cleanup */
  failedCount: number;
  /** Atoms that were cleaned up */
  cleanedAtoms: string[];
  /** Error messages */
  errors: string[];
}

export interface CleanupStats {
  /** Total tracked atoms */
  totalTrackedAtoms: number;
  /** Stale atoms count */
  staleAtomsCount: number;
  /** Last cleanup timestamp */
  lastCleanupTimestamp?: number;
  /** Total cleanups performed */
  totalCleanups: number;
}

export interface TrackedAtomWithTimestamp extends TrackedAtom {
  /** Last access timestamp */
  lastAccessTimestamp: number;
  /** Creation timestamp */
  createdTimestamp: number;
  /** TTL in milliseconds (0 = no TTL) */
  ttl: number;
}

/**
 * CleanupService provides TTL management and cleanup
 * for tracked atoms
 */
export class CleanupService {
  private trackedAtoms: Map<symbol, TrackedAtomWithTimestamp> = new Map();
  private config: CleanupServiceConfig;
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastCleanupTimestamp?: number;
  private totalCleanups: number = 0;

  constructor(config?: Partial<CleanupServiceConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      defaultTTL: config?.defaultTTL ?? 300000, // 5 minutes
      cleanupInterval: config?.cleanupInterval ?? 60000, // 1 minute
      minAgeBeforeCleanup: config?.minAgeBeforeCleanup ?? 1000, // 1 second
    };
  }

  /**
   * Track an atom with TTL
   * @param atom Atom to track
   * @param ttl Optional TTL in milliseconds
   */
  track(atom: TrackedAtom, ttl?: number): void {
    if (!this.config.enabled) return;

    const now = Date.now();
    this.trackedAtoms.set(atom.id, {
      ...atom,
      lastAccessTimestamp: now,
      createdTimestamp: now,
      ttl: ttl ?? this.config.defaultTTL,
    });
  }

  /**
   * Update last access timestamp for an atom
   * @param atomId Atom ID
   */
  touch(atomId: symbol): void {
    const atom = this.trackedAtoms.get(atomId);
    if (atom) {
      atom.lastAccessTimestamp = Date.now();
    }
  }

  /**
   * Stop tracking an atom
   * @param atomId Atom ID
   */
  untrack(atomId: symbol): void {
    this.trackedAtoms.delete(atomId);
  }

  /**
   * Get stale atoms (exceeded TTL)
   * @returns Array of stale atoms
   */
  getStaleAtoms(): TrackedAtomWithTimestamp[] {
    const now = Date.now();
    const stale: TrackedAtomWithTimestamp[] = [];

    for (const atom of this.trackedAtoms.values()) {
      if (atom.ttl > 0) {
        const age = now - atom.lastAccessTimestamp;
        if (age > atom.ttl && age > this.config.minAgeBeforeCleanup) {
          stale.push(atom);
        }
      }
    }

    return stale;
  }

  /**
   * Perform cleanup of stale atoms
   * @returns Cleanup result
   */
  cleanupNow(): CleanupResult {
    const staleAtoms = this.getStaleAtoms();
    const cleanedAtoms: string[] = [];
    const errors: string[] = [];
    let failedCount = 0;

    for (const atom of staleAtoms) {
      try {
        this.trackedAtoms.delete(atom.id);
        cleanedAtoms.push(atom.name);
      } catch (error) {
        failedCount++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push(`Failed to cleanup atom ${atom.name}: ${errorMessage}`);
      }
    }

    this.lastCleanupTimestamp = Date.now();
    this.totalCleanups++;

    return {
      cleanedCount: cleanedAtoms.length,
      failedCount,
      cleanedAtoms,
      errors,
    };
  }

  /**
   * Start automatic cleanup
   */
  startAutoCleanup(): void {
    if (this.cleanupIntervalId) {
      this.stopAutoCleanup();
    }

    this.cleanupIntervalId = setInterval(() => {
      this.cleanupNow();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  /**
   * Get cleanup statistics
   */
  getStats(): CleanupStats {
    return {
      totalTrackedAtoms: this.trackedAtoms.size,
      staleAtomsCount: this.getStaleAtoms().length,
      lastCleanupTimestamp: this.lastCleanupTimestamp,
      totalCleanups: this.totalCleanups,
    };
  }

  /**
   * Clear all tracked atoms
   */
  clear(): void {
    this.trackedAtoms.clear();
  }

  /**
   * Get number of tracked atoms
   */
  getTrackedCount(): number {
    return this.trackedAtoms.size;
  }

  /**
   * Get tracked atom by ID
   * @param atomId Atom ID
   * @returns Tracked atom or undefined
   */
  getTrackedAtom(atomId: symbol): TrackedAtomWithTimestamp | undefined {
    return this.trackedAtoms.get(atomId);
  }

  /**
   * Get all tracked atoms
   * @returns Array of tracked atoms
   */
  getAllTrackedAtoms(): TrackedAtomWithTimestamp[] {
    return Array.from(this.trackedAtoms.values());
  }

  /**
   * Get configuration
   */
  getConfig(): CleanupServiceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<CleanupServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Dispose cleanup service
   */
  dispose(): void {
    this.stopAutoCleanup();
    this.clear();
  }
}
