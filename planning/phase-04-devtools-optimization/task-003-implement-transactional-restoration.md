## Task 3: Add Transactional Snapshot Restoration with Rollback Capability

**Filename:** `task-003-implement-transactional-restoration.md`

### Context

The current `SnapshotRestorer` applies changes directly without any protection against partial failures. If an error occurs during restoration (e.g., atom not found, validation error, or exception in setter), the store can end up in an inconsistent state with only some atoms updated.

### Requirements

1. **Create Checkpoint System**

```typescript
interface RestorationCheckpoint {
  id: string;
  timestamp: number;
  snapshotId: string;
  previousValues: Map<symbol, any>;
  metadata: {
    atomCount: number;
    duration: number;
  };
}
```

2. **Enhance SnapshotRestorer with Transaction Support**

```typescript
interface TransactionalRestorerConfig {
  enableTransactions: boolean;
  rollbackOnError: boolean;
  validateBeforeRestore: boolean;
  batchSize?: number; // for batch restoration
  timeout?: number; // max time for restoration
}
```

3. **Implement Three-Phase Restoration**
   - **Phase 1 - Validation**: Validate all atoms and values before any changes
   - **Phase 2 - Checkpoint**: Save current values of affected atoms
   - **Phase 3 - Restoration**: Apply changes with rollback capability

4. **Add Recovery Mechanisms**
   - Automatic rollback on any error
   - Manual rollback via API
   - Partial restoration with error reporting
   - Compensating transactions for complex cases

### Technical Implementation

**Enhanced SnapshotRestorer:**

```typescript
export class SnapshotRestorer {
  private checkpoints: Map<string, RestorationCheckpoint> = new Map();
  private activeRestoration: boolean = false;

  async restore(
    snapshot: Snapshot,
    options?: RestorationOptions,
  ): Promise<RestorationResult> {
    const checkpoint = await this.createCheckpoint(snapshot.id);

    try {
      this.activeRestoration = true;

      // Phase 1: Validate
      const validation = await this.validateRestoration(snapshot);
      if (!validation.valid) {
        throw new RestorationError("Validation failed", validation.errors);
      }

      // Phase 2: Create checkpoint (already done)

      // Phase 3: Apply changes transactionally
      const result = await this.applyChanges(snapshot, {
        batchSize: options?.batchSize,
        onProgress: options?.onProgress,
      });

      // Commit checkpoint (mark as successful)
      this.commitCheckpoint(checkpoint.id);

      return {
        success: true,
        checkpointId: checkpoint.id,
        appliedAtoms: result.appliedCount,
        failedAtoms: result.failedCount,
        duration: Date.now() - checkpoint.timestamp,
      };
    } catch (error) {
      // Automatic rollback on error
      await this.rollback(checkpoint.id);

      return {
        success: false,
        checkpointId: checkpoint.id,
        error: error.message,
        rollbackPerformed: true,
      };
    } finally {
      this.activeRestoration = false;
    }
  }

  async rollback(checkpointId: string): Promise<boolean> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) return false;

    // Restore previous values in reverse order
    const reversedAtoms = Array.from(
      checkpoint.previousValues.entries(),
    ).reverse();

    for (const [atomId, previousValue] of reversedAtoms) {
      try {
        const atom = this.getAtomById(atomId);
        if (atom) {
          await this.store.set(atom, previousValue);
        }
      } catch (error) {
        console.error(`Failed to rollback atom ${atomId.toString()}:`, error);
        // Continue with other rollbacks
      }
    }

    this.checkpoints.delete(checkpointId);
    return true;
  }
}
```

### Testing Scenarios

1. **Success Path**
   - Full restoration with all atoms updated correctly
   - Batch processing with progress reporting

2. **Failure Scenarios**
   - Atom not found during restoration
   - Validation error on specific atom
   - Exception in atom setter
   - Timeout during restoration
   - Partial batch failure

3. **Rollback Testing**
   - Verify state returns to exact pre-restoration values
   - Check that no side effects remain
   - Multiple rollbacks from same checkpoint
   - Concurrent restoration attempts

4. **Performance Testing**
   - Measure overhead of transaction support
   - Compare with non-transactional restoration
   - Test with large snapshots (1000+ atoms)
   - Benchmark checkpoint creation

### Integration Points

1. **Update TimeTravelAPI**

```typescript
interface TimeTravelAPI {
  restoreWithTransaction(
    snapshotId: string,
    options?: RestorationOptions,
  ): Promise<RestorationResult>;
  getLastCheckpoint(): RestorationCheckpoint | null;
  rollbackToCheckpoint(checkpointId: string): Promise<boolean>;
}
```

2. **Enhance HistoryNavigator**
   - Add transaction-aware navigation
   - Support for interrupted undo/redo
   - Checkpoint cleanup on successful operations

### Configuration Options

```typescript
interface TransactionConfig {
  enabled: boolean;
  autoRollback: boolean;
  checkpointTimeout: number; // ms to keep checkpoints
  maxCheckpoints: number; // limit stored checkpoints
  onError: "rollback" | "continue" | "throw";
}
```

### Definition of Done

- [ ] Transactional restoration implemented with three phases
- [ ] Checkpoint system working with rollback capability
- [ ] All test scenarios passing
- [ ] Integration with existing TimeTravelAPI
- [ ] Performance benchmarks showing < 20% overhead for transactions
- [ ] Documentation with examples and best practices
- [ ] Error handling for all edge cases
- [ ] Memory management for checkpoints (auto-cleanup)

### SPR Requirements

- Single responsibility: restoration logic separate from transaction management
- Open/closed: easy to add new validation or restoration strategies
- Liskov substitution: restoration result types properly structured
- Interface segregation: clear separation between validation, checkpoint, and restoration
- Dependency inversion: depend on abstractions, not concrete implementations

---

**Note:** After completion, provide examples of recovery from different failure scenarios and performance metrics comparing transactional vs non-transactional restoration.
