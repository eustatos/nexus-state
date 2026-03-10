/**
 * Atom Registry Tests
 * Tests for atom registry functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { atom, atomRegistry } from '../../index';

describe('Atom Registry', () => {
  beforeEach(() => {
    // Clean registry before each test for isolation
    atomRegistry.clear();
  });

  describe('Get Atom', () => {
    it('should get atom by ID', () => {
      const testAtom = atom(123, 'registry-test');
      const retrievedAtom = atomRegistry.get(testAtom.id);
      expect(retrievedAtom).toBe(testAtom);
    });

    it('should return undefined for non-existent atom', () => {
      const fakeId = Symbol('fake-id');
      const result = atomRegistry.get(fakeId);
      expect(result).toBeUndefined();
    });

    it('should get atom by ID after multiple registrations', () => {
      const atom1 = atom(1, 'first');
      const atom2 = atom(2, 'second');
      const atom3 = atom(3, 'third');

      expect(atomRegistry.get(atom1.id)).toBe(atom1);
      expect(atomRegistry.get(atom2.id)).toBe(atom2);
      expect(atomRegistry.get(atom3.id)).toBe(atom3);
    });
  });

  describe('Get Metadata', () => {
    it('should get atom metadata', () => {
      const testAtom = atom(456, 'metadata-test');
      const metadata = atomRegistry.getMetadata(testAtom);
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('metadata-test');
      expect(metadata?.type).toBe('primitive');
    });

    it('should return undefined for non-existent atom metadata', () => {
      const fakeAtom = atom(0, 'fake');
      const fakeId = Symbol('fake-id');
      const fakeAtomWithFakeId = { ...fakeAtom, id: fakeId };
      const metadata = atomRegistry.getMetadata(fakeAtomWithFakeId);
      expect(metadata).toBeUndefined();
    });

    it('should get metadata for computed atom', () => {
      const baseAtom = atom(10);
      const computedAtom = atom((get: any) => get(baseAtom) * 2, 'computed');
      const metadata = atomRegistry.getMetadata(computedAtom);
      expect(metadata?.type).toBe('computed');
      expect(metadata?.name).toBe('computed');
    });
  });

  describe('Get Name', () => {
    it('should get atom name', () => {
      const testAtom = atom(789, 'name-test');
      const name = atomRegistry.getName(testAtom);
      expect(name).toBe('name-test');
    });

    it('should return fallback name if no name provided', () => {
      const testAtom = atom('no-name');
      const name = atomRegistry.getName(testAtom);
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
    });

    it('should return different fallback names for different atoms', () => {
      const atom1 = atom('first');
      const atom2 = atom('second');
      const name1 = atomRegistry.getName(atom1);
      const name2 = atomRegistry.getName(atom2);
      expect(name1).not.toBe(name2);
    });
  });

  describe('Get All Atoms', () => {
    it('should get all atoms', () => {
      const atom1 = atom(1);
      const atom2 = atom(2);
      const atom3 = atom(3);

      const allAtoms = atomRegistry.getAll();
      expect(allAtoms.size).toBeGreaterThanOrEqual(3);
      expect(allAtoms.has(atom1.id)).toBe(true);
      expect(allAtoms.has(atom2.id)).toBe(true);
      expect(allAtoms.has(atom3.id)).toBe(true);
    });

    it('should return empty map when no atoms registered', () => {
      atomRegistry.clear();
      const allAtoms = atomRegistry.getAll();
      expect(allAtoms.size).toBe(0);
    });

    it('should include all atom types in getAll', () => {
      const primitiveAtom = atom(42);
      const computedAtom = atom((get: any) => get(primitiveAtom) * 2);
      const writableAtom = atom(
        (get: any) => get(primitiveAtom),
        (get: any, set: any, value: number) => set(primitiveAtom, value)
      );

      const allAtoms = atomRegistry.getAll();
      expect(allAtoms.has(primitiveAtom.id)).toBe(true);
      expect(allAtoms.has(computedAtom.id)).toBe(true);
      expect(allAtoms.has(writableAtom.id)).toBe(true);
    });
  });

  describe('Registry Size', () => {
    it('should get registry size', () => {
      const initialSize = atomRegistry.size();
      const testAtom = atom('size-test');
      expect(atomRegistry.size()).toBe(initialSize + 1);
    });

    it('should return 0 for empty registry', () => {
      atomRegistry.clear();
      expect(atomRegistry.size()).toBe(0);
    });

    it('should increase size with each new atom', () => {
      atomRegistry.clear();
      const sizes: number[] = [];
      for (let i = 0; i < 5; i++) {
        atom(i);
        sizes.push(atomRegistry.size());
      }
      expect(sizes).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('Registration', () => {
    it('should handle duplicate atom registration', () => {
      const testAtom = atom('duplicate-test', 'dup-atom');
      const initialMetadata = atomRegistry.getMetadata(testAtom);

      // Try to register the same atom again with different name
      atomRegistry.register(testAtom, 'dup-atom-updated');

      const updatedMetadata = atomRegistry.getMetadata(testAtom);
      expect(updatedMetadata?.name).toBe('dup-atom-updated');
    });

    it('should update existing registration', () => {
      const testAtom = atom('test', 'original-name');
      atomRegistry.register(testAtom, 'new-name');
      const metadata = atomRegistry.getMetadata(testAtom);
      expect(metadata?.name).toBe('new-name');
    });

    it('should register atom without name', () => {
      const testAtom = atom('no-name');
      atomRegistry.register(testAtom);
      const metadata = atomRegistry.getMetadata(testAtom);
      expect(metadata).toBeDefined();
    });
  });

  describe('Clear Registry', () => {
    it('should clear registry', () => {
      const testAtom = atom('clear-test');
      atomRegistry.clear();
      expect(atomRegistry.size()).toBe(0);
    });

    it('should allow new registrations after clear', () => {
      atomRegistry.clear();
      const testAtom = atom('after-clear');
      expect(atomRegistry.size()).toBe(1);
      expect(atomRegistry.get(testAtom.id)).toBe(testAtom);
    });

    it('should remove all atoms from getAll after clear', () => {
      atom(1);
      atom(2);
      atom(3);
      atomRegistry.clear();
      const allAtoms = atomRegistry.getAll();
      expect(allAtoms.size).toBe(0);
    });
  });

  describe('Registry Isolation', () => {
    it('should maintain separate entries for different atoms', () => {
      const atom1 = atom(1, 'atom-1');
      const atom2 = atom(2, 'atom-2');

      const metadata1 = atomRegistry.getMetadata(atom1);
      const metadata2 = atomRegistry.getMetadata(atom2);

      expect(metadata1?.name).toBe('atom-1');
      expect(metadata2?.name).toBe('atom-2');
    });

    it('should not mix up atoms with same value', () => {
      const atom1 = atom(42, 'first-42');
      const atom2 = atom(42, 'second-42');

      expect(atomRegistry.getName(atom1)).toBe('first-42');
      expect(atomRegistry.getName(atom2)).toBe('second-42');
    });
  });
});
