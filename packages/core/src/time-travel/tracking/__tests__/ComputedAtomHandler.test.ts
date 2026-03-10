/**
 * Integration tests for ComputedAtomHandler
 *
 * Tests the interaction between ComputedAtomHandler
 * and its component dependencies.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComputedAtomHandler } from '../ComputedAtomHandler';
import type { AtomTracker } from '../AtomTracker.di';
import type { ComputedDependency } from '../types';

/**
 * Create mock AtomTracker
 */
function createMockAtomTracker(): AtomTracker {
  const atoms = new Map<symbol, any>();
  const store = {
    get: vi.fn(),
    set: vi.fn(),
  };

  return {
    track: vi.fn((atom: any) => {
      atoms.set(atom.id, atom);
    }),
    untrack: vi.fn((atomId: symbol) => atoms.delete(atomId)),
    isTracked: vi.fn((atomId: symbol) => atoms.has(atomId)),
    getTrackedAtom: vi.fn((atomId: symbol) => atoms.get(atomId)),
    getAtomByName: vi.fn((name: string) => {
      for (const atom of atoms.values()) {
        if (atom.name === name) return atom;
      }
      return undefined;
    }),
    getTrackedAtoms: vi.fn(() => Array.from(atoms.values())),
    getCount: vi.fn(() => atoms.size),
    getRepository: vi.fn(() => ({
      getAll: vi.fn(() => []),
    })),
    subscribe: vi.fn(),
    store,
  } as any;
}

/**
 * Create mock atom
 */
function createMockAtom(id: symbol, name: string, read?: () => any): any {
  return {
    id,
    name,
    type: 'computed' as const,
    read: read || (() => undefined),
  };
}

