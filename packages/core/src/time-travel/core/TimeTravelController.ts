/**
 * TimeTravelController - Main time travel controller (Facade)
 *
 * DECOMPOSED VERSION
 *
 * This class coordinates time travel components through dedicated services:
 * - TimeTravelApiService: Core API (undo/redo/capture/jump)
 * - TimeTravelStateManager: State management (isTimeTraveling, autoCapture)
 * - TimeTravelEventEmitter: Event emission
 * - TimeTravelConfigManager: Configuration
 * - TimeTravelComparisonFacade: Comparison operations
 * - TimeTravelTransactionalFacade: Transactional operations
 * - TimeTravelMetricsService: Metrics and statistics
 */

import type { Snapshot, Store, TimeTravelAPI } from '../../types';
import type {
  TimeTravelOptions,
  RestorationOptions,
  TransactionalRestorationResult,
  RollbackResult,
  RestorationCheckpoint,
} from '../types';
import type { DeltaSnapshot } from '../delta/types';
import type { TimeTravelEvent, TimeTravelEventType } from './SubscriptionManager';
import type { ComparisonResult, TimeTravelControllerConfig } from './types';

import { HistoryService } from './HistoryService';
import { SnapshotService } from './SnapshotService';
import { ComparisonService } from './ComparisonService';
import { DeltaService } from './DeltaService';
import { CleanupService } from './CleanupService';
import { SubscriptionManager } from './SubscriptionManager';
import { StoreWrapper } from './StoreWrapper';

import { TimeTravelApiService } from './TimeTravelApiService';
import { TimeTravelStateManager } from './TimeTravelStateManager';
import { TimeTravelEventEmitter } from './TimeTravelEventEmitter';
import { TimeTravelConfigManager } from './TimeTravelConfigManager';
import { TimeTravelComparisonFacade } from './TimeTravelComparisonFacade';
import { TimeTravelTransactionalFacade } from './TimeTravelTransactionalFacade';
import { TimeTravelMetricsService } from './TimeTravelMetricsService';

import { BaseDisposable, type DisposableConfig } from './disposable';
import { storeLogger as logger } from '../../debug';

export interface TimeTravelControllerConfigExtended extends TimeTravelControllerConfig {
  /** Disposable config */
  disposal?: DisposableConfig;
  /** Injected services (for DI mode) */
  injectedServices?: any; // TimeTravelServices - defined in TimeTravelFactory
}

// Export for factory usage
export type { TimeTravelControllerConfig };

/**
 * TimeTravelController provides time travel debugging capabilities
 * for Nexus State store
 *
 * DECOMPOSED ARCHITECTURE:
 * - Delegates work to specialized services
 * - Maintains backward compatibility with TimeTravelAPI interface
 */
export class TimeTravelController extends BaseDisposable implements TimeTravelAPI {
  private store: Store;

  // Core services (existing)
  private historyService: HistoryService;
  private snapshotService: SnapshotService;
  private comparisonService: ComparisonService;
  private deltaService: DeltaService;
  private cleanupService: CleanupService;
  private subscriptionManager: SubscriptionManager;
  private storeWrapper: StoreWrapper;

  // New decomposed services
  private apiService: TimeTravelApiService;
  private stateManager: TimeTravelStateManager;
  private eventEmitter: TimeTravelEventEmitter;
  private configManager: TimeTravelConfigManager;
  private comparisonFacade: TimeTravelComparisonFacade;
  private transactionalFacade: TimeTravelTransactionalFacade;
  private metricsService: TimeTravelMetricsService;

