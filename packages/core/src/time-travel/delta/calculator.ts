/**
 * Delta Calculator - Computes and applies deltas between snapshots
 * Implements delta-based changes for memory-efficient time travel
 */

import type {
  DeltaSnapshot,
  DeltaChange,
  DeltaOptions,
  ApplyDeltaOptions,
} from "./types";

import { snapshotsEqual } from "../../utils/snapshot-serialization/utils";
import type { Snapshot } from "../types";

/**
 * Configuration for DeltaCalculator
 */
export interface DeltaCalculatorConfig {
  /** Enable deep equality check */
  deepEqual?: boolean;
  /** Skip empty deltas (no changes) */
  skipEmpty?: boolean;
  /** Include path information for nested objects */
  trackPaths?: boolean;
  /** Custom change detection */
  changeDetector?: (oldValue: unknown, newValue: unknown) => boolean;
  /** Enable validation */
  validate?: boolean;
}

/**
 * Default configuration for DeltaCalculator
 */
export const DEFAULT_DELTA_CALCULATOR_CONFIG: DeltaCalculatorConfig = {
  deepEqual: true,
  skipEmpty: true,
  trackPaths: false,
  validate: true,
};

/**
 * Interface for delta calculator
 */
export interface DeltaCalculator {
  /**
   * Compute delta between two snapshots
   * @param previous Previous snapshot
   * @param current Current snapshot
   * @param options Delta options
   * @returns Delta snapshot or null if no changes
   */
  computeDelta(
    previous: Snapshot,
    current: Snapshot,
    options?: DeltaOptions,
  ): DeltaSnapshot | null;

  /**
   * Apply delta to a base snapshot
   * @param base Base snapshot
   * @param delta Delta to apply
   * @param options Apply options
   * @returns Result of applying delta
   */
  applyDelta(
    base: Snapshot,
    delta: DeltaSnapshot,
    options?: ApplyDeltaOptions,
  ): Snapshot | null;

  /**
   * Check if two snapshots are equal
   * @param a First snapshot
   * @param b Second snapshot
   * @returns True if equal
   */
  areSnapshotsEqual(a: Snapshot, b: Snapshot): boolean;

  /**
   * Calculate size of delta in bytes
   * @param changes Map of changes
   * @returns Size in bytes
   */
  calculateDeltaSize(changes: Map<string, DeltaChange>): number;

  /**
   * Calculate approximate size of snapshot in bytes
   * @param snapshot Snapshot to measure
   * @returns Size in bytes
   */
  calculateSnapshotSize(snapshot: Snapshot): number;
}

/**
 * Implementation of delta calculator
 */
export class DeltaCalculatorImpl implements DeltaCalculator {
  private config: DeltaCalculatorConfig;

  constructor(config: DeltaCalculatorConfig = {}) {
    this.config = { ...DEFAULT_DELTA_CALCULATOR_CONFIG, ...config };
  }

  /**
   * Compute delta between two snapshots
   */
  computeDelta(
    previous: Snapshot,
    current: Snapshot,
    options?: DeltaOptions,
  ): DeltaSnapshot | null {
    const startTime = Date.now();

    const deltaOptions: DeltaOptions = {
      ...this.config,
      ...options,
    };

    const changes: Map<string, DeltaChange> = new Map();

    // Find modified and deleted atoms
    for (const [atomName, prevEntry] of Object.entries(previous.state)) {
      const currEntry = current.state[atomName];

      if (!currEntry) {
        // Atom was deleted
        changes.set(atomName, {
          atomId: prevEntry.atomId || atomName,
          atomName,
          oldValue: prevEntry.value,
          newValue: null,
          changeType: "deleted",
          path: deltaOptions.trackPaths ? [] : undefined,
        });
      } else if (!this.areValuesEqual(prevEntry.value, currEntry.value)) {
        // Atom was modified
        changes.set(atomName, {
          atomId: currEntry.atomId || atomName,
          atomName,
          oldValue: prevEntry.value,
          newValue: currEntry.value,
          changeType: "modified",
          path: deltaOptions.trackPaths ? [] : undefined,
        });
      }
    }

    // Find added atoms
    for (const [atomName, currEntry] of Object.entries(current.state)) {
      if (!previous.state[atomName]) {
        changes.set(atomName, {
          atomId: currEntry.atomId || atomName,
          atomName,
          oldValue: null,
          newValue: currEntry.value,
          changeType: "added",
          path: deltaOptions.trackPaths ? [] : undefined,
        });
      }
    }

    // Check for empty delta
    if (deltaOptions.skipEmpty && changes.size === 0) {
      return null;
    }

    const deltaSize = this.calculateDeltaSize(changes);
    const snapshotSize = this.calculateSnapshotSize(current);

    const delta: DeltaSnapshot = {
      id: this.generateId(),
      type: "delta",
      baseSnapshotId: previous.id,
      state: {}, // Delta snapshots don't store full state
      changes,
      metadata: {
        timestamp: Date.now(),
        action: current.metadata.action,
        atomCount: changes.size,
        baseTimestamp: previous.metadata.timestamp,
        changeCount: changes.size,
        compressedSize: deltaSize,
        originalSize: snapshotSize,
      },
    };

    // Computation time tracking (currently unused, reserved for metrics)
    const _computationTime = Date.now() - startTime;
    void _computationTime;

    return delta;
  }

