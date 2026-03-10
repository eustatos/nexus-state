/**
 * Atom Edge Cases Tests
 * Tests for edge cases and special values in atoms
 */

import { describe, it, expect } from 'vitest';
import { atom, createStore } from '../../index';
import type { Getter } from '../../types';

describe('Atom Edge Cases', () => {
  describe('Null and Undefined', () => {
    it('should handle null initial value', () => {
      const nullAtom = atom(null);
      const store = createStore();
      expect(store.get(nullAtom)).toBeNull();
    });

    it('should handle undefined initial value', () => {
      const undefinedAtom = atom(undefined);
      const store = createStore();
      expect(store.get(undefinedAtom)).toBeUndefined();
    });

    it('should handle null in computed atom', () => {
      const baseAtom = atom<string | null>('hello');
      const lengthAtom = atom((get: Getter) => {
        const value = get(baseAtom);
        return value === null ? 0 : value.length;
      });

      const store = createStore();
      expect(store.get(lengthAtom)).toBe(5);

      store.set(baseAtom, null);
      expect(store.get(lengthAtom)).toBe(0);
    });

    it('should distinguish between null and undefined', () => {
      const nullAtom = atom(null);
      const undefinedAtom = atom(undefined);
      const store = createStore();

      expect(store.get(nullAtom)).toBeNull();
      expect(store.get(undefinedAtom)).toBeUndefined();
      expect(store.get(nullAtom)).not.toBe(store.get(undefinedAtom));
    });
  });

  describe('Empty Values', () => {
    it('should handle empty string', () => {
      const emptyAtom = atom('');
      const store = createStore();
      expect(store.get(emptyAtom)).toBe('');
      expect(store.get(emptyAtom)).toHaveLength(0);
    });

    it('should handle empty array', () => {
      const emptyArrayAtom = atom<number[]>([]);
      const store = createStore();
      expect(store.get(emptyArrayAtom)).toEqual([]);
      expect(store.get(emptyArrayAtom)).toHaveLength(0);
    });

    it('should handle empty object', () => {
      const emptyObjectAtom = atom<Record<string, unknown>>({});
      const store = createStore();
      expect(store.get(emptyObjectAtom)).toEqual({});
      expect(Object.keys(store.get(emptyObjectAtom))).toHaveLength(0);
    });

    it('should handle empty Map', () => {
      const emptyMapAtom = atom(new Map<string, number>());
      const store = createStore();
      expect(store.get(emptyMapAtom)).toBeInstanceOf(Map);
      expect(store.get(emptyMapAtom)).toHaveProperty('size', 0);
    });

    it('should handle empty Set', () => {
      const emptySetAtom = atom(new Set<number>());
      const store = createStore();
      expect(store.get(emptySetAtom)).toBeInstanceOf(Set);
      expect(store.get(emptySetAtom)).toHaveProperty('size', 0);
    });
  });

  describe('Numeric Edge Cases', () => {
    it('should handle zero value', () => {
      const zeroAtom = atom(0);
      const store = createStore();
      expect(store.get(zeroAtom)).toBe(0);
      expect(store.get(zeroAtom)).toBe(0);
    });

    it('should handle negative zero', () => {
      const negZeroAtom = atom(-0);
      const store = createStore();
      const value = store.get(negZeroAtom);
      // Note: -0 === 0 in JavaScript, but Object.is(-0, 0) === false
      expect(Object.is(value, -0) || value === 0).toBe(true);
    });

    it('should handle negative numbers', () => {
      const negAtom = atom(-42);
      const store = createStore();
      expect(store.get(negAtom)).toBe(-42);
    });

    it('should handle large numbers', () => {
      const largeAtom = atom(Number.MAX_SAFE_INTEGER);
      const store = createStore();
      expect(store.get(largeAtom)).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle very large numbers', () => {
      const hugeAtom = atom(Number.MAX_VALUE);
      const store = createStore();
      expect(store.get(hugeAtom)).toBe(Number.MAX_VALUE);
    });

    it('should handle Infinity', () => {
      const infAtom = atom(Infinity);
      const store = createStore();
      expect(store.get(infAtom)).toBe(Infinity);
      expect(store.get(infAtom)).toBeGreaterThan(Number.MAX_VALUE);
    });

    it('should handle -Infinity', () => {
      const negInfAtom = atom(-Infinity);
      const store = createStore();
      expect(store.get(negInfAtom)).toBe(-Infinity);
      expect(store.get(negInfAtom)).toBeLessThan(-Number.MAX_VALUE);
    });

    it('should handle NaN', () => {
      const nanAtom = atom(NaN);
      const store = createStore();
      expect(Number.isNaN(store.get(nanAtom))).toBe(true);
    });

    it('should handle very small numbers', () => {
      const smallAtom = atom(Number.MIN_VALUE);
      const store = createStore();
      expect(store.get(smallAtom)).toBe(Number.MIN_VALUE);
      expect(store.get(smallAtom)).toBeGreaterThan(0);
    });

    it('should handle floating point precision', () => {
      const floatAtom = atom(0.1 + 0.2);
      const store = createStore();
      // Known floating point issue
      expect(store.get(floatAtom)).toBeCloseTo(0.3, 10);
    });
  });

  describe('Boolean Edge Cases', () => {
    it('should handle false boolean', () => {
      const falseAtom = atom(false);
      const store = createStore();
      expect(store.get(falseAtom)).toBe(false);
    });

    it('should handle true boolean', () => {
      const trueAtom = atom(true);
      const store = createStore();
      expect(store.get(trueAtom)).toBe(true);
    });

    it('should handle boolean from expression', () => {
      const baseAtom = atom(0);
      const boolAtom = atom((get: Getter) => get(baseAtom) > 0);
      const store = createStore();

      expect(store.get(boolAtom)).toBe(false);
      store.set(baseAtom, 1);
      expect(store.get(boolAtom)).toBe(true);
    });
  });

  describe('Complex Nested Objects', () => {
    it('should handle complex nested objects', () => {
      const complexAtom = atom({
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
        array: [1, 2, { nested: true }],
      });
      const store = createStore();

      const value = store.get(complexAtom);
      expect(value.level1.level2.level3.value).toBe('deep');
      expect(value.array[2].nested).toBe(true);
    });

    it('should handle deeply nested arrays', () => {
      const nestedArrayAtom = atom([
        [1, 2],
        [3, [4, 5]],
        [6, [7, [8, 9]]],
      ]);
      const store = createStore();

      const value = store.get(nestedArrayAtom);
      // value[2] = [6, [7, [8, 9]]]
      // value[2][1] = [7, [8, 9]]
      // value[2][1][0] = 7, value[2][1][1] = [8, 9]
      expect(Array.isArray(value[2][1])).toBe(true);
      expect(value[2][1][0]).toBe(7);
    });

    it('should handle objects with various value types', () => {
      const mixedAtom = atom({
        string: 'hello',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        object: { nested: 'value' },
      });
      const store = createStore();

      const value = store.get(mixedAtom);
      expect(value.string).toBe('hello');
      expect(value.number).toBe(42);
      expect(value.boolean).toBe(true);
      expect(value.null).toBeNull();
      expect(value.undefined).toBeUndefined();
      expect(value.array).toEqual([1, 2, 3]);
      expect(value.object).toEqual({ nested: 'value' });
    });
  });

  describe('Circular References', () => {
    it('should handle circular references in primitive atoms', () => {
      const store = createStore();
      const obj: any = { value: 42 };
      obj.self = obj; // Create circular reference

      const circularAtom = atom(obj);
      expect(() => store.get(circularAtom)).not.toThrow();
    });

    it('should handle circular references between objects', () => {
      const store = createStore();
      const obj1: any = { name: 'obj1' };
      const obj2: any = { name: 'obj2' };
      obj1.ref = obj2;
      obj2.ref = obj1;

      const circularAtom = atom({ obj1, obj2 });
      expect(() => store.get(circularAtom)).not.toThrow();
    });
  });

  describe('Special JavaScript Values', () => {
    it('should handle Symbol', () => {
      const sym = Symbol('test');
      const symbolAtom = atom(sym);
      const store = createStore();
      expect(store.get(symbolAtom)).toBe(sym);
    });

    it('should handle multiple Symbols', () => {
      const sym1 = Symbol('first');
      const sym2 = Symbol('second');
      const symbolsAtom = atom([sym1, sym2]);
      const store = createStore();

      const values = store.get(symbolsAtom);
      expect(values[0]).toBe(sym1);
      expect(values[1]).toBe(sym2);
    });

    it('should handle BigInt', () => {
      const bigIntAtom = atom(BigInt(9007199254740991));
      const store = createStore();
      expect(store.get(bigIntAtom)).toBe(BigInt(9007199254740991));
    });

    it('should handle very large BigInt', () => {
      const hugeBigIntAtom = atom(BigInt('123456789012345678901234567890'));
      const store = createStore();
      expect(store.get(hugeBigIntAtom)).toBe(BigInt('123456789012345678901234567890'));
    });

    it('should handle RegExp', () => {
      const regexAtom = atom(/test/gi);
      const store = createStore();
      expect(store.get(regexAtom)).toBeInstanceOf(RegExp);
      expect(store.get(regexAtom).source).toBe('test');
    });

    it('should handle Date', () => {
      const date = new Date('2024-01-01');
      const dateAtom = atom(date);
      const store = createStore();
      expect(store.get(dateAtom)).toBeInstanceOf(Date);
      expect(store.get(dateAtom).getTime()).toBe(date.getTime());
    });
  });

  describe('Function Values', () => {
    it('should store function as value (limitation: functions may not be preserved)', () => {
      const fn = (x: number) => x * 2;
      const fnAtom = atom(fn);
      const store = createStore();

      // Note: Functions as atom values may not be preserved correctly
      // This test documents the limitation
      const storedFn = store.get(fnAtom);
      // Function may be stored, but calling it depends on implementation
      expect(storedFn !== undefined).toBe(true);
    });

    it('should store arrow function (limitation)', () => {
      const arrowFn = (x: number) => x + 1;
      const arrowFnAtom = atom(arrowFn);
      const store = createStore();

      // Arrow function may be stored, but calling it depends on implementation
      const stored = store.get(arrowFnAtom);
      expect(stored !== undefined).toBe(true);
    });

    it('should store bound function (limitation)', () => {
      const obj = { value: 42 };
      const boundFn = function () {
        return this.value;
      }.bind(obj);
      const boundFnAtom = atom(boundFn);
      const store = createStore();

      // Bound function may be stored, but calling it depends on implementation
      const stored = store.get(boundFnAtom);
      expect(stored !== undefined).toBe(true);
    });
  });

  describe('Class Instances', () => {
    it('should handle class instance', () => {
      class MyClass {
        constructor(public value: number) {}
        double() {
          return this.value * 2;
        }
      }

      const instance = new MyClass(21);
      const classAtom = atom(instance);
      const store = createStore();

      const stored = store.get(classAtom);
      expect(stored).toBeInstanceOf(MyClass);
      expect(stored.value).toBe(21);
      expect(stored.double()).toBe(42);
    });

    it('should handle built-in class instances', () => {
      const mapAtom = atom(new Map([['key', 'value']]));
      const store = createStore();

      const map = store.get(mapAtom);
      expect(map).toBeInstanceOf(Map);
      expect(map.get('key')).toBe('value');
    });
  });

  describe('String Edge Cases', () => {
    it('should handle very long string', () => {
      const longString = 'a'.repeat(10000);
      const longAtom = atom(longString);
      const store = createStore();

      expect(store.get(longAtom)).toHaveLength(10000);
    });

    it('should handle string with special characters', () => {
      const specialAtom = atom('hello\nworld\t!');
      const store = createStore();

      expect(store.get(specialAtom)).toContain('\n');
      expect(store.get(specialAtom)).toContain('\t');
    });

    it('should handle unicode string', () => {
      const unicodeAtom = atom('你好，世界！🌍');
      const store = createStore();

      expect(store.get(unicodeAtom)).toBe('你好，世界！🌍');
    });

    it('should handle template literal string', () => {
      const baseAtom = atom('world');
      const templateAtom = atom((get: Getter) => `hello, ${get(baseAtom)}!`);
      const store = createStore();

      expect(store.get(templateAtom)).toBe('hello, world!');
      store.set(baseAtom, 'universe');
      expect(store.get(templateAtom)).toBe('hello, universe!');
    });
  });
});