  constructor(store: Store, options?: Partial<TimeTravelControllerConfigExtended>) {
    super(options?.disposal);

    this.store = store;

    // Initialize configuration manager first
    this.configManager = new TimeTravelConfigManager(options);

    // Support both new (deltaSnapshots.enabled) and legacy formats
    const enableDeltaSnapshots = options?.deltaSnapshots?.enabled ?? false;
    const autoCapture = this.configManager.getAutoCapture();

    // Create core services
    this.historyService = new HistoryService(store, {
      maxHistory: this.configManager.getMaxHistory(),
      useDeltaSnapshots: enableDeltaSnapshots,
    });

    this.snapshotService = new SnapshotService(store, {
      restorer: {
        validateBeforeRestore: true,
        batchRestore: true,
      },
      restoration: {
        validateBeforeRestore: true,
        batchRestore: true,
        rollbackOnError: true,
      },
      transactional: {
        enableTransactions: true,
        rollbackOnError: true,
      },
    });

    this.comparisonService = new ComparisonService();
    this.deltaService = new DeltaService({
      enabled: enableDeltaSnapshots,
    });

    this.cleanupService = new CleanupService({
      enabled: true,
      defaultTTL: this.configManager.getTTL(),
      cleanupInterval: this.configManager.getCleanupInterval(),
    });

    this.subscriptionManager = new SubscriptionManager();
    this.storeWrapper = new StoreWrapper(store, this.snapshotService, {
      autoCapture,
    });

    // Initialize decomposed services
    this.eventEmitter = new TimeTravelEventEmitter(this.subscriptionManager);
    this.stateManager = new TimeTravelStateManager({ autoCapture });

    this.apiService = new TimeTravelApiService(
      this.historyService,
      this.snapshotService,
      this.eventEmitter,
      { autoCapture }
    );

    this.comparisonFacade = new TimeTravelComparisonFacade(
      this.historyService,
      this.comparisonService
    );

    this.transactionalFacade = new TimeTravelTransactionalFacade(
      this.snapshotService,
      this.historyService
    );

    this.metricsService = new TimeTravelMetricsService(
      this.deltaService,
      this.cleanupService,
      this.historyService
    );

    // Wrap store.set for auto-capture
    if (autoCapture) {
      this.storeWrapper.wrap();
      this.cleanupService.startAutoCleanup();
    }

    logger.log('[TimeTravelController] Initialized (decomposed version)');
  }

  // ==================== API SERVICE DELEGATES ====================

  /**
   * Capture a snapshot of current state
   */
  capture(action?: string): Snapshot | undefined {
    return this.apiService.capture(action);
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    return this.stateManager.withTimeTravel(() => this.apiService.undo());
  }

  /**
   * Redo previously undone action
   */
  redo(): boolean {
    return this.stateManager.withTimeTravel(() => this.apiService.redo());
  }

  /**
   * Jump to specific snapshot
   */
  jumpTo(snapshotIdOrIndex: string | number): boolean {
    return this.stateManager.withTimeTravel(() => {
      if (typeof snapshotIdOrIndex === 'number') {
        return this.apiService.jumpToIndex(snapshotIdOrIndex);
      }
      return this.apiService.jumpTo(snapshotIdOrIndex);
    });
  }

  /**
   * Jump to specific index in history
   */
  jumpToIndex(index: number): boolean {
    return this.jumpTo(index);
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.apiService.canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.apiService.canRedo();
  }

  /**
   * Get current snapshot
   */
  getCurrentSnapshot(): Snapshot | undefined {
    return this.apiService.getCurrentSnapshot();
  }

  /**
   * Get history length
   */
  getHistoryLength(): number {
    return this.apiService.getHistoryLength();
  }

  /**
   * Get all history snapshots
   */
  getAllHistory(): Snapshot[] {
    return this.apiService.getAllHistory();
  }

  /**
   * Get history statistics
   */
  getHistoryStats(): {
    length: number;
    currentIndex: number;
    canUndo: boolean;
    canRedo: boolean;
  } {
    return this.apiService.getHistoryStats();
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.apiService.clearHistory();
  }

  /**
   * Get history
   */
  getHistory(): Snapshot[] {
    return this.apiService.getHistory();
  }

  // ==================== EVENT EMITTER DELEGATES ====================

  /**
   * Subscribe to time travel events
   */
  subscribe(
    eventType: TimeTravelEventType,
    listener: (event: TimeTravelEvent) => void
  ): () => void {
    return this.eventEmitter.subscribe(eventType, listener);
  }

  // ==================== COMPARISON FACADE DELEGATES ====================

  /**
   * Compare two snapshots
   */
  compareSnapshots(
    a: Snapshot | string,
    b: Snapshot | string,
    options?: any
  ): ComparisonResult {
    return this.comparisonFacade.compareSnapshots(a, b, options);
  }

  /**
   * Compare snapshot with current state
   */
  compareWithCurrent(snapshot: Snapshot | string, options?: any): any {
    return this.comparisonFacade.compareWithCurrent(snapshot, options);
  }

  /**
   * Get diff since action or time
   */
  getDiffSince(action?: string, options?: any): ComparisonResult | null {
    return this.comparisonFacade.getDiffSince(action, options);
  }

  /**
   * Visualize changes between snapshots
   */
  visualizeChanges(comparison: ComparisonResult, format?: string): string {
    return this.comparisonFacade.visualizeChanges(comparison, format);
  }

  /**
   * Export comparison result
   */
  exportComparison(comparison: ComparisonResult, format: string): string {
    return this.comparisonFacade.exportComparison(comparison, format);
  }

