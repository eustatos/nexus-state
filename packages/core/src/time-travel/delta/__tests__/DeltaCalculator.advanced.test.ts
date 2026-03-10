/**
 * DeltaCalculator edge cases and advanced scenarios
 */

import { describe, it, expect } from 'vitest';
import { DeltaCalculatorImpl } from '../calculator';
import type { FullSnapshot } from '../types';

function createSnapshot(
  id: string,
  state: Record<string, any> = {},
  action = 'test',
): FullSnapshot {
  return {
    id,
    type: 'full',
    baseSnapshotId: null,
    state,
    metadata: {
      timestamp: Date.now(),
      action,
      atomCount: Object.keys(state).length,
    },
  };
}

describe('DeltaCalculatorImpl - edge cases', () => {
  describe('trackPaths option', () => {
    it('should include paths when trackPaths is true', () => {
      const calc = new DeltaCalculatorImpl({ trackPaths: true });
      const s1 = createSnapshot('s1', {
        atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const s2 = createSnapshot('s2', {
        atom1: { value: 2, type: 'primitive', name: 'atom1', atomId: '1' },
      });

      const delta = calc.computeDelta(s1, s2);

      expect(delta).not.toBeNull();
      const change = delta!.changes.get('atom1');
      expect(change?.path).toEqual([]);
    });

    it('should not include paths when trackPaths is false', () => {
      const calc = new DeltaCalculatorImpl({ trackPaths: false });
      const s1 = createSnapshot('s1', {
        atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const s2 = createSnapshot('s2', {
        atom1: { value: 2, type: 'primitive', name: 'atom1', atomId: '1' },
      });

      const delta = calc.computeDelta(s1, s2);

      const change = delta!.changes.get('atom1');
      expect(change?.path).toBeUndefined();
    });
  });

  describe('shallow equality', () => {
    it('should use shallow equality when deepEqual is false', () => {
      const calc = new DeltaCalculatorImpl({ deepEqual: false });
      const obj = { a: 1 };
      const s1 = createSnapshot('s1', {
        atom1: { value: obj, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const s2 = createSnapshot('s2', {
        atom1: { value: obj, type: 'primitive', name: 'atom1', atomId: '1' },
      });

      const delta = calc.computeDelta(s1, s2);

      expect(delta).toBeNull();
    });
  });

  describe('validation', () => {
    it('should skip validation when validate is false', () => {
      const calc = new DeltaCalculatorImpl({ validate: false });
      const base = createSnapshot('base', {
        atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const changes = new Map([
        [
          'atom1',
          {
            atomId: '1',
            atomName: 'atom1',
            oldValue: 1,
            newValue: 2,
            changeType: 'modified' as const,
          },
        ],
      ]);
      const delta = {
        id: 'delta',
        type: 'delta' as const,
        baseSnapshotId: 'base',
        state: {},
        changes,
        metadata: {
          timestamp: Date.now(),
          action: 'test',
          atomCount: 1,
          baseTimestamp: Date.now() - 1000,
          changeCount: 1,
          compressedSize: 0,
          originalSize: 0,
        },
      };

      const result = calc.applyDelta(base, delta, { validate: false });

      expect(result).not.toBeNull();
    });

    it('should validate baseSnapshotId match', () => {
      const calc = new DeltaCalculatorImpl({ validate: true });
      const base = createSnapshot('base', {
        atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const changes = new Map([
        [
          'atom1',
          {
            atomId: '1',
            atomName: 'atom1',
            oldValue: 1,
            newValue: 2,
            changeType: 'modified' as const,
          },
        ],
      ]);
      const delta = {
        id: 'delta',
        type: 'delta' as const,
        baseSnapshotId: 'wrong-id',
        state: {},
        changes,
        metadata: {
          timestamp: Date.now(),
          action: 'test',
          atomCount: 1,
          baseTimestamp: Date.now() - 1000,
          changeCount: 1,
          compressedSize: 0,
          originalSize: 0,
        },
      };

      const result = calc.applyDelta(base, delta);

      expect(result).toBeNull();
    });
  });

  describe('shallow equality', () => {
    it('should use shallow equality when deepEqual is false', () => {
      const calc = new DeltaCalculatorImpl({ deepEqual: false });
      const obj = { a: 1 };
      const s1 = createSnapshot('s1', {
        atom1: { value: obj, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const s2 = createSnapshot('s2', {
        atom1: { value: obj, type: 'primitive', name: 'atom1', atomId: '1' },
      });

      const delta = calc.computeDelta(s1, s2);

      expect(delta).toBeNull();
    });
  });

  describe('complex values', () => {
    it('should handle null values', () => {
      const calc = new DeltaCalculatorImpl();
      const s1 = createSnapshot('s1', {
        atom1: { value: null, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const s2 = createSnapshot('s2', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });

      const delta = calc.computeDelta(s1, s2);

      expect(delta).not.toBeNull();
    });

    it('should handle undefined values', () => {
      const calc = new DeltaCalculatorImpl();
      const s1 = createSnapshot('s1', {
        atom1: { value: undefined, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const s2 = createSnapshot('s2', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });

      const delta = calc.computeDelta(s1, s2);

      expect(delta).not.toBeNull();
    });

    it('should handle array values', () => {
      const calc = new DeltaCalculatorImpl();
      const s1 = createSnapshot('s1', {
        atom1: { value: [1, 2, 3], type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const s2 = createSnapshot('s2', {
        atom1: { value: [1, 2, 4], type: 'primitive', name: 'atom1', atomId: '1' },
      });

      const delta = calc.computeDelta(s1, s2);

      expect(delta).not.toBeNull();
    });

    it('should handle nested objects', () => {
      const calc = new DeltaCalculatorImpl();
      const s1 = createSnapshot('s1', {
        atom1: {
          value: { nested: { a: 1 } },
          type: 'primitive',
          name: 'atom1',
          atomId: '1',
        },
      });
      const s2 = createSnapshot('s2', {
        atom1: {
          value: { nested: { a: 2 } },
          type: 'primitive',
          name: 'atom1',
          atomId: '1',
        },
      });

      const delta = calc.computeDelta(s1, s2);

      expect(delta).not.toBeNull();
    });
  });

  describe('delta metadata', () => {
    it('should include action in metadata', () => {
      const calc = new DeltaCalculatorImpl();
      const s1 = createSnapshot('s1', {
        atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const s2 = createSnapshot('s2', {
        atom1: { value: 2, type: 'primitive', name: 'atom1', atomId: '1' },
      }, 'custom-action');

      const delta = calc.computeDelta(s1, s2);

      expect(delta?.metadata.action).toBe('custom-action');
    });

    it('should track change count', () => {
      const calc = new DeltaCalculatorImpl();
      const s1 = createSnapshot('s1', {
        atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
        atom2: { value: 2, type: 'primitive', name: 'atom2', atomId: '2' },
      });
      const s2 = createSnapshot('s2', {
        atom1: { value: 10, type: 'primitive', name: 'atom1', atomId: '1' },
        atom2: { value: 20, type: 'primitive', name: 'atom2', atomId: '2' },
      });

      const delta = calc.computeDelta(s1, s2);

      expect(delta?.metadata.changeCount).toBe(2);
    });
  });

  describe('applyDelta edge cases', () => {
    it('should preserve base snapshot id', () => {
      const calc = new DeltaCalculatorImpl();
      const base = createSnapshot('base-id', {
        atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const changes = new Map([
        [
          'atom1',
          {
            atomId: '1',
            atomName: 'atom1',
            oldValue: 1,
            newValue: 2,
            changeType: 'modified' as const,
          },
        ],
      ]);
      const delta = {
        id: 'delta',
        type: 'delta' as const,
        baseSnapshotId: 'base-id',
        state: {},
        changes,
        metadata: {
          timestamp: Date.now(),
          action: 'test',
          atomCount: 1,
          baseTimestamp: Date.now() - 1000,
          changeCount: 1,
          compressedSize: 0,
          originalSize: 0,
        },
      };

      const result = calc.applyDelta(base, delta);

      expect(result?.id).toBe('base-id');
    });

    it('should update timestamp after applying delta', () => {
      const calc = new DeltaCalculatorImpl();
      const base = createSnapshot('base', {
        atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const changes = new Map([
        [
          'atom1',
          {
            atomId: '1',
            atomName: 'atom1',
            oldValue: 1,
            newValue: 2,
            changeType: 'modified' as const,
          },
        ],
      ]);
      const newTimestamp = Date.now() + 1000;
      const delta = {
        id: 'delta',
        type: 'delta' as const,
        baseSnapshotId: 'base',
        state: {},
        changes,
        metadata: {
          timestamp: newTimestamp,
          action: 'test',
          atomCount: 1,
          baseTimestamp: Date.now() - 1000,
          changeCount: 1,
          compressedSize: 0,
          originalSize: 0,
        },
      };

      const result = calc.applyDelta(base, delta);

      expect(result?.metadata.timestamp).toBe(newTimestamp);
    });
  });
});
