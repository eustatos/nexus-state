/**
 * Tracking module types
 */

/**
 * Atom lifecycle status
 */
export type AtomStatus = "active" | "idle" | "stale" | "archived" | "deleted";

/**
 * Cleanup strategy type
 */
export type CleanupStrategyType = "lru" | "lfu" | "fifo" | "time-based";

/**
 * Cleanup action type
 */
export type CleanupAction = "archive" | "delete" | "notify";

/**
 * Atom lifecycle information
 */
export interface AtomLifecycle {
  /** Current status of the atom */
  status: AtomStatus;

  /** Creation timestamp */
  createdAt: number;

  /** Last access timestamp */
  lastAccessed: number;

  /** Last change timestamp */
  lastChanged: number;

  /** Total access count */
  accessCount: number;

  /** Computed idle time in ms (now() - lastAccessed) */
  idleTime: number;

  /** Time-to-live in ms */
  ttl: number;

  /** Whether atom is eligible for garbage collection */
  gcEligible: boolean;
}

/**
 * TTL configuration for AtomTracker
 */
export interface TTLConfig {
  /** Default TTL in ms (e.g., 5 minutes) */
  defaultTTL: number;

  /** Maximum TTL in ms (e.g., 1 hour) */
  maxTTL: number;

  /** Minimum TTL in ms (e.g., 10 seconds) */
  minTTL: number;

  /** Per-type TTL overrides */
  typeTTL: {
    primitive?: number;
    computed?: number;
    writable?: number;
    [key: string]: number | undefined;
  };

  /** Time before atom considered idle */
  idleThreshold: number;

  /** Time before atom considered stale */
  staleThreshold: number;

  /** How often to check for cleanup in ms */
  gcInterval: number;

  /** How many atoms to cleanup per batch */
  batchSize: number;

  /** Enable reference counting */
  enableRefCounting: boolean;

  /** Automatically untrack when ref count is zero */
  autoUntrackWhenRefZero: boolean;

  /** Cleanup strategy to use */
  cleanupStrategy: CleanupStrategyType;

  /** Action to perform on cleanup */
  onCleanup: CleanupAction;

  /** Archive storage configuration */
  archiveStorage?: {
    enabled: boolean;
    maxArchived: number;
    storagePath?: string;
  };

  /** Log cleanup operations */
  logCleanups: boolean;

  /** Enable detailed statistics */
  detailedStats: boolean;
}

/**
 * Cleanup strategy interface
 */
export interface CleanupStrategy {
  /** Strategy name */
  name: string;

  /** Select candidates for cleanup */
  selectCandidates(atoms: TrackedAtom[], count: number): TrackedAtom[];

  /** Get priority for an atom (higher = sooner cleanup) */
  getPriority(atom: TrackedAtom): number;
}

/**
 * Cleanup statistics
 */
export interface CleanupStats {
  /** Total number of cleanup operations */
  totalCleanups: number;

  /** Total atoms removed */
  totalAtomsRemoved: number;

  /** Total memory freed in bytes */
  totalMemoryFreed: number;

  /** Timestamp of last cleanup */
  lastCleanup: number | null;

  /** Average cleanup time in ms */
  averageCleanupTime?: number;

  /** Atoms count by status */
  atomsByStatus?: {
    active: number;
    idle: number;
    stale: number;
    archived: number;
  };
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  /** Number of atoms removed */
  removed: number;

  /** Memory freed in bytes */
  freed: number;

  /** Duration in ms */
  duration: number;
}

/**
 * Configuration for AtomTracker
 */
export interface TrackerConfig {
  /** Automatically track new atoms */
  autoTrack: boolean;

  /** Maximum number of atoms to track */
  maxAtoms: number;

  /** Track computed atoms */
  trackComputed: boolean;

  /** Track writable atoms */
  trackWritable: boolean;

  /** Track primitive atoms */
  trackPrimitive: boolean;

  /** Validate atoms before tracking */
  validateOnTrack: boolean;

  /** Track atom access patterns */
  trackAccess: boolean;

  /** Track atom changes */
  trackChanges: boolean;

  /** Sample rate for tracking (0-1) */
  sampleRate?: number;

  /** TTL configuration */
  ttl?: Partial<TTLConfig>;
}

/**
 * Tracked atom metadata
 */
export interface TrackedAtom extends AtomLifecycle {
  /** Atom ID */
  id: symbol;

  /** Atom reference */
  atom: any;

  /** Display name */
  name: string;

  /** Atom type */
  type: string;

  /** First seen timestamp */
  firstSeen: number;

  /** Last seen timestamp */
  lastSeen: number;

  /** Change count */
  changeCount: number;

  /** Additional metadata */
  metadata: AtomMetadata;

  /** Number of references/uses */
  refCount?: number;

  /** Set of subscriber IDs using this atom */
  subscribers?: Set<string>;
}

/**
 * Atom metadata
 */
export interface AtomMetadata {
  /** Creation timestamp */
  createdAt: number;

  /** Last update timestamp */
  updatedAt: number;

  /** Access count */
  accessCount: number;

  /** Change count */
  changeCount: number;

  /** Custom tags */
  tags?: string[];

  /** Custom metadata */
  custom?: Record<string, any>;
}

