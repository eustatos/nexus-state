/**
 * SimpleTimeTravel - Main time travel implementation
 *
 * @packageDocumentation
 * Provides undo/redo and time travel capabilities for state management.
 */

import type {
  TimeTravelOptions,
  Snapshot,
  TimeTravelAPI,
  RestorationCheckpoint,
  TransactionalRestorationResult,
  RestorationOptions,
  RollbackResult,
} from "../types";

import { HistoryManager } from "./HistoryManager";
import { HistoryNavigator } from "./HistoryNavigator";
import type { HistoryManagerConfig } from "./types";

import { SnapshotCreator } from "../snapshot/SnapshotCreator";
import { SnapshotRestorer } from "../snapshot/SnapshotRestorer";
import type {
  SnapshotCreatorConfig,
  SnapshotRestorerConfig,
  TransactionalRestorerConfig,
  RestorationConfig,
} from "../snapshot/types";

import { AtomTracker } from "../tracking/AtomTracker";
import type {
  TrackerConfig,
  TrackingEvent,
  TTLConfig,
  CleanupResult,
  TrackedAtom,
} from "../tracking/types";

import { atomRegistry } from "../../atom-registry";
import { Atom, Store } from "../../types";

// Comparison imports
import {
  SnapshotComparator,
  ComparisonFormatter,
  type SnapshotComparison,
  type ComparisonOptions,
  type VisualizationFormat,
  type ExportFormat,
} from "../comparison";

// Delta imports for incremental snapshots
import { DeltaAwareHistoryManager } from "../delta/delta-history-manager";
import { DeltaCalculatorImpl } from "../delta/calculator";
import { SnapshotReconstructor } from "../delta/reconstructor";
import type {
  DeltaSnapshot,
  IncrementalSnapshotConfig,
  DeltaCompressionFactoryConfig,
} from "../delta/types";

// Import disposal infrastructure
import {
  BaseDisposable,
  type DisposableConfig,
  LeakDetector,
  FinalizationHelper,
} from "./disposable";

/**
 * Main SimpleTimeTravel class
 * Provides time travel debugging capabilities for Nexus State
 */
