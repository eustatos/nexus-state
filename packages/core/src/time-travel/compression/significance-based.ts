/**
 * Significance-based compression strategy
 * Keeps snapshots with significant changes, compresses similar ones
 */

import { BaseCompressionStrategy } from "./strategy";
import type { Snapshot } from "../types";

/**
 * Configuration for significance-based compression
 */
export interface SignificanceBasedCompressionConfig {
  /** Minimum change threshold for considering a snapshot significant (default: 0.3) */
  minChangeThreshold?: number;
  /** Maximum number of consecutive similar snapshots to keep (default: 3) */
  maxConsecutiveSimilar?: number;
  /** Enable/disable compression (default: true) */
  enabled?: boolean;
  /** Minimum number of snapshots to keep (default: 10) */
  minSnapshots?: number;
}

/**
 * Result of comparing two snapshots for significance
 */
export interface SnapshotComparisonResult {
  /** Whether the snapshots are significantly different */
  different: boolean;
  /** Number of changed atoms */
  changedAtoms: number;
  /** Total atoms compared */
  totalAtoms: number;
  /** Change ratio (changed/total) */
  changeRatio: number;
}

/**
 * Compares two snapshots and determines if they're significantly different
 */
export function compareSnapshots(a: Snapshot, b: Snapshot): SnapshotComparisonResult {
  const atomsA = Object.keys(a.state);
  const atomsB = Object.keys(b.state);
  const allAtoms = new Set([...atomsA, ...atomsB]);
  
  let changedAtoms = 0;
  
  for (const atomName of allAtoms) {
    const entryA = a.state[atomName];
    const entryB = b.state[atomName];
    
    // Check if values are different
    if (entryA && entryB) {
      const valueA = entryA.value;
      const valueB = entryB.value;
      
      // Simple deep comparison for primitives
      if (typeof valueA !== typeof valueB) {
        changedAtoms++;
      } else if (JSON.stringify(valueA) !== JSON.stringify(valueB)) {
        changedAtoms++;
      }
    } else if (entryA || entryB) {
      // One snapshot has this atom, the other doesn't
      changedAtoms++;
    }
  }
  
  return {
    different: changedAtoms > 0,
    changedAtoms,
    totalAtoms: allAtoms.size,
    changeRatio: changedAtoms / allAtoms.size,
  };
}

/**
 * Significance-based compression strategy
 * Keeps snapshots with significant changes, compresses similar ones
 */
export class SignificanceBasedCompression extends BaseCompressionStrategy {
  name = "significance";

  private minChangeThreshold: number;
  private maxConsecutiveSimilar: number;
  protected lastKeptSnapshot: Snapshot | null = null;
  protected consecutiveSimilarCount: number = 0;

  constructor(config: SignificanceBasedCompressionConfig = {}) {
    super({
      minSnapshots: 10,
      enabled: true,
      ...config,
    });

    this.minChangeThreshold = config.minChangeThreshold ?? 0.3;
    this.maxConsecutiveSimilar = config.maxConsecutiveSimilar ?? 3;
  }
  
  shouldCompress(history: Snapshot[], currentIndex: number): boolean {
    if (!super.shouldCompress(history, currentIndex)) {
      return false;
    }
    
    // Check if there are consecutive similar snapshots
    for (let i = 0; i < history.length - 1; i++) {
      const comparison = compareSnapshots(history[i], history[i + 1]);
      if (!comparison.different) {
        return true; // Found consecutive similar snapshots
      }
    }
    
    return false;
  }
  
  compress(history: Snapshot[]): Snapshot[] {
    const result: Snapshot[] = [];
    let lastKeptSnapshot: Snapshot | null = null;
    let consecutiveSimilarCount = 0;
    
    for (const snapshot of history) {
      if (!lastKeptSnapshot) {
        // Always keep the first snapshot
        result.push(snapshot);
        lastKeptSnapshot = snapshot;
        consecutiveSimilarCount = 0;
      } else {
        const comparison = compareSnapshots(lastKeptSnapshot, snapshot);
        
        if (comparison.changeRatio >= this.minChangeThreshold) {
          // Significant change - keep this snapshot
          result.push(snapshot);
          lastKeptSnapshot = snapshot;
          consecutiveSimilarCount = 0;
        } else if (consecutiveSimilarCount < this.maxConsecutiveSimilar) {
          // Similar but within maxConsecutiveSimilar limit - keep it
          result.push(snapshot);
          lastKeptSnapshot = snapshot;
          consecutiveSimilarCount++;
        } else {
          // Skip this similar snapshot
          // Don't update lastKeptSnapshot, continue counting
        }
      }
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
   * Get the minimum change threshold
   */
  getMinChangeThreshold(): number {
    return this.minChangeThreshold;
  }
  
  /**
   * Get the maximum consecutive similar snapshots
   */
  getMaxConsecutiveSimilar(): number {
    return this.maxConsecutiveSimilar;
  }
  
  /**
   * Reset the consecutive similar count
   */
  reset(): void {
    super.reset();
    this.lastKeptSnapshot = null;
    this.consecutiveSimilarCount = 0;
  }
  
  /**
   * Public method to compare two snapshots (for testing)
   */
  compareSnapshots(a: Snapshot, b: Snapshot): SnapshotComparisonResult {
    return compareSnapshots(a, b);
  }
}
