/**
 * DeltaAwareHistoryManager - Optimized history manager with delta support
 *
 * This is an optimized version that uses dedicated services:
 * - DeltaProcessor: Delta computation and application
 * - SnapshotReconstructor: Snapshot reconstruction with caching
 * - DeepCloneService: Safe deep cloning
 * - DeltaSnapshotStorage: Delta snapshot storage management
 * - SnapshotStrategy: Decision-making for snapshot creation
 *
 * @example
 * // Using dependency injection
 * const services = DeltaAwareHistoryFactory.createServices(config);
 * const manager = DeltaAwareHistoryFactory.createManager(services, config);
 *
 * @example
 * // Using factory directly
 * const manager = DeltaAwareHistoryFactory.createManager(store, config);
 */

import type { Snapshot, AnySnapshot, DeltaSnapshot } from '../types';
import { HistoryManager } from '../core/HistoryManager';
import type { HistoryEvent } from '../core/types';

import { DeltaProcessor } from './DeltaProcessor';
import { SnapshotReconstructor } from './SnapshotReconstructor';
import { DeepCloneService } from './DeepCloneService';
import { DeltaChainManager } from './chain-manager';
import { DeltaSnapshotStorage } from './DeltaSnapshotStorage';
import { SnapshotStrategy, type DeltaChainInfo } from './SnapshotStrategy';
import {
  DEFAULT_INCREMENTAL_SNAPSHOT_CONFIG,
  type DeltaAwareHistoryManagerConfig,
  type DeltaHistoryStats,
} from './types';

/**
 * Injected services for DeltaAwareHistoryManager
 */
export interface DeltaAwareServices {
  historyManager: HistoryManager;
  deltaProcessor: DeltaProcessor;
  reconstructor: SnapshotReconstructor;
  cloneService: DeepCloneService;
  deltaChainManager: DeltaChainManager;
  deltaStorage: DeltaSnapshotStorage;
  snapshotStrategy: SnapshotStrategy;
}

/**
 * Optimized Delta-aware History Manager
 */
export class DeltaAwareHistoryManager {
  private historyManager: HistoryManager;
  private deltaProcessor: DeltaProcessor;
  private reconstructor: SnapshotReconstructor;
  private cloneService: DeepCloneService;
  private deltaChainManager: DeltaChainManager;
  private deltaStorage: DeltaSnapshotStorage;
  private snapshotStrategy: SnapshotStrategy;
  private config: DeltaAwareHistoryManagerConfig;

  // State
  private fullSnapshotCounter: number = 0;

  constructor(
    config: DeltaAwareHistoryManagerConfig = {},
    services?: DeltaAwareServices
  ) {
    this.config = {
      incrementalSnapshot: {
        ...DEFAULT_INCREMENTAL_SNAPSHOT_CONFIG,
        ...config.incrementalSnapshot,
      },
      maxHistory: config.maxHistory || 50,
      compressionEnabled: config.compressionEnabled ?? true,
    };

    // Use injected services if provided, otherwise create them
    if (services) {
      this.historyManager = services.historyManager;
      this.deltaProcessor = services.deltaProcessor;
      this.reconstructor = services.reconstructor;
      this.cloneService = services.cloneService;
      this.deltaChainManager = services.deltaChainManager;
      this.deltaStorage = services.deltaStorage;
      this.snapshotStrategy = services.snapshotStrategy;
    } else {
      // Create services inline for backward compatibility
      this.historyManager = new HistoryManager(this.config.maxHistory);

      // Initialize optimized services
      const useDeepEqual =
        this.config.incrementalSnapshot!.changeDetection === 'deep';
      this.deltaProcessor = new DeltaProcessor({
        deepEqual: useDeepEqual,
        skipEmpty: true,
      });
      this.cloneService = new DeepCloneService();
      this.reconstructor = new SnapshotReconstructor(this.deltaProcessor, {
        enableCache: true,
        maxCacheSize: 50,
        cacheTTL: 60000,
      });

      this.deltaChainManager = new DeltaChainManager({
        fullSnapshotInterval:
          this.config.incrementalSnapshot!.fullSnapshotInterval,
        maxDeltaChainLength:
          this.config.incrementalSnapshot!.maxDeltaChainLength,
        maxDeltaChainAge: this.config.incrementalSnapshot!.maxDeltaChainAge,
        maxDeltaChainSize: this.config.incrementalSnapshot!.maxDeltaChainSize,
      });

      this.deltaStorage = new DeltaSnapshotStorage();

      this.snapshotStrategy = new SnapshotStrategy({
        enabled: this.config.incrementalSnapshot!.enabled ?? true,
        fullSnapshotInterval:
          this.config.incrementalSnapshot!.fullSnapshotInterval ?? 10,
        maxDeltaChainLength:
          this.config.incrementalSnapshot!.maxDeltaChainLength ?? 5,
        maxDeltaChainAge:
          this.config.incrementalSnapshot!.maxDeltaChainAge ?? 5 * 60 * 1000,
        maxDeltaChainSize:
          this.config.incrementalSnapshot!.maxDeltaChainSize ?? 1024 * 1024,
      });
    }
  }

