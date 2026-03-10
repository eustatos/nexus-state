/**
 * AtomTracker tests with dependency injection
 * Tests the facade pattern with mocked dependencies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AtomTracker } from '../AtomTracker.di';
import type {
  ITrackingOperations,
  IAccessTracking,
  ICleanupOperations,
  IStatsProvider,
} from '../types/interfaces';
import type { Store } from '../../../types';
import type {
  TrackedAtom,
  TrackingStats,
  CleanupStats,
  CleanupResult,
} from '../types';

function createMockStore(): Store {
  return {
    get: vi.fn(),
    set: vi.fn(),
    subscribe: vi.fn(),
    batch: vi.fn(),
  } as unknown as Store;
}

function createMockTracking(): jest.Mocked<ITrackingOperations> {
  return {
    track: vi.fn().mockReturnValue({ success: true }),
    untrack: vi.fn().mockReturnValue({ success: true }),
    getTrackedAtom: vi.fn(),
    getTrackedAtoms: vi.fn().mockReturnValue([]),
    getAtomByName: vi.fn(),
    isTracked: vi.fn().mockReturnValue(false),
    getCount: vi.fn().mockReturnValue(0),
  } as unknown as jest.Mocked<ITrackingOperations>;
}

function createMockAccess(): jest.Mocked<IAccessTracking> {
  return {
    recordAccess: vi.fn(),
    removeSubscriber: vi.fn().mockReturnValue(true),
  } as unknown as jest.Mocked<IAccessTracking>;
}

function createMockCleanup(): jest.Mocked<ICleanupOperations> {
  return {
    performCleanup: vi.fn().mockResolvedValue({ cleanedCount: 0 }),
    triggerCleanup: vi.fn().mockResolvedValue({ cleanedCount: 0 }),
    waitForCleanup: vi.fn().mockResolvedValue({ removed: 0 }),
  } as unknown as jest.Mocked<ICleanupOperations>;
}

function createMockStats(): jest.Mocked<IStatsProvider> {
  return {
    getTrackingStats: vi.fn().mockReturnValue({
      trackedCount: 0,
      accessCount: 0,
      changeCount: 0,
    } as TrackingStats),
    getCleanupStats: vi.fn().mockReturnValue({
      cleanedCount: 0,
      cleanupCount: 0,
    } as CleanupStats),
    getArchiveStats: vi.fn().mockReturnValue({
      archivedCount: 0,
    }),
    getRepositoryStats: vi.fn().mockReturnValue({
      totalAtoms: 0,
      activeAtoms: 0,
      staleAtoms: 0,
    }),
  } as unknown as jest.Mocked<IStatsProvider>;
}

describe('AtomTracker (DI)', () => {
  let tracker: AtomTracker;
  let mockTracking: jest.Mocked<ITrackingOperations>;
  let mockAccess: jest.Mocked<IAccessTracking>;
  let mockCleanup: jest.Mocked<ICleanupOperations>;
  let mockStats: jest.Mocked<IStatsProvider>;
  let mockStore: Store;

  beforeEach(() => {
    mockStore = createMockStore();
    mockTracking = createMockTracking();
    mockAccess = createMockAccess();
    mockCleanup = createMockCleanup();
    mockStats = createMockStats();

    tracker = new AtomTracker({
      store: mockStore,
      tracking: mockTracking,
      access: mockAccess,
      cleanup: mockCleanup,
      stats: mockStats,
    });
  });

  describe('constructor', () => {
    it('should create with dependencies', () => {
      expect(tracker).toBeDefined();
    });

    it('should accept config', () => {
      const t = new AtomTracker({
        store: mockStore,
        tracking: mockTracking,
        access: mockAccess,
        cleanup: mockCleanup,
        stats: mockStats,
        config: { maxAtoms: 100 },
      });

      expect(t.getConfig().maxAtoms).toBe(100);
    });
  });

  describe('track', () => {
    it('should delegate to tracking service', () => {
      const testAtom = { id: Symbol('test'), name: 'test' } as any;
      mockTracking.track.mockReturnValue({ success: true });

      const result = tracker.track(testAtom);

      expect(result).toBe(true);
      expect(mockTracking.track).toHaveBeenCalled();
    });

    it('should return false when tracking fails', () => {
      const testAtom = { id: Symbol('test'), name: 'test' } as any;
      mockTracking.track.mockReturnValue({ success: false });

      const result = tracker.track(testAtom);

      expect(result).toBe(false);
    });
  });

  describe('untrack', () => {
    it('should delegate to tracking service', () => {
      const atomId = Symbol('test');
      mockTracking.untrack.mockReturnValue({ success: true });

      const result = tracker.untrack(atomId);

      expect(result).toBe(true);
      expect(mockTracking.untrack).toHaveBeenCalledWith(atomId);
    });

    it('should return false when untracking fails', () => {
      const atomId = Symbol('test');
      mockTracking.untrack.mockReturnValue({ success: false });

      const result = tracker.untrack(atomId);

      expect(result).toBe(false);
    });
  });

  describe('isTracked', () => {
    it('should delegate to tracking service', () => {
      const atomId = Symbol('test');
      mockTracking.isTracked.mockReturnValue(true);

      const result = tracker.isTracked(atomId);

      expect(result).toBe(true);
      expect(mockTracking.isTracked).toHaveBeenCalledWith(atomId);
    });
  });

  describe('getTrackedAtom', () => {
    it('should delegate to tracking service', () => {
      const atomId = Symbol('test');
      const mockAtom = { id: atomId, name: 'test' } as TrackedAtom;
      mockTracking.getTrackedAtom.mockReturnValue(mockAtom);

      const result = tracker.getTrackedAtom(atomId);

      expect(result).toBe(mockAtom);
      expect(mockTracking.getTrackedAtom).toHaveBeenCalledWith(atomId);
    });

    it('should return null when atom not found', () => {
      const atomId = Symbol('test');
      mockTracking.getTrackedAtom.mockReturnValue(null);

      const result = tracker.getTrackedAtom(atomId);

      expect(result).toBeNull();
    });
  });

  describe('getTrackedAtoms', () => {
    it('should delegate to tracking service', () => {
      const atoms = [{ id: Symbol('test'), name: 'test' }] as TrackedAtom[];
      mockTracking.getTrackedAtoms.mockReturnValue(atoms);

      const result = tracker.getTrackedAtoms();

      expect(result).toBe(atoms);
      expect(mockTracking.getTrackedAtoms).toHaveBeenCalled();
    });
  });

  describe('getCount', () => {
    it('should delegate to tracking service', () => {
      mockTracking.getCount.mockReturnValue(5);

      const result = tracker.getCount();

      expect(result).toBe(5);
      expect(mockTracking.getCount).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should delegate to stats service', () => {
      const stats = { trackedCount: 5 } as TrackingStats;
      mockStats.getTrackingStats.mockReturnValue(stats);

      const result = tracker.getStats();

      expect(result).toBe(stats);
      expect(mockStats.getTrackingStats).toHaveBeenCalled();
    });
  });

  describe('getCleanupStats', () => {
    it('should delegate to stats service', () => {
      const stats = { cleanedCount: 3 } as CleanupStats;
      mockStats.getCleanupStats.mockReturnValue(stats);

      const result = tracker.getCleanupStats();

      expect(result).toBe(stats);
      expect(mockStats.getCleanupStats).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should delegate to cleanup service', async () => {
      const result = { cleanedCount: 2 };
      mockCleanup.performCleanup.mockResolvedValue(result);

      const cleanupResult = await tracker.performCleanup();

      expect(cleanupResult).toBe(result);
      expect(mockCleanup.performCleanup).toHaveBeenCalled();
    });
  });

  describe('triggerCleanup', () => {
    it('should delegate to cleanup service', async () => {
      const result = { cleanedCount: 2 };
      mockCleanup.triggerCleanup.mockResolvedValue(result);

      const cleanupResult = await tracker.triggerCleanup();

      expect(cleanupResult).toBe(result);
      expect(mockCleanup.triggerCleanup).toHaveBeenCalled();
    });
  });

  describe('recordAccess', () => {
    it('should do nothing if atom not tracked', () => {
      const testAtom = { id: Symbol('test'), name: 'test' } as any;
      mockTracking.getTrackedAtom.mockReturnValue(null);

      tracker.recordAccess(testAtom);

      expect(mockAccess.recordAccess).not.toHaveBeenCalled();
    });

    it('should delegate to access service', () => {
      const testAtom = { id: Symbol('test'), name: 'test' } as any;
      const trackedAtom = { id: testAtom.id, name: 'test' } as TrackedAtom;
      mockTracking.getTrackedAtom.mockReturnValue(trackedAtom);

      tracker.recordAccess(testAtom, 'sub1');

      expect(mockAccess.recordAccess).toHaveBeenCalledWith(
        testAtom,
        trackedAtom,
        'sub1'
      );
    });
  });

  describe('removeSubscriber', () => {
    it('should return false if atom not tracked', () => {
      const testAtom = { id: Symbol('test'), name: 'test' } as any;
      mockTracking.getTrackedAtom.mockReturnValue(null);

      const result = tracker.removeSubscriber(testAtom, 'sub1');

      expect(result).toBe(false);
    });

    it('should delegate to access service', () => {
      const testAtom = { id: Symbol('test'), name: 'test' } as any;
      const trackedAtom = { id: testAtom.id, name: 'test' } as TrackedAtom;
      mockTracking.getTrackedAtom.mockReturnValue(trackedAtom);
      mockAccess.removeSubscriber.mockReturnValue(true);

      const result = tracker.removeSubscriber(testAtom, 'sub1');

      expect(result).toBe(true);
      expect(mockAccess.removeSubscriber).toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('should dispose without errors', async () => {
      await expect(tracker.dispose()).resolves.not.toThrow();
    });
  });
});
