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

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

      expect(() => controller.capture('init')).not.toThrow();

      const snapshot = controller.getHistory()[0];
      expect(snapshot.state.goodAtom.value).toBe('good');
      expect(snapshot.state.anotherGoodAtom.value).toBe('also-good');
      expect(snapshot.state.badAtom).toBeUndefined();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize atom'),
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle circular dependencies gracefully', () => {
      // Создаём циклическую зависимость через writable atoms
      const atom1 = atom(0, 'atom1');
      const atom2 = atom(
        (get) => get(atom1) + 1,
        (get, set, value: number) => set(atom1, value),
        'atom2'
      );

      // Store должен обработать это корректно
      expect(() => controller.capture('init')).not.toThrow();
    });
  });

  describe('Backward compatibility', () => {
    it('should work with explicitly initialized atoms', () => {
      const testAtom = atom('initial', 'testAtom');

      // Явная инициализация (старый способ)
      store.set(testAtom, 'changed');

      controller.capture('snapshot');

      const snapshot = controller.getHistory()[0];
      expect(snapshot.state.testAtom.value).toBe('changed');  // Использует значение из store
    });

    it('should preserve store state over initialValue', () => {
      const atom1 = atom('initial1', 'atom1');
      const atom2 = atom('initial2', 'atom2');

      // Изменяем только atom1
      store.set(atom1, 'modified');

      controller.capture('snapshot');

      const snapshot = controller.getHistory()[0];
      expect(snapshot.state.atom1.value).toBe('modified');  // Из store
      expect(snapshot.state.atom2.value).toBe('initial2');   // Авто-инициализирован
    });

    it('should work with existing time-travel workflow', () => {
      const countAtom = atom(0, 'count');

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

      // Изменяем только в store1
      store1.set(sharedAtom, 'store1-value');

      controller1.capture('store1-snapshot');
      controller2.capture('store2-snapshot');

      expect(controller1.getHistory()[0].state.shared.value).toBe('store1-value');

      expect(controller2.getHistory()[0].state.shared.value).toBe('initial');  // Авто-инициализирован с initialValue
    });
  });

  describe('Performance', () => {
    it('should handle large number of atoms efficiently', () => {
      // Создаём 100 атомов
      const atoms = Array.from({ length: 100 }, (_, i) =>
        atom(`value-${i}`, `atom-${i}`)
      );

      const startTime = performance.now();
      controller.capture('large-snapshot');
      const endTime = performance.now();

      const snapshot = controller.getHistory()[0];
      expect(Object.keys(snapshot.state)).toHaveLength(100);

      // Должно выполниться быстро (< 1 секунды)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle deeply nested computed atoms', () => {
      let currentAtom = atom(1, 'base');

      // Создаём цепочку из 20 computed атомов
      for (let i = 1; i <= 20; i++) {
        const prevAtom = currentAtom;
        currentAtom = atom(
          (get) => get(prevAtom) + 1,
          `computed-${i}`
        );
      }

      expect(() => controller.capture('deep-chain')).not.toThrow();

      const snapshot = controller.getHistory()[0];
      expect(snapshot.state['computed-20'].value).toBe(21);
    });
  });
});
