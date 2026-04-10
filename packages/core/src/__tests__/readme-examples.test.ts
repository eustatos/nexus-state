/**
 * Tests for all code examples in README.md
 *
 * Purpose:
 * - Ensure examples use correct API
 * - Detect broken examples before publication
 * - Verify copy-paste works
 */

import { describe, it, expect } from 'vitest';
import { atom, createStore } from '../index';

describe('README: Quick Start', () => {
  it('basic example should work', () => {
    // Exact code from README Quick Start section
    const countAtom = atom(0, 'count');
    const store = createStore();

    expect(store.get(countAtom)).toBe(0);
    store.set(countAtom, 5);
    expect(store.get(countAtom)).toBe(5);
  });
});

describe('README: Architecture (Atoms vs Stores)', () => {
  it('one atom can have different values in different stores', () => {
    // Test key concept: atoms are descriptors, stores hold state
    const userAtom = atom({ name: 'Anonymous' }, 'user');

    const store1 = createStore();
    const store2 = createStore();

    // Same atom, different values
    store1.set(userAtom, { name: 'Alice' });
    store2.set(userAtom, { name: 'Bob' });

    expect(store1.get(userAtom)).toEqual({ name: 'Alice' });
    expect(store2.get(userAtom)).toEqual({ name: 'Bob' });
  });

  it('atom value is lazily initialized from atom.read() on first get', () => {
    // Test that store.get() initializes state from atom.read()
    const countAtom = atom(42, 'count');
    const store = createStore();

    // No store.set() needed - value comes from atom definition
    expect(store.get(countAtom)).toBe(42);
  });

  it('state is created on first get() not at createStore()', () => {
    const userAtom = atom({ name: 'Default' }, 'user');
    const store = createStore();

    // Before first get, state doesn't exist yet
    // After first get, state is initialized from atom.read()
    const value = store.get(userAtom);
    expect(value).toEqual({ name: 'Default' });
  });
});

describe('README: Isolated Stores (SSR)', () => {
  it('setState for hydration should work', () => {
    const store = createStore();
    const userAtom = atom(null, 'user');

    // Initialize atom first
    store.get(userAtom);

    // Test setState() method
    store.setState({ user: { name: 'John' } });
    expect(store.get(userAtom)).toEqual({ name: 'John' });
  });

  it('multiple stores are independent', () => {
    const userAtom = atom({ name: 'Anonymous' }, 'user');

    // Simulate two SSR requests
    const store1 = createStore();
    const store2 = createStore();

    // Request 1
    store1.set(userAtom, { name: 'User1' });

    // Request 2
    store2.set(userAtom, { name: 'User2' });

    // Verify independence
    expect(store1.get(userAtom)).toEqual({ name: 'User1' });
    expect(store2.get(userAtom)).toEqual({ name: 'User2' });
  });
});

describe('README: Time-Travel Per-Scope', () => {
  it('independent timelines should work', () => {
    // Note: This test verifies core API works
    // TimeTravelController tests are in time-travel package
    const storeA = createStore();
    const storeB = createStore();

    expect(storeA).toBeDefined();
    expect(storeB).toBeDefined();
    // Verify stores are independent
    expect(storeA).not.toBe(storeB);
  });

  it('stores can have independent states for same atom', () => {
    const countAtom = atom(0, 'count');

    const storeA = createStore();
    const storeB = createStore();

    storeA.set(countAtom, 10);
    storeB.set(countAtom, 20);

    expect(storeA.get(countAtom)).toBe(10);
    expect(storeB.get(countAtom)).toBe(20);
  });
});

describe('README: Testing Pattern', () => {
  it('fresh store per test should work', () => {
    const userAtom = atom(null, 'user');

    // Test 1
    const store1 = createStore();
    store1.set(userAtom, { id: 1, name: 'John' });
    expect(store1.get(userAtom)).toEqual({ id: 1, name: 'John' });

    // Test 2 - fresh store, clean state
    const store2 = createStore();
    store2.set(userAtom, { id: 2, name: 'Jane' });
    expect(store2.get(userAtom)).toEqual({ id: 2, name: 'Jane' });

    // Verify store1 is not affected
    expect(store1.get(userAtom)).toEqual({ id: 1, name: 'John' });
  });
});

describe('README: reset and clear methods', () => {
  it('reset should restore default value', () => {
    const countAtom = atom(0, 'count');
    const store = createStore();

    // Change value
    store.set(countAtom, 100);
    expect(store.get(countAtom)).toBe(100);

    // Reset to default
    store.reset(countAtom);
    expect(store.get(countAtom)).toBe(0);
  });

  it('clear should restore all default values', () => {
    const countAtom = atom(0, 'count');
    const userAtom = atom({ name: 'Anonymous' }, 'user');
    const store = createStore();

    // Change values
    store.set(countAtom, 100);
    store.set(userAtom, { name: 'John' });

    // Clear all
    store.clear();

    expect(store.get(countAtom)).toBe(0);
    expect(store.get(userAtom)).toEqual({ name: 'Anonymous' });
  });
});
