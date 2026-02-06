// tests/unit/atom-registry.test.ts
/**
 * Unit tests for AtomRegistry
 */

import { atomRegistry, AtomRegistry } from '../../packages/core/atom-registry';
import { atom } from '../../packages/core/atom';
import {
  primitiveAtom,
  stringAtom,
  booleanAtom,
  computedAtom,
  writableAtom,
  unnamedAtom1,
  unnamedAtom2,
  testAtoms
} from '../fixtures/test-atoms';

describe('AtomRegistry', () => {
  beforeEach(() => {
    // Clear registry before each test
    atomRegistry.clear();
  });

  afterEach(() => {
    // Clear registry after each test
    atomRegistry.clear();
  });

  describe('Singleton', () => {
    it('should return the same instance', () => {
      const instance1 = AtomRegistry.getInstance();
      const instance2 = AtomRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Registration', () => {
    it('should register atoms automatically when created', () => {
      const testAtom = atom(42);
      expect(atomRegistry.get(testAtom.id)).toBe(testAtom);
    });

    it('should register atoms with names', () => {
      const testAtom = atom(42, 'test-atom');
      const metadata = atomRegistry.getMetadata(testAtom);
      expect(metadata?.name).toBe('test-atom');
    });

    it('should generate fallback names for unnamed atoms', () => {
      const atom1 = atom(42);
      const atom2 = atom('hello');
      
      const metadata1 = atomRegistry.getMetadata(atom1);
      const metadata2 = atomRegistry.getMetadata(atom2);
      
      expect(metadata1?.name).toBe('atom-1');
      expect(metadata2?.name).toBe('atom-2');
    });

    it('should handle duplicate registrations gracefully', () => {
      const testAtom = atom(42, 'test-atom');
      const initialSize = atomRegistry.size();
      
      // Register the same atom again with a different name
      atomRegistry.register(testAtom, 'new-name');
      
      // Size should not change
      expect(atomRegistry.size()).toBe(initialSize);
      
      // Name should remain the same (first registration takes precedence)
      const metadata = atomRegistry.getMetadata(testAtom);
      expect(metadata?.name).toBe('test-atom');
    });
  });

  describe('Lookup', () => {
    it('should retrieve atoms by ID', () => {
      // Register fixture atoms
      testAtoms.forEach(atom => atomRegistry.register(atom));
      
      const retrievedAtom = atomRegistry.get(primitiveAtom.id);
      expect(retrievedAtom).toBe(primitiveAtom);
    });

    it('should return undefined for non-existent atoms', () => {
      const nonExistentAtom = atomRegistry.get(Symbol('non-existent'));
      expect(nonExistentAtom).toBeUndefined();
    });

    it('should get all registered atoms', () => {
      // Register fixture atoms
      testAtoms.forEach(atom => atomRegistry.register(atom));
      
      const allAtoms = atomRegistry.getAll();
      expect(allAtoms.size).toBe(testAtoms.length);
      
      testAtoms.forEach(testAtom => {
        expect(allAtoms.get(testAtom.id)).toBe(testAtom);
      });
    });
  });

  describe('Metadata', () => {
    beforeEach(() => {
      // Register fixture atoms
      testAtoms.forEach(atom => atomRegistry.register(atom));
    });

    it('should store creation timestamp', () => {
      const metadata = atomRegistry.getMetadata(primitiveAtom);
      expect(metadata?.createdAt).toBeDefined();
    });

    it('should identify primitive atoms', () => {
      const metadata = atomRegistry.getMetadata(primitiveAtom);
      expect(metadata?.type).toBe('primitive');
    });

    it('should identify computed atoms', () => {
      const metadata = atomRegistry.getMetadata(computedAtom);
      expect(metadata?.type).toBe('computed');
    });

    it('should identify writable atoms', () => {
      const metadata = atomRegistry.getMetadata(writableAtom);
      expect(metadata?.type).toBe('writable');
    });

    it('should get display names', () => {
      const name = atomRegistry.getName(primitiveAtom);
      expect(name).toBe('primitive-atom');
    });

    it('should generate display names for unnamed atoms', () => {
      // Clear registry to reset counter
      atomRegistry.clear();
      
      const unnamedAtom = atom(42);
      const name = atomRegistry.getName(unnamedAtom);
      expect(name).toBe('atom-1');
    });
  });

  describe('Clear', () => {
    it('should clear all registered atoms', () => {
      // Register fixture atoms
      testAtoms.forEach(atom => atomRegistry.register(atom));
      
      expect(atomRegistry.size()).toBe(testAtoms.length);
      
      atomRegistry.clear();
      expect(atomRegistry.size()).toBe(0);
    });
  });
});