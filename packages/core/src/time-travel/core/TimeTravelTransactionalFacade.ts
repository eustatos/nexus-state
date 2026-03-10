/**
 * TimeTravelTransactionalFacade - Facade for transactional operations
 *
 * Responsibilities:
 * - Restore with transaction
 * - Rollback to checkpoint
 * - Get checkpoints
 * - Import state
 */

import type {
  Snapshot,
  RestorationOptions,
  TransactionalRestorationResult,
  RollbackResult,
  RestorationCheckpoint,
} from '../../types';
import type { SnapshotService } from './SnapshotService';
import type { HistoryService } from './HistoryService';
import { storeLogger as logger } from '../../debug';

export class TimeTravelTransactionalFacade {
  private snapshotService: SnapshotService;
  private historyService: HistoryService;

  constructor(
    snapshotService: SnapshotService,
    historyService: HistoryService
  ) {
    this.snapshotService = snapshotService;
    this.historyService = historyService;
  }

  /**
   * Restore state from snapshot with transaction support
   */
  async restoreWithTransaction(
    snapshotId: string,
    options?: RestorationOptions
  ): Promise<TransactionalRestorationResult> {
    // Get snapshot by ID from history
    const snapshot = this.historyService.getById(snapshotId);

    if (!snapshot) {
      logger.warn(`[TimeTravelTransactionalFacade] Snapshot not found: ${snapshotId}`);
      return {
        success: false,
        restoredCount: 0,
        totalAtoms: 0,
        errors: [`Snapshot with ID ${snapshotId} not found`],
        warnings: [],
        duration: 0,
        timestamp: Date.now(),
      };
    }

    logger.log(`[TimeTravelTransactionalFacade] Restoring snapshot: ${snapshotId}`);
    return this.snapshotService.restoreWithTransaction(snapshot, options);
  }

  /**
   * Get last checkpoint
   */
  getLastCheckpoint(): RestorationCheckpoint | null {
    return this.snapshotService.getRestorer().getLastCheckpoint();
  }

  /**
   * Rollback to checkpoint
   */
  async rollbackToCheckpoint(checkpointId: string): Promise<RollbackResult> {
    return this.snapshotService.getRestorer().rollback(checkpointId);
  }

  /**
   * Get all checkpoints
   */
  getCheckpoints(): RestorationCheckpoint[] {
    return this.snapshotService.getRestorer().getCheckpoints();
  }

  /**
   * Import state from external source
   */
  importState(state: Record<string, unknown>): boolean {
    // Create a snapshot from the state
    const snapshot: Snapshot = {
      id: `imported-${Date.now()}`,
      state: state as any,
      metadata: {
        timestamp: Date.now(),
        action: 'import',
        atomCount: Object.keys(state).length,
      },
    };

    logger.log(`[TimeTravelTransactionalFacade] Importing state with ${Object.keys(state).length} atoms`);
    return this.snapshotService.getRestorer().restore(snapshot);
  }

  /**
   * Manual rollback (alias for rollbackToCheckpoint)
   */
  async rollback(checkpointId: string): Promise<RollbackResult> {
    return this.rollbackToCheckpoint(checkpointId);
  }
}