export class SimpleTimeTravel extends BaseDisposable implements TimeTravelAPI {
  private historyManager: HistoryManager | DeltaAwareHistoryManager;
  private historyNavigator: HistoryNavigator;
  private snapshotCreator: SnapshotCreator;
  private snapshotRestorer: SnapshotRestorer;
  private atomTracker: AtomTracker;
  private isTimeTraveling: boolean = false;
  private autoCapture: boolean;
  private store: Store;
  private originalSet: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
  ) => void;
  private subscriptions: Set<() => void> = new Set();
  private finalizationRegistry: FinalizationHelper;
  private instanceId: string;

  // Delta-specific fields
  private deltaCalculator: DeltaCalculatorImpl;
  private deltaReconstructor: SnapshotReconstructor;
  private deltaConfig: IncrementalSnapshotConfig;
  private useDeltaSnapshots: boolean = false;

  // Comparison fields
  private snapshotComparator: SnapshotComparator;
  private comparisonFormatter: ComparisonFormatter;

  /**
   * Create a new SimpleTimeTravel instance
   * @param store - The store to track
   * @param options - Configuration options
   */
  constructor(store: Store, options: TimeTravelOptions & DisposableConfig = {}) {
    super(options);
    this.store = store;
    this.autoCapture = options.autoCapture ?? true;
    this.originalSet = store.set.bind(store);

    // Generate instance ID for tracking
    this.instanceId = `TimeTravel-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Initialize finalization registry
    this.finalizationRegistry = new FinalizationHelper((msg) => {
      if (this.config.logDisposal) {
        console.log(`[FINALIZATION] ${msg}`);
      }
    });
    this.finalizationRegistry.track(this, this.instanceId);

    // Track instance for leak detection
    if (options.detectLeaks) {
      LeakDetector.track(this, this.instanceId);
    }

    // Initialize delta configuration
    this.deltaConfig = {
      enabled: options.deltaSnapshots?.enabled ?? false,
      fullSnapshotInterval: options.deltaSnapshots?.fullSnapshotInterval ?? 10,
      maxDeltaChainLength: options.deltaSnapshots?.maxDeltaChainLength ?? 20,
      maxDeltaChainAge: options.deltaSnapshots?.maxDeltaChainAge ?? 5 * 60 * 1000,
      maxDeltaChainSize: options.deltaSnapshots?.maxDeltaChainSize ?? 1024 * 1024,
      changeDetection: options.deltaSnapshots?.changeDetection ?? "deep",
      reconstructOnDemand: options.deltaSnapshots?.reconstructOnDemand ?? true,
      cacheReconstructed: options.deltaSnapshots?.cacheReconstructed ?? true,
      maxCacheSize: options.deltaSnapshots?.maxCacheSize ?? 100,
      compressionLevel: options.deltaSnapshots?.compressionLevel ?? "light",
    };

    this.useDeltaSnapshots = this.deltaConfig.enabled;

    // Build TTL configuration from options
    const ttlConfig: Partial<TTLConfig> = {
      defaultTTL: options.atomTTL || options.ttlConfig?.defaultTTL,
      cleanupStrategy: options.cleanupStrategy || options.ttlConfig?.cleanupStrategy,
      gcInterval: options.gcInterval || options.ttlConfig?.gcInterval,
      ...options.ttlConfig,
    };

    // Initialize components with disposal tracking
    this.atomTracker = new AtomTracker(
      store,
      {
        autoTrack: true,
        maxAtoms: options.maxHistory || 50,
        trackComputed: true,
        trackWritable: true,
        trackPrimitive: true,
        ttl: ttlConfig,
        ...options.trackingConfig,
      } as Partial<TrackerConfig>,
      { logDisposal: options.logDisposal },
    );
    this.registerChild(this.atomTracker);

    this.snapshotCreator = new SnapshotCreator(
      store,
      {
        includeTypes: ["primitive", "computed", "writable"],
        excludeAtoms: options.excludeAtoms || [],
        validate: true,
        generateId: () => Math.random().toString(36).substring(2, 9),
        autoCapture: options.autoCapture ?? true,
        skipStateCheck: true, // Skip state check for initial capture
        ...options.snapshotConfig,
      } as Partial<SnapshotCreatorConfig>,
      { logDisposal: options.logDisposal },
    );
    this.registerChild(this.snapshotCreator);

    this.snapshotRestorer = new SnapshotRestorer(
      store,
      {
        validateBeforeRestore: true,
        strictMode: false,
        onAtomNotFound: "warn",
        batchRestore: true,
        ...options.restoreConfig,
      } as SnapshotRestorerConfig & Partial<TransactionalRestorerConfig> & Partial<RestorationConfig>,
      { logDisposal: options.logDisposal },
    );
    this.registerChild(this.snapshotRestorer);

    // Initialize delta components
    this.deltaCalculator = new DeltaCalculatorImpl({
      deepEqual: this.deltaConfig.changeDetection === "deep",
      skipEmpty: true,
    });

    this.deltaReconstructor = new SnapshotReconstructor({
      cache: this.deltaConfig.cacheReconstructed,
      maxCacheSize: this.deltaConfig.maxCacheSize,
      optimizePath: true,
    });

    // Initialize comparison components
    this.snapshotComparator = new SnapshotComparator();
    this.comparisonFormatter = new ComparisonFormatter(false);

    // Use DeltaAwareHistoryManager if delta snapshots are enabled
    if (this.useDeltaSnapshots) {
      this.historyManager = new DeltaAwareHistoryManager({
        incrementalSnapshot: this.deltaConfig,
        maxHistory: options.maxHistory || 50,
        compressionEnabled: true,
      });
    } else {
      this.historyManager = new HistoryManager(
        options.maxHistory || 50,
        undefined,
        { logDisposal: options.logDisposal },
      );
    }
    this.registerChild(this.historyManager as any);

    // HistoryNavigator works with both types via HistoryProvider interface
    this.historyNavigator = new HistoryNavigator(
      this.historyManager as any, // Safe cast since both implement required methods
      this.snapshotRestorer,
    );

    // Attach store to registry
    atomRegistry.attachStore(store, options.registryMode || "global");

    // Register initial atoms if provided
    if (options.atoms && Array.isArray(options.atoms)) {
      options.atoms.forEach((atom) => {
        this.atomTracker.track(atom);
        atomRegistry.register(atom, atom.name);
      });
    }

    // Wrap store.set
    store.set = this.wrappedSet.bind(this);

    // Track all subscriptions
    this.trackSubscriptions();

    // Always capture initial state (to have something to undo to)
    // The autoCapture setting will control subsequent auto-captures
    this.capture("initial");
  }

  /**
   * Capture current state as a snapshot
   * @param action - Optional action name for the snapshot
   * @returns The created snapshot or undefined if capture failed
   */
  capture(action?: string): Snapshot | undefined {
    if (this.isTimeTraveling) {
      return undefined;
    }

    console.log(`[TIME_TRAVEL.capture] action: ${action}`);
    const snapshot = this.snapshotCreator.create(
      action,
      new Set(this.atomTracker.getTrackedAtoms().map((atom) => atom.id)),
    );
    console.log(`[TIME_TRAVEL.capture] snapshot created: ${snapshot ? 'yes' : 'no'}`);
    if (snapshot) {
      console.log(`[TIME_TRAVEL.capture] snapshot state:`, Object.entries(snapshot.state).map(([k, v]) => ({ [k]: v.value })));
      this.historyManager.add(snapshot);
    }

    return snapshot || undefined;
  }

  /**
   * Capture current state with result metadata
   * @param action - Optional action name
   * @returns Creation result with metadata
   */
  captureWithResult(action?: string) {
    if (this.isTimeTraveling) {
      return {
        success: false,
        snapshot: null,
        error: "Cannot capture during time travel",
      };
    }

    const result = this.snapshotCreator.createWithResult(
      action,
      new Set(this.atomTracker.getTrackedAtoms().map((atom) => atom.id)),
    );

    if (result.success && result.snapshot) {
      this.historyManager.add(result.snapshot);
    }

    return result;
  }

  /**
   * Undo to previous snapshot
   * @returns True if undo was successful
   */
  undo(): boolean {
    if (this.isTimeTraveling) return false;

    this.isTimeTraveling = true;
    try {
      return this.historyNavigator.undo();
    } finally {
      this.isTimeTraveling = false;
    }
  }

  /**
   * Redo to next snapshot
   * @returns True if redo was successful
   */
  redo(): boolean {
    if (this.isTimeTraveling) return false;

    this.isTimeTraveling = true;
    try {
      return this.historyNavigator.redo();
    } finally {
      this.isTimeTraveling = false;
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.historyManager.canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.historyManager.canRedo();
  }

  /**
   * Jump to a specific snapshot by index
   * @param index - Index in the history array (0-based)
   * @returns True if jump was successful
   */
  jumpTo(index: number): boolean {
    if (this.isTimeTraveling) return false;

    this.isTimeTraveling = true;
    try {
      return this.historyNavigator.jumpTo(index);
    } finally {
      this.isTimeTraveling = false;
    }
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.historyManager.clear();

    // Note: clearHistory only clears history, it does not create a new initial snapshot
    // If you need to create a new initial snapshot, call capture("initial") explicitly
  }

  /**
   * Capture current state without checking tracked atoms (for initial/clear capture)
   * Reserved for future use
   * @internal
   */
  private __captureAllState(_action?: string): Snapshot | undefined {
    if (this.isTimeTraveling) {
      return undefined;
    }

    const snapshot = this.snapshotCreator.create();

    if (snapshot) {
      this.historyManager.add(snapshot);
    }

    return snapshot || undefined;
  }

  /**
   * Get complete history as an array of snapshots
   */
  getHistory(): Snapshot[] {
    return this.historyManager.getAll();
  }

  /**
   * Get history statistics
   */
  getHistoryStats() {
    return this.historyManager.getStats();
  }

  /**
   * Import external state
   * @param state - State to import
   * @returns True if import was successful
   */
  importState(state: Record<string, unknown>): boolean {
    this.isTimeTraveling = true;

    try {
      // Track atoms from imported state
      Object.entries(state).forEach(([key, value]) => {
        const atom = atomRegistry.getByName(key);
        if (atom) {
          this.originalSet(atom, value);
          this.atomTracker.track(atom, key);
        }
      });

      if (this.autoCapture) {
        this.capture("imported");
      }

      return true;
    } catch (error) {
      console.error("Failed to import state:", error);
      return false;
    } finally {
      this.isTimeTraveling = false;
    }
  }

  /**
   * Get current state as a snapshot (without storing in history)
   */
  getCurrentSnapshot(): Snapshot | null {
    return this.snapshotCreator.create(
      "current",
      new Set(this.atomTracker.getTrackedAtoms().map((atom) => atom.id)),
    );
  }

  /**
   * Compare two snapshots
   * @param a - First snapshot
   * @param b - Second snapshot
   * @returns Diff between snapshots
   */
  compareSnapshots(
    a: Snapshot | string,
    b: Snapshot | string,
    options?: Partial<ComparisonOptions>,
  ): SnapshotComparison {
    const snapshotA = typeof a === "string" ? this.getSnapshotById(a) : a;
    const snapshotB = typeof b === "string" ? this.getSnapshotById(b) : b;

    if (!snapshotA || !snapshotB) {
      throw new Error("Invalid snapshot reference");
    }

    return this.snapshotComparator.compare(snapshotA, snapshotB, options);
  }

  /**
   * Compare snapshot with current state
   * @param snapshot - Snapshot or snapshot ID to compare with current state
   * @param options - Comparison options
   * @returns Comparison result
   */
  compareWithCurrent(
    snapshot: Snapshot | string,
    options?: Partial<ComparisonOptions>,
  ): SnapshotComparison {
    const targetSnapshot = typeof snapshot === "string"
      ? this.getSnapshotById(snapshot)
      : snapshot;

    if (!targetSnapshot) {
      throw new Error("Invalid snapshot reference");
    }

    const currentSnapshot = this.getCurrentSnapshot();
    if (!currentSnapshot) {
      throw new Error("Failed to capture current state");
    }

    return this.snapshotComparator.compare(targetSnapshot, currentSnapshot, options);
  }

  /**
   * Get diff since specific action or time
   * @param action - Action name to compare since (optional)
   * @param options - Comparison options
   * @returns Comparison result or null if no snapshot found
   */
  getDiffSince(
    action?: string,
    options?: Partial<ComparisonOptions>,
  ): SnapshotComparison | null {
    const history = this.getHistory();

    if (history.length < 2) {
      return null;
    }

    let baseSnapshot: Snapshot | null = null;

    if (action) {
      // Find snapshot by action name
      baseSnapshot = history.find((s) => s.metadata.action === action) || null;
    }

    if (!baseSnapshot) {
      // Use the oldest snapshot as base
      baseSnapshot = history[0];
    }

    // Compare with the most recent snapshot
    const recentSnapshot = history[history.length - 1];

    return this.snapshotComparator.compare(baseSnapshot, recentSnapshot, options);
  }

  /**
   * Visualize changes between snapshots
   * @param comparison - Comparison result to visualize
   * @param format - Visualization format (tree or list)
   * @returns Formatted visualization string
   */
  visualizeChanges(
    comparison: SnapshotComparison,
    format: VisualizationFormat = "list",
  ): string {
    return this.comparisonFormatter.visualize(comparison, format);
  }

  /**
   * Export comparison result
   * @param comparison - Comparison result to export
   * @param format - Export format (json, html, md)
   * @returns Exported string
   */
  exportComparison(
    comparison: SnapshotComparison,
    format: ExportFormat,
  ): string {
    return this.comparisonFormatter.export(comparison, format);
  }

  /**
   * Get snapshot by ID from history
   * @param id - Snapshot ID
   * @returns Snapshot or null if not found
   */
  private getSnapshotById(id: string): Snapshot | null {
    return this.historyManager.getById(id);
  }

  /**
   * Subscribe to history changes
   * @param listener - Event listener
   * @returns Unsubscribe function
   */
  subscribe(listener: (event: any) => void): () => void {
    return this.historyManager.subscribe(listener);
  }

  /**
   * Subscribe to snapshot events
   * @param listener - Event listener
   * @returns Unsubscribe function
   */
  subscribeToSnapshots(listener: (snapshot: Snapshot) => void): () => void {
    return this.snapshotCreator.subscribe(listener);
  }

  /**
   * Subscribe to tracking events
   * @param listener - Event listener
   * @returns Unsubscribe function
   */
  subscribeToTracking(listener: (event: TrackingEvent) => void): () => void {
    return this.atomTracker.subscribe(listener);
  }

  /**
   * Get atom tracker instance
   */
  getAtomTracker(): AtomTracker {
    return this.atomTracker;
  }

  /**
   * Cleanup atoms manually
   * @param count Optional number of atoms to cleanup
   * @returns Cleanup result promise
   */
  async cleanupAtoms(count?: number): Promise<CleanupResult> {
    return this.atomTracker.cleanupNow(count);
  }

  /**
   * Get atoms eligible for cleanup (stale atoms)
   * @returns Array of stale tracked atoms
   */
  getStaleAtoms(): TrackedAtom[] {
    return this.atomTracker.getStaleAtoms();
  }

  /**
   * Mark specific atom for cleanup by name
   * @param atomName Atom name to forget
   * @returns True if atom was found and marked
   */
  forgetAtom(atomName: string): boolean {
    const atom = this.atomTracker.getAtomByName(atomName);
    if (atom) {
      this.atomTracker.markForCleanup(atom.id);
      return true;
    }
    return false;
  }

  /**
   * Get cleanup statistics
   */
  getCleanupStats(): CleanupResult & { totalCleanups: number; totalAtomsRemoved: number } {
    return this.atomTracker.getCleanupStats() as any;
  }

  /**
   * Get history manager instance
   */
  getHistoryManager(): HistoryManager | DeltaAwareHistoryManager {
    return this.historyManager;
  }

  /**
   * Get snapshot creator instance
   */
  getSnapshotCreator(): SnapshotCreator {
    return this.snapshotCreator;
  }

  /**
   * Get snapshot restorer instance
   */
  getSnapshotRestorer(): SnapshotRestorer {
    return this.snapshotRestorer;
  }

  /**
   * Restore with transaction support
   * @param snapshotId Snapshot ID to restore
   * @param options Restoration options
   * @returns Transactional restoration result
   */
  async restoreWithTransaction(
    snapshotId: string,
    options?: RestorationOptions,
  ): Promise<TransactionalRestorationResult> {
    const snapshot = this.historyManager.getById(snapshotId);
    if (!snapshot) {
      return {
        success: false,
        restoredCount: 0,
        totalAtoms: 0,
        errors: [`Snapshot ${snapshotId} not found`],
        warnings: [],
        duration: 0,
        timestamp: Date.now(),
        checkpointId: undefined,
        rollbackPerformed: false,
      };
    }

    return this.snapshotRestorer.restoreWithTransaction(snapshot, options);
  }

  /**
   * Get last checkpoint
   */
  getLastCheckpoint(): RestorationCheckpoint | null {
    return this.snapshotRestorer.getLastCheckpoint();
  }

  /**
   * Rollback to checkpoint
   * @param checkpointId Checkpoint ID
   * @returns Rollback result
   */
  async rollbackToCheckpoint(
    checkpointId: string,
  ): Promise<RollbackResult> {
    return this.snapshotRestorer.rollback(checkpointId);
  }

  /**
   * Get all checkpoints
   */
  getCheckpoints(): RestorationCheckpoint[] {
    return this.snapshotRestorer.getCheckpoints();
  }

  /**
   * Wrapped set method for auto-capture
   */
  private wrappedSet<Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
  ): void {
    console.log(`[WRAPPED_SET] Called with atom: ${atom.name}, value: ${update}, isTimeTraveling: ${this.isTimeTraveling}`);
    console.log(`[WRAPPED_SET] atom.id: ${atom.id?.toString()}, isTracked: ${this.atomTracker.isTracked(atom)}`);
    
    // Track atom if not already tracked
    if (!this.atomTracker.isTracked(atom)) {
      console.log(`[WRAPPED_SET] Tracking new atom: ${atom.name}`);
      this.atomTracker.track(atom);
      atomRegistry.register(atom, atom.name);
    } else {
      console.log(`[WRAPPED_SET] Atom already tracked`);
    }

    // Get old value for change tracking
    let oldValue: Value | undefined;
    try {
      oldValue = this.store.get(atom);
      console.log(`[WRAPPED_SET] Old value: ${oldValue}`);
    } catch {
      // Ignore if can't get old value
    }

    // Call original set
    console.log(`[WRAPPED_SET] Calling originalSet`);
    this.originalSet(atom, update);
    console.log(`[WRAPPED_SET] originalSet complete`);

    // Get new value
    let newValue: Value | undefined;
    try {
      newValue = this.store.get(atom);
      console.log(`[WRAPPED_SET] New value: ${newValue}`);
    } catch {
      // Ignore if can't get new value
    }

    // Record change
    if (oldValue !== undefined && newValue !== undefined) {
      this.atomTracker.recordChange(atom, oldValue, newValue);
    }

    // Auto-capture if enabled and not during time travel
    if (this.autoCapture && !this.isTimeTraveling) {
      console.log(`[WRAPPED_SET] Auto-capturing`);
      this.capture(`set ${atom.name || atom.id?.description || "atom"}`);
    }
  }

  /**
   * Pause auto-capture
   */
  pauseAutoCapture(): void {
    this.autoCapture = false;
  }

  /**
   * Resume auto-capture
   */
  resumeAutoCapture(): void {
    this.autoCapture = true;
  }

  /**
   * Check if time travel is in progress
   */
  isTraveling(): boolean {
    return this.isTimeTraveling;
  }

  /**
   * Get version
   */
  getVersion(): string {
    return "1.0.0";
  }

  /**
   * Get delta chain (raw delta snapshots)
   * @returns Array of delta snapshots
   */
  getDeltaChain(): DeltaSnapshot[] {
    if (this.historyManager instanceof DeltaAwareHistoryManager) {
      return this.historyManager.getDeltaSnapshots();
    }
    return [];
  }

  /**
   * Force creation of a full snapshot
   * Converts any pending deltas to a full snapshot
   */
  forceFullSnapshot(): void {
    if (this.historyManager instanceof DeltaAwareHistoryManager) {
      this.historyManager.forceFullSnapshot();
    } else {
      // For regular history manager, just capture current state
      this.capture("force-full");
    }
  }

  /**
   * Set delta compression strategy
   * @param strategy - Strategy configuration
   */
  setDeltaStrategy(strategy: DeltaCompressionFactoryConfig): void {
    if (this.historyManager instanceof DeltaAwareHistoryManager) {
      // Update delta config based on strategy
      const config = this.updateConfigFromStrategy(this.deltaConfig, strategy);
      this.deltaConfig = config;
      // Note: DeltaAwareHistoryManager would need a method to update config
      // For now, this updates the local config for future operations
    }
  }

  /**
   * Reconstruct to specific index
   * @param index - Index in history to reconstruct
   * @returns Reconstructed snapshot or null
   */
  reconstructTo(index: number): Snapshot | null {
    if (this.historyManager instanceof DeltaAwareHistoryManager) {
      return this.historyManager.getSnapshot(index);
    }
    // For regular history manager, just return the snapshot
    const snapshots = this.historyManager.getAll();
    return snapshots[index] || null;
  }

  /**
   * Get delta statistics
   */
  getDeltaStats() {
    if (this.historyManager instanceof DeltaAwareHistoryManager) {
      return this.historyManager.getDeltaStats();
    }
    return {
      deltaCount: 0,
      fullSnapshotCount: this.historyManager.getAll().length,
      activeChains: 0,
      totalDeltasInChains: 0,
      memoryUsage: 0,
    };
  }

  /**
   * Check if delta snapshots are enabled
   */
  isDeltaEnabled(): boolean {
    return this.useDeltaSnapshots;
  }

  /**
   * Get delta calculator instance
   */
  getDeltaCalculator(): DeltaCalculatorImpl {
    return this.deltaCalculator;
  }

  /**
   * Get delta reconstructor instance
   */
  getDeltaReconstructor(): SnapshotReconstructor {
    return this.deltaReconstructor;
  }

  /**
   * Update config from strategy helper
   */
  private updateConfigFromStrategy(
    config: IncrementalSnapshotConfig,
    strategy: DeltaCompressionFactoryConfig,
  ): IncrementalSnapshotConfig {
    // Update config based on strategy type
    if (strategy.strategy === "time" && strategy.time?.maxAge) {
      return { ...config, maxDeltaChainAge: strategy.time.maxAge };
    }
    if (strategy.strategy === "changes" && strategy.changes?.maxDeltas) {
      return { ...config, maxDeltaChainLength: strategy.changes.maxDeltas };
    }
    if (strategy.strategy === "size" && strategy.size?.maxSize) {
      return { ...config, maxDeltaChainSize: strategy.size.maxSize };
    }
    return config;
  }

  /**
   * Track all subscriptions for cleanup
   */
  private trackSubscriptions(): void {
    // Track history subscriptions
    const unsubscribeHistory = this.historyManager.subscribe((event) => {
      // Handle event - can be extended
      if (this.config.logDisposal) {
        console.log(`[TIME_TRAVEL.history] Event: ${event.type}`);
      }
    });
    this.subscriptions.add(unsubscribeHistory);

    // Track snapshot subscriptions
    const unsubscribeSnapshots = this.snapshotCreator.subscribe((snapshot) => {
      // Handle snapshot - can be extended
      if (this.config.logDisposal) {
        console.log(`[TIME_TRAVEL.snapshot] Created: ${snapshot.id}`);
      }
    });
    this.subscriptions.add(unsubscribeSnapshots);

    // Track tracking subscriptions
    const unsubscribeTracking = this.atomTracker.subscribe((event) => {
      // Handle tracking event - can be extended
      if (this.config.logDisposal) {
        console.log(`[TIME_TRAVEL.tracking] Event: ${event.type}`);
      }
    });
    this.subscriptions.add(unsubscribeTracking);
  }

  /**
   * Dispose time travel instance and clean up all resources
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    this.log("Disposing SimpleTimeTravel");

    // 1. Stop all operations
    this.pauseAutoCapture();

    // 2. Restore original store.set
    if (this.store && this.originalSet) {
      this.store.set = this.originalSet;
    }

    // 3. Clear all subscriptions
    this.subscriptions.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (e) {
        // Ignore errors during unsubscribe
      }
    });
    this.subscriptions.clear();

    // 4. Dispose all child components (in reverse order)
    const children = Array.from(this.children).reverse();
    for (const child of children) {
      try {
        await child.dispose();
      } catch (error) {
        console.error("Error disposing child:", error);
      }
    }
    this.children.clear();

    // 5. Clean up delta components
    if (this.deltaReconstructor) {
      this.deltaReconstructor.clearCache();
    }

    // 6. Clean up comparison components
    if (this.snapshotComparator) {
      this.snapshotComparator.clearCache();
    }

    // 7. Clear references
    this.store = null as any;
    this.originalSet = null as any;
    this.wrappedSet = null as any;

    // 8. Untrack from leak detector
    LeakDetector.untrack(this.instanceId);
    this.finalizationRegistry.untrack(this.instanceId);

    // 9. Run final callbacks
    await this.runDisposeCallbacks();

    this.disposed = true;
    this.log("SimpleTimeTravel disposed");
  }
}

// Extend TimeTravelOptions to include component-specific configs
declare module "../types" {
  interface TimeTravelOptions {
    /** Atoms to exclude from tracking */
    excludeAtoms?: string[];
    /** Tracking configuration */
    trackingConfig?: Partial<TrackerConfig>;
    /** Snapshot creator configuration */
    snapshotConfig?: Partial<SnapshotCreatorConfig>;
    /** Snapshot restorer configuration */
    restoreConfig?: Partial<SnapshotRestorerConfig>;
    /** History manager configuration */
    historyConfig?: HistoryManagerConfig;
    /** Disposal configuration */
    detectLeaks?: boolean;
  }
}
