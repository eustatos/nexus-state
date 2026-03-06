/**
 * HistoryNavigator tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryNavigator } from '../HistoryNavigator';
import { SnapshotRestorer } from '../../snapshot/SnapshotRestorer';
import type { Snapshot, Store } from '../../types';

describe('HistoryNavigator', () => {
  let historyNavigator: HistoryNavigator;
  let mockHistoryManager: any;
  let mockRestorer: SnapshotRestorer;
  let mockStore: Store;

  const createSnapshot = (action: string, value?: string): Snapshot => ({
    id: `snapshot-${action}`,
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

    mockRestorer = new SnapshotRestorer(mockStore);

    mockHistoryManager = {
      getAll: vi.fn(() => []),
      getLength: vi.fn(() => 0),
      canUndo: vi.fn(() => false),
      canRedo: vi.fn(() => false),
      undo: vi.fn(() => null),
      redo: vi.fn(() => null),
      jumpTo: vi.fn(() => null),
      getById: vi.fn(() => null),
    };

    historyNavigator = new HistoryNavigator(mockHistoryManager, mockRestorer);
  });

  describe('constructor', () => {
    it('should initialize with empty history', () => {
      expect(historyNavigator.getCurrentIndex()).toBe(-1);
      expect(historyNavigator.getCurrent()).toBeUndefined();
    });

    it('should initialize with existing history', () => {
      const snapshots = [
        createSnapshot('action1'),
        createSnapshot('action2'),
      ];

      mockHistoryManager.getAll.mockReturnValue(snapshots);
      mockHistoryManager.getLength.mockReturnValue(snapshots.length);

      const navigator = new HistoryNavigator(mockHistoryManager, mockRestorer);

      expect(navigator.getCurrentIndex()).toBe(1);
    });
  });

  describe('getCurrent', () => {
    it('should return undefined for empty history', () => {
      expect(historyNavigator.getCurrent()).toBeUndefined();
    });

    it('should return current snapshot', () => {
      const snapshot = createSnapshot('action1');
      mockHistoryManager.getAll.mockReturnValue([snapshot]);
      mockHistoryManager.getLength.mockReturnValue(1);

      const navigator = new HistoryNavigator(mockHistoryManager, mockRestorer);

      expect(navigator.getCurrent()).toBe(snapshot);
    });

    it('should return undefined if index out of bounds', () => {
      mockHistoryManager.getLength.mockReturnValue(0);

      (historyNavigator as any).currentIndex = 5;

      expect(historyNavigator.getCurrent()).toBeUndefined();
    });
  });

  describe('getCurrentIndex', () => {
    it('should return -1 for empty history', () => {
      expect(historyNavigator.getCurrentIndex()).toBe(-1);
    });

    it('should return current index', () => {
      mockHistoryManager.getAll.mockReturnValue([createSnapshot('action1')]);
      mockHistoryManager.getLength.mockReturnValue(1);

      const navigator = new HistoryNavigator(mockHistoryManager, mockRestorer);

      expect(navigator.getCurrentIndex()).toBe(0);
    });
  });

  describe('canUndo', () => {
    it('should return false for empty history', () => {
      expect(historyNavigator.canUndo()).toBe(false);
    });

    it('should return false at first index', () => {
      mockHistoryManager.getAll.mockReturnValue([createSnapshot('action1')]);
      mockHistoryManager.getLength.mockReturnValue(1);

      const navigator = new HistoryNavigator(mockHistoryManager, mockRestorer);

      expect(navigator.canUndo()).toBe(false);
    });

    it('should return true when not at first index', () => {
      const snapshots = [
        createSnapshot('action1'),
        createSnapshot('action2'),
      ];

      mockHistoryManager.getAll.mockReturnValue(snapshots);
      mockHistoryManager.getLength.mockReturnValue(2);

      const navigator = new HistoryNavigator(mockHistoryManager, mockRestorer);
      (navigator as any).currentIndex = 1;

      expect(navigator.canUndo()).toBe(true);
    });
  });

  describe('canRedo', () => {
    it('should return false for empty history', () => {
      expect(historyNavigator.canRedo()).toBe(false);
    });

    it('should return false at last index', () => {
      const snapshots = [createSnapshot('action1')];

      mockHistoryManager.getAll.mockReturnValue(snapshots);
      mockHistoryManager.getLength.mockReturnValue(1);

      const navigator = new HistoryNavigator(mockHistoryManager, mockRestorer);

      expect(navigator.canRedo()).toBe(false);
    });

    it('should return true when not at last index', () => {
      const snapshots = [
        createSnapshot('action1'),
        createSnapshot('action2'),
        createSnapshot('action3'),
      ];

      mockHistoryManager.getAll.mockReturnValue(snapshots);
      mockHistoryManager.getLength.mockReturnValue(3);

      const navigator = new HistoryNavigator(mockHistoryManager, mockRestorer);
      (navigator as any).currentIndex = 0;

      expect(navigator.canRedo()).toBe(true);
    });
  });

  describe('jumpToIndex', () => {
    it('should return false for invalid index', () => {
      mockHistoryManager.getLength.mockReturnValue(0);

      const result = historyNavigator.jumpToIndex(-1);

      expect(result).toBe(false);
    });

    it('should return false for out of bounds index', () => {
      mockHistoryManager.getLength.mockReturnValue(2);

      const result = historyNavigator.jumpToIndex(10);

      expect(result).toBe(false);
    });

    it('should update current index and jump', () => {
      const snapshots = [
        createSnapshot('action1'),
        createSnapshot('action2'),
        createSnapshot('action3'),
      ];

      mockHistoryManager.getAll.mockReturnValue(snapshots);
      mockHistoryManager.getLength.mockReturnValue(3);
      mockHistoryManager.jumpTo.mockReturnValue(snapshots[1]);

      const navigator = new HistoryNavigator(mockHistoryManager, mockRestorer);

      const result = navigator.jumpToIndex(1);

      expect(result).toBe(true);
      expect(navigator.getCurrentIndex()).toBe(1);
      expect(mockHistoryManager.jumpTo).toHaveBeenCalledWith(1);
    });
  });

  describe('undo', () => {
    it('should return false when cannot undo', () => {
      mockHistoryManager.canUndo.mockReturnValue(false);

      const result = historyNavigator.undo();

      expect(result).toBe(false);
      expect(mockHistoryManager.undo).not.toHaveBeenCalled();
    });

    it('should return false when undo returns null', () => {
      mockHistoryManager.canUndo.mockReturnValue(true);
      mockHistoryManager.undo.mockReturnValue(null);

      const result = historyNavigator.undo();

      expect(result).toBe(false);
    });

    it('should undo and restore snapshot', () => {
      const snapshot = createSnapshot('action1', 'value1');

      mockHistoryManager.canUndo.mockReturnValue(true);
      mockHistoryManager.undo.mockReturnValue(snapshot);

      const result = historyNavigator.undo();

      expect(result).toBe(true);
      expect(mockHistoryManager.undo).toHaveBeenCalled();
    });

    it('should decrement current index', () => {
      const snapshot = createSnapshot('action1');

      mockHistoryManager.canUndo.mockReturnValue(true);
      mockHistoryManager.undo.mockReturnValue(snapshot);

      (historyNavigator as any).currentIndex = 2;

      historyNavigator.undo();

      expect((historyNavigator as any).currentIndex).toBe(1);
    });

    it('should not go below 0', () => {
      const snapshot = createSnapshot('action1');

      mockHistoryManager.canUndo.mockReturnValue(true);
      mockHistoryManager.undo.mockReturnValue(snapshot);

      (historyNavigator as any).currentIndex = 0;

      historyNavigator.undo();

      expect((historyNavigator as any).currentIndex).toBe(0);
    });
  });

  describe('redo', () => {
    it('should return false when cannot redo', () => {
      mockHistoryManager.canRedo.mockReturnValue(false);

      const result = historyNavigator.redo();

      expect(result).toBe(false);
      expect(mockHistoryManager.redo).not.toHaveBeenCalled();
    });

    it('should return false when redo returns null', () => {
      mockHistoryManager.canRedo.mockReturnValue(true);
      mockHistoryManager.redo.mockReturnValue(null);

      const result = historyNavigator.redo();

      expect(result).toBe(false);
    });

    it('should redo and restore snapshot', () => {
      const snapshot = createSnapshot('action1', 'value1');

      mockHistoryManager.canRedo.mockReturnValue(true);
      mockHistoryManager.redo.mockReturnValue(snapshot);

      const result = historyNavigator.redo();

      expect(result).toBe(true);
      expect(mockHistoryManager.redo).toHaveBeenCalled();
    });

    it('should increment current index', () => {
      const snapshot = createSnapshot('action1');

      mockHistoryManager.canRedo.mockReturnValue(true);
      mockHistoryManager.redo.mockReturnValue(snapshot);

      (historyNavigator as any).currentIndex = 0;
      mockHistoryManager.getLength.mockReturnValue(3);

      historyNavigator.redo();

      expect((historyNavigator as any).currentIndex).toBe(1);
    });

    it('should not exceed max index', () => {
      const snapshot = createSnapshot('action1');

      mockHistoryManager.canRedo.mockReturnValue(true);
      mockHistoryManager.redo.mockReturnValue(snapshot);

      (historyNavigator as any).currentIndex = 2;
      mockHistoryManager.getLength.mockReturnValue(3);

      historyNavigator.redo();

      expect((historyNavigator as any).currentIndex).toBe(2);
    });
  });

  describe('jumpTo', () => {
    it('should return false when jumpTo returns null', () => {
      mockHistoryManager.jumpTo.mockReturnValue(null);

      const result = historyNavigator.jumpTo(0);

      expect(result).toBe(false);
    });

    it('should jump to index and restore snapshot', () => {
      const snapshot = createSnapshot('action1', 'value1');

      mockHistoryManager.jumpTo.mockReturnValue(snapshot);

      const result = historyNavigator.jumpTo(0);

      expect(result).toBe(true);
      expect(mockHistoryManager.jumpTo).toHaveBeenCalledWith(0);
    });

    it('should update current index', () => {
      const snapshot = createSnapshot('action1');

      mockHistoryManager.jumpTo.mockReturnValue(snapshot);

      historyNavigator.jumpTo(2);

      expect((historyNavigator as any).currentIndex).toBe(2);
    });
  });
});
