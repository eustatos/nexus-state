/**
 * Benchmark: atomRegistry overhead vs state-in-atom
 * 
 * Compares current architecture (atomRegistry) with proposed state-in-atom approach.
 */

import { describe, bench } from 'vitest';
import { atom, createStore } from '../src/index';

// Simulate state-in-atom approach
function createStateInAtom<Value>(initialValue: Value, name?: string) {
  const stateAtom = {
    id: Symbol('state-atom'),
    name,
    state: { value: initialValue },
    read: () => stateAtom.state.value,
    write: (value: Value) => { stateAtom.state.value = value; },
    subscribe: (fn: (value: Value) => void) => {
      stateAtom.subscribers.add(fn);
      return () => stateAtom.subscribers.delete(fn);
    },
    notify: () => {
      stateAtom.subscribers.forEach(fn => fn(stateAtom.state.value));
    },
    subscribers: new Set<(value: Value) => void>(),
  };
  return stateAtom;
}

describe('atomRegistry Overhead Analysis', () => {
  // Current approach: atomRegistry lookup on every set()
  bench('current: set() with atomRegistry lookup', () => {
    const store = createStore();
    const a = atom(0);
    store.get(a); // Initialize
    
    for (let i = 0; i < 1000; i++) {
      store.set(a, i);
    }
  });

  // Proposed: state-in-atom (no registry lookup)
  bench('proposed: state-in-atom direct access', () => {
    const stateAtom = createStateInAtom(0);
    
    for (let i = 0; i < 1000; i++) {
      stateAtom.write(i);
    }
  });
});

describe('atomRegistry.getStoresMap() overhead', () => {
  // This is called on EVERY set() in current implementation
  bench('atomRegistry.getStoresMap() call', () => {
    const { atomRegistry } = require('../src/atom-registry');
    
    for (let i = 0; i < 1000; i++) {
      const storesMap = atomRegistry.getStoresMap();
      // Iterate over all stores
      for (const registry of storesMap.values()) {
        // Check if atom is registered
        registry.atoms.has(Symbol('test'));
      }
    }
  });

  // Direct Map access (what state-in-atom would use)
  bench('direct Map access', () => {
    const stateMap = new Map();
    const atom = { id: Symbol('test') };
    
    for (let i = 0; i < 1000; i++) {
      const state = stateMap.get(atom);
      if (!state) {
        stateMap.set(atom, { value: i });
      }
    }
  });
});

describe('Memory comparison', () => {
  bench('current: atomRegistry + store state', () => {
    const atoms = [];
    for (let i = 0; i < 100; i++) {
      atoms.push(atom(i, `atom-${i}`));
    }
    
    const store = createStore();
    atoms.forEach(a => store.get(a));
  });

  bench('proposed: state-in-atom only', () => {
    const atoms = [];
    for (let i = 0; i < 100; i++) {
      atoms.push(createStateInAtom(i, `atom-${i}`));
    }
    
    // No separate store needed
    atoms.forEach(a => a.read());
  });
});
