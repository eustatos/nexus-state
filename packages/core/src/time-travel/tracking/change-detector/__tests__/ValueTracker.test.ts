/**
 * ValueTracker tests
 */

import { describe, it, expect } from 'vitest';
import { ValueTracker } from '../ValueTracker';

describe('ValueTracker', () => {
  describe('storeValue', () => {
    it('should store value for atom', () => {
      const tracker = new ValueTracker();
      const atomId = Symbol('test');

      tracker.storeValue(atomId, 42);

      expect(tracker.getValue(atomId)).toBe(42);
    });

    it('should overwrite existing value', () => {
      const tracker = new ValueTracker();
      const atomId = Symbol('test');

      tracker.storeValue(atomId, 1);
      tracker.storeValue(atomId, 2);

      expect(tracker.getValue(atomId)).toBe(2);
    });
  });

  describe('getValue', () => {
    it('should return undefined for unknown atom', () => {
      const tracker = new ValueTracker();
      const atomId = Symbol('test');

      expect(tracker.getValue(atomId)).toBeUndefined();
    });

    it('should return stored value', () => {
      const tracker = new ValueTracker();
      const atomId = Symbol('test');

      tracker.storeValue(atomId, 'hello');

      expect(tracker.getValue(atomId)).toBe('hello');
    });
  });

  describe('hasValue', () => {
    it('should return false for unknown atom', () => {
      const tracker = new ValueTracker();
      const atomId = Symbol('test');

      expect(tracker.hasValue(atomId)).toBe(false);
    });

    it('should return true for stored value', () => {
      const tracker = new ValueTracker();
      const atomId = Symbol('test');

      tracker.storeValue(atomId, 42);

      expect(tracker.hasValue(atomId)).toBe(true);
    });
  });

  describe('deleteValue', () => {
    it('should delete stored value', () => {
      const tracker = new ValueTracker();
      const atomId = Symbol('test');

      tracker.storeValue(atomId, 42);
      tracker.deleteValue(atomId);

      expect(tracker.hasValue(atomId)).toBe(false);
    });

    it('should handle deleting non-existent value', () => {
      const tracker = new ValueTracker();
      const atomId = Symbol('test');

      expect(() => tracker.deleteValue(atomId)).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all values', () => {
      const tracker = new ValueTracker();

      tracker.storeValue(Symbol('test1'), 1);
      tracker.storeValue(Symbol('test2'), 2);
      tracker.clear();

      expect(tracker.hasValue(Symbol('test1'))).toBe(false);
      expect(tracker.hasValue(Symbol('test2'))).toBe(false);
    });
  });
});
