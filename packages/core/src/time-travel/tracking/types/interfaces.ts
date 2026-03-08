/**
 * Interfaces for AtomTracker dependency injection
 * Enables testability and loose coupling
 */

import type { Atom } from '../../types';
import type {
  TrackedAtom,
  TrackingStats,
  CleanupStats,
  CleanupResult,
  ArchiveStats,
} from './types';

/**
 * Track result
 */
export interface TrackResult {
  success: boolean;
  error?: string;
}

/**
 * Untrack result
 */
export interface UntrackResult {
  success: boolean;
  error?: string;
}

/**
 * Interface for tracking operations (track/untrack)
 */
export interface ITrackingOperations {
  /**
   * Track an atom
   */
  track<Value>(atom: Atom<Value>, metadata: TrackedAtom): TrackResult;

  /**
   * Untrack an atom
   */
  untrack(atomId: symbol): UntrackResult;

  /**
   * Get tracked atom by ID
   */
  getTrackedAtom(atomId: symbol): TrackedAtom | null;

  /**
   * Get all tracked atoms
   */
  getTrackedAtoms(): TrackedAtom[];

  /**
   * Get atom by name
   */
  getAtomByName(name: string): TrackedAtom | undefined;

  /**
   * Check if atom is tracked
   */
  isTracked(atomId: symbol): boolean;

  /**
   * Get count of tracked atoms
   */
  getCount(): number;
}

/**
 * Interface for access tracking
 */
export interface IAccessTracking {
  /**
   * Record atom access
   */
  recordAccess(
    atom: Atom<unknown>,
    tracked: TrackedAtom,
    subscriberId?: string
  ): void;

  /**
   * Remove subscriber from atom
   */
  removeSubscriber(
    atom: Atom<unknown>,
    tracked: TrackedAtom,
    subscriberId: string
  ): boolean;
}

/**
 * Interface for cleanup operations
 */
export interface ICleanupOperations {
  /**
   * Perform cleanup
   */
  performCleanup(): Promise<CleanupResult>;

  /**
   * Trigger immediate cleanup
   */
  triggerCleanup(): Promise<CleanupResult>;

  /**
   * Wait for next cleanup cycle
   */
  waitForCleanup(timeout: number): Promise<{ removed: number }>;
}

/**
 * Interface for stats provider
 */
export interface IStatsProvider {
  /**
   * Get tracking statistics
   */
  getTrackingStats(): TrackingStats;

  /**
   * Get cleanup statistics
   */
  getCleanupStats(): CleanupStats;

  /**
   * Get archive statistics
   */
  getArchiveStats(): ArchiveStats;

  /**
   * Get repository statistics
   */
  getRepositoryStats(): {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

/**
 * Interface for event subscription
 */
export interface IEventSubscription {
  /**
   * Subscribe to tracking events
   */
  subscribe(
    eventType: string,
    listener: (event: unknown) => void
  ): () => void;

  /**
   * Unsubscribe from all events
   */
  unsubscribeAll(): void;
}

/**
 * Dependencies for AtomTracker
 */
export interface AtomTrackerDeps {
  store: any;
  tracking: ITrackingOperations;
  access: IAccessTracking;
  cleanup: ICleanupOperations;
  stats: IStatsProvider;
  events?: IEventSubscription;
  config?: any;
}
