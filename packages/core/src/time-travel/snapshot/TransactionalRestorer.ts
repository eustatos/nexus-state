/**
 * TransactionalRestorer - Transactional restoration facade
 *
 * This class is a facade that delegates transactional restoration work
 * to specialized components:
 * - CheckpointManager: Checkpoint lifecycle management
 * - RollbackEngine: Rollback operations
 * - TransactionValidator: Snapshot validation
 * - RestorationApplier: Applying changes to atoms
 * - TransactionContext: Transaction state encapsulation
 */

import type { Snapshot } from '../types';
import type { Store, Atom } from '../../types';
import type {
  TransactionalRestorerConfig,
  TransactionalRestorationResult,
  RestorationOptions,
  RestorationCheckpoint,
  CheckpointResult,
  RollbackResult,
} from './types';
import { CheckpointManager } from './CheckpointManager';
import { RollbackEngine } from './RollbackEngine';
import { TransactionValidator } from './TransactionValidator';
import { RestorationApplier, type AtomToRestore } from './RestorationApplier';
import { TransactionContext } from './TransactionContext';
import { AtomFinder } from './AtomFinder';
import { ValueDeserializer } from './ValueDeserializer';
import { storeLogger as logger } from '../../debug';

/**
 * TransactionalRestorer provides transactional restoration
 * with checkpoint management and rollback capabilities
 */
export class TransactionalRestorer {
  private store: Store;
  private config: TransactionalRestorerConfig;

  // Core components
  private checkpointManager: CheckpointManager;
  private rollbackEngine: RollbackEngine;
  private validator: TransactionValidator;
  private applier: RestorationApplier;
  private atomFinder: AtomFinder;

  // Active transactions
  private activeTransactions: Map<string, TransactionContext> = new Map();

  constructor(
    store: Store,
    config?: Partial<TransactionalRestorerConfig>,
    atomFinder?: AtomFinder,
    deserializer?: ValueDeserializer
  ) {
    this.store = store;
    this.config = {
      enableTransactions: config?.enableTransactions ?? true,
      rollbackOnError: config?.rollbackOnError ?? true,
      validateBeforeRestore: config?.validateBeforeRestore ?? true,
      batchSize: config?.batchSize ?? 0,
      timeout: config?.timeout ?? 5000,
      onError: config?.onError ?? 'rollback',
      maxCheckpoints: config?.maxCheckpoints ?? 10,
      checkpointTimeout: config?.checkpointTimeout ?? 300000,
    };

    // Initialize components
    this.checkpointManager = new CheckpointManager({
      maxCheckpoints: this.config.maxCheckpoints,
      checkpointTimeout: this.config.checkpointTimeout,
    });

    this.rollbackEngine = new RollbackEngine(store, {
      continueOnError: true,
    });

    this.validator = new TransactionValidator({
      requireId: true,
      requireMetadata: true,
      requireAtoms: false,
      warnOnMissingValues: true,
    });

    this.applier = new RestorationApplier(
      store,
      deserializer,
      {
        batchSize: this.config.batchSize,
        timeout: this.config.timeout,
        onError: this.config.onError === 'throw' ? 'throw' : 'continue',
      }
    );

    this.atomFinder = atomFinder || new AtomFinder();
  }

  /**
   * Restore with transaction support
   * @param snapshot Snapshot to restore
   * @param options Restoration options
   * @returns Transactional restoration result
   */
  async restoreWithTransaction(
    snapshot: Snapshot,
    options?: RestorationOptions
  ): Promise<TransactionalRestorationResult> {
    const startTime = Date.now();

    try {
      // Validate snapshot is not null
      if (!snapshot) {
        return {
          success: false,
          restoredCount: 0,
          totalAtoms: 0,
          errors: ['Snapshot is null'],
          warnings: [],
          duration: Date.now() - startTime,
          timestamp: startTime,
          checkpointId: undefined,
          rollbackPerformed: false,
        };
      }

      // Phase 1: Validate
      if (this.config.validateBeforeRestore) {
        const validation = this.validator.validate(snapshot);
        if (!validation.valid) {
          logger.warn(
            '[TransactionalRestorer] Validation failed:',
            validation.errors.join(', ')
          );

          if (this.config.onError === 'throw') {
            throw new Error(
              `Validation failed: ${validation.errors.join(', ')}`
            );
          }

          return {
            success: false,
            restoredCount: 0,
            totalAtoms: Object.keys(snapshot.state).length,
            errors: validation.errors,
            warnings: validation.warnings,
            duration: Date.now() - startTime,
            timestamp: startTime,
            checkpointId: undefined,
            rollbackPerformed: false,
          };
        }
      }

      // Phase 2: Create checkpoint and find atoms
      const checkpointResult = this.checkpointManager.create(snapshot.id);
      const checkpointId = checkpointResult.checkpointId;

      const atomsToRestore = this.findAndCaptureAtoms(snapshot.state);
      const totalAtoms = Object.keys(snapshot.state).length;

      // Log warning if no atoms were found
      if (atomsToRestore.length === 0 && totalAtoms > 0) {
        logger.warn('[TransactionalRestorer] No atoms were found for restoration');
      }

      // Create transaction context
      const transaction = new TransactionContext(
        checkpointId,
        snapshot.id,
        atomsToRestore
      );

      // Capture previous values
      transaction.capturePreviousValues((atom) => this.store.get(atom));
      this.activeTransactions.set(transaction.getId(), transaction);

      // Update checkpoint with captured values
      const checkpoint = this.checkpointManager.get(checkpointId);
      if (checkpoint) {
        checkpoint.previousValues = transaction.getPreviousValues();
        checkpoint.metadata.atomCount = atomsToRestore.length;
      }

      // Phase 3: Begin transaction and apply changes
      transaction.begin();

      const applyResult = this.applier.apply(
        atomsToRestore,
        options?.onProgress
      );

      // Phase 4: Commit or rollback
      if (applyResult.success) {
        this.checkpointManager.commit(checkpointId);
        transaction.commit();
      } else if (this.config.rollbackOnError) {
        const checkpoint = this.checkpointManager.get(checkpointId);
        if (checkpoint) {
          await this.rollback(checkpointId);
          transaction.rollback();
        }
      }

      // Clean up transaction
      this.activeTransactions.delete(transaction.getId());

      // Build restored object from snapshot state
      const restored: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(snapshot.state)) {
        restored[key] = entry.value;
      }

      return {
        success: applyResult.success,
        restoredCount: applyResult.restoredCount,
        totalAtoms: applyResult.totalAtoms,
        errors: applyResult.errors,
        warnings: applyResult.warnings,
        duration: Date.now() - startTime,
        timestamp: startTime,
        checkpointId,
        rollbackPerformed: !applyResult.success && this.config.rollbackOnError,
        successAtoms: applyResult.successAtoms,
        failedAtomDetails: applyResult.failedAtomDetails,
        failedAtoms: applyResult.failedAtoms,
        rolledBackCount: 0,
        interrupted: applyResult.interrupted,
        restored,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[TransactionalRestorer] Restoration failed:', error);

      return {
        success: false,
        restoredCount: 0,
        totalAtoms: Object.keys(snapshot.state).length,
        errors: [errorMessage],
        warnings: [],
        duration: Date.now() - startTime,
        timestamp: startTime,
        checkpointId: undefined,
        rollbackPerformed: false,
        failedAtoms: [],
      };
    }
  }

