/**
 * AtomEventService - Service for tracking events
 *
 * Handles event subscription, emission, and management.
 */

import type { TrackingEvent, TrackingEventType } from './TrackingEventManager';
import type { TrackingEventManager } from './TrackingEventManager';

export type EventListener = (event: TrackingEvent) => void;
export type Unsubscribe = () => void;

export interface EventStats {
  /** Total listeners */
  totalListeners: number;
  /** Listeners by event type */
  listenersByType: Record<string, number>;
  /** Event history size */
  historySize: number;
}

/**
 * AtomEventService provides event management
 */
export class AtomEventService {
  private eventManager: TrackingEventManager;

  constructor(eventManager: TrackingEventManager) {
    this.eventManager = eventManager;
  }

  /**
   * Subscribe to tracking events
   * @param eventType Event type
   * @param listener Event listener
   * @returns Unsubscribe function
   */
  subscribe(eventType: TrackingEventType, listener: EventListener): Unsubscribe {
    return this.eventManager.subscribe(eventType, listener);
  }

  /**
   * Subscribe to all events
   * @param listener Event listener
   * @returns Array of unsubscribe functions
   */
  subscribeAll(listener: EventListener): Unsubscribe[] {
    const eventTypes: TrackingEventType[] = [
      'atom-tracked',
      'atom-untracked',
      'atom-accessed',
      'atom-changed',
      'cleanup-started',
      'cleanup-completed',
      'atom-expired',
      'atom-archived',
    ];

    return eventTypes.map((type) => this.subscribe(type, listener));
  }

  /**
   * Unsubscribe from event type
   * @param eventType Event type
   * @param listener Event listener
   */
  unsubscribe(eventType: TrackingEventType, listener: EventListener): void {
    this.eventManager.unsubscribe(eventType, listener);
  }

  /**
   * Unsubscribe all listeners
   */
  unsubscribeAll(): void {
    this.eventManager.unsubscribeAll();
  }

  /**
   * Emit event
   * @param event Event to emit
   */
  emit(event: TrackingEvent): void {
    this.eventManager.emit(event);
  }

  /**
   * Get listener count for event type
   * @param eventType Event type
   * @returns Number of listeners
   */
  getListenerCount(eventType: TrackingEventType): number {
    return this.eventManager.getListenerCount(eventType);
  }

  /**
   * Get total listener count
   * @returns Total listeners
   */
  getTotalListenerCount(): number {
    return this.eventManager.getTotalListenerCount();
  }

  /**
   * Get event history
   * @returns Array of events
   */
  getEventHistory(): TrackingEvent[] {
    return this.eventManager.getEventHistory();
  }

  /**
   * Get events by type
   * @param eventType Event type
   * @returns Array of events
   */
  getEventsByType(eventType: TrackingEventType): TrackingEvent[] {
    return this.eventManager.getEventsByType(eventType);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventManager.clearHistory();
  }

  /**
   * Get event statistics
   * @returns Event stats
   */
  getEventStats(): EventStats {
    const eventTypes: TrackingEventType[] = [
      'atom-tracked',
      'atom-untracked',
      'atom-accessed',
      'atom-changed',
      'cleanup-started',
      'cleanup-completed',
      'atom-expired',
      'atom-archived',
    ];

    const listenersByType: Record<string, number> = {};
    let totalListeners = 0;

    for (const type of eventTypes) {
      const count = this.getListenerCount(type);
      listenersByType[type] = count;
      totalListeners += count;
    }

    return {
      totalListeners,
      listenersByType,
      historySize: this.getEventHistory().length,
    };
  }

  /**
   * Get event manager
   */
  getEventManager(): TrackingEventManager {
    return this.eventManager;
  }
}