  /**
   * Add snapshot to history
   */
  add(snapshot: Snapshot): void {
    const current = this.historyManager.getCurrent();

    // Get delta chain info for strategy decision
    const chainInfo = this.getDeltaChainInfo();

    // Use strategy to decide whether to create delta
    const decision = this.snapshotStrategy.decide(
      current,
      this.fullSnapshotCounter,
      chainInfo
    );

    if (decision.shouldCreateDelta && current) {
      // Find base snapshot for delta
      const baseSnapshot = this.getBaseSnapshotForDelta(
        current,
        decision.baseSnapshotId
      );

      if (baseSnapshot) {
        // Compute delta using optimized processor
        const deltaResult = this.deltaProcessor.computeDelta(
          baseSnapshot,
          snapshot
        );

        if (deltaResult.delta && !deltaResult.isEmpty) {
          const delta = deltaResult.delta;

          // Store delta in both storage and chain manager
          this.deltaStorage.add(delta);
          this.deltaChainManager.addDelta(delta);
          this.historyManager.add(delta as AnySnapshot);

          // Reset counter since we created a delta
          this.fullSnapshotCounter = 0;
          return;
        }
      }
    }

    // Create full snapshot
    this.historyManager.add(snapshot);
    this.fullSnapshotCounter++;
  }

  /**
   * Get delta chain info for strategy decision
   */
  private getDeltaChainInfo(): DeltaChainInfo | undefined {
    const stats = this.deltaChainManager.getStats();
    const currentChainLength = stats.totalDeltasInChains ?? 0;

    if (currentChainLength === 0) {
      return undefined;
    }

    // Get root snapshot ID from chain
    const rootId = this.getRootSnapshotId();

    return {
      length: currentChainLength,
      age: 0, // Not available in current stats
      size: stats.memoryUsage ?? 0,
      rootId: rootId || 'unknown',
    };
  }

  /**
   * Get root snapshot ID from current chain
   */
  private getRootSnapshotId(): string | null {
    const allSnapshots = this.historyManager.getAll();
    for (let i = allSnapshots.length - 1; i >= 0; i--) {
      const s = allSnapshots[i];
      if (!this.isDeltaSnapshot(s)) {
        return s.id;
      }
    }
    return null;
  }

  /**
   * Get base snapshot for delta
   */
  private getBaseSnapshotForDelta(
    current: Snapshot,
    baseSnapshotId?: string
  ): Snapshot | null {
    // If base ID provided, try to find it
    if (baseSnapshotId) {
      const allSnapshots = this.historyManager.getAll();
      const base = allSnapshots.find((s) => s.id === baseSnapshotId);
      if (base && !this.isDeltaSnapshot(base)) {
        return base;
      }
    }

    // Fallback: find last full snapshot
    return this.getLastFullSnapshot(current);
  }

