/**
 * DeltaApplier tests
 */

import { describe, it, expect, vi } from 'vitest';
import { DeltaApplier } from '../DeltaApplier';
import { DeltaCalculatorImpl } from '../../calculator';
import type { Snapshot, DeltaSnapshot } from '../../../types';

function createMockSnapshot(id: string, value: number = 1): Snapshot {
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

function createMockDelta(id: string, baseId: string, value: number): DeltaSnapshot {
  return {
    id,
    type: 'delta',
    baseSnapshotId: baseId,
    state: {},
    changes: new Map([
      [
        'atom1',
        {
          atomId: '1',
          atomName: 'atom1',
          oldValue: 1,
          newValue: value,
          changeType: 'modified',
        },
      ],
    ]),
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
}

describe('DeltaApplier', () => {
  describe('constructor', () => {
    it('should create with default calculator', () => {
      const applier = new DeltaApplier();
      expect(applier).toBeDefined();
    });

    it('should create with custom calculator', () => {
      const calculator = new DeltaCalculatorImpl();
      const applier = new DeltaApplier(calculator);
      expect(applier).toBeDefined();
    });
  });

  describe('applyDelta', () => {
    it('should apply delta to snapshot', () => {
      const applier = new DeltaApplier();
      const snapshot = createMockSnapshot('snap1', 1);
      const delta = createMockDelta('delta1', 'snap1', 2);

      const result = applier.applyDelta(snapshot, delta);

      expect(result).not.toBeNull();
    });

    it('should return null for invalid delta', () => {
      const applier = new DeltaApplier();
      const snapshot = createMockSnapshot('snap1', 1);
      const delta = createMockDelta('delta1', 'wrong-base', 2);

      const result = applier.applyDelta(snapshot, delta);

      expect(result).toBeNull();
    });
  });

  describe('getCalculator', () => {
    it('should return the calculator', () => {
      const calculator = new DeltaCalculatorImpl();
      const applier = new DeltaApplier(calculator);

      expect(applier.getCalculator()).toBe(calculator);
    });
  });
});
