// Tests for @nexus-state/persist
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { persist, localStorageStorage, sessionStorageStorage } from '../index';

// Mock storage for testing
interface MockStorage {
  [key: string]: string;
}

let mockStorage: MockStorage;
let store: ReturnType<typeof createStore>;

beforeEach(() => {
  mockStorage = {};
  store = createStore();
  
  // Override localStorage and sessionStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    },
    writable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    },
    writable: true,
  });
});

describe('persist', () => {
  it('should persist atom value to storage', () => {
    const countAtom = atom(0, 'count');
    const cleanup = persist(countAtom, {
      key: 'count',
      storage: localStorageStorage,
    });

    cleanup(store);

    // Set value
    store.set(countAtom, 42);

    // Check storage
    expect(localStorage.getItem('count')).toBe('42');
  });

  it('should restore atom value from storage', () => {
    const countAtom = atom(0, 'count');
    
    // Pre-populate storage
    localStorage.setItem('count', '100');

    const cleanup = persist(countAtom, {
      key: 'count',
      storage: localStorageStorage,
    });

    cleanup(store);

    // Check restored value
    expect(store.get(countAtom)).toBe(100);
  });

  it('should use custom serialization', () => {
    const objAtom = atom({ value: 42 }, 'obj');
    
    const cleanup = persist(objAtom, {
      key: 'obj',
      storage: localStorageStorage,
      serialize: (value) => JSON.stringify({ custom: value.value }),
      deserialize: (str) => ({ value: JSON.parse(str).custom }),
    });

    cleanup(store);

    store.set(objAtom, { value: 99 });
    
    expect(localStorage.getItem('obj')).toBe('{"custom":99}');

    // Restore with different value
    localStorage.setItem('obj', '{"custom":200}');
    const store2 = createStore();
    cleanup(store2);
    
    expect(store2.get(objAtom)).toEqual({ value: 200 });
  });

  it('should handle deserialization errors gracefully', () => {
    const countAtom = atom(0, 'count');
    
    // Invalid JSON in storage
    localStorage.setItem('count', 'not-json');

    const cleanup = persist(countAtom, {
      key: 'count',
      storage: localStorageStorage,
    });

    cleanup(store);

    // Should use default value
    expect(store.get(countAtom)).toBe(0);
  });

  it('should update storage on atom changes', () => {
    const countAtom = atom(0, 'count');
    const cleanup = persist(countAtom, {
      key: 'count',
      storage: localStorageStorage,
    });

    cleanup(store);

    // Multiple updates
    store.set(countAtom, 10);
    expect(localStorage.getItem('count')).toBe('10');

    store.set(countAtom, 20);
    expect(localStorage.getItem('count')).toBe('20');

    store.set(countAtom, (prev) => prev + 5);
    expect(localStorage.getItem('count')).toBe('25');
  });

  it('should work with complex objects', () => {
    const userAtom = atom(
      { name: 'John', age: 30, active: true },
      'user'
    );

    const cleanup = persist(userAtom, {
      key: 'user',
      storage: localStorageStorage,
    });

    cleanup(store);

    store.set(userAtom, { name: 'Jane', age: 25, active: false });

    const stored = JSON.parse(localStorage.getItem('user')!);
    expect(stored).toEqual({ name: 'Jane', age: 25, active: false });
  });
});

describe('localStorageStorage', () => {
  it('should use localStorage when available', () => {
    const testAtom = atom('test', 'test');

    const cleanup = persist(testAtom, {
      key: 'test',
      storage: localStorageStorage,
    });

    cleanup(store);
    store.set(testAtom, 'value');

    // JSON.stringify adds quotes around strings, so we expect '"value"'
    expect(localStorage.getItem('test')).toBe('"value"');
  });

  it('should handle undefined localStorage', () => {
    // Temporarily remove localStorage
    const originalLocalStorage = window.localStorage;
    // @ts-expect-error - delete localStorage for testing
    delete window.localStorage;

    const testAtom = atom('test', 'test2');
    const storage = localStorageStorage;

    expect(storage.getItem('test')).toBeNull();
    storage.setItem('test', 'value');
    // localStorage should be undefined, so setItem should not throw
    // (in our implementation it just returns early)

    // Restore
    // @ts-expect-error - restore localStorage
    window.localStorage = originalLocalStorage;
  });
});

describe('sessionStorageStorage', () => {
  it('should use sessionStorage when available', () => {
    const testAtom = atom('test', 'test-session');

    const cleanup = persist(testAtom, {
      key: 'test-session',
      storage: sessionStorageStorage,
    });

    cleanup(store);
    store.set(testAtom, 'session-value');

    // JSON.stringify adds quotes around strings, so we expect '"session-value"'
    expect(sessionStorage.getItem('test-session')).toBe('"session-value"');
  });

  it('should handle undefined sessionStorage', () => {
    const originalSessionStorage = window.sessionStorage;
    // @ts-expect-error - delete sessionStorage for testing
    delete window.sessionStorage;

    const storage = sessionStorageStorage;

    expect(storage.getItem('test')).toBeNull();
    storage.setItem('test', 'value');

    // Restore
    // @ts-expect-error - restore sessionStorage
    window.sessionStorage = originalSessionStorage;
  });
});

describe('integration with core', () => {
  it('should work with computed atoms', () => {
    const baseAtom = atom(10, 'base');
    const doubleAtom = atom((get: any) => get(baseAtom) * 2, 'double');

    const cleanupBase = persist(baseAtom, {
      key: 'base',
      storage: localStorageStorage,
    });

    const cleanupDouble = persist(doubleAtom, {
      key: 'double',
      storage: localStorageStorage,
    });

    const cleanupFns = [cleanupBase, cleanupDouble];
    cleanupFns.forEach(fn => fn(store));

    store.set(baseAtom, 20);
    expect(store.get(doubleAtom)).toBe(40);

    // Check both are persisted
    expect(localStorage.getItem('base')).toBe('20');
    expect(localStorage.getItem('double')).toBe('40');
  });

  it('should work with multiple atoms', () => {
    const atom1 = atom(1, 'atom1');
    const atom2 = atom(2, 'atom2');
    const atom3 = atom(3, 'atom3');

    persist(atom1, { key: 'a1', storage: localStorageStorage })(store);
    persist(atom2, { key: 'a2', storage: localStorageStorage })(store);
    persist(atom3, { key: 'a3', storage: localStorageStorage })(store);

    store.set(atom1, 10);
    store.set(atom2, 20);
    store.set(atom3, 30);

    expect(localStorage.getItem('a1')).toBe('10');
    expect(localStorage.getItem('a2')).toBe('20');
    expect(localStorage.getItem('a3')).toBe('30');
  });
});
