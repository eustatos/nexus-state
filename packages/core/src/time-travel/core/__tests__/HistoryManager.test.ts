/**
 * HistoryManager tests - Basic functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HistoryManager } from '../HistoryManager';
import type { Snapshot } from '../../types';

describe('HistoryManager', () => {
  let historyManager: HistoryManager;

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
    historyManager = new HistoryManager(50);
  });

  describe('constructor', () => {
    it('should create with default maxHistory', () => {
      const manager = new HistoryManager();
      const stats = manager.getStats();

      expect(stats.length).toBe(0);
    });

    it('should create with custom maxHistory', () => {
      const manager = new HistoryManager(10);
      expect(manager).toBeDefined();
    });

    it('should create with disposal config', () => {
      const manager = new HistoryManager(50, undefined, {
        throwOnError: true,
        logDisposal: true,
      });

      expect(manager).toBeDefined();
    });
  });

  describe('add', () => {
    it('should add snapshot to empty history', () => {
      const snapshot = createSnapshot('action1');
      historyManager.add(snapshot);

      const stats = historyManager.getStats();
      expect(stats.length).toBe(1);
      expect(stats.hasCurrent).toBe(true);
    });

    it('should move current to past when adding new snapshot', () => {
      const snapshot1 = createSnapshot('action1');
      const snapshot2 = createSnapshot('action2');

      historyManager.add(snapshot1);
      historyManager.add(snapshot2);

      const stats = historyManager.getStats();
      expect(stats.pastCount).toBe(1);
      expect(stats.hasCurrent).toBe(true);
    });

    it('should clear future when adding new snapshot', () => {
      const snapshot1 = createSnapshot('action1');
      const snapshot2 = createSnapshot('action2');
      const snapshot3 = createSnapshot('action3');

      historyManager.add(snapshot1);
      historyManager.add(snapshot2);
      historyManager.undo();
      historyManager.add(snapshot3);

      const stats = historyManager.getStats();
      expect(stats.futureCount).toBe(0);
    });

    it('should enforce maxHistory limit', () => {
      const manager = new HistoryManager(3);

      manager.add(createSnapshot('action1'));
      manager.add(createSnapshot('action2'));
      manager.add(createSnapshot('action3'));
      manager.add(createSnapshot('action4'));

      const stats = manager.getStats();
      expect(stats.length).toBe(3);
    });

    it('should trim old snapshots when exceeding maxHistory', () => {
      const manager = new HistoryManager(3);

      manager.add(createSnapshot('action1'));
      manager.add(createSnapshot('action2'));
      manager.add(createSnapshot('action3'));
      manager.add(createSnapshot('action4'));
      manager.add(createSnapshot('action5'));

      const all = manager.getAll();
      expect(all.length).toBe(3);
    });
  });

  describe('getCurrent', () => {
    it('should return null for empty history', () => {
      const current = historyManager.getCurrent();
      expect(current).toBeNull();
    });

    it('should return current snapshot', () => {
      const snapshot = createSnapshot('action1');
      historyManager.add(snapshot);

      const current = historyManager.getCurrent();
      expect(current).toBe(snapshot);
    });
  });

  describe('getAll', () => {
    it('should return empty array for empty history', () => {
      const all = historyManager.getAll();
      expect(all).toHaveLength(0);
    });

    it('should return all snapshots', () => {
      const snapshot1 = createSnapshot('action1');
      const snapshot2 = createSnapshot('action2');

      historyManager.add(snapshot1);
      historyManager.add(snapshot2);

      const all = historyManager.getAll();
      expect(all).toHaveLength(2);
    });

    it('should include past, current, and future', () => {
      const snapshot1 = createSnapshot('action1');
      const snapshot2 = createSnapshot('action2');
      const snapshot3 = createSnapshot('action3');

      historyManager.add(snapshot1);
      historyManager.add(snapshot2);
      historyManager.add(snapshot3);
      historyManager.undo();

      const all = historyManager.getAll();
      expect(all).toHaveLength(3);
    });
  });

  describe('getLength', () => {
    it('should return 0 for empty history', () => {
      expect(historyManager.getLength()).toBe(0);
    });

    it('should return correct length', () => {
      historyManager.add(createSnapshot('action1'));
      historyManager.add(createSnapshot('action2'));

      expect(historyManager.getLength()).toBe(2);
    });
  });

  describe('canUndo', () => {
    it('should return false for empty history', () => {
      expect(historyManager.canUndo()).toBe(false);
    });

    it('should return false with only current snapshot', () => {
      historyManager.add(createSnapshot('action1'));
      expect(historyManager.canUndo()).toBe(false);
    });

    it('should return true with past snapshots', () => {
      historyManager.add(createSnapshot('action1'));
      historyManager.add(createSnapshot('action2'));

      expect(historyManager.canUndo()).toBe(true);
    });
  });

  describe('canRedo', () => {
    it('should return false for empty history', () => {
      expect(historyManager.canRedo()).toBe(false);
    });

    it('should return false without undo', () => {
      historyManager.add(createSnapshot('action1'));
      historyManager.add(createSnapshot('action2'));

      expect(historyManager.canRedo()).toBe(false);
    });

    it('should return true after undo', () => {
      historyManager.add(createSnapshot('action1'));
      historyManager.add(createSnapshot('action2'));
      historyManager.undo();

      expect(historyManager.canRedo()).toBe(true);
    });
  });

  describe('undo', () => {
    it('should return null when cannot undo', () => {
      const result = historyManager.undo();
      expect(result).toBeNull();
    });

    it('should undo to previous snapshot', () => {
      const snapshot1 = createSnapshot('action1', 'value1');
      const snapshot2 = createSnapshot('action2', 'value2');

      historyManager.add(snapshot1);
      historyManager.add(snapshot2);

      const result = historyManager.undo();

      expect(result).toBe(snapshot1);
      expect(historyManager.getCurrent()).toBe(snapshot1);
    });

    it('should move current to future on undo', () => {
      historyManager.add(createSnapshot('action1'));
      historyManager.add(createSnapshot('action2'));
      historyManager.undo();

      const stats = historyManager.getStats();
      expect(stats.futureCount).toBe(1);
    });
  });

  describe('redo', () => {
    it('should return null when cannot redo', () => {
      const result = historyManager.redo();
      expect(result).toBeNull();
    });

    it('should redo to next snapshot', () => {
      const snapshot1 = createSnapshot('action1', 'value1');
      const snapshot2 = createSnapshot('action2', 'value2');

      historyManager.add(snapshot1);
      historyManager.add(snapshot2);
      historyManager.undo();

      const result = historyManager.redo();

      expect(result).toBe(snapshot2);
      expect(historyManager.getCurrent()).toBe(snapshot2);
    });

    it('should move current to past on redo', () => {
      historyManager.add(createSnapshot('action1'));
      historyManager.add(createSnapshot('action2'));
      historyManager.undo();
      historyManager.redo();

      const stats = historyManager.getStats();
      expect(stats.pastCount).toBe(1);
      expect(stats.futureCount).toBe(0);
    });
  });

  describe('jumpTo', () => {
    it('should return null for invalid index', () => {
      historyManager.add(createSnapshot('action1'));

      const result = historyManager.jumpTo(-1);
      expect(result).toBeNull();
    });

    it('should return null for out of bounds index', () => {
      historyManager.add(createSnapshot('action1'));

      const result = historyManager.jumpTo(10);
      expect(result).toBeNull();
    });

    it('should return current if already at index', () => {
      const snapshot = createSnapshot('action1');
      historyManager.add(snapshot);

      const result = historyManager.jumpTo(0);
      expect(result).toBe(snapshot);
    });

    it('should jump to specific index', () => {
      const snapshot1 = createSnapshot('action1', 'value1');
      const snapshot2 = createSnapshot('action2', 'value2');
      const snapshot3 = createSnapshot('action3', 'value3');

      historyManager.add(snapshot1);
      historyManager.add(snapshot2);
      historyManager.add(snapshot3);

      const result = historyManager.jumpTo(0);

      expect(result).toBe(snapshot1);
      expect(historyManager.getCurrent()).toBe(snapshot1);
    });

    it('should rebuild past and future after jump', () => {
      const snapshot1 = createSnapshot('action1');
      const snapshot2 = createSnapshot('action2');
      const snapshot3 = createSnapshot('action3');

      historyManager.add(snapshot1);
      historyManager.add(snapshot2);
      historyManager.add(snapshot3);
      historyManager.jumpTo(0);

      const stats = historyManager.getStats();
      expect(stats.pastCount).toBe(0);
      expect(stats.futureCount).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return stats for empty history', () => {
      const stats = historyManager.getStats();

      expect(stats.length).toBe(0);
      expect(stats.currentIndex).toBe(0);
      expect(stats.canUndo).toBe(false);
      expect(stats.canRedo).toBe(false);
      expect(stats.totalSnapshots).toBe(0);
      expect(stats.pastCount).toBe(0);
      expect(stats.futureCount).toBe(0);
      expect(stats.hasCurrent).toBe(false);
    });

    it('should return stats with snapshots', () => {
      historyManager.add(createSnapshot('action1'));
      historyManager.add(createSnapshot('action2'));

      const stats = historyManager.getStats();

      expect(stats.length).toBe(2);
      expect(stats.pastCount).toBe(1);
      expect(stats.hasCurrent).toBe(true);
    });
  });

  describe('getById', () => {
    it('should return null for non-existent ID', () => {
      const result = historyManager.getById('non-existent');
      expect(result).toBeNull();
    });

    it('should return snapshot by ID', () => {
      const snapshot = createSnapshot('action1');
      historyManager.add(snapshot);

      const result = historyManager.getById(snapshot.id);
      expect(result).toBe(snapshot);
    });
  });

  describe('subscribe', () => {
    it('should subscribe to events', () => {
      const listener = vi.fn();
      const unsubscribe = historyManager.subscribe(listener);

      historyManager.add(createSnapshot('action1'));

      unsubscribe();
      historyManager.add(createSnapshot('action2'));

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should emit change event on clear', () => {
      const listener = vi.fn();
      historyManager.subscribe(listener);

      historyManager.clear();

      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].type).toBe('change');
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      historyManager.add(createSnapshot('action1'));
      historyManager.add(createSnapshot('action2'));

      historyManager.clear();

      const stats = historyManager.getStats();
      expect(stats.length).toBe(0);
      expect(stats.hasCurrent).toBe(false);
    });

    it('should reset compression tracking', () => {
      historyManager.add(createSnapshot('action1'));
      historyManager.clear();

      const stats = historyManager.getStats();
      expect(stats.originalHistorySize).toBe(0);
      expect(stats.compressedHistorySize).toBe(0);
    });
  });

  describe('dispose', () => {
    it('should dispose successfully', async () => {
      historyManager.add(createSnapshot('action1'));

      await historyManager.dispose();

      expect(historyManager.isDisposed()).toBe(true);
    });

    it('should be idempotent', async () => {
      await historyManager.dispose();
      await expect(historyManager.dispose()).resolves.toBeUndefined();
    });
  });
});
