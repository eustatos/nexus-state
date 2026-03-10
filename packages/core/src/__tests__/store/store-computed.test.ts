/**
 * Store Computed Tests
 * Tests for computed atom evaluation and dependency tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore, atom } from '../../index';
import type { Getter } from '../../types';

describe('store computed evaluation', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('Basic Computed Evaluation', () => {
    it('should evaluate computed atom', () => {
      const baseAtom = atom(10);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);

      expect(store.get(doubleAtom)).toBe(20);
    });

    it('should evaluate computed atom with multiple dependencies', () => {
      const atom1 = atom(10);
      const atom2 = atom(20);
      const sumAtom = atom((get: Getter) => get(atom1) + get(atom2));

      expect(store.get(sumAtom)).toBe(30);
    });

    it('should evaluate nested computed atoms', () => {
      const baseAtom = atom(5);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);
      const tripleDoubleAtom = atom((get: Getter) => get(doubleAtom) * 3);

      expect(store.get(tripleDoubleAtom)).toBe(30);
    });
  });

  describe('Dependency Tracking', () => {
    it('should track dependencies on first get', () => {
      const baseAtom = atom(10);
      let computeCount = 0;
      const computedAtom = atom((get: Getter) => {
        computeCount++;
        return get(baseAtom) * 2;
      });

      store.get(computedAtom);
      expect(computeCount).toBe(1);

      store.get(computedAtom);
      expect(computeCount).toBe(1); // Cached
    });

    it('should invalidate cache on dependency change', () => {
      const baseAtom = atom(10);
      let computeCount = 0;
      const computedAtom = atom((get: Getter) => {
        computeCount++;
        return get(baseAtom) * 2;
      });

      store.get(computedAtom);
      expect(computeCount).toBe(1);

      store.set(baseAtom, 20);
      store.get(computedAtom);
      expect(computeCount).toBe(2);
    });

    it('should track multiple dependencies', () => {
      const atom1 = atom(10);
      const atom2 = atom(20);
      let computeCount = 0;
      const sumAtom = atom((get: Getter) => {
        computeCount++;
        return get(atom1) + get(atom2);
      });

      store.get(sumAtom);
      expect(computeCount).toBe(1);

      store.set(atom1, 15);
      store.get(sumAtom);
      expect(computeCount).toBe(2);

      store.set(atom2, 25);
      store.get(sumAtom);
      expect(computeCount).toBe(3);
    });
  });

  describe('Diamond Dependencies', () => {
    it('should handle diamond dependency pattern', () => {
      const a = atom(10);
      const b = atom((get: Getter) => get(a) * 2);
      const c = atom((get: Getter) => get(a) * 3);
      const d = atom((get: Getter) => get(b) + get(c));

      expect(store.get(d)).toBe(50); // 20 + 30

      store.set(a, 5);
      expect(store.get(d)).toBe(25); // 10 + 15
    });

    it('should not over-invalidate diamond dependencies', () => {
      const a = atom(10);
      let bComputes = 0;
      let cComputes = 0;
      let dComputes = 0;

      const b = atom((get: Getter) => {
        bComputes++;
        return get(a) * 2;
      });
      const c = atom((get: Getter) => {
        cComputes++;
        return get(a) * 3;
      });
      const d = atom((get: Getter) => {
        dComputes++;
        return get(b) + get(c);
      });

      store.get(d);
      expect(bComputes).toBe(1);
      expect(cComputes).toBe(1);
      expect(dComputes).toBe(1);

      store.set(a, 20);
      store.get(d);

      // Each should compute once more
      expect(bComputes).toBe(2);
      expect(cComputes).toBe(2);
      expect(dComputes).toBe(2);
    });
  });

  describe('Complex Dependency Graph', () => {
    it('should handle complex graph', () => {
      const a = atom(0);
      const b = atom(0);
      const c = atom((get: Getter) => get(a) + get(b));
      const d = atom((get: Getter) => get(a) * 2);
      const e = atom((get: Getter) => get(b) * 2);
      const f = atom((get: Getter) => get(c) + get(d) + get(e));

      expect(store.get(f)).toBe(0);

      store.set(a, 5);
      expect(store.get(f)).toBe(15);

      store.set(b, 10);
      expect(store.get(f)).toBe(45);
    });

    it('should handle chain of 5 atoms', () => {
      const a = atom(0);
      const b = atom((get: Getter) => get(a) + 1);
      const c = atom((get: Getter) => get(b) + 1);
      const d = atom((get: Getter) => get(c) + 1);
      const e = atom((get: Getter) => get(d) + 1);

      expect(store.get(e)).toBe(4);

      store.set(a, 10);
      expect(store.get(e)).toBe(14);
    });
  });

  describe('Computed with Conditional Logic', () => {
    it('should handle conditional computed', () => {
      const valueAtom = atom(10);
      const resultAtom = atom((get: Getter) => {
        const value = get(valueAtom);
        return value > 5 ? 'large' : 'small';
      });

      expect(store.get(resultAtom)).toBe('large');

      store.set(valueAtom, 3);
      expect(store.get(resultAtom)).toBe('small');
    });

    it('should handle computed with array operations', () => {
      const numbersAtom = atom([1, 2, 3, 4, 5]);
      const sumAtom = atom((get: Getter) => {
        const numbers = get(numbersAtom);
        return numbers.reduce((sum, n) => sum + n, 0);
      });

      expect(store.get(sumAtom)).toBe(15);

      store.set(numbersAtom, [10, 20, 30]);
      expect(store.get(sumAtom)).toBe(60);
    });

    it('should handle computed with object destructuring', () => {
      const userAtom = atom({ name: 'John', age: 30 });
      const greetingAtom = atom((get: Getter) => {
        const user = get(userAtom);
        return `Hello, ${user.name}!`;
      });

      expect(store.get(greetingAtom)).toBe('Hello, John!');

      store.set(userAtom, { name: 'Jane', age: 25 });
      expect(store.get(greetingAtom)).toBe('Hello, Jane!');
    });
  });

  describe('Computed Error Handling', () => {
    it('should throw error from computed evaluation', () => {
      const errorAtom = atom((get: Getter) => {
        throw new Error('Computed error');
      });

      expect(() => store.get(errorAtom)).toThrow('Computed error');
    });

    it('should handle error in nested computed', () => {
      const errorAtom = atom((get: Getter) => {
        throw new Error('Inner error');
      });
      const dependentAtom = atom((get: Getter) => get(errorAtom) * 2);

      expect(() => store.get(dependentAtom)).toThrow('Inner error');
    });

    it('should recover from computed error', () => {
      let shouldThrow = true;
      const conditionalAtom = atom((get: Getter) => {
        if (shouldThrow) {
          throw new Error('Temporary error');
        }
        return 42;
      });

      expect(() => store.get(conditionalAtom)).toThrow();

      shouldThrow = false;
      expect(store.get(conditionalAtom)).toBe(42);
    });
  });

  describe('Computed with Same Value', () => {
    it('should not notify if computed value is same', () => {
      const baseAtom = atom(0);
      const alwaysZeroAtom = atom((get: Getter) => get(baseAtom) - get(baseAtom));
      const subscriber = vi.fn();

      store.subscribe(alwaysZeroAtom, subscriber);

      store.set(baseAtom, 5);
      store.set(baseAtom, 10);

      // Computed value is always 0, subscriber not called
      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('Read-Only Computed', () => {
    it('should allow setting computed atom (limitation)', () => {
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);

      // Note: Current implementation allows setting computed atom
      // Value is set directly, not computed
      store.set(computedAtom, 100);

      expect(store.get(computedAtom)).toBe(100);
    });

    it('should keep set value until base changes', () => {
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);

      store.set(computedAtom, 100);
      expect(store.get(computedAtom)).toBe(100);

      // Base change triggers recomputation
      store.set(baseAtom, 15);
      expect(store.get(computedAtom)).toBe(30);
    });
  });
});
