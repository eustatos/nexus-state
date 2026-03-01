// Tests for @nexus-state/async
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { atomWithAsync, asyncAtom } from '../index';

// Type definitions
type AsyncAtomData<T> = {
  loading: boolean;
  error: Error | null;
  data: T | null;
};

// Mock fetch for testing
const mockFetch = vi.fn();

global.fetch = mockFetch as any;

describe('asyncAtom', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    mockFetch.mockReset();
  });

  it('should create an async atom with initial state', () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => 'test data',
      initialValue: null,
    });

    const value = store.get(asyncAtomInstance);
    
    expect(value).toEqual({
      loading: false,
      error: null,
      data: null,
    });
    expect(value.loading).toBe(false);
  });

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    mockFetch.mockResolvedValue({
      json: async () => mockData,
    });

    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async (store: any) => {
        const response = await fetch('/api/test');
        return response.json();
      },
      initialValue: null,
    });

    // Initial state
    expect(store.get(asyncAtomInstance).data).toBeNull();

    // Fetch data
    await fetchFn(store);

    // Check updated state
    const value = store.get(asyncAtomInstance);
    expect(value).toEqual({
      loading: false,
      error: null,
      data: mockData,
    });
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Fetch failed');
    mockFetch.mockRejectedValue(error);

    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => {
        throw error;
      },
      initialValue: null,
    });

    await fetchFn(store);

    const value = store.get(asyncAtomInstance);
    expect(value).toEqual({
      loading: false,
      error: error,
      data: null,
    });
  });

  it('should update loading state during fetch', async () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'data';
      },
      initialValue: null,
    });

    const unsubscribe = store.subscribe(asyncAtomInstance, (value) => {
      if (value.loading) {
        expect(value.data).toBeNull();
        expect(value.error).toBeNull();
      }
    });

    await fetchFn(store);
    unsubscribe();
  });

  it('should handle custom initial value', () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => 'new data',
      initialValue: 'initial',
    });

    const value = store.get(asyncAtomInstance);
    expect(value).toEqual({
      loading: false,
      error: null,
      data: 'initial',
    });
  });
});

describe('atomWithAsync', () => {
  it('should extend atom function with async method', () => {
    const [asyncAtomInstance, fetchFn] = atomWithAsync.async({
      fetchFn: async () => 'test',
      initialValue: null,
    });

    expect(asyncAtomInstance).toBeDefined();
    expect(fetchFn).toBeDefined();
  });
});

describe('integration with core', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should work with computed atoms', async () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => 10,
      initialValue: 0,
    });

    const doubleAtom = atom((get: any) => get(asyncAtomInstance).data * 2);

    await fetchFn(store);

    expect(store.get(doubleAtom)).toBe(20);
  });

  it('should work with multiple async atoms', async () => {
    const [atom1, fetch1] = asyncAtom({
      fetchFn: async () => 'A',
      initialValue: null,
    });

    const [atom2, fetch2] = asyncAtom({
      fetchFn: async () => 'B',
      initialValue: null,
    });

    await Promise.all([fetch1(store), fetch2(store)]);

    expect(store.get(atom1).data).toBe('A');
    expect(store.get(atom2).data).toBe('B');
  });
});

describe('fetch function behavior', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    mockFetch.mockReset();
  });

  it('should preserve data on error', async () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => {
        throw new Error('Failed');
      },
      initialValue: 'initial data',
    });

    const value1 = store.get(asyncAtomInstance);
    expect(value1.data).toBe('initial data');

    await fetchFn(store);

    const value2 = store.get(asyncAtomInstance);
    expect(value2.data).toBe('initial data');
    expect(value2.error).toBeInstanceOf(Error);
    expect(value2.error?.message).toBe('Failed');
  });

  it('should handle fetch called multiple times sequentially', async () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async (store: any) => {
        const asyncValue = store.get(asyncAtomInstance) as AsyncAtomData<number>;
        const count = (asyncValue.data || 0) as number;
        return count + 1;
      },
      initialValue: 0,
    });

    await fetchFn(store);
    expect(store.get(asyncAtomInstance).data).toBe(1);

    await fetchFn(store);
    expect(store.get(asyncAtomInstance).data).toBe(2);
  });

  it('should handle async function that returns null', async () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => null,
      initialValue: 'initial',
    });

    await fetchFn(store);

    const value = store.get(asyncAtomInstance);
    expect(value.loading).toBe(false);
    expect(value.data).toBeNull();
  });

  it('should handle fetch function that throws string error', async () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => {
        throw 'string error';
      },
      initialValue: null,
    });

    await fetchFn(store);

    const value = store.get(asyncAtomInstance);
    expect(value.loading).toBe(false);
    expect(value.error).toBeInstanceOf(Error);
    expect(value.error?.message).toBe('string error');
  });
});

