/**
 * Tests for README examples
 *
 * Purpose:
 * - Verify all code examples in README work correctly
 * - Detect broken API usage before publication
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { atomRegistry } from '@nexus-state/core';
import { asyncAtom } from '@nexus-state/async';

describe('README: Quick Start', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('asyncAtom pattern should work', async () => {
    const store = createStore();

    // Create async atom (as shown in README)
    const userId = 123;
    const [userAtom, fetchUser] = asyncAtom({
      fetchFn: async (store) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 10));
        return { id: userId, name: 'John' };
      },
      initialValue: null,
    });

    // Initial state
    const initialState = store.get(userAtom);
    expect(initialState).toEqual({
      loading: false,
      error: null,
      data: null,
    });

    // Fetch data
    await fetchUser(store);

    // Check state after fetch
    const state = store.get(userAtom);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.data).toEqual({ id: userId, name: 'John' });
  });
});

describe('README: State Shape', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('AsyncState shape should work', async () => {
    const store = createStore();

    const [dataAtom, fetchData] = asyncAtom({
      fetchFn: async () => 'Success!',
      initialValue: null,
    });

    // Initial state
    expect(store.get(dataAtom)).toEqual({
      loading: false,
      error: null,
      data: null,
    });

    // During loading (manually set for testing)
    store.set(dataAtom, {
      loading: true,
      error: null,
      data: null,
    });
    expect(store.get(dataAtom).loading).toBe(true);

    // After success
    await fetchData(store);
    expect(store.get(dataAtom).data).toBe('Success!');
  });
});

describe('README: Integration with Core', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('computed atom from async data should work', async () => {
    const store = createStore();

    // Create async atom
    const [userAtom, fetchUser] = asyncAtom({
      fetchFn: async () => ({ id: 1, name: 'John' }),
      initialValue: null,
    });

    // Computed atom from async data
    const userNameAtom = atom((get) => {
      const userState = get(userAtom);
      return userState.data?.name ?? 'Loading...';
    });

    // Initial state (loading)
    expect(store.get(userNameAtom)).toBe('Loading...');

    // After data loads
    await fetchUser(store);
    expect(store.get(userNameAtom)).toBe('John');
  });

  it('multiple async atoms should work', async () => {
    const store = createStore();

    const [userAtom, fetchUser] = asyncAtom({
      fetchFn: async () => ({ id: 1 }),
      initialValue: null,
    });

    const [postsAtom, fetchPosts] = asyncAtom({
      fetchFn: async () => ['Post 1', 'Post 2'],
      initialValue: [],
    });

    // Initial state
    expect(store.get(userAtom).data).toBeNull();
    expect(store.get(postsAtom).data).toEqual([]);

    // Fetch both in parallel
    await Promise.all([
      fetchUser(store),
      fetchPosts(store),
    ]);

    expect(store.get(userAtom).data).toEqual({ id: 1 });
    expect(store.get(postsAtom).data).toEqual(['Post 1', 'Post 2']);
  });
});

describe('README: Error Handling', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('error handling pattern should work', async () => {
    const store = createStore();

    const [dataAtom, fetchData] = asyncAtom({
      fetchFn: async () => {
        throw new Error('Failed to fetch');
      },
      initialValue: null,
    });

    // Fetch with error
    await fetchData(store);

    const state = store.get(dataAtom);
    expect(state.loading).toBe(false);
    expect(state.error).toBeInstanceOf(Error);
    expect(state.error?.message).toBe('Failed to fetch');
    expect(state.data).toBeNull();
  });

  it('retry logic pattern should work', async () => {
    const store = createStore();

    let attempts = 0;
    const [dataAtom, fetchData] = asyncAtom({
      fetchFn: async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return 'Success!';
      },
      initialValue: null,
    });

    // First attempt fails
    await fetchData(store);
    expect(store.get(dataAtom).error).toBeInstanceOf(Error);

    // Second attempt fails
    await fetchData(store);
    expect(store.get(dataAtom).error).toBeInstanceOf(Error);

    // Third attempt succeeds
    await fetchData(store);
    expect(store.get(dataAtom).data).toBe('Success!');
    expect(store.get(dataAtom).error).toBeNull();
    expect(attempts).toBe(3);
  });
});

describe('README: Async vs Query Decision', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('simple fetch (async) should work without caching', async () => {
    const store = createStore();

    const [dataAtom, fetchData] = asyncAtom({
      fetchFn: async () => 'Result',
      initialValue: null,
    });

    // One-time fetch
    await fetchData(store);

    expect(store.get(dataAtom).data).toBe('Result');
    expect(store.get(dataAtom).loading).toBe(false);
    expect(store.get(dataAtom).error).toBeNull();
  });
});
