/**
 * Core types for tracking module
 */

import type { Atom } from '../../types';

/**
 * Tracking configuration
 */
export interface TrackerConfig {
  /** Automatically track atoms when created */
  autoTrack?: boolean;
  /** Maximum number of tracked atoms */
  maxAtoms?: number;
  /** Track computed atoms */
  trackComputed?: boolean;
  /** Track writable atoms */
  trackWritable?: boolean;
  /** Track primitive atoms */
  trackPrimitive?: boolean;
  /** Validate atoms when tracking */
  validateOnTrack?: boolean;
  /** Track atom access */
  trackAccess?: boolean;
  /** Track changes */
  trackChanges?: boolean;
  /** Log changes to console */
  logChanges?: boolean;
  /** Enable cleanup */
  enableCleanup?: boolean;
  /** Archive atoms on cleanup */
  archiveOnCleanup?: boolean;
}

/**
 * TTL configuration
 */
export interface TTLConfig {
  /** Default TTL in milliseconds */
  defaultTTL?: number;
  /** Maximum TTL in milliseconds */
  maxTTL?: number;
  /** Minimum TTL in milliseconds */
  minTTL?: number;
  /** Idle timeout in milliseconds */
  idleTimeout?: number;
  /** Stale timeout in milliseconds */
  staleTimeout?: number;
  /** GC interval in milliseconds */
  gcInterval?: number;
  /** Batch size for cleanup */
  batchSize?: number;
  /** Enable reference counting */
  enableRefCounting?: boolean;
  /** Automatically untrack when reference count reaches zero */
  autoUntrackWhenRefZero?: boolean;
  /** Cleanup strategy */
  cleanupStrategy?: CleanupStrategyType;
  /** Action on cleanup */
  onCleanup?: 'remove' | 'archive' | 'mark-stale';
  /** Log cleanup operations */
  logCleanups?: boolean;
  /** Detailed statistics */
  detailedStats?: boolean;
  /** TTL by atom type */
  ttlByType?: Record<string, number>;
}

/**
 * Cleanup strategy type
 */
export type CleanupStrategyType = 'lru' | 'lfu' | 'fifo' | 'time' | 'time-based';

/**
 * Cleanup action
 */
export type CleanupAction = 'remove' | 'archive' | 'mark-stale';

/**
 * Cleanup strategy
 */
export interface CleanupStrategy {
  /** Strategy name */
  name: CleanupStrategyType;
  /** Strategy options */
  options?: Record<string, unknown>;
}

/**
 * Tracked atom metadata
 */
export interface TrackedAtom {
  /** Atom instance */
  atom: Atom<any>;
  /** Atom ID */
  id: symbol;
  /** Atom name */
  name: string;
  /** Atom type */
  type: 'primitive' | 'computed' | 'writable';
  /** When the atom was created */
  createdAt: number;
  /** When the atom was first seen */
  firstSeen: number;
  /** When the atom was last seen */
  lastSeen: number;
  /** When the atom was tracked */
  trackedAt: number;
  /** Last access time */
  lastAccessedAt: number;
  /** Last changed time */
  lastChanged: number;
  /** Access count */
  accessCount: number;
  /** Change count */
  changeCount: number;
  /** Reference count */
  refCount: number;
  /** Idle time */
  idleTime: number;
  /** TTL in milliseconds */
  ttl: number;
  /** Whether atom is eligible for GC */
  gcEligible: boolean;
  /** Atom status */
  status: AtomStatus;
  /** Lifecycle information */
  lifecycle: AtomLifecycle;
  /** Subscriber IDs */
  subscribers: Set<string>;
  /** Metadata */
  metadata: Record<string, unknown>;
}

/**
 * Atom status
 */
export type AtomStatus = 'active' | 'idle' | 'stale' | 'expired';

/**
 * Atom lifecycle information
 */
export interface AtomLifecycle {
  /** When the atom was created */
  createdAt: number;
  /** When the atom was last accessed */
  lastAccessedAt: number;
  /** When the atom becomes idle */
  idleAt?: number;
  /** When the atom becomes stale */
  staleAt?: number;
  /** When the atom expires */
  expiresAt?: number;
}

/**
 * Tracking statistics
 */
export interface TrackingStats {
  /** Total tracked atoms */
  totalAtoms: number;
  /** Active atoms */
  activeAtoms: number;
  /** Idle atoms */
  idleAtoms: number;
  /** Stale atoms */
  staleAtoms: number;
  /** Expired atoms */
  expiredAtoms: number;
  /** Total accesses */
  totalAccesses: number;
  /** Total changes */
  totalChanges: number;
  /** Atoms by type */
  byType: Record<string, number>;
}

/**
 * Cleanup statistics
 */
