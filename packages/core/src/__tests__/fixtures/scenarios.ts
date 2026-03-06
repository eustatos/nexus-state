/**
 * Test Scenarios Fixtures
 * Pre-built dependency graphs and test scenarios
 *
 * @example
 * ```typescript
 * import { dependencyGraphs } from '../fixtures/scenarios';
 *
 * const { store, a, b, c, d } = dependencyGraphs.diamond();
 * expect(store.get(d)).toBe(50);
 * ```
 */

import { atom, createStore } from '../../index';
import type { Atom, Store, Getter } from '../../types';

/**
 * Type for dependency graph factories
 */
export type DependencyGraphs = typeof dependencyGraphs;

/**
 * Type for edge case factories
 */
export type EdgeCases = typeof edgeCases;

/**
 * Type for error scenario factories
 */
export type ErrorScenarios = typeof errorScenarios;

/**
 * Type for performance scenario factories
 */
export type PerformanceScenarios = typeof performanceScenarios;

/**
 * Dependency graph scenarios
 */
export const dependencyGraphs = {
  /**
   * Simple chain: A → B → C
   * Values: a=1, b=a+1=2, c=b+1=3
   */
  simpleChain: () => {
    const store = createStore();
    const a = atom(1, 'a');
    const b = atom((get: Getter) => get(a) + 1, 'b');
    const c = atom((get: Getter) => get(b) + 1, 'c');
    return { store, a, b, c };
  },

  /**
   * Diamond pattern: A → B,C → D
   * Values: a=10, b=a*2=20, c=a*3=30, d=b+c=50
   */
  diamond: () => {
    const store = createStore();
    const a = atom(10, 'a');
    const b = atom((get: Getter) => get(a) * 2, 'b');
    const c = atom((get: Getter) => get(a) * 3, 'c');
    const d = atom((get: Getter) => get(b) + get(c), 'd');
    return { store, a, b, c, d };
  },

  /**
   * Complex graph with multiple paths
   * Graph:
   *   a ─┬─> c ─┐
   *   b ─┤      ├─> f
   *   a ─> d ───┤
   *   b ─> e ───┘
   * Values: a=0, b=0, c=a+b, d=a*2, e=b*2, f=c+d+e
   */
  complex: () => {
    const store = createStore();
    const a = atom(0, 'a');
    const b = atom(0, 'b');
    const c = atom((get: Getter) => get(a) + get(b), 'c');
    const d = atom((get: Getter) => get(a) * 2, 'd');
    const e = atom((get: Getter) => get(b) * 2, 'e');
    const f = atom((get: Getter) => get(c) + get(d) + get(e), 'f');
    return { store, a, b, c, d, e, f };
  },

  /**
   * Chain of 5 computed atoms
   * Values: a=0, b=a+1, c=b+1, d=c+1, e=d+1
   */
  chain5: () => {
    const store = createStore();
    const a = atom(0, 'a');
    const b = atom((get: Getter) => get(a) + 1, 'b');
    const c = atom((get: Getter) => get(b) + 1, 'c');
    const d = atom((get: Getter) => get(c) + 1, 'd');
    const e = atom((get: Getter) => get(d) + 1, 'e');
    return { store, a, b, c, d, e };
  },

  /**
   * Chain of 10 computed atoms
   */
  chain10: () => {
    const store = createStore();
    const atoms: Atom<number>[] = [atom(0, 'a')];
    for (let i = 1; i < 10; i++) {
      const prev = atoms[i - 1];
      atoms.push(atom((get: Getter) => get(prev) + 1, `atom-${i}`));
    }
    return { store, atoms };
  },

  /**
   * Multiple dependencies on single atom
   * One base atom with 5 dependents
   */
  fanOut: () => {
    const store = createStore();
    const base = atom(10, 'base');
    const double = atom((get: Getter) => get(base) * 2, 'double');
    const triple = atom((get: Getter) => get(base) * 3, 'triple');
    const quadruple = atom((get: Getter) => get(base) * 4, 'quadruple');
    const square = atom((get: Getter) => get(base) ** 2, 'square');
    const half = atom((get: Getter) => get(base) / 2, 'half');
    return { store, base, double, triple, quadruple, square, half };
  },

  /**
   * Multiple atoms converging to one
   * 5 base atoms summing to one result
   */
  fanIn: () => {
    const store = createStore();
    const a1 = atom(1, 'a1');
    const a2 = atom(2, 'a2');
    const a3 = atom(3, 'a3');
    const a4 = atom(4, 'a4');
    const a5 = atom(5, 'a5');
    const sum = atom(
      (get: Getter) => get(a1) + get(a2) + get(a3) + get(a4) + get(a5),
      'sum'
    );
    return { store, a1, a2, a3, a4, a5, sum };
  },

  /**
   * Nested diamond pattern
   * Two diamonds connected in series
   */
  nestedDiamond: () => {
    const store = createStore();
    const a = atom(1, 'a');
    const b1 = atom((get: Getter) => get(a) * 2, 'b1');
    const b2 = atom((get: Getter) => get(a) * 3, 'b2');
    const c = atom((get: Getter) => get(b1) + get(b2), 'c');
    const d1 = atom((get: Getter) => get(c) * 2, 'd1');
    const d2 = atom((get: Getter) => get(c) * 3, 'd2');
    const e = atom((get: Getter) => get(d1) + get(d2), 'e');
    return { store, a, b1, b2, c, d1, d2, e };
  },

  /**
   * Circular dependency (for error handling tests)
   * Should be handled gracefully
   */
  circular: () => {
    const store = createStore();
    const atom1Value = 1;
    const atom2Value = 2;

    const atom1: Atom<number> = atom((get: Getter) => {
      try {
        return get(atom2 as Atom<number>) + 1;
      } catch {
        return atom1Value;
      }
    }, 'atom1');

    const atom2: Atom<number> = atom((get: Getter) => {
      try {
        return get(atom1 as Atom<number>) + 1;
      } catch {
        return atom2Value;
      }
    }, 'atom2');

    return { store, atom1, atom2 };
  },
};

