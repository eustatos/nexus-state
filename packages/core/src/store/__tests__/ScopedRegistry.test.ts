/**
 * ScopedRegistry Tests
 *
 * Tests for the unified per-store atom registry that replaces
 * the previous triple-registry architecture.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScopedRegistry } from '../ScopedRegistry';
import type { Atom, Store } from '../../types';
import type { AtomState } from '../types';

/**
 * Helper: create a primitive atom for testing without importing atom()
 */
function createPrimitiveAtom<Value>(
  initialValue: Value,
  name?: string
): Atom<Value> {
  return {
    id: Symbol('test-atom'),
    type: 'primitive',
    name: name,
    read: () => initialValue,
    _lazyRegistration: {
      registered: false,
      accessCount: 0,
    },
  };
}

/**
 * Helper: create a computed atom for testing
 */
function createComputedAtom<Value>(
  read: (get: (a: Atom<any>) => any) => Value,
  name?: string
): Atom<Value> {
  return {
    id: Symbol('test-computed'),
    type: 'computed',
    name: name,
    read: read,
    _lazyRegistration: {
      registered: false,
      accessCount: 0,
    },
  };
}

/**
 * Helper: create a writable atom for testing
 */
function createWritableAtom<Value>(
  read: (get: (a: Atom<any>) => any) => Value,
  name?: string
): Atom<Value> {
  return {
    id: Symbol('test-writable'),
    type: 'writable',
    name: name,
    read: read,
    write: () => {},
    _lazyRegistration: {
      registered: false,
      accessCount: 0,
    },
  };
}

/**
 * Helper: create a minimal mock store
 */
function createMockStore(): Store {
  return {
    get: () => { throw new Error('not implemented'); },
    set: () => { throw new Error('not implemented'); },
    subscribe: () => () => {},
    getState: () => ({}),
  };
}

/**
 * Helper: create a basic state factory
 */
function createState<Value>(value: Value): () => AtomState<Value> {
  return () => ({
    value: value,
    subscribers: new Set(),
    dependents: new Set(),
  });
}

