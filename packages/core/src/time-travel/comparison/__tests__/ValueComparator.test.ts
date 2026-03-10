/**
 * Tests for ValueComparator
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect } from 'vitest';
import { ValueComparator } from '../ValueComparator';
import type { ComparisonOptions } from '../types';

/**
 * Create default comparison options
 */
function createDefaultOptions(): ComparisonOptions {
  return {
    maxDepth: 10,
    ignoreFunctions: false,
    ignoreUndefined: false,
    ignoreNull: false,
  };
}

describe('ValueComparator', () => {
  describe('areEqual - primitives', () => {
    it('should compare equal numbers', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual(42, 42)).toBe(true);
    });

    it('should compare different numbers', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual(42, 43)).toBe(false);
    });

    it('should handle NaN', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual(NaN, NaN)).toBe(true);
    });

    it('should compare strings', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual('hello', 'hello')).toBe(true);
      expect(comparator.areEqual('hello', 'world')).toBe(false);
    });

    it('should compare booleans', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual(true, true)).toBe(true);
      expect(comparator.areEqual(true, false)).toBe(false);
    });

    it('should handle null', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual(null, null)).toBe(true);
      expect(comparator.areEqual(null, undefined)).toBe(false);
    });

    it('should handle undefined', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual(undefined, undefined)).toBe(true);
    });
  });

  describe('areEqual - arrays', () => {
    it('should compare equal arrays', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it('should compare different arrays', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it('should handle empty arrays', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual([], [])).toBe(true);
    });

    it('should handle nested arrays', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual([[1, 2], [3, 4]], [[1, 2], [3, 4]])).toBe(true);
    });
  });

  describe('areEqual - objects', () => {
    it('should compare equal objects', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('should compare different objects', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('should handle empty objects', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual({}, {})).toBe(true);
    });

    it('should handle nested objects', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual(
        { a: { b: { c: 1 } } },
        { a: { b: { c: 1 } } }
      )).toBe(true);
    });

    it('should handle different keys', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual({ a: 1 }, { b: 1 })).toBe(false);
    });
  });

  describe('areEqual - dates', () => {
    it('should compare equal dates', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-01');
      expect(comparator.areEqual(date1, date2)).toBe(true);
    });

    it('should compare different dates', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');
      expect(comparator.areEqual(date1, date2)).toBe(false);
    });
  });

  describe('areEqual - regex', () => {
    it('should compare equal regex', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual(/abc/g, /abc/g)).toBe(true);
    });

    it('should compare different regex', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual(/abc/g, /abc/i)).toBe(false);
    });
  });

  describe('areEqual - maps', () => {
    it('should compare equal maps', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      const map1 = new Map([['a', 1], ['b', 2]]);
      const map2 = new Map([['a', 1], ['b', 2]]);
      expect(comparator.areEqual(map1, map2)).toBe(true);
    });

    it('should compare different maps', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      const map1 = new Map([['a', 1]]);
      const map2 = new Map([['a', 2]]);
      expect(comparator.areEqual(map1, map2)).toBe(false);
    });
  });

  describe('areEqual - sets', () => {
    it('should compare equal sets', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 3]);
      expect(comparator.areEqual(set1, set2)).toBe(true);
    });

    it('should compare different sets', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 4]);
      expect(comparator.areEqual(set1, set2)).toBe(false);
    });
  });

  describe('areEqual - functions', () => {
    it('should compare functions when not ignored', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      const fn = () => 42;
      expect(comparator.areEqual(fn, fn)).toBe(true);
    });

    it('should ignore functions when option set', () => {
      const comparator = new ValueComparator({
        ...createDefaultOptions(),
        ignoreFunctions: true,
      });
      const fn1 = () => 42;
      const fn2 = () => 43;
      expect(comparator.areEqual(fn1, fn2)).toBe(true);
    });
  });

  describe('areEqual - circular references', () => {
    it('should handle circular references', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      const obj1: any = { a: 1 };
      obj1.self = obj1;
      const obj2: any = { a: 1 };
      obj2.self = obj2;
      expect(comparator.areEqual(obj1, obj2)).toBe(true);
    });
  });

  describe('areEqual - max depth', () => {
    it('should respect max depth', () => {
      const comparator = new ValueComparator({
        ...createDefaultOptions(),
        maxDepth: 2,
      });
      const deep1 = { a: { b: { c: { d: 1 } } } };
      const deep2 = { a: { b: { c: { d: 2 } } } };
      // Should return true at max depth
      expect(comparator.areEqual(deep1, deep2)).toBe(true);
    });
  });

  describe('diff', () => {
    it('should return diff result', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      const diff = comparator.diff(42, 42);
      expect(diff).toBeDefined();
    });

    it('should detect value changes', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      const diff = comparator.diff(1, 2);
      expect(diff).toBeDefined();
    });

    it('should detect object changes', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      const diff = comparator.diff({ a: 1 }, { a: 2 });
      expect(diff).toBeDefined();
    });

    it('should detect array changes', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      const diff = comparator.diff([1, 2, 3], [1, 2, 4]);
      expect(diff).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle +0 and -0', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual(+0, -0)).toBe(true);
    });

    it('should handle different types', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      expect(comparator.areEqual(1, '1')).toBe(false);
      expect(comparator.areEqual(null, undefined)).toBe(false);
    });

    it('should handle large objects', () => {
      const comparator = new ValueComparator(createDefaultOptions());
      const obj1: Record<string, number> = {};
      const obj2: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        obj1[`key${i}`] = i;
        obj2[`key${i}`] = i;
      }
      expect(comparator.areEqual(obj1, obj2)).toBe(true);
    });
  });
});
