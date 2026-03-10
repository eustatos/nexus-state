/**
 * DeltaAwareHistoryFactory - Factory for creating DeltaAwareHistoryManager with dependencies
 *
 * This factory creates and configures all delta-aware history services,
 * providing dependency injection for the DeltaAwareHistoryManager.
 */

import { HistoryManager } from '../core/HistoryManager';
import { DeltaProcessor } from './DeltaProcessor';
import { SnapshotReconstructor } from './SnapshotReconstructor';
import { DeepCloneService } from './DeepCloneService';
import { DeltaChainManager } from './chain-manager';
import { DeltaSnapshotStorage } from './DeltaSnapshotStorage';
import { SnapshotStrategy } from './SnapshotStrategy';
import { DeltaAwareHistoryManager, type DeltaAwareServices } from './DeltaAwareHistoryManager';
import type { DeltaAwareHistoryManagerConfig } from './types';

/**
 * Factory result containing all created services
 */
export interface DeltaAwareServicesResult {
  historyManager: HistoryManager;
  deltaProcessor: DeltaProcessor;
  reconstructor: SnapshotReconstructor;
  cloneService: DeepCloneService;
  deltaChainManager: DeltaChainManager;
  deltaStorage: DeltaSnapshotStorage;
  snapshotStrategy: SnapshotStrategy;
}

/**
 * Factory configuration options
 */
export interface DeltaAwareHistoryFactoryConfig extends DeltaAwareHistoryManagerConfig {
  /**
   * Enable dependency injection mode
   * When true, returns services separately for manual DI
   */
  diMode?: boolean;
}

/**
 * DeltaAwareHistoryFactory provides factory methods for creating
 * DeltaAwareHistoryManager with proper dependency injection
 */
export class DeltaAwareHistoryFactory {
  /**
   * Create all delta-aware history services
   * @param config Factory configuration
   * @returns Created services
   */
  static createServices(
    config?: Partial<DeltaAwareHistoryFactoryConfig>
  ): DeltaAwareServicesResult {
    const resolvedConfig: DeltaAwareHistoryManagerConfig = {
      incrementalSnapshot: {
        enabled: config?.incrementalSnapshot?.enabled ?? true,
        fullSnapshotInterval: config?.incrementalSnapshot?.fullSnapshotInterval ?? 10,
        maxDeltaChainLength: config?.incrementalSnapshot?.maxDeltaChainLength ?? 5,
        maxDeltaChainAge: config?.incrementalSnapshot?.maxDeltaChainAge ?? 5 * 60 * 1000,
        maxDeltaChainSize: config?.incrementalSnapshot?.maxDeltaChainSize ?? 1024 * 1024,
        changeDetection: config?.incrementalSnapshot?.changeDetection ?? 'shallow',
        reconstructOnDemand: config?.incrementalSnapshot?.reconstructOnDemand ?? true,
        cacheReconstructed: config?.incrementalSnapshot?.cacheReconstructed ?? true,
        maxCacheSize: config?.incrementalSnapshot?.maxCacheSize ?? 100,
        compressionLevel: config?.incrementalSnapshot?.compressionLevel ?? 'none',
      },
      maxHistory: config?.maxHistory ?? 50,
      compressionEnabled: config?.compressionEnabled ?? true,
    };

    // Create services with proper dependencies
    const historyManager = new HistoryManager(resolvedConfig.maxHistory);

    const useDeepEqual =
      resolvedConfig.incrementalSnapshot!.changeDetection === 'deep';
    const deltaProcessor = new DeltaProcessor({
      deepEqual: useDeepEqual,
      skipEmpty: true,
    });

    const cloneService = new DeepCloneService();

    const reconstructor = new SnapshotReconstructor(deltaProcessor, {
      enableCache: true,
      maxCacheSize: 50,
      cacheTTL: 60000,
    });

    const deltaChainManager = new DeltaChainManager({
      fullSnapshotInterval:
        resolvedConfig.incrementalSnapshot!.fullSnapshotInterval,
      maxDeltaChainLength:
        resolvedConfig.incrementalSnapshot!.maxDeltaChainLength,
      maxDeltaChainAge: resolvedConfig.incrementalSnapshot!.maxDeltaChainAge,
      maxDeltaChainSize: resolvedConfig.incrementalSnapshot!.maxDeltaChainSize,
    });

    const deltaStorage = new DeltaSnapshotStorage();

    const snapshotStrategy = new SnapshotStrategy({
      enabled: resolvedConfig.incrementalSnapshot!.enabled ?? true,
      fullSnapshotInterval:
        resolvedConfig.incrementalSnapshot!.fullSnapshotInterval ?? 10,
      maxDeltaChainLength:
        resolvedConfig.incrementalSnapshot!.maxDeltaChainLength ?? 5,
      maxDeltaChainAge:
        resolvedConfig.incrementalSnapshot!.maxDeltaChainAge ?? 5 * 60 * 1000,
      maxDeltaChainSize:
        resolvedConfig.incrementalSnapshot!.maxDeltaChainSize ?? 1024 * 1024,
    });

    return {
      historyManager,
      deltaProcessor,
      reconstructor,
      cloneService,
      deltaChainManager,
      deltaStorage,
      snapshotStrategy,
    };
  }

  /**
   * Create DeltaAwareHistoryManager with injected dependencies
   * @param config Manager configuration
   * @returns Configured DeltaAwareHistoryManager
   */
  static createManager(
    config?: Partial<DeltaAwareHistoryFactoryConfig>
  ): DeltaAwareHistoryManager {
    const services = this.createServices(config);

    const manager = new DeltaAwareHistoryManager(config, services);

    return manager;
  }

  /**
   * Create DeltaAwareHistoryManager with custom services
   * @param services Pre-created services
   * @param config Manager configuration
   * @returns Configured DeltaAwareHistoryManager
   */
  static createManagerWithServices(
    services: DeltaAwareServices,
    config?: Partial<DeltaAwareHistoryManagerConfig>
  ): DeltaAwareHistoryManager {
    const manager = new DeltaAwareHistoryManager(config, services);

    return manager;
  }
}