  /**
   * Apply delta to a base snapshot
   */
  applyDelta(
    base: Snapshot,
    delta: DeltaSnapshot,
    options?: ApplyDeltaOptions,
  ): Snapshot | null {
    const startTime = Date.now();

    const applyOptions: ApplyDeltaOptions = {
      validate: true,
      immutable: true,
      ...options,
    };

    // Validate delta
    if (applyOptions.validate && !this.validateDelta(base, delta)) {
      return null;
    }

    // Create copy of base if immutable
    const newSnapshot = applyOptions.immutable
      ? this.cloneSnapshot(base)
      : base;

    // Apply changes
    let atomsAffected = 0;

    for (const [atomName, change] of delta.changes.entries()) {
      if (change.changeType === "added" || change.changeType === "modified") {
        newSnapshot.state[atomName] = {
          value: change.newValue,
          type: "primitive", // Will be determined properly if needed
          name: change.atomName,
          atomId: change.atomId,
        };
        atomsAffected++;
      } else if (change.changeType === "deleted") {
        delete newSnapshot.state[atomName];
        atomsAffected++;
      }
    }

    // Update metadata
    newSnapshot.metadata = {
      ...newSnapshot.metadata,
      timestamp: delta.metadata.timestamp,
      action: delta.metadata.action,
      atomCount: Object.keys(newSnapshot.state).length,
    };

    // Application time tracking (currently unused, reserved for metrics)
    const _applicationTime = Date.now() - startTime;
    void _applicationTime;

    return newSnapshot;
  }

  /**
   * Check if two snapshots are equal
   */
  areSnapshotsEqual(a: Snapshot, b: Snapshot): boolean {
    return snapshotsEqual(a.state, b.state);
  }

  /**
   * Calculate size of delta in bytes
   */
  calculateDeltaSize(changes: Map<string, DeltaChange>): number {
    // Rough estimation: count characters in JSON representation
    let size = 0;
    for (const [key, change] of changes.entries()) {
      size += key.length * 2;
      size += change.atomId.length * 2;
      size += change.atomName.length * 2;
      size += 50;
    }
    return size;
  }

  /**
   * Calculate approximate size of snapshot in bytes
   */
  calculateSnapshotSize(snapshot: Snapshot): number {
    let size = snapshot.id.length * 2;
    size += (snapshot.metadata.action?.length || 0) * 2;
    size += 100;

    for (const [key, entry] of Object.entries(snapshot.state)) {
      size += key.length * 2;
      size += this.calculateValueSize(entry.value);
      size += 50;
    }

    return size;
  }

  /**
   * Calculate size of a value in bytes
   */
  private calculateValueSize(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }

    switch (typeof value) {
      case "string":
        return value.length * 2;
      case "number":
      case "boolean":
        return 8;
      case "object":
        if (Array.isArray(value)) {
          return value.length * 8;
        }
        return JSON.stringify(value).length * 2;
      case "function":
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Generate unique ID for delta
   */
  private generateId(): string {
    return `delta-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Validate delta
   */
  private validateDelta(base: Snapshot, delta: DeltaSnapshot): boolean {
    if (delta.baseSnapshotId !== base.id) {
      return false;
    }

    if (delta.changes.size === 0) {
      return false;
    }

    return true;
  }

  /**
   * Clone snapshot
   */
  private cloneSnapshot(snapshot: Snapshot): Snapshot {
    return {
      id: snapshot.id,
      state: { ...snapshot.state },
      metadata: { ...snapshot.metadata },
    };
  }

  /**
   * Check if two values are equal
   */
  private areValuesEqual(a: unknown, b: unknown): boolean {
    if (!this.config.deepEqual) {
      return a === b;
    }

    // Use deep equality with circular reference support
    return snapshotsEqual({ __value__: a }, { __value__: b });
  }
}
