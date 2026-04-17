/**
 * Tests for README examples
 *
 * Purpose:
 * - Verify all code examples in README work correctly
 * - Detect broken API usage before publication
 */

import { describe, it, expect } from 'vitest';
import { atom, createStore } from '@nexus-state/core';

describe('README: Quick Start', () => {
  it('basic counter example should work', () => {
    const countAtom = atom(0, 'count');
    const store = createStore();

    // Verify initial value (Vue ref would unwrap to this)
    expect(store.get(countAtom)).toBe(0);

    // Verify set works
    store.set(countAtom, 5);
    expect(store.get(countAtom)).toBe(5);

    // Verify function update works
    store.set(countAtom, (c) => c + 1);
    expect(store.get(countAtom)).toBe(6);
  });
});

describe('README: Multiple Stores', () => {
  it('multiple stores should be independent', () => {
    const atom1 = atom(0, 'atom1');
    const atom2 = atom(0, 'atom2');

    const store1 = createStore();
    const store2 = createStore();

    store1.set(atom1, 10);
    store2.set(atom2, 20);

    expect(store1.get(atom1)).toBe(10);
    expect(store2.get(atom2)).toBe(20);
    expect(store1.get(atom2)).toBe(0); // Independent!
    expect(store2.get(atom1)).toBe(0); // Independent!
  });
});

describe('README: SSR with Isolated Stores', () => {
  it('setState for hydration should work', () => {
    const userAtom = atom(null, 'user');
    const store = createStore();

    // Initialize atom first
    store.get(userAtom);

    // Hydrate with server state
    store.setState({ user: { name: 'John' } });

    expect(store.get(userAtom)).toEqual({ name: 'John' });
  });

  it('multiple requests should have independent state', () => {
    const userAtom = atom({ name: 'Anonymous' }, 'user');

    // Simulate request 1
    const store1 = createStore();
    store1.set(userAtom, { name: 'User1' });

    // Simulate request 2
    const store2 = createStore();
    store2.set(userAtom, { name: 'User2' });

    // Verify independence
    expect(store1.get(userAtom)).toEqual({ name: 'User1' });
    expect(store2.get(userAtom)).toEqual({ name: 'User2' });
  });
});

describe('README: Vue Reactivity Integration', () => {
  it('computed atoms should work', () => {
    const countAtom = atom(0, 'count');
    const doubleAtom = atom((get) => get(countAtom) * 2, 'double');
    const store = createStore();

    // Initial value
    expect(store.get(doubleAtom)).toBe(0);

    // Update dependency
    store.set(countAtom, 5);

    // Computed should recalculate
    expect(store.get(doubleAtom)).toBe(10);
  });
});
