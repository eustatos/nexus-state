/**
 * Fixtures for TimeTravel core tests
 */

import type { Snapshot } from '../../../types';
import type { Store } from '../../../../types';
import { vi } from 'vitest';

/**
 * Creates a mock snapshot for testing
 */
export function createMockSnapshot(
  id: string,
  action?: string,
  state?: Record<string, any>
): Snapshot {
  return {
    id,
    state: state || { 'atom-1': { value: 1, type: 'primitive' } },
    metadata: {
      timestamp: Date.now(),
      action: action || 'test-action',
      atomCount: state ? Object.keys(state).length : 1,
    },
  };
}

/**
 * Creates a mock store for testing
 */
export function createMockStore(): Store & Record<string, any> {
  const atoms = new Map();

  return {
    get: vi.fn((atom) => {
      return atoms.get(atom.id);
    }),
    set: vi.fn((atom, update) => {
      const value = typeof update === 'function' ? update(atoms.get(atom.id)) : update;
      atoms.set(atom.id, value);
    }),
    subscribe: vi.fn(() => () => {}),
    getState: vi.fn(() => {
      const state: Record<string, any> = {};
      atoms.forEach((value, key) => {
        state[key.toString()] = value;
      });
      return state;
    }),
    applyPlugin: vi.fn(),
    getPlugins: vi.fn(() => []),
    _atoms: atoms,
  };
}

/**
 * Creates a sequence of snapshots for testing
 */
export function createSnapshotSequence(count: number): Snapshot[] {
  return Array.from({ length: count }, (_, i) =>
    createMockSnapshot(`snapshot-${i}`, `action-${i}`, {
      [`atom-${i}`]: { value: i, type: 'primitive' },
    })
  );
}

/**
 * Creates a mock HistoryService
 */
export function createMockHistoryService() {
  return {
    add: vi.fn(),
    undo: vi.fn(() => ({ success: true })),
    redo: vi.fn(() => ({ success: true })),
    jumpTo: vi.fn(() => ({ success: true, current: undefined })),
    jumpToIndex: vi.fn(() => ({ success: true, current: undefined })),
    canUndo: vi.fn(() => false),
    canRedo: vi.fn(() => false),
    getCurrent: vi.fn(() => undefined),
    getLength: vi.fn(() => 0),
    getAll: vi.fn(() => []),
    getById: vi.fn(() => undefined),
    getStats: vi.fn(() => ({
      length: 0,
      currentIndex: 0,
      canUndo: false,
      canRedo: false,
    })),
    clear: vi.fn(),
    configure: vi.fn(),
  };
}

/**
 * Creates a mock SnapshotService
 */
export function createMockSnapshotService() {
  return {
    capture: vi.fn(() => ({
      success: true,
      snapshot: createMockSnapshot('test-snapshot'),
      duration: 1,
    })),
    restore: vi.fn(() => true),
    restoreWithTransaction: vi.fn(() =>
      Promise.resolve({
        success: true,
        restoredCount: 0,
        totalAtoms: 0,
        errors: [],
        warnings: [],
        duration: 0,
        timestamp: Date.now(),
      })
    ),
    getRestorer: vi.fn(() => ({
      restore: vi.fn(() => true),
      getLastCheckpoint: vi.fn(() => null),
      rollback: vi.fn(() =>
        Promise.resolve({
          success: true,
          checkpointId: 'test',
          rolledBackCount: 0,
          failedCount: 0,
          timestamp: Date.now(),
        })
      ),
      getCheckpoints: vi.fn(() => []),
    })),
  };
}

/**
 * Creates a mock SubscriptionManager
 */
export function createMockSubscriptionManager() {
  const subscribers = new Map();

  return {
    subscribe: vi.fn((eventType: string, listener: Function) => {
      if (!subscribers.has(eventType)) {
        subscribers.set(eventType, new Set());
      }
      subscribers.get(eventType).add(listener);
      return () => {
        subscribers.get(eventType)?.delete(listener);
      };
    }),
    emit: vi.fn((event: any) => {
      const listeners = subscribers.get(event.type);
      listeners?.forEach((listener: Function) => listener(event));
    }),
    unsubscribeAll: vi.fn(() => {
      subscribers.clear();
    }),
    getSubscriberCount: vi.fn((eventType: string) => {
      return subscribers.get(eventType)?.size || 0;
    }),
  };
}

/**
 * Creates a mock ComparisonService
 */
export function createMockComparisonService() {
  return {
    compare: vi.fn((a: Snapshot, b: Snapshot) => ({
      comparison: {
        id: 'test-comparison',
        timestamp: Date.now(),
        summary: {
          totalAtoms: 1,
          changedAtoms: 0,
          addedAtoms: 0,
          removedAtoms: 0,
          unchangedAtoms: 1,
          hasChanges: false,
          changePercentage: 0,
        },
        atoms: [],
        statistics: {
          duration: 1,
          memoryUsed: 0,
          depth: 0,
          totalComparisons: 1,
          cacheHits: 0,
          cacheMisses: 1,
        },
        metadata: {
          snapshotA: { id: a.id, timestamp: a.metadata.timestamp },
          snapshotB: { id: b.id, timestamp: b.metadata.timestamp },
          timeDifference: Math.abs(a.metadata.timestamp - b.metadata.timestamp),
          options: {},
        },
      },
      hasChanges: false,
    })),
    visualize: vi.fn(() => 'visualization'),
    export: vi.fn((_, format: string) => `exported-${format}`),
  };
}

/**
 * Creates a mock DeltaService
 */
export function createMockDeltaService() {
  return {
    getStats: vi.fn(() => ({
      totalDeltas: 0,
      fullSnapshots: 0,
      deltaSnapshots: 0,
      compressionRatio: 0,
    })),
  };
}

/**
 * Creates a mock CleanupService
 */
export function createMockCleanupService() {
  return {
    getStats: vi.fn(() => ({
      cleanedAtoms: 0,
      expiredAtoms: 0,
      lastCleanupTime: Date.now(),
    })),
    startAutoCleanup: vi.fn(),
    stopAutoCleanup: vi.fn(),
    configure: vi.fn(),
    dispose: vi.fn(),
  };
}
