## Task 10: Implement Snapshot Restoration with Automatic Rollback on Error

**Filename:** `task-010-implement-snapshot-restoration-rollback.md`

### Context

The current `SnapshotRestorer` applies changes directly without any protection against partial failures. When an error occurs during restoration (atom not found, validation error, exception in setter), the store can end up in an inconsistent state with only some atoms updated. Need to implement atomic restoration with automatic rollback capability.

### Current Problem

```typescript
// Current implementation - no rollback on failure
restore(snapshot: Snapshot): boolean {
  // Applies changes one by one
  // If one fails, previous changes are already applied
  // No way to revert to original state
}
```

### Requirements

1. **Create Type-Safe Restoration Types**

```typescript
// src/snapshot/types/restoration.types.ts
import type { Snapshot, SnapshotStateEntry } from "../../types";

export interface RestorationCheckpoint {
  id: string;
  timestamp: number;
  snapshotId: string;
  previousValues: Map<symbol, unknown>;
  metadata: {
    atomCount: number;
    duration: number;
    affectedAtoms: string[];
  };
}

export interface RestorationResult {
  success: boolean;
  snapshotId: string;
  checkpointId?: string;
  appliedAtoms: number;
  failedAtoms: number;
  errors: RestorationError[];
  duration: number;
  rollbackPerformed: boolean;
}

export interface RestorationError {
  atomName: string;
  atomId: string;
  error: string;
  originalValue?: unknown;
  attemptedValue?: unknown;
}

export interface RestorationOptions {
  validateBeforeRestore: boolean;
  rollbackOnError: boolean;
  batchSize?: number;
  timeout?: number;
  onProgress?: (progress: RestorationProgress) => void;
}

export interface RestorationProgress {
  stage: "validation" | "checkpoint" | "restoration" | "rollback";
  current: number;
  total: number;
  atomName?: string;
}

export interface RestorationConfig {
  validateBeforeRestore: boolean;
  strictMode: boolean;
  onAtomNotFound: "error" | "warn" | "skip";
  batchRestore: boolean;
  batchSize: number;
  rollbackOnError: boolean;
  checkpointTimeout: number;
  maxCheckpoints: number;
}
```

2. **Implement Transactional Restorer**

