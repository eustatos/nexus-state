/**
 * Computed Atoms Tests
 * Tests for computed atom functionality and behavior
 */

import { describe, it, expect } from 'vitest';
import { atom, createStore } from '../../index';
import type { Getter } from '../../types';

describe('Computed Atoms', () => {
  describe('Basic Computation', () => {
    it('should compute value from single dependency', () => {
      const store = createStore();
      const baseAtom = atom(10);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);

      expect(store.get(doubleAtom)).toBe(20);
    });

    it('should recompute when dependency changes', () => {
      const store = createStore();
      const baseAtom = atom(10);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);

      expect(store.get(doubleAtom)).toBe(20);
      store.set(baseAtom, 15);
      expect(store.get(doubleAtom)).toBe(30);
    });

    it('should compute value from multiple dependencies', () => {
      const store = createStore();
      const atom1 = atom(10);
      const atom2 = atom(20);
      const sumAtom = atom((get: Getter) => get(atom1) + get(atom2));

      expect(store.get(sumAtom)).toBe(30);

      store.set(atom1, 15);
      expect(store.get(sumAtom)).toBe(35);

      store.set(atom2, 25);
      expect(store.get(sumAtom)).toBe(40);
    });
  });

  describe('Nested Computed Atoms', () => {
    it('should handle chain of 2 computed atoms', () => {
      const store = createStore();
      const baseAtom = atom(5);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);
      const tripleDoubleAtom = atom((get: Getter) => get(doubleAtom) * 3);

      expect(store.get(tripleDoubleAtom)).toBe(30);
      store.set(baseAtom, 10);
      expect(store.get(tripleDoubleAtom)).toBe(60);
    });

    it('should handle chain of 3 computed atoms', () => {
      const store = createStore();
      const baseAtom = atom(2);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);
      const addTenAtom = atom((get: Getter) => get(doubleAtom) + 10);
      const finalAtom = atom((get: Getter) => get(addTenAtom) * 2);

      expect(store.get(finalAtom)).toBe(28); // (2*2+10)*2 = 28
      store.set(baseAtom, 5);
      expect(store.get(finalAtom)).toBe(40); // (5*2+10)*2 = 40
    });

    it('should handle diamond dependency pattern', () => {
      const store = createStore();
      const baseAtom = atom(10);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);
      const tripleAtom = atom((get: Getter) => get(baseAtom) * 3);
      const sumAtom = atom((get: Getter) => get(doubleAtom) + get(tripleAtom));

      expect(store.get(sumAtom)).toBe(50); // 20 + 30
      store.set(baseAtom, 5);
      expect(store.get(sumAtom)).toBe(25); // 10 + 15
    });
  });

  describe('Complex Computed Logic', () => {
    it('should handle conditional logic', () => {
      const store = createStore();
      const valueAtom = atom(10);
      const resultAtom = atom((get: Getter) => {
        const value = get(valueAtom);
        return value > 5 ? 'large' : 'small';
      });

      expect(store.get(resultAtom)).toBe('large');
      store.set(valueAtom, 3);
      expect(store.get(resultAtom)).toBe('small');
    });

    it('should handle array operations', () => {
      const store = createStore();
      const numbersAtom = atom([1, 2, 3, 4, 5]);
      const sumAtom = atom((get: Getter) => {
        const numbers = get(numbersAtom);
        return numbers.reduce((sum, n) => sum + n, 0);
      });

      expect(store.get(sumAtom)).toBe(15);
      store.set(numbersAtom, [10, 20, 30]);
      expect(store.get(sumAtom)).toBe(60);
    });

    it('should handle array filter operations', () => {
      const store = createStore();
      const numbersAtom = atom([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const evenAtom = atom((get: Getter) => {
        const numbers = get(numbersAtom);
        return numbers.filter(n => n % 2 === 0);
      });

      expect(store.get(evenAtom)).toEqual([2, 4, 6, 8, 10]);
      store.set(numbersAtom, [1, 3, 5, 7, 9]);
      expect(store.get(evenAtom)).toEqual([]);
    });

    it('should handle object destructuring', () => {
      const store = createStore();
      const userAtom = atom({ name: 'John', age: 30 });
      const greetingAtom = atom((get: Getter) => {
        const user = get(userAtom);
        return `Hello, ${user.name}!`;
      });

      expect(store.get(greetingAtom)).toBe('Hello, John!');
      store.set(userAtom, { name: 'Jane', age: 25 });
      expect(store.get(greetingAtom)).toBe('Hello, Jane!');
    });

    it('should handle object transformations', () => {
      const store = createStore();
      const userAtom = atom({ firstName: 'John', lastName: 'Doe' });
      const fullNameAtom = atom((get: Getter) => {
        const user = get(userAtom);
        return `${user.firstName} ${user.lastName}`;
      });

      expect(store.get(fullNameAtom)).toBe('John Doe');
      store.set(userAtom, { firstName: 'Jane', lastName: 'Smith' });
      expect(store.get(fullNameAtom)).toBe('Jane Smith');
    });

    it('should handle string operations', () => {
      const store = createStore();
      const textAtom = atom('hello world');
      const upperAtom = atom((get: Getter) => get(textAtom).toUpperCase());
      const wordsAtom = atom((get: Getter) => get(textAtom).split(' '));

      expect(store.get(upperAtom)).toBe('HELLO WORLD');
      expect(store.get(wordsAtom)).toEqual(['hello', 'world']);

      store.set(textAtom, 'goodbye world');
      expect(store.get(upperAtom)).toBe('GOODBYE WORLD');
    });
  });

  describe('Computed with Boolean Logic', () => {
    it('should handle boolean conditions', () => {
      const store = createStore();
      const countAtom = atom(0);
      const isZeroAtom = atom((get: Getter) => get(countAtom) === 0);

      expect(store.get(isZeroAtom)).toBe(true);
      store.set(countAtom, 5);
      expect(store.get(isZeroAtom)).toBe(false);
    });

    it('should handle multiple boolean conditions', () => {
      const store = createStore();
      const aAtom = atom(true);
      const bAtom = atom(false);
      const andAtom = atom((get: Getter) => get(aAtom) && get(bAtom));
      const orAtom = atom((get: Getter) => get(aAtom) || get(bAtom));

      expect(store.get(andAtom)).toBe(false);
      expect(store.get(orAtom)).toBe(true);

      store.set(bAtom, true);
      expect(store.get(andAtom)).toBe(true);
    });

    it('should handle negation', () => {
      const store = createStore();
      const flagAtom = atom(true);
      const notFlagAtom = atom((get: Getter) => !get(flagAtom));

      expect(store.get(notFlagAtom)).toBe(false);
      store.set(flagAtom, false);
      expect(store.get(notFlagAtom)).toBe(true);
    });
  });

  describe('Computed with Numeric Operations', () => {
    it('should handle arithmetic operations', () => {
      const store = createStore();
      const aAtom = atom(10);
      const bAtom = atom(5);
      const addAtom = atom((get: Getter) => get(aAtom) + get(bAtom));
      const subAtom = atom((get: Getter) => get(aAtom) - get(bAtom));
      const mulAtom = atom((get: Getter) => get(aAtom) * get(bAtom));
      const divAtom = atom((get: Getter) => get(aAtom) / get(bAtom));

      expect(store.get(addAtom)).toBe(15);
      expect(store.get(subAtom)).toBe(5);
      expect(store.get(mulAtom)).toBe(50);
      expect(store.get(divAtom)).toBe(2);
    });

    it('should handle modulo operations', () => {
      const store = createStore();
      const numAtom = atom(17);
      const modAtom = atom((get: Getter) => get(numAtom) % 5);

      expect(store.get(modAtom)).toBe(2);
      store.set(numAtom, 20);
      expect(store.get(modAtom)).toBe(0);
    });

    it('should handle power operations', () => {
      const store = createStore();
      const baseAtom = atom(2);
      const expAtom = atom(3);
      const powAtom = atom((get: Getter) => Math.pow(get(baseAtom), get(expAtom)));

      expect(store.get(powAtom)).toBe(8);
      store.set(expAtom, 4);
      expect(store.get(powAtom)).toBe(16);
    });
  });

  describe('Computed Atom Immutability', () => {
    it('should not allow direct modification of computed atom', () => {
      const store = createStore();
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);

      // Computed atoms should not have write capability
      expect(computedAtom.write).toBeUndefined();
    });

    it('should not throw on set computed atom (limitation)', () => {
      const store = createStore();
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);

      // Note: Current implementation does not throw on set(computedAtom, value)
      expect(() => store.set(computedAtom, 100)).not.toThrow();
    });

    it('should update computed atom when dependency changes', () => {
      const store = createStore();
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);

      expect(store.get(computedAtom)).toBe(20);

      // Change base atom - computed should update
      store.set(baseAtom, 15);
      expect(store.get(computedAtom)).toBe(30);
    });
  });

  describe('Computed with Complex Data Structures', () => {
    it('should handle Map in computed atom', () => {
      const store = createStore();
      const mapAtom = atom(new Map([['a', 1], ['b', 2]]));
      const sumAtom = atom((get: Getter) => {
        const map = get(mapAtom);
        let sum = 0;
        map.forEach(value => (sum += value));
        return sum;
      });

      expect(store.get(sumAtom)).toBe(3);
      store.set(mapAtom, new Map([['a', 10], ['b', 20], ['c', 30]]));
      expect(store.get(sumAtom)).toBe(60);
    });

    it('should handle Set in computed atom', () => {
      const store = createStore();
      const setAtom = atom(new Set([1, 2, 3]));
      const sizeAtom = atom((get: Getter) => get(setAtom).size);

      expect(store.get(sizeAtom)).toBe(3);
      store.set(setAtom, new Set([1, 2, 3, 4, 5]));
      expect(store.get(sizeAtom)).toBe(5);
    });

    it('should handle nested objects', () => {
      const store = createStore();
      const companyAtom = atom({
        name: 'Acme',
        employees: [
          { name: 'Alice', role: 'dev' },
          { name: 'Bob', role: 'designer' },
        ],
      });
      const devCountAtom = atom((get: Getter) => {
        const company = get(companyAtom);
        return company.employees.filter(e => e.role === 'dev').length;
      });

      expect(store.get(devCountAtom)).toBe(1);
    });
  });
});
