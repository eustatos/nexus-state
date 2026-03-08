/**
 * SnapshotValidator tests
 */

import { describe, it, expect } from 'vitest';
import { SnapshotValidator } from '../SnapshotValidator';
import type { Snapshot } from '../../types';

function createMockSnapshot(overrides?: Partial<Snapshot>): Snapshot {
  return {
    id: 'test-id',
    state: {
      atom1: {
        value: 42,
        type: 'primitive',
        name: 'atom1',
        atomId: '1',
      },
    },
    metadata: {
      timestamp: Date.now(),
      action: 'test',
      atomCount: 1,
    },
    ...overrides,
  } as Snapshot;
}

describe('SnapshotValidator', () => {
  describe('validate', () => {
    it('should return true for valid snapshot', () => {
      const validator = new SnapshotValidator();
      const snapshot = createMockSnapshot();

      expect(validator.validate(snapshot)).toBe(true);
    });

    it('should return false for snapshot without id', () => {
      const validator = new SnapshotValidator();
      const snapshot = createMockSnapshot({ id: undefined as any });

      expect(validator.validate(snapshot)).toBe(false);
    });

    it('should return false for snapshot without metadata', () => {
      const validator = new SnapshotValidator();
      const snapshot = createMockSnapshot({ metadata: undefined as any });

      expect(validator.validate(snapshot)).toBe(false);
    });

    it('should return false for snapshot without timestamp', () => {
      const validator = new SnapshotValidator();
      const snapshot = createMockSnapshot({
        metadata: { timestamp: undefined as any, action: 'test', atomCount: 1 },
      });

      expect(validator.validate(snapshot)).toBe(false);
    });

    it('should return false for snapshot without state', () => {
      const validator = new SnapshotValidator();
      const snapshot = createMockSnapshot({ state: undefined as any });

      expect(validator.validate(snapshot)).toBe(false);
    });
  });

  describe('validateState', () => {
    it('should return true for valid state', () => {
      const validator = new SnapshotValidator();
      const state = {
        atom1: {
          value: 42,
          type: 'primitive',
          name: 'atom1',
          atomId: '1',
        },
      };

      expect(validator.validateState(state)).toBe(true);
    });

    it('should return false for null state', () => {
      const validator = new SnapshotValidator();

      expect(validator.validateState(null as any)).toBe(false);
    });

    it('should return false for invalid entry', () => {
      const validator = new SnapshotValidator();
      const state = {
        atom1: {
          value: 42,
          // Missing required fields
        },
      };

      expect(validator.validateState(state as any)).toBe(false);
    });

    it('should return false for empty state', () => {
      const validator = new SnapshotValidator();
      const state = {};

      expect(validator.validateState(state)).toBe(true);
    });
  });
});
