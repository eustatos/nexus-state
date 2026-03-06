/**
 * Store Get/Set Tests
 * Tests for basic store get and set operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createStore, atom } from '../../index';
import type { Getter } from '../../types';

describe('store.get', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('Primitive Atoms', () => {
    it('should get primitive atom value', () => {
      const countAtom = atom(42);
      expect(store.get(countAtom)).toBe(42);
    });

    it('should get string atom value', () => {
      const nameAtom = atom('test');
      expect(store.get(nameAtom)).toBe('test');
    });

    it('should get boolean atom value', () => {
      const flagAtom = atom(true);
      expect(store.get(flagAtom)).toBe(true);
    });

    it('should get null atom value', () => {
      const nullAtom = atom(null);
      expect(store.get(nullAtom)).toBeNull();
    });

    it('should get undefined atom value', () => {
      const undefinedAtom = atom(undefined);
      expect(store.get(undefinedAtom)).toBeUndefined();
    });

    it('should get object atom value', () => {
      const obj = { key: 'value' };
      const objAtom = atom(obj);
      expect(store.get(objAtom)).toBe(obj);
    });

    it('should get array atom value', () => {
      const arr = [1, 2, 3];
      const arrAtom = atom(arr);
      expect(store.get(arrAtom)).toBe(arr);
    });
  });

  describe('Computed Atoms', () => {
    it('should evaluate computed atom on get', () => {
      const baseAtom = atom(10);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);
      expect(store.get(doubleAtom)).toBe(20);
    });

    it('should cache computed value', () => {
      const baseAtom = atom(10);
      let computeCount = 0;
      const computedAtom = atom((get: Getter) => {
        computeCount++;
        return get(baseAtom) * 2;
      });

      store.get(computedAtom);
      store.get(computedAtom);
      store.get(computedAtom);

      expect(computeCount).toBe(1);
    });

    it('should recompute when dependency changes', () => {
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

    it('should handle nested computed atoms', () => {
      const baseAtom = atom(5);
      const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);
      const tripleDoubleAtom = atom((get: Getter) => get(doubleAtom) * 3);

      expect(store.get(tripleDoubleAtom)).toBe(30);
    });

    it('should handle computed atom with multiple dependencies', () => {
      const atom1 = atom(10);
      const atom2 = atom(20);
      const sumAtom = atom((get: Getter) => get(atom1) + get(atom2));

      expect(store.get(sumAtom)).toBe(30);

      store.set(atom1, 15);
      expect(store.get(sumAtom)).toBe(35);
    });
  });

  describe('Same Atom Multiple Gets', () => {
    it('should return same value for multiple gets', () => {
      const atom1 = atom(42);
      expect(store.get(atom1)).toBe(store.get(atom1));
    });

    it('should return same object reference for object atoms', () => {
      const obj = { value: 1 };
      const objAtom = atom(obj);
      expect(store.get(objAtom)).toBe(store.get(objAtom));
    });
  });
});

describe('store.set', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('Primitive Atoms', () => {
    it('should set primitive atom value', () => {
      const countAtom = atom(0);
      store.set(countAtom, 42);
      expect(store.get(countAtom)).toBe(42);
    });

    it('should update string atom value', () => {
      const nameAtom = atom('initial');
      store.set(nameAtom, 'updated');
      expect(store.get(nameAtom)).toBe('updated');
    });

    it('should update boolean atom value', () => {
      const flagAtom = atom(false);
      store.set(flagAtom, true);
      expect(store.get(flagAtom)).toBe(true);
    });

    it('should update null atom value', () => {
      const nullAtom = atom(null);
      store.set(nullAtom, 'not null');
      expect(store.get(nullAtom)).toBe('not null');
    });

    it('should update object atom value', () => {
      const objAtom = atom({ key: 'value1' });
      store.set(objAtom, { key: 'value2' });
      expect(store.get(objAtom)).toEqual({ key: 'value2' });
    });

    it('should update array atom value', () => {
      const arrAtom = atom([1, 2, 3]);
      store.set(arrAtom, [4, 5, 6]);
      expect(store.get(arrAtom)).toEqual([4, 5, 6]);
    });
  });

  describe('Function Updates', () => {
    it('should handle function update', () => {
      const countAtom = atom(0);
      store.set(countAtom, (prev: number) => prev + 1);
      expect(store.get(countAtom)).toBe(1);
    });

    it('should handle multiple function updates', () => {
      const countAtom = atom(0);
      store.set(countAtom, (prev: number) => prev + 1);
      store.set(countAtom, (prev: number) => prev * 2);
      store.set(countAtom, (prev: number) => prev + 10);
      expect(store.get(countAtom)).toBe(12);
    });

    it('should pass current value to function update', () => {
      const countAtom = atom(5);
      store.set(countAtom, (prev: number) => {
        expect(prev).toBe(5);
        return prev * 2;
      });
      expect(store.get(countAtom)).toBe(10);
    });
  });

  describe('Multiple Sets Same Atom', () => {
    it('should update value on each set', () => {
      const countAtom = atom(0);
      store.set(countAtom, 1);
      expect(store.get(countAtom)).toBe(1);

      store.set(countAtom, 2);
      expect(store.get(countAtom)).toBe(2);

      store.set(countAtom, 3);
      expect(store.get(countAtom)).toBe(3);
    });

    it('should keep last value', () => {
      const countAtom = atom(0);
      store.set(countAtom, 1);
      store.set(countAtom, 2);
      store.set(countAtom, 3);
      expect(store.get(countAtom)).toBe(3);
    });
  });

  describe('Set Different Atom Types', () => {
    it('should set atom with number value', () => {
      const numAtom = atom(0);
      store.set(numAtom, 100);
      expect(store.get(numAtom)).toBe(100);
    });

    it('should set atom with string value', () => {
      const strAtom = atom('');
      store.set(strAtom, 'hello');
      expect(store.get(strAtom)).toBe('hello');
    });

    it('should set atom with complex object', () => {
      const complexAtom = atom({
        user: { name: 'John', age: 30 },
        items: [1, 2, 3],
      });
      const newValue = {
        user: { name: 'Jane', age: 25 },
        items: [4, 5, 6],
      };
      store.set(complexAtom, newValue);
      expect(store.get(complexAtom)).toEqual(newValue);
    });
  });
});

describe('store.get and store.set integration', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should get value after set', () => {
    const atom1 = atom(0);
    store.set(atom1, 42);
    expect(store.get(atom1)).toBe(42);
  });

  it('should update computed after set dependency', () => {
    const baseAtom = atom(10);
    const doubleAtom = atom((get: Getter) => get(baseAtom) * 2);

    expect(store.get(doubleAtom)).toBe(20);

    store.set(baseAtom, 20);
    expect(store.get(doubleAtom)).toBe(40);
  });

  it('should handle set-get cycle', () => {
    const atom1 = atom(0);
    for (let i = 1; i <= 10; i++) {
      store.set(atom1, i);
      expect(store.get(atom1)).toBe(i);
    }
  });
});
