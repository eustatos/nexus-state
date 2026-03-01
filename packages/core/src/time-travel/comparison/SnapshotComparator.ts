/**
 * SnapshotComparator - Compares two snapshots and generates detailed diff
 */

import type {
  SnapshotComparison,
  AtomComparison,
  ComparisonSummary,
  ComparisonStats,
  ComparisonOptions,
  CachedComparison,
} from "./types";
import { DEFAULT_COMPARISON_OPTIONS } from "./types";
import { ValueComparator } from "./ValueComparator";
import type { Snapshot, SnapshotStateEntry } from "../types";

/**
 * Generate unique ID for comparison
 */
function generateId(): string {
  return `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * SnapshotComparator - Main comparison engine
 */
export class SnapshotComparator {
  private cache: Map<string, CachedComparison> = new Map();
  private valueComparator: ValueComparator;
  private options: ComparisonOptions;

  constructor(options?: Partial<ComparisonOptions>) {
    this.options = {
      ...DEFAULT_COMPARISON_OPTIONS,
      ...options,
    };

    this.valueComparator = new ValueComparator(this.options);
  }

  /**
   * Compare two snapshots
   * @param a - First snapshot
   * @param b - Second snapshot
   * @param options - Optional comparison options override
   * @returns Snapshot comparison result
   */
  compare(
    a: Snapshot,
    b: Snapshot,
    options?: Partial<ComparisonOptions>,
  ): SnapshotComparison {
    const startTime = Date.now();
    const memoryBefore = typeof process !== "undefined" && process.memoryUsage
      ? process.memoryUsage().heapUsed
      : 0;

    // Merge options
    const compareOptions = options ? { ...this.options, ...options } : this.options;

    // Reset value comparator for clean state
    this.valueComparator.reset();

    // Check cache
    const cacheKey = this.generateCacheKey(a, b, compareOptions);
    if (compareOptions.cacheResults && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      cached.stats.cacheHits++;
      const result = { ...cached.comparison };
      result.statistics.cacheHits = cached.stats.cacheHits;
      return result;
    }

    // Find all atom names from both snapshots
    const allAtomNames = new Set([
      ...Object.keys(a.state),
      ...Object.keys(b.state),
    ]);

    const atoms: AtomComparison[] = [];
    let comparisons = 0;

    // Compare each atom
    for (const atomName of allAtomNames) {
      comparisons++;
      const entryA = a.state[atomName];
      const entryB = b.state[atomName];

      const atomComparison = this.compareAtom(atomName, entryA, entryB);
      atoms.push(atomComparison);
    }

    // Calculate summary
    const summary = this.calculateSummary(atoms);

    // Calculate statistics
    const memoryAfter = typeof process !== "undefined" && process.memoryUsage
      ? process.memoryUsage().heapUsed
      : 0;

    const stats: ComparisonStats = {
      duration: Date.now() - startTime,
      memoryUsed: memoryAfter - memoryBefore,
      depth: this.valueComparator.getMaxDepth(),
      totalComparisons: comparisons,
      cacheHits: 0,
      cacheMisses: 1,
    };

    const comparison: SnapshotComparison = {
      id: generateId(),
      timestamp: Date.now(),
      summary,
      atoms,
      statistics: stats,
      metadata: {
        snapshotA: {
          id: a.id,
          timestamp: a.metadata.timestamp,
          action: a.metadata.action,
        },
        snapshotB: {
          id: b.id,
          timestamp: b.metadata.timestamp,
          action: b.metadata.action,
        },
        timeDifference: Math.abs(a.metadata.timestamp - b.metadata.timestamp),
        options: compareOptions,
      },
    };

    // Cache result
    if (compareOptions.cacheResults) {
      this.cache.set(cacheKey, {
        comparison,
        timestamp: Date.now(),
        stats: { cacheHits: 0, cacheMisses: 1 },
      });

      // Limit cache size
      if (this.cache.size > compareOptions.cacheSize) {
        const oldestKey = this.findOldestCacheKey();
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }
    }

    return comparison;
  }

  /**
   * Compare a single atom
   */
  private compareAtom(
    atomName: string,
    entryA?: SnapshotStateEntry,
    entryB?: SnapshotStateEntry,
  ): AtomComparison {
    // Handle added atoms (only in B)
    if (!entryA && entryB) {
      return {
        atomId: entryB.atomId || "",
        atomName,
        atomType: entryB.type,
        status: "added",
        newValue: entryB.value,
        newMetadata: entryB,
        path: [atomName],
      };
    }

    // Handle removed atoms (only in A)
    if (entryA && !entryB) {
      return {
        atomId: entryA.atomId || "",
        atomName,
        atomType: entryA.type,
        status: "removed",
        oldValue: entryA.value,
        oldMetadata: entryA,
        path: [atomName],
      };
    }

    // Compare existing atoms
    if (entryA && entryB) {
      const valueEqual = this.valueComparator.areEqual(entryA.value, entryB.value);
      const metadataEqual = this.compareMetadata(entryA, entryB);

      if (!valueEqual || !metadataEqual) {
        return {
          atomId: entryB.atomId || entryA.atomId || "",
          atomName,
          atomType: entryB.type || entryA.type || "primitive",
          status: "modified",
          oldValue: entryA.value,
          newValue: entryB.value,
          valueDiff: this.valueComparator.diff(entryA.value, entryB.value, [atomName]),
          oldMetadata: entryA,
          newMetadata: entryB,
          metadataChanges: metadataEqual ? undefined : this.getMetadataChanges(entryA, entryB),
          path: [atomName],
        };
      }

      // Unchanged
      return {
        atomId: entryA.atomId || entryB.atomId || "",
        atomName,
        atomType: entryA.type || entryB.type || "primitive",
        status: "unchanged",
        path: [atomName],
      };
    }

    // Fallback (should not reach here)
    return {
      atomId: "",
      atomName,
      atomType: "primitive",
      status: "unchanged",
      path: [atomName],
    };
  }

  /**
   * Compare metadata of two entries
   */
  private compareMetadata(a: SnapshotStateEntry, b: SnapshotStateEntry): boolean {
    return a.type === b.type && a.name === b.name && a.atomId === b.atomId;
  }

  /**
   * Get list of metadata changes
   */
  private getMetadataChanges(a: SnapshotStateEntry, b: SnapshotStateEntry): string[] {
    const changes: string[] = [];

    if (a.type !== b.type) {
      changes.push(`type: ${a.type} -> ${b.type}`);
    }
    if (a.name !== b.name) {
      changes.push(`name: ${a.name} -> ${b.name}`);
    }
    if (a.atomId !== b.atomId) {
      changes.push(`atomId: ${a.atomId} -> ${b.atomId}`);
    }

    return changes;
  }

  /**
   * Calculate summary from atom comparisons
   */
  private calculateSummary(atoms: AtomComparison[]): ComparisonSummary {
    const totalAtoms = atoms.length;
    const addedAtoms = atoms.filter((a) => a.status === "added").length;
    const removedAtoms = atoms.filter((a) => a.status === "removed").length;
    const modifiedAtoms = atoms.filter((a) => a.status === "modified").length;
    const unchangedAtoms = atoms.filter((a) => a.status === "unchanged").length;
    const changedAtoms = addedAtoms + removedAtoms + modifiedAtoms;

    return {
      totalAtoms,
      changedAtoms,
      addedAtoms,
      removedAtoms,
      unchangedAtoms,
      hasChanges: changedAtoms > 0,
      changePercentage: totalAtoms > 0 ? (changedAtoms / totalAtoms) * 100 : 0,
    };
  }

  /**
   * Generate cache key for comparison
   */
  private generateCacheKey(
    a: Snapshot,
    b: Snapshot,
    options: ComparisonOptions,
  ): string {
    // Sort IDs to ensure consistent key regardless of order
    const ids = [a.id, b.id].sort();
    return `${ids[0]}_${ids[1]}_${options.deepCompare}_${options.maxDepth}_${options.valueEquality}`;
  }

  /**
   * Find oldest cache entry
   */
  private findOldestCacheKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Clear comparison cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Get current options
   */
  getOptions(): ComparisonOptions {
    return { ...this.options };
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<ComparisonOptions>): void {
    this.options = { ...this.options, ...options };
    this.valueComparator = new ValueComparator(this.options);
  }
}
