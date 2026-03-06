/**
 * TimeTravelEventEmitter - Manages time travel events and subscriptions
 *
 * Responsibilities:
 * - Subscribe to events
 * - Emit events
 * - Unsubscribe
 */

import type { TimeTravelEvent, TimeTravelEventType } from './SubscriptionManager';
import { storeLogger as logger } from '../../debug';

export class TimeTravelEventEmitter {
  private subscriptionManager: any;

  constructor(subscriptionManager: any) {
    this.subscriptionManager = subscriptionManager;
  }

  /**
   * Subscribe to time travel events
   */
  subscribe(
    eventType: TimeTravelEventType,
    listener: (event: TimeTravelEvent) => void
  ): () => void {
    return this.subscriptionManager.subscribe(eventType, listener);
  }

  /**
   * Emit an event
   */
  emit(event: TimeTravelEvent): void {
    this.subscriptionManager.emit(event);
    logger.log(`[TimeTravelEventEmitter] Emitted event: ${event.type}`);
  }

  /**
   * Unsubscribe all listeners
   */
  unsubscribeAll(): void {
    this.subscriptionManager.unsubscribeAll();
    logger.log('[TimeTravelEventEmitter] All subscriptions removed');
  }

  /**
   * Get number of subscribers for event type
   */
  getSubscriberCount(eventType: TimeTravelEventType): number {
    return this.subscriptionManager.getSubscriberCount?.(eventType) || 0;
  }

  /**
   * Check if has subscribers for event type
   */
  hasSubscribers(eventType: TimeTravelEventType): boolean {
    return this.getSubscriberCount(eventType) > 0;
  }
}
