/**
 * CheckpointManager tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CheckpointManager } from '../CheckpointManager';
import type { Snapshot } from '../types';

function createMockSnapshot(id: string): Snapshot {
  return {
    id,
    state: {
      atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
    },
    metadata: { timestamp: Date.now(), action: 'test', atomCount: 1 },
  };
}

describe('CheckpointManager', () => {
  let checkpointManager: CheckpointManager;

  beforeEach(() => {
    checkpointManager = new CheckpointManager();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const manager = new CheckpointManager();

      const config = manager.getConfig();
      expect(config.maxCheckpoints).toBe(10);
      expect(config.checkpointTimeout).toBe(300000);
    });

    it('should create with custom config', () => {
      const manager = new CheckpointManager({
        maxCheckpoints: 5,
        checkpointTimeout: 60000,
      });

      const config = manager.getConfig();
      expect(config.maxCheckpoints).toBe(5);
      expect(config.checkpointTimeout).toBe(60000);
    });
  });

  describe('create', () => {
    it('should create checkpoint successfully', () => {
      const result = checkpointManager.create('snapshot-1');

      expect(result.success).toBe(true);
      expect(result.checkpointId).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should generate unique checkpoint IDs', () => {
      const result1 = checkpointManager.create('snapshot-1');
      const result2 = checkpointManager.create('snapshot-2');

      expect(result1.checkpointId).not.toBe(result2.checkpointId);
    });

    it('should set checkpoint as active', () => {
      const result = checkpointManager.create('snapshot-1');

      const activeCheckpointId = checkpointManager.getActiveCheckpointId();

      expect(activeCheckpointId).toBe(result.checkpointId);
    });

    it('should increment checkpoint count', () => {
      checkpointManager.create('snapshot-1');

      expect(checkpointManager.getCount()).toBe(1);

      checkpointManager.create('snapshot-2');

      expect(checkpointManager.getCount()).toBe(2);
    });
  });

  describe('get', () => {
    it('should get existing checkpoint', () => {
      const result = checkpointManager.create('snapshot-1');

      const checkpoint = checkpointManager.get(result.checkpointId);

      expect(checkpoint).toBeDefined();
      expect(checkpoint?.snapshotId).toBe('snapshot-1');
    });

    it('should return undefined for non-existent checkpoint', () => {
      const checkpoint = checkpointManager.get('non-existent');

      expect(checkpoint).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all checkpoints', () => {
      checkpointManager.create('snapshot-1');
      checkpointManager.create('snapshot-2');

      const checkpoints = checkpointManager.getAll();

      expect(checkpoints.length).toBe(2);
    });

    it('should return empty array when no checkpoints', () => {
      const checkpoints = checkpointManager.getAll();

      expect(checkpoints).toEqual([]);
    });
  });

  describe('getLast', () => {
    it('should return last checkpoint', () => {
      checkpointManager.create('snapshot-1');
      const result2 = checkpointManager.create('snapshot-2');

      const lastCheckpoint = checkpointManager.getLast();

      // getLast returns the most recent checkpoint by timestamp
      expect(lastCheckpoint).not.toBeNull();
      expect(lastCheckpoint?.snapshotId).toBe('snapshot-2');
    });

    it('should return null when no checkpoints', () => {
      const lastCheckpoint = checkpointManager.getLast();

      expect(lastCheckpoint).toBeNull();
    });
  });

  describe('getActiveCheckpointId', () => {
    it('should return active checkpoint ID', () => {
      const result = checkpointManager.create('snapshot-1');

      const activeId = checkpointManager.getActiveCheckpointId();

      expect(activeId).toBe(result.checkpointId);
    });

    it('should return null when no active checkpoint', () => {
      const activeId = checkpointManager.getActiveCheckpointId();

      expect(activeId).toBeNull();
    });
  });

  describe('commit', () => {
    it('should commit checkpoint', () => {
      const result = checkpointManager.create('snapshot-1');

      checkpointManager.commit(result.checkpointId);

      const checkpoint = checkpointManager.get(result.checkpointId);
      expect(checkpoint?.metadata.committed).toBe(true);
    });

    it('should mark checkpoint as not in progress', () => {
      const result = checkpointManager.create('snapshot-1');

      checkpointManager.commit(result.checkpointId);

      const checkpoint = checkpointManager.get(result.checkpointId);
      expect(checkpoint?.metadata.inProgress).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete checkpoint', () => {
      const result = checkpointManager.create('snapshot-1');

      const deleted = checkpointManager.delete(result.checkpointId);

      expect(deleted).toBe(true);
      expect(checkpointManager.get(result.checkpointId)).toBeUndefined();
    });

    it('should return false for non-existent checkpoint', () => {
      const deleted = checkpointManager.delete('non-existent');

      expect(deleted).toBe(false);
    });

    it('should clear active checkpoint ID when deleted', () => {
      const result = checkpointManager.create('snapshot-1');

      checkpointManager.delete(result.checkpointId);

      expect(checkpointManager.getActiveCheckpointId()).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all checkpoints', () => {
      checkpointManager.create('snapshot-1');
      checkpointManager.create('snapshot-2');

      checkpointManager.clear();

      expect(checkpointManager.getAll()).toHaveLength(0);
    });

    it('should clear active checkpoint ID', () => {
      checkpointManager.create('snapshot-1');

      checkpointManager.clear();

      expect(checkpointManager.getActiveCheckpointId()).toBeNull();
    });
  });

  describe('getCount', () => {
    it('should return checkpoint count', () => {
      checkpointManager.create('snapshot-1');
      checkpointManager.create('snapshot-2');

      expect(checkpointManager.getCount()).toBe(2);
    });

    it('should return 0 when empty', () => {
      expect(checkpointManager.getCount()).toBe(0);
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      checkpointManager.configure({ maxCheckpoints: 5 });

      const config = checkpointManager.getConfig();
      expect(config.maxCheckpoints).toBe(5);
    });
  });

  describe('cleanupOldCheckpoints', () => {
    it('should remove old checkpoints beyond max', () => {
      const manager = new CheckpointManager({ maxCheckpoints: 2 });

      manager.create('snapshot-1');
      manager.create('snapshot-2');
      manager.create('snapshot-3');

      expect(manager.getCount()).toBeLessThanOrEqual(2);
    });
  });
});
