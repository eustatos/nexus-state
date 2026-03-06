/**
 * AtomAccessService - Service for atom access tracking
 *
 * Handles recordAccess, subscriber management, and reference counting.
 */

import type { Atom } from '../../types';
import type { TrackedAtom } from './types';
import type { ReferenceCounter } from './ReferenceCounter';
import type { TTLManager } from './TTLManager';
import type { TrackingEventManager } from './TrackingEventManager';

export interface AccessResult {
  /** Whether operation was successful */
  success: boolean;
  /** Access count */
  accessCount?: number;
  /** Subscriber count */
  subscriberCount?: number;
  /** Error message (if failed) */
  error?: string;
}

/**
 * AtomAccessService provides atom access tracking
 */
export class AtomAccessService {
  private refCounter: ReferenceCounter;
  private ttlManager: TTLManager;
  private eventManager: TrackingEventManager;

  constructor(
    refCounter: ReferenceCounter,
    ttlManager: TTLManager,
    eventManager: TrackingEventManager
  ) {
    this.refCounter = refCounter;
    this.ttlManager = ttlManager;
    this.eventManager = eventManager;
  }

  /**
   * Record atom access
   * @param atom Atom that was accessed
   * @param trackedAtom Tracked atom data
   * @param subscriberId Optional subscriber ID
   */
  recordAccess<Value>(
    atom: Atom<Value>,
    trackedAtom: TrackedAtom,
    subscriberId?: string
  ): void {
    // Update TTL
    this.ttlManager.resetAccessTime(trackedAtom);

    // Record access
    this.refCounter.recordAccess(trackedAtom);

    // Add subscriber if provided
    if (subscriberId) {
      this.refCounter.addSubscriber(trackedAtom, subscriberId);
    }

    // Emit event
    this.eventManager.emitAtomAccessed(trackedAtom);
  }

  /**
   * Remove subscriber from atom
   * @param atom Atom
   * @param trackedAtom Tracked atom data
   * @param subscriberId Subscriber ID
   * @returns True if removed successfully
   */
  removeSubscriber<Value>(
    atom: Atom<Value>,
    trackedAtom: TrackedAtom,
    subscriberId: string
  ): boolean {
    return this.refCounter.removeSubscriber(trackedAtom, subscriberId);
  }

  /**
   * Get subscriber count for atom
   * @param trackedAtom Tracked atom
   * @returns Subscriber count
   */
  getSubscriberCount(trackedAtom: TrackedAtom): number {
    return this.refCounter.getSubscriberCount(trackedAtom);
  }

  /**
   * Get access count for atom
   * @param trackedAtom Tracked atom
   * @returns Access count
   */
  getAccessCount(trackedAtom: TrackedAtom): number {
    return this.refCounter.getAccessCount(trackedAtom);
  }

  /**
   * Check if atom has subscribers
   * @param trackedAtom Tracked atom
   * @returns True if has subscribers
   */
  hasSubscribers(trackedAtom: TrackedAtom): boolean {
    return this.refCounter.hasSubscribers(trackedAtom);
  }

  /**
   * Get atoms with no subscribers
   * @param atoms Atoms to check
   * @returns Array of atoms with no subscribers
   */
  getAtomsWithNoSubscribers(atoms: TrackedAtom[]): TrackedAtom[] {
    return this.refCounter.getAtomsWithNoSubscribers(atoms);
  }

  /**
   * Get reference stats
   * @param atoms Atoms to check
   * @returns Reference stats
   */
  getReferenceStats(atoms: TrackedAtom[]) {
    return this.refCounter.getStats(atoms);
  }

  /**
   * Get reference counter
   */
  getReferenceCounter(): ReferenceCounter {
    return this.refCounter;
  }
}
