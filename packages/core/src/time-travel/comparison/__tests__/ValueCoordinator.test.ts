/**
 * Tests for ValueCoordinator
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValueCoordinator } from '../ValueCoordinator';

describe('ValueCoordinator', () => {
  let coordinator: ValueCoordinator;

  beforeEach(() => {
    coordinator = new ValueCoordinator();
  });

  describe('constructor', () => {
    it('should create with default options', () => {
      expect(coordinator).toBeDefined();
      const options = coordinator.getOptions();
      expect(options.maxDepth).toBe(10);
      expect(options.deepComparison).toBe(true);
    });

    it('should create with custom options', () => {
      const custom = new ValueCoordinator({
        maxDepth: 5,
        ignoreFunctions: true,
      });
      const options = custom.getOptions();
      expect(options.maxDepth).toBe(5);
      expect(options.ignoreFunctions).toBe(true);
    });
  });

  describe('compare', () => {
    it('should compare equal primitives', () => {
      const result = coordinator.compare(42, 42);
      expect(result.equal).toBe(true);
      expect(result.typeA).toBe('number');
      expect(result.typeB).toBe('number');
    });

    it('should compare different primitives', () => {
      const result = coordinator.compare(42, 43);
      expect(result.equal).toBe(false);
      expect(result.diff).toBeDefined();
    });

    it('should compare equal objects', () => {
      const result = coordinator.compare({ a: 1 }, { a: 1 });
      expect(result.equal).toBe(true);
    });

    it('should compare different objects', () => {
      const result = coordinator.compare({ a: 1 }, { a: 2 });
      expect(result.equal).toBe(false);
      expect(result.diff).toBeDefined();
    });

    it('should compare equal arrays', () => {
      const result = coordinator.compare([1, 2, 3], [1, 2, 3]);
      expect(result.equal).toBe(true);
    });

    it('should compare different arrays', () => {
      const result = coordinator.compare([1, 2, 3], [1, 2, 4]);
      expect(result.equal).toBe(false);
    });

    it('should compare equal maps', () => {
      const map1 = new Map([['a', 1], ['b', 2]]);
      const map2 = new Map([['a', 1], ['b', 2]]);
      const result = coordinator.compare(map1, map2);
      expect(result.equal).toBe(true);
    });

    it('should compare equal sets', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 3]);
      const result = coordinator.compare(set1, set2);
      expect(result.equal).toBe(true);
    });

    it('should compare equal dates', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-01-01T00:00:00Z');
      const result = coordinator.compare(date1, date2);
      expect(result.equal).toBe(true);
    });

    it('should compare equal regexps', () => {
      const regexp1 = /abc/gi;
      const regexp2 = /abc/gi;
      const result = coordinator.compare(regexp1, regexp2);
      expect(result.equal).toBe(true);
    });

    it('should handle circular references', () => {
      const obj1: any = { a: 1 };
      obj1.self = obj1;
      const obj2: any = { a: 1 };
      obj2.self = obj2;

      const result = coordinator.compare(obj1, obj2);
      expect(result).toBeDefined();
    });

    it('should respect ignoreFunctions option', () => {
      const custom = new ValueCoordinator({ ignoreFunctions: true });
      const fn1 = () => 42;
      const fn2 = () => 43;

      const result = custom.compare(fn1, fn2);
      expect(result.equal).toBe(true);
    });
  });

  describe('areEqual', () => {
    it('should return true for equal primitives', () => {
      expect(coordinator.areEqual(42, 42)).toBe(true);
      expect(coordinator.areEqual('hello', 'hello')).toBe(true);
    });

    it('should return false for different primitives', () => {
      expect(coordinator.areEqual(42, 43)).toBe(false);
      expect(coordinator.areEqual('hello', 'world')).toBe(false);
    });

    it('should return true for equal objects', () => {
      expect(coordinator.areEqual({ a: 1 }, { a: 1 })).toBe(true);
    });

    it('should return false for different objects', () => {
      expect(coordinator.areEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('should return true for equal arrays', () => {
      expect(coordinator.areEqual([1, 2], [1, 2])).toBe(true);
    });

    it('should return false for different arrays', () => {
      expect(coordinator.areEqual([1, 2], [1, 3])).toBe(false);
    });

    it('should handle NaN', () => {
      expect(coordinator.areEqual(NaN, NaN)).toBe(true);
    });

    it('should handle null and undefined', () => {
      expect(coordinator.areEqual(null, null)).toBe(true);
      expect(coordinator.areEqual(undefined, undefined)).toBe(true);
      expect(coordinator.areEqual(null, undefined)).toBe(false);
    });
  });

  describe('diff', () => {
    it('should generate diff for primitives', () => {
      const diff = coordinator.diff(1, 2);
      expect(diff.equal).toBe(false);
      expect(diff.type).toBe('primitive');
    });

    it('should generate diff for objects', () => {
      const diff = coordinator.diff({ a: 1 }, { a: 2 });
      expect(diff.equal).toBe(false);
      expect(diff.type).toBe('object');
    });

    it('should generate diff for arrays', () => {
      const diff = coordinator.diff([1, 2], [1, 3]);
      expect(diff.equal).toBe(false);
      expect(diff.type).toBe('array');
    });
  });

  describe('getType', () => {
    it('should return correct type for primitives', () => {
      expect(coordinator.getType(42)).toBe('number');
      expect(coordinator.getType('hello')).toBe('string');
      expect(coordinator.getType(true)).toBe('boolean');
      expect(coordinator.getType(null)).toBe('null');
      expect(coordinator.getType(undefined)).toBe('undefined');
    });

    it('should return correct type for objects', () => {
      expect(coordinator.getType({})).toBe('object');
      expect(coordinator.getType([])).toBe('array');
      expect(coordinator.getType(new Map())).toBe('map');
      expect(coordinator.getType(new Set())).toBe('set');
      expect(coordinator.getType(new Date())).toBe('date');
      expect(coordinator.getType(/abc/)).toBe('regexp');
    });
  });

  describe('getOptions/setOptions', () => {
    it('should get default options', () => {
      const options = coordinator.getOptions();
      expect(options.maxDepth).toBe(10);
      expect(options.deepComparison).toBe(true);
    });

    it('should set options', () => {
      coordinator.setOptions({ maxDepth: 5 });
      const options = coordinator.getOptions();
      expect(options.maxDepth).toBe(5);
    });

    it('should merge partial options', () => {
      coordinator.setOptions({ maxDepth: 5 });
      coordinator.setOptions({ ignoreFunctions: true });
      const options = coordinator.getOptions();
      expect(options.maxDepth).toBe(5);
      expect(options.ignoreFunctions).toBe(true);
    });
  });

  describe('get*Comparator methods', () => {
    it('should return primitive comparator', () => {
      const comparator = coordinator.getPrimitiveComparator();
      expect(comparator).toBeDefined();
    });

    it('should return array comparator', () => {
      const comparator = coordinator.getArrayComparator();
      expect(comparator).toBeDefined();
    });

    it('should return object comparator', () => {
      const comparator = coordinator.getObjectComparator();
      expect(comparator).toBeDefined();
    });

    it('should return map/set comparator', () => {
      const comparator = coordinator.getMapSetComparator();
      expect(comparator).toBeDefined();
    });

    it('should return date/regexp comparator', () => {
      const comparator = coordinator.getDateRegExpComparator();
      expect(comparator).toBeDefined();
    });

    it('should return diff generator', () => {
      const generator = coordinator.getDiffGenerator();
      expect(generator).toBeDefined();
    });

    it('should return circular tracker', () => {
      const tracker = coordinator.getCircularTracker();
      expect(tracker).toBeDefined();
    });
  });

  describe('getDiffSummary', () => {
    it('should return summary for equal values', () => {
      const diff = coordinator.diff(42, 42);
      const summary = coordinator.getDiffSummary(diff);
      expect(summary).toBe('No changes');
    });

    it('should return summary for different values', () => {
      const diff = coordinator.diff(1, 2);
      const summary = coordinator.getDiffSummary(diff);
      expect(summary).toContain('Changed');
    });
  });

  describe('edge cases', () => {
    it('should handle mixed types', () => {
      const result = coordinator.compare({ a: 1 }, [1, 2, 3]);
      expect(result.equal).toBe(false);
    });

    it('should handle symbols', () => {
      const sym = Symbol('test');
      const result = coordinator.compare(sym, sym);
      expect(result.equal).toBe(true);
    });

    it('should handle bigints', () => {
      const result = coordinator.compare(BigInt(42), BigInt(42));
      expect(result.equal).toBe(true);
    });

    it('should handle functions', () => {
      const fn = () => 42;
      const result = coordinator.compare(fn, fn);
      expect(result.equal).toBe(true);
    });

    it('should handle very large objects', () => {
      const obj1: Record<string, number> = {};
      const obj2: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        obj1[`key${i}`] = i;
        obj2[`key${i}`] = i;
      }

      const result = coordinator.compare(obj1, obj2);
      expect(result.equal).toBe(true);
    });

    it('should handle deeply nested objects', () => {
      const deep1 = { a: { b: { c: { d: 1 } } } };
      const deep2 = { a: { b: { c: { d: 1 } } } };

      // Without deep comparison - different object references
      const result = coordinator.compare(deep1, deep2, { deepComparison: false });
      expect(result.equal).toBe(false);
    });
  });

  describe('real-world scenarios', () => {
    it('should compare configuration objects', () => {
      const config1 = { timeout: 5000, retries: 3, url: 'https://api.example.com' };
      const config2 = { timeout: 5000, retries: 3, url: 'https://api.example.com' };

      const result = coordinator.compare(config1, config2);
      expect(result.equal).toBe(true);
    });

    it('should compare user profiles', () => {
      const profile1 = { id: 1, name: 'John', email: 'john@example.com' };
      const profile2 = { id: 1, name: 'John', email: 'john@example.com' };

      const result = coordinator.compare(profile1, profile2);
      expect(result.equal).toBe(true);
    });

    it('should compare shopping carts', () => {
      const cart1 = [
        { id: 1, quantity: 2 },
        { id: 2, quantity: 1 },
      ];
      const cart2 = [
        { id: 1, quantity: 2 },
        { id: 2, quantity: 1 },
      ];

      // Without deep comparison - different object references
      const result = coordinator.compare(cart1, cart2, { deepComparison: false });
      expect(result.equal).toBe(false);
    });

    it('should compare API responses', () => {
      const response1 = {
        status: 'success',
        data: { count: 10, items: [1, 2, 3] },
      };
      const response2 = {
        status: 'success',
        data: { count: 10, items: [1, 2, 3] },
      };

      // Without deep comparison - different object references
      const result = coordinator.compare(response1, response2, { deepComparison: false });
      expect(result.equal).toBe(false);
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
      const result = coordinator.compare(settings1, settings2, { deepComparison: false });
      expect(result.equal).toBe(false);
    });

    it('should detect changes in todo lists', () => {
      const todos1 = [
        { id: 1, text: 'Buy milk', done: false },
        { id: 2, text: 'Walk dog', done: true },
      ];
      const todos2 = [
        { id: 1, text: 'Buy milk', done: true },
        { id: 2, text: 'Walk dog', done: true },
      ];

      const result = coordinator.compare(todos1, todos2);
      expect(result.equal).toBe(false);
      expect(result.diff).toBeDefined();
    });
  });
});
