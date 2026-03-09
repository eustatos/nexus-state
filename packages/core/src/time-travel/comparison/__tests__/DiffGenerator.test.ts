/**
 * Tests for DiffGenerator
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DiffGenerator } from '../DiffGenerator';
import { PrimitiveComparator } from '../PrimitiveComparator';
import { ArrayComparator } from '../ArrayComparator';
import { ObjectComparator } from '../ObjectComparator';
import { MapSetComparator } from '../MapSetComparator';
import { DateRegExpComparator } from '../DateRegExpComparator';

describe('DiffGenerator', () => {
  let generator: DiffGenerator;
  let primitiveComparator: PrimitiveComparator;
  let arrayComparator: ArrayComparator;
  let objectComparator: ObjectComparator;
  let mapSetComparator: MapSetComparator;
  let dateRegExpComparator: DateRegExpComparator;

  beforeEach(() => {
    primitiveComparator = new PrimitiveComparator();
    arrayComparator = new ArrayComparator(primitiveComparator);
    objectComparator = new ObjectComparator(primitiveComparator);
    mapSetComparator = new MapSetComparator(primitiveComparator);
    dateRegExpComparator = new DateRegExpComparator();

    generator = new DiffGenerator(
      {},
      primitiveComparator,
      arrayComparator,
      objectComparator,
      mapSetComparator,
      dateRegExpComparator
    );
  });

  describe('generateDiff - primitives', () => {
    it('should generate diff for equal primitives', () => {
      const diff = generator.generateDiff(42, 42);
      expect(diff.equal).toBe(true);
      expect(diff.type).toBe('primitive');
    });

    it('should generate diff for different primitives', () => {
      const diff = generator.generateDiff(42, 43);
      expect(diff.equal).toBe(false);
      expect(diff.oldPrimitive).toBe(42);
      expect(diff.newPrimitive).toBe(43);
    });

    it('should handle NaN', () => {
      const diff = generator.generateDiff(NaN, NaN);
      expect(diff.equal).toBe(true);
    });

    it('should handle null and undefined', () => {
      const diff1 = generator.generateDiff(null, null);
      expect(diff1.equal).toBe(true);

      const diff2 = generator.generateDiff(null, undefined);
      expect(diff2.equal).toBe(false);
    });

    it('should handle strings', () => {
      const diff = generator.generateDiff('hello', 'world');
      expect(diff.equal).toBe(false);
    });

    it('should handle booleans', () => {
      const diff = generator.generateDiff(true, false);
      expect(diff.equal).toBe(false);
    });
  });

  describe('generateDiff - objects', () => {
    it('should generate diff for equal objects', () => {
      const diff = generator.generateDiff({ a: 1 }, { a: 1 });
      expect(diff.equal).toBe(true);
    });

    it('should generate diff for objects with different values', () => {
      const diff = generator.generateDiff({ a: 1 }, { a: 2 });
      expect(diff.equal).toBe(false);
      expect(diff.objectChanges).toBeDefined();
    });

    it('should generate diff for objects with different keys', () => {
      const diff = generator.generateDiff({ a: 1 }, { b: 1 });
      expect(diff.equal).toBe(false);
      expect(diff.objectChanges).toBeDefined();
      // Check that 'a' was removed and 'b' was added
      expect(diff.objectChanges?.a).toBeDefined();
      expect(diff.objectChanges?.b).toBeDefined();
    });

    it('should handle nested objects', () => {
      const diff = generator.generateDiff(
        { a: { b: 1 } },
        { a: { b: 2 } }
      );
      expect(diff.equal).toBe(false);
      expect(diff.objectChanges).toBeDefined();
    });

    it('should handle empty objects', () => {
      const diff = generator.generateDiff({}, {});
      expect(diff.equal).toBe(true);
    });
  });

  describe('generateDiff - arrays', () => {
    it('should generate diff for equal arrays', () => {
      const diff = generator.generateDiff([1, 2, 3], [1, 2, 3]);
      expect(diff.equal).toBe(true);
    });

    it('should generate diff for arrays with different values', () => {
      const diff = generator.generateDiff([1, 2, 3], [1, 2, 4]);
      expect(diff.equal).toBe(false);
      expect(diff.arrayChanges).toBeDefined();
    });

    it('should generate diff for arrays with different lengths', () => {
      const diff = generator.generateDiff([1, 2], [1, 2, 3]);
      expect(diff.equal).toBe(false);
      expect(diff.arrayChanges?.added.length).toBeGreaterThan(0);
    });

    it('should handle empty arrays', () => {
      const diff = generator.generateDiff([], []);
      expect(diff.equal).toBe(true);
    });
  });

  describe('generateDiff - maps', () => {
    it('should generate diff for equal maps', () => {
      const map1 = new Map([['a', 1], ['b', 2]]);
      const map2 = new Map([['a', 1], ['b', 2]]);

      const diff = generator.generateDiff(map1, map2);
      expect(diff.equal).toBe(true);
    });

    it('should generate diff for maps with different values', () => {
      const map1 = new Map([['a', 1], ['b', 2]]);
      const map2 = new Map([['a', 1], ['b', 3]]);

      const diff = generator.generateDiff(map1, map2);
      expect(diff.equal).toBe(false);
    });

    it('should generate diff for maps with different keys', () => {
      const map1 = new Map([['a', 1]]);
      const map2 = new Map([['b', 1]]);

      const diff = generator.generateDiff(map1, map2);
      expect(diff.equal).toBe(false);
    });
  });

  describe('generateDiff - sets', () => {
    it('should generate diff for equal sets', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 3]);

      const diff = generator.generateDiff(set1, set2);
      expect(diff.equal).toBe(true);
    });

    it('should generate diff for sets with different values', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 4]);

      const diff = generator.generateDiff(set1, set2);
      expect(diff.equal).toBe(false);
    });
  });

  describe('generateDiff - dates', () => {
    it('should generate diff for equal dates', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-01-01T00:00:00Z');

      const diff = generator.generateDiff(date1, date2);
      expect(diff.equal).toBe(true);
    });

    it('should generate diff for different dates', () => {
      const date1 = new Date('2024-01-01T00:00:00Z');
      const date2 = new Date('2024-01-02T00:00:00Z');

      const diff = generator.generateDiff(date1, date2);
      expect(diff.equal).toBe(false);
    });
  });

  describe('generateDiff - regexps', () => {
    it('should generate diff for equal regexps', () => {
      const regexp1 = /abc/gi;
      const regexp2 = /abc/gi;

      const diff = generator.generateDiff(regexp1, regexp2);
      expect(diff.equal).toBe(true);
    });

    it('should generate diff for different regexps', () => {
      const regexp1 = /abc/g;
      const regexp2 = /abc/i;

      const diff = generator.generateDiff(regexp1, regexp2);
      expect(diff.equal).toBe(false);
    });
  });

  describe('generateDiff - functions', () => {
    it('should generate diff for functions with ignoreFunctions option', () => {
      const gen = new DiffGenerator({ ignoreFunctions: true });
      const fn = () => 42;

      const diff = gen.generateDiff(fn, fn);
      expect(diff.equal).toBe(true);
    });

    it('should generate diff for different functions', () => {
      const fn1 = () => 42;
      const fn2 = () => 43;

      const diff = generator.generateDiff(fn1, fn2);
      expect(diff.equal).toBe(false);
    });
  });

  describe('generateDiff - max depth', () => {
    it('should respect max depth option', () => {
      const gen = new DiffGenerator({ maxDepth: 2 });
      const deep1 = { a: { b: { c: { d: 1 } } } };
      const deep2 = { a: { b: { c: { d: 2 } } } };

      const diff = gen.generateDiff(deep1, deep2);
      // Should stop at max depth
      expect(diff).toBeDefined();
    });
  });

  describe('getSummary', () => {
    it('should return "No changes" for equal values', () => {
      const diff = generator.generateDiff(42, 42);
      const summary = generator.getSummary(diff);
      expect(summary).toBe('No changes');
    });

    it('should return summary for primitive changes', () => {
      const diff = generator.generateDiff(1, 2);
      const summary = generator.getSummary(diff);
      expect(summary).toContain('Changed');
    });

    it('should return summary for object changes', () => {
      const diff = generator.generateDiff({ a: 1 }, { a: 2 });
      const summary = generator.getSummary(diff);
      expect(summary).toContain('properties changed');
    });

    it('should return summary for array changes', () => {
      const diff = generator.generateDiff([1, 2], [1, 2, 3]);
      const summary = generator.getSummary(diff);
      expect(summary).toMatch(/(added|removed|modified)/);
    });
  });

  describe('getOptions/setOptions', () => {
    it('should get default options', () => {
      const options = generator.getOptions();
      expect(options.maxDepth).toBe(10);
      expect(options.deepComparison).toBe(true);
    });

    it('should set options', () => {
      generator.setOptions({ maxDepth: 5 });
      const options = generator.getOptions();
      expect(options.maxDepth).toBe(5);
    });

    it('should merge partial options', () => {
      generator.setOptions({ maxDepth: 5 });
      generator.setOptions({ ignoreFunctions: true });
      const options = generator.getOptions();
      expect(options.maxDepth).toBe(5);
      expect(options.ignoreFunctions).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
      const diff = generator.generateDiff(null, { a: 1 });
      expect(diff.equal).toBe(false);
    });

    it('should handle undefined values', () => {
      const diff = generator.generateDiff(undefined, { a: 1 });
      expect(diff.equal).toBe(false);
    });

    it('should handle mixed types', () => {
      const diff = generator.generateDiff({ a: 1 }, [1, 2, 3]);
      expect(diff.equal).toBe(false);
    });

    it('should handle symbols', () => {
      const sym = Symbol('key');
      const diff = generator.generateDiff(sym, sym);
      expect(diff.equal).toBe(true);
    });

    it('should handle bigints', () => {
      const diff = generator.generateDiff(BigInt(42), BigInt(42));
      expect(diff.equal).toBe(true);
    });

    it('should handle very large objects', () => {
      const obj1: Record<string, number> = {};
      const obj2: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        obj1[`key${i}`] = i;
        obj2[`key${i}`] = i;
      }

      const diff = generator.generateDiff(obj1, obj2);
      expect(diff.equal).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    it('should diff configuration changes', () => {
      const config1 = { timeout: 5000, retries: 3 };
      const config2 = { timeout: 10000, retries: 3 };

      const diff = generator.generateDiff(config1, config2);
      expect(diff.equal).toBe(false);
      expect(diff.objectChanges).toBeDefined();
    });

    it('should diff user profile changes', () => {
      const profile1 = { name: 'John', email: 'john@example.com' };
      const profile2 = { name: 'John', email: 'john.new@example.com' };

      const diff = generator.generateDiff(profile1, profile2);
      expect(diff.equal).toBe(false);
    });

    it('should diff shopping cart changes', () => {
      const cart1 = [
        { id: 1, quantity: 2 },
        { id: 2, quantity: 1 },
      ];
      const cart2 = [
        { id: 1, quantity: 3 },
        { id: 2, quantity: 1 },
        { id: 3, quantity: 1 },
      ];

      const diff = generator.generateDiff(cart1, cart2);
      expect(diff.equal).toBe(false);
      expect(diff.arrayChanges).toBeDefined();
    });

    it('should diff API response changes', () => {
      const response1 = {
        status: 'success',
        data: { count: 10, items: [1, 2, 3] },
      };
      const response2 = {
        status: 'success',
        data: { count: 15, items: [1, 2, 3, 4, 5] },
      };

      const diff = generator.generateDiff(response1, response2);
      expect(diff.equal).toBe(false);
    });

    it('should diff nested settings', () => {
      const settings1 = {
        theme: 'dark',
        notifications: { email: true, push: false },
      };
      const settings2 = {
        theme: 'dark',
        notifications: { email: true, push: true },
      };

      const diff = generator.generateDiff(settings1, settings2);
      expect(diff.equal).toBe(false);
    });
  });
});
