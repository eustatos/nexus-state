/**
 * DeltaCalculatorOperations - Delta computation and application operations
 *
 * Wrapper around DeltaCalculatorImpl for easier testing and usage.
 */

import type { Snapshot, DeltaSnapshot } from "../types";
import { DeltaCalculatorImpl, type DeltaCalculatorConfig } from "./calculator";

/**
 * Delta computation result
 */
export interface DeltaResult {
  /** Computed delta or null */
  delta: DeltaSnapshot | null;
  /** Whether delta is empty (no changes) */
  isEmpty: boolean;
  /** Number of changes in delta */
  changeCount: number;
}

/**
 * Delta application result
 */
export interface ApplyDeltaResult {
  /** Resulting snapshot or null */
  snapshot: Snapshot | null;
  /** Whether application was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * DeltaCalculatorOperations provides delta computation
 * and application operations without external dependencies
 */
export class DeltaCalculatorOperations {
  private calculator: DeltaCalculatorImpl;

  constructor(config?: DeltaCalculatorConfig) {
    this.calculator = new DeltaCalculatorImpl(config);
  }

  /**
   * Compute delta between two snapshots
   * @param previous - Previous snapshot
   * @param current - Current snapshot
   * @returns Delta result
   */
  computeDelta(previous: Snapshot, current: Snapshot): DeltaResult {
    const delta = this.calculator.computeDelta(previous, current);

    if (!delta) {
      return {
        delta: null,
        isEmpty: true,
        changeCount: 0,
      };
    }

    return {
      delta,
      isEmpty: delta.changes.size === 0,
      changeCount: delta.changes.size,
    };
  }

  /**
   * Apply delta to a base snapshot
   * @param base - Base snapshot
   * @param delta - Delta to apply
   * @returns Application result
   */
  applyDelta(base: Snapshot, delta: DeltaSnapshot): ApplyDeltaResult {
    try {
      const result = this.calculator.applyDelta(base, delta);

      if (!result) {
        return {
          snapshot: null,
          success: false,
          error: "Failed to apply delta",
        };
      }

      return {
        snapshot: result,
        success: true,
      };
    } catch (error) {
      return {
        snapshot: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if two snapshots are equal
   * @param a - First snapshot
   * @param b - Second snapshot
   * @returns True if equal
   */
  areSnapshotsEqual(a: Snapshot, b: Snapshot): boolean {
    return this.calculator.areSnapshotsEqual(a, b);
  }

  /**
   * Check if snapshots have changes
   * @param previous - Previous snapshot
   * @param current - Current snapshot
   * @returns True if has changes
   */
  hasChanges(previous: Snapshot, current: Snapshot): boolean {
    const result = this.computeDelta(previous, current);
    return !result.isEmpty;
  }

  /**
   * Get change count between snapshots
   * @param previous - Previous snapshot
   * @param current - Current snapshot
   * @returns Number of changes
   */
  getChangeCount(previous: Snapshot, current: Snapshot): number {
    const result = this.computeDelta(previous, current);
    return result.changeCount;
  }

  /**
   * Apply multiple deltas in sequence
   * @param base - Base snapshot
   * @param deltas - Array of deltas to apply
   * @returns Final snapshot or null
   */
  applyDeltaChain(base: Snapshot, deltas: DeltaSnapshot[]): ApplyDeltaResult {
    let current: Snapshot | null = base;

    for (const delta of deltas) {
      if (!current) {
        return {
          snapshot: null,
          success: false,
          error: "Snapshot became null during delta chain application",
        };
      }

      const result = this.applyDelta(current, delta);

      if (!result.success) {
        return result;
      }

      current = result.snapshot;
    }

    return {
      snapshot: current,
      success: true,
    };
  }

  /**
   * Compute delta chain from base to target
   * @param base - Base snapshot
   * @param target - Target snapshot
   * @param intermediateSnapshots - Snapshots between base and target
   * @returns Array of deltas or empty array
   */
  computeDeltaChain(
    base: Snapshot,
    target: Snapshot,
    intermediateSnapshots: Snapshot[]
  ): DeltaSnapshot[] {
    const deltas: DeltaSnapshot[] = [];
    let previous = base;

    for (const snapshot of intermediateSnapshots) {
      const result = this.computeDelta(previous, snapshot);

      if (result.delta && !result.isEmpty) {
        deltas.push(result.delta);
      }

      previous = snapshot;
    }

    // Compute final delta to target
    const finalResult = this.computeDelta(previous, target);
    if (finalResult.delta && !finalResult.isEmpty) {
      deltas.push(finalResult.delta);
    }

    return deltas;
  }

  /**
   * Get the underlying calculator
   * @returns Delta calculator instance
   */
  getCalculator(): DeltaCalculatorImpl {
    return this.calculator;
  }
}
