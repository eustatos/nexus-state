// Persist plugin for nexus-state
import { Atom, Store } from '@nexus-state/core';

/**
 * Represents a storage interface for persisting atom values.
 * @typedef {Object} PersistStorage
 * @property {Function} getItem - Function to get an item from storage
 * @property {Function} setItem - Function to set an item in storage
 * @property {Function} removeItem - Function to remove an item from storage
 */
export type PersistStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

/**
 * Configuration options for the persist plugin.
 * @typedef {Object} PersistConfig
 * @property {string} key - The key to use for storing the atom's value
 * @property {PersistStorage} storage - The storage implementation to use
 * @property {Function} [serialize] - Function to serialize the value (defaults to JSON.stringify)
 * @property {Function} [deserialize] - Function to deserialize the value (defaults to JSON.parse)
 */
export type PersistConfig<T> = {
  key: string;
  storage: PersistStorage;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
};

/**
 * Plugin to persist atom values to storage.
 * @template T - The type of the atom's value
 * @param {Atom<T>} atom - The atom to persist
 * @param {PersistConfig<T>} config - Configuration options for the plugin
 * @returns {Function} A function that applies the plugin to a store
 * @example
 * const store = createStore([
 *   persist(countAtom, { 
 *     key: 'count', 
 *     storage: localStorageStorage 
 *   })
 * ]);
 */
export function persist<T>(atom: Atom<T>, config: PersistConfig<T>): (store: Store) => void {
  return (store: Store) => {
    const { key, storage, serialize = JSON.stringify, deserialize = JSON.parse } = config;
    
    // Attempt to restore the value from storage
    const savedValue = storage.getItem(key);
    if (savedValue !== null) {
      try {
        const deserializedValue = deserialize(savedValue);
        store.set(atom, deserializedValue);
      } catch (error) {
        console.error(`Failed to deserialize persisted value for atom ${key}:`, error);
      }
    }

    // Subscribe to atom changes to save to storage
    store.subscribe(atom, () => {
      const value = store.get(atom);
      try {
        const serializedValue = serialize(value);
        storage.setItem(key, serializedValue);
      } catch (error) {
        console.error(`Failed to serialize value for atom ${key}:`, error);
      }
    });
  };
}

/**
 * Predefined localStorage storage implementation.
 */
export const localStorageStorage: PersistStorage = {
  getItem: (key) => typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null,
  setItem: (key, value) => typeof localStorage !== 'undefined' && localStorage.setItem(key, value),
  removeItem: (key) => typeof localStorage !== 'undefined' && localStorage.removeItem(key),
};

/**
 * Predefined sessionStorage storage implementation.
 */
export const sessionStorageStorage: PersistStorage = {
  getItem: (key) => typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null,
  setItem: (key, value) => typeof sessionStorage !== 'undefined' && sessionStorage.setItem(key, value),
  removeItem: (key) => typeof sessionStorage !== 'undefined' && sessionStorage.removeItem(key),
};