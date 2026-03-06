/**
 * TransactionContext - Encapsulates state for a single restoration transaction
 *
 * Holds the state and context for one transactional restoration operation,
 * including checkpoint ID, atoms to restore, and transaction status.
 */

import type { SnapshotStateEntry } from '../types';
import type { Atom } from '../../types';

export interface TransactionAtom {
  /** Atom key in snapshot */
  key: string;
  /** Snapshot state entry */
  entry: SnapshotStateEntry;
  /** Atom instance */
  atom: Atom<unknown>;
}

export type TransactionStatus = 'pending' | 'in-progress' | 'committed' | 'rolled-back' | 'failed';

export interface TransactionContextState {
  /** Unique transaction ID */
  id: string;
  /** Checkpoint ID */
  checkpointId: string;
  /** Snapshot ID being restored */
  snapshotId: string;
  /** Atoms to restore */
  atoms: TransactionAtom[];
  /** Previous values (captured at transaction start) */
  previousValues: Map<symbol, unknown>;
  /** Transaction status */
  status: TransactionStatus;
  /** Start timestamp */
  startTime: number;
  /** End timestamp (if completed) */
  endTime?: number;
  /** Error message (if failed) */
  error?: string;
}

/**
 * TransactionContext encapsulates the state of a single
 * transactional restoration operation
 */
export class TransactionContext {
  private state: TransactionContextState;

  constructor(
    checkpointId: string,
    snapshotId: string,
    atoms: TransactionAtom[]
  ) {
    this.state = {
      id: this.generateTransactionId(),
      checkpointId,
      snapshotId,
      atoms,
      previousValues: new Map<symbol, unknown>(),
      status: 'pending',
      startTime: Date.now(),
    };
  }

  /**
   * Begin the transaction
   */
  begin(): void {
    this.state.status = 'in-progress';
  }

  /**
   * Capture previous values for atoms
   * @param getCurrentValue Function to get current atom value
   */
  capturePreviousValues(getCurrentValue: (atom: Atom<unknown>) => unknown): void {
    for (const { atom } of this.state.atoms) {
      try {
        const currentValue = getCurrentValue(atom);
        this.state.previousValues.set(atom.id, currentValue);
      } catch (error) {
        console.warn(
          `[TransactionContext] Failed to capture previous value for atom ${atom.name}:`,
          error
        );
      }
    }
  }

  /**
   * Commit the transaction
   */
  commit(): void {
    this.state.status = 'committed';
    this.state.endTime = Date.now();
  }

  /**
   * Rollback the transaction
   */
  rollback(): void {
    this.state.status = 'rolled-back';
    this.state.endTime = Date.now();
  }

  /**
   * Mark transaction as failed
   * @param error Error message
   */
  fail(error: string): void {
    this.state.status = 'failed';
    this.state.error = error;
    this.state.endTime = Date.now();
  }

  /**
   * Get transaction ID
   */
  getId(): string {
    return this.state.id;
  }

  /**
   * Get checkpoint ID
   */
  getCheckpointId(): string {
    return this.state.checkpointId;
  }

  /**
   * Get snapshot ID
   */
  getSnapshotId(): string {
    return this.state.snapshotId;
  }

  /**
   * Get atoms to restore
   */
  getAtoms(): TransactionAtom[] {
    return [...this.state.atoms];
  }

  /**
   * Get previous values
   */
  getPreviousValues(): Map<symbol, unknown> {
    return new Map(this.state.previousValues);
  }

  /**
   * Get transaction status
   */
  getStatus(): TransactionStatus {
    return this.state.status;
  }

  /**
   * Get start timestamp
   */
  getStartTime(): number {
    return this.state.startTime;
  }

  /**
   * Get end timestamp (if completed)
   */
  getEndTime(): number | undefined {
    return this.state.endTime;
  }

  /**
   * Get duration in milliseconds
   */
  getDuration(): number | undefined {
    if (this.state.endTime) {
      return this.state.endTime - this.state.startTime;
    }
    return Date.now() - this.state.startTime;
  }

  /**
   * Get error message (if failed)
   */
  getError(): string | undefined {
    return this.state.error;
  }

  /**
   * Check if transaction is active
   */
  isActive(): boolean {
    return this.state.status === 'pending' || this.state.status === 'in-progress';
  }

  /**
   * Check if transaction is completed
   */
  isCompleted(): boolean {
    return (
      this.state.status === 'committed' ||
      this.state.status === 'rolled-back' ||
      this.state.status === 'failed'
    );
  }

  /**
   * Get transaction state as plain object
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.state.id,
      checkpointId: this.state.checkpointId,
      snapshotId: this.state.snapshotId,
      atomCount: this.state.atoms.length,
      status: this.state.status,
      startTime: this.state.startTime,
      endTime: this.state.endTime,
      duration: this.getDuration(),
      error: this.state.error,
    };
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `tx-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
