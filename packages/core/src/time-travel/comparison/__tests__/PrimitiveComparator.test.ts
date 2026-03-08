/**
 * Tests for PrimitiveComparator
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PrimitiveComparator } from '../PrimitiveComparator';

describe('PrimitiveComparator', () => {
  let comparator: PrimitiveComparator;

  beforeEach(() => {
    comparator = new PrimitiveComparator();
  });

  describe('isPrimitive', () => {
    it('should return true for null', () => {
      expect(comparator.isPrimitive(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(comparator.isPrimitive(undefined)).toBe(true);
    });

    it('should return true for strings', () => {
      expect(comparator.isPrimitive('hello')).toBe(true);
    });

    it('should return true for numbers', () => {
      expect(comparator.isPrimitive(42)).toBe(true);
    });

    it('should return true for booleans', () => {
      expect(comparator.isPrimitive(true)).toBe(true);
      expect(comparator.isPrimitive(false)).toBe(true);
    });

    it('should return true for symbols', () => {
      expect(comparator.isPrimitive(Symbol('test'))).toBe(true);
    });

    it('should return true for bigints', () => {
      expect(comparator.isPrimitive(BigInt(42))).toBe(true);
    });

    it('should return false for objects', () => {
      expect(comparator.isPrimitive({})).toBe(false);
      expect(comparator.isPrimitive([])).toBe(false);
      expect(comparator.isPrimitive(() => {})).toBe(false);
    });
  });

  describe('compare', () => {
    it('should return comparison result for equal primitives', () => {
      const result = comparator.compare(42, 42);

      expect(result.isEqual).toBe(true);
      expect(result.typeA).toBe('number');
      expect(result.typeB).toBe('number');
      expect(result.bothPrimitives).toBe(true);
    });

    it('should return comparison result for different primitives', () => {
      const result = comparator.compare(42, 43);

      expect(result.isEqual).toBe(false);
      expect(result.bothPrimitives).toBe(true);
    });

    it('should return comparison result for different types', () => {
      const result = comparator.compare(42, '42');

      expect(result.isEqual).toBe(false);
      expect(result.typeA).toBe('number');
      expect(result.typeB).toBe('string');
    });
  });

  describe('areEqual', () => {
    it('should return true for same primitive values', () => {
      expect(comparator.areEqual(42, 42)).toBe(true);
      expect(comparator.areEqual('hello', 'hello')).toBe(true);
      expect(comparator.areEqual(true, true)).toBe(true);
    });

    it('should return false for different primitive values', () => {
      expect(comparator.areEqual(42, 43)).toBe(false);
      expect(comparator.areEqual('hello', 'world')).toBe(false);
      expect(comparator.areEqual(true, false)).toBe(false);
    });

    it('should handle NaN correctly', () => {
      expect(comparator.areEqual(NaN, NaN)).toBe(true);
      expect(comparator.areEqual(NaN, 42)).toBe(false);
    });

    it('should handle +0 and -0 correctly', () => {
      expect(comparator.areEqual(+0, -0)).toBe(true);
      expect(comparator.areEqual(0, 0)).toBe(true);
    });

    it('should handle null', () => {
      expect(comparator.areEqual(null, null)).toBe(true);
      expect(comparator.areEqual(null, undefined)).toBe(false);
      expect(comparator.areEqual(null, 0)).toBe(false);
    });

    it('should handle undefined', () => {
      expect(comparator.areEqual(undefined, undefined)).toBe(true);
      expect(comparator.areEqual(undefined, null)).toBe(false);
    });

    it('should handle symbols', () => {
      const sym = Symbol('test');
      expect(comparator.areEqual(sym, sym)).toBe(true);
      expect(comparator.areEqual(Symbol('test'), Symbol('test'))).toBe(false);
    });

    it('should handle bigints', () => {
      expect(comparator.areEqual(BigInt(42), BigInt(42))).toBe(true);
      expect(comparator.areEqual(BigInt(42), BigInt(43))).toBe(false);
    });

    it('should return false for non-primitives', () => {
      expect(comparator.areEqual({}, {})).toBe(false);
      expect(comparator.areEqual([], [])).toBe(false);
    });
  });

  describe('getType', () => {
    it('should return correct type for primitives', () => {
      expect(comparator.getType(null)).toBe('null');
      expect(comparator.getType(undefined)).toBe('undefined');
      expect(comparator.getType(42)).toBe('number');
      expect(comparator.getType('hello')).toBe('string');
      expect(comparator.getType(true)).toBe('boolean');
      expect(comparator.getType(Symbol('test'))).toBe('symbol');
      expect(comparator.getType(BigInt(42))).toBe('bigint');
    });

    it('should return correct type for objects', () => {
      expect(comparator.getType({})).toBe('object');
      expect(comparator.getType([])).toBe('object');
      expect(comparator.getType(() => {})).toBe('function');
    });
  });

  describe('isNaN', () => {
    it('should return true for NaN', () => {
      expect(comparator.isNaN(NaN)).toBe(true);
    });

    it('should return false for non-NaN numbers', () => {
      expect(comparator.isNaN(42)).toBe(false);
      expect(comparator.isNaN(0)).toBe(false);
      expect(comparator.isNaN(Infinity)).toBe(false);
      expect(comparator.isNaN(-Infinity)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(comparator.isNaN('NaN')).toBe(false);
      expect(comparator.isNaN(null)).toBe(false);
      expect(comparator.isNaN(undefined)).toBe(false);
    });
  });

  describe('isZero', () => {
    it('should return true for +0 and -0', () => {
      expect(comparator.isZero(+0)).toBe(true);
      expect(comparator.isZero(-0)).toBe(true);
      expect(comparator.isZero(0)).toBe(true);
    });

    it('should return false for non-zero numbers', () => {
      expect(comparator.isZero(1)).toBe(false);
      expect(comparator.isZero(-1)).toBe(false);
      expect(comparator.isZero(0.001)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(comparator.isZero('0')).toBe(false);
      expect(comparator.isZero(null)).toBe(false);
    });
  });

  describe('compareNumbers', () => {
    it('should compare equal numbers', () => {
      expect(comparator.compareNumbers(42, 42)).toBe(true);
    });

    it('should compare different numbers', () => {
      expect(comparator.compareNumbers(42, 43)).toBe(false);
    });

    it('should handle NaN', () => {
      expect(comparator.compareNumbers(NaN, NaN)).toBe(true);
      expect(comparator.compareNumbers(NaN, 42)).toBe(false);
    });

    it('should handle zeros', () => {
      expect(comparator.compareNumbers(+0, -0)).toBe(true);
      expect(comparator.compareNumbers(0, 0)).toBe(true);
    });

    it('should handle infinity', () => {
      expect(comparator.compareNumbers(Infinity, Infinity)).toBe(true);
      expect(comparator.compareNumbers(-Infinity, -Infinity)).toBe(true);
      expect(comparator.compareNumbers(Infinity, -Infinity)).toBe(false);
    });
  });

  describe('compareStrings', () => {
    it('should compare equal strings', () => {
      expect(comparator.compareStrings('hello', 'hello')).toBe(true);
    });

    it('should compare different strings', () => {
      expect(comparator.compareStrings('hello', 'world')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(comparator.compareStrings('', '')).toBe(true);
    });

    it('should handle case sensitivity', () => {
      expect(comparator.compareStrings('Hello', 'hello')).toBe(false);
    });
  });

  describe('compareBooleans', () => {
    it('should compare equal booleans', () => {
      expect(comparator.compareBooleans(true, true)).toBe(true);
      expect(comparator.compareBooleans(false, false)).toBe(true);
    });

    it('should compare different booleans', () => {
      expect(comparator.compareBooleans(true, false)).toBe(false);
    });
  });

  describe('compareSymbols', () => {
    it('should compare same symbol', () => {
      const sym = Symbol('test');
      expect(comparator.compareSymbols(sym, sym)).toBe(true);
    });

    it('should compare different symbols with same description', () => {
      const sym1 = Symbol('test');
      const sym2 = Symbol('test');
      expect(comparator.compareSymbols(sym1, sym2)).toBe(false);
    });
  });

  describe('compareBigints', () => {
    it('should compare equal bigints', () => {
      expect(comparator.compareBigints(BigInt(42), BigInt(42))).toBe(true);
    });

    it('should compare different bigints', () => {
      expect(comparator.compareBigints(BigInt(42), BigInt(43))).toBe(false);
    });

    it('should handle large bigints', () => {
      const big1 = BigInt('9007199254740993');
      const big2 = BigInt('9007199254740993');
      expect(comparator.compareBigints(big1, big2)).toBe(true);
    });
  });

  describe('compareNull', () => {
    it('should return true for both null', () => {
      expect(comparator.compareNull(null, null)).toBe(true);
    });

    it('should return false for null and non-null', () => {
      expect(comparator.compareNull(null, undefined)).toBe(false);
      expect(comparator.compareNull(null, 0)).toBe(false);
    });
  });

  describe('compareUndefined', () => {
    it('should return true for both undefined', () => {
      expect(comparator.compareUndefined(undefined, undefined)).toBe(true);
    });

    it('should return false for undefined and non-undefined', () => {
      expect(comparator.compareUndefined(undefined, null)).toBe(false);
      expect(comparator.compareUndefined(undefined, 0)).toBe(false);
    });
  });

  describe('getDisplayValue', () => {
    it('should return string representation for primitives', () => {
      expect(comparator.getDisplayValue(42)).toBe('42');
      expect(comparator.getDisplayValue('hello')).toBe('hello');
      expect(comparator.getDisplayValue(true)).toBe('true');
    });

    it('should return "null" for null', () => {
      expect(comparator.getDisplayValue(null)).toBe('null');
    });

    it('should return "undefined" for undefined', () => {
      expect(comparator.getDisplayValue(undefined)).toBe('undefined');
    });

    it('should return "NaN" for NaN', () => {
      expect(comparator.getDisplayValue(NaN)).toBe('NaN');
    });

    it('should return symbol description', () => {
      const sym = Symbol('test');
      expect(comparator.getDisplayValue(sym)).toBe('Symbol(test)');
    });

    it('should return bigint with "n" suffix', () => {
      expect(comparator.getDisplayValue(BigInt(42))).toBe('42n');
    });
  });

  describe('edge cases', () => {
    it('should handle Number.MIN_VALUE', () => {
      expect(comparator.areEqual(Number.MIN_VALUE, Number.MIN_VALUE)).toBe(true);
    });

    it('should handle Number.MAX_VALUE', () => {
      expect(comparator.areEqual(Number.MAX_VALUE, Number.MAX_VALUE)).toBe(true);
    });

    it('should handle very large bigints', () => {
      const big1 = BigInt('123456789012345678901234567890');
      const big2 = BigInt('123456789012345678901234567890');
      expect(comparator.areEqual(big1, big2)).toBe(true);
    });

    it('should handle unicode strings', () => {
      expect(comparator.areEqual('你好', '你好')).toBe(true);
      expect(comparator.areEqual('你好', 'Hello')).toBe(false);
    });

    it('should handle emoji strings', () => {
      expect(comparator.areEqual('😀', '😀')).toBe(true);
      expect(comparator.areEqual('😀', '😃')).toBe(false);
    });
  });
});
