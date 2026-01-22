// Implementation of createStore function

import type { Atom, Store, Subscriber, Getter, Setter } from './types';

type AtomState<Value> = {
  value: Value;
  subscribers: Set<Subscriber<Value>>;
  dependents: Set<Atom<any>>;
};

export function createStore(): Store {
  const atomStates = new Map<Atom<any>, AtomState<any>>();

  const get: Getter = <Value>(atom: Atom<Value>): Value => {
    // Get or create atom state
    let atomState = atomStates.get(atom);
    if (!atomState) {
      atomState = {
        value: atom.read(get),
        subscribers: new Set(),
        dependents: new Set(),
      };
      atomStates.set(atom, atomState);
    }

    return atomState.value;
  };

  const set: Setter = <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value)
  ): void => {
    const atomState = atomStates.get(atom);
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
      const dependentState = atomStates.get(dependent);
      if (dependentState) {
        const newValue = dependent.read(get);
        if (dependentState.value !== newValue) {
          dependentState.value = newValue;
          dependentState.subscribers.forEach((subscriber) => {
            subscriber(newValue);
          });
        }
      }
    });
  };

  const subscribe = <Value>(
    atom: Atom<Value>,
    subscriber: Subscriber<Value>
  ): (() => void) => {
    // Get or create atom state
    let atomState = atomStates.get(atom);
    if (!atomState) {
      atomState = {
        value: atom.read(get),
        subscribers: new Set(),
        dependents: new Set(),
      };
      atomStates.set(atom, atomState);
    }

    // Add subscriber
    atomState.subscribers.add(subscriber);

    // Return unsubscribe function
    return () => {
      atomState!.subscribers.delete(subscriber);
    };
  };

  return {
    get,
    set,
    subscribe,
  };
}