  /**
   * Get snapshot by index with optimized reconstruction
   */
  getSnapshot(index: number): Snapshot | null {
    const allSnapshots = this.historyManager.getAll();

    if (index < 0 || index >= allSnapshots.length) {
      return null;
    }

    const snapshot = allSnapshots[index];

    // If it's a delta, reconstruct full snapshot
    if (this.isDeltaSnapshot(snapshot)) {
      return this.reconstructSnapshot(snapshot);
    }

    // Return deep copy to avoid mutation
    return this.cloneService.cloneSnapshot(snapshot);
  }

  /**
   * Get all snapshots with optimized reconstruction
   */
  getAll(): Snapshot[] {
    const all = this.historyManager.getAll();
    return all.map((snapshot) => {
      if (this.isDeltaSnapshot(snapshot)) {
        return this.reconstructSnapshot(snapshot) || snapshot;
      }
      return this.cloneService.cloneSnapshot(snapshot);
    });
  }

  /**
   * Get snapshot by ID
   */
  getById(snapshotId: string): Snapshot | null {
    const all = this.historyManager.getAll();
    const snapshot = all.find((s) => s.id === snapshotId);

    if (snapshot && this.isDeltaSnapshot(snapshot)) {
      return this.reconstructSnapshot(snapshot) || snapshot;
    }

    return snapshot ? this.cloneService.cloneSnapshot(snapshot) : null;
  }

  /**
   * Undo to previous snapshot with optimized reconstruction
   */
  undo(): Snapshot | null {
    const result = this.historyManager.undo();

    if (result && this.isDeltaSnapshot(result)) {
      return this.reconstructSnapshot(result);
    }

    return result ? this.cloneService.cloneSnapshot(result) : null;
  }

  /**
   * Redo to next snapshot with optimized reconstruction
   */
  redo(): Snapshot | null {
    const result = this.historyManager.redo();

    if (result && this.isDeltaSnapshot(result)) {
      return this.reconstructSnapshot(result);
    }

    return result ? this.cloneService.cloneSnapshot(result) : null;
  }

  /**
   * Jump to specific index with optimized reconstruction
   */
  jumpTo(index: number): Snapshot | null {
    const result = this.historyManager.jumpTo(index);

    if (result && this.isDeltaSnapshot(result)) {
      return this.reconstructSnapshot(result);
    }

    return result ? this.cloneService.cloneSnapshot(result) : null;
  }

  /**
   * Reconstruct snapshot from delta using optimized reconstructor
   */
  private reconstructSnapshot(delta: DeltaSnapshot): Snapshot | null {
    // Find root in history
    const rootSnapshot = this.findRootSnapshotInHistory(delta);
    if (rootSnapshot) {
      return this.reconstructor.reconstruct(delta, rootSnapshot);
    }

    return null;
  }

  /**
   * Get last full (non-delta) snapshot from history
   */
  private getLastFullSnapshot(current: Snapshot): Snapshot | null {
    // If current is not a delta, return it
    if (!this.isDeltaSnapshot(current)) {
      return current;
    }

    // Walk backwards through history to find the last full snapshot
    const allSnapshots = this.historyManager.getAll();
    for (let i = allSnapshots.length - 1; i >= 0; i--) {
      const s = allSnapshots[i];
      if (!this.isDeltaSnapshot(s)) {
        return s;
      }
    }

    return null;
  }