describe('ComputedAtomHandler - Integration', () => {
  let handler: ComputedAtomHandler;
  let tracker: ReturnType<typeof createMockAtomTracker>;

  beforeEach(() => {
    tracker = createMockAtomTracker();
    handler = new ComputedAtomHandler(tracker);
  });

  describe('registerComputed', () => {
    it('should register computed atom with dependencies', () => {
      const computedAtom = createMockAtom(Symbol('computed1'), 'computed1');
      const depAtom = createMockAtom(Symbol('dep1'), 'dep1');

      const dependencies: ComputedDependency[] = [
        { atom: depAtom },
      ];

      handler.registerComputed(computedAtom, dependencies);

      expect(handler.isComputed(computedAtom.id)).toBe(true);
      expect(handler.getDependencies(computedAtom.id)).toHaveLength(1);
    });

    it('should track atom if not already tracked', () => {
      const computedAtom = createMockAtom(Symbol('computed1'), 'computed1');

      handler.registerComputed(computedAtom, []);

      expect(tracker.track).toHaveBeenCalled();
    });

    it('should not track atom if already tracked', () => {
      const computedAtom = createMockAtom(Symbol('computed1'), 'computed1');
      tracker.isTracked = vi.fn(() => true);

      handler.registerComputed(computedAtom, []);

      expect(tracker.track).not.toHaveBeenCalled();
    });

    it('should compute immediately if not lazy', () => {
      const computedAtom = createMockAtom(Symbol('computed1'), 'computed1', () => 42);
      const depAtom = createMockAtom(Symbol('dep1'), 'dep1');

      tracker.store.get = vi.fn(() => 1);

      handler.registerComputed(computedAtom, [{ atom: depAtom }], {
        lazy: false,
      });

      expect(tracker.store.get).toHaveBeenCalled();
    });
  });

  describe('compute', () => {
    it('should compute value from read function', () => {
      const computedAtom = createMockAtom(Symbol('computed1'), 'computed1', () => 42);
      const depAtom = createMockAtom(Symbol('dep1'), 'dep1');

      tracker.store.get = vi.fn(() => 1);

      handler.registerComputed(computedAtom, [{ atom: depAtom }]);
      const result = handler.compute(computedAtom);

      expect(result).toBe(42);
    });

    it('should use cached value if available', () => {
      const computedAtom = createMockAtom(Symbol('computed1'), 'computed1', () => 42);
      const depAtom = createMockAtom(Symbol('dep1'), 'dep1');

      tracker.store.get = vi.fn(() => 1);

      handler.registerComputed(computedAtom, [{ atom: depAtom }]);
      handler.compute(computedAtom); // First compute caches

      // Change read function
      computedAtom.read = () => 99;

      const result = handler.compute(computedAtom);

      // Should return cached value, not 99
      expect(result).toBe(42);
    });

    it('should handle computation errors gracefully', () => {
      const computedAtom = createMockAtom(Symbol('computed1'), 'computed1', () => {
        throw new Error('Computation error');
      });
      const depAtom = createMockAtom(Symbol('dep1'), 'dep1');

      tracker.store.get = vi.fn(() => 1);

      handler.registerComputed(computedAtom, [{ atom: depAtom }]);

      const result = handler.compute(computedAtom);

      expect(result).toBeUndefined();
    });
  });

  describe('cache management', () => {
    it('should invalidate cache', () => {
      const computedAtom = createMockAtom(Symbol('computed1'), 'computed1', () => 42);
      const depAtom = createMockAtom(Symbol('dep1'), 'dep1');

      tracker.store.get = vi.fn(() => 1);

      handler.registerComputed(computedAtom, [{ atom: depAtom }]);
      handler.compute(computedAtom);

      handler.invalidateCache(computedAtom.id);

      const cached = handler.getCachedValue(computedAtom.id);
      expect(cached).toBeNull();
    });

    it('should clear all cache', () => {
      const computedAtom1 = createMockAtom(Symbol('computed1'), 'computed1', () => 42);
      const computedAtom2 = createMockAtom(Symbol('computed2'), 'computed2', () => 99);
      const dep1 = createMockAtom(Symbol('dep1'), 'dep1');
      const dep2 = createMockAtom(Symbol('dep2'), 'dep2');

      tracker.store.get = vi.fn(() => 1);

      handler.registerComputed(computedAtom1, [{ atom: dep1 }]);
      handler.registerComputed(computedAtom2, [{ atom: dep2 }]);

      handler.compute(computedAtom1);
      handler.compute(computedAtom2);

      handler.clearCache();

      expect(handler.getCachedValue(computedAtom1.id)).toBeNull();
      expect(handler.getCachedValue(computedAtom2.id)).toBeNull();
    });

    it('should clear specific atom cache', () => {
      const computedAtom1 = createMockAtom(Symbol('computed1'), 'computed1', () => 42);
      const computedAtom2 = createMockAtom(Symbol('computed2'), 'computed2', () => 99);
      const dep1 = createMockAtom(Symbol('dep1'), 'dep1');
      const dep2 = createMockAtom(Symbol('dep2'), 'dep2');

      tracker.store.get = vi.fn(() => 1);

      handler.registerComputed(computedAtom1, [{ atom: dep1 }]);
      handler.registerComputed(computedAtom2, [{ atom: dep2 }]);

      handler.compute(computedAtom1);
      handler.compute(computedAtom2);

      handler.clearAtomCache(computedAtom1.id);

      expect(handler.getCachedValue(computedAtom1.id)).toBeNull();
      // computedAtom2 cache should still exist
      expect(handler.getCachedValue(computedAtom2.id)).toBe(99);
    });
  });

  describe('dependency graph', () => {
    it('should return dependency graph', () => {
      const computedAtom = createMockAtom(Symbol('computed1'), 'computed1');
      const depAtom1 = createMockAtom(Symbol('dep1'), 'dep1');
      const depAtom2 = createMockAtom(Symbol('dep2'), 'dep2');

      handler.registerComputed(computedAtom, [
        { atom: depAtom1 },
        { atom: depAtom2 },
      ]);

      const graph = handler.getDependencyGraph();

      // Graph keys contain symbol representations
      expect(Object.keys(graph)).toContainEqual(expect.stringContaining('computed1'));
    });

    it('should detect circular dependencies', () => {
      const computed1 = createMockAtom(Symbol('computed1'), 'computed1');
      const computed2 = createMockAtom(Symbol('computed2'), 'computed2');

      // Create circular dependency
      handler.registerComputed(computed1, [{ atom: computed2 }]);
      handler.registerComputed(computed2, [{ atom: computed1 }]);

      const circular = handler.detectCircularDependencies();

      expect(circular.length).toBeGreaterThan(0);
    });
  });

  describe('stats', () => {
    it('should return statistics', () => {
      const computedAtom = createMockAtom(Symbol('computed1'), 'computed1');
      const depAtom1 = createMockAtom(Symbol('dep1'), 'dep1');
      const depAtom2 = createMockAtom(Symbol('dep2'), 'dep2');

      handler.registerComputed(computedAtom, [
        { atom: depAtom1 },
        { atom: depAtom2 },
      ]);

      const stats = handler.getStats();

      expect(stats.totalComputed).toBe(1);
      expect(stats.dependencyCount).toBe(2);
      expect(stats.queueSize).toBe(0);
    });
  });

  describe('removeComputed', () => {
    it('should remove computed atom', () => {
      const computedAtom = createMockAtom(Symbol('computed1'), 'computed1');

      handler.registerComputed(computedAtom, []);
      handler.removeComputed(computedAtom.id);

      expect(handler.isComputed(computedAtom.id)).toBe(false);
    });

    it('should remove from dependents lists', () => {
      const depAtom = createMockAtom(Symbol('dep1'), 'dep1');
      const computedAtom = createMockAtom(Symbol('computed1'), 'computed1');

      handler.registerComputed(computedAtom, [{ atom: depAtom }]);
      handler.removeComputed(computedAtom.id);

      const dependents = handler.getDependents(depAtom.id);
      expect(dependents).toHaveLength(0);
    });
  });

  describe('updateConfig', () => {
    it('should update config', () => {
      const computedAtom = createMockAtom(Symbol('computed1'), 'computed1');

      handler.registerComputed(computedAtom, []);
      handler.updateConfig(computedAtom.id, { cacheTTL: 10000 });

      // Config updated, cache invalidated
      expect(handler.getCachedValue(computedAtom.id)).toBeNull();
    });
  });

  describe('getAllComputed', () => {
    it('should return all computed atoms', () => {
      const computed1 = createMockAtom(Symbol('computed1'), 'computed1');
      const computed2 = createMockAtom(Symbol('computed2'), 'computed2');

      handler.registerComputed(computed1, []);
      handler.registerComputed(computed2, []);

      const all = handler.getAllComputed();

      expect(all).toHaveLength(2);
      expect(all).toContain(computed1.id);
      expect(all).toContain(computed2.id);
    });
  });
});
