/**
 * SnapshotRestorer - Restores state from snapshots (Facade pattern)
 *
 * This class is a facade that delegates restoration work to specialized components:
 * - SnapshotValidator: Validates snapshots
 * - AtomFinder: Finds atoms in the registry
 * - ValueDeserializer: Deserializes values based on type
 * - RestorationEngine: Core restoration logic
 * - TransactionalRestorer: Transactional restoration with checkpoints
 * - RestorationConfigManager: Configuration management
 * - RestorationProgressTracker: Progress tracking
 */

import type { Snapshot } from '../types';
import type { Store } from '../../types';
import type {
  SnapshotRestorerConfig,
  TransactionalRestorerConfig,
  RestorationConfig as RestorationConfigType,
  RestorationResult,
  RestorationCheckpoint,
  CheckpointResult,
  RollbackResult,
  TransactionalRestorationResult,
  RestorationOptions,
} from './types';
import { SnapshotValidator } from './SnapshotValidator';
import { AtomFinder } from './AtomFinder';
import { ValueDeserializer } from './ValueDeserializer';
import { RestorationEngine } from './RestorationEngine';
import { TransactionalRestorer } from './TransactionalRestorer';
import { RestorationConfigManager } from './RestorationConfig';
import { RestorationProgressTracker } from './RestorationProgressTracker';
import { BaseDisposable, type DisposableConfig } from '../core/disposable';
import { batcher } from '../../batching';
import { storeLogger as logger } from '../../debug';

export class SnapshotRestorer extends BaseDisposable {
  // Core components
  private validator: SnapshotValidator;
  private atomFinder: AtomFinder;
  private deserializer: ValueDeserializer;
  private engine: RestorationEngine;
  private transactionalRestorer: TransactionalRestorer;
  private configManager: RestorationConfigManager;
  private progressTracker: RestorationProgressTracker;

  // State
  private listeners: Set<(snapshot: Snapshot) => void> = new Set();
  private restoreInProgress: boolean = false;

  constructor(
    store: Store,
    config?: Partial<SnapshotRestorerConfig> &
      Partial<TransactionalRestorerConfig> &
      Partial<RestorationConfigType>,
    disposalConfig?: DisposableConfig
  ) {
    super(disposalConfig);

    // Initialize configuration manager
    this.configManager = new RestorationConfigManager(
      config,
      config,
      config
    );

    // Initialize components with shared dependencies
    this.atomFinder = new AtomFinder();
    this.deserializer = new ValueDeserializer();
    this.progressTracker = new RestorationProgressTracker();

    this.validator = new SnapshotValidator();

    this.engine = new RestorationEngine(
      store,
      this.atomFinder,
      this.deserializer,
      this.progressTracker
    );

    this.transactionalRestorer = new TransactionalRestorer(
      store,
      config,
      this.atomFinder,
      this.deserializer
    );
  }

  /**
   * Restore from snapshot (simple mode)
   * @param snapshot Snapshot to restore
   * @returns True if restoration was successful
   */
  restore(snapshot: Snapshot): boolean {
    if (this.restoreInProgress) {
      throw new Error('Restore already in progress');
    }

    this.restoreInProgress = true;

    try {
      const snapshotConfig = this.configManager.getSnapshotConfig();

      // Validate if configured
      if (snapshotConfig.validateBeforeRestore) {
        const validation = this.validator.validate(snapshot);
        if (!validation.isValid) {
          logger.warn(
            'Snapshot validation failed:',
            validation.errors.join(', ')
          );
          if (snapshotConfig.strictMode) {
            return false;
          }
        }
      }

      // Apply transforms
      const snapshotToRestore = snapshotConfig.transform
        ? snapshotConfig.transform(snapshot)
        : snapshot;

      // Restore state using engine
      const result = this.engine.restore(snapshotToRestore.state, {
        batchSize: snapshotConfig.batchRestore
          ? this.configManager.getRestorationConfig().batchSize
          : 0,
        skipErrors: snapshotConfig.skipErrors,
      });

      if (!result.success && snapshotConfig.strictMode) {
        logger.error('Restoration failed:', result.errors.join(', '));
        return false;
      }

      // Emit restore event
      this.emit('restore', snapshotToRestore);
      return true;
    } catch (error) {
      logger.error('Failed to restore snapshot:', error);
      return false;
    } finally {
      this.restoreInProgress = false;
    }
  }