  /**
   * Find root snapshot in history
   */
  private findRootSnapshotInHistory(delta: DeltaSnapshot): Snapshot | null {
    const visited = new Set<string>();
    let current: Snapshot | null = delta;

    while (current && this.isDeltaSnapshot(current)) {
      if (visited.has(current.id)) {
        return null;
      }
      visited.add(current.id);

      const baseId: string | null | undefined = (current as DeltaSnapshot)
        .baseSnapshotId;
      if (!baseId) {
        return null;
      }

      const allSnapshots = this.historyManager.getAll();
      const baseSnapshot: Snapshot | undefined = allSnapshots.find(
        (s) => s.id === baseId
      );

      if (!baseSnapshot) {
        return null;
      }

      if (!this.isDeltaSnapshot(baseSnapshot)) {
        return baseSnapshot;
      }

      current = baseSnapshot;
    }

    return current;
  }

  /**
   * Check if snapshot is a delta
   */
  private isDeltaSnapshot(snapshot: Snapshot): snapshot is DeltaSnapshot {
    return (snapshot as DeltaSnapshot).type === 'delta';
  }

  /**
   * Get current snapshot
   */
  getCurrent(): Snapshot | null {
    return this.historyManager.getCurrent();
  }

  /**
   * Get history statistics
   */
  getStats(): DeltaHistoryStats {
    return {
      standard: this.historyManager.getStats(),
      delta: this.deltaChainManager.getStats(),
      memoryEfficiency: this.calculateMemoryEfficiency(),
    };
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
   * Clear all history
   */
  clear(): void {
    this.historyManager.clear();
    this.reconstructor.clearCache();
    this.deltaChainManager.clear();
    this.deltaStorage.clear();
    this.fullSnapshotCounter = 0;
  }

  /**
   * Subscribe to history events
   */
  subscribe(listener: (event: HistoryEvent) => void): () => void {
    return this.historyManager.subscribe(listener);
  }

  /**
   * Force creation of full snapshot
   */
  forceFullSnapshot(): void {
    const all = this.historyManager.getAll();
    this.historyManager.clear();
    this.deltaChainManager.clear();
    this.deltaStorage.clear();
    this.reconstructor.clearCache();
    this.fullSnapshotCounter = 0;

    // Reconstruct all deltas as full snapshots
    for (const snapshot of all) {
      if (this.isDeltaSnapshot(snapshot)) {
        const reconstructed = this.reconstructSnapshot(snapshot);
        if (reconstructed) {
          this.historyManager.add(reconstructed);
        }
      } else {
        this.historyManager.add(snapshot);
      }
    }
  }

  /**
   * Calculate memory efficiency
   */
  private calculateMemoryEfficiency(): number {
    const deltaStats = this.deltaChainManager.getStats();

    if (deltaStats.totalDeltasInChains === 0) {
      return 1; // No deltas, 100% efficiency
    }

    // Simplified estimation
    const totalDeltas = deltaStats.totalDeltasInChains;
    const avgDeltaSize = deltaStats.averageDeltaSize;
    const avgSnapshotSize = 10000; // Assume 10KB average snapshot

    const deltaMemory = totalDeltas * avgDeltaSize;
    const fullSnapshotMemory = totalDeltas * avgSnapshotSize;

    return deltaMemory / fullSnapshotMemory;
  }

  /**
   * Get delta processor
   */
  getDeltaProcessor(): DeltaProcessor {
    return this.deltaProcessor;
  }

  /**
   * Get reconstructor
   */
  getReconstructor(): SnapshotReconstructor {
    return this.reconstructor;
  }

  /**
   * Get clone service
   */
  getCloneService(): DeepCloneService {
    return this.cloneService;
  }
}

/**
 * Default delta history manager configuration
 */
export const DEFAULT_DELTA_HISTORY_CONFIG: DeltaAwareHistoryManagerConfig = {
  incrementalSnapshot: {
    enabled: true,
    fullSnapshotInterval: 10,
    maxDeltaChainLength: 5,
    maxDeltaChainAge: 5 * 60 * 1000,
    maxDeltaChainSize: 1024 * 1024,
    changeDetection: 'shallow',
    reconstructOnDemand: true,
    cacheReconstructed: true,
    maxCacheSize: 100,
    compressionLevel: 'none',
  },
  maxHistory: 50,
  compressionEnabled: true,
};
