/**
 * SubscriptionManager - Manages event subscriptions for time travel
 *
 * Handles subscribing, unsubscribing, and notifying listeners
 * for time travel events.
 */

import type { TrackedAtom } from '../tracking/types';

export type TimeTravelEventType =
  | 'snapshot-captured'
  | 'snapshot-restored'
  | 'undo'
  | 'redo'
  | 'jump'
  | 'atom-change'
  | 'cleanup'
  | 'error';

export interface TimeTravelEvent {
  /** Event type */
  type: TimeTravelEventType;
  /** Event timestamp */
  timestamp: number;
  /** Snapshot ID (if applicable) */
  snapshotId?: string;
  /** Atom info (if applicable) */
  atom?: TrackedAtom;
  /** Error message (if applicable) */
  error?: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

export type TimeTravelEventListener = (event: TimeTravelEvent) => void;

export interface SubscriptionManagerConfig {
  /** Maximum number of listeners per event type */
  maxListenersPerEvent: number;
}

/**
 * SubscriptionManager provides event subscription management
 * for time travel operations
 */
export class SubscriptionManager {
  private listeners: Map<TimeTravelEventType, Set<TimeTravelEventListener>> =
    new Map();
  private config: SubscriptionManagerConfig;

  constructor(config?: Partial<SubscriptionManagerConfig>) {
    this.config = {
      maxListenersPerEvent: config?.maxListenersPerEvent ?? 100,
    };
  }

  /**
   * Subscribe to an event type
   * @param eventType Event type to subscribe to
   * @param listener Listener function
   * @returns Unsubscribe function
   */
  subscribe(
    eventType: TimeTravelEventType,
    listener: TimeTravelEventListener
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const eventListeners = this.listeners.get(eventType)!;

    // Check max listeners limit
    if (eventListeners.size >= this.config.maxListenersPerEvent) {
      console.warn(
        `[SubscriptionManager] Max listeners (${this.config.maxListenersPerEvent}) reached for event ${eventType}`
      );
      return () => {};
    }

    eventListeners.add(listener);

    // Return unsubscribe function
    return () => {
      eventListeners.delete(listener);
    };
  }

  /**
   * Unsubscribe from an event type
   * @param eventType Event type
   * @param listener Listener function
   */
  unsubscribe(
    eventType: TimeTravelEventType,
    listener: TimeTravelEventListener
  ): void {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  /**
   * Unsubscribe all listeners
   */
  unsubscribeAll(): void {
    this.listeners.clear();
  }

  /**
   * Emit an event
   * @param event Event to emit
   */
  emit(event: TimeTravelEvent): void {
    const eventListeners = this.listeners.get(event.type);
    if (eventListeners) {
      // Copy listeners to avoid issues with concurrent modifications
      const listenersCopy = Array.from(eventListeners);
      for (const listener of listenersCopy) {
        try {
          listener(event);
        } catch (error) {
          console.error(
            `[SubscriptionManager] Listener error for event ${event.type}:`,
            error
          );
        }
      }
    }
  }

  /**
   * Get number of listeners for an event type
   * @param eventType Event type
   * @returns Number of listeners
   */
  getListenerCount(eventType: TimeTravelEventType): number {
    const eventListeners = this.listeners.get(eventType);
    return eventListeners ? eventListeners.size : 0;
  }

  /**
   * Get total number of listeners across all event types
   * @returns Total number of listeners
   */
  getTotalListenerCount(): number {
    let total = 0;
    for (const listeners of this.listeners.values()) {
      total += listeners.size;
    }
    return total;
  }

  /**
   * Get all event types with listeners
   * @returns Array of event types
   */
  getEventTypes(): TimeTravelEventType[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Check if there are any listeners for an event type
   * @param eventType Event type
   * @returns True if there are listeners
   */
  hasListeners(eventType: TimeTravelEventType): boolean {
    const eventListeners = this.listeners.get(eventType);
    return eventListeners ? eventListeners.size > 0 : false;
  }

  /**
   * Clear listeners for an event type
   * @param eventType Event type
   */
  clear(eventType: TimeTravelEventType): void {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.clear();
    }
  }

  /**
   * Get configuration
   */
  getConfig(): SubscriptionManagerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<SubscriptionManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
