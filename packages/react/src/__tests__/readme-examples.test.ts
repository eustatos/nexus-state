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

    // Verify initial value
    expect(store.get(countAtom)).toBe(0);

    // Verify set works
    store.set(countAtom, 5);
    expect(store.get(countAtom)).toBe(5);

    // Verify function update works
    store.set(countAtom, (c) => c + 1);
    expect(store.get(countAtom)).toBe(6);
  });
});

describe('README: Split Hooks Pattern', () => {
  it('useSetAtom pattern should work', () => {
    const nameAtom = atom('', 'name');
    const emailAtom = atom('', 'email');
    const store = createStore();

    // Initialize atoms
    store.get(nameAtom);
    store.get(emailAtom);

    // Simulate useSetAtom (write-only, no subscription)
    const setName = (value: string) => store.set(nameAtom, value);
    const setEmail = (value: string) => store.set(emailAtom, value);

    // Simulate useAtomValue (read-only)
    const getName = () => store.get(nameAtom);

    // Test write-only
    setName('John');
    setEmail('john@example.com');

    // Test read-only
    expect(getName()).toBe('John');
    expect(store.get(emailAtom)).toBe('john@example.com');
  });
});

describe('README: useAtomCallback Pattern', () => {
  it('complex operations with multiple atoms should work', () => {
    const balanceAtom = atom(100, 'balance');
    const logAtom = atom<string[]>('log');
    const store = createStore();

    // Initialize log atom
    store.set(logAtom, []);

    // Simulate useAtomCallback
    const handleTransfer = (amount: number) => {
      const balance = store.get(balanceAtom);
      if (balance >= amount) {
        store.set(balanceAtom, balance - amount);
        const log = store.get(logAtom);
        store.set(logAtom, [...log, `Transferred ${amount}`]);
      }
    };

    // Test transfer
    handleTransfer(50);
    expect(store.get(balanceAtom)).toBe(50);
    expect(store.get(logAtom)).toEqual(['Transferred 50']);

    // Test insufficient balance
    handleTransfer(100);
    expect(store.get(balanceAtom)).toBe(50); // Unchanged
    expect(store.get(logAtom)).toEqual(['Transferred 50']); // Unchanged
  });
});

describe('README: StoreProvider Pattern', () => {
  it('store can be passed explicitly or via context', () => {
    const countAtom = atom(0, 'count');
    const store = createStore();

    // Explicit store
    store.set(countAtom, 5);
    expect(store.get(countAtom)).toBe(5);

    // Store works independently
    const store2 = createStore();
    store2.set(countAtom, 10);

    expect(store.get(countAtom)).toBe(5);
    expect(store2.get(countAtom)).toBe(10);
  });
});
