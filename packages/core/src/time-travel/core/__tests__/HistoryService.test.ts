/**
 * HistoryService tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryService } from '../HistoryService';
import type { Store, Snapshot } from '../../types';

describe('HistoryService', () => {
  let historyService: HistoryService;
  let mockStore: Store;

  const createSnapshot = (action: string, value?: string): Snapshot => ({
    id: `snapshot-${action}-${Date.now()}`,
    state: {
      [action]: { value: value || 'default' },
    },
    metadata: {
      timestamp: Date.now(),
      action,
    },
  });

  beforeEach(() => {
    mockStore = {
      get: vi.fn(),
      set: vi.fn(),
      batch: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      getAtom: vi.fn(),
      getAtoms: vi.fn(),
    } as unknown as Store;

    historyService = new HistoryService(mockStore);
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const service = new HistoryService(mockStore);
      const config = service.getConfig();

      expect(config.maxHistory).toBe(50);
      expect(config.useDeltaSnapshots).toBe(false);
    });

    it('should create with custom config', () => {
      const service = new HistoryService(mockStore, {
        maxHistory: 100,
        useDeltaSnapshots: true,
      });

      const config = service.getConfig();
      expect(config.maxHistory).toBe(100);
      expect(config.useDeltaSnapshots).toBe(true);
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      historyService.configure({ maxHistory: 75 });

      const config = historyService.getConfig();
      expect(config.maxHistory).toBe(75);
    });
  });

  describe('getHistoryManager', () => {
    it('should return history manager', () => {
      const manager = historyService.getHistoryManager();
      expect(manager).toBeDefined();
    });
  });

  describe('getNavigator', () => {
    it('should return navigator', () => {
      const navigator = historyService.getNavigator();
      expect(navigator).toBeDefined();
    });
  });

  describe('add', () => {
    it('should add snapshot to history', () => {
      const snapshot = createSnapshot('action1');
      const result = historyService.add(snapshot);

      expect(result.success).toBe(true);
      expect(result.snapshotId).toBe(snapshot.id);
    });

    it('should handle add errors', () => {
      const service = new HistoryService({
        ...mockStore,
        set: vi.fn(() => {
          throw new Error('Add error');
        }),
      } as unknown as Store);

      const snapshot = createSnapshot('action1');
      const result = service.add(snapshot);

      expect(result.success).toBe(true);
    });
  });

  describe('undo', () => {
    it('should return success when nothing to undo', () => {
      const result = historyService.undo();

      expect(result.success).toBe(true);
    });

    it('should undo last action', () => {
      const snapshot1 = createSnapshot('action1', 'value1');
      const snapshot2 = createSnapshot('action2', 'value2');

      historyService.add(snapshot1);
      historyService.add(snapshot2);

      const result = historyService.undo();

      expect(result.success).toBe(true);
    });

    it('should handle undo errors', () => {
      const result = historyService.undo();

      expect(result.success).toBe(true);
    });
  });

  describe('redo', () => {
    it('should return success when nothing to redo', () => {
      const result = historyService.redo();

      expect(result.success).toBe(true);
    });

    it('should redo previously undone action', () => {
      const snapshot1 = createSnapshot('action1', 'value1');
      const snapshot2 = createSnapshot('action2', 'value2');

      historyService.add(snapshot1);
      historyService.add(snapshot2);
      historyService.undo();

      const result = historyService.redo();

      expect(result.success).toBe(true);
    });
  });

  describe('jumpTo', () => {
    it('should return error for non-existent snapshot ID', () => {
      const result = historyService.jumpTo('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should jump to existing snapshot', () => {
      const snapshot1 = createSnapshot('action1', 'value1');
      const snapshot2 = createSnapshot('action2', 'value2');

      historyService.add(snapshot1);
      historyService.add(snapshot2);

      const result = historyService.jumpTo(snapshot1.id);

      expect(result.success).toBe(true);
      expect(result.snapshotId).toBe(snapshot1.id);
      expect(result.previous).toBeDefined();
      expect(result.current).toBeDefined();
    });

    it('should handle jump errors', () => {
      const result = historyService.jumpTo('invalid');

      expect(result.success).toBe(false);
    });
  });

  describe('jumpToIndex', () => {
    it('should return error for invalid index', () => {
      const result = historyService.jumpToIndex(-1);

      expect(result.success).toBe(false);
    });

    it('should jump to valid index', () => {
      const snapshot1 = createSnapshot('action1', 'value1');
      const snapshot2 = createSnapshot('action2', 'value2');

      historyService.add(snapshot1);
      historyService.add(snapshot2);

      const result = historyService.jumpToIndex(0);

      expect(result.success).toBe(true);
      expect(result.snapshotId).toBe(snapshot1.id);
    });

    it('should handle jump to index errors', () => {
      const result = historyService.jumpToIndex(100);

      expect(result.success).toBe(false);
    });
  });

  describe('canUndo', () => {
    it('should return false for empty history', () => {
      expect(historyService.canUndo()).toBe(false);
    });

    it('should return true with past snapshots', () => {
      historyService.add(createSnapshot('action1'));
      historyService.add(createSnapshot('action2'));

      expect(historyService.canUndo()).toBe(true);
    });
  });

  describe('canRedo', () => {
    it('should return false for empty history', () => {
      expect(historyService.canRedo()).toBe(false);
    });

    it('should return true after undo', () => {
      historyService.add(createSnapshot('action1'));
      historyService.add(createSnapshot('action2'));
      historyService.undo();

      expect(historyService.canRedo()).toBe(true);
    });
  });

  describe('getCurrent', () => {
    it('should return undefined for empty history', () => {
      const current = historyService.getCurrent();
      expect(current).toBeUndefined();
    });

    it('should return current snapshot', () => {
      const snapshot = createSnapshot('action1');
      historyService.add(snapshot);

      const current = historyService.getCurrent();
      expect(current).toBeDefined();
    });
  });

  describe('getCurrentIndex', () => {
    it('should return -1 for empty history', () => {
      const index = historyService.getCurrentIndex();
      expect(index).toBe(-1);
    });

    it('should return current index', () => {
      historyService.add(createSnapshot('action1'));
      historyService.add(createSnapshot('action2'));

      const index = historyService.getCurrentIndex();
      expect(index).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getLength', () => {
    it('should return 0 for empty history', () => {
      expect(historyService.getLength()).toBe(0);
    });

    it('should return correct length', () => {
      historyService.add(createSnapshot('action1'));
      historyService.add(createSnapshot('action2'));

      expect(historyService.getLength()).toBe(2);
    });
  });

  describe('getAll', () => {
    it('should return empty array for empty history', () => {
      const all = historyService.getAll();
      expect(all).toHaveLength(0);
    });

    it('should return all snapshots', () => {
      const snapshot1 = createSnapshot('action1');
      const snapshot2 = createSnapshot('action2');

      historyService.add(snapshot1);
      historyService.add(snapshot2);

      const all = historyService.getAll();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getById', () => {
    it('should return undefined for non-existent ID', () => {
      const result = historyService.getById('non-existent');
      expect(result).toBeUndefined();
    });

    it('should return snapshot by ID', () => {
      const snapshot = createSnapshot('action1');
      historyService.add(snapshot);

      const result = historyService.getById(snapshot.id);
      expect(result).toBeDefined();
    });
  });

  describe('getByIndex', () => {
    it('should return undefined for invalid index', () => {
      const result = historyService.getByIndex(100);
      expect(result).toBeUndefined();
    });

    it('should return snapshot by index', () => {
      const snapshot = createSnapshot('action1');
      historyService.add(snapshot);

      const result = historyService.getByIndex(0);
      expect(result).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      historyService.add(createSnapshot('action1'));
      historyService.add(createSnapshot('action2'));

      historyService.clear();

      expect(historyService.getLength()).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return stats for empty history', () => {
      const stats = historyService.getStats();

      expect(stats.length).toBe(0);
      expect(stats.currentIndex).toBe(-1);
      expect(stats.canUndo).toBe(false);
      expect(stats.canRedo).toBe(false);
    });

    it('should return stats with snapshots', () => {
      historyService.add(createSnapshot('action1'));
      historyService.add(createSnapshot('action2'));

      const stats = historyService.getStats();

      expect(stats.length).toBe(2);
      expect(stats.canUndo).toBe(true);
      expect(stats.oldestSnapshot).toBeDefined();
      expect(stats.newestSnapshot).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should handle full undo/redo cycle', () => {
      const snapshot1 = createSnapshot('action1', 'value1');
      const snapshot2 = createSnapshot('action2', 'value2');
      const snapshot3 = createSnapshot('action3', 'value3');

      historyService.add(snapshot1);
      historyService.add(snapshot2);
      historyService.add(snapshot3);

      expect(historyService.canUndo()).toBe(true);
      expect(historyService.canRedo()).toBe(false);

      historyService.undo();
      expect(historyService.canRedo()).toBe(true);

      historyService.redo();
      expect(historyService.canRedo()).toBe(false);
    });

    it('should handle jump and undo/redo', () => {
      const snapshot1 = createSnapshot('action1');
      const snapshot2 = createSnapshot('action2');
      const snapshot3 = createSnapshot('action3');

      historyService.add(snapshot1);
      historyService.add(snapshot2);
      historyService.add(snapshot3);

      historyService.jumpTo(snapshot1.id);

      expect(historyService.canUndo()).toBe(false);
      expect(historyService.canRedo()).toBe(true);
    });
  });
});
