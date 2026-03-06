/**
 * Tests for AtomRegistry: edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AtomRegistry } from '../../atom-registry';
import { createPrimitiveAtom, createMockAtom } from './fixtures/test-atoms';

describe('AtomRegistry: edge cases', () => {
  let registry: AtomRegistry;

  beforeEach(() => {
    registry = AtomRegistry.getInstance();
    registry.clear();
  });

  describe('Null and undefined values', () => {
    it('should register atom with null value', () => {
      const atom = createPrimitiveAtom(null, 'null-atom');
      registry.register(atom, 'null-atom');

      expect(registry.size()).toBe(1);
      expect(registry.get(atom.id)).toBe(atom);
    });

    it('should register atom with undefined value', () => {
      const atom = createPrimitiveAtom(undefined, 'undefined-atom');
      registry.register(atom, 'undefined-atom');

      expect(registry.size()).toBe(1);
      expect(registry.get(atom.id)).toBe(atom);
    });

    it('should generate fallback name when empty string is provided', () => {
      const atom = createPrimitiveAtom(42, 'test');
      registry.register(atom, '');

      expect(registry.size()).toBe(1);
      const metadata = registry.getMetadata(atom);
      // Empty name triggers fallback name generation
      expect(metadata?.name).toMatch(/^atom-\d+$/);
    });
  });

  describe('Special characters in names', () => {
    it('should handle names with spaces', () => {
      const atom = createPrimitiveAtom(42, 'my atom name');
      registry.register(atom, 'my atom name');

      const found = registry.getByName('my atom name');
      expect(found).toBe(atom);
    });

    it('should handle names with newlines', () => {
      const atom = createPrimitiveAtom(42, 'atom\nwith\nnewlines');
      registry.register(atom, 'atom\nwith\nnewlines');

      const found = registry.getByName('atom\nwith\nnewlines');
      expect(found).toBe(atom);
    });

    it('should handle names with tabs', () => {
      const atom = createPrimitiveAtom(42, 'atom\twith\ttabs');
      registry.register(atom, 'atom\twith\ttabs');

      const found = registry.getByName('atom\twith\ttabs');
      expect(found).toBe(atom);
    });

    it('should handle emoji in names', () => {
      const atom = createPrimitiveAtom(42, '🚀 atom 🎉');
      registry.register(atom, '🚀 atom 🎉');

      const found = registry.getByName('🚀 atom 🎉');
      expect(found).toBe(atom);
    });
  });

  describe('Duplicates and conflicts', () => {
    it('should handle multiple registrations with same ID', () => {
      const id = Symbol('duplicate');
      const atom1 = createMockAtom(id, 'primitive', 'first');
      const atom2 = createMockAtom(id, 'computed', 'second');
      const atom3 = createMockAtom(id, 'writable', 'third');

      registry.register(atom1, 'first');
      registry.register(atom2, 'second');
      registry.register(atom3, 'third');

      expect(registry.size()).toBe(1);
      expect(registry.get(id)).toBe(atom1);
      expect(registry.getByName('third')).toBe(atom1); // Name updates
    });

    it('should handle atoms with same names', () => {
      const atom1 = createPrimitiveAtom(1, 'same-name');
      const atom2 = createPrimitiveAtom(2, 'same-name');

      registry.register(atom1, 'same-name');
      registry.register(atom2, 'same-name');

      expect(registry.size()).toBe(2);

      // getByName returns first found
      const found = registry.getByName('same-name');
      expect(found).toBeDefined();
    });
  });

  describe('Symbol ID edge cases', () => {
    it('should handle Symbol without description', () => {
      const id = Symbol();
      const atom = createMockAtom(id, 'primitive');
      registry.register(atom);

      expect(registry.size()).toBe(1);
      expect(registry.get(id)).toBe(atom);
    });

    it('should handle Symbol.for() with global registry', () => {
      const id = Symbol.for('global-symbol');
      const atom = createMockAtom(id, 'primitive', 'global-atom');
      registry.register(atom, 'global-atom');

      expect(registry.size()).toBe(1);
      expect(registry.get(id)).toBe(atom);
    });

    it('should distinguish atoms with different Symbols with same description', () => {
      const id1 = Symbol('same');
      const id2 = Symbol('same');
      const atom1 = createMockAtom(id1, 'primitive', 'atom1');
      const atom2 = createMockAtom(id2, 'primitive', 'atom2');

      registry.register(atom1, 'atom1');
      registry.register(atom2, 'atom2');

      expect(registry.size()).toBe(2);
      expect(registry.get(id1)).toBe(atom1);
      expect(registry.get(id2)).toBe(atom2);
    });
  });

  describe('Performance and scale', () => {
    it('should register 1000 atoms without errors', () => {
      const atoms = Array.from({ length: 1000 }, (_, i) =>
        createPrimitiveAtom(i, `atom-${i}`)
      );

      atoms.forEach((atom, i) => registry.register(atom, `atom-${i}`));

      expect(registry.size()).toBe(1000);
    });

    it('should quickly find atoms by name with large quantity', () => {
      const targetIndex = 500;
      const atoms = Array.from({ length: 1000 }, (_, i) =>
        createPrimitiveAtom(i, `atom-${i}`)
      );

      atoms.forEach((atom, i) => registry.register(atom, `atom-${i}`));

      const start = performance.now();
      const found = registry.getByName(`atom-${targetIndex}`);
      const end = performance.now();

      expect(found).toBe(atoms[targetIndex]);
      expect(end - start).toBeLessThan(100); // Should be fast
    });
  });

  describe('clear() edge cases', () => {
    it('should safely call clear() on empty registry', () => {
      expect(() => registry.clear()).not.toThrow();
      expect(registry.size()).toBe(0);
    });

    it('should reset counter to 0', () => {
      // Create atoms to increment counter
      for (let i = 0; i < 10; i++) {
        registry.register(createPrimitiveAtom(i));
      }

      registry.clear();

      // After clear, counter should be 0
      const newAtom = createPrimitiveAtom(999);
      registry.register(newAtom);

      const metadata = registry.getMetadata(newAtom);
      expect(metadata?.name).toBe('atom-1'); // Counter restarts
    });

    it('should clear stores map on clear()', () => {
      const mockStore = { get: () => {}, set: () => {}, subscribe: () => () => {}, getState: () => ({}) };
      registry.attachStore(mockStore as any, 'global');

      registry.clear();

      expect(registry.getStoresMap().size).toBe(0);
    });
  });

  describe('getName() edge cases', () => {
    it('should handle atoms without metadata', () => {
      const atom = { id: Symbol('no-metadata') };
      // Don't register atom, just get name

      const name = registry.getName(atom);
      expect(name).toBeDefined();
    });

    it('should handle names starting with atom-', () => {
      const atom = createPrimitiveAtom(42);
      registry.register(atom);

      const metadata = registry.getMetadata(atom);
      if (metadata?.name.startsWith('atom-')) {
        const name = registry.getName(atom);
        expect(name.startsWith('atom-')).toBe(false);
      }
    });
  });

  describe('Concurrent access (SSR safety)', () => {
    it('should work correctly on sequential getInstance() calls', () => {
      const instance1 = AtomRegistry.getInstance();
      const instance2 = AtomRegistry.getInstance();
      const instance3 = AtomRegistry.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
    });
  });
});
