// Persist plugin for nexus-state
import { Atom, Store } from '@nexus-state/core';

export type PersistStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export type PersistConfig<T> = {
  key: string;
  storage: PersistStorage;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
};

export function persist<T>(atom: Atom<T>, config: PersistConfig<T>): (store: Store) => void {
  return (store: Store) => {
    const { key, storage, serialize = JSON.stringify, deserialize = JSON.parse } = config;
    
    // Попытка восстановить значение из хранилища
    const savedValue = storage.getItem(key);
    if (savedValue !== null) {
      try {
        const deserializedValue = deserialize(savedValue);
        store.set(atom, deserializedValue);
      } catch (error) {
        console.error(`Failed to deserialize persisted value for atom ${key}:`, error);
      }
    }

    // Подписка на изменения атома для сохранения в хранилище
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

// Предопределенные хранилища
export const localStorageStorage: PersistStorage = {
  getItem: (key) => typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null,
  setItem: (key, value) => typeof localStorage !== 'undefined' && localStorage.setItem(key, value),
  removeItem: (key) => typeof localStorage !== 'undefined' && localStorage.removeItem(key),
};

export const sessionStorageStorage: PersistStorage = {
  getItem: (key) => typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null,
  setItem: (key, value) => typeof sessionStorage !== 'undefined' && sessionStorage.setItem(key, value),
  removeItem: (key) => typeof sessionStorage !== 'undefined' && sessionStorage.removeItem(key),
};