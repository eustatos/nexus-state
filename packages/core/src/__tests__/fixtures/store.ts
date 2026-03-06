/**
 * Store Fixtures
 * Pre-configured store instances for common test scenarios
 *
 * @example
 * ```typescript
 * import { testStores } from '../fixtures/store';
 *
 * const { store, getAtom } = testStores.withPrimitives();
 * expect(getAtom('number')).toBe(42);
 * ```
 */

import { atom, createStore } from '../../index';
import type { Atom, Store, Getter } from '../../types';

/**
 * Type for test store factories
 */
export type TestStores = typeof testStores;

/**
 * Type for store builder result
 */
export type StoreBuilderResult = ReturnType<StoreBuilder['build']>;

/**
 * Basic store configurations
 */
export const testStores = {
  /**
   * Empty store
   */
  empty: () => {
    const store = createStore();
    return { store };
  },

  /**
   * Store with primitive atoms
   */
  withPrimitives: () => {
    const store = createStore();
    const atoms = {
      number: atom(42, 'number'),
      string: atom('hello', 'string'),
      boolean: atom(true, 'boolean'),
      null: atom(null, 'null'),
      zero: atom(0, 'zero'),
    };

    // Initialize all atoms
    Object.values(atoms).forEach((a) => store.get(a));

    return {
      store,
      atoms,
      getAtom: <T>(name: keyof typeof atoms) => atoms[name] as Atom<T>,
      getValue: <T>(name: keyof typeof atoms) => store.get(atoms[name]) as T,
    };
  },

  /**
   * Store with computed atoms
   */
  withComputed: () => {
    const store = createStore();
    const base = atom(10, 'base');
    const double = atom((get: Getter) => get(base) * 2, 'double');
    const triple = atom((get: Getter) => get(base) * 3, 'triple');
    const sum = atom((get: Getter) => get(double) + get(triple), 'sum');

    store.get(base);
    store.get(double);
    store.get(triple);
    store.get(sum);

    return {
      store,
      base,
      double,
      triple,
      sum,
    };
  },

  /**
   * Store with writable atoms
   */
  withWritable: () => {
    const store = createStore();

    const counter = atom(
      () => 0,
      (get, set, action: 'inc' | 'dec' | 'reset') => {
        switch (action) {
          case 'inc':
            set(counter, get(counter) + 1);
            break;
          case 'dec':
            set(counter, get(counter) - 1);
            break;
          case 'reset':
            set(counter, 0);
            break;
        }
      },
      'counter'
    );

    const clamped = atom(
      () => 0,
      (get, set, value: number) => {
        const clamped = Math.max(0, Math.min(100, value));
        set(clamped, clamped);
      },
      'clamped'
    );

    store.get(counter);
    store.get(clamped);

    return {
      store,
      counter,
      clamped,
    };
  },

  /**
   * Store with dependency graph
   */
  withDependencyGraph: () => {
    const store = createStore();

    const a = atom(10, 'a');
    const b = atom(20, 'b');
    const sum = atom((get: Getter) => get(a) + get(b), 'sum');
    const product = atom((get: Getter) => get(a) * get(b), 'product');
    const result = atom(
      (get: Getter) => get(sum) + get(product),
      'result'
    );

    store.get(a);
    store.get(b);
    store.get(sum);
    store.get(product);
    store.get(result);

    return {
      store,
      a,
      b,
      sum,
      product,
      result,
    };
  },

  /**
   * Store with mixed atom types
   */
  withMixedTypes: () => {
    const store = createStore();

    const primitive = atom(42, 'primitive');
    const computed = atom((get: Getter) => get(primitive) * 2, 'computed');
    const writable = atom(
      () => 0,
      (get, set, value: number) => set(writable, value),
      'writable'
    );

    store.get(primitive);
    store.get(computed);
    store.get(writable);

    return {
      store,
      primitive,
      computed,
      writable,
    };
  },

  /**
   * Store with complex state
   */
  withComplexState: () => {
    const store = createStore();

    const user = atom(
      { id: 1, name: 'John', email: 'john@example.com' },
      'user'
    );

    const todos = atom(
      [
        { id: 1, text: 'Learn TypeScript', done: false },
        { id: 2, text: 'Build a project', done: false },
      ],
      'todos'
    );

    const completedCount = atom(
      (get: Getter) => get(todos).filter((t) => t.done).length,
      'completed-count'
    );

    const userName = atom(
      (get: Getter) => get(user).name,
      'user-name'
    );

    store.get(user);
    store.get(todos);
    store.get(completedCount);
    store.get(userName);

    return {
      store,
      user,
      todos,
      completedCount,
      userName,
    };
  },
};

/**
 * Store builder for custom scenarios
 *
 * @example
 * ```typescript
 * const { store, get } = new StoreBuilder()
 *   .primitive('count', 0)
 *   .primitive('name', 'test')
 *   .computed('double', (get) => get('count') * 2)
 *   .build();
 * ```
 */
export class StoreBuilder {
  private store: Store;
  private atoms: Map<string, Atom<any>> = new Map();

  constructor() {
    this.store = createStore();
  }

  /**
   * Add a primitive atom
   */
  primitive<T>(name: string, value: T): this {
    const a = atom(value, name);
    this.atoms.set(name, a);
    this.store.get(a);
    return this;
  }

  /**
   * Add a computed atom
   */
  computed<T>(name: string, fn: (get: (key: string) => any) => T): this {
    const a = atom(
      (get: Getter) => {
        const getter = (key: string) => {
          const atom = this.atoms.get(key);
          if (!atom) {
            throw new Error(`Atom '${key}' not found`);
          }
          return get(atom);
        };
        return fn(getter);
      },
      name
    );
    this.atoms.set(name, a);
    this.store.get(a);
    return this;
  }

  /**
   * Add a writable atom
   */
  writable<T>(
    name: string,
    read: () => T,
    write: (value: T) => void
  ): this {
    const a = atom(read, (get, set, value: T) => write(value), name);
    this.atoms.set(name, a);
    this.store.get(a);
    return this;
  }

  /**
   * Build and return the store with helpers
   */
  build() {
    return {
      store: this.store,
      atoms: Object.fromEntries(this.atoms),
      get: <T>(name: string) => this.atoms.get(name) as Atom<T>,
      getValue: <T>(name: string) => this.store.get(this.atoms.get(name)!) as T,
    };
  }
}

/**
 * Create a store with predefined atoms
 */
export function createTestStore(
  atoms: Record<string, Atom<any>> = {}
): Store & { atoms: typeof atoms } {
  const store = createStore();
  Object.values(atoms).forEach((a) => store.get(a));
  return { ...store, atoms };
}

/**
 * Create a store snapshot (all current values)
 */
export function createSnapshot(store: Store): Record<string, any> {
  const { atomRegistry } = require('../../index');
  const allAtoms = atomRegistry.getAll();
  const snapshot: Record<string, any> = {};

  for (const [id, atom] of allAtoms.entries()) {
    try {
      const name = atom.name || `atom-${id.toString()}`;
      snapshot[name] = store.get(atom);
    } catch {
      // Skip atoms that throw
    }
  }

  return snapshot;
}
