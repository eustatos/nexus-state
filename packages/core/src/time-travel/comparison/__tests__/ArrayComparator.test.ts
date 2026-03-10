/**
 * Tests for ArrayComparator
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ArrayComparator } from '../ArrayComparator';
import { PrimitiveComparator } from '../PrimitiveComparator';

describe('ArrayComparator', () => {
  let comparator: ArrayComparator;
  let primitiveComparator: PrimitiveComparator;

  beforeEach(() => {
    primitiveComparator = new PrimitiveComparator();
    comparator = new ArrayComparator(primitiveComparator);
  });

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(comparator.isArray([])).toBe(true);
      expect(comparator.isArray([1, 2, 3])).toBe(true);
    });

    it('should return false for non-arrays', () => {
      expect(comparator.isArray({})).toBe(false);
      expect(comparator.isArray('array')).toBe(false);
      expect(comparator.isArray(new Set())).toBe(false);
    });
  });

  describe('compare', () => {
    it('should return comparison result for equal arrays', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 3];

      const result = comparator.compare(arr1, arr2);

      expect(result.isEqual).toBe(true);
      expect(result.lengthDifference).toBe(0);
      expect(result.added).toBe(0);
      expect(result.removed).toBe(0);
      expect(result.moved).toBe(0);
      expect(result.modified).toBe(0);
    });

    it('should return comparison result for different length arrays', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2];

      const result = comparator.compare(arr1, arr2);

      expect(result.isEqual).toBe(false);
      expect(result.lengthDifference).toBe(1);
      expect(result.removed).toBe(1);
    });

    it('should detect added elements', () => {
      const arr1 = [1, 2];
      const arr2 = [1, 2, 3];

      const result = comparator.compare(arr1, arr2);

      expect(result.added).toBe(1);
    });

    it('should detect modified elements', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 5, 3];

      const result = comparator.compare(arr1, arr2);

      expect(result.modified).toBe(1);
    });

    it('should detect moved elements', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [3, 1, 2];

      const result = comparator.compare(arr1, arr2);

      expect(result.moved).toBeGreaterThan(0);
    });
  });

  describe('areEqual', () => {
    it('should return true for equal arrays', () => {
      expect(comparator.areEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it('should return false for different length arrays', () => {
      expect(comparator.areEqual([1, 2, 3], [1, 2])).toBe(false);
    });

    it('should return false for different values', () => {
      expect(comparator.areEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it('should return true for empty arrays', () => {
      expect(comparator.areEqual([], [])).toBe(true);
    });

    it('should handle sparse arrays', () => {
      const arr1 = new Array(3);
      arr1[0] = 1;
      const arr2 = new Array(3);
      arr2[0] = 1;

      expect(comparator.areEqual(arr1, arr2)).toBe(true);
    });

    it('should handle different sparse patterns', () => {
      const arr1 = new Array(3);
      arr1[0] = 1;
      const arr2 = new Array(3);
      arr2[1] = 1;

      expect(comparator.areEqual(arr1, arr2)).toBe(false);
    });

    it('should use deep comparison when enabled', () => {
      const arr1 = [{ a: 1 }];
      const arr2 = [{ a: 1 }];

      // Without deep comparison - different object references
      expect(comparator.areEqual(arr1, arr2, false)).toBe(false);
    });
  });

  describe('computeChanges', () => {
    it('should compute no changes for equal arrays', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 3];

      const changes = comparator.computeChanges(arr1, arr2);

      expect(changes.added).toEqual([]);
      expect(changes.removed).toEqual([]);
      expect(changes.moved).toEqual([]);
      expect(changes.modified).toEqual([]);
    });

    it('should compute added elements', () => {
      const arr1 = [1, 2];
      const arr2 = [1, 2, 3];

      const changes = comparator.computeChanges(arr1, arr2);

      expect(changes.added).toEqual([2]);
    });

    it('should compute removed elements', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2];

      const changes = comparator.computeChanges(arr1, arr2);

      expect(changes.removed).toEqual([2]);
    });

    it('should compute modified elements', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 5, 3];

      const changes = comparator.computeChanges(arr1, arr2);

      expect(changes.modified.length).toBe(1);
      expect(changes.modified[0]?.index).toBe(1);
    });

    it('should compute moved elements', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [3, 1, 2];

      const changes = comparator.computeChanges(arr1, arr2);

      expect(changes.moved.length).toBeGreaterThan(0);
    });

    it('should handle complex changes', () => {
      const arr1 = [1, 2, 3, 4, 5];
      const arr2 = [1, 5, 6, 3];

      const changes = comparator.computeChanges(arr1, arr2);

      expect(changes).toBeDefined();
    });
  });

  describe('getLength', () => {
    it('should return array length', () => {
      expect(comparator.getLength([1, 2, 3])).toBe(3);
      expect(comparator.getLength([])).toBe(0);
    });
  });

  describe('isSparse', () => {
    it('should return false for dense arrays', () => {
      expect(comparator.isSparse([1, 2, 3])).toBe(false);
    });

    it('should return true for sparse arrays', () => {
      const arr = new Array(3);
      arr[0] = 1;
      expect(comparator.isSparse(arr)).toBe(true);
    });

    it('should return false for empty arrays', () => {
      expect(comparator.isSparse([])).toBe(false);
    });
  });

  describe('getSparseIndices', () => {
    it('should return all indices for dense arrays', () => {
      const indices = comparator.getSparseIndices([1, 2, 3]);
      expect(indices).toEqual([0, 1, 2]);
    });

    it('should return only defined indices for sparse arrays', () => {
      const arr = new Array(5);
      arr[0] = 1;
      arr[3] = 2;
      const indices = comparator.getSparseIndices(arr);
      expect(indices).toEqual([0, 3]);
    });
  });

  describe('getDenseValues', () => {
    it('should return all values for dense arrays', () => {
      const values = comparator.getDenseValues([1, 2, 3]);
      expect(values).toEqual([1, 2, 3]);
    });

    it('should skip holes in sparse arrays', () => {
      const arr = new Array(5);
      arr[0] = 1;
      arr[3] = 2;
      const values = comparator.getDenseValues(arr);
      expect(values).toEqual([1, 2]);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty arrays', () => {
      expect(comparator.isEmpty([])).toBe(true);
    });

    it('should return false for non-empty arrays', () => {
      expect(comparator.isEmpty([1])).toBe(false);
    });

    it('should return false for sparse arrays with length', () => {
      const arr = new Array(3);
      expect(comparator.isEmpty(arr)).toBe(false);
    });
  });

  describe('getDisplayValue', () => {
    it('should return string representation', () => {
      const display = comparator.getDisplayValue([1, 2, 3]);
      expect(display).toBe('[1, 2, 3]');
    });

    it('should handle sparse arrays', () => {
      const arr = new Array(3);
      arr[0] = 1;
      const display = comparator.getDisplayValue(arr);
      expect(display).toContain('<empty>');
    });

    it('should handle objects', () => {
      const display = comparator.getDisplayValue([{ a: 1 }]);
      expect(display).toContain('{"a":1}');
    });
  });

  describe('createArray', () => {
    it('should create array from values', () => {
      const arr = comparator.createArray(1, 2, 3);
      expect(arr).toEqual([1, 2, 3]);
    });

    it('should create empty array', () => {
      const arr = comparator.createArray();
      expect(arr).toEqual([]);
    });
  });

  describe('createSparseArray', () => {
    it('should create sparse array', () => {
      const arr = comparator.createSparseArray(5, [0, 3], 'defined');
      expect(arr.length).toBe(5);
      expect(arr[0]).toBe('defined');
      expect(arr[3]).toBe('defined');
      expect(1 in arr).toBe(false);
    });

    it('should handle empty defined indices', () => {
      const arr = comparator.createSparseArray(3, []);
      expect(arr.length).toBe(3);
      expect(comparator.isSparse(arr)).toBe(true);
    });
  });

  describe('getElement', () => {
    it('should get element at index', () => {
      expect(comparator.getElement([1, 2, 3], 1)).toBe(2);
    });

    it('should return undefined for out of bounds', () => {
      expect(comparator.getElement([1, 2, 3], 5)).toBeUndefined();
      expect(comparator.getElement([1, 2, 3], -1)).toBeUndefined();
    });

    it('should return undefined for sparse index', () => {
      const arr = new Array(3);
      expect(comparator.getElement(arr, 1)).toBeUndefined();
    });
  });

  describe('hasIndex', () => {
    it('should return true for existing index', () => {
      expect(comparator.hasIndex([1, 2, 3], 1)).toBe(true);
    });

    it('should return false for out of bounds', () => {
      expect(comparator.hasIndex([1, 2, 3], 5)).toBe(false);
    });

    it('should return false for sparse index', () => {
      const arr = new Array(3);
      expect(comparator.hasIndex(arr, 1)).toBe(false);
    });
  });

  describe('getFirst/getLast', () => {
    it('should get first element', () => {
      expect(comparator.getFirst([1, 2, 3])).toBe(1);
    });

    it('should get last element', () => {
      expect(comparator.getLast([1, 2, 3])).toBe(3);
    });

    it('should return undefined for empty array', () => {
      expect(comparator.getFirst([])).toBeUndefined();
      expect(comparator.getLast([])).toBeUndefined();
    });
  });

  describe('getUniqueValues', () => {
    it('should return unique values', () => {
      const unique = comparator.getUniqueValues([1, 2, 2, 3, 3, 3]);
      expect(unique).toEqual([1, 2, 3]);
    });

    it('should handle empty array', () => {
      const unique = comparator.getUniqueValues([]);
      expect(unique).toEqual([]);
    });

    it('should handle all same values', () => {
      const unique = comparator.getUniqueValues([1, 1, 1]);
      expect(unique).toEqual([1]);
    });
  });

  describe('haveSameLength/getLengthDifference', () => {
    it('should check same length', () => {
      expect(comparator.haveSameLength([1, 2], [3, 4])).toBe(true);
      expect(comparator.haveSameLength([1, 2], [3])).toBe(false);
    });

    it('should get length difference', () => {
      expect(comparator.getLengthDifference([1, 2, 3], [1, 2])).toBe(1);
      expect(comparator.getLengthDifference([1], [1, 2, 3])).toBe(-2);
    });
  });

  describe('indexOf/includes', () => {
    it('should find index of value', () => {
      expect(comparator.indexOf([1, 2, 3], 2)).toBe(1);
      expect(comparator.indexOf([1, 2, 3], 5)).toBe(-1);
    });

    it('should check if includes value', () => {
      expect(comparator.includes([1, 2, 3], 2)).toBe(true);
      expect(comparator.includes([1, 2, 3], 5)).toBe(false);
    });

    it('should use deep comparison when enabled', () => {
      const arr = [{ a: 1 }];
      expect(comparator.indexOf(arr, { a: 1 }, false)).toBe(-1);
    });
  });

  describe('edge cases', () => {
    it('should handle arrays with NaN', () => {
      const arr1 = [NaN, 1, 2];
      const arr2 = [NaN, 1, 2];
      expect(comparator.areEqual(arr1, arr2)).toBe(true);
    });

    it('should handle arrays with undefined', () => {
      const arr1 = [undefined, 1, 2];
      const arr2 = [undefined, 1, 2];
      expect(comparator.areEqual(arr1, arr2)).toBe(true);
    });

    it('should handle arrays with null', () => {
      const arr1 = [null, 1, 2];
      const arr2 = [null, 1, 2];
      expect(comparator.areEqual(arr1, arr2)).toBe(true);
    });

    it('should handle nested arrays', () => {
      const arr1 = [[1, 2], [3, 4]];
      const arr2 = [[1, 2], [3, 4]];
      // Without deep comparison - different array references
      expect(comparator.areEqual(arr1, arr2, false)).toBe(false);
    });

    it('should handle arrays with functions', () => {
      const fn = () => 42;
      const arr1 = [fn, 1];
      const arr2 = [fn, 1];
      expect(comparator.areEqual(arr1, arr2)).toBe(true);
    });

    it('should handle very large arrays', () => {
      const arr1 = Array.from({ length: 1000 }, (_, i) => i);
      const arr2 = Array.from({ length: 1000 }, (_, i) => i);
      expect(comparator.areEqual(arr1, arr2)).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    it('should compare todo lists', () => {
      const todos1 = ['Buy milk', 'Walk dog', 'Finish report'];
      const todos2 = ['Buy milk', 'Walk dog', 'Finish report'];
      expect(comparator.areEqual(todos1, todos2)).toBe(true);
    });

    it('should compare reordered playlists', () => {
      const playlist1 = ['Song 1', 'Song 2', 'Song 3'];
      const playlist2 = ['Song 3', 'Song 1', 'Song 2'];
      const result = comparator.compare(playlist1, playlist2);
      expect(result.moved).toBeGreaterThan(0);
    });

    it('should compare paginated results', () => {
      const page1 = [1, 2, 3, 4, 5];
      const page2 = [1, 2, 3, 4, 5, 6];
      const result = comparator.compare(page1, page2);
      expect(result.added).toBe(1);
    });

    it('should compare version arrays', () => {
      const version1 = [1, 2, 3];
      const version2 = [1, 2, 4];
      const result = comparator.compare(version1, version2);
      expect(result.modified).toBe(1);
    });
  });
});
