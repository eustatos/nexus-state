// Implementation of createStore function

import type { Atom, Store, Subscriber, Getter, Setter } from './types';

type AtomState<Value> = {
  value: Value;
  subscribers: Set<Subscriber<Value>>;
  dependents: Set<Atom<any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
};

type Plugin = (store: Store) => void;

export function createStore(plugins: Plugin[] = []): Store {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const atomStates = new Map<Atom<any>, AtomState<any>>();
  
  // Track the current atom being evaluated for dependency tracking
  let currentAtom: Atom<any> | null = null;

  const get: Getter = <Value>(atom: Atom<Value>): Value => {
    // Get or create atom state
    let atomState = atomStates.get(atom) as AtomState<Value> | undefined;
    if (!atomState) {
      atomState = {
        value: atom.read(get as any), // eslint-disable-line @typescript-eslint/no-explicit-any
        subscribers: new Set(),
        dependents: new Set(),
      };
      atomStates.set(atom, atomState as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    
    // Track dependency if we're currently evaluating another atom
    if (currentAtom && currentAtom !== atom) {
      // Add currentAtom as a dependent of atom
      atomState.dependents.add(currentAtom);
    }

    return atomState.value as Value;
  };

  const set: Setter = <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value)
  ): void => {
    const atomState = atomStates.get(atom) as AtomState<Value> | undefined;
    if (!atomState) {
      throw new Error('Atom not found in store');
    }

    // Calculate new value
    const newValue =
      typeof update === 'function'
        ? (update as (prev: Value) => Value)(atomState.value)
        : update;

    // Update value
    atomState.value = newValue;

    // Notify subscribers
    atomState.subscribers.forEach((subscriber) => {
      subscriber(newValue);
    });

    // Notify dependents
    atomState.dependents.forEach((dependent) => {
      // For computed atoms, we need to recompute their values
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dependentState = atomStates.get(dependent) as AtomState<any> | undefined;
      if (dependentState) {
        // Track which atom is being evaluated
        const previousAtom = currentAtom;
        currentAtom = dependent;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newValue = dependent.read(get as any);
          if (dependentState.value !== newValue) {
            dependentState.value = newValue;
            dependentState.subscribers.forEach((subscriber) => {
              subscriber(newValue);
            });
          }
        } finally {
          currentAtom = previousAtom;
        }
      }
    });
  };

  const subscribe = <Value>(
    atom: Atom<Value>,
    subscriber: Subscriber<Value>
  ): (() => void) => {
    // Get or create atom state
    let atomState = atomStates.get(atom) as AtomState<Value> | undefined;
    if (!atomState) {
      atomState = {
        value: atom.read(get as any), // eslint-disable-line @typescript-eslint/no-explicit-any
        subscribers: new Set(),
        dependents: new Set(),
      };
      atomStates.set(atom, atomState as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    // Add subscriber
    atomState.subscribers.add(subscriber);

    // Return unsubscribe function
    return () => {
      atomState!.subscribers.delete(subscriber);
    };
  };

  // Add method to get state of all atoms (for devtools)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getState = (): Record<string, any> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state: Record<string, any> = {};
    atomStates.forEach((atomState, atom) => {
      // Here we use the atom's internal ID or other identification
      // Since we don't have direct access to the atom's name, we use its index or hash
      state[atom.toString()] = atomState.value;
    });
    return state;
  };

  const store: Store = {
    get,
    set,
    subscribe,
    getState,
  };

  // Apply plugins
  plugins.forEach(plugin => plugin(store));

  return store;
}