/**
 * Tracking event
 */
export interface TrackingEvent {
  /** Event type */
  type:
    | "track"
    | "untrack"
    | "change"
    | "access"
    | "error"
    | "clear"
    | "restore"
    | "cleanup"
    | "beforeCleanup"
    | "afterCleanup";

  /** Event timestamp */
  timestamp: number;

  /** Tracked atom (if applicable) */
  atom?: TrackedAtom;

  /** Old value (for change events) */
  oldValue?: any;

  /** New value (for change events) */
  newValue?: any;

  /** Error message (for error events) */
  message?: string;

  /** Additional data */
  data?: any;
}

/**
 * Tracking statistics
 */
export interface TrackingStats {
  /** Total atoms tracked */
  totalAtoms: number;

  /** Distribution by type */
  byType: Record<string, number>;

  /** Total access count */
  accessCount: number;

  /** Total change count */
  changeCount: number;

  /** Average accesses per atom */
  averageAccesses: number;

  /** Most accessed atom */
  mostAccessed: TrackedAtom | null;

  /** Most changed atom */
  mostChanged: TrackedAtom | null;

  /** Oldest tracked atom */
  oldestAtom: TrackedAtom | null;

  /** Newest tracked atom */
  newestAtom: TrackedAtom | null;

  /** Current version */
  version: number;

  /** Tracker uptime in ms */
  uptime: number;

  /** Cleanup statistics */
  cleanupStats?: CleanupStats;
}

/**
 * Change event
 */
export interface ChangeEvent {
  /** Changed atom */
  atom: any;

  /** Atom ID */
  atomId: symbol;

  /** Atom name */
  atomName: string;

  /** Old value */
  oldValue: any;

  /** New value */
  newValue: any;

  /** Change timestamp */
  timestamp: number;

  /** Change type */
  type: "created" | "deleted" | "value" | "type" | "unknown";
}

/**
 * Change listener
 */
export type ChangeListener = (event: ChangeEvent) => void;

/**
 * Change filter
 */
export type ChangeFilter = (event: ChangeEvent) => boolean;

/**
 * Change batch
 */
export interface ChangeBatch {
  /** Changes in batch */
  changes: ChangeEvent[];

  /** Number of changes */
  count: number;

  /** Batch start time */
  startTime: number;

  /** Batch end time */
  endTime: number;

  /** Unique atoms changed */
  atoms: Set<symbol>;
}

/**
 * Computed atom configuration
 */
export interface ComputedAtomConfig {
  /** Lazy evaluation */
  lazy: boolean;

  /** Enable caching */
  cache: boolean;

  /** Cache TTL in ms */
  cacheTTL?: number;

  /** Invalidate on dependency change */
  invalidateOnChange: boolean;

  /** Recompute strategy */
  strategy?: "eager" | "lazy" | "debounced";

  /** Debounce wait time in ms */
  debounceWait?: number;

  /** Maximum cache size */
  maxCacheSize?: number;
}

/**
 * Computed dependency
 */
export interface ComputedDependency {
  /** Source atom */
  atom: any;

  /** Optional value transform */
  transform?: (value: any) => any;
}

/**
 * Computed cache entry
 */
export interface ComputedCache {
  /** Cached value */
  value: any;

  /** Cache timestamp */
  timestamp: number;

  /** Dependency values at cache time */
  dependencies: any[];
}

/**
 * Computed invalidation strategy
 */
export type ComputedInvalidationStrategy =
  | "immediate"
  | "debounced"
  | "throttled"
  | "manual";

/**
 * Atom group
 */
export interface AtomGroup {
  /** Group ID */
  id: string;

  /** Group name */
  name: string;

  /** Atom IDs in group */
  atomIds: symbol[];

  /** Group metadata */
  metadata: {
    createdAt: number;
    updatedAt: number;
    atomCount: number;
  };
}

/**
 * Atom relationship
 */
export interface AtomRelationship {
  /** Source atom ID */
  from: symbol;

  /** Target atom ID */
  to: symbol;

  /** Relationship type */
  type: "depends" | "derives" | "updates" | "subscribes";

  /** Relationship strength (0-1) */
  strength?: number;
}

/**
 * Atom subscription
 */
export interface AtomSubscription {
  /** Subscriber ID */
  id: string;

  /** Atom ID */
  atomId: symbol;

  /** Subscription type */
  type: "value" | "change" | "access";

  /** Created timestamp */
  createdAt: number;

  /** Last notified timestamp */
  lastNotified?: number;

  /** Notification count */
  notifyCount: number;
}

/**
 * Tracker snapshot
 */
export interface TrackerSnapshot {
  /** Tracked atoms */
  atoms: TrackedAtom[];

  /** Version */
  version: number;

  /** Snapshot timestamp */
  timestamp: number;

  /** Configuration */
  config: TrackerConfig;
}

/**
 * Tracker restore point
 */
export interface TrackerRestorePoint {
  /** Point ID */
  id: string;

  /** Atoms map */
  atoms: Map<symbol, TrackedAtom>;

  /** Atoms by name */
  atomsByName: Map<string, symbol>;

  /** Version */
  version: number;

  /** Timestamp */
  timestamp: number;
}
