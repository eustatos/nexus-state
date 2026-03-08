/**
 * ReferenceCounter - Manages reference counts and subscribers for atoms
 *
 * Tracks atom access, subscriber counts, and reference information.
 */

import type { TrackedAtom } from './types';

export interface SubscriberInfo {
  /** Subscriber ID */
  id: string;
  /** Subscriber type */
  type: 'component' | 'effect' | 'manual' | 'unknown';
  /** Subscription timestamp */
  subscribedAt: number;
  /** Last access timestamp */
  lastAccess: number;
}

export interface ReferenceStats {
  /** Total references */
  totalReferences: number;
  /** Total subscribers */
  totalSubscribers: number;
  /** Average subscribers per atom */
  averageSubscribers: number;
  /** Atoms with no subscribers */
  atomsWithNoSubscribers: number;
}

/**
 * ReferenceCounter provides reference counting
 * for tracked atoms
 */
export class ReferenceCounter {
  private accessCounts: Map<symbol, number> = new Map();
  private subscriberInfo: Map<symbol, Map<string, SubscriberInfo>> = new Map();

  /**
   * Record atom access
   * @param atom Atom that was accessed
   */
  recordAccess(atom: TrackedAtom): void {
    // Update atom's last access timestamp
    atom.lastAccessedAt = Date.now();

    // Increment access count
    const count = this.accessCounts.get(atom.id) || 0;
    this.accessCounts.set(atom.id, count + 1);
  }

  /**
   * Add subscriber to atom
   * @param atom Atom to subscribe to
   * @param subscriberId Subscriber ID
   * @param type Subscriber type
   */
  addSubscriber(
    atom: TrackedAtom,
    subscriberId: string,
    type: 'component' | 'effect' | 'manual' | 'unknown' = 'unknown'
  ): void {
    // Initialize subscribers set if needed
    if (!atom.subscribers) {
      atom.subscribers = new Set();
    }

    // Add subscriber
    atom.subscribers.add(subscriberId);

    // Track subscriber info
    if (!this.subscriberInfo.has(atom.id)) {
      this.subscriberInfo.set(atom.id, new Map());
    }

    const now = Date.now();
    this.subscriberInfo.get(atom.id)!.set(subscriberId, {
      id: subscriberId,
      type,
      subscribedAt: now,
      lastAccess: now,
    });
  }

  /**
   * Remove subscriber from atom
   * @param atom Atom to unsubscribe from
   * @param subscriberId Subscriber ID
   * @returns True if removed successfully
   */
  removeSubscriber(atom: TrackedAtom, subscriberId: string): boolean {
    if (!atom.subscribers) {
      return false;
    }

    const removed = atom.subscribers.delete(subscriberId);

    // Remove subscriber info
    const infoMap = this.subscriberInfo.get(atom.id);
    if (infoMap) {
      infoMap.delete(subscriberId);
      if (infoMap.size === 0) {
        this.subscriberInfo.delete(atom.id);
      }
    }

    return removed;
  }

  /**
   * Get subscriber count for atom
   * @param atom Atom to check
   * @returns Subscriber count
   */
  getSubscriberCount(atom: TrackedAtom): number {
    return atom.subscribers?.size || 0;
  }

  /**
   * Get access count for atom
   * @param atom Atom to check
   * @returns Access count
   */
  getAccessCount(atom: TrackedAtom): number {
    return this.accessCounts.get(atom.id) || 0;
  }

  /**
   * Get subscriber info for atom
   * @param atom Atom to check
   * @returns Array of subscriber info
   */
  getSubscriberInfo(atom: TrackedAtom): SubscriberInfo[] {
    const infoMap = this.subscriberInfo.get(atom.id);
    if (!infoMap) {
      return [];
    }
    return Array.from(infoMap.values());
  }

  /**
   * Check if atom has subscribers
   * @param atom Atom to check
   * @returns True if has subscribers
   */
  hasSubscribers(atom: TrackedAtom): boolean {
    return (atom.subscribers?.size || 0) > 0;
  }

  /**
   * Get atoms with no subscribers
   * @param atoms Atoms to check
   * @returns Array of atoms with no subscribers
   */
  getAtomsWithNoSubscribers(atoms: TrackedAtom[]): TrackedAtom[] {
    return atoms.filter((atom) => !this.hasSubscribers(atom));
  }

  /**
   * Get reference statistics
   * @param atoms Atoms to check
   * @returns Reference stats
   */
  getStats(atoms: TrackedAtom[]): ReferenceStats {
    let totalSubscribers = 0;
    let atomsWithNoSubscribers = 0;

    for (const atom of atoms) {
      const count = this.getSubscriberCount(atom);
      totalSubscribers += count;
      if (count === 0) {
        atomsWithNoSubscribers++;
      }
    }

    const totalReferences = Array.from(this.accessCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      totalReferences,
      totalSubscribers,
      averageSubscribers: atoms.length > 0 ? totalSubscribers / atoms.length : 0,
      atomsWithNoSubscribers,
    };
  }

  /**
   * Clear all reference data
   */
  clear(): void {
    this.accessCounts.clear();
    this.subscriberInfo.clear();
  }

  /**
   * Clear access counts only
   */
  clearAccessCounts(): void {
    this.accessCounts.clear();
  }

  /**
   * Clear subscriber info only
   */
  clearSubscriberInfo(): void {
    this.subscriberInfo.clear();
  }
}