```typescript
// src/snapshot/SnapshotRestorer.ts
import { Atom, Store } from "../../types";
import { atomRegistry } from "../../atom-registry";
import type {
  RestorationCheckpoint,
  RestorationResult,
  RestorationError,
  RestorationOptions,
  RestorationConfig,
} from "./types/restoration.types";
import type { Snapshot } from "../types";

export class SnapshotRestorer {
  private store: Store;
  private config: RestorationConfig;
  private checkpoints: Map<string, RestorationCheckpoint> = new Map();
  private activeRestoration: boolean = false;

  constructor(store: Store, config?: Partial<RestorationConfig>) {
    this.store = store;
    this.config = {
      validateBeforeRestore: true,
      strictMode: false,
      onAtomNotFound: "warn",
      batchRestore: true,
      batchSize: 10,
      rollbackOnError: true,
      checkpointTimeout: 5000,
      maxCheckpoints: 50,
      ...config,
    };
  }

  /**
   * Restore snapshot with transaction support
   */
  async restore(
    snapshot: Snapshot,
    options?: Partial<RestorationOptions>,
  ): Promise<RestorationResult> {
    const startTime = Date.now();
    const errors: RestorationError[] = [];

    if (this.activeRestoration) {
      return {
        success: false,
        snapshotId: snapshot.id,
        appliedAtoms: 0,
        failedAtoms: 0,
        errors: [
          {
            atomName: "system",
            atomId: "system",
            error: "Restoration already in progress",
          },
        ],
        duration: Date.now() - startTime,
        rollbackPerformed: false,
      };
    }

    this.activeRestoration = true;
    const checkpoint = await this.createCheckpoint(snapshot.id);

    try {
      // Phase 1: Validate
      if (this.config.validateBeforeRestore) {
        const validation = await this.validateRestoration(snapshot);
        if (!validation.valid) {
          await this.rollback(checkpoint.id);
          return {
            success: false,
            snapshotId: snapshot.id,
            checkpointId: checkpoint.id,
            appliedAtoms: 0,
            failedAtoms: validation.errors.length,
            errors: validation.errors,
            duration: Date.now() - startTime,
            rollbackPerformed: true,
          };
        }
      }

      // Phase 2: Apply changes
      const applyResult = await this.applyChanges(snapshot, {
        batchSize: options?.batchSize || this.config.batchSize,
        onProgress: options?.onProgress,
      });

      // Phase 3: Commit if successful
      if (applyResult.failedAtoms === 0) {
        this.commitCheckpoint(checkpoint.id);

        return {
          success: true,
          snapshotId: snapshot.id,
          checkpointId: checkpoint.id,
          appliedAtoms: applyResult.appliedAtoms,
          failedAtoms: 0,
          errors: [],
          duration: Date.now() - startTime,
          rollbackPerformed: false,
        };
      } else {
        // Partial failure - rollback if configured
        if (this.config.rollbackOnError) {
          await this.rollback(checkpoint.id);
          return {
            success: false,
            snapshotId: snapshot.id,
            checkpointId: checkpoint.id,
            appliedAtoms: applyResult.appliedAtoms,
            failedAtoms: applyResult.failedAtoms,
            errors: applyResult.errors,
            duration: Date.now() - startTime,
            rollbackPerformed: true,
          };
        } else {
          // Keep partial changes (dangerous)
          return {
            success: false,
            snapshotId: snapshot.id,
            checkpointId: checkpoint.id,
            appliedAtoms: applyResult.appliedAtoms,
            failedAtoms: applyResult.failedAtoms,
            errors: applyResult.errors,
            duration: Date.now() - startTime,
            rollbackPerformed: false,
          };
        }
      }
    } catch (error) {
      // Unexpected error - rollback
      await this.rollback(checkpoint.id);

      return {
        success: false,
        snapshotId: snapshot.id,
        checkpointId: checkpoint.id,
        appliedAtoms: 0,
        failedAtoms: 0,
        errors: [
          {
            atomName: "system",
            atomId: "system",
            error: error instanceof Error ? error.message : String(error),
          },
        ],
        duration: Date.now() - startTime,
        rollbackPerformed: true,
      };
    } finally {
      this.activeRestoration = false;
    }
  }

  /**
   * Create checkpoint of current state
   */
  private async createCheckpoint(
    snapshotId: string,
  ): Promise<RestorationCheckpoint> {
    const previousValues = new Map<symbol, unknown>();
    const affectedAtoms: string[] = [];

    // Save current values of all atoms (we'll filter later)
    const allAtoms = atomRegistry.getAll();

    for (const atom of allAtoms) {
      try {
        const value = this.store.get(atom);
        previousValues.set(atom.id, value);
        if (atom.name) {
          affectedAtoms.push(atom.name);
        }
      } catch (error) {
        // Skip atoms that can't be read
      }
    }

    const checkpoint: RestorationCheckpoint = {
      id: this.generateCheckpointId(),
      timestamp: Date.now(),
      snapshotId,
      previousValues,
      metadata: {
        atomCount: previousValues.size,
        duration: 0,
        affectedAtoms,
      },
    };

    // Clean old checkpoints
    this.cleanOldCheckpoints();

    this.checkpoints.set(checkpoint.id, checkpoint);
    return checkpoint;
  }

  /**
   * Validate restoration can be performed
   */
  private async validateRestoration(
    snapshot: Snapshot,
  ): Promise<{ valid: boolean; errors: RestorationError[] }> {
    const errors: RestorationError[] = [];

    for (const [atomName, entry] of Object.entries(snapshot.state)) {
      const atom = atomRegistry.getByName(atomName);

      if (!atom) {
        const error: RestorationError = {
          atomName,
          atomId: entry.atomId,
          error: `Atom not found: ${atomName}`,
        };

        if (this.config.onAtomNotFound === "error") {
          errors.push(error);
        } else if (this.config.onAtomNotFound === "warn") {
          console.warn(error.error);
        }
        // Skip continues silently

        if (this.config.strictMode && this.config.onAtomNotFound === "error") {
          return { valid: false, errors };
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Apply changes in batches
   */
  private async applyChanges(
    snapshot: Snapshot,
    options: {
      batchSize: number;
      onProgress?: (progress: RestorationProgress) => void;
    },
  ): Promise<{
    appliedAtoms: number;
    failedAtoms: number;
    errors: RestorationError[];
  }> {
    const entries = Object.entries(snapshot.state);
    const appliedAtoms: string[] = [];
    const errors: RestorationError[] = [];

    // Process in batches
    for (let i = 0; i < entries.length; i += options.batchSize) {
      const batch = entries.slice(i, i + options.batchSize);

      options.onProgress?.({
        stage: "restoration",
        current: i + batch.length,
        total: entries.length,
      });

      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(async ([atomName, entry]) => {
          try {
            const atom = atomRegistry.getByName(atomName);
            if (!atom) {
              throw new Error(`Atom not found: ${atomName}`);
            }

            await this.store.set(atom, entry.value);
            appliedAtoms.push(atomName);
          } catch (error) {
            throw {
              atomName,
              atomId: entry.atomId,
              error: error instanceof Error ? error.message : String(error),
              attemptedValue: entry.value,
            };
          }
        }),
      );

      // Collect errors
      batchResults.forEach((result, index) => {
        if (result.status === "rejected") {
          errors.push(result.reason as RestorationError);
        }
      });

      // If strict mode and errors, stop
      if (this.config.strictMode && errors.length > 0) {
        break;
      }
    }

    return {
      appliedAtoms: appliedAtoms.length,
      failedAtoms: errors.length,
      errors,
    };
  }

  /**
   * Rollback to checkpoint
   */
  async rollback(checkpointId: string): Promise<boolean> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      return false;
    }

    try {
      const errors: Error[] = [];

      // Restore previous values
      for (const [atomId, value] of checkpoint.previousValues) {
        try {
          const atom = atomRegistry.get(atomId);
          if (atom) {
            await this.store.set(atom, value);
          }
        } catch (error) {
          errors.push(error as Error);
        }
      }

      // Clean up checkpoint
      this.checkpoints.delete(checkpointId);

      if (errors.length > 0) {
        console.error("Rollback completed with errors:", errors);
      }

      return true;
    } catch (error) {
      console.error("Rollback failed:", error);
      return false;
    }
  }

  /**
   * Commit checkpoint (mark as successful)
   */
  private commitCheckpoint(checkpointId: string): void {
    // Keep checkpoint for potential later use, but mark as committed
    const checkpoint = this.checkpoints.get(checkpointId);
    if (checkpoint) {
      // Optionally archive or just keep for history
    }
  }

  /**
   * Clean old checkpoints
   */
  private cleanOldCheckpoints(): void {
    const now = Date.now();
    const checkpoints = Array.from(this.checkpoints.entries());

    for (const [id, checkpoint] of checkpoints) {
      if (now - checkpoint.timestamp > this.config.checkpointTimeout) {
        this.checkpoints.delete(id);
      }
    }

    // Limit number of checkpoints
    if (this.checkpoints.size > this.config.maxCheckpoints) {
      const sorted = Array.from(this.checkpoints.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp,
      );

      const toRemove = sorted.slice(
        0,
        sorted.length - this.config.maxCheckpoints,
      );
      toRemove.forEach(([id]) => this.checkpoints.delete(id));
    }
  }

  /**
   * Generate checkpoint ID
   */
  private generateCheckpointId(): string {
    return `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get active checkpoint
   */
  getCheckpoint(checkpointId: string): RestorationCheckpoint | undefined {
    return this.checkpoints.get(checkpointId);
  }

  /**
   * Check if restoration is in progress
   */
  isRestoring(): boolean {
    return this.activeRestoration;
  }

  /**
   * Clear all checkpoints
   */
  clearCheckpoints(): void {
    this.checkpoints.clear();
  }
}
```

3. **Integration with SimpleTimeTravel**

```typescript
// src/time-travel/SimpleTimeTravel.ts (partial update)
import { SnapshotRestorer } from "../snapshot/SnapshotRestorer";
import type {
  RestorationResult,
  RestorationOptions,
} from "../snapshot/types/restoration.types";

