/**
 * TimeTravelFactory - Factory for creating TimeTravelController with dependencies
 *
 * This factory creates and configures all time travel services,
 * providing dependency injection for the TimeTravelController.
 */

import type { Store } from '../../types';
import type { TimeTravelControllerConfigExtended } from './TimeTravelController';
import { TimeTravelController } from './TimeTravelController';
import { HistoryService } from './HistoryService';
import { SnapshotService } from './SnapshotService';
import { ComparisonService } from './ComparisonService';
import { DeltaService } from './DeltaService';
import { CleanupService } from './CleanupService';
import { SubscriptionManager } from './SubscriptionManager';
import { StoreWrapper } from './StoreWrapper';

/**
 * Factory result containing all created services
 */
export interface TimeTravelServices {
  historyService: HistoryService;
  snapshotService: SnapshotService;
  comparisonService: ComparisonService;
  deltaService: DeltaService;
  cleanupService: CleanupService;
  subscriptionManager: SubscriptionManager;
  storeWrapper: StoreWrapper;
}

/**
 * Factory configuration options
 */
export interface TimeTravelFactoryConfig extends TimeTravelControllerConfigExtended {
  /**
   * Enable dependency injection mode
   * When true, returns services separately for manual DI
   */
  diMode?: boolean;
}

/**
 * TimeTravelFactory provides factory methods for creating
 * TimeTravelController with proper dependency injection
 */
export class TimeTravelFactory {
  /**
   * Create all time travel services
   * @param store Store instance
   * @param config Factory configuration
   * @returns Created services
   */
  static createServices(
    store: Store,
    config?: Partial<TimeTravelFactoryConfig>
  ): TimeTravelServices {
    // Support both new (deltaSnapshots.enabled) and legacy formats
    const enableDeltaSnapshots = config?.deltaSnapshots?.enabled ?? false;

    // Create services with proper dependencies
    const snapshotService = new SnapshotService(store, {
      creator: {
        skipStateCheck: true,
      },
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

    const historyService = new HistoryService(store, {
      maxHistory: config?.maxHistory ?? 50,
      useDeltaSnapshots: enableDeltaSnapshots,
    });

    const comparisonService = new ComparisonService();

    const deltaService = new DeltaService({
      enabled: enableDeltaSnapshots,
    });

    const cleanupService = new CleanupService({
      enabled: true,
      defaultTTL: config?.ttl ?? 300000,
      cleanupInterval: config?.cleanupInterval ?? 60000,
    });

    const subscriptionManager = new SubscriptionManager();

    const autoCapture = config?.autoCapture ?? false;
    const storeWrapper = new StoreWrapper(store, snapshotService, {
      autoCapture,
    });

    return {
      historyService,
      snapshotService,
      comparisonService,
      deltaService,
      cleanupService,
      subscriptionManager,
      storeWrapper,
    };
  }

  /**
   * Create TimeTravelController with injected dependencies
   * @param store Store instance
   * @param config Controller configuration
   * @returns Configured TimeTravelController
   */
  static createController(
    store: Store,
    config?: Partial<TimeTravelFactoryConfig>
  ): TimeTravelController {
    const services = this.createServices(store, config);

    const controller = new TimeTravelController(store, {
      ...config,
      injectedServices: services,
    });

    return controller;
  }

  /**
   * Create TimeTravelController with custom services
   * @param store Store instance
   * @param services Pre-created services
   * @param config Controller configuration
   * @returns Configured TimeTravelController
   */
  static createControllerWithServices(
    store: Store,
    services: TimeTravelServices,
    config?: Partial<TimeTravelControllerConfigExtended>
  ): TimeTravelController {
    const controller = new TimeTravelController(store, {
      ...config,
      injectedServices: services,
    });

    return controller;
  }
}
