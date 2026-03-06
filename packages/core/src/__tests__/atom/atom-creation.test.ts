/**
 * Atom Creation Tests
 * Tests for basic atom creation functionality
 */

import { describe, it, expect } from 'vitest';
import { atom, createStore, atomRegistry } from '../../index';
import type { Getter } from '../../types';

describe('Atom Creation', () => {
  describe('Primitive Atoms', () => {
    it('should create a primitive atom with number value', () => {
      const countAtom = atom(0);
      expect(countAtom).toBeDefined();
      expect(countAtom.id).toBeDefined();
      expect(countAtom.type).toBe('primitive');
    });

    it('should create a primitive atom with string value', () => {
      const nameAtom = atom('test');
      expect(nameAtom).toBeDefined();
      expect(nameAtom.type).toBe('primitive');
    });

    it('should create a primitive atom with boolean value', () => {
      const flagAtom = atom(true);
      expect(flagAtom).toBeDefined();
      expect(flagAtom.type).toBe('primitive');
    });

    it('should create a primitive atom with object value', () => {
      const objAtom = atom({ key: 'value' });
      expect(objAtom).toBeDefined();
      expect(objAtom.type).toBe('primitive');
    });

    it('should create a primitive atom with array value', () => {
      const arrAtom = atom([1, 2, 3]);
      expect(arrAtom).toBeDefined();
      expect(arrAtom.type).toBe('primitive');
    });
  });

  describe('Computed Atoms', () => {
    it('should create a computed atom', () => {
      const countAtom = atom(0);
      const doubleAtom = atom((get: Getter) => get(countAtom) * 2);
      expect(doubleAtom).toBeDefined();
      expect(doubleAtom.id).toBeDefined();
      expect(doubleAtom.type).toBe('computed');
    });

    it('should create a computed atom with multiple dependencies', () => {
      const atom1 = atom(10);
      const atom2 = atom(20);
      const sumAtom = atom((get: Getter) => get(atom1) + get(atom2));
      expect(sumAtom).toBeDefined();
      expect(sumAtom.type).toBe('computed');
    });

    it('should create nested computed atoms', () => {
      const baseAtom = atom(5);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);
      const tripleDoubleAtom = atom((get: Getter) => get(doubleAtom) * 3);
      expect(tripleDoubleAtom).toBeDefined();
      expect(tripleDoubleAtom.type).toBe('computed');
    });
  });

  describe('Atoms with Name', () => {
    it('should create primitive atom with name', () => {
      const countAtom = atom(0, 'count');
      expect(countAtom.name).toBe('count');
    });

    it('should create computed atom with name', () => {
      const countAtom = atom(0);
      const doubleAtom = atom((get: Getter) => get(countAtom) * 2, 'double');
      expect(doubleAtom.name).toBe('double');
    });

    it('should create writable atom with name', () => {
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: any, value: number) => set(baseAtom, value),
        'writable-count'
      );
      expect(writableAtom.name).toBe('writable-count');
    });

    it('should register atom with registry when created with name', () => {
      const testAtom = atom(42, 'test-atom');
      const registeredAtom = atomRegistry.get(testAtom.id);
      expect(registeredAtom).toBe(testAtom);
    });
  });

  describe('Writable Atoms - Basic', () => {
    it('should create a writable atom', () => {
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: any, value: number) => set(baseAtom, value)
      );
      expect(writableAtom.type).toBe('writable');
      expect(writableAtom.write).toBeDefined();
    });

    it('should update writable atom value through store', () => {
      const store = createStore();
      const baseAtom = atom(0);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: any, value: number) => set(baseAtom, value)
      );

      expect(store.get(writableAtom)).toBe(0);

      store.set(writableAtom, 10);
      expect(store.get(baseAtom)).toBe(10);
    });

    it('should handle writable atom in computed dependencies', () => {
      const store = createStore();
      const baseAtom = atom(5);
      const writableAtom = atom(
        (get: Getter) => get(baseAtom),
        (get: Getter, set: any, value: number) => set(baseAtom, value)
      );
      const doubleAtom = atom((get: Getter) => get(writableAtom) * 2);

      expect(store.get(doubleAtom)).toBe(10);

      store.set(writableAtom, 10);
      expect(store.get(doubleAtom)).toBe(20);
    });
  });
});
