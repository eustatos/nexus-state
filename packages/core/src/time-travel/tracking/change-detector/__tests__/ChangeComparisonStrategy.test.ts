/**
 * Tests for ChangeComparisonStrategy
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeComparisonStrategy } from '../ChangeComparisonStrategy';

describe('ChangeComparisonStrategy', () => {
  let comparator: ChangeComparisonStrategy;

  beforeEach(() => {
    comparator = new ChangeComparisonStrategy();
  });

  describe('detectChangeType', () => {
    it('should detect created value', () => {
      const result = comparator.detectChangeType(undefined, 42);
      expect(result).toBe('created');
    });

    it('should detect deleted value', () => {
      const result = comparator.detectChangeType(42, undefined);
      expect(result).toBe('deleted');
    });

    it('should detect type change', () => {
      const result = comparator.detectChangeType(42, '42');
      expect(result).toBe('type');
    });

    it('should detect value change', () => {
      const result = comparator.detectChangeType(1, 2);
      expect(result).toBe('value');
    });

    it('should detect unchanged value', () => {
      const result = comparator.detectChangeType(42, 42);
      expect(result).toBe('unchanged');
    });

    it('should handle null values', () => {
      expect(comparator.detectChangeType(null, null)).toBe('unchanged');
      expect(comparator.detectChangeType(null, undefined)).toBe('deleted');
      expect(comparator.detectChangeType(undefined, null)).toBe('created');
    });

    it('should detect object value changes', () => {
      const oldObj = { a: 1 };
      const newObj = { a: 2 };
      expect(comparator.detectChangeType(oldObj, newObj)).toBe('value');
    });

    it('should detect array value changes', () => {
      const oldArr = [1, 2, 3];
      const newArr = [1, 2, 4];
      expect(comparator.detectChangeType(oldArr, newArr)).toBe('value');
    });
  });

  describe('hasChanged', () => {
    it('should return true for changed values', () => {
      expect(comparator.hasChanged(1, 2)).toBe(true);
      expect(comparator.hasChanged('a', 'b')).toBe(true);
    });

    it('should return false for unchanged values', () => {
      expect(comparator.hasChanged(42, 42)).toBe(false);
      expect(comparator.hasChanged('same', 'same')).toBe(false);
    });

    it('should return true for created/deleted', () => {
      expect(comparator.hasChanged(undefined, 1)).toBe(true);
      expect(comparator.hasChanged(1, undefined)).toBe(true);
    });
  });

  describe('compare', () => {
    it('should return comparison result', () => {
      const result = comparator.compare(1, 2);

      expect(result.hasChanged).toBe(true);
      expect(result.changeType).toBe('value');
      expect(result.oldValue).toBe(1);
      expect(result.newValue).toBe(2);
    });

    it('should return unchanged result for same values', () => {
      const result = comparator.compare(42, 42);

      expect(result.hasChanged).toBe(false);
      expect(result.changeType).toBe('unchanged');
    });
  });

  describe('primitive comparison', () => {
    it('should compare strings', () => {
      expect(comparator.hasChanged('hello', 'world')).toBe(true);
      expect(comparator.hasChanged('same', 'same')).toBe(false);
    });

    it('should compare numbers', () => {
      expect(comparator.hasChanged(1, 2)).toBe(true);
      expect(comparator.hasChanged(3.14, 3.14)).toBe(false);
    });

    it('should compare booleans', () => {
      expect(comparator.hasChanged(true, false)).toBe(true);
      expect(comparator.hasChanged(false, false)).toBe(false);
    });

    it('should compare symbols', () => {
      const sym1 = Symbol('a');
      const sym2 = Symbol('a');
      expect(comparator.hasChanged(sym1, sym1)).toBe(false);
      expect(comparator.hasChanged(sym1, sym2)).toBe(true);
    });
  });

  describe('array comparison', () => {
    it('should detect length changes', () => {
      expect(comparator.hasChanged([1, 2], [1, 2, 3])).toBe(true);
    });

    it('should detect element changes', () => {
      expect(comparator.hasChanged([1, 2, 3], [1, 2, 4])).toBe(true);
    });

    it('should handle empty arrays', () => {
      expect(comparator.hasChanged([], [])).toBe(false);
      expect(comparator.hasChanged([], [1])).toBe(true);
    });

    it('should handle nested arrays', () => {
      const oldArr = [[1, 2], [3, 4]];
      const newArr = [[1, 2], [3, 5]];
      expect(comparator.hasChanged(oldArr, newArr)).toBe(true);
    });
  });

  describe('object comparison', () => {
    it('should detect key additions', () => {
      const oldObj = { a: 1 };
      const newObj = { a: 1, b: 2 };
      expect(comparator.hasChanged(oldObj, newObj)).toBe(true);
    });

    it('should detect key deletions', () => {
      const oldObj = { a: 1, b: 2 };
      const newObj = { a: 1 };
      expect(comparator.hasChanged(oldObj, newObj)).toBe(true);
    });

    it('should detect value changes', () => {
      const oldObj = { a: 1 };
      const newObj = { a: 2 };
      expect(comparator.hasChanged(oldObj, newObj)).toBe(true);
    });

    it('should handle empty objects', () => {
      expect(comparator.hasChanged({}, {})).toBe(false);
    });

    it('should handle nested objects', () => {
      const oldObj = { a: { b: 1 } };
      const newObj = { a: { b: 2 } };
      expect(comparator.hasChanged(oldObj, newObj)).toBe(true);
    });

    it('should handle deep nesting', () => {
      const oldObj = { a: { b: { c: { d: 1 } } } };
      const newObj = { a: { b: { c: { d: 2 } } } };
      expect(comparator.hasChanged(oldObj, newObj)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle NaN', () => {
      expect(comparator.hasChanged(NaN, NaN)).toBe(true); // NaN !== NaN
    });

    it('should handle +0 and -0', () => {
      expect(comparator.hasChanged(+0, -0)).toBe(false); // +0 === -0
    });

    it('should handle mixed types in arrays', () => {
      const oldArr = [1, 'two', { three: 3 }];
      const newArr = [1, 'two', { three: 4 }];
      expect(comparator.hasChanged(oldArr, newArr)).toBe(true);
    });

    it('should handle large objects', () => {
      const largeObj1: Record<string, number> = {};
      const largeObj2: Record<string, number> = {};

      for (let i = 0; i < 1000; i++) {
        largeObj1[`key${i}`] = i;
        largeObj2[`key${i}`] = i;
      }

      expect(comparator.hasChanged(largeObj1, largeObj2)).toBe(false);

      largeObj2.key500 = 999;
      expect(comparator.hasChanged(largeObj1, largeObj2)).toBe(true);
    });
  });
});
