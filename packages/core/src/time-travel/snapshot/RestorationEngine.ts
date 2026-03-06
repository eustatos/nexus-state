/**
 * RestorationEngine - Core restoration logic with batching and sequential execution
 */

import type { Atom, Store } from '../../types';
import type { SnapshotStateEntry } from '../types';
import { batcher } from '../../batching';
import { storeLogger as logger } from '../../debug';
import { AtomFinder } from './AtomFinder';
import { ValueDeserializer } from './ValueDeserializer';
import { RestorationProgressTracker } from './RestorationProgressTracker';
import type { RestorationProgress } from './types';

export interface EngineRestorationResult {
  /** Whether restoration was successful */
  success: boolean;
  /** Number of atoms restored */
  restoredCount: number;
  /** Total atoms in snapshot */
  totalAtoms: number;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
  /** Duration in milliseconds */
  duration: number;
  /** List of successfully restored atoms */
  successAtoms: Array<{ name: string; atomId: symbol }>;
  /** List of failed atoms */
  failedAtoms: Array<{ name: string; error: string }>;
}

export interface EngineRestoreOptions {
  /** Batch size (0 = no batching) */
  batchSize?: number;
  /** Progress callback */
  onProgress?: (progress: RestorationProgress) => void;
  /** Skip errors and continue */
  skipErrors?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * RestorationEngine provides core restoration logic
 * with support for batch and sequential execution
 */
export class RestorationEngine {
  private store: Store;
  private atomFinder: AtomFinder;
  private deserializer: ValueDeserializer;
  private progressTracker: RestorationProgressTracker;

  constructor(
    store: Store,
    atomFinder?: AtomFinder,
    deserializer?: ValueDeserializer,
    progressTracker?: RestorationProgressTracker
  ) {
    this.store = store;
    this.atomFinder = atomFinder || new AtomFinder();
    this.deserializer = deserializer || new ValueDeserializer();
    this.progressTracker = progressTracker || new RestorationProgressTracker();
  }

