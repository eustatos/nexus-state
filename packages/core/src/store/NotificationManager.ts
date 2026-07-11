/**
 * NotificationManager - Manages atom subscriptions and notifications
 *
 * Handles subscriber management and batched notifications.
 * Receives an optional Batcher instance; without it, notifications are synchronous.
 */

import type { Atom } from '../types';
import type { Batcher } from '../batching';
import { storeLogger as logger } from '../debug';
import type { AtomState } from './types';

export type Subscriber<Value> = (value: Value) => void;
export type Unsubscribe = () => void;

export interface NotificationStats {
  /** Total notifications sent */
  totalNotifications: number;
  /** Total errors */
  totalErrors: number;
  /** Subscribers per atom */
  subscribersByAtom: Record<string, number>;
}

/**
 * NotificationManager provides subscription management
 */
export class NotificationManager {
  private batcher: Batcher | null;
  private notificationCount: number = 0;
  private errorCount: number = 0;

  constructor(batcher?: Batcher | null) {
    this.batcher = batcher ?? null;
  }

  /**
   * Subscribe to atom changes
   * @param atom Atom to subscribe to
   * @param atomState Atom state
   * @param subscriber Subscriber function
   * @returns Unsubscribe function
   */
  subscribe<Value>(
    atom: Atom<Value>,
    atomState: AtomState<Value>,
    subscriber: Subscriber<Value>
  ): Unsubscribe {
    // Add subscriber
    atomState.subscribers.add(subscriber);

    logger.log(
      '[NotificationManager] Subscribed to atom:',
      atom.name || 'unnamed',
      'subscribers:',
      atomState.subscribers.size
    );

    // Return unsubscribe function
    return () => {
      this.unsubscribe(atom, atomState, subscriber);
    };
  }

  /**
   * Unsubscribe from atom
   * @param atom Atom to unsubscribe from
   * @param atomState Atom state
   * @param subscriber Subscriber to remove
   */
  unsubscribe<Value>(
    atom: Atom<Value>,
    atomState: AtomState<Value>,
    subscriber: Subscriber<Value>
  ): void {
    const deleted = atomState.subscribers.delete(subscriber);
    logger.log(
      '[NotificationManager] Unsubscribed from atom:',
      atom.name || 'unnamed',
      'subscribers:',
      atomState.subscribers.size
    );
  }

  /**
   * Notify all subscribers of atom change
   * @param atom Changed atom
   * @param atomState Atom state
   * @param value New value
   */
  notify<Value>(
    atom: Atom<Value>,
    atomState: AtomState<Value>,
    value: Value
  ): void {
    if (!this.batcher) {
      // No batcher — notify synchronously
      this.notifySubscribers(atom, atomState, value);
      return;
    }

    const wasBatching = this.batcher.getIsBatching();

    // Schedule notification for batching
    this.batcher.schedule(() => {
      this.notifySubscribers(atom, atomState, value);
    });

    // Flush immediately if not already batching
    if (!wasBatching) {
      this.batcher.flush();
    }
  }

  /**
   * Notify subscribers synchronously
   * @param atom Changed atom
   * @param atomState Atom state
   * @param value New value
   */
  private notifySubscribers<Value>(
    atom: Atom<Value>,
    atomState: AtomState<Value>,
    value: Value
  ): void {
    logger.log(
      '[NotificationManager] Notifying subscribers of:',
      atom.name || 'unnamed',
      'count:',
      atomState.subscribers.size
    );

    atomState.subscribers.forEach((subscriber) => {
      try {
        subscriber(value);
        this.notificationCount++;
      } catch (error) {
        this.errorCount++;
        logger.error('[NotificationManager] Subscriber error:', error);
      }
    });
  }

  /**
   * Get subscriber count for atom
   * @param atomState Atom state
   * @returns Number of subscribers
   */
  getSubscriberCount<Value>(atomState: AtomState<Value>): number {
    return atomState.subscribers.size;
  }

  /**
   * Get notification statistics
   * @param getState Function to get all atom states
   * @returns Notification stats
   */
  getStats(getState: () => Map<Atom<any>, AtomState<any>>): NotificationStats {
    const allStates = getState();
    const subscribersByAtom: Record<string, number> = {};

    allStates.forEach((atomState, atom) => {
      const atomName = atom.name || atom.toString();
      subscribersByAtom[atomName] = atomState.subscribers.size;
    });

    return {
      totalNotifications: this.notificationCount,
      totalErrors: this.errorCount,
      subscribersByAtom,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.notificationCount = 0;
    this.errorCount = 0;
  }
}
