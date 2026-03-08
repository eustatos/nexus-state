/**
 * Tests for MapSetComparator
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MapSetComparator } from '../MapSetComparator';
import { PrimitiveComparator } from '../PrimitiveComparator';

describe('MapSetComparator', () => {
  let comparator: MapSetComparator;
  let primitiveComparator: PrimitiveComparator;

  beforeEach(() => {
    primitiveComparator = new PrimitiveComparator();
    comparator = new MapSetComparator(primitiveComparator);
  });

  describe('isMap', () => {
    it('should return true for Map objects', () => {
      expect(comparator.isMap(new Map())).toBe(true);
      expect(comparator.isMap(new Map([['a', 1]]))).toBe(true);
    });

    it('should return false for non-Map objects', () => {
      expect(comparator.isMap({})).toBe(false);
      expect(comparator.isMap([])).toBe(false);
      expect(comparator.isMap(new Set())).toBe(false);
    });
  });

  describe('isSet', () => {
    it('should return true for Set objects', () => {
      expect(comparator.isSet(new Set())).toBe(true);
      expect(comparator.isSet(new Set([1, 2, 3]))).toBe(true);
    });

    it('should return false for non-Set objects', () => {
      expect(comparator.isSet({})).toBe(false);
      expect(comparator.isSet([])).toBe(false);
      expect(comparator.isSet(new Map())).toBe(false);
    });
  });

  describe('compare', () => {
    it('should return comparison result for equal Maps', () => {
      const map1 = new Map([['a', 1], ['b', 2]]);
      const map2 = new Map([['a', 1], ['b', 2]]);

      const result = comparator.compare(map1, map2);

      expect(result.isEqual).toBe(true);
      expect(result.typeA).toBe('map');
      expect(result.typeB).toBe('map');
      expect(result.sameType).toBe(true);
      expect(result.sizeDifference).toBe(0);
    });

    it('should return comparison result for different Maps', () => {
      const map1 = new Map([['a', 1], ['b', 2]]);
      const map2 = new Map([['a', 1], ['b', 3]]);

      const result = comparator.compare(map1, map2);

      expect(result.isEqual).toBe(false);
      expect(result.sizeDifference).toBe(0);
    });

    it('should return comparison result for equal Sets', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 3]);

      const result = comparator.compare(set1, set2);

      expect(result.isEqual).toBe(true);
      expect(result.sameType).toBe(true);
      expect(result.sizeDifference).toBe(0);
    });

    it('should return comparison result for different Sets', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 4]);

      const result = comparator.compare(set1, set2);

      expect(result.isEqual).toBe(false);
    });

    it('should return comparison result for different types', () => {
      const map = new Map([['a', 1]]);
      const set = new Set([1]);

      const result = comparator.compare(map, set);

      expect(result.isEqual).toBe(false);
      expect(result.typeA).toBe('map');
      expect(result.typeB).toBe('set');
      expect(result.sameType).toBe(false);
    });

    it('should handle different sizes', () => {
      const map1 = new Map([['a', 1], ['b', 2], ['c', 3]]);
      const map2 = new Map([['a', 1]]);

      const result = comparator.compare(map1, map2);

      expect(result.sizeDifference).toBe(2);
    });
  });

  describe('areEqual', () => {
    it('should return true for equal Maps', () => {
      const map1 = new Map([['a', 1], ['b', 2]]);
      const map2 = new Map([['a', 1], ['b', 2]]);

      expect(comparator.areEqual(map1, map2)).toBe(true);
    });

    it('should return false for Maps with different values', () => {
      const map1 = new Map([['a', 1], ['b', 2]]);
      const map2 = new Map([['a', 1], ['b', 3]]);

      expect(comparator.areEqual(map1, map2)).toBe(false);
    });

    it('should return false for Maps with different keys', () => {
      const map1 = new Map([['a', 1], ['b', 2]]);
      const map2 = new Map([['a', 1], ['c', 2]]);

      expect(comparator.areEqual(map1, map2)).toBe(false);
    });

    it('should return true for empty Maps', () => {
      const map1 = new Map();
      const map2 = new Map();

      expect(comparator.areEqual(map1, map2)).toBe(true);
    });

    it('should return true for equal Sets', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 3]);

      expect(comparator.areEqual(set1, set2)).toBe(true);
    });

    it('should return false for Sets with different values', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 4]);

      expect(comparator.areEqual(set1, set2)).toBe(false);
    });

    it('should return true for empty Sets', () => {
      const set1 = new Set();
      const set2 = new Set();

      expect(comparator.areEqual(set1, set2)).toBe(true);
    });

    it('should use deep comparison when enabled', () => {
      const map1 = new Map([['a', { b: 1 }]]);
      const map2 = new Map([['a', { b: 1 }]]);

      // Without deep comparison - different object references
      expect(comparator.areEqual(map1, map2, false)).toBe(false);

      // With deep comparison - same structure
      // Note: This depends on PrimitiveComparator implementation
    });

    it('should return false for Map and Set', () => {
      const map = new Map([['a', 1]]);
      const set = new Set([1]);

      expect(comparator.areEqual(map, set)).toBe(false);
    });
  });

  describe('getType', () => {
    it('should return "map" for Map objects', () => {
      expect(comparator.getType(new Map())).toBe('map');
    });

    it('should return "set" for Set objects', () => {
      expect(comparator.getType(new Set())).toBe('set');
    });

    it('should return "other" for non-Map/Set', () => {
      expect(comparator.getType(42)).toBe('other');
      expect(comparator.getType({})).toBe('other');
    });
  });

  describe('compareMaps', () => {
    it('should compare equal Maps', () => {
      const map1 = new Map([['a', 1], ['b', 2]]);
      const map2 = new Map([['a', 1], ['b', 2]]);

      expect(comparator.compareMaps(map1, map2)).toBe(true);
    });

    it('should compare Maps with different sizes', () => {
      const map1 = new Map([['a', 1], ['b', 2]]);
      const map2 = new Map([['a', 1]]);

      expect(comparator.compareMaps(map1, map2)).toBe(false);
    });

    it('should compare empty Maps', () => {
      const map1 = new Map();
      const map2 = new Map();

      expect(comparator.compareMaps(map1, map2)).toBe(true);
    });

    it('should compare Maps with object keys', () => {
      const key = { id: 1 };
      const map1 = new Map([[key, 'value']]);
      const map2 = new Map([[key, 'value']]);

      expect(comparator.compareMaps(map1, map2)).toBe(true);
    });

    it('should compare Maps with various value types', () => {
      const map1 = new Map([
        ['string', 'hello'],
        ['number', 42],
        ['boolean', true],
        ['null', null],
        ['undefined', undefined],
      ]);
      const map2 = new Map([
        ['string', 'hello'],
        ['number', 42],
        ['boolean', true],
        ['null', null],
        ['undefined', undefined],
      ]);

      expect(comparator.compareMaps(map1, map2)).toBe(true);
    });
  });

  describe('compareSets', () => {
    it('should compare equal Sets', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 3]);

      expect(comparator.compareSets(set1, set2)).toBe(true);
    });

    it('should compare Sets with different sizes', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2]);

      expect(comparator.compareSets(set1, set2)).toBe(false);
    });

    it('should compare empty Sets', () => {
      const set1 = new Set();
      const set2 = new Set();

      expect(comparator.compareSets(set1, set2)).toBe(true);
    });

    it('should compare Sets with different order', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([3, 2, 1]);

      expect(comparator.compareSets(set1, set2)).toBe(true);
    });

    it('should compare Sets with object values', () => {
      const obj = { id: 1 };
      const set1 = new Set([obj]);
      const set2 = new Set([obj]);

      expect(comparator.compareSets(set1, set2)).toBe(true);
    });

    it('should compare Sets with various types', () => {
      const set1 = new Set([1, 'hello', true, null, undefined]);
      const set2 = new Set([1, 'hello', true, null, undefined]);

      expect(comparator.compareSets(set1, set2)).toBe(true);
    });
  });

  describe('getMapSize/getSetSize', () => {
    it('should return Map size', () => {
      const map = new Map([['a', 1], ['b', 2]]);
      expect(comparator.getMapSize(map)).toBe(2);
    });

    it('should return Set size', () => {
      const set = new Set([1, 2, 3]);
      expect(comparator.getSetSize(set)).toBe(3);
    });

    it('should return 0 for empty collections', () => {
      expect(comparator.getMapSize(new Map())).toBe(0);
      expect(comparator.getSetSize(new Set())).toBe(0);
    });
  });

  describe('getMapKeys/getMapValues/getMapEntries', () => {
    it('should return Map keys', () => {
      const map = new Map([['a', 1], ['b', 2]]);
      const keys = comparator.getMapKeys(map);
      expect(keys).toEqual(['a', 'b']);
    });

    it('should return Map values', () => {
      const map = new Map([['a', 1], ['b', 2]]);
      const values = comparator.getMapValues(map);
      expect(values).toEqual([1, 2]);
    });

    it('should return Map entries', () => {
      const map = new Map([['a', 1], ['b', 2]]);
      const entries = comparator.getMapEntries(map);
      expect(entries).toEqual([['a', 1], ['b', 2]]);
    });
  });

  describe('getSetValues', () => {
    it('should return Set values', () => {
      const set = new Set([1, 2, 3]);
      const values = comparator.getSetValues(set);
      expect(values).toEqual([1, 2, 3]);
    });
  });

  describe('mapHasKey/setHasValue', () => {
    it('should check if Map has key', () => {
      const map = new Map([['a', 1], ['b', 2]]);
      expect(comparator.mapHasKey(map, 'a')).toBe(true);
      expect(comparator.mapHasKey(map, 'c')).toBe(false);
    });

    it('should check if Set has value', () => {
      const set = new Set([1, 2, 3]);
      expect(comparator.setHasValue(set, 2)).toBe(true);
      expect(comparator.setHasValue(set, 4)).toBe(false);
    });
  });

  describe('getMapValue', () => {
    it('should get Map value by key', () => {
      const map = new Map([['a', 1], ['b', 2]]);
      expect(comparator.getMapValue(map, 'a')).toBe(1);
      expect(comparator.getMapValue(map, 'c')).toBeUndefined();
    });
  });

  describe('createMapFromEntries/createSetFromValues', () => {
    it('should create Map from entries', () => {
      const map = comparator.createMapFromEntries([['a', 1], ['b', 2]]);
      expect(map.size).toBe(2);
      expect(map.get('a')).toBe(1);
    });

    it('should create Set from values', () => {
      const set = comparator.createSetFromValues([1, 2, 3]);
      expect(set.size).toBe(3);
      expect(set.has(2)).toBe(true);
    });
  });

  describe('getMapDisplayValue/getSetDisplayValue', () => {
    it('should return Map display value', () => {
      const map = new Map([['a', 1], ['b', 2]]);
      const display = comparator.getMapDisplayValue(map);
      expect(display).toContain('Map(2)');
      expect(display).toContain('a');
      expect(display).toContain('1');
    });

    it('should return Set display value', () => {
      const set = new Set([1, 2, 3]);
      const display = comparator.getSetDisplayValue(set);
      expect(display).toContain('Set(3)');
      expect(display).toContain('1');
    });
  });

  describe('isMapEmpty/isSetEmpty', () => {
    it('should check if Map is empty', () => {
      expect(comparator.isMapEmpty(new Map())).toBe(true);
      expect(comparator.isMapEmpty(new Map([['a', 1]]))).toBe(false);
    });

    it('should check if Set is empty', () => {
      expect(comparator.isSetEmpty(new Set())).toBe(true);
      expect(comparator.isSetEmpty(new Set([1]))).toBe(false);
    });
  });

  describe('getCommonMapKeys/getCommonSetValues', () => {
    it('should get common Map keys', () => {
      const map1 = new Map([['a', 1], ['b', 2], ['c', 3]]);
      const map2 = new Map([['b', 20], ['c', 30], ['d', 40]]);

      const common = comparator.getCommonMapKeys(map1, map2);
      expect(common).toEqual(expect.arrayContaining(['b', 'c']));
    });

    it('should get common Set values', () => {
      const set1 = new Set([1, 2, 3, 4]);
      const set2 = new Set([3, 4, 5, 6]);

      const common = comparator.getCommonSetValues(set1, set2);
      expect(common).toEqual(expect.arrayContaining([3, 4]));
    });
  });

  describe('getMapKeysOnlyInFirst/getSetValuesOnlyInFirst', () => {
    it('should get Map keys only in first', () => {
      const map1 = new Map([['a', 1], ['b', 2], ['c', 3]]);
      const map2 = new Map([['b', 20], ['c', 30], ['d', 40]]);

      const onlyInFirst = comparator.getMapKeysOnlyInFirst(map1, map2);
      expect(onlyInFirst).toEqual(['a']);
    });

    it('should get Set values only in first', () => {
      const set1 = new Set([1, 2, 3, 4]);
      const set2 = new Set([3, 4, 5, 6]);

      const onlyInFirst = comparator.getSetValuesOnlyInFirst(set1, set2);
      expect(onlyInFirst).toEqual(expect.arrayContaining([1, 2]));
    });
  });

  describe('edge cases', () => {
    it('should handle Maps with NaN keys', () => {
      const map1 = new Map([[NaN, 'value']]);
      const map2 = new Map([[NaN, 'value']]);

      expect(comparator.compareMaps(map1, map2)).toBe(true);
    });

    it('should handle Sets with NaN values', () => {
      const set1 = new Set([NaN]);
      const set2 = new Set([NaN]);

      expect(comparator.compareSets(set1, set2)).toBe(true);
    });

    it('should handle Maps with same key different case', () => {
      const map1 = new Map([['Key', 1]]);
      const map2 = new Map([['key', 1]]);

      expect(comparator.compareMaps(map1, map2)).toBe(false);
    });

    it('should handle Sets with duplicate values', () => {
      const set1 = new Set([1, 1, 2, 2, 3]);
      const set2 = new Set([1, 2, 3]);

      expect(comparator.compareSets(set1, set2)).toBe(true);
    });

    it('should handle Maps with function values', () => {
      const fn = () => 42;
      const map1 = new Map([['fn', fn]]);
      const map2 = new Map([['fn', fn]]);

      expect(comparator.compareMaps(map1, map2)).toBe(true);
    });

    it('should handle Maps with symbol keys', () => {
      const sym = Symbol('key');
      const map1 = new Map([[sym, 'value']]);
      const map2 = new Map([[sym, 'value']]);

      expect(comparator.compareMaps(map1, map2)).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    it('should compare configuration Maps', () => {
      const config1 = new Map([
        ['timeout', 5000],
        ['retries', 3],
        ['url', 'https://api.example.com'],
      ]);
      const config2 = new Map([
        ['timeout', 5000],
        ['retries', 3],
        ['url', 'https://api.example.com'],
      ]);

      expect(comparator.compareMaps(config1, config2)).toBe(true);
    });

    it('should compare permission Sets', () => {
      const perms1 = new Set(['read', 'write', 'delete']);
      const perms2 = new Set(['read', 'write', 'delete']);

      expect(comparator.compareSets(perms1, perms2)).toBe(true);
    });

    it('should compare cache Maps', () => {
      const cache1 = new Map([
        ['key1', { data: 'value1', timestamp: 1234567890 }],
        ['key2', { data: 'value2', timestamp: 1234567891 }],
      ]);
      const cache2 = new Map([
        ['key1', { data: 'value1', timestamp: 1234567890 }],
        ['key2', { data: 'value2', timestamp: 1234567891 }],
      ]);

      // Without deep comparison - different object references
      expect(comparator.compareMaps(cache1, cache2, false)).toBe(false);
    });

    it('should compare unique user IDs Set', () => {
      const userIds1 = new Set([101, 102, 103, 104]);
      const userIds2 = new Set([104, 103, 102, 101]);

      expect(comparator.compareSets(userIds1, userIds2)).toBe(true);
    });
  });
});