  /**
   * Restore from snapshot state
   * @param state Snapshot state object
   * @param options Restoration options
   * @returns Restoration result
   */
  restore(
    state: Record<string, SnapshotStateEntry>,
    options?: EngineRestoreOptions
  ): EngineRestorationResult {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const successAtoms: Array<{ name: string; atomId: symbol }> = [];
    const failedAtoms: Array<{ name: string; error: string }> = [];
    let restoredCount = 0;

    const batchSize = options?.batchSize ?? 0;

    try {
      // Start progress tracking
      this.progressTracker.start(Object.keys(state).length, false);

      if (batchSize > 0) {
        // Batch restoration
        const entries = Object.entries(state);
        for (let i = 0; i < entries.length; i += batchSize) {
          const batch = entries.slice(i, i + batchSize);
          const batchResult = this.restoreBatchInternal(
            batch,
            i,
            options
          );

          restoredCount += batchResult.restoredCount;
          successAtoms.push(...batchResult.successAtoms);
          failedAtoms.push(...batchResult.failedAtoms);
          errors.push(...batchResult.errors);
          warnings.push(...batchResult.warnings);

          // Check for timeout
          if (
            options?.timeout &&
            Date.now() - startTime > options.timeout
          ) {
            warnings.push('Restoration timed out');
            break;
          }

          // Check if we should stop on error
          if (!options?.skipErrors && errors.length > 0) {
            break;
          }
        }
      } else {
        // Sequential restoration
        const result = this.restoreSequentialInternal(state, options);
        restoredCount = result.restoredCount;
        successAtoms.push(...result.successAtoms);
        failedAtoms.push(...result.failedAtoms);
        errors.push(...result.errors);
        warnings.push(...result.warnings);
      }

      // Flush batched notifications
      batcher.flush();

      // Complete progress tracking
      this.progressTracker.complete();

      return {
        success: errors.length === 0,
        restoredCount,
        totalAtoms: Object.keys(state).length,
        errors,
        warnings,
        duration: Date.now() - startTime,
        successAtoms,
        failedAtoms,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push(`Restoration failed: ${errorMessage}`);

      this.progressTracker.complete();

      return {
        success: false,
        restoredCount,
        totalAtoms: Object.keys(state).length,
        errors,
        warnings,
        duration: Date.now() - startTime,
        successAtoms,
        failedAtoms,
      };
    }
  }

  /**
   * Restore a single atom
   * @param key Atom key
   * @param entry Snapshot state entry
   * @param atomIndex Atom index for progress tracking
   * @returns True if restored successfully
   */
  restoreAtom(
    key: string,
    entry: SnapshotStateEntry,
    atomIndex?: number
  ): boolean {
    logger.log(
      `[RestorationEngine] Restoring atom: ${key}, entry.name=${entry.name}`
    );

    // Find atom
    const findResult = this.atomFinder.find(key, {
      name: entry.name,
      atomId: entry.atomId,
    });

    if (!findResult.atom) {
      logger.warn(`[RestorationEngine] Atom not found: ${key}`);
      return false;
    }

    const atom = findResult.atom;

    // Deserialize value
    const value = this.deserializer.deserialize(entry.value, entry.type);

    logger.log(
      `[RestorationEngine] Restoring ${entry.name}: ${value}, found by: ${findResult.foundBy}`
    );

    // Set the value
    this.store.set(atom, value);

    // Update progress
    if (atomIndex !== undefined) {
      this.progressTracker.update(
        atomIndex,
        entry.name || key,
        atom.id
      );
    }

    logger.log(
      `[RestorationEngine] Set complete for ${entry.name}, new value: ${this.store.get(atom)}`
    );

    return true;
  }

  /**
   * Get the progress tracker
   */
  getProgressTracker(): RestorationProgressTracker {
    return this.progressTracker;
  }

  /**
   * Get the atom finder
   */
  getAtomFinder(): AtomFinder {
    return this.atomFinder;
  }

  /**
   * Get the deserializer
   */
  getDeserializer(): ValueDeserializer {
    return this.deserializer;
  }

  /**
   * Restore batch internally
   */
  private restoreBatchInternal(
    entries: Array<[string, SnapshotStateEntry]>,
    startIndex: number,
    options?: EngineRestoreOptions
  ): {
    restoredCount: number;
    successAtoms: Array<{ name: string; atomId: symbol }>;
    failedAtoms: Array<{ name: string; error: string }>;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const successAtoms: Array<{ name: string; atomId: symbol }> = [];
    const failedAtoms: Array<{ name: string; error: string }> = [];
    let restoredCount = 0;

    for (let i = 0; i < entries.length; i++) {
      const [key, entry] = entries[i];
      const atomIndex = startIndex + i;

      try {
        const success = this.restoreAtom(key, entry, atomIndex);
        if (success) {
          restoredCount++;
          successAtoms.push({
            name: entry.name || key,
            atomId: this.atomFinder.find(key, entry).atom!.id,
          });
        } else {
          failedAtoms.push({
            name: entry.name || key,
            error: 'Atom not found',
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to restore atom ${key}: ${errorMsg}`);
        failedAtoms.push({
          name: entry.name || key,
          error: errorMsg,
        });

        if (!options?.skipErrors) {
          break;
        }
      }
    }

    // Flush after batch
    batcher.flush();

    return {
      restoredCount,
      successAtoms,
      failedAtoms,
      errors,
      warnings,
    };
  }

  /**
   * Restore sequentially internally
   */
  private restoreSequentialInternal(
    state: Record<string, SnapshotStateEntry>,
    options?: EngineRestoreOptions
  ): {
    restoredCount: number;
    successAtoms: Array<{ name: string; atomId: symbol }>;
    failedAtoms: Array<{ name: string; error: string }>;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const successAtoms: Array<{ name: string; atomId: symbol }> = [];
    const failedAtoms: Array<{ name: string; error: string }> = [];
    let restoredCount = 0;

    const entries = Object.entries(state);

    // First pass: restore primitives
    entries.forEach(([key, entry], index) => {
      if (entry.type === 'primitive') {
        try {
          const success = this.restoreAtom(key, entry, index);
          if (success) {
            restoredCount++;
            successAtoms.push({
              name: entry.name || key,
              atomId: this.atomFinder.find(key, entry).atom!.id,
            });
          } else {
            failedAtoms.push({
              name: entry.name || key,
              error: 'Atom not found',
            });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to restore atom ${key}: ${errorMsg}`);
          failedAtoms.push({
            name: entry.name || key,
            error: errorMsg,
          });
        }
      }
    });

    // Second pass: restore computed/writable
    entries.forEach(([key, entry], index) => {
      if (entry.type !== 'primitive') {
        try {
          const success = this.restoreAtom(key, entry, index);
          if (success) {
            restoredCount++;
            successAtoms.push({
              name: entry.name || key,
              atomId: this.atomFinder.find(key, entry).atom!.id,
            });
          } else {
            failedAtoms.push({
              name: entry.name || key,
              error: 'Atom not found',
            });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to restore atom ${key}: ${errorMsg}`);
          failedAtoms.push({
            name: entry.name || key,
            error: errorMsg,
          });
        }
      }
    });

    // Flush after sequential restoration
    batcher.flush();

    return {
      restoredCount,
      successAtoms,
      failedAtoms,
      errors,
      warnings,
    };
  }
}
