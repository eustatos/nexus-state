/**
 * TrackingEventManager - Manages tracking events and subscriptions
 *
 * Handles event emission and listener management for tracking operations.
 */

import type { TrackedAtom } from './types';

export type TrackingEventType =
  | 'atom-tracked'
  | 'atom-untracked'
  | 'atom-accessed'
  | 'atom-changed'
  | 'cleanup-started'
  | 'cleanup-completed'
  | 'atom-expired'
  | 'atom-archived';

export interface TrackingEvent {
  /** Event type */
  type: TrackingEventType;
  /** Event timestamp */
  timestamp: number;
  /** Atom info (if applicable) */
  atom?: TrackedAtom;
  /** Additional data */
  data?: Record<string, unknown>;
}

export type TrackingEventListener = (event: TrackingEvent) => void;

export interface EventManagerConfig {
  /** Maximum listeners per event type */
  maxListenersPerEvent: number;
}

/**
 * TrackingEventManager provides event management
 * for the tracking system
 */
export class TrackingEventManager {
  private listeners: Map<TrackingEventType, Set<TrackingEventListener>> =
    new Map();
  private config: EventManagerConfig;
  private eventHistory: TrackingEvent[] = [];
  private maxEventHistory: number = 100;

  constructor(config?: Partial<EventManagerConfig>) {
    this.config = {
      maxListenersPerEvent: config?.maxListenersPerEvent ?? 100,
    };
  }

  /**
   * Subscribe to an event type
   * @param eventType Event type
   * @param listener Listener function
   * @returns Unsubscribe function
   */
  subscribe(
    eventType: TrackingEventType,
    listener: TrackingEventListener
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const eventListeners = this.listeners.get(eventType)!;

    // Check max listeners limit
    if (eventListeners.size >= this.config.maxListenersPerEvent) {
      console.warn(
        `[TrackingEventManager] Max listeners (${this.config.maxListenersPerEvent}) reached for event ${eventType}`
      );
      return () => {};
    }

    eventListeners.add(listener);

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
    eventType: TrackingEventType,
    listener: TrackingEventListener
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
  emit(event: TrackingEvent): void {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxEventHistory) {
      this.eventHistory.shift();
    }

    const eventListeners = this.listeners.get(event.type);
    if (eventListeners) {
      // Copy listeners to avoid issues with concurrent modifications
      const listenersCopy = Array.from(eventListeners);
      for (const listener of listenersCopy) {
        try {
          listener(event);
        } catch (error) {
          console.error(
            `[TrackingEventManager] Listener error for event ${event.type}:`,
            error
          );
        }
      }
    }
  }

  /**
   * Emit atom tracked event
   * @param atom Tracked atom
   */
  emitAtomTracked(atom: TrackedAtom): void {
    this.emit({
      type: 'atom-tracked',
      timestamp: Date.now(),
      atom,
    });
  }

  /**
   * Emit atom untracked event
   * @param atom Tracked atom
   */
  emitAtomUntracked(atom: TrackedAtom): void {
    this.emit({
      type: 'atom-untracked',
      timestamp: Date.now(),
      atom,
    });
  }

  /**
   * Emit atom accessed event
   * @param atom Tracked atom
   */
  emitAtomAccessed(atom: TrackedAtom): void {
    this.emit({
      type: 'atom-accessed',
      timestamp: Date.now(),
      atom,
    });
  }

  /**
   * Emit cleanup started event
   */
  emitCleanupStarted(): void {
    this.emit({
      type: 'cleanup-started',
      timestamp: Date.now(),
    });
  }

  /**
   * Emit cleanup completed event
   * @param cleanedCount Number of atoms cleaned
   * @param failedCount Number of atoms failed
   */
  emitCleanupCompleted(cleanedCount: number, failedCount: number): void {
    this.emit({
      type: 'cleanup-completed',
      timestamp: Date.now(),
      data: { cleanedCount, failedCount },
    });
  }

  /**
   * Get number of listeners for an event type
   * @param eventType Event type
   * @returns Number of listeners
   */
  getListenerCount(eventType: TrackingEventType): number {
    const eventListeners = this.listeners.get(eventType);
    return eventListeners ? eventListeners.size : 0;
  }

  /**
   * Get total number of listeners
   * @returns Total listeners
   */
  getTotalListenerCount(): number {
    let total = 0;
    for (const listeners of this.listeners.values()) {
      total += listeners.size;
    }
    return total;
  }

  /**
   * Get event history
   * @returns Array of events
   */
  getEventHistory(): TrackingEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Get events by type
   * @param eventType Event type
   * @returns Array of events
   */
  getEventsByType(eventType: TrackingEventType): TrackingEvent[] {
    return this.eventHistory.filter((e) => e.type === eventType);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory.length = 0;
  }

  /**
   * Get configuration
   */
  getConfig(): EventManagerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<EventManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