  /**
   * Restore with detailed result
   * @param snapshot Snapshot to restore
   * @returns Restoration result with metadata
   */
  restoreWithResult(snapshot: Snapshot): RestorationResult {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (this.restoreInProgress) {
      return {
        success: false,
        restoredCount: 0,
        totalAtoms: 0,
        errors: ['Restore already in progress'],
        warnings: [],
        duration: Date.now() - startTime,
        timestamp: startTime,
      };
    }

    this.restoreInProgress = true;

    try {
      const snapshotConfig = this.configManager.getSnapshotConfig();

      // Validate
      if (snapshotConfig.validateBeforeRestore) {
        const validation = this.validator.validate(snapshot);
        if (!validation.isValid) {
          errors.push(...validation.errors);
          warnings.push(...validation.warnings);

          if (snapshotConfig.strictMode) {
            return {
              success: false,
              restoredCount: 0,
              totalAtoms: Object.keys(snapshot.state).length,
              errors,
              warnings,
              duration: Date.now() - startTime,
              timestamp: startTime,
            };
          }
        }
      }

      // Apply transforms
      const snapshotToRestore = snapshotConfig.transform
        ? snapshotConfig.transform(snapshot)
        : snapshot;

      // Restore using engine
      const result = this.engine.restore(snapshotToRestore.state, {
        batchSize: snapshotConfig.batchRestore
          ? this.configManager.getRestorationConfig().batchSize
          : 0,
        skipErrors: snapshotConfig.skipErrors,
      });

      errors.push(...result.errors);
      warnings.push(...result.warnings);

      const success =
        result.success || (!snapshotConfig.strictMode && errors.length === 0);

      if (success) {
        this.emit('restore', snapshot);
      }

      return {
        success,
        restoredCount: result.restoredCount,
        totalAtoms: result.totalAtoms,
        errors,
        warnings,
        duration: Date.now() - startTime,
        timestamp: startTime,
        failedAtoms: result.failedAtoms,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        restoredCount: 0,
        totalAtoms: Object.keys(snapshot.state).length,
        errors: [...errors, errorMessage],
        warnings,
        duration: Date.now() - startTime,
        timestamp: startTime,
      };
    } finally {
      this.restoreInProgress = false;
    }
  }

  /**
   * Restore multiple snapshots in sequence
   * @param snapshots Snapshots to restore
   * @returns Array of restoration results
   */
  restoreSequence(snapshots: Snapshot[]): RestorationResult[] {
    return snapshots.map((snapshot) => this.restoreWithResult(snapshot));
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
    return this.transactionalRestorer.restoreWithTransaction(snapshot, options);
  }

  /**
   * Rollback to a checkpoint
   * @param checkpointId Checkpoint ID
   * @returns Rollback result
   */
  async rollback(checkpointId: string): Promise<RollbackResult> {
    return this.transactionalRestorer.rollback(checkpointId);
  }

  /**
   * Get checkpoint by ID
   * @param checkpointId Checkpoint ID
   * @returns Checkpoint or undefined
   */
  getCheckpoint(checkpointId: string): RestorationCheckpoint | undefined {
    return this.transactionalRestorer.getCheckpoint(checkpointId);
  }

  /**
   * Get all checkpoints
   * @returns Array of checkpoints
   */
  getCheckpoints(): RestorationCheckpoint[] {
    return this.transactionalRestorer.getCheckpoints();
  }

  /**
   * Get last checkpoint
   * @returns Last checkpoint or null
   */
  getLastCheckpoint(): RestorationCheckpoint | null {
    return this.transactionalRestorer.getLastCheckpoint();
  }

  /**
   * Clear all checkpoints
   */
  clearCheckpoints(): void {
    this.transactionalRestorer.clearCheckpoints();
  }

  /**
   * Subscribe to restoration events
   * @param listener Event listener
   * @returns Unsubscribe function
   */
  subscribe(listener: (snapshot: Snapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Check if restore is in progress
   */
  isRestoring(): boolean {
    return this.restoreInProgress;
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(
    config: Partial<SnapshotRestorerConfig> &
      Partial<TransactionalRestorerConfig> &
      Partial<RestorationConfigType>
  ): void {
    this.configManager.updateAll(config);
    this.transactionalRestorer.configure(config);
  }

  /**
   * Get current configuration
   */
  getConfig(): SnapshotRestorerConfig {
    return this.configManager.getSnapshotConfig();
  }

  /**
   * Get transactional configuration
   */
  getTransactionalConfig(): TransactionalRestorerConfig {
    return this.configManager.getTransactionalConfig();
  }

  /**
   * Get restoration configuration
   */
  getRestorationConfig(): RestorationConfigType {
    return this.configManager.getRestorationConfig();
  }

  /**
   * Get the validator component
   */
  getValidator(): SnapshotValidator {
    return this.validator;
  }

  /**
   * Get the atom finder component
   */
  getAtomFinder(): AtomFinder {
    return this.atomFinder;
  }

  /**
   * Get the deserializer component
   */
  getDeserializer(): ValueDeserializer {
    return this.deserializer;
  }

  /**
   * Get the restoration engine
   */
  getEngine(): RestorationEngine {
    return this.engine;
  }

  /**
   * Get the transactional restorer
   */
  getTransactionalRestorer(): TransactionalRestorer {
    return this.transactionalRestorer;
  }

  /**
   * Get the progress tracker
   */
  getProgressTracker(): RestorationProgressTracker {
    return this.progressTracker;
  }

  /**
   * Emit event
   * @param event Event type
   * @param snapshot Snapshot
   */
  private emit(event: 'restore' | 'error', snapshot?: Snapshot): void {
    if (event === 'restore' && snapshot) {
      this.listeners.forEach((listener) => listener(snapshot));
    }
  }

  /**
   * Dispose the snapshot restorer and clean up all resources
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    this.log('Disposing SnapshotRestorer');

    // Clear checkpoints
    this.clearCheckpoints();

    // Clear listeners
    this.listeners.clear();

    // Clear references
    (this.engine as any) = null;
    (this.transactionalRestorer as any) = null;

    // Dispose children
    await this.disposeChildren();

    // Run callbacks
    await this.runDisposeCallbacks();

    this.disposed = true;
    this.log('SnapshotRestorer disposed');
  }
}
