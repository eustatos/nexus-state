/**
 * Tests for PrimitiveChangeDetector
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PrimitiveChangeDetector } from '../PrimitiveChangeDetector';
import type { TrackedAtom } from '../types';

/**
 * Create mock tracked atom
 */
function createMockAtom(id: symbol, name: string): TrackedAtom {
  return {
    id,
    name,
    atom: {} as any,
    type: 'primitive',
    status: 'active',
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
    lastChanged: Date.now(),
    accessCount: 0,
    idleTime: 0,
    ttl: 60000,
    gcEligible: false,
    firstSeen: Date.now(),
    lastSeen: Date.now(),
    changeCount: 0,
    metadata: {
      createdAt: Date.now(),
      type: 'primitive',
    },
    subscribers: new Set(),
  };
}

describe('PrimitiveChangeDetector', () => {
  let detector: PrimitiveChangeDetector;

  beforeEach(() => {
    detector = new PrimitiveChangeDetector();
  });

  describe('detectChange', () => {
    it('should return null for unchanged values', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const result = detector.detectChange(atom, 42, 42);

      expect(result).toBeNull();
    });

    it('should return change event for changed values', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const result = detector.detectChange(atom, 1, 2);

      expect(result).toBeDefined();
      expect(result?.atomId).toBe(atom.id);
      expect(result?.oldValue).toBe(1);
      expect(result?.newValue).toBe(2);
      expect(result?.type).toBe('value');
    });

    it('should detect created value', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const result = detector.detectChange(atom, undefined, 42);

      expect(result?.type).toBe('created');
    });

    it('should detect deleted value', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const result = detector.detectChange(atom, 42, undefined);

      expect(result?.type).toBe('deleted');
    });

    it('should detect type change', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const result = detector.detectChange(atom, 42, '42');

      expect(result?.type).toBe('type');
    });

    it('should include timestamp', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const before = Date.now();
      const result = detector.detectChange(atom, 1, 2);
      const after = Date.now();

      expect(result?.timestamp).toBeGreaterThanOrEqual(before);
      expect(result?.timestamp).toBeLessThanOrEqual(after);
    });

    it('should handle object values', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const oldObj = { a: 1 };
      const newObj = { a: 2 };

      const result = detector.detectChange(atom, oldObj, newObj);

      expect(result).toBeDefined();
      expect(result?.type).toBe('value');
    });

    it('should handle array values', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const oldArr = [1, 2, 3];
      const newArr = [1, 2, 4];

      const result = detector.detectChange(atom, oldArr, newArr);

      expect(result).toBeDefined();
      expect(result?.type).toBe('value');
    });
  });

  describe('hasChanged', () => {
    it('should return true for changed primitives', () => {
      expect(detector.hasChanged(1, 2)).toBe(true);
      expect(detector.hasChanged('a', 'b')).toBe(true);
      expect(detector.hasChanged(true, false)).toBe(true);
    });

    it('should return false for unchanged primitives', () => {
      expect(detector.hasChanged(42, 42)).toBe(false);
      expect(detector.hasChanged('same', 'same')).toBe(false);
      expect(detector.hasChanged(true, true)).toBe(false);
    });

    it('should return true for created/deleted', () => {
      expect(detector.hasChanged(undefined, 1)).toBe(true);
      expect(detector.hasChanged(1, undefined)).toBe(true);
    });

    it('should handle objects', () => {
      expect(detector.hasChanged({ a: 1 }, { a: 2 })).toBe(true);
      expect(detector.hasChanged({ a: 1 }, { a: 1 })).toBe(false);
    });

    it('should handle arrays', () => {
      expect(detector.hasChanged([1, 2], [1, 3])).toBe(true);
      expect(detector.hasChanged([1, 2], [1, 2])).toBe(false);
    });
  });

  describe('getChangeType', () => {
    it('should return created for undefined to value', () => {
      expect(detector.getChangeType(undefined, 42)).toBe('created');
    });

    it('should return deleted for value to undefined', () => {
      expect(detector.getChangeType(42, undefined)).toBe('deleted');
    });

    it('should return type for different types', () => {
      expect(detector.getChangeType(42, '42')).toBe('type');
    });

    it('should return value for same type different value', () => {
      expect(detector.getChangeType(1, 2)).toBe('value');
    });

    it('should return unchanged for same value', () => {
      expect(detector.getChangeType(42, 42)).toBe('change');
    });
  });

  describe('custom comparison strategy', () => {
    it('should use provided comparison strategy', () => {
      const customStrategy = {
        detectChangeType: () => 'value' as const,
        hasChanged: () => true,
        compare: () => ({ changeType: 'value' as const, hasChanged: true, oldValue: 1, newValue: 2 }),
      };

      const customDetector = new PrimitiveChangeDetector(customStrategy as any);
      const atom = createMockAtom(Symbol('atom1'), 'atom1');

      const result = customDetector.detectChange(atom, 1, 2);

      expect(result?.type).toBe('value');
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');

      expect(detector.detectChange(atom, null, null)).toBeNull();
      expect(detector.detectChange(atom, null, undefined)).toBeDefined();
    });

    it('should handle NaN', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const result = detector.detectChange(atom, NaN, NaN);

      // NaN !== NaN, so should detect change
      expect(result).toBeDefined();
    });

    it('should handle +0 and -0', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const result = detector.detectChange(atom, +0, -0);

      // +0 === -0, so no change
      expect(result).toBeNull();
    });

    it('should handle large objects', () => {
      const atom = createMockAtom(Symbol('atom1'), 'atom1');
      const largeObj1: Record<string, number> = {};
      const largeObj2: Record<string, number> = {};

      for (let i = 0; i < 100; i++) {
        largeObj1[`key${i}`] = i;
        largeObj2[`key${i}`] = i;
      }

      expect(detector.detectChange(atom, largeObj1, largeObj2)).toBeNull();

      largeObj2.key50 = 999;
      expect(detector.detectChange(atom, largeObj1, largeObj2)).toBeDefined();
    });
  });
});
