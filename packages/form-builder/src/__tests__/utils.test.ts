/**
 * Utils Tests
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { generateId, deepClone, debounce } from '../utils';

describe('Utils', () => {
  describe('generateId', () => {
    it('should generate id with default prefix', () => {
      const id = generateId();
      expect(id).toMatch(/^id_\d+_[a-z0-9]+$/);
    });

    it('should generate id with custom prefix', () => {
      const id = generateId('field');
      expect(id).toMatch(/^field_\d+_[a-z0-9]+$/);
    });

    it('should generate unique ids', () => {
      const ids = new Set([generateId(), generateId(), generateId()]);
      expect(ids.size).toBe(3);
    });
  });

  describe('deepClone', () => {
    it('should clone simple object', () => {
      const obj = { a: 1, b: 2 };
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
    });

    it('should clone nested object', () => {
      const obj = { a: 1, b: { c: 2, d: { e: 3 } } };
      const cloned = deepClone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned.b).not.toBe(obj.b);
      expect(cloned.b.d).not.toBe(obj.b.d);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, [3, 4]];
      const cloned = deepClone(arr);
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[2]).not.toBe(arr[2]);
    });

    it('should handle null values', () => {
      const obj = { a: null, b: 1 };
      const cloned = deepClone(obj);
      expect(cloned.a).toBeNull();
      expect(cloned.b).toBe(1);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should delay function execution', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to function', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
});
