/**
 * RestorationApplier - Applies restoration changes to atoms
 *
 * Handles the actual application of snapshot values to atoms,
 * with support for batching and progress tracking.
 */

import type { Atom, Store } from '../../types';
import type { SnapshotStateEntry } from '../types';
import type { RestorationProgress } from './types';
import { ValueDeserializer } from './ValueDeserializer';
import { storeLogger as logger } from '../../debug';

export interface AppliedAtomResult {
  /** Atom name */
  name: string;
  /** Atom ID */
  atomId: symbol;
}

export interface FailedAtomResult {
  /** Atom name */
  name: string;
  /** Atom ID */
  atomId: symbol;
  /** Error message */
  error: string;
  /** Action that failed */
  action: string;
}

export interface RestorationApplierResult {
  /** Whether restoration was successful */
  success: boolean;
  /** Number of atoms restored */
  restoredCount: number;
  /** Total atoms to restore */
  totalAtoms: number;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Duration in milliseconds */
  duration: number;
  /** Successfully restored atoms */
  successAtoms: AppliedAtomResult[];
  /** Failed atoms with details */
  failedAtomDetails: FailedAtomResult[];
  /** Failed atoms (simplified) */
  failedAtoms: Array<{ name: string; error: string }>;
  /** Whether operation was interrupted */
  interrupted: boolean;
}

export interface RestorationApplierConfig {
  /** Batch size (0 = no batching) */
  batchSize: number;
  /** Timeout in milliseconds */
  timeout: number;
  /** Error handling strategy */
  onError: 'rollback' | 'continue' | 'throw';
}

export interface AtomToRestore {
  /** Atom key in snapshot */
  key: string;
  /** Snapshot state entry */
  entry: SnapshotStateEntry;
  /** Atom instance */
  atom: Atom<unknown>;
}

/**
 * RestorationApplier applies snapshot values to atoms
 * with support for batching and progress tracking
 */
export class RestorationApplier {
  private store: Store;
  private deserializer: ValueDeserializer;
  private config: RestorationApplierConfig;

  constructor(
    store: Store,
    deserializer?: ValueDeserializer,
    config?: Partial<RestorationApplierConfig>
  ) {
    this.store = store;
    this.deserializer = deserializer || new ValueDeserializer();
    this.config = {
      batchSize: config?.batchSize ?? 0,
      timeout: config?.timeout ?? 5000,
      onError: config?.onError ?? 'continue',
    };
  }

  /**
   * Apply restoration changes to atoms
   * @param atomsToRestore Atoms to restore
   * @param onProgress Progress callback
   * @returns Restoration result
   */
  apply(
    atomsToRestore: AtomToRestore[],
    onProgress?: (progress: RestorationProgress) => void
  ): RestorationApplierResult {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const successAtoms: AppliedAtomResult[] = [];
    const failedAtomDetails: FailedAtomResult[] = [];
    let restoredCount = 0;
    let interrupted = false;

    logger.log(
      `[RestorationApplier] Starting restoration of ${atomsToRestore.length} atoms`
    );

    const batchSize = this.config.batchSize > 0 ? this.config.batchSize : 0;

    if (batchSize > 0) {
      // Process in batches
      for (let i = 0; i < atomsToRestore.length; i += batchSize) {
        if (interrupted) break;

        const batch = atomsToRestore.slice(i, i + batchSize);
        const batchResult = this.applyBatch(batch, i, onProgress);

        successAtoms.push(...batchResult.successAtoms);
        failedAtomDetails.push(...batchResult.failedAtomDetails);
        restoredCount += batchResult.restoredCount;
        errors.push(...batchResult.errors);
        warnings.push(...batchResult.warnings);

        if (batchResult.interrupted) {
          interrupted = true;
        }

        // Check timeout
        if (
          this.config.timeout > 0 &&
          Date.now() - startTime > this.config.timeout
        ) {
          warnings.push('Restoration timed out');
          interrupted = true;
          break;
        }
      }
    } else {
      // Process all at once
      const result = this.applyBatch(atomsToRestore, 0, onProgress);
      successAtoms.push(...result.successAtoms);
      failedAtomDetails.push(...result.failedAtomDetails);
      restoredCount = result.restoredCount;
      errors.push(...result.errors);
      warnings.push(...result.warnings);
      interrupted = result.interrupted;
    }

    const duration = Date.now() - startTime;

    logger.log(
      `[RestorationApplier] Restoration completed: ${restoredCount}/${atomsToRestore.length} atoms restored`
    );

    return {
      success: errors.length === 0,
      restoredCount,
      totalAtoms: atomsToRestore.length,
      errors,
      warnings,
      duration,
      successAtoms,
      failedAtomDetails,
      failedAtoms: failedAtomDetails.map((item) => ({
        name: item.name,
        error: item.error,
      })),
      interrupted,
    };
  }

  /**
   * Apply a batch of atoms
   * @param atomsToRestore Atoms to restore
   * @param startIndex Start index for progress
   * @param onProgress Progress callback
   * @returns Batch restoration result
   */
  private applyBatch(
    atomsToRestore: AtomToRestore[],
    startIndex: number,
    onProgress?: (progress: RestorationProgress) => void
  ): {
    restoredCount: number;
    successAtoms: AppliedAtomResult[];
    failedAtomDetails: FailedAtomResult[];
    errors: string[];
    warnings: string[];
    interrupted: boolean;
  } {
    let restoredCount = 0;
    const successAtoms: AppliedAtomResult[] = [];
    const failedAtomDetails: FailedAtomResult[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let interrupted = false;

    for (let i = 0; i < atomsToRestore.length; i++) {
      if (interrupted) break;

      const { key, entry, atom } = atomsToRestore[i];
      const atomIndex = startIndex + i;

      // Report progress
      if (onProgress) {
        onProgress({
          currentIndex: atomIndex,
          totalAtoms: startIndex + atomsToRestore.length,
          currentAtomName: entry.name || key,
          currentAtomId: atom.id,
          isRollback: false,
          timestamp: Date.now(),
        });
      }

      try {
        // Deserialize value if needed
        const value = this.deserializer.deserialize(entry.value, entry.type);

        // Set the value
        this.store.set(atom, value);

        restoredCount++;
        successAtoms.push({
          name: entry.name || key,
          atomId: atom.id,
        });

        logger.log(
          `[RestorationApplier] Restored atom: ${entry.name || key} = ${value}`
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to restore atom ${key}: ${errorMsg}`);
        failedAtomDetails.push({
          name: entry.name || key,
          atomId: atom.id,
          error: errorMsg,
          action: 'restore',
        });
        logger.error(
          `[RestorationApplier] Failed to restore atom ${key}:`,
          error
        );

        if (this.config.onError === 'throw') {
          interrupted = true;
          break;
        }
      }
    }

    return {
      restoredCount,
      successAtoms,
      failedAtomDetails,
      errors,
      warnings,
      interrupted,
    };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<RestorationApplierConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RestorationApplierConfig {
    return { ...this.config };
  }

  /**
   * Get the deserializer
   */
  getDeserializer(): ValueDeserializer {
    return this.deserializer;
  }
}
