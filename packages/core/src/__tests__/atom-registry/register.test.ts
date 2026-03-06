/**
 * Tests for AtomRegistry.register()
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AtomRegistry } from '../../atom-registry';
import {
  createPrimitiveAtom,
  createComputedAtom,
  createWritableAtom,
  createMockAtom,
} from './fixtures/test-atoms';

describe('AtomRegistry.register()', () => {
  let registry: AtomRegistry;

  beforeEach(() => {
    registry = AtomRegistry.getInstance();
    registry.clear();
  });

  describe('Primitive atom registration', () => {
    it('should register primitive atom with name', () => {
      const atom = createPrimitiveAtom(42, 'count');
      registry.register(atom, 'count');

      expect(registry.size()).toBe(1);
      expect(registry.get(atom.id)).toBe(atom);
    });

    it('should register primitive atom without name (auto-generated)', () => {
      const atom = createPrimitiveAtom(42);
      registry.register(atom);

      expect(registry.size()).toBe(1);
      const metadata = registry.getMetadata(atom);
      expect(metadata?.name).toMatch(/^atom-\d+$/);
    });

    it('should determine type as primitive', () => {
      const atom = createPrimitiveAtom(42, 'count');
      registry.register(atom, 'count');

      const metadata = registry.getMetadata(atom);
      expect(metadata?.type).toBe('primitive');
    });
  });

  describe('Computed atom registration', () => {
    it('should register computed atom with name', () => {
      const atom = createComputedAtom(() => 84, 'double');
      registry.register(atom, 'double');

      expect(registry.size()).toBe(1);
      expect(registry.get(atom.id)).toBe(atom);
    });

    it('should determine type as computed', () => {
      const atom = createComputedAtom(() => 84, 'double');
      registry.register(atom, 'double');

      const metadata = registry.getMetadata(atom);
      expect(metadata?.type).toBe('computed');
    });
  });

  describe('Writable atom registration', () => {
    it('should register writable atom with name', () => {
      const atom = createWritableAtom(
        0,
        (get) => get({} as any),
        (get, set, val) => set({} as any, val),
        'counter'
      );
      registry.register(atom, 'counter');

      expect(registry.size()).toBe(1);
      expect(registry.get(atom.id)).toBe(atom);
    });

    it('should determine type as writable', () => {
      const atom = createWritableAtom(
        0,
        (get) => get({} as any),
        (get, set, val) => set({} as any, val),
        'counter'
      );
      registry.register(atom, 'counter');

      const metadata = registry.getMetadata(atom);
      expect(metadata?.type).toBe('writable');
    });
  });

  describe('Atom type determination', () => {
    it('should use explicit type from atom', () => {
      const atom = createMockAtom(Symbol('test'), 'computed', 'test');
      registry.register(atom, 'test');

      const metadata = registry.getMetadata(atom);
      expect(metadata?.type).toBe('computed');
    });

    it('should determine type as writable when read and write present', () => {
      const atom = {
        id: Symbol('test'),
        read: () => ({}),
        write: () => {},
      };
      registry.register(atom);

      const metadata = registry.getMetadata(atom);
      expect(metadata?.type).toBe('writable');
    });

    it('should determine type as computed when only read present', () => {
      const atom = {
        id: Symbol('test'),
        read: () => ({}),
      };
      registry.register(atom);

      const metadata = registry.getMetadata(atom);
      expect(metadata?.type).toBe('computed');
    });

    it('should determine type as primitive when no read/write', () => {
      const atom = {
        id: Symbol('test'),
      };
      registry.register(atom);

      const metadata = registry.getMetadata(atom);
      expect(metadata?.type).toBe('primitive');
    });
  });

  describe('Name generation', () => {
    it('should use provided name', () => {
      const atom = createPrimitiveAtom(42, 'my-atom');
      registry.register(atom, 'my-atom');

      const metadata = registry.getMetadata(atom);
      expect(metadata?.name).toBe('my-atom');
    });

    it('should generate name when not provided', () => {
      const atom = createPrimitiveAtom(42);
      registry.register(atom);

      const metadata = registry.getMetadata(atom);
      expect(metadata?.name).toMatch(/^atom-\d+$/);
    });

    it('should increment counter for auto-generated names', () => {
      const atom1 = createPrimitiveAtom(1);
      const atom2 = createPrimitiveAtom(2);
      const atom3 = createPrimitiveAtom(3);

      registry.register(atom1);
      registry.register(atom2);
      registry.register(atom3);

      const meta1 = registry.getMetadata(atom1);
      const meta2 = registry.getMetadata(atom2);
      const meta3 = registry.getMetadata(atom3);

      expect(meta1?.name).toMatch(/^atom-(\d+)$/);
      expect(meta2?.name).toMatch(/^atom-(\d+)$/);
      expect(meta3?.name).toMatch(/^atom-(\d+)$/);
    });
  });

  describe('Duplicate registration', () => {
    it('should ignore duplicate registration with same ID', () => {
      const id = Symbol('duplicate');
      const atom1 = createMockAtom(id, 'primitive', 'first');
      const atom2 = createMockAtom(id, 'computed', 'second');

      registry.register(atom1, 'first');
      registry.register(atom2, 'second');

      expect(registry.size()).toBe(1);
      expect(registry.get(id)).toBe(atom1);
    });

    it('should update metadata on duplicate registration with name', () => {
      const id = Symbol('duplicate');
      const atom = createMockAtom(id, 'primitive', 'first');

      registry.register(atom, 'first');
      registry.register(atom, 'updated');

      const metadata = registry.getMetadata(atom);
      expect(metadata?.name).toBe('updated');
    });
  });

  describe('Edge cases', () => {
    it('should generate fallback name when empty string is provided', () => {
      const atom = createPrimitiveAtom(42, 'test');
      registry.register(atom, '');

      expect(registry.size()).toBe(1);
      const metadata = registry.getMetadata(atom);
      // Empty name triggers fallback name generation
      expect(metadata?.name).toMatch(/^atom-\d+$/);
    });

    it('should register atom with special characters in name', () => {
      const atom = createPrimitiveAtom(42, 'atom@#$%');
      registry.register(atom, 'atom@#$%');

      expect(registry.size()).toBe(1);
      const metadata = registry.getMetadata(atom);
      expect(metadata?.name).toBe('atom@#$%');
    });

    it('should register atom with unicode names', () => {
      const atom = createPrimitiveAtom(42, 'атом-测试🚀');
      registry.register(atom, 'атом-测试🚀');

      expect(registry.size()).toBe(1);
      const metadata = registry.getMetadata(atom);
      expect(metadata?.name).toBe('атом-测试🚀');
    });

    it('should handle atoms without type property', () => {
      const atom = { id: Symbol('unknown') };
      registry.register(atom);

      expect(registry.size()).toBe(1);
      const metadata = registry.getMetadata(atom);
      expect(metadata).toBeDefined();
    });
  });
});
