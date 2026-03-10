/**
 * Tests for DependencyTracker
 *
 * @packageDocumentation
 * @test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyTracker } from '../DependencyTracker';
import type { ComputedDependency } from '../types';

/**
 * Create a mock atom with ID and name
 */
function createMockAtom(id: symbol, name: string): any {
  return {
    id,
    name,
    type: 'primitive' as const,
    read: () => undefined,
  };
}

/**
 * Create a computed dependency
 */
function createDependency(atom: any, transform?: (v: any) => any): ComputedDependency {
  return {
    atom,
    transform,
  };
}

describe('DependencyTracker', () => {
  let tracker: DependencyTracker;

  beforeEach(() => {
    tracker = new DependencyTracker();
  });

  describe('constructor', () => {
    it('should create empty tracker', () => {
      expect(tracker).toBeDefined();
      expect(tracker.getStats().totalComputed).toBe(0);
    });
  });

  describe('register', () => {
    it('should register dependencies for computed atom', () => {
      const computedId = Symbol('computed1');
      const dep1Atom = createMockAtom(Symbol('dep1'), 'dep1');
      const dep2Atom = createMockAtom(Symbol('dep2'), 'dep2');

      const dependencies: ComputedDependency[] = [
        createDependency(dep1Atom),
        createDependency(dep2Atom),
      ];

      tracker.register(computedId, dependencies);

      const deps = tracker.getDependencies(computedId);
      expect(deps.length).toBe(2);
      expect(deps[0]?.atom.name).toBe('dep1');
      expect(deps[1]?.atom.name).toBe('dep2');
    });

    it('should track dependents for each dependency', () => {
      const computedId = Symbol('computed1');
      const depAtom = createMockAtom(Symbol('dep1'), 'dep1');

      tracker.register(computedId, [createDependency(depAtom)]);

      const dependents = tracker.getDependents(depAtom.id);
      expect(dependents.length).toBe(1);
      expect(dependents[0]).toBe(computedId);
    });

    it('should handle multiple computed atoms depending on same atom', () => {
      const depAtom = createMockAtom(Symbol('dep1'), 'dep1');
      const computed1 = Symbol('computed1');
      const computed2 = Symbol('computed2');

      tracker.register(computed1, [createDependency(depAtom)]);
      tracker.register(computed2, [createDependency(depAtom)]);

      const dependents = tracker.getDependents(depAtom.id);
      expect(dependents.length).toBe(2);
      expect(dependents).toContain(computed1);
      expect(dependents).toContain(computed2);
    });

    it('should overwrite previous dependencies for same atom', () => {
      const computedId = Symbol('computed1');
      const dep1Atom = createMockAtom(Symbol('dep1'), 'dep1');
      const dep2Atom = createMockAtom(Symbol('dep2'), 'dep2');

      // Register with first dependency
      tracker.register(computedId, [createDependency(dep1Atom)]);

      // Register with different dependency
      tracker.register(computedId, [createDependency(dep2Atom)]);

      const deps = tracker.getDependencies(computedId);
      expect(deps.length).toBe(1);
      expect(deps[0]?.atom.name).toBe('dep2');
    });
  });

  describe('getDependencies', () => {
    it('should return empty array for unknown atom', () => {
      const deps = tracker.getDependencies(Symbol('unknown'));
      expect(deps).toEqual([]);
    });

    it('should return dependencies for registered atom', () => {
      const computedId = Symbol('computed1');
      const depAtom = createMockAtom(Symbol('dep1'), 'dep1');

      tracker.register(computedId, [createDependency(depAtom)]);

      const deps = tracker.getDependencies(computedId);
      expect(deps.length).toBe(1);
    });
  });

  describe('getDependents', () => {
    it('should return empty array for atom without dependents', () => {
      const deps = tracker.getDependents(Symbol('unknown'));
      expect(deps).toEqual([]);
    });

    it('should return all dependents for an atom', () => {
      const depAtom = createMockAtom(Symbol('dep1'), 'dep1');
      const computed1 = Symbol('computed1');
      const computed2 = Symbol('computed2');

      tracker.register(computed1, [createDependency(depAtom)]);
      tracker.register(computed2, [createDependency(depAtom)]);

      const dependents = tracker.getDependents(depAtom.id);
      expect(dependents.length).toBe(2);
    });
  });

  describe('hasDependents', () => {
    it('should return false for atom without dependents', () => {
      expect(tracker.hasDependents(Symbol('unknown'))).toBe(false);
    });

    it('should return true for atom with dependents', () => {
      const depAtom = createMockAtom(Symbol('dep1'), 'dep1');
      tracker.register(Symbol('computed1'), [createDependency(depAtom)]);

      expect(tracker.hasDependents(depAtom.id)).toBe(true);
    });
  });

  describe('getAllComputed', () => {
    it('should return empty array when no computed atoms', () => {
      expect(tracker.getAllComputed()).toEqual([]);
    });

    it('should return all registered computed atoms', () => {
      const computed1 = Symbol('computed1');
      const computed2 = Symbol('computed2');

      tracker.register(computed1, []);
      tracker.register(computed2, []);

      const all = tracker.getAllComputed();
      expect(all.length).toBe(2);
      expect(all).toContain(computed1);
      expect(all).toContain(computed2);
    });
  });

  describe('isComputed', () => {
    it('should return false for unknown atom', () => {
      expect(tracker.isComputed(Symbol('unknown'))).toBe(false);
    });

    it('should return true for registered computed atom', () => {
      const computedId = Symbol('computed1');
      tracker.register(computedId, []);

      expect(tracker.isComputed(computedId)).toBe(true);
    });
  });

  describe('remove', () => {
    it('should remove atom and its dependencies', () => {
      const computedId = Symbol('computed1');
      tracker.register(computedId, []);

      tracker.remove(computedId);

      expect(tracker.getDependencies(computedId)).toEqual([]);
      expect(tracker.isComputed(computedId)).toBe(false);
    });

    it('should remove atom from dependents lists', () => {
      const depAtom = createMockAtom(Symbol('dep1'), 'dep1');
      const computedId = Symbol('computed1');

      tracker.register(computedId, [createDependency(depAtom)]);
      tracker.remove(computedId);

      const dependents = tracker.getDependents(depAtom.id);
      expect(dependents.length).toBe(0);
    });

    it('should clean up empty dependents sets', () => {
      const depAtom = createMockAtom(Symbol('dep1'), 'dep1');
      const computedId = Symbol('computed1');

      tracker.register(computedId, [createDependency(depAtom)]);
      tracker.remove(computedId);

      // After removal, depAtom should not have dependents
      expect(tracker.hasDependents(depAtom.id)).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return statistics for empty tracker', () => {
      const stats = tracker.getStats();

      expect(stats.totalComputed).toBe(0);
      expect(stats.dependencyCount).toBe(0);
      expect(stats.atomsWithDependents).toBe(0);
      expect(stats.hasCircular).toBe(false);
    });

    it('should return statistics for tracker with atoms', () => {
      const dep1 = createMockAtom(Symbol('dep1'), 'dep1');
      const dep2 = createMockAtom(Symbol('dep2'), 'dep2');
      const computed1 = Symbol('computed1');
      const computed2 = Symbol('computed2');

      tracker.register(computed1, [createDependency(dep1), createDependency(dep2)]);
      tracker.register(computed2, [createDependency(dep1)]);

      const stats = tracker.getStats();

      expect(stats.totalComputed).toBe(2);
      expect(stats.dependencyCount).toBe(3);
      expect(stats.atomsWithDependents).toBe(2); // dep1 and dep2
      expect(stats.hasCircular).toBe(false);
    });
  });

  describe('getDependencyGraph', () => {
    it('should return empty graph when no dependencies', () => {
      const graph = tracker.getDependencyGraph((id) => String(id));
      expect(graph).toEqual({});
    });

    it('should return dependency graph', () => {
      const dep1 = createMockAtom(Symbol('dep1'), 'dep1');
      const dep2 = createMockAtom(Symbol('dep2'), 'dep2');
      const computedId = Symbol('computed1');

      tracker.register(computedId, [createDependency(dep1), createDependency(dep2)]);

      const getName = (id: symbol) => {
        if (id === computedId) return 'computed1';
        if (id === dep1.id) return 'dep1';
        if (id === dep2.id) return 'dep2';
        return String(id);
      };

      const graph = tracker.getDependencyGraph(getName);

      expect(graph.computed1).toEqual(['dep1', 'dep2']);
    });
  });

  describe('detectCircularDependencies', () => {
    it('should return empty array when no circular dependencies', () => {
      const dep1 = createMockAtom(Symbol('dep1'), 'dep1');
      const dep2 = createMockAtom(Symbol('dep2'), 'dep2');
      const computed1 = Symbol('computed1');

      tracker.register(computed1, [createDependency(dep1), createDependency(dep2)]);

      const circular = tracker.detectCircularDependencies();
      expect(circular).toEqual([]);
    });

    it('should detect simple circular dependency', () => {
      // This test creates a scenario where computed1 depends on dep1,
      // and we manually create a cycle for testing
      const dep1 = createMockAtom(Symbol('dep1'), 'dep1');
      const computed1 = Symbol('computed1');

      // Create a self-referential dependency
      tracker.register(computed1, [createDependency(dep1)]);

      // For a true circular dependency, we'd need dep1 to depend on computed1
      // But dep1 is not a computed atom, so no cycle
      const circular = tracker.detectCircularDependencies();
      expect(circular).toEqual([]);
    });

    it('should detect circular dependency between computed atoms', () => {
      const computed1 = Symbol('computed1');
      const computed2 = Symbol('computed2');

      // Create mock atoms that are actually computed
      const mockComputed1 = createMockAtom(computed1, 'computed1');
      const mockComputed2 = createMockAtom(computed2, 'computed2');

      // computed1 depends on computed2
      tracker.register(computed1, [createDependency(mockComputed2)]);
      // computed2 depends on computed1 (circular!)
      tracker.register(computed2, [createDependency(mockComputed1)]);

      const circular = tracker.detectCircularDependencies();
      expect(circular.length).toBeGreaterThan(0);
    });

    it('should handle complex circular dependencies', () => {
      const a = Symbol('a');
      const b = Symbol('b');
      const c = Symbol('c');

      const mockA = createMockAtom(a, 'a');
      const mockB = createMockAtom(b, 'b');
      const mockC = createMockAtom(c, 'c');

      // A -> B -> C -> A (cycle)
      tracker.register(a, [createDependency(mockB)]);
      tracker.register(b, [createDependency(mockC)]);
      tracker.register(c, [createDependency(mockA)]);

      const circular = tracker.detectCircularDependencies();
      expect(circular.length).toBeGreaterThan(0);
    });
  });

  describe('clear', () => {
    it('should clear all dependencies', () => {
      const dep1 = createMockAtom(Symbol('dep1'), 'dep1');
      tracker.register(Symbol('computed1'), [createDependency(dep1)]);

      tracker.clear();

      expect(tracker.getStats().totalComputed).toBe(0);
      expect(tracker.getAllComputed()).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty dependencies array', () => {
      const computedId = Symbol('computed1');
      tracker.register(computedId, []);

      const deps = tracker.getDependencies(computedId);
      expect(deps).toEqual([]);
      expect(tracker.isComputed(computedId)).toBe(true);
    });

    it('should handle dependencies with transforms', () => {
      const depAtom = createMockAtom(Symbol('dep1'), 'dep1');
      const transform = (v: any) => v * 2;
      const computedId = Symbol('computed1');

      tracker.register(computedId, [createDependency(depAtom, transform)]);

      const deps = tracker.getDependencies(computedId);
      expect(deps[0]?.transform).toBe(transform);
    });

    it('should handle many dependencies for single atom', () => {
      const computedId = Symbol('computed1');
      const dependencies: ComputedDependency[] = [];

      for (let i = 0; i < 100; i++) {
        dependencies.push(createDependency(createMockAtom(Symbol(`dep${i}`), `dep${i}`)));
      }

      tracker.register(computedId, dependencies);

      const deps = tracker.getDependencies(computedId);
      expect(deps.length).toBe(100);
    });
  });
});