/**
 * Edge case scenarios
 */
export const edgeCases = {
  /**
   * Rapid updates scenario
   */
  rapidUpdates: () => {
    const store = createStore();
    const counter = atom(0, 'counter');
    const double = atom((get: Getter) => get(counter) * 2, 'double');

    const updateSequence = (count: number) => {
      for (let i = 1; i <= count; i++) {
        store.set(counter, i);
      }
    };

    return { store, counter, double, updateSequence };
  },

  /**
   * Large state scenario
   */
  largeState: () => {
    const store = createStore();
    const atoms: Atom<number>[] = [];

    for (let i = 0; i < 100; i++) {
      atoms.push(atom(i, `atom-${i}`));
    }

    const sum = atom(
      (get: Getter) => atoms.reduce((total, a) => total + get(a), 0),
      'sum'
    );

    return { store, atoms, sum };
  },

  /**
   * Deep nesting scenario
   */
  deepNesting: () => {
    const store = createStore();

    const createChain = (length: number) => {
      const atoms: Atom<number>[] = [atom(0, 'level-0')];
      for (let i = 1; i < length; i++) {
        const prev = atoms[i - 1];
        atoms.push(atom((get: Getter) => get(prev) + 1, `level-${i}`));
      }
      return atoms;
    };

    const chain = createChain(20);
    return { store, chain };
  },

  /**
   * Multiple subscribers scenario
   */
  multipleSubscribers: () => {
    const store = createStore();
    const base = atom(0, 'base');
    const callbacks: Array<(value: number) => void> = [];

    const subscribe = (cb: (value: number) => void) => {
      callbacks.push(cb);
      return () => {
        const index = callbacks.indexOf(cb);
        if (index > -1) callbacks.splice(index, 1);
      };
    };

    return { store, base, callbacks, subscribe };
  },
};

/**
 * Error scenarios
 */
export const errorScenarios = {
  /**
   * Atom that throws on read
   */
  readError: () => {
    const store = createStore();
    const errorAtom = atom((_get: Getter) => {
      throw new Error('Read error');
    }, 'error-atom');

    return { store, errorAtom };
  },

  /**
   * Atom that throws on write
   */
  writeError: () => {
    const store = createStore();
    const errorAtom = atom(
      () => 0,
      () => {
        throw new Error('Write error');
      },
      'error-atom'
    );

    return { store, errorAtom };
  },

  /**
   * Validation error scenario
   */
  validationError: () => {
    const store = createStore();
    const validatedAtom = atom(
      () => 0,
      (_get, set, value: number) => {
        if (value < 0) {
          throw new Error('Value must be non-negative');
        }
        set(validatedAtom, value);
      },
      'validated'
    );

    return { store, validatedAtom };
  },

  /**
   * Dependency error scenario
   */
  dependencyError: () => {
    const store = createStore();
    const errorAtom = atom((_get: Getter) => {
      throw new Error('Dependency error');
    }, 'error');

    const dependentAtom = atom(
      (get: Getter) => get(errorAtom) * 2,
      'dependent'
    );

    return { store, errorAtom, dependentAtom };
  },
};

/**
 * Performance scenarios
 */
export const performanceScenarios = {
  /**
   * Many atoms, few updates
   */
  manyAtoms: () => {
    const store = createStore();
    const atoms = Array.from({ length: 1000 }, (_, i) => atom(i, `atom-${i}`));
    return { store, atoms };
  },

  /**
   * Many subscribers
   */
  manySubscribers: () => {
    const store = createStore();
    const base = atom(0, 'base');
    const unsubscribeFunctions: Array<() => void> = [];

    for (let i = 0; i < 100; i++) {
      const unsub = store.subscribe(base, () => {});
      unsubscribeFunctions.push(unsub);
    }

    return { store, base, unsubscribeFunctions };
  },

  /**
   * Complex recomputation
   */
  complexRecomputation: () => {
    const store = createStore();
    const base = atom(0, 'base');

    // Create 10 computed atoms depending on base
    const computeds = Array.from({ length: 10 }, (_, i) =>
      atom((get: Getter) => get(base) * (i + 1), `computed-${i}`)
    );

    // Create sum of all computeds
    const sum = atom(
      (get: Getter) => computeds.reduce((total, c) => total + get(c), 0),
      'sum'
    );

    return { store, base, computeds, sum };
  },
};