export interface CleanupStats {
  /** Total cleanups */
  totalCleanups: number;
  /** Total atoms cleaned */
  totalAtomsCleaned: number;
  /** Total atoms failed */
  totalAtomsFailed: number;
  /** Last cleanup result */
  lastCleanup: CleanupResult | null;
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  /** Number of atoms cleaned */
  cleanedCount: number;
  /** Number of atoms failed */
  failedCount: number;
  /** Names of cleaned atoms */
  cleanedAtoms: string[];
  /** Errors */
  errors: string[];
  /** Strategy used */
  strategy: string;
}

/**
 * Archive statistics
 */
export interface ArchiveStats {
  /** Total archived */
  totalArchived: number;
  /** By reason */
  byReason: Record<string, number>;
}

/**
 * Tracking event type
 */
export type TrackingEventType = 'track' | 'untrack' | 'access' | 'change' | 'cleanup' | 'archive';

/**
 * Tracking event
 */
export interface TrackingEvent {
  /** Event type */
  type: TrackingEventType;
  /** Event timestamp */
  timestamp: number;
  /** Atom */
  atom: Atom<any>;
  /** Atom name */
  atomName: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

/**
 * Change event
 */
export interface ChangeEvent {
  /** Event timestamp */
  timestamp: number;
  /** Event type */
  type: 'created' | 'deleted' | 'value' | 'type' | 'unknown' | 'change';
  /** Atom */
  atom: Atom<any>;
  /** Atom ID */
  atomId: symbol;
  /** Atom name */
  atomName: string;
  /** Old value */
  oldValue: unknown;
  /** New value */
  newValue: unknown;
  /** Additional data */
  data?: Record<string, unknown>;
}

/**
 * Change listener
 */
export type ChangeListener = (atom: Atom<any>, oldValue: unknown, newValue: unknown) => void;

/**
 * Change filter
 */
export interface ChangeFilter {
  /** Filter by atom name */
  atomName?: string;
  /** Filter by atom type */
  atomType?: 'primitive' | 'computed' | 'writable';
  /** Filter by change type */
  changeType?: 'value' | 'reference';
  /** Filter function */
  (event: ChangeEvent): boolean;
}

/**
 * Change batch
 */
export interface ChangeBatch {
  /** Changes */
  changes: Array<{
    atom: Atom<any>;
    oldValue: unknown;
    newValue: unknown;
    timestamp: number;
  }>;
  /** Batch start time */
  startTime: number;
  /** Batch end time */
  endTime: number;
  /** Number of changes in batch */
  count: number;
}

/**
 * Computed atom config
 */
export interface ComputedAtomConfig {
  /** Read function */
  read: (get: (atom: Atom<any>) => any) => any;
  /** Dependencies */
  dependencies: Atom<any>[];
}

/**
 * Computed dependency
 */
export interface ComputedDependency {
  /** Atom */
  atom: Atom<any>;
  /** Transform function */
  transform?: (value: any) => any;
}

/**
 * Computed cache
 */
export interface ComputedCache {
  /** Cached value */
  value: any;
  /** Cache timestamp */
  timestamp: number;
  /** Dependencies version */
  dependenciesVersion: number;
}

/**
 * Computed invalidation strategy
 */
export type ComputedInvalidationStrategy = 'eager' | 'lazy' | 'manual';

/**
 * Atom metadata
 */
export interface AtomMetadata {
  /** Description */
  description?: string;
  /** Tags */
  tags?: string[];
  /** Custom data */
  custom?: Record<string, unknown>;
}

/**
 * Atom group
 */
export interface AtomGroup {
  /** Group ID */
  id: string;
  /** Group name */
  name: string;
  /** Atom IDs */
  atomIds: symbol[];
  /** Group metadata */
  metadata: Record<string, unknown>;
}

/**
 * Atom relationship
 */
export interface AtomRelationship {
  /** Source atom */
  source: Atom<any>;
  /** Target atom */
  target: Atom<any>;
  /** Relationship type */
  type: 'depends' | 'derived' | 'linked';
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Atom subscription
 */
export interface AtomSubscription {
  /** Subscription ID */
  id: string;
  /** Atom */
  atom: Atom<any>;
  /** Subscriber callback */
  callback: (value: any) => void;
  /** Unsubscribe function */
  unsubscribe: () => void;
}

/**
 * Tracker snapshot
 */
export interface TrackerSnapshot {
  /** Snapshot timestamp */
  timestamp: number;
  /** Tracked atoms */
  atoms: Map<symbol, TrackedAtom>;
  /** Statistics */
  stats: TrackingStats;
}

/**
 * Tracker restore point
 */
export interface TrackerRestorePoint {
  /** Restore point ID */
  id: string;
  /** Restore point timestamp */
  timestamp: number;
  /** Snapshot */
  snapshot: TrackerSnapshot;
}
