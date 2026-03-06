/**
 * Serialization Tests
 * Tests for state serialization utilities
 */

import { describe, it, expect } from 'vitest';
import { atom, createStore } from '../../index';
import { serializeState, serializeMap, serializeSet } from '../../utils/serialization';

describe('Serialization', () => {
  describe('serializeState', () => {
    it('should serialize state with primitive values', () => {
      const store = createStore();
      const numAtom = atom(42);
      const strAtom = atom('hello');
      const boolAtom = atom(true);

      store.set(numAtom, 100);
      store.set(strAtom, 'world');
      store.set(boolAtom, false);

      const serialized = serializeState(store);
      expect(serialized).toBeDefined();
      expect(typeof serialized).toBe('object');
    });

    it('should serialize state with object values', () => {
      const store = createStore();
      const objAtom = atom({ name: 'test', value: 123 });

      const serialized = serializeState(store);
      expect(serialized).toBeDefined();
    });

    it('should serialize state with multiple atoms', () => {
      const store = createStore();
      const atom1 = atom(1);
      const atom2 = atom('two');
      const atom3 = atom({ three: 3 });

      store.set(atom1, 10);
      store.set(atom2, 'twenty');

      const serialized = serializeState(store);
      expect(serialized).toBeDefined();
      expect(Object.keys(serialized).length).toBeGreaterThanOrEqual(2);
    });

    it('should serialize state with null values', () => {
      const store = createStore();
      const nullAtom = atom(null);

      const serialized = serializeState(store);
      expect(serialized).toBeDefined();
    });

    it('should serialize state with undefined values', () => {
      const store = createStore();
      const undefinedAtom = atom(undefined);

      const serialized = serializeState(store);
      expect(serialized).toBeDefined();
    });

    it('should serialize state with array values', () => {
      const store = createStore();
      const arrayAtom = atom([1, 2, 3, 4, 5]);
      store.set(arrayAtom, [10, 20, 30]);

      const serialized = serializeState(store);
      expect(serialized).toBeDefined();
    });

    it('should serialize state with nested objects', () => {
      const store = createStore();
      const nestedAtom = atom({
        level1: {
          level2: {
            value: 'deep',
          },
        },
      });

      const serialized = serializeState(store);
      expect(serialized).toBeDefined();
    });
  });

  describe('serializeMap', () => {
    it('should serialize empty Map', () => {
      const map = new Map<string, number>();
      const serialized = serializeMap(map);

      expect(serialized.__type).toBe('Map');
      expect(serialized.entries).toEqual([]);
    });

    it('should serialize Map with primitive values', () => {
      const map = new Map([
        ['key1', 1],
        ['key2', 2],
        ['key3', 3],
      ]);

      const serialized = serializeMap(map);

      expect(serialized.__type).toBe('Map');
      expect(serialized.entries).toHaveLength(3);
      expect(serialized.entries).toContainEqual(['key1', 1]);
      expect(serialized.entries).toContainEqual(['key2', 2]);
      expect(serialized.entries).toContainEqual(['key3', 3]);
    });

    it('should serialize Map with string keys and values', () => {
      const map = new Map([
        ['name', 'John'],
        ['city', 'NYC'],
      ]);

      const serialized = serializeMap(map);

      expect(serialized.__type).toBe('Map');
      expect(serialized.entries).toHaveLength(2);
    });

    it('should serialize Map with object values', () => {
      const map = new Map<string, { id: number; name: string }>([
        ['user1', { id: 1, name: 'Alice' }],
        ['user2', { id: 2, name: 'Bob' }],
      ]);

      const serialized = serializeMap(map);

      expect(serialized.__type).toBe('Map');
      expect(serialized.entries).toHaveLength(2);
      expect(serialized.entries[0][1]).toEqual({ id: 1, name: 'Alice' });
    });

    it('should serialize Map with mixed value types', () => {
      const map = new Map<string, unknown>([
        ['string', 'hello'],
        ['number', 42],
        ['boolean', true],
        ['null', null],
        ['array', [1, 2, 3]],
      ]);

      const serialized = serializeMap(map);

      expect(serialized.__type).toBe('Map');
      expect(serialized.entries).toHaveLength(5);
    });

    it('should serialize Map with number keys', () => {
      const map = new Map<number, string>([
        [1, 'one'],
        [2, 'two'],
        [3, 'three'],
      ]);

      const serialized = serializeMap(map);

      expect(serialized.__type).toBe('Map');
      expect(serialized.entries).toHaveLength(3);
    });

    it('should serialize Map with Symbol keys', () => {
      const sym1 = Symbol('key1');
      const sym2 = Symbol('key2');
      const map = new Map<any, string>([
        [sym1, 'value1'],
        [sym2, 'value2'],
      ]);

      const serialized = serializeMap(map);

      expect(serialized.__type).toBe('Map');
      expect(serialized.entries).toHaveLength(2);
    });
  });

  describe('serializeSet', () => {
    it('should serialize empty Set', () => {
      const set = new Set<number>();
      const serialized = serializeSet(set);

      expect(serialized.__type).toBe('Set');
      expect(serialized.values).toEqual([]);
    });

    it('should serialize Set with primitive values', () => {
      const set = new Set([1, 2, 3, 4, 5]);
      const serialized = serializeSet(set);

      expect(serialized.__type).toBe('Set');
      expect(serialized.values).toHaveLength(5);
      expect(serialized.values).toContain(1);
      expect(serialized.values).toContain(2);
      expect(serialized.values).toContain(3);
      expect(serialized.values).toContain(4);
      expect(serialized.values).toContain(5);
    });

    it('should serialize Set with string values', () => {
      const set = new Set(['apple', 'banana', 'cherry']);
      const serialized = serializeSet(set);

      expect(serialized.__type).toBe('Set');
      expect(serialized.values).toHaveLength(3);
      expect(serialized.values).toContain('apple');
      expect(serialized.values).toContain('banana');
      expect(serialized.values).toContain('cherry');
    });

    it('should serialize Set with object values', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const set = new Set([obj1, obj2]);
      const serialized = serializeSet(set);

      expect(serialized.__type).toBe('Set');
      expect(serialized.values).toHaveLength(2);
    });

    it('should serialize Set with mixed value types', () => {
      const set = new Set<unknown>([1, 'hello', true, null, { key: 'value' }]);
      const serialized = serializeSet(set);

      expect(serialized.__type).toBe('Set');
      expect(serialized.values).toHaveLength(5);
    });

    it('should serialize Set with unique values only', () => {
      const set = new Set([1, 1, 2, 2, 3, 3]);
      const serialized = serializeSet(set);

      expect(serialized.__type).toBe('Set');
      expect(serialized.values).toHaveLength(3);
      expect(serialized.values).toContain(1);
      expect(serialized.values).toContain(2);
      expect(serialized.values).toContain(3);
    });

    it('should serialize Set with NaN', () => {
      const set = new Set([NaN, 1, 2]);
      const serialized = serializeSet(set);

      expect(serialized.__type).toBe('Set');
      expect(serialized.values).toHaveLength(3);
      expect(serialized.values.some((v: any) => Number.isNaN(v))).toBe(true);
    });

    it('should serialize Set with Infinity', () => {
      const set = new Set([Infinity, -Infinity, 0]);
      const serialized = serializeSet(set);

      expect(serialized.__type).toBe('Set');
      expect(serialized.values).toHaveLength(3);
      expect(serialized.values).toContain(Infinity);
      expect(serialized.values).toContain(-Infinity);
    });
  });

  describe('Serialization Edge Cases', () => {
    it('should handle state with Map value', () => {
      const store = createStore();
      const mapAtom = atom(new Map([['key', 'value']]));

      const serialized = serializeState(store);
      expect(serialized).toBeDefined();
    });

    it('should handle state with Set value', () => {
      const store = createStore();
      const setAtom = atom(new Set([1, 2, 3]));

      const serialized = serializeState(store);
      expect(serialized).toBeDefined();
    });

    it('should handle state with Date value', () => {
      const store = createStore();
      const dateAtom = atom(new Date('2024-01-01'));

      const serialized = serializeState(store);
      expect(serialized).toBeDefined();
    });

    it('should handle state with RegExp value', () => {
      const store = createStore();
      const regexAtom = atom(/test/gi);

      const serialized = serializeState(store);
      expect(serialized).toBeDefined();
    });

    it('should handle deeply nested state', () => {
      const store = createStore();
      const deepAtom = atom({
        a: {
          b: {
            c: {
              d: {
                e: {
                  value: 'deep',
                },
              },
            },
          },
        },
      });

      const serialized = serializeState(store);
      expect(serialized).toBeDefined();
    });

    it('should handle state with circular reference', () => {
      const store = createStore();
      const obj: any = { value: 42 };
      obj.self = obj;
      const circularAtom = atom(obj);

      // Should not throw
      expect(() => serializeState(store)).not.toThrow();
    });
  });

  describe('Serialization Format', () => {
    it('should return plain object for serializeState', () => {
      const store = createStore();
      const atom1 = atom(42);

      const serialized = serializeState(store);
      expect(typeof serialized).toBe('object');
      expect(serialized.constructor).toBe(Object);
    });

    it('should return plain object for serializeMap', () => {
      const map = new Map([['key', 'value']]);
      const serialized = serializeMap(map);

      expect(typeof serialized).toBe('object');
      expect(serialized.constructor).toBe(Object);
      expect(serialized.__type).toBe('Map');
    });

    it('should return plain object for serializeSet', () => {
      const set = new Set([1, 2, 3]);
      const serialized = serializeSet(set);

      expect(typeof serialized).toBe('object');
      expect(serialized.constructor).toBe(Object);
      expect(serialized.__type).toBe('Set');
    });

    it('should be JSON serializable', () => {
      const map = new Map([['key', 'value']]);
      const serialized = serializeMap(map);

      expect(() => JSON.stringify(serialized)).not.toThrow();
    });

    it('should preserve entry order in Map serialization', () => {
      const map = new Map([
        ['first', 1],
        ['second', 2],
        ['third', 3],
      ]);

      const serialized = serializeMap(map);
      expect(serialized.entries[0][0]).toBe('first');
      expect(serialized.entries[1][0]).toBe('second');
      expect(serialized.entries[2][0]).toBe('third');
    });
  });
});