  // ==================== TRANSACTIONAL FACADE DELEGATES ====================

  /**
   * Restore state from snapshot with transaction support
   */
  restoreWithTransaction(
    snapshotId: string,
    options?: RestorationOptions
  ): Promise<TransactionalRestorationResult> {
    return this.transactionalFacade.restoreWithTransaction(snapshotId, options);
  }

  /**
   * Get last checkpoint
   */
  getLastCheckpoint(): RestorationCheckpoint | null {
    return this.transactionalFacade.getLastCheckpoint();
  }

  /**
   * Rollback to checkpoint
   */
  rollbackToCheckpoint(checkpointId: string): Promise<RollbackResult> {
    return this.transactionalFacade.rollbackToCheckpoint(checkpointId);
  }

  /**
   * Get checkpoints
   */
  getCheckpoints(): RestorationCheckpoint[] {
    return this.transactionalFacade.getCheckpoints();
  }

  /**
   * Import state
   */
  importState(state: Record<string, unknown>): boolean {
    return this.transactionalFacade.importState(state);
  }

  /**
   * Rollback (alias for rollbackToCheckpoint)
   */
  rollback(checkpointId: string): Promise<RollbackResult> {
    return this.transactionalFacade.rollback(checkpointId);
  }

  // ==================== METRICS SERVICE DELEGATES ====================

  /**
   * Get delta statistics
   */
  getDeltaStats(): any {
    return this.metricsService.getDeltaStats();
  }

  /**
   * Get cleanup statistics
   */
  getCleanupStats(): any {
    return this.metricsService.getCleanupStats();
  }

  // ==================== STATE MANAGER DELEGATES ====================

  /**
   * Check if time travel is in progress
   */
  isTraveling(): boolean {
    return this.stateManager.isTraveling();
  }

  // ==================== CONFIG MANAGER DELEGATES ====================

  /**
   * Get configuration
   */
  getConfig(): TimeTravelControllerConfig {
    return this.configManager.getConfig();
  }

  /**
   * Update configuration
   */
  configure(config: Partial<TimeTravelControllerConfig>): void {
    this.configManager.configure(config);

    // Propagate config changes to services
    this.historyService.configure({
      maxHistory: config.maxHistory,
    });

    this.cleanupService.configure({
      defaultTTL: config.ttl,
      cleanupInterval: config.cleanupInterval,
    });

    this.stateManager.configure({ autoCapture: config.autoCapture });
    this.apiService.configure({ autoCapture: config.autoCapture });

    // Handle autoCapture toggle
    if (config.autoCapture !== undefined) {
      if (config.autoCapture) {
        this.storeWrapper.wrap();
        this.cleanupService.startAutoCleanup();
      } else {
        this.storeWrapper.unwrap();
        this.cleanupService.stopAutoCleanup();
      }
    }
  }

  // ==================== DIRECT SERVICE ACCESS ====================

  /**
   * Get the history service
   */
  getHistoryService(): HistoryService {
    return this.historyService;
  }

  /**
   * Get the snapshot service
   */
  getSnapshotService(): SnapshotService {
    return this.snapshotService;
  }

  /**
   * Get the comparison service
   */
  getComparisonService(): ComparisonService {
    return this.comparisonService;
  }

  /**
   * Get the delta service
   */
  getDeltaService(): DeltaService {
    return this.deltaService;
  }

  /**
   * Get the cleanup service
   */
  getCleanupService(): CleanupService {
    return this.cleanupService;
  }

  /**
   * Get the subscription manager
   */
  getSubscriptionManager(): SubscriptionManager {
    return this.subscriptionManager;
  }

  /**
   * Get the store wrapper
   */
  getStoreWrapper(): StoreWrapper {
    return this.storeWrapper;
  }

  // ==================== LIFECYCLE ====================

  /**
   * Dispose time travel controller
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    logger.log('[TimeTravelController] Disposing');

    // Unwrap store.set
    this.storeWrapper.unwrap();

    // Stop auto-cleanup
    this.cleanupService.stopAutoCleanup();

    // Clear subscriptions
    this.eventEmitter.unsubscribeAll();

    // Clear history
    this.apiService.clearHistory();

    // Dispose services
    this.cleanupService.dispose();
    this.storeWrapper.dispose();

    // Dispose children
    await this.disposeChildren();

    // Run callbacks
    await this.runDisposeCallbacks();

    this.disposed = true;
    logger.log('[TimeTravelController] Disposed');
  }
}
