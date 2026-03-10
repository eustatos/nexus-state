/**
 * DeltaProcessor tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeltaProcessor } from '../DeltaProcessor';
import type { Snapshot, DeltaSnapshot } from '../../types';

function createSnapshot(id: string, state: Record<string, any> = {}): Snapshot {
  return {
    id,
    state,
    metadata: {
      timestamp: Date.now(),
      action: 'test',
      atomCount: Object.keys(state).length,
    },
  };
}

function createDelta(
  id: string,
  baseId: string,
  changes: Map<string, any> = new Map(),
): DeltaSnapshot {
  return {
    id,
    type: 'delta',
    baseSnapshotId: baseId,
    state: {},
    changes,
    metadata: {
      timestamp: Date.now(),
      action: 'test',
      atomCount: changes.size,
      baseTimestamp: Date.now() - 1000,
      changeCount: changes.size,
      compressedSize: 0,
      originalSize: 0,
    },
  };
}

describe('DeltaProcessor', () => {
  let processor: DeltaProcessor;

  beforeEach(() => {
    processor = new DeltaProcessor();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const p = new DeltaProcessor();
      expect(p.getConfig().deepEqual).toBe(true);
      expect(p.getConfig().skipEmpty).toBe(true);
    });

    it('should create with custom config', () => {
      const p = new DeltaProcessor({
        deepEqual: false,
        skipEmpty: false,
        computeHash: true,
      });
      expect(p.getConfig().deepEqual).toBe(false);
      expect(p.getConfig().computeHash).toBe(true);
    });
  });

  describe('computeDelta', () => {
    it('should compute delta between snapshots', () => {
      const base = createSnapshot('base', {
        atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const target = createSnapshot('target', {
        atom1: { value: 2, type: 'primitive', name: 'atom1', atomId: '1' },
      });

      const result = processor.computeDelta(base, target);

      expect(result.isEmpty).toBe(false);
      expect(result.changeCount).toBeGreaterThan(0);
    });

    it('should return empty for identical snapshots', () => {
      const base = createSnapshot('base', {
        atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const target = createSnapshot('target', {
        atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
      });

      const result = processor.computeDelta(base, target);

      expect(result.isEmpty).toBe(true);
      expect(result.changeCount).toBe(0);
    });
  });

  describe('applyDelta', () => {
    it('should apply delta to snapshot', () => {
      const base = createSnapshot('base', {
        atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const changes = new Map([
        ['atom1', {
          atomId: '1',
          atomName: 'atom1',
          oldValue: 1,
          newValue: 2,
          changeType: 'modified',
        }],
      ]);
      const delta = createDelta('delta', 'base', changes);

      const result = processor.applyDelta(base, delta);

      expect(result).not.toBeNull();
    });

    it('should return null for invalid delta', () => {
      const base = createSnapshot('base');
      const delta = createDelta('delta', 'wrong-base');

      const result = processor.applyDelta(base, delta);

      expect(result).toBeNull();
    });
  });

  describe('applyDeltas', () => {
    it('should apply multiple deltas', () => {
      const base = createSnapshot('base', {
        atom1: { value: 1, type: 'primitive', name: 'atom1', atomId: '1' },
      });
      const changes1 = new Map([
        ['atom1', {
          atomId: '1',
          atomName: 'atom1',
          oldValue: 1,
          newValue: 2,
          changeType: 'modified',
        }],
      ]);
      const delta1 = createDelta('d1', 'base', changes1);

      const result = processor.applyDeltas(base, [delta1]);

      expect(result).not.toBeNull();
    });

    it('should return null if any delta fails', () => {
      const base = createSnapshot('base');
      const delta = createDelta('d1', 'wrong-base');

      const result = processor.applyDeltas(base, [delta]);

      expect(result).toBeNull();
    });
  });

  describe('isDeltaApplicable', () => {
    it('should return true for matching base', () => {
      const snapshot = createSnapshot('snap1');
      const delta = createDelta('delta', 'snap1');

      expect(processor.isDeltaApplicable(snapshot, delta)).toBe(true);
    });

    it('should return false for non-matching base', () => {
      const snapshot = createSnapshot('snap1');
      const delta = createDelta('delta', 'snap2');

      expect(processor.isDeltaApplicable(snapshot, delta)).toBe(false);
    });
  });

  describe('mergeDeltas', () => {
    it('should return null for empty array', () => {
      const result = processor.mergeDeltas([]);
      expect(result).toBeNull();
    });

    it('should return single delta as is', () => {
      const delta = createDelta('d1', 'base');
      const result = processor.mergeDeltas([delta]);

      expect(result).toBe(delta);
    });

    it('should merge multiple deltas', () => {
      const changes1 = new Map([
        ['atom1', {
          atomId: '1',
          atomName: 'atom1',
          oldValue: 1,
          newValue: 2,
          changeType: 'modified',
        }],
      ]);
      const changes2 = new Map([
        ['atom2', {
          atomId: '2',
          atomName: 'atom2',
          oldValue: 'a',
          newValue: 'b',
          changeType: 'modified',
        }],
      ]);
      const delta1 = createDelta('d1', 'base', changes1);
      const delta2 = createDelta('d2', 'base', changes2);

      const result = processor.mergeDeltas([delta1, delta2]);

      expect(result).not.toBeNull();
      expect(result?.changes.size).toBe(2);
    });

    it('should override earlier changes with later', () => {
      const changes1 = new Map([
        ['atom1', {
          atomId: '1',
          atomName: 'atom1',
          oldValue: 1,
          newValue: 2,
          changeType: 'modified',
        }],
      ]);
      const changes2 = new Map([
        ['atom1', {
          atomId: '1',
          atomName: 'atom1',
          oldValue: 2,
          newValue: 3,
          changeType: 'modified',
        }],
      ]);
      const delta1 = createDelta('d1', 'base', changes1);
      const delta2 = createDelta('d2', 'base', changes2);

      const result = processor.mergeDeltas([delta1, delta2]);

      expect(result?.changes.size).toBe(1);
    });
  });

  describe('getDeltaSize', () => {
    it('should return size estimate', () => {
      const changes = new Map([
        ['atom1', {
          atomId: '1',
          atomName: 'atom1',
          oldValue: 1,
          newValue: 2,
          changeType: 'modified',
        }],
      ]);
      const delta = createDelta('delta', 'base', changes);

      const size = processor.getDeltaSize(delta);

      expect(size).toBeGreaterThan(0);
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      processor.configure({ deepEqual: false });
      expect(processor.getConfig().deepEqual).toBe(false);
    });

    it('should preserve existing config', () => {
      processor.configure({ skipEmpty: false });
      const config = processor.getConfig();
      expect(config.deepEqual).toBe(true);
      expect(config.skipEmpty).toBe(false);
    });
  });
});
