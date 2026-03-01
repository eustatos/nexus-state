/**
 * Cleanup strategies for AtomTracker
 *
 * @packageDocumentation
 * Provides different strategies for selecting atoms eligible for cleanup.
 */

import type { CleanupStrategy, TrackedAtom } from "./types";

/**
 * LRU (Least Recently Used) cleanup strategy
 * Selects atoms that haven't been accessed for the longest time
 */
export class LRUCleanupStrategy implements CleanupStrategy {
  name = "lru";

  /**
   * Select candidates for cleanup
   * @param atoms - Array of tracked atoms
   * @param count - Maximum number of candidates to select
   * @returns Array of atoms selected for cleanup
   */
  selectCandidates(atoms: TrackedAtom[], count: number): TrackedAtom[] {
    return atoms
      .filter((a) => a.gcEligible)
      .sort((a, b) => a.lastAccessed - b.lastAccessed) // Oldest access first
      .slice(0, count);
  }

  /**
   * Get priority for an atom
   * Lower lastAccessed = higher priority (more negative)
   * @param atom - Tracked atom
   * @returns Priority value (higher = sooner cleanup)
   */
  getPriority(atom: TrackedAtom): number {
    return -atom.lastAccessed;
  }
}

/**
 * LFU (Least Frequently Used) cleanup strategy
 * Selects atoms with the lowest access count
 */
export class LFUCleanupStrategy implements CleanupStrategy {
  name = "lfu";

  /**
   * Select candidates for cleanup
   * @param atoms - Array of tracked atoms
   * @param count - Maximum number of candidates to select
   * @returns Array of atoms selected for cleanup
   */
  selectCandidates(atoms: TrackedAtom[], count: number): TrackedAtom[] {
    return atoms
      .filter((a) => a.gcEligible)
      .sort((a, b) => a.accessCount - b.accessCount) // Least frequent first
      .slice(0, count);
  }

  /**
   * Get priority for an atom
   * Lower accessCount = higher priority (more negative)
   * @param atom - Tracked atom
   * @returns Priority value (higher = sooner cleanup)
   */
  getPriority(atom: TrackedAtom): number {
    return -atom.accessCount;
  }
}

/**
 * FIFO (First In First Out) cleanup strategy
 * Selects atoms that were created earliest
 */
export class FIFOCleanupStrategy implements CleanupStrategy {
  name = "fifo";

  /**
   * Select candidates for cleanup
   * @param atoms - Array of tracked atoms
   * @param count - Maximum number of candidates to select
   * @returns Array of atoms selected for cleanup
   */
  selectCandidates(atoms: TrackedAtom[], count: number): TrackedAtom[] {
    return atoms
      .filter((a) => a.gcEligible)
      .sort((a, b) => a.createdAt - b.createdAt) // Oldest creation first
      .slice(0, count);
  }

  /**
   * Get priority for an atom
   * Lower createdAt = higher priority (more negative)
   * @param atom - Tracked atom
   * @returns Priority value (higher = sooner cleanup)
   */
  getPriority(atom: TrackedAtom): number {
    return -atom.createdAt;
  }
}

/**
 * Time-based cleanup strategy
 * Selects atoms that have exceeded their TTL
 */
export class TimeBasedCleanupStrategy implements CleanupStrategy {
  name = "time-based";
  private currentTime: number;

  /**
   * Create time-based cleanup strategy
   * @param now - Current timestamp (defaults to Date.now())
   */
  constructor(now: number = Date.now()) {
    this.currentTime = now;
  }

  /**
   * Select candidates for cleanup
   * @param atoms - Array of tracked atoms
   * @param count - Maximum number of candidates to select
   * @returns Array of atoms selected for cleanup
   */
  selectCandidates(atoms: TrackedAtom[], count: number): TrackedAtom[] {
    return atoms
      .filter((a) => this.isExpired(a))
      .sort((a, b) => {
        // Most expired first (highest age - ttl difference)
        const ageA = this.currentTime - a.lastAccessed;
        const ageB = this.currentTime - b.lastAccessed;
        return (ageB - b.ttl) - (ageA - a.ttl);
      })
      .slice(0, count);
  }

  /**
   * Check if an atom is expired
   * @param atom - Tracked atom
   * @returns True if atom has exceeded its TTL
   */
  private isExpired(atom: TrackedAtom): boolean {
    const age = this.currentTime - atom.lastAccessed;
    return age > atom.ttl;
  }

  /**
   * Get priority for an atom
   * Positive = expired, higher = more expired
   * @param atom - Tracked atom
   * @returns Priority value (higher = sooner cleanup)
   */
  getPriority(atom: TrackedAtom): number {
    const age = this.currentTime - atom.lastAccessed;
    return age - atom.ttl;
  }

  /**
   * Update current time (useful for testing)
   * @param now - New current timestamp
   */
  setCurrentTime(now: number): void {
    this.currentTime = now;
  }
}

/**
 * Factory function to create cleanup strategy by name
 * @param type - Strategy type
 * @param now - Optional current timestamp for time-based strategy
 * @returns Cleanup strategy instance
 */
export function createCleanupStrategy(
  type: string,
  now?: number,
): CleanupStrategy {
  switch (type) {
    case "lru":
      return new LRUCleanupStrategy();
    case "lfu":
      return new LFUCleanupStrategy();
    case "fifo":
      return new FIFOCleanupStrategy();
    case "time-based":
      return new TimeBasedCleanupStrategy(now);
    default:
      return new LRUCleanupStrategy();
  }
}
