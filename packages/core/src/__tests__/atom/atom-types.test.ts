/**
 * Atom Type Guards Tests
 * Tests for atom type detection and guards
 */

import { describe, it, expect } from 'vitest';
import { atom } from '../../atom';
import {
  isPrimitiveAtom,
  isComputedAtom,
  isWritableAtom,
} from '../../types';
import type { Getter, Setter } from '../../types';

describe('Atom Type Guards', () => {
  describe('isPrimitiveAtom', () => {
    it('should identify primitive atom with number value', () => {
      const primitiveAtom = atom(42);
      expect(isPrimitiveAtom(primitiveAtom)).toBe(true);
    });

    it('should identify primitive atom with string value', () => {
      const stringAtom = atom('hello');
      expect(isPrimitiveAtom(stringAtom)).toBe(true);
    });

    it('should identify primitive atom with object value', () => {
      const objectAtom = atom({ key: 'value' });
      expect(isPrimitiveAtom(objectAtom)).toBe(true);
    });

    it('should not identify computed atom as primitive', () => {
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);
      expect(isPrimitiveAtom(computedAtom)).toBe(false);
    });

    it('should not identify writable atom as primitive', () => {
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: Setter, value: number) => set(baseAtom, value)
      );
      expect(isPrimitiveAtom(writableAtom)).toBe(false);
    });
  });

  describe('isComputedAtom', () => {
    it('should identify computed atom', () => {
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);
      expect(isComputedAtom(computedAtom)).toBe(true);
    });

    it('should identify computed atom with multiple dependencies', () => {
      const atom1 = atom(10);
      const atom2 = atom(20);
      const sumAtom = atom((get: Getter) => get(atom1) + get(atom2));
      expect(isComputedAtom(sumAtom)).toBe(true);
    });

    it('should not identify primitive atom as computed', () => {
      const primitiveAtom = atom(42);
      expect(isComputedAtom(primitiveAtom)).toBe(false);
    });

    it('should not identify writable atom as computed', () => {
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: Setter, value: number) => set(baseAtom, value)
      );
      expect(isComputedAtom(writableAtom)).toBe(false);
    });
  });

  describe('isWritableAtom', () => {
    it('should identify writable atom', () => {
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: Setter, value: number) => set(baseAtom, value)
      );
      expect(isWritableAtom(writableAtom)).toBe(true);
    });

    it('should identify writable atom with custom write logic', () => {
      const counterAtom = atom(
        () => 0,
        (get, set, action: 'inc' | 'dec') => {
          const current = get(counterAtom);
          set(counterAtom, action === 'inc' ? current + 1 : current - 1);
        }
      );
      expect(isWritableAtom(counterAtom)).toBe(true);
    });

    it('should not identify primitive atom as writable', () => {
      const primitiveAtom = atom(42);
      expect(isWritableAtom(primitiveAtom)).toBe(false);
    });

    it('should not identify computed atom as writable', () => {
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);
      expect(isWritableAtom(computedAtom)).toBe(false);
    });
  });

  describe('Type Guard Cross-Validation', () => {
    it('should have mutually exclusive type guards for primitive', () => {
      const primitiveAtom = atom(42);
      expect(isPrimitiveAtom(primitiveAtom)).toBe(true);
      expect(isComputedAtom(primitiveAtom)).toBe(false);
      expect(isWritableAtom(primitiveAtom)).toBe(false);
    });

    it('should have mutually exclusive type guards for computed', () => {
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);
      expect(isPrimitiveAtom(computedAtom)).toBe(false);
      expect(isComputedAtom(computedAtom)).toBe(true);
      expect(isWritableAtom(computedAtom)).toBe(false);
    });

    it('should have mutually exclusive type guards for writable', () => {
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: Setter, value: number) => set(baseAtom, value)
      );
      expect(isPrimitiveAtom(writableAtom)).toBe(false);
      expect(isComputedAtom(writableAtom)).toBe(false);
      expect(isWritableAtom(writableAtom)).toBe(true);
    });
  });

  describe('Atom Type Property', () => {
    it('should have correct type property for primitive atom', () => {
      const primitiveAtom = atom(42);
      expect(primitiveAtom.type).toBe('primitive');
    });

    it('should have correct type property for computed atom', () => {
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);
      expect(computedAtom.type).toBe('computed');
    });

    it('should have correct type property for writable atom', () => {
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: Setter, value: number) => set(baseAtom, value)
      );
      expect(writableAtom.type).toBe('writable');
    });
  });
});
