/**
 * StateComparator tests
 */

import { describe, it, expect } from 'vitest';
import { StateComparator } from '../StateComparator';
import type { SnapshotStateEntry } from '../../types';

describe('StateComparator', () => {
  describe('statesEqual', () => {
    it('should return true for identical states', () => {
      const comparator = new StateComparator();
      const state: Record<string, SnapshotStateEntry> = {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      };

      expect(comparator.statesEqual(state, state)).toBe(true);
    });

    it('should return true for equal states', () => {
      const comparator = new StateComparator();
      const state1: Record<string, SnapshotStateEntry> = {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      };
      const state2: Record<string, SnapshotStateEntry> = {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      };

      expect(comparator.statesEqual(state1, state2)).toBe(true);
    });

    it('should return false for states with different lengths', () => {
      const comparator = new StateComparator();
      const state1: Record<string, SnapshotStateEntry> = {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      };
      const state2: Record<string, SnapshotStateEntry> = {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
        atom2: { value: 43, type: 'primitive', name: 'atom2', atomId: '2' },
      };

      expect(comparator.statesEqual(state1, state2)).toBe(false);
    });

    it('should return false for states with different values', () => {
      const comparator = new StateComparator();
      const state1: Record<string, SnapshotStateEntry> = {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      };
      const state2: Record<string, SnapshotStateEntry> = {
        atom1: { value: 43, type: 'primitive', name: 'atom1', atomId: '1' },
      };

      expect(comparator.statesEqual(state1, state2)).toBe(false);
    });

    it('should return false for states with different types', () => {
      const comparator = new StateComparator();
      const state1: Record<string, SnapshotStateEntry> = {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      };
      const state2: Record<string, SnapshotStateEntry> = {
        atom1: { value: 42, type: 'computed', name: 'atom1', atomId: '1' },
      };

      expect(comparator.statesEqual(state1, state2)).toBe(false);
    });

    it('should return false for states with different keys', () => {
      const comparator = new StateComparator();
      const state1: Record<string, SnapshotStateEntry> = {
        atom1: { value: 42, type: 'primitive', name: 'atom1', atomId: '1' },
      };
      const state2: Record<string, SnapshotStateEntry> = {
        atom2: { value: 42, type: 'primitive', name: 'atom2', atomId: '2' },
      };

      expect(comparator.statesEqual(state1, state2)).toBe(false);
    });
  });

  describe('valuesEqual', () => {
    it('should return true for identical primitives', () => {
      const comparator = new StateComparator();
      expect(comparator.valuesEqual(42, 42)).toBe(true);
      expect(comparator.valuesEqual('hello', 'hello')).toBe(true);
    });

    it('should return false for different primitives', () => {
      const comparator = new StateComparator();
      expect(comparator.valuesEqual(42, 43)).toBe(false);
      expect(comparator.valuesEqual('hello', 'world')).toBe(false);
    });

    it('should return false for different types', () => {
      const comparator = new StateComparator();
      expect(comparator.valuesEqual(42, '42')).toBe(false);
    });

    it('should return true for equal objects', () => {
      const comparator = new StateComparator();
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };

      expect(comparator.valuesEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for different objects', () => {
      const comparator = new StateComparator();
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };

      expect(comparator.valuesEqual(obj1, obj2)).toBe(false);
    });

    it('should handle null values', () => {
      const comparator = new StateComparator();
      expect(comparator.valuesEqual(null, null)).toBe(true);
      expect(comparator.valuesEqual(null, undefined)).toBe(false);
    });
  });
});
