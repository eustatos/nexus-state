/**
 * DeltaCalculator tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DeltaCalculatorImpl,
  DEFAULT_DELTA_CALCULATOR_CONFIG,
} from '../calculator';
import type { DeltaSnapshot, FullSnapshot } from '../types';

function createMockFullSnapshot(id: string, state?: Record<string, any>): FullSnapshot {
  return {
    id,
    type: 'full',
    baseSnapshotId: null,
    state: state || {
      atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
    },
    metadata: {
      timestamp: Date.now(),
      action: 'test',
      atomCount: 1,
    },
  };
}

function createMockDeltaSnapshot(
  id: string,
  baseId: string,
  changes?: Map<string, any>
): DeltaSnapshot {
  return {
    id,
    type: 'delta',
    baseSnapshotId: baseId,
    state: {},
    changes: changes || new Map(),
    metadata: {
      timestamp: Date.now(),
      action: 'test',
      atomCount: 0,
      baseTimestamp: Date.now() - 1000,
      changeCount: changes?.size || 0,
      compressedSize: 0,
      originalSize: 0,
    },
  };
}

describe('DeltaCalculatorImpl', () => {
  let calculator: DeltaCalculatorImpl;

  beforeEach(() => {
    calculator = new DeltaCalculatorImpl();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const calc = new DeltaCalculatorImpl();

      expect(calc).toBeDefined();
    });

    it('should create with custom config', () => {
      const calc = new DeltaCalculatorImpl({
        deepEqual: false,
        skipEmpty: false,
        trackPaths: true,
      });

      expect(calc).toBeDefined();
    });
  });

  describe('computeDelta', () => {
    it('should compute delta between two snapshots', () => {
      const snapshot1 = createMockFullSnapshot('snapshot1', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const snapshot2 = createMockFullSnapshot('snapshot2', {
        atom1: { value: 100, type: 'primitive', name: 'atom1', atomId: '1' },
      });

      const delta = calculator.computeDelta(snapshot1, snapshot2);

      expect(delta).not.toBeNull();
      expect(delta?.type).toBe('delta');
      expect(delta?.baseSnapshotId).toBe('snapshot1');
    });

    it('should return null for identical snapshots', () => {
      const snapshot1 = createMockFullSnapshot('snapshot1', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const snapshot2 = createMockFullSnapshot('snapshot2', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });

      const delta = calculator.computeDelta(snapshot1, snapshot2);

      expect(delta).toBeNull();
    });

    it('should compute delta with multiple changes', () => {
      const snapshot1 = createMockFullSnapshot('snapshot1', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
        atom2: { value: 'old', type: 'primitive', name: 'atom2', atomId: '2' },
      });
      const snapshot2 = createMockFullSnapshot('snapshot2', {
        atom1: { value: 100, type: 'primitive', name: 'atom1', atomId: '1' },
        atom2: { value: 'new', type: 'primitive', name: 'atom2', atomId: '2' },
      });

      const delta = calculator.computeDelta(snapshot1, snapshot2);

      expect(delta).not.toBeNull();
      expect(delta?.changes.size).toBeGreaterThan(0);
    });

    it('should handle added atoms', () => {
      const snapshot1 = createMockFullSnapshot('snapshot1', {});
      const snapshot2 = createMockFullSnapshot('snapshot2', {
        newAtom: { value: 'new', type: 'primitive', name: 'newAtom', atomId: '3' },
      });

      const delta = calculator.computeDelta(snapshot1, snapshot2);

      expect(delta).not.toBeNull();
      expect(delta?.changes.size).toBeGreaterThan(0);
    });

    it('should handle deleted atoms', () => {
      const snapshot1 = createMockFullSnapshot('snapshot1', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const snapshot2 = createMockFullSnapshot('snapshot2', {});

      const delta = calculator.computeDelta(snapshot1, snapshot2);

      expect(delta).not.toBeNull();
    });

    it('should return null for empty delta when skipEmpty is true', () => {
      const calc = new DeltaCalculatorImpl({ skipEmpty: true });
      const snapshot1 = createMockFullSnapshot('snapshot1', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const snapshot2 = createMockFullSnapshot('snapshot2', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });

      const delta = calc.computeDelta(snapshot1, snapshot2);

      expect(delta).toBeNull();
    });
  });

  describe('applyDelta', () => {
    it('should apply delta to base snapshot', () => {
      const base = createMockFullSnapshot('base', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const changes = new Map([
        ['atom1', {
          atomId: '1',
          atomName: 'atom1',
          oldValue: 42,
          newValue: 100,
          changeType: 'modified' as const,
        }],
      ]);
      const delta = createMockDeltaSnapshot('delta', 'base', changes);

      const result = calculator.applyDelta(base, delta);

      expect(result).not.toBeNull();
    });

    it('should handle added atoms in delta', () => {
      const base = createMockFullSnapshot('base', {});
      const changes = new Map([
        ['newAtom', {
          atomId: '2',
          atomName: 'newAtom',
          oldValue: null,
          newValue: 'new',
          changeType: 'added' as const,
        }],
      ]);
      const delta = createMockDeltaSnapshot('delta', 'base', changes);

      const result = calculator.applyDelta(base, delta);

      expect(result).not.toBeNull();
    });

    it('should handle deleted atoms in delta', () => {
      const base = createMockFullSnapshot('base', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const changes = new Map([
        ['atom1', {
          atomId: '1',
          atomName: 'atom1',
          oldValue: 42,
          newValue: null,
          changeType: 'deleted' as const,
        }],
      ]);
      const delta = createMockDeltaSnapshot('delta', 'base', changes);

      const result = calculator.applyDelta(base, delta);

      expect(result).not.toBeNull();
    });

    it('should return null for invalid delta', () => {
      const base = createMockFullSnapshot('base');
      const invalidDelta = {
        id: 'invalid',
        type: 'delta',
        baseSnapshotId: null,
        state: {},
        changes: new Map(),
        metadata: {
          timestamp: Date.now(),
          action: 'test',
          atomCount: 0,
          changeCount: 0,
          compressedSize: 0,
          originalSize: 0,
        },
      } as unknown as DeltaSnapshot;

      const result = calculator.applyDelta(base, invalidDelta);

      expect(result).toBeNull();
    });
  });

  describe('areSnapshotsEqual', () => {
    it('should return true for identical snapshots', () => {
      const snapshot1 = createMockFullSnapshot('snapshot1', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const snapshot2 = createMockFullSnapshot('snapshot2', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });

      expect(calculator.areSnapshotsEqual(snapshot1, snapshot2)).toBe(true);
    });

    it('should return false for different snapshots', () => {
      const snapshot1 = createMockFullSnapshot('snapshot1', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const snapshot2 = createMockFullSnapshot('snapshot2', {
        atom1: { value: 100, type: 'primitive', name: 'atom1', atomId: '1' },
      });

      expect(calculator.areSnapshotsEqual(snapshot1, snapshot2)).toBe(false);
    });

    it('should return false for snapshots with different atoms', () => {
      const snapshot1 = createMockFullSnapshot('snapshot1', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const snapshot2 = createMockFullSnapshot('snapshot2', {
        atom2: { value: 42, type: 'primitive', name: 'atom2', atomId: '2' },
      });

      expect(calculator.areSnapshotsEqual(snapshot1, snapshot2)).toBe(false);
    });
  });

  describe('calculateDeltaSize', () => {
    it('should return number for delta size', () => {
      const changes = new Map([
        ['atom1', {
          atomId: '1',
          atomName: 'atom1',
          oldValue: 42,
          newValue: 100,
          changeType: 'modified' as const,
        }],
      ]);

      const size = calculator.calculateDeltaSize(changes);

      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for empty changes', () => {
      const changes = new Map();

      const size = calculator.calculateDeltaSize(changes);

      expect(size).toBe(0);
    });

    it('should return number for different changes', () => {
      const changes1 = new Map([
        ['atom1', {
          atomId: '1',
          atomName: 'atom1',
          oldValue: 42,
          newValue: 100,
          changeType: 'modified' as const,
        }],
      ]);
      const changes2 = new Map([
        ['atom1', {
          atomId: '1',
          atomName: 'atom1',
          oldValue: 42,
          newValue: 100,
          changeType: 'modified' as const,
        }],
        ['atom2', {
          atomId: '2',
          atomName: 'atom2',
          oldValue: 'old',
          newValue: 'new',
          changeType: 'modified' as const,
        }],
      ]);

      const size1 = calculator.calculateDeltaSize(changes1);
      const size2 = calculator.calculateDeltaSize(changes2);

      expect(typeof size1).toBe('number');
      expect(typeof size2).toBe('number');
    });
  });

  describe('calculateSnapshotSize', () => {
    it('should calculate snapshot size', () => {
      const snapshot = createMockFullSnapshot('snapshot1', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });

      const size = calculator.calculateSnapshotSize(snapshot);

      expect(size).toBeGreaterThan(0);
    });

    it('should return size for empty snapshot', () => {
      const snapshot = createMockFullSnapshot('snapshot1', {});

      const size = calculator.calculateSnapshotSize(snapshot);

      // Empty snapshot still has id and metadata
      expect(size).toBeGreaterThanOrEqual(0);
    });

    it('should increase size with more atoms', () => {
      const snapshot1 = createMockFullSnapshot('snapshot1', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const snapshot2 = createMockFullSnapshot('snapshot2', {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
        atom2: { value: 'test', type: 'primitive', name: 'atom2', atomId: '2' },
      });

      const size1 = calculator.calculateSnapshotSize(snapshot1);
      const size2 = calculator.calculateSnapshotSize(snapshot2);

      expect(size2).toBeGreaterThan(size1);
    });
  });
});
