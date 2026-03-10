/**
 * RollbackEngine - Handles rollback operations to checkpoints
 *
 * Responsible for restoring previous atom values from checkpoints
 * when a transaction needs to be rolled back.
 */

import type { Atom, Store } from '../../types';
import type { RestorationCheckpoint, RollbackResult } from './types';
import { atomRegistry } from '../../atom-registry';
import { storeLogger as logger } from '../../debug';

export interface RollbackConfig {
  /** Continue rollback on individual atom errors */
  continueOnError: boolean;
}

/**
 * RollbackEngine provides rollback functionality
 * for transactional restoration operations
 */
export class RollbackEngine {
  private store: Store;
  private config: RollbackConfig;

  constructor(store: Store, config?: Partial<RollbackConfig>) {
    this.store = store;
    this.config = {
      continueOnError: config?.continueOnError ?? true,
    };
  }

  /**
   * Rollback to a checkpoint
   * @param checkpoint Checkpoint to rollback to
   * @returns Rollback result
   */
  rollback(checkpoint: RestorationCheckpoint): RollbackResult {
    const startTime = Date.now();
    const failedAtoms: Array<{
      name: string;
      atomId: symbol;
      error: string;
    }> = [];
    let rolledBackCount = 0;
    let failedCount = 0;

    logger.log(
      `[RollbackEngine] Starting rollback for checkpoint: ${checkpoint.id}`
    );

    // Restore previous values in reverse order
    const reversedAtoms = Array.from(
      checkpoint.previousValues.entries()
    ).reverse();

    for (const [atomId, previousValue] of reversedAtoms) {
      try {
        const atom = this.findAtomBySymbol(atomId);
        if (atom) {
          this.store.set(atom, previousValue);
          rolledBackCount++;
          logger.log(
            `[RollbackEngine] Rolled back atom: ${atom.name} to previous value`
          );
        } else {
          failedCount++;
          failedAtoms.push({
            name: `atom-${atomId.description}`,
            atomId,
            error: 'Atom not found in registry',
          });
          logger.warn(
            `[RollbackEngine] Atom not found for rollback: ${atomId.toString()}`
          );
        }
      } catch (error) {
        failedCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        failedAtoms.push({
          name: `atom-${atomId.description}`,
          atomId,
          error: errorMsg,
        });
        logger.error(
          `[RollbackEngine] Failed to rollback atom ${atomId.toString()}:`,
          error
        );

        // Continue with other rollbacks if configured
        if (!this.config.continueOnError) {
          break;
        }
      }
    }

    const duration = Date.now() - startTime;

    logger.log(
      `[RollbackEngine] Rollback completed: ${rolledBackCount} atoms restored, ${failedCount} failed`
    );

    return {
      success: failedCount === 0,
      checkpointId: checkpoint.id,
      rolledBackCount,
      failedCount,
      failedAtoms,
      timestamp: startTime,
      error:
        failedCount > 0 ? `Failed to rollback ${failedCount} atoms` : undefined,
    };
  }

  /**
   * Rollback multiple checkpoints
   * @param checkpoints Checkpoints to rollback
   * @returns Array of rollback results
   */
  rollbackMultiple(checkpoints: RestorationCheckpoint[]): RollbackResult[] {
    return checkpoints.map((checkpoint) => this.rollback(checkpoint));
  }

  /**
   * Find atom by symbol ID
   * @param atomId Atom symbol ID
   * @returns Atom or null
   */
  private findAtomBySymbol(atomId: symbol): Atom<unknown> | null {
    const allAtoms = atomRegistry.getAll() as Map<symbol, Atom<unknown>>;
    return allAtoms.get(atomId) || null;
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<RollbackConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RollbackConfig {
    return { ...this.config };
  }
}
