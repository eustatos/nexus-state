/**
 * Tests for AtomRegistry: atom lookup (get, getAtom, getByName, getName)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AtomRegistry } from '../../atom-registry';
import { createPrimitiveAtom, createComputedAtom, createWritableAtom } from './fixtures/test-atoms';

describe('AtomRegistry: atom lookup', () => {
  let registry: AtomRegistry;

  beforeEach(() => {
    registry = AtomRegistry.getInstance();
    registry.clear();
  });

  describe('get()', () => {
    it('should return atom by symbol ID', () => {
      const atom = createPrimitiveAtom(42, 'count');
      registry.register(atom, 'count');

      const result = registry.get(atom.id);
      expect(result).toBe(atom);
    });

    it('should return undefined for non-existent ID', () => {
      const result = registry.get(Symbol('nonexistent'));
      expect(result).toBeUndefined();
    });

    it('should return atom after multiple registrations', () => {
      const atom1 = createPrimitiveAtom(1, 'atom1');
      const atom2 = createComputedAtom(() => 2, 'atom2');
      const atom3 = createWritableAtom(
        3,
        (get) => get({} as any),
        (get, set, val) => set({} as any, val),
        'atom3'
      );

      registry.register(atom1, 'atom1');
      registry.register(atom2, 'atom2');
      registry.register(atom3, 'atom3');

      expect(registry.get(atom1.id)).toBe(atom1);
      expect(registry.get(atom2.id)).toBe(atom2);
      expect(registry.get(atom3.id)).toBe(atom3);
    });
  });

  describe('getAtom()', () => {
    it('should be an alias for get()', () => {
      const atom = createPrimitiveAtom(42, 'count');
      registry.register(atom, 'count');

      expect(registry.getAtom(atom.id)).toBe(registry.get(atom.id));
    });

    it('should return undefined for non-existent ID', () => {
      const result = registry.getAtom(Symbol('nonexistent'));
      expect(result).toBeUndefined();
    });
  });

  describe('getByName()', () => {
    it('should find atom by name', () => {
      const atom = createPrimitiveAtom(42, 'my-atom');
      registry.register(atom, 'my-atom');

      const result = registry.getByName('my-atom');
      expect(result).toBe(atom);
    });

    it('should return undefined for non-existent name', () => {
      const result = registry.getByName('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should find atom among multiple registered', () => {
      const atom1 = createPrimitiveAtom(1, 'first');
      const atom2 = createPrimitiveAtom(2, 'second');
      const atom3 = createPrimitiveAtom(3, 'third');

      registry.register(atom1, 'first');
      registry.register(atom2, 'second');
      registry.register(atom3, 'third');

      expect(registry.getByName('second')).toBe(atom2);
    });

    it('should return first found atom with duplicate name', () => {
      const atom1 = createPrimitiveAtom(1, 'duplicate');
      const atom2 = createPrimitiveAtom(2, 'duplicate');

      registry.register(atom1, 'duplicate');
      registry.register(atom2, 'duplicate');

      const result = registry.getByName('duplicate');
      expect(result).toBeDefined();
      expect(result).toBeOneOf([atom1, atom2]);
    });

    it('should find atoms with auto-generated names', () => {
      const atom = createPrimitiveAtom(42);
      registry.register(atom);

      const metadata = registry.getMetadata(atom);
      const result = registry.getByName(metadata!.name);

      expect(result).toBe(atom);
    });
  });

  describe('getName()', () => {
    it('should return atom name without atom- prefix', () => {
      const atom = createPrimitiveAtom(42, 'my-atom');
      registry.register(atom, 'my-atom');

      const name = registry.getName(atom);
      expect(name).toBe('my-atom');
    });

    it('should remove atom- prefix from auto-generated names', () => {
      const atom = createPrimitiveAtom(42);
      registry.register(atom);

      const name = registry.getName(atom);
      expect(name.startsWith('atom-')).toBe(false);
    });

    it('should return ID string without prefix for atoms without name', () => {
      const atom = { id: Symbol('test-atom') };
      registry.register(atom);

      const name = registry.getName(atom);
      // Symbol.toString() returns "Symbol(description)"
      expect(name.startsWith('atom-')).toBe(false);
    });

    it('should return name for computed atom', () => {
      const atom = createComputedAtom(() => 84, 'computed-atom');
      registry.register(atom, 'computed-atom');

      const name = registry.getName(atom);
      expect(name).toBe('computed-atom');
    });

    it('should return name for writable atom', () => {
      const atom = createWritableAtom(
        0,
        (get) => get({} as any),
        (get, set, val) => set({} as any, val),
        'writable-atom'
      );
      registry.register(atom, 'writable-atom');

      const name = registry.getName(atom);
      expect(name).toBe('writable-atom');
    });
  });

  describe('getAll()', () => {
    it('should return a copy of all registered atoms', () => {
      const atom1 = createPrimitiveAtom(1, 'atom1');
      const atom2 = createPrimitiveAtom(2, 'atom2');

      registry.register(atom1, 'atom1');
      registry.register(atom2, 'atom2');

      const all = registry.getAll();

      expect(all.size).toBe(2);
      expect(all.get(atom1.id)).toBe(atom1);
      expect(all.get(atom2.id)).toBe(atom2);
    });

    it('should return a new Map (not reference to internal)', () => {
      const atom = createPrimitiveAtom(1, 'atom');
      registry.register(atom, 'atom');

      const all1 = registry.getAll();
      const all2 = registry.getAll();

      expect(all1).not.toBe(all2);
      expect(all1).toEqual(all2);
    });

    it('should return empty Map for empty registry', () => {
      const all = registry.getAll();
      expect(all.size).toBe(0);
    });
  });

  describe('getAllAtomIds()', () => {
    it('should return array of all atom IDs', () => {
      const atom1 = createPrimitiveAtom(1, 'atom1');
      const atom2 = createPrimitiveAtom(2, 'atom2');
      const atom3 = createPrimitiveAtom(3, 'atom3');

      registry.register(atom1, 'atom1');
      registry.register(atom2, 'atom2');
      registry.register(atom3, 'atom3');

      const ids = registry.getAllAtomIds();

      expect(ids.length).toBe(3);
      expect(ids).toContain(atom1.id.toString());
      expect(ids).toContain(atom2.id.toString());
      expect(ids).toContain(atom3.id.toString());
    });

    it('should return empty array for empty registry', () => {
      const ids = registry.getAllAtomIds();
      expect(ids).toEqual([]);
    });
  });

  describe('getAllAtoms()', () => {
    it('should return Map of all atoms with string IDs', () => {
      const atom1 = createPrimitiveAtom(1, 'atom1');
      const atom2 = createPrimitiveAtom(2, 'atom2');

      registry.register(atom1, 'atom1');
      registry.register(atom2, 'atom2');

      const all = registry.getAllAtoms();

      expect(all.size).toBe(2);
      expect(all.get(atom1.id.toString())).toBe(atom1);
      expect(all.get(atom2.id.toString())).toBe(atom2);
    });

    it('should return empty Map for empty registry', () => {
      const all = registry.getAllAtoms();
      expect(all.size).toBe(0);
    });
  });
});
