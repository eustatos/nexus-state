// Implementation of createStore function

import type { Atom, Store, Subscriber, Getter, Setter } from './types';

type AtomState<Value> = {
  value: Value;
  subscribers: Set<Subscriber<Value>>;
  dependents: Set<Atom<any>>;
};

type Plugin = (store: Store) => void;

export function createStore(plugins: Plugin[] = []): Store {
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

  // Добавляем метод для получения состояния всех атомов (для devtools)
  const getState = (): Record<string, any> => {
    const state: Record<string, any> = {};
    atomStates.forEach((atomState, atom) => {
      // Здесь мы используем внутренний ID атома или другую идентификацию
      // Поскольку у нас нет прямого доступа к имени атома, используем его индекс или хэш
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

  // Применяем плагины
  plugins.forEach(plugin => plugin(store));

  return store;
}