export class SimpleTimeTravel implements TimeTravelAPI {
  private snapshotRestorer: SnapshotRestorer;

  constructor(store: Store, options: TimeTravelOptions = {}) {
    this.snapshotRestorer = new SnapshotRestorer(store, {
      validateBeforeRestore: true,
      rollbackOnError: true,
      batchRestore: true,
      batchSize: 10,
      ...options.restoreConfig,
    });
  }

  /**
   * Restore to snapshot with transaction support
   */
  async restoreToSnapshot(
    snapshotId: string,
    options?: Partial<RestorationOptions>,
  ): Promise<RestorationResult> {
    const snapshot = this.historyManager.getSnapshot(snapshotId);
    if (!snapshot) {
      return {
        success: false,
        snapshotId,
        appliedAtoms: 0,
        failedAtoms: 0,
        errors: [
          {
            atomName: "system",
            atomId: "system",
            error: `Snapshot not found: ${snapshotId}`,
          },
        ],
        duration: 0,
        rollbackPerformed: false,
      };
    }

    return this.snapshotRestorer.restore(snapshot, options);
  }

  /**
   * Override undo to use transactional restoration
   */
  async undo(): Promise<boolean> {
    if (this.isTimeTraveling) return false;

    this.isTimeTraveling = true;
    try {
      const result = await this.historyNavigator.undo();
      return result;
    } finally {
      this.isTimeTraveling = false;
    }
  }

