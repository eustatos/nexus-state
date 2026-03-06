/**
 * RestorationProgressTracker - Tracks restoration progress and notifies listeners
 */

import type { RestorationProgress } from './types';

export type ProgressListener = (progress: RestorationProgress) => void;

export interface TrackerState {
  /** Whether tracking is in progress */
  inProgress: boolean;
  /** Current atom index */
  currentIndex: number;
  /** Total atoms to restore */
  totalAtoms: number;
  /** Current atom name */
  currentAtomName: string;
  /** Current atom ID */
  currentAtomId?: symbol;
  /** Whether this is a rollback operation */
  isRollback: boolean;
  /** Start timestamp */
  startTime: number;
  /** Last update timestamp */
  lastUpdateTime: number;
}

/**
 * RestorationProgressTracker provides functionality to track
 * restoration progress and notify listeners about updates
 */
export class RestorationProgressTracker {
  private listeners: Set<ProgressListener> = new Set();
  private state: TrackerState | null = null;

  /**
   * Start tracking restoration progress
   * @param totalAtoms Total number of atoms to restore
   * @param isRollback Whether this is a rollback operation
   */
  start(totalAtoms: number, isRollback: boolean = false): void {
    const now = Date.now();
    this.state = {
      inProgress: true,
      currentIndex: 0,
      totalAtoms,
      currentAtomName: '',
      isRollback,
      startTime: now,
      lastUpdateTime: now,
    };
  }

  /**
   * Update progress for current atom
   * @param currentIndex Current atom index
   * @param atomName Current atom name
   * @param atomId Current atom ID (optional)
   */
  update(
    currentIndex: number,
    atomName: string,
    atomId?: symbol
  ): void {
    if (!this.state) {
      console.warn(
        '[RestorationProgressTracker] update() called before start()'
      );
      return;
    }

    const now = Date.now();
    this.state.currentIndex = currentIndex;
    this.state.currentAtomName = atomName;
    this.state.currentAtomId = atomId;
    this.state.lastUpdateTime = now;

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Mark tracking as complete
   */
  complete(): void {
    if (!this.state) {
      console.warn(
        '[RestorationProgressTracker] complete() called before start()'
      );
      return;
    }

    this.state.inProgress = false;
    this.notifyListeners();
  }

  /**
   * Reset tracker state
   */
  reset(): void {
    this.state = null;
  }

  /**
   * Subscribe to progress updates
   * @param listener Progress listener function
   * @returns Unsubscribe function
   */
  subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current progress state
   * @returns Current tracker state or null if not tracking
   */
  getState(): TrackerState | null {
    return this.state;
  }

  /**
   * Get current progress as RestorationProgress object
   * @returns Current progress or null if not tracking
   */
  getProgress(): RestorationProgress | null {
    if (!this.state) {
      return null;
    }

    return {
      currentIndex: this.state.currentIndex,
      totalAtoms: this.state.totalAtoms,
      currentAtomName: this.state.currentAtomName,
      currentAtomId: this.state.currentAtomId,
      isRollback: this.state.isRollback,
      timestamp: this.state.lastUpdateTime,
    };
  }

  /**
   * Check if tracking is in progress
   * @returns True if tracking is active
   */
  isInProgress(): boolean {
    return this.state?.inProgress ?? false;
  }

  /**
   * Get progress percentage (0-100)
   * @returns Progress percentage or null if not tracking
   */
  getPercentage(): number | null {
    if (!this.state || this.state.totalAtoms === 0) {
      return null;
    }
    return Math.round(
      (this.state.currentIndex / this.state.totalAtoms) * 100
    );
  }

  /**
   * Get elapsed time in milliseconds
   * @returns Elapsed time or null if not tracking
   */
  getElapsedTime(): number | null {
    if (!this.state) {
      return null;
    }
    return Date.now() - this.state.startTime;
  }

  /**
   * Get estimated remaining time in milliseconds
   * @returns Estimated remaining time or null if not tracking
   */
  getEstimatedRemainingTime(): number | null {
    if (!this.state || this.state.currentIndex === 0) {
      return null;
    }

    const elapsed = Date.now() - this.state.startTime;
    const avgTimePerAtom = elapsed / this.state.currentIndex;
    const remainingAtoms = this.state.totalAtoms - this.state.currentIndex;

    return Math.round(avgTimePerAtom * remainingAtoms);
  }

  /**
   * Notify all listeners about current progress
   */
  private notifyListeners(): void {
    if (!this.state) {
      return;
    }

    const progress: RestorationProgress = {
      currentIndex: this.state.currentIndex,
      totalAtoms: this.state.totalAtoms,
      currentAtomName: this.state.currentAtomName,
      currentAtomId: this.state.currentAtomId,
      isRollback: this.state.isRollback,
      timestamp: this.state.lastUpdateTime,
    };

    this.listeners.forEach((listener) => {
      try {
        listener(progress);
      } catch (error) {
        console.error(
          '[RestorationProgressTracker] Listener error:',
          error
        );
      }
    });
  }

  /**
   * Get number of subscribed listeners
   * @returns Number of listeners
   */
  getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Clear all listeners
   */
  clearListeners(): void {
    this.listeners.clear();
  }
}
