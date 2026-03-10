/**
 * ChangeBatcher tests
 */

import { describe, it, expect, vi } from 'vitest';
import { ChangeBatcher } from '../ChangeBatcher';
import type { ChangeEvent } from '../../types';

function createMockEvent(atomId?: symbol): ChangeEvent {
  return {
    atom: {} as any,
    atomId: atomId ?? Symbol('test'),
    atomName: 'test',
    oldValue: 1,
    newValue: 2,
    timestamp: Date.now(),
    type: 'value',
  };
}

describe('ChangeBatcher', () => {
  describe('startBatch', () => {
    it('should set batch mode', () => {
      const batcher = new ChangeBatcher();

      batcher.startBatch();

      expect(batcher.isBatching()).toBe(true);
    });
  });

  describe('endBatch', () => {
    it('should return batch with changes', () => {
      const batcher = new ChangeBatcher();

      batcher.startBatch();
      batcher.addChange(createMockEvent());
      batcher.addChange(createMockEvent());
      const batch = batcher.endBatch();

      expect(batch.count).toBe(2);
      expect(batch.changes.length).toBe(2);
    });

    it('should clear queue after ending', () => {
      const batcher = new ChangeBatcher();

      batcher.startBatch();
      batcher.addChange(createMockEvent());
      batcher.endBatch();

      expect(batcher.getPendingChanges()).toEqual([]);
    });

    it('should end batch mode', () => {
      const batcher = new ChangeBatcher();

      batcher.startBatch();
      batcher.endBatch();

      expect(batcher.isBatching()).toBe(false);
    });
  });

  describe('isBatching', () => {
    it('should return false initially', () => {
      const batcher = new ChangeBatcher();
      expect(batcher.isBatching()).toBe(false);
    });

    it('should return true during batch', () => {
      const batcher = new ChangeBatcher();

      batcher.startBatch();

      expect(batcher.isBatching()).toBe(true);
    });
  });

  describe('addChange', () => {
    it('should add change to queue in batch mode', () => {
      const batcher = new ChangeBatcher();

      batcher.startBatch();
      batcher.addChange(createMockEvent());

      expect(batcher.getPendingChanges()).toHaveLength(1);
    });

    it('should not add change outside batch mode', () => {
      const batcher = new ChangeBatcher();

      batcher.addChange(createMockEvent());

      expect(batcher.getPendingChanges()).toHaveLength(0);
    });
  });

  describe('batch', () => {
    it('should execute function', () => {
      const batcher = new ChangeBatcher();
      const fn = vi.fn();

      batcher.batch(fn);

      expect(fn).toHaveBeenCalled();
    });

    it('should return batch after execution', () => {
      const batcher = new ChangeBatcher();

      const batch = batcher.batch(() => {
        batcher.addChange(createMockEvent());
      });

      expect(batch.count).toBe(1);
    });

    it('should cleanup on error', () => {
      const batcher = new ChangeBatcher();

      expect(() => {
        batcher.batch(() => {
          batcher.addChange(createMockEvent());
          throw new Error('Test error');
        });
      }).toThrow();

      expect(batcher.isBatching()).toBe(false);
      expect(batcher.getPendingChanges()).toHaveLength(0);
    });
  });

  describe('getPendingChanges', () => {
    it('should return copy of pending changes', () => {
      const batcher = new ChangeBatcher();

      batcher.startBatch();
      batcher.addChange(createMockEvent());

      const changes1 = batcher.getPendingChanges();
      const changes2 = batcher.getPendingChanges();

      expect(changes1).toEqual(changes2);
      expect(changes1).not.toBe(changes2);
    });
  });

  describe('clearPending', () => {
    it('should clear pending changes', () => {
      const batcher = new ChangeBatcher();

      batcher.startBatch();
      batcher.addChange(createMockEvent());
      batcher.clearPending();

      expect(batcher.getPendingChanges()).toHaveLength(0);
    });
  });
});
