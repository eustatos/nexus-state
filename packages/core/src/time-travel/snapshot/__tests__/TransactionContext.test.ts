/**
 * TransactionContext tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionContext } from '../TransactionContext';
import type { Atom } from '../../../types';
import type { SnapshotStateEntry } from '../types';

function createMockAtom(name: string, id?: symbol): Atom<unknown> {
  return {
    id: id || Symbol(name),
    name,
    type: 'primitive',
    get: vi.fn(),
    set: vi.fn(),
  } as unknown as Atom<unknown>;
}

function createMockStateEntry(): SnapshotStateEntry {
  return {
    value: 42,
    type: 'primitive',
    name: 'testAtom',
    atomId: Symbol('test').toString(),
  };
}

describe('TransactionContext', () => {
  let mockAtom: Atom<unknown>;
  let mockEntry: SnapshotStateEntry;

  beforeEach(() => {
    mockAtom = createMockAtom('testAtom');
    mockEntry = createMockStateEntry();
  });

  describe('constructor', () => {
    it('should create with initial state', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      expect(context).toBeDefined();
    });

    it('should set status to pending', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      expect(context.getStatus()).toBe('pending');
    });

    it('should generate transaction ID', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      expect(context.getId()).toBeDefined();
    });

    it('should set start time', () => {
      const beforeCreate = Date.now();
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );
      const afterCreate = Date.now();

      expect(context.getStartTime()).toBeGreaterThanOrEqual(beforeCreate);
      expect(context.getStartTime()).toBeLessThanOrEqual(afterCreate);
    });

    it('should initialize previous values map', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      expect(context.getPreviousValues()).toBeInstanceOf(Map);
    });
  });

  describe('begin', () => {
    it('should set status to in-progress', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      context.begin();

      expect(context.getStatus()).toBe('in-progress');
    });
  });

  describe('capturePreviousValues', () => {
    it('should capture previous values for atoms', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      const getCurrentValue = vi.fn((atom) => {
        if (atom === mockAtom) return 100;
        return undefined;
      });

      context.capturePreviousValues(getCurrentValue);

      const values = context.getPreviousValues();
      expect(values.has(mockAtom.id)).toBe(true);
      expect(values.get(mockAtom.id)).toBe(100);
    });

    it('should handle errors gracefully', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      const getCurrentValue = vi.fn(() => {
        throw new Error('Get value error');
      });

      expect(() => context.capturePreviousValues(getCurrentValue)).not.toThrow();
    });
  });

  describe('commit', () => {
    it('should set status to committed', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      context.commit();

      expect(context.getStatus()).toBe('committed');
    });

    it('should set end time', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      const beforeCommit = Date.now();
      context.commit();
      const afterCommit = Date.now();

      expect(context.getEndTime()).toBeDefined();
      expect(context.getEndTime()).toBeGreaterThanOrEqual(beforeCommit);
      expect(context.getEndTime()).toBeLessThanOrEqual(afterCommit);
    });
  });

  describe('rollback', () => {
    it('should set status to rolled-back', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      context.rollback();

      expect(context.getStatus()).toBe('rolled-back');
    });

    it('should set end time', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      const beforeRollback = Date.now();
      context.rollback();
      const afterRollback = Date.now();

      expect(context.getEndTime()).toBeDefined();
      expect(context.getEndTime()).toBeGreaterThanOrEqual(beforeRollback);
      expect(context.getEndTime()).toBeLessThanOrEqual(afterRollback);
    });
  });

  describe('fail', () => {
    it('should set status to failed', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      context.fail('Test error');

      expect(context.getStatus()).toBe('failed');
    });

    it('should set error message', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      context.fail('Test error');

      expect(context.getError()).toBe('Test error');
    });

    it('should set end time', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      context.fail('Test error');

      expect(context.getEndTime()).toBeDefined();
    });
  });

  describe('getDuration', () => {
    it('should return duration for completed transaction', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      context.begin();
      context.commit();

      const duration = context.getDuration();
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should return elapsed time for in-progress transaction', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      context.begin();

      const duration = context.getDuration();
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isActive', () => {
    it('should return true for pending transaction', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      expect(context.isActive()).toBe(true);
    });

    it('should return true for in-progress transaction', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      context.begin();

      expect(context.isActive()).toBe(true);
    });

    it('should return false for committed transaction', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      context.commit();

      expect(context.isActive()).toBe(false);
    });
  });

  describe('isCompleted', () => {
    it('should return false for pending transaction', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      expect(context.isCompleted()).toBe(false);
    });

    it('should return true for committed transaction', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      context.commit();

      expect(context.isCompleted()).toBe(true);
    });

    it('should return true for rolled-back transaction', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      context.rollback();

      expect(context.isCompleted()).toBe(true);
    });

    it('should return true for failed transaction', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      context.fail('error');

      expect(context.isCompleted()).toBe(true);
    });
  });

  describe('getAtoms', () => {
    it('should return atoms to restore', () => {
      const atoms = [{ key: 'atom1', entry: mockEntry, atom: mockAtom }];
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        atoms
      );

      const result = context.getAtoms();
      expect(result).toEqual(atoms);
    });
  });

  describe('getSnapshotId', () => {
    it('should return snapshot ID', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      expect(context.getSnapshotId()).toBe('snapshot-1');
    });
  });

  describe('getCheckpointId', () => {
    it('should return checkpoint ID', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      expect(context.getCheckpointId()).toBe('checkpoint-1');
    });
  });

  describe('getId', () => {
    it('should return transaction ID', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      const id = context.getId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });
  });

  describe('toJSON', () => {
    it('should return transaction state as plain object', () => {
      const context = new TransactionContext(
        'checkpoint-1',
        'snapshot-1',
        [{ key: 'atom1', entry: mockEntry, atom: mockAtom }]
      );

      const json = context.toJSON();

      expect(json.id).toBeDefined();
      expect(json.checkpointId).toBe('checkpoint-1');
      expect(json.snapshotId).toBe('snapshot-1');
      expect(json.atomCount).toBe(1);
      expect(json.status).toBe('pending');
    });
  });
});