  /**
   * Rollback to a checkpoint
   * @param checkpointId Checkpoint ID
   * @returns Rollback result
   */
  async rollback(checkpointId: string): Promise<RollbackResult> {
    const checkpoint = this.checkpointManager.get(checkpointId);
    if (!checkpoint) {
      logger.warn(`[TransactionalRestorer] Checkpoint not found: ${checkpointId}`);
      return {
        success: false,
        checkpointId,
        rolledBackCount: 0,
        failedCount: 0,
        timestamp: Date.now(),
        error: `Checkpoint ${checkpointId} not found`,
      };
    }

    logger.log(`[TransactionalRestorer] Rolling back to checkpoint: ${checkpointId}`);

    const result = this.rollbackEngine.rollback(checkpoint);

    // Clean up checkpoint
    this.checkpointManager.delete(checkpointId);

    return result;
  }

  /**
   * Find atoms and prepare for restoration
   */
  private findAndCaptureAtoms(
    state: Record<string, any>
  ): AtomToRestore[] {
    const atomsToRestore: AtomToRestore[] = [];

    for (const [key, entry] of Object.entries(state)) {
      const findResult = this.atomFinder.find(key, {
        name: entry.name,
        atomId: entry.atomId,
      });

      if (findResult.atom) {
        atomsToRestore.push({
          key,
          entry,
          atom: findResult.atom,
        });
      } else {
        logger.warn(
          `[TransactionalRestorer] Atom not found: ${key} (name: ${entry.name})`
        );
      }
    }

    return atomsToRestore;
  }

  /**
   * Get checkpoint by ID
   * @param checkpointId Checkpoint ID
   * @returns Checkpoint or undefined
   */
  getCheckpoint(checkpointId: string): RestorationCheckpoint | undefined {
    return this.checkpointManager.get(checkpointId);
  }

  /**
   * Get all checkpoints
   * @returns Array of checkpoints
   */
  getCheckpoints(): RestorationCheckpoint[] {
    return this.checkpointManager.getAll();
  }

  /**
   * Get last checkpoint
   * @returns Last checkpoint or null
   */
  getLastCheckpoint(): RestorationCheckpoint | null {
    return this.checkpointManager.getLast();
  }

  /**
   * Clear all checkpoints
   */
  clearCheckpoints(): void {
    this.checkpointManager.clear();
  }

  /**
   * Get active checkpoint ID
   */
  getActiveCheckpointId(): string | null {
    return this.checkpointManager.getActiveCheckpointId();
  }

  /**
   * Get configuration
   */
  getConfig(): TransactionalRestorerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<TransactionalRestorerConfig>): void {
    this.config = { ...this.config, ...config };

    // Update component configurations
    this.checkpointManager.configure({
      maxCheckpoints: config.maxCheckpoints,
      checkpointTimeout: config.checkpointTimeout,
    });

    this.applier.configure({
      batchSize: config.batchSize,
      timeout: config.timeout,
      onError: config.onError === 'throw' ? 'throw' : 'continue',
    });
  }

  /**
   * Get the checkpoint manager
   */
  getCheckpointManager(): CheckpointManager {
    return this.checkpointManager;
  }

  /**
   * Get the rollback engine
   */
  getRollbackEngine(): RollbackEngine {
    return this.rollbackEngine;
  }

  /**
   * Get the validator
   */
  getValidator(): TransactionValidator {
    return this.validator;
  }

  /**
   * Get the restoration applier
   */
  getApplier(): RestorationApplier {
    return this.applier;
  }

  /**
   * Get the atom finder
   */
  getAtomFinder(): AtomFinder {
    return this.atomFinder;
  }

  /**
   * Get active transactions count
   */
  getActiveTransactionsCount(): number {
    return this.activeTransactions.size;
  }
}