describe('ScopedRegistry', () => {
  let registry: ScopedRegistry;
  let mockStore: Store;

  beforeEach(() => {
    mockStore = createMockStore();
    registry = new ScopedRegistry(mockStore);
  });

  describe('ensure()', () => {
    it('should register new atom and return entry with atom, state, and metadata', () => {
      const atom = createPrimitiveAtom(42, 'count');
      const entry = registry.ensure(atom, createState(42));

      expect(entry).toBeDefined();
      expect(entry.atom).toBe(atom);
      expect(entry.state.value).toBe(42);
      expect(entry.metadata.name).toBe('count');
      expect(entry.metadata.type).toBe('primitive');
    });

    it('should return existing entry on duplicate call (no-op)', () => {
      const atom = createPrimitiveAtom(10, 'test');
      const entry1 = registry.ensure(atom, createState(10));
      const entry2 = registry.ensure(atom, createState(999));

      expect(entry2).toBe(entry1);
      expect(entry2.state.value).toBe(10); // Original value, not 999
    });

    it('should auto-generate name if atom.name is undefined', () => {
      const atom1 = createPrimitiveAtom('no-name');
      const atom2 = createPrimitiveAtom('also-no-name');

      const entry1 = registry.ensure(atom1, createState('no-name'));
      const entry2 = registry.ensure(atom2, createState('also-no-name'));

      expect(entry1.metadata.name).toMatch(/^atom-\d+$/);
      expect(entry2.metadata.name).toMatch(/^atom-\d+$/);
      expect(entry1.metadata.name).not.toBe(entry2.metadata.name);
    });

    it('should increment accessCount on duplicate ensure calls', () => {
      const atom = createPrimitiveAtom(0, 'counter');
      registry.ensure(atom, createState(0));

      expect(atom._lazyRegistration?.accessCount).toBe(1);

      registry.ensure(atom, createState(0));
      expect(atom._lazyRegistration?.accessCount).toBe(2);

      registry.ensure(atom, createState(0));
      expect(atom._lazyRegistration?.accessCount).toBe(3);
    });

    it('should mark lazy registration as complete', () => {
      const atom = createPrimitiveAtom(0, 'lazy');
      expect(atom._lazyRegistration?.registered).toBe(false);

      registry.ensure(atom, createState(0));

      expect(atom._lazyRegistration?.registered).toBe(true);
      expect(atom._lazyRegistration?.registeredAt).toBeDefined();
    });
  });

  describe('get()', () => {
    it('should return entry by symbol id', () => {
      const atom = createPrimitiveAtom('test', 'by-id');
      registry.ensure(atom, createState('test'));

      const entry = registry.get(atom.id);
      expect(entry).toBeDefined();
      expect(entry?.atom).toBe(atom);
    });

    it('should return undefined for unknown id', () => {
      const fakeId = Symbol('fake-id');
      const result = registry.get(fakeId);
      expect(result).toBeUndefined();
    });
  });

  describe('getByName()', () => {
    it('should return entry by name', () => {
      const atom = createPrimitiveAtom('named', 'my-atom');
      registry.ensure(atom, createState('named'));

      const entry = registry.getByName('my-atom');
      expect(entry).toBeDefined();
      expect(entry?.atom).toBe(atom);
    });

    it('should return undefined for unknown name', () => {
      const result = registry.getByName('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('has()', () => {
    it('should return true for registered atom', () => {
      const atom = createPrimitiveAtom(1, 'has-test');
      registry.ensure(atom, createState(1));

      expect(registry.has(atom.id)).toBe(true);
    });

    it('should return false for unregistered atom', () => {
      const atom = createPrimitiveAtom(1, 'has-test-2');
      expect(registry.has(atom.id)).toBe(false);
    });
  });

  describe('getAll() / getAllIds()', () => {
    it('should return all entries', () => {
      const atom1 = createPrimitiveAtom(1, 'one');
      const atom2 = createPrimitiveAtom(2, 'two');
      const atom3 = createPrimitiveAtom(3, 'three');

      registry.ensure(atom1, createState(1));
      registry.ensure(atom2, createState(2));
      registry.ensure(atom3, createState(3));

      const all = registry.getAll();
      expect(all.size).toBe(3);
      expect(all.has(atom1.id)).toBe(true);
      expect(all.has(atom2.id)).toBe(true);
      expect(all.has(atom3.id)).toBe(true);
    });

    it('should return all atom IDs', () => {
      const atom1 = createPrimitiveAtom(1, 'id-1');
      const atom2 = createPrimitiveAtom(2, 'id-2');

      registry.ensure(atom1, createState(1));
      registry.ensure(atom2, createState(2));

      const ids = registry.getAllIds();
      expect(ids).toHaveLength(2);
      expect(ids).toContain(atom1.id);
      expect(ids).toContain(atom2.id);
    });
  });

  describe('getStateAsRecord()', () => {
    it('should return { name: value, ... }', () => {
      const atom1 = createPrimitiveAtom('a', 'alpha');
      const atom2 = createPrimitiveAtom(42, 'beta');

      registry.ensure(atom1, createState('a'));
      registry.ensure(atom2, createState(42));

      const record = registry.getStateAsRecord();
      expect(record).toEqual({
        alpha: 'a',
        beta: 42,
      });
    });

    it('should return empty object when no atoms registered', () => {
      const record = registry.getStateAsRecord();
      expect(record).toEqual({});
    });
  });

  describe('getStateAsMap()', () => {
    it('should return Map of name to value', () => {
      const atom1 = createPrimitiveAtom('x', 'first');
      const atom2 = createPrimitiveAtom(100, 'second');

      registry.ensure(atom1, createState('x'));
      registry.ensure(atom2, createState(100));

      const map = registry.getStateAsMap();
      expect(map.get('first')).toBe('x');
      expect(map.get('second')).toBe(100);
      expect(map.size).toBe(2);
    });
  });

  describe('getName()', () => {
    it('should return atom name', () => {
      const atom = createPrimitiveAtom(0, 'name-test');
      registry.ensure(atom, createState(0));

      const name = registry.getName(atom);
      expect(name).toBe('name-test');
    });

    it('should strip "atom-" prefix from auto-generated names', () => {
      const atom = createPrimitiveAtom(0);
      registry.ensure(atom, createState(0));

      const name = registry.getName(atom);
      expect(name).not.toMatch(/^atom-/);
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });

    it('should return different names for different atoms', () => {
      const atom1 = createPrimitiveAtom(1);
      const atom2 = createPrimitiveAtom(2);

      registry.ensure(atom1, createState(1));
      registry.ensure(atom2, createState(2));

      const name1 = registry.getName(atom1);
      const name2 = registry.getName(atom2);
      expect(name1).not.toBe(name2);
    });
  });

  describe('clear()', () => {
    it('should reset everything', () => {
      const atom1 = createPrimitiveAtom(1, 'clear-1');
      const atom2 = createPrimitiveAtom(2, 'clear-2');

      registry.ensure(atom1, createState(1));
      registry.ensure(atom2, createState(2));
      expect(registry.size()).toBe(2);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.getAll().size).toBe(0);
      expect(registry.get(atom1.id)).toBeUndefined();
      expect(registry.getByName('clear-1')).toBeUndefined();
      expect(registry.has(atom1.id)).toBe(false);
    });

    it('should allow re-registration after clear', () => {
      const atom = createPrimitiveAtom(1, 're-register');
      registry.ensure(atom, createState(1));
      registry.clear();

      const entry = registry.ensure(atom, createState(99));
      expect(entry.metadata.name).toBe('re-register');
      expect(entry.state.value).toBe(99);
      expect(registry.size()).toBe(1);
    });
  });

  describe('size()', () => {
    it('should return count of registered atoms', () => {
      expect(registry.size()).toBe(0);

      registry.ensure(createPrimitiveAtom(1, 'a'), createState(1));
      expect(registry.size()).toBe(1);

      registry.ensure(createPrimitiveAtom(2, 'b'), createState(2));
      expect(registry.size()).toBe(2);
    });

    it('should return 0 for empty registry', () => {
      expect(registry.size()).toBe(0);
    });
  });

  describe('Metadata — type inference', () => {
    it('should detect primitive atom type', () => {
      const atom = createPrimitiveAtom('test', 'prim');
      const entry = registry.ensure(atom, createState('test'));
      expect(entry.metadata.type).toBe('primitive');
    });

    it('should detect computed atom type', () => {
      const atom = createComputedAtom((get) => get({} as any) * 2, 'computed');
      const entry = registry.ensure(atom, createState(0));
      expect(entry.metadata.type).toBe('computed');
    });

    it('should detect writable atom type', () => {
      const atom = createWritableAtom((get) => get({} as any), 'writable');
      const entry = registry.ensure(atom, createState(0));
      expect(entry.metadata.type).toBe('writable');
    });

    it('should infer type from read/write properties if type field missing', () => {
      // Atom without explicit type field
      const atomWithoutType: Atom<number> = {
        id: Symbol('no-type'),
        type: undefined as never,
        name: 'inferred',
        read: () => 42,
        write: () => {},
        _lazyRegistration: { registered: false, accessCount: 0 },
      } as Atom<number>;

      const entry = registry.ensure(atomWithoutType, createState(42));
      expect(entry.metadata.type).toBe('writable');
    });
  });

  describe('Metadata — createdAt', () => {
    it('should be recent timestamp', () => {
      const atom = createPrimitiveAtom(0, 'time-test');
      const before = Date.now();
      const entry = registry.ensure(atom, createState(0));
      const after = Date.now();

      expect(entry.metadata.createdAt).toBeGreaterThanOrEqual(before);
      expect(entry.metadata.createdAt).toBeLessThanOrEqual(after);
    });
  });

  describe('Concurrent — multiple registries are independent', () => {
    it('should maintain separate entries for different registries', () => {
      const store1 = createMockStore();
      const store2 = createMockStore();
      const reg1 = new ScopedRegistry(store1);
      const reg2 = new ScopedRegistry(store2);

      const atom = createPrimitiveAtom(42, 'shared-name');

      reg1.ensure(atom, createState(100));
      reg2.ensure(atom, createState(200));

      expect(reg1.get(atom.id)?.state.value).toBe(100);
      expect(reg2.get(atom.id)?.state.value).toBe(200);
      expect(reg1.size()).toBe(1);
      expect(reg2.size()).toBe(1);
    });

    it('should not share name mappings between registries', () => {
      const store1 = createMockStore();
      const store2 = createMockStore();
      const reg1 = new ScopedRegistry(store1);
      const reg2 = new ScopedRegistry(store2);

      const atom1 = createPrimitiveAtom('a', 'name');
      const atom2 = createPrimitiveAtom('b', 'name');

      reg1.ensure(atom1, createState('a'));
      reg2.ensure(atom2, createState('b'));

      expect(reg1.getByName('name')?.state.value).toBe('a');
      expect(reg2.getByName('name')?.state.value).toBe('b');
    });

    it('should clear independently', () => {
      const store1 = createMockStore();
      const store2 = createMockStore();
      const reg1 = new ScopedRegistry(store1);
      const reg2 = new ScopedRegistry(store2);

      reg1.ensure(createPrimitiveAtom(1, 'a'), createState(1));
      reg2.ensure(createPrimitiveAtom(2, 'b'), createState(2));

      reg1.clear();

      expect(reg1.size()).toBe(0);
      expect(reg2.size()).toBe(1);
    });
  });

  describe('Duplicate name warning', () => {
    it('should warn when two different atoms have the same name', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

      const atom1 = createPrimitiveAtom('v1', 'dup');
      const atom2 = createPrimitiveAtom('v2', 'dup');

      registry.ensure(atom1, createState('v1'));
      registry.ensure(atom2, createState('v2'));

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Atom with name "dup" already exists')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should keep first registration for duplicate names', () => {
      vi.spyOn(console, 'warn').mockImplementation();

      const atom1 = createPrimitiveAtom('first', 'dup-name');
      const atom2 = createPrimitiveAtom('second', 'dup-name');

      registry.ensure(atom1, createState('first'));
      registry.ensure(atom2, createState('second'));

      const found = registry.getByName('dup-name');
      expect(found?.atom).toBe(atom1);
      expect(found?.state.value).toBe('first');

      vi.restoreAllMocks();
    });
  });
});
