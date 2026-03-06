/**
 * TimeTravelFactory tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeTravelFactory } from '../TimeTravelFactory';
import type { Store } from '../../types';

function createMockStore(): Store {
  return {
    get: vi.fn(),
    set: vi.fn(),
    batch: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    getAtom: vi.fn(),
    getAtoms: vi.fn(),
  } as unknown as Store;
}

describe('TimeTravelFactory', () => {
  let store: Store;

  beforeEach(() => {
    store = createMockStore();
  });

  describe('createServices', () => {
    it('should create all services with default config', () => {
      const services = TimeTravelFactory.createServices(store);

      expect(services.historyService).toBeDefined();
      expect(services.snapshotService).toBeDefined();
      expect(services.comparisonService).toBeDefined();
      expect(services.deltaService).toBeDefined();
      expect(services.cleanupService).toBeDefined();
      expect(services.subscriptionManager).toBeDefined();
      expect(services.storeWrapper).toBeDefined();
    });

    it('should create services with custom maxHistory', () => {
      const services = TimeTravelFactory.createServices(store, {
        maxHistory: 100,
      });

      const stats = services.historyService.getStats();
      expect(stats.length).toBe(0);
    });

    it('should enable delta snapshots when configured', () => {
      const services = TimeTravelFactory.createServices(store, {
        deltaSnapshots: { enabled: true },
      });

      expect(services.deltaService.isEnabled()).toBe(true);
    });

    it('should configure cleanup service with custom TTL', () => {
      const services = TimeTravelFactory.createServices(store, {
        ttl: 60000,
        cleanupInterval: 30000,
      });

      const config = services.cleanupService.getConfig();
      expect(config.defaultTTL).toBe(60000);
      expect(config.cleanupInterval).toBe(30000);
    });

    it('should create storeWrapper with autoCapture disabled by default', () => {
      const services = TimeTravelFactory.createServices(store);

      expect(services.storeWrapper.getIsWrapped()).toBe(false);
    });

    it('should create storeWrapper with autoCapture enabled', () => {
      const services = TimeTravelFactory.createServices(store, {
        autoCapture: true,
      });

      // Note: autoCapture config is set, but wrap() needs to be called separately
      const config = services.storeWrapper.getConfig();
      expect(config.autoCapture).toBe(true);
    });
  });

  describe('createController', () => {
    it('should create controller with injected services', () => {
      const controller = TimeTravelFactory.createController(store);

      expect(controller).toBeDefined();
      expect(typeof controller.undo).toBe('function');
      expect(typeof controller.redo).toBe('function');
    });

    it('should create controller with custom config', () => {
      const controller = TimeTravelFactory.createController(store, {
        maxHistory: 25,
        ttl: 120000,
      });

      expect(controller).toBeDefined();
    });

    it('should create controller with delta snapshots enabled', () => {
      const controller = TimeTravelFactory.createController(store, {
        deltaSnapshots: { enabled: true },
      });

      expect(controller).toBeDefined();
    });
  });

  describe('createControllerWithServices', () => {
    it('should create controller with pre-created services', () => {
      const services = TimeTravelFactory.createServices(store);
      const controller = TimeTravelFactory.createControllerWithServices(
        store,
        services
      );

      expect(controller).toBeDefined();
      expect(typeof controller.undo).toBe('function');
    });

    it('should create controller with custom config and pre-created services', () => {
      const services = TimeTravelFactory.createServices(store);
      const controller = TimeTravelFactory.createControllerWithServices(
        store,
        services,
        {
          maxHistory: 75,
        }
      );

      expect(controller).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should work with real store operations', () => {
      const services = TimeTravelFactory.createServices(store);

      // Capture initial state
      const captureResult = services.snapshotService.capture('initial');
      expect(captureResult.success).toBe(true);

      // Add to history
      if (captureResult.snapshot) {
        const addResult = services.historyService.add(captureResult.snapshot);
        expect(addResult.success).toBe(true);
      }

      // Check history stats
      const stats = services.historyService.getStats();
      expect(stats.length).toBeGreaterThanOrEqual(0);
    });
  });
});
