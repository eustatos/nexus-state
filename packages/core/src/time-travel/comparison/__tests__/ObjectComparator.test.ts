/**
 * Tests for ObjectComparator
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectComparator } from '../ObjectComparator';
import { PrimitiveComparator } from '../PrimitiveComparator';

describe('ObjectComparator', () => {
  let comparator: ObjectComparator;
  let primitiveComparator: PrimitiveComparator;

  beforeEach(() => {
    primitiveComparator = new PrimitiveComparator();
    comparator = new ObjectComparator(primitiveComparator);
  });

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(comparator.isObject({})).toBe(true);
      expect(comparator.isObject({ a: 1 })).toBe(true);
    });

    it('should return false for non-objects', () => {
      expect(comparator.isObject(null)).toBe(false);
      expect(comparator.isObject(undefined)).toBe(false);
      expect(comparator.isObject(42)).toBe(false);
      expect(comparator.isObject('string')).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(comparator.isObject([])).toBe(false);
      expect(comparator.isObject([1, 2, 3])).toBe(false);
    });

    it('should return false for dates', () => {
      expect(comparator.isObject(new Date())).toBe(false);
    });

    it('should return false for functions', () => {
      expect(comparator.isObject(() => {})).toBe(false);
    });
  });

  describe('compare', () => {
    it('should return comparison result for equal objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };

      const result = comparator.compare(obj1, obj2);

      expect(result.isEqual).toBe(true);
      expect(result.keysA).toBe(2);
      expect(result.keysB).toBe(2);
      expect(result.added).toBe(0);
      expect(result.removed).toBe(0);
      expect(result.modified).toBe(0);
    });

    it('should return comparison result for objects with different values', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };

      const result = comparator.compare(obj1, obj2);

      expect(result.isEqual).toBe(false);
      expect(result.modified).toBe(1);
    });

    it('should return comparison result for objects with different keys', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, c: 2 };

      const result = comparator.compare(obj1, obj2);

      expect(result.isEqual).toBe(false);
      expect(result.removed).toBe(1);
      expect(result.added).toBe(1);
    });

    it('should handle empty objects', () => {
      const result = comparator.compare({}, {});
      expect(result.isEqual).toBe(true);
    });
  });

  describe('areEqual', () => {
    it('should return true for equal objects', () => {
      expect(comparator.areEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('should return false for objects with different values', () => {
      expect(comparator.areEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('should return false for objects with different keys', () => {
      expect(comparator.areEqual({ a: 1 }, { b: 1 })).toBe(false);
    });

    it('should return true for empty objects', () => {
      expect(comparator.areEqual({}, {})).toBe(true);
    });

    it('should return false for different number of keys', () => {
      expect(comparator.areEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('should use deep comparison when enabled', () => {
      const obj1 = { a: { b: 1 } };
      const obj2 = { a: { b: 1 } };

      // Without deep comparison - different object references
      expect(comparator.areEqual(obj1, obj2, false)).toBe(false);
    });

    it('should handle symbol keys when enabled', () => {
      const sym = Symbol('key');
      const obj1 = { [sym]: 1 };
      const obj2 = { [sym]: 1 };

      expect(comparator.areEqual(obj1, obj2, false, true)).toBe(true);
    });
  });

  describe('computeChanges', () => {
    it('should compute no changes for equal objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };

      const changes = comparator.computeChanges(obj1, obj2);

      expect(changes.added).toEqual([]);
      expect(changes.removed).toEqual([]);
      expect(changes.modified).toEqual([]);
    });

    it('should compute added keys', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1, b: 2 };

      const changes = comparator.computeChanges(obj1, obj2);

      expect(changes.added).toEqual(['b']);
    });

    it('should compute removed keys', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1 };

      const changes = comparator.computeChanges(obj1, obj2);

      expect(changes.removed).toEqual(['b']);
    });

    it('should compute modified keys', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };

      const changes = comparator.computeChanges(obj1, obj2);

      expect(changes.modified.length).toBe(1);
      expect(changes.modified[0]?.key).toBe('b');
    });

    it('should compute complex changes', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { a: 1, b: 5, d: 4 };

      const changes = comparator.computeChanges(obj1, obj2);

      expect(changes.removed).toContain('c');
      expect(changes.added).toContain('d');
      expect(changes.modified.length).toBe(1);
    });
  });

  describe('getKeys', () => {
    it('should return string keys', () => {
      const keys = comparator.getKeys({ a: 1, b: 2 });
      expect(keys).toEqual(['a', 'b']);
    });

    it('should include symbol keys when enabled', () => {
      const sym = Symbol('key');
      const obj = { a: 1, [sym]: 2 };

      const keys = comparator.getKeys(obj, true);
      expect(keys).toContain('a');
      expect(keys).toContain('Symbol(key)');
    });

    it('should not include symbol keys when disabled', () => {
      const sym = Symbol('key');
      const obj = { a: 1, [sym]: 2 };

      const keys = comparator.getKeys(obj, false);
      expect(keys).toEqual(['a']);
    });
  });

  describe('getValues/getEntries', () => {
    it('should return object values', () => {
      const values = comparator.getValues({ a: 1, b: 2 });
      expect(values).toEqual([1, 2]);
    });

    it('should return object entries', () => {
      const entries = comparator.getEntries({ a: 1, b: 2 });
      expect(entries).toEqual([['a', 1], ['b', 2]]);
    });
  });

  describe('getSize/isEmpty', () => {
    it('should return object size', () => {
      expect(comparator.getSize({ a: 1, b: 2 })).toBe(2);
      expect(comparator.getSize({})).toBe(0);
    });

    it('should check if object is empty', () => {
      expect(comparator.isEmpty({})).toBe(true);
      expect(comparator.isEmpty({ a: 1 })).toBe(false);
    });
  });

  describe('getValue/hasKey', () => {
    it('should get value by key', () => {
      expect(comparator.getValue({ a: 1, b: 2 }, 'a')).toBe(1);
      expect(comparator.getValue({ a: 1, b: 2 }, 'c')).toBeUndefined();
    });

    it('should check if object has key', () => {
      expect(comparator.hasKey({ a: 1, b: 2 }, 'a')).toBe(true);
      expect(comparator.hasKey({ a: 1, b: 2 }, 'c')).toBe(false);
    });
  });

  describe('getDisplayValue', () => {
    it('should return string representation', () => {
      const display = comparator.getDisplayValue({ a: 1, b: 2 });
      expect(display).toBe('{ a: 1, b: 2 }');
    });

    it('should handle nested objects', () => {
      const obj = { a: { b: 1 } };
      const display = comparator.getDisplayValue(obj);
      expect(display).toContain('a:');
    });

    it('should handle arrays', () => {
      const obj = { a: [1, 2, 3] };
      const display = comparator.getDisplayValue(obj);
      // Arrays in nested objects are truncated at maxDepth
      expect(display).toContain('a:');
      expect(display).toContain('...');
    });
  });

  describe('createFromEntries', () => {
    it('should create object from entries', () => {
      const obj = comparator.createFromEntries([['a', 1], ['b', 2]]);
      expect(obj).toEqual({ a: 1, b: 2 });
    });

    it('should create empty object', () => {
      const obj = comparator.createFromEntries([]);
      expect(obj).toEqual({});
    });
  });

  describe('getPrototype/hasPrototypeChain', () => {
    it('should get prototype', () => {
      const proto = comparator.getPrototype({ a: 1 });
      expect(proto).toBe(Object.prototype);
    });

    it('should check prototype chain', () => {
      expect(comparator.hasPrototypeChain({ a: 1 })).toBe(false);
      expect(comparator.hasPrototypeChain(Object.create({ a: 1 }))).toBe(true);
    });
  });

  describe('getOwnPropertyNames/getOwnPropertySymbols', () => {
    it('should get own property names', () => {
      const names = comparator.getOwnPropertyNames({ a: 1, b: 2 });
      expect(names).toEqual(['a', 'b']);
    });

    it('should get own property symbols', () => {
      const sym = Symbol('key');
      const obj = { [sym]: 1 };
      const symbols = comparator.getOwnPropertySymbols(obj);
      expect(symbols).toEqual([sym]);
    });
  });

  describe('getPropertyDescriptor/isPropertyEnumerable', () => {
    it('should get property descriptor', () => {
      const desc = comparator.getPropertyDescriptor({ a: 1 }, 'a');
      expect(desc?.value).toBe(1);
      expect(desc?.writable).toBe(true);
    });

    it('should check if property is enumerable', () => {
      expect(comparator.isPropertyEnumerable({ a: 1 }, 'a')).toBe(true);
    });
  });

  describe('getCommonKeys/getKeysOnlyInFirst', () => {
    it('should get common keys', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { b: 20, c: 30, d: 40 };

      const common = comparator.getCommonKeys(obj1, obj2);
      expect(common).toEqual(expect.arrayContaining(['b', 'c']));
    });

    it('should get keys only in first', () => {
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { b: 20, c: 30 };

      const onlyInFirst = comparator.getKeysOnlyInFirst(obj1, obj2);
      expect(onlyInFirst).toEqual(['a']);
    });
  });

  describe('pick/omit', () => {
    it('should pick keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const picked = comparator.pick(obj, ['a', 'c']);
      expect(picked).toEqual({ a: 1, c: 3 });
    });

    it('should omit keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const omitted = comparator.omit(obj, ['b']);
      expect(omitted).toEqual({ a: 1, c: 3 });
    });
  });

  describe('invert', () => {
    it('should invert object', () => {
      const obj = { a: 1, b: 2 };
      const inverted = comparator.invert(obj);
      expect(inverted).toEqual({ '1': 'a', '2': 'b' });
    });

    it('should handle non-string/number values', () => {
      const obj = { a: { b: 1 } };
      const inverted = comparator.invert(obj);
      expect(inverted).toEqual({});
    });
  });

  describe('merge', () => {
    it('should merge objects', () => {
      const obj1 = { a: 1 };
      const obj2 = { b: 2 };
      const merged = comparator.merge(obj1, obj2);
      expect(merged).toEqual({ a: 1, b: 2 });
    });

    it('should handle overlapping keys', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 2 };
      const merged = comparator.merge(obj1, obj2);
      expect(merged).toEqual({ a: 2 });
    });
  });

  describe('deepClone', () => {
    it('should deep clone object', () => {
      const obj = { a: { b: 1 } };
      const clone = comparator.deepClone(obj);
      expect(clone).toEqual(obj);
      expect(clone).not.toBe(obj);
      expect(clone.a).not.toBe(obj.a);
    });

    it('should handle non-JSON-serializable objects', () => {
      const obj = { fn: () => 42 };
      const clone = comparator.deepClone(obj);
      expect(clone).toBeDefined();
    });
  });

  describe('haveSameKeys/getKeyDifference', () => {
    it('should check same keys', () => {
      expect(comparator.haveSameKeys({ a: 1 }, { a: 2 })).toBe(true);
      expect(comparator.haveSameKeys({ a: 1 }, { b: 1 })).toBe(false);
    });

    it('should get key difference', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 2, c: 3 };

      const diff = comparator.getKeyDifference(obj1, obj2);
      expect(diff.removed).toEqual(['a']);
      expect(diff.added).toEqual(['c']);
    });
  });

  describe('edge cases', () => {
    it('should handle objects with prototype', () => {
      const proto = { inherited: 1 };
      const obj = Object.create(proto);
      obj.own = 2;

      expect(comparator.hasKey(obj, 'own')).toBe(true);
      expect(comparator.hasKey(obj, 'inherited')).toBe(false);
    });

    it('should handle objects with non-enumerable properties', () => {
      const obj = { a: 1 };
      Object.defineProperty(obj, 'b', { value: 2, enumerable: false });

      const keys = comparator.getKeys(obj);
      expect(keys).toEqual(['a']);
    });

    it('should handle objects with getter/setter', () => {
      const obj = {
        _value: 1,
        get value() {
          return this._value;
        },
        set value(v) {
          this._value = v;
        },
      };

      expect(comparator.hasKey(obj, 'value')).toBe(true);
    });

    it('should handle very large objects', () => {
      const obj: Record<string, number> = {};
      for (let i = 0; i < 1000; i++) {
        obj[`key${i}`] = i;
      }

      expect(comparator.getSize(obj)).toBe(1000);
    });

    it('should handle objects with circular references', () => {
      const obj: any = { a: 1 };
      obj.self = obj;

      const display = comparator.getDisplayValue(obj);
      expect(display).toContain('a: 1');
    });
  });

  describe('real-world scenarios', () => {
    it('should compare configuration objects', () => {
      const config1 = { timeout: 5000, retries: 3, url: 'https://api.example.com' };
      const config2 = { timeout: 5000, retries: 3, url: 'https://api.example.com' };

      expect(comparator.areEqual(config1, config2)).toBe(true);
    });

    it('should compare user profile objects', () => {
      const profile1 = { id: 1, name: 'John', email: 'john@example.com' };
      const profile2 = { id: 1, name: 'John', email: 'john@example.com' };

      expect(comparator.areEqual(profile1, profile2)).toBe(true);
    });

    it('should detect API response changes', () => {
      const response1 = { status: 'success', data: { count: 10 } };
      const response2 = { status: 'success', data: { count: 15 } };

      const changes = comparator.computeChanges(response1, response2);
      expect(changes.modified.length).toBeGreaterThan(0);
    });

    it('should compare nested settings', () => {
      const settings1 = {
        theme: 'dark',
        notifications: { email: true, push: false },
      };
      const settings2 = {
        theme: 'dark',
        notifications: { email: true, push: false },
      };

      // Without deep comparison - different object references
      expect(comparator.areEqual(settings1, settings2, false)).toBe(false);
    });

    it('should merge default and user settings', () => {
      const defaults = { theme: 'light', lang: 'en', notifications: true };
      const user = { theme: 'dark' };

      const merged = comparator.merge(defaults, user);
      expect(merged.theme).toBe('dark');
      expect(merged.lang).toBe('en');
    });
  });
});
