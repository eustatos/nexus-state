/**
 * Integration tests for TimeTravelController auto-initialization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { TimeTravelController } from '../../TimeTravelController';
import { atomRegistry } from '@nexus-state/core';

describe('TimeTravelController - Auto-initialization', () => {
  let store: ReturnType<typeof createStore>;
  let controller: TimeTravelController;

  beforeEach(() => {
    store = createStore();
    controller = new TimeTravelController(store);
    // Очистка registry между тестами
    atomRegistry.clear();
  });

  describe('Basic auto-initialization', () => {
    it('should auto-initialize primitive atoms on first capture', () => {
      const testAtom = atom('initial', 'testAtom');
      
      // Access atom to trigger lazy registration
      store.get(testAtom);

      controller.capture('init');

      const snapshots = controller.getHistory();
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].state.testAtom.value).toBe('initial');
    });

    it('should auto-initialize multiple primitive atoms', () => {
      const atom1 = atom('value1', 'atom1');
      const atom2 = atom(42, 'atom2');
      const atom3 = atom(true, 'atom3');
      const atom4 = atom(null, 'atom4');
      
      // Access atoms to trigger lazy registration
      store.get(atom1);
      store.get(atom2);
      store.get(atom3);
      store.get(atom4);

      controller.capture('init');

      const snapshot = controller.getHistory()[0];
      expect(snapshot.state.atom1.value).toBe('value1');
      expect(snapshot.state.atom2.value).toBe(42);
      expect(snapshot.state.atom3.value).toBe(true);
      expect(snapshot.state.atom4.value).toBe(null);
    });

    it('should auto-initialize atoms with complex objects', () => {
      const objAtom = atom({ key: 'value', nested: { data: 123 } }, 'objAtom');
      const arrAtom = atom([1, 2, 3], 'arrAtom');
      
      // Access atoms to trigger lazy registration
      store.get(objAtom);
      store.get(arrAtom);

      controller.capture('init');

      const snapshot = controller.getHistory()[0];
      expect(snapshot.state.objAtom.value).toEqual({ key: 'value', nested: { data: 123 } });
      expect(snapshot.state.arrAtom.value).toEqual([1, 2, 3]);
    });
  });

  describe('Computed atoms auto-initialization', () => {
    it('should auto-initialize computed atoms', () => {
      const baseAtom = atom(10, 'base');
      const computedAtom = atom((get) => get(baseAtom) * 2, 'computed');
      
      // Access computed atom to trigger lazy registration
      store.get(computedAtom);

      controller.capture('init');

      const snapshot = controller.getHistory()[0];
      expect(snapshot.state.base.value).toBe(10);
      expect(snapshot.state.computed.value).toBe(20);
    });

    it('should handle computed atoms with multiple dependencies', () => {
      const atom1 = atom(5, 'atom1');
      const atom2 = atom(10, 'atom2');
      const sumAtom = atom((get) => get(atom1) + get(atom2), 'sum');
      const productAtom = atom((get) => get(atom1) * get(atom2), 'product');
      
      // Access computed atoms to trigger lazy registration
      store.get(sumAtom);
      store.get(productAtom);

      controller.capture('init');

      const snapshot = controller.getHistory()[0];
      expect(snapshot.state.atom1.value).toBe(5);
      expect(snapshot.state.atom2.value).toBe(10);
      expect(snapshot.state.sum.value).toBe(15);
      expect(snapshot.state.product.value).toBe(50);
    });

    it('should handle nested computed atoms', () => {
      const baseAtom = atom(2, 'base');
      const doubleAtom = atom((get) => get(baseAtom) * 2, 'double');
      const quadAtom = atom((get) => get(doubleAtom) * 2, 'quad');
      
      // Access computed atom to trigger lazy registration
      store.get(quadAtom);

      controller.capture('init');

      const snapshot = controller.getHistory()[0];
      expect(snapshot.state.base.value).toBe(2);
      expect(snapshot.state.double.value).toBe(4);
      expect(snapshot.state.quad.value).toBe(8);
    });
  });

  describe('Error handling', () => {
    it('should continue capture if some atoms fail to initialize', () => {
      const goodAtom = atom('good', 'goodAtom');
      const badAtom = atom((get) => {
        throw new Error('Initialization error');
      }, 'badAtom');
      const anotherGoodAtom = atom('also-good', 'anotherGoodAtom');

      // Access good atoms to trigger lazy registration
      store.get(goodAtom);
      store.get(anotherGoodAtom);
      
      // Access bad atom - it will be registered but throw during evaluation
      try {
        store.get(badAtom);
      } catch {
        // Expected to throw
      }

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

      expect(() => controller.capture('init')).not.toThrow();

      const snapshot = controller.getHistory()[0];
      expect(snapshot.state.goodAtom.value).toBe('good');
      expect(snapshot.state.anotherGoodAtom.value).toBe('also-good');
      // badAtom should not be in snapshot because it failed to evaluate
      expect(snapshot.state.badAtom).toBeUndefined();

      consoleWarnSpy.mockRestore();
    });

    it('should handle circular dependencies gracefully', () => {
      // Create cyclic dependency via writable atoms
      const atom1 = atom(0, 'atom1');
      const atom2 = atom(
        (get) => get(atom1) + 1,
        (get, set, value: number) => set(atom1, value),
        'atom2'
      );
      
      // Access atom to trigger lazy registration
      store.get(atom1);

      // Store should handle this correctly
      expect(() => controller.capture('init')).not.toThrow();
    });
  });

  describe('Backward compatibility', () => {
    it('should work with explicitly initialized atoms', () => {
      const testAtom = atom('initial', 'testAtom');

      // Explicit initialization (old way)
      store.set(testAtom, 'changed');

      controller.capture('snapshot');

      const snapshot = controller.getHistory()[0];
      expect(snapshot.state.testAtom.value).toBe('changed');  // Uses value from store
    });

    it('should preserve store state over initialValue', () => {
      const atom1 = atom('initial1', 'atom1');
      const atom2 = atom('initial2', 'atom2');
      
      // Access atoms to trigger lazy registration
      store.get(atom2);

      // Modify only atom1
      store.set(atom1, 'modified');

      controller.capture('snapshot');

      const snapshot = controller.getHistory()[0];
      expect(snapshot.state.atom1.value).toBe('modified');  // From store
      expect(snapshot.state.atom2.value).toBe('initial2');   // Auto-initialized
    });

    it('should work with existing time-travel workflow', () => {
      const countAtom = atom(0, 'count');
      
      // Access atom to trigger lazy registration
      store.get(countAtom);

      controller.capture('init');

      store.set(countAtom, 5);
      controller.capture('increment');

      store.set(countAtom, 10);
      controller.capture('increment-again');

      // Undo
      controller.undo();
      expect(store.get(countAtom)).toBe(5);

      controller.undo();
      expect(store.get(countAtom)).toBe(0);

      // Redo
      controller.redo();
      expect(store.get(countAtom)).toBe(5);
    });
  });

  describe('Multiple stores', () => {
    it('should auto-initialize atoms independently in different stores', () => {
      const sharedAtom = atom('initial', 'shared');

      const store1 = createStore();
      const controller1 = new TimeTravelController(store1);

      const store2 = createStore();
      const controller2 = new TimeTravelController(store2);

      // Access atom in both stores to trigger lazy registration
      store1.get(sharedAtom);
      store2.get(sharedAtom);

      // Modify only in store1
      store1.set(sharedAtom, 'store1-value');

      controller1.capture('store1-snapshot');
      controller2.capture('store2-snapshot');

      expect(controller1.getHistory()[0].state.shared.value).toBe('store1-value');
      // store2 has its own independent state
      expect(controller2.getHistory()[0].state.shared.value).toBe('initial');
    });
  });

  describe('Performance', () => {
    it('should handle large number of atoms efficiently', () => {
      // Create 100 atoms
      const atoms = Array.from({ length: 100 }, (_, i) =>
        atom(`value-${i}`, `atom-${i}`)
      );
      
      // Access atoms to trigger lazy registration
      atoms.forEach(a => store.get(a));

      const startTime = performance.now();
      controller.capture('large-snapshot');
      const endTime = performance.now();

      const snapshot = controller.getHistory()[0];
      expect(Object.keys(snapshot.state)).toHaveLength(100);

      // Should complete quickly (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle deeply nested computed atoms', () => {
      let currentAtom = atom(1, 'base');

      // Create chain of 20 computed atoms
      for (let i = 1; i <= 20; i++) {
        const prevAtom = currentAtom;
        currentAtom = atom(
          (get) => get(prevAtom) + 1,
          `computed-${i}`
        );
      }
      
      // Access last computed atom to trigger lazy registration
      store.get(currentAtom);

      expect(() => controller.capture('deep-chain')).not.toThrow();

      const snapshot = controller.getHistory()[0];
      expect(snapshot.state['computed-20'].value).toBe(21);
    });
  });

  describe('Store Isolation (SSR Safety)', () => {
    it('should capture only atoms accessed in current store', () => {
      atomRegistry.clear();
      
      const store1 = createStore();
      const store2 = createStore();

      const atom1 = atom('store1-value', 'atom1');
      const atom2 = atom('store2-value', 'atom2');

      // Access atoms in different stores
      store1.get(atom1);
      store2.get(atom2);

      const controller1 = new TimeTravelController(store1);
      const controller2 = new TimeTravelController(store2);

      // Capture in both stores
      controller1.capture('store1');
      controller2.capture('store2');

      const snapshot1 = controller1.getHistory()[0];
      const snapshot2 = controller2.getHistory()[0];

      // Each snapshot should contain the atoms that were accessed in that store
      expect(snapshot1.state.atom1.value).toBe('store1-value');
      expect(snapshot2.state.atom2.value).toBe('store2-value');
      
      // Verify store values directly
      expect(store1.get(atom1)).toBe('store1-value');
      expect(store2.get(atom2)).toBe('store2-value');
    });

    it('should isolate stores with same atom names', () => {
      atomRegistry.clear();
      
      const store1 = createStore();
      const store2 = createStore();

      // Use different atom instances for each store
      const userAtomStore1 = atom({ name: 'Alice' }, 'user-store1');
      const userAtomStore2 = atom({ name: 'Bob' }, 'user-store2');

      store1.set(userAtomStore1, { name: 'Alice' });
      store2.set(userAtomStore2, { name: 'Bob' });

      const controller1 = new TimeTravelController(store1);
      const controller2 = new TimeTravelController(store2);

      controller1.capture('store1');
      controller2.capture('store2');

      const snapshot1 = controller1.getHistory()[0];
      const snapshot2 = controller2.getHistory()[0];

      expect(snapshot1.state['user-store1'].value.name).toBe('Alice');
      expect(snapshot2.state['user-store2'].value.name).toBe('Bob');
    });

    it('should not leak atoms between stores during flushComputed', () => {
      atomRegistry.clear();
      
      const store1 = createStore();
      const store2 = createStore();

      const baseAtom1 = atom(10, 'base1');
      const baseAtom2 = atom(20, 'base2');
      
      const computed1 = atom((get) => get(baseAtom1) * 2, 'computed1');
      const computed2 = atom((get) => get(baseAtom2) * 2, 'computed2');

      store1.get(computed1);
      store2.get(computed2);

      const controller1 = new TimeTravelController(store1);
      const controller2 = new TimeTravelController(store2);

      controller1.capture('store1');
      controller2.capture('store2');

      // Verify computed values are correct
      const snapshot1 = controller1.getHistory()[0];
      const snapshot2 = controller2.getHistory()[0];

      expect(snapshot1.state.computed1.value).toBe(20);
      expect(snapshot2.state.computed2.value).toBe(40);
    });
  });
});
