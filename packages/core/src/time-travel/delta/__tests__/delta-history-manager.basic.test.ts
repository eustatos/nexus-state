/**
 * DeltaAwareHistoryManager basic tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeltaAwareHistoryManager } from '../delta-history-manager';
import type { Snapshot } from '../../types';

function createSnapshot(id: string, value: number = 0): Snapshot {
  return {
    id,
    state: {
      atom1: { value, type: 'primitive', name: 'atom1', atomId: '1' },
    },
    metadata: {
      timestamp: Date.now(),
      action: 'test',
      atomCount: 1,
    },
  };
}

describe('DeltaAwareHistoryManager', () => {
  let manager: DeltaAwareHistoryManager;

  beforeEach(() => {
    manager = new DeltaAwareHistoryManager();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      expect(manager).toBeDefined();
    });

    it('should create with custom config', () => {
      const mgr = new DeltaAwareHistoryManager({
        maxHistory: 100,
        compressionEnabled: false,
      });
      expect(mgr).toBeDefined();
    });
  });

  describe('add', () => {
    it('should add snapshot', () => {
      const snapshot = createSnapshot('snap1', 1);
      manager.add(snapshot);

      expect(manager.getAll().length).toBeGreaterThan(0);
    });

    it('should add multiple snapshots', () => {
      manager.add(createSnapshot('s1', 1));
      manager.add(createSnapshot('s2', 2));
      manager.add(createSnapshot('s3', 3));

      expect(manager.getAll().length).toBeGreaterThan(0);
    });
  });

  describe('getAll', () => {
    it('should return array', () => {
      const all = manager.getAll();
      expect(Array.isArray(all)).toBe(true);
    });

    it('should return empty array initially', () => {
      const all = manager.getAll();
      expect(all.length).toBe(0);
    });
  });

  describe('getSnapshot', () => {
    it('should return null for invalid index', () => {
      const snapshot = manager.getSnapshot(0);
      expect(snapshot).toBeNull();
    });

    it('should return snapshot at index', () => {
      manager.add(createSnapshot('s1', 1));
      const snapshot = manager.getSnapshot(0);
      expect(snapshot).not.toBeNull();
    });
  });

  describe('getById', () => {
    it('should return null for unknown id', () => {
      const snapshot = manager.getById('unknown');
      expect(snapshot).toBeNull();
    });

    it('should return snapshot by id', () => {
      const snapshot = createSnapshot('s1', 1);
      manager.add(snapshot);
      const result = manager.getById('s1');
      expect(result).not.toBeNull();
    });
  });

  describe('getDeltaSnapshots', () => {
    it('should return array', () => {
      const deltas = manager.getDeltaSnapshots();
      expect(Array.isArray(deltas)).toBe(true);
    });
  });

  describe('undo', () => {
    it('should return null when history is empty', () => {
      const result = manager.undo();
      expect(result).toBeNull();
    });

    it('should undo to previous snapshot', () => {
      manager.add(createSnapshot('s1', 1));
      manager.add(createSnapshot('s2', 2));

      const result = manager.undo();
      expect(result).not.toBeNull();
    });
  });

  describe('redo', () => {
    it('should return null when no redo available', () => {
      manager.add(createSnapshot('s1', 1));
      const result = manager.redo();
      expect(result).toBeNull();
    });

    it('should redo after undo', () => {
      manager.add(createSnapshot('s1', 1));
      manager.add(createSnapshot('s2', 2));
      manager.undo();

      const result = manager.redo();
      expect(result).not.toBeNull();
    });
  });

  describe('canUndo/canRedo', () => {
    it('should return false initially', () => {
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
    });

    it('should return true after adding snapshots', () => {
      manager.add(createSnapshot('s1', 1));
      manager.add(createSnapshot('s2', 2));

      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return stats', () => {
      const stats = manager.getStats();

      expect(stats).toHaveProperty('standard');
      expect(stats).toHaveProperty('delta');
    });

    it('should return stats object', () => {
      manager.add(createSnapshot('s1', 1));
      manager.add(createSnapshot('s2', 2));

      const stats = manager.getStats();
      expect(stats).toBeDefined();
    });
  });
});
