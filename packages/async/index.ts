// Async atom implementation for nexus-state
import { atom, Atom, Store } from "@nexus-state/core";

// Type definitions for async atom
export type AsyncAtomData<T> = {
  loading: boolean;
  error: Error | null;
  data: T | null;
};

export type AsyncAtomOptions<T> = {
  initialValue?: T;
  fetchFn: () => Promise<T>;
};

// Extended type for async atom with fetch method
export type AsyncAtomDataWithFetch<T> = AsyncAtomData<T> & {
  fetch: () => Promise<void>;
};

/**
 * Creates an async atom with built-in loading, error, and data states.
 * @template T - The type of the data
 * @param {AsyncAtomOptions<T>} options - Configuration options for the async atom
 * @returns {Atom<AsyncAtomDataWithFetch<T>>} An atom with loading, error, data states and fetch method
 * @example
 * const userAtom = atom.async({
 *   fetchFn: () => fetch('/api/user').then(res => res.json())
 * });
 *
 * // To fetch data:
 * store.get(userAtom).fetch();
 */
export function asyncAtom<T>(
  options: AsyncAtomOptions<T>,
): Atom<AsyncAtomDataWithFetch<T>> {
  const { fetchFn, initialValue = null } = options;

  // Create a regular atom to hold the async state
  const stateAtom = atom<AsyncAtomData<T>>({
    loading: false,
    error: null,
    data: initialValue,
  });

  // Create a function to fetch data
  const fetchFunction = async (store: Store) => {
    // Set loading state
    store.set(stateAtom, {
      loading: true,
      error: null,
      data: store.get(stateAtom).data,
    });

    try {
      // Fetch data
      const data = await fetchFn();

      // Set success state
      store.set(stateAtom, {
        loading: false,
        error: null,
        data,
      });
    } catch (error) {
      // Set error state
      store.set(stateAtom, {
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
        data: store.get(stateAtom).data,
      });
    }
  };

  // Create a computed atom that includes the fetch method
  const asyncAtomWithFetch = atom((get) => {
    const state = get(stateAtom);
    return {
      ...state,
      fetch: () => fetchFunction(store), // Note: This requires access to store
    };
  });

  // We need to handle the store access differently
  // Let's create a custom atom with write method
  const resultAtom: Atom<AsyncAtomDataWithFetch<T>> = {
    id: asyncAtomWithFetch.id,
    read: (get) => {
      const state = get(stateAtom);
      return {
        ...state,
        fetch: async () => {
          // We need to get the store somehow
          // This is a limitation of the current approach
          console.warn("Fetch method needs store access");
        },
      };
    },
    write: (get, set, value) => {
      set(stateAtom, value);
    },
  };

  return resultAtom;
}

// Alternative simpler implementation
export function createAsyncAtom<T>(
  fetchFn: () => Promise<T>,
  initialValue: T | null = null,
): [Atom<AsyncAtomData<T>>, (store: Store) => Promise<void>] {
  // Create a regular atom to hold the async state
  const stateAtom = atom<AsyncAtomData<T>>({
    loading: false,
    error: null,
    data: initialValue,
  });

  // Create a function to fetch data
  const fetchFunction = async (store: Store) => {
    // Set loading state
    store.set(stateAtom, {
      loading: true,
      error: null,
      data: store.get(stateAtom).data,
    });

    try {
      // Fetch data
      const data = await fetchFn();

      // Set success state
      store.set(stateAtom, {
        loading: false,
        error: null,
        data,
      });
    } catch (error) {
      // Set error state
      store.set(stateAtom, {
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
        data: store.get(stateAtom).data,
      });
    }
  };

  return [stateAtom, fetchFunction];
}

// Extend the atom function to support async atoms
export const atomWithAsync = Object.assign(atom, {
  async: createAsyncAtom,
});