  /**
   * Get checkpoint status
   */
  getActiveCheckpoints(): {
    id: string;
    timestamp: number;
    atomCount: number;
  }[] {
    // Implementation depends on access pattern
    return [];
  }
}
```

4. **Type-Safe Tests**

```typescript
// test/snapshot/restoration-rollback.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SnapshotRestorer } from "../../src/snapshot/SnapshotRestorer";
import { TestHelper } from "../utils/test-helpers";
import type { Store, Atom } from "../../src/types";
import type {
  RestorationResult,
  RestorationError,
} from "../../src/snapshot/types/restoration.types";

describe("SnapshotRestorer with Rollback", () => {
  let store: Store;
  let restorer: SnapshotRestorer;
  let atom1: Atom<number>;
  let atom2: Atom<string>;
  let atom3: Atom<boolean>;

  beforeEach(() => {
    store = TestHelper.createTestStore();
    restorer = new SnapshotRestorer(store, {
      validateBeforeRestore: true,
      rollbackOnError: true,
      batchRestore: true,
      batchSize: 2,
    });

    atom1 = TestHelper.generateAtom("counter", "writable");
    atom2 = TestHelper.generateAtom("text", "writable");
    atom3 = TestHelper.generateAtom("flag", "writable");

    store.set(atom1, 42);
    store.set(atom2, "hello");
    store.set(atom3, true);
  });

  it("should successfully restore with transaction", async () => {
    const snapshot = TestHelper.generateSnapshot("test-restore", {
      counter: 100,
      text: "world",
      flag: false,
    });

    const result = (await restorer.restore(snapshot)) as RestorationResult;

    expect(result.success).toBe(true);
    expect(result.appliedAtoms).toBe(3);
    expect(result.failedAtoms).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(result.rollbackPerformed).toBe(false);

    expect(store.get(atom1)).toBe(100);
    expect(store.get(atom2)).toBe("world");
    expect(store.get(atom3)).toBe(false);
  });

  it("should rollback on partial failure", async () => {
    const snapshot = TestHelper.generateSnapshot("test-partial", {
      counter: 200,
      text: "updated",
      flag: false,
    });

    // Make atom2 fail
    TestHelper.mockStoreSet(store, (atom: Atom<unknown>) => {
      if (atom === atom2) {
        throw new Error("Set failed");
      }
      return undefined;
    });

    const result = (await restorer.restore(snapshot)) as RestorationResult;

    expect(result.success).toBe(false);
    expect(result.rollbackPerformed).toBe(true);
    expect(result.failedAtoms).toBe(1);

    // Verify all atoms rolled back to original values
    expect(store.get(atom1)).toBe(42);
    expect(store.get(atom2)).toBe("hello");
    expect(store.get(atom3)).toBe(true);
  });

  it("should handle missing atoms during restoration", async () => {
    const snapshot = TestHelper.generateSnapshot("test-missing", {
      counter: 300,
      missingAtom: "value",
    });

    const result = (await restorer.restore(snapshot)) as RestorationResult;

    expect(result.success).toBe(false);
    expect(result.failedAtoms).toBe(1);
    expect(result.errors[0]?.atomName).toBe("missingAtom");

    // Valid atom should have been rolled back
    expect(store.get(atom1)).toBe(42);
  });

  it("should respect batch size", async () => {
    const snapshot = TestHelper.generateSnapshot("test-batch", {
      counter: 500,
      text: "batch",
      flag: false,
    });

    const onProgress = vi.fn();

    await restorer.restore(snapshot, {
      batchSize: 1,
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "restoration", current: 1, total: 3 }),
    );
  });

  it("should handle concurrent restoration attempts", async () => {
    const snapshot1 = TestHelper.generateSnapshot("test1", { counter: 1000 });
    const snapshot2 = TestHelper.generateSnapshot("test2", { counter: 2000 });

    const result1 = restorer.restore(snapshot1);
    const result2 = restorer.restore(snapshot2);

    const [res1, res2] = (await Promise.all([
      result1,
      result2,
    ])) as RestorationResult[];

    // One should fail due to concurrency
    expect(res1.success !== res2.success).toBe(true);
    expect(res1.errors.length > 0 || res2.errors.length > 0).toBe(true);
  });

  it("should clean up old checkpoints", async () => {
    const restorerWithLimit = new SnapshotRestorer(store, {
      maxCheckpoints: 2,
      checkpointTimeout: 100,
    });

    // Create checkpoints
    for (let i = 0; i < 3; i++) {
      const snapshot = TestHelper.generateSnapshot(`test-${i}`, { counter: i });
      await restorerWithLimit.restore(snapshot);
      await TestHelper.wait(10);
    }

    const restorerAny = restorerWithLimit as any;
    expect(restorerAny.checkpoints.size).toBeLessThanOrEqual(2);
  });
});
```

### Definition of Done

- [ ] Transactional restoration with checkpoint system implemented
- [ ] Automatic rollback on any error working
- [ ] Batch processing with progress tracking
- [ ] Checkpoint cleanup mechanism
- [ ] Type-safe with no `any` usage
- [ ] 100% test coverage for restoration scenarios
- [ ] Integration with SimpleTimeTravel
- [ ] Documentation with examples
- [ ] Performance benchmarks showing overhead < 20%

### SPR Requirements

- Single responsibility: restorer only handles restoration
- Clear separation between validation, checkpoint, and application
- Type-safe error handling
- Immutable checkpoint data
- No side effects in validation phase
- Proper cleanup of resources