describe('subscription patterns', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should subscribe to loading state changes', async () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'data';
      },
      initialValue: null,
    });

    const loadingChanges: boolean[] = [];
    const unsubscribe = store.subscribe(asyncAtomInstance, (value) => {
      loadingChanges.push(value.loading);
    });

    await fetchFn(store);
    unsubscribe();

    expect(loadingChanges).toContain(true);
    expect(loadingChanges).toContain(false);
  });

  it('should subscribe to error state changes', async () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => {
        throw new Error('Test error');
      },
      initialValue: null,
    });

    const errorStates: Array<Error | null> = [];
    const unsubscribe = store.subscribe(asyncAtomInstance, (value) => {
      errorStates.push(value.error);
    });

    await fetchFn(store);
    unsubscribe();

    expect(errorStates).toContain(null);
    expect(errorStates.some(e => e instanceof Error)).toBe(true);
  });

  it('should unsubscribe properly', async () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => 'data',
      initialValue: null,
    });

    let callCount = 0;
    const unsubscribe = store.subscribe(asyncAtomInstance, () => {
      callCount++;
    });

    unsubscribe();
    await fetchFn(store);

    expect(callCount).toBe(0);
  });
});

describe('complex async scenarios', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should handle async atom with multiple dependencies', async () => {
    const baseAtom1 = atom(10);
    const baseAtom2 = atom(20);

    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async (store) => {
        const val1 = store.get(baseAtom1);
        const val2 = store.get(baseAtom2);
        return val1 + val2;
      },
      initialValue: 0,
    });

    await fetchFn(store);
    expect(store.get(asyncAtomInstance).data).toBe(30);
  });

  it('should handle async atom in computed chain', async () => {
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => 5,
      initialValue: 0,
    });

    const doubledAtom = atom((get: any) => get(asyncAtomInstance).data * 2);
    const stringAtom = atom((get: any) => String(get(doubledAtom)));

    await fetchFn(store);

    expect(store.get(doubledAtom)).toBe(10);
    expect(store.get(stringAtom)).toBe('10');
  });

  it('should handle nested async atoms', async () => {
    const [innerAtom, fetchInner] = asyncAtom({
      fetchFn: async () => 10,
      initialValue: 0,
    });

    const [outerAtom, fetchOuter] = asyncAtom({
      fetchFn: async (store) => {
        const innerData = store.get(innerAtom).data;
        return (innerData as number) * 2;
      },
      initialValue: 0,
    });

    await fetchInner(store);
    await fetchOuter(store);

    expect(store.get(outerAtom).data).toBe(20);
  });
});

describe('type safety', () => {
  it('should maintain type inference for string async atom', async () => {
    const store = createStore();
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => 'string',
      initialValue: null,
    });

    await fetchFn(store);
    const value = store.get(asyncAtomInstance);
    expect(value.data).toBeTypeOf('string');
  });

  it('should maintain type inference for number async atom', async () => {
    const store = createStore();
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => 42,
      initialValue: null,
    });

    await fetchFn(store);
    const value = store.get(asyncAtomInstance);
    expect(value.data).toBeTypeOf('number');
  });

  it('should maintain type inference for object async atom', async () => {
    const store = createStore();
    interface User {
      id: number;
      name: string;
    }

    const user: User = { id: 1, name: 'Test' };
    const [asyncAtomInstance, fetchFn] = asyncAtom({
      fetchFn: async () => user,
      initialValue: null,
    });

    await fetchFn(store);
    const value = store.get(asyncAtomInstance);
    expect(value.data).toEqual(user);
  });
});
