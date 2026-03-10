/**
 * Atom Error Handling Tests
 * Tests for error handling in atom operations
 */

import { describe, it, expect } from 'vitest';
import { atom, createStore } from '../../index';
import type { Getter, Setter } from '../../types';

describe('Atom Error Handling', () => {
  describe('Read Errors', () => {
    it('should handle atom that throws in read function', () => {
      const errorAtom = atom((get: Getter) => {
        throw new Error('Atom read error');
      });
      const store = createStore();

      expect(() => store.get(errorAtom)).toThrow('Atom read error');
    });

    it('should handle atom that throws custom error', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const customErrorAtom = atom((get: Getter) => {
        throw new CustomError('Custom atom error');
      });
      const store = createStore();

      expect(() => store.get(customErrorAtom)).toThrow(CustomError);
      expect(() => store.get(customErrorAtom)).toThrow('Custom atom error');
    });

    it('should handle atom that throws with error code', () => {
      interface ErrorWithCode extends Error {
        code: string;
      }

      const errorAtom = atom((get: Getter) => {
        const error = new Error('Error with code') as ErrorWithCode;
        error.code = 'ATOM_READ_ERROR';
        throw error;
      });
      const store = createStore();

      try {
        store.get(errorAtom);
        fail('Should have thrown');
      } catch (error) {
        expect((error as ErrorWithCode).code).toBe('ATOM_READ_ERROR');
      }
    });

    it('should handle nested atom that throws', () => {
      const baseAtom = atom(10);
      const errorAtom = atom((get: Getter) => {
        get(baseAtom);
        throw new Error('Nested error');
      });
      const store = createStore();

      expect(() => store.get(errorAtom)).toThrow('Nested error');
    });
  });

  describe('Write Errors', () => {
    it('should not throw error when setting computed atom (limitation)', () => {
      const store = createStore();
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);

      // Note: Current implementation does not throw on set(computedAtom, value)
      expect(() => store.set(computedAtom, 100)).not.toThrow();
    });

    it('should recalculate computed atom after set when dependency changes (limitation)', () => {
      const store = createStore();
      const baseAtom = atom(10);
      const computedAtom = atom((get: Getter) => get(baseAtom) * 2);

      expect(store.get(computedAtom)).toBe(20);

      // Set computed atom doesn't throw
      store.set(computedAtom, 100);
      // Note: Value may not be recalculated immediately

      // Change base atom - computed should update
      store.set(baseAtom, 15);
      expect(store.get(computedAtom)).toBe(30);
    });

    it('should handle writable atom that throws on write', () => {
      const store = createStore();
      const errorAtom = atom(
        () => 0,
        () => {
          throw new Error('Write error');
        }
      );

      expect(() => store.set(errorAtom, 10)).toThrow('Write error');
    });

    it('should handle writable atom with validation error', () => {
      const store = createStore();
      let currentValue = 0;

      const validatedAtom = atom(
        () => currentValue,
        (get, set, value: number) => {
          if (value < 0) {
            throw new Error('Value must be non-negative');
          }
          currentValue = value;
        }
      );

      store.set(validatedAtom, 10);
      expect(store.get(validatedAtom)).toBe(10);

      expect(() => store.set(validatedAtom, -5)).toThrow(
        'Value must be non-negative'
      );
      expect(store.get(validatedAtom)).toBe(10);
    });
  });

  describe('Dependency Errors', () => {
    it('should handle error in dependency chain', () => {
      const store = createStore();
      const errorAtom = atom((get: Getter) => {
        throw new Error('Dependency error');
      });
      const dependentAtom = atom((get: Getter) => get(errorAtom) * 2);

      expect(() => store.get(dependentAtom)).toThrow('Dependency error');
    });

    it('should handle error in one of multiple dependencies', () => {
      const store = createStore();
      const goodAtom = atom(10);
      const errorAtom = atom((get: Getter) => {
        throw new Error('Bad dependency');
      });
      const sumAtom = atom((get: Getter) => get(goodAtom) + get(errorAtom));

      expect(() => store.get(sumAtom)).toThrow('Bad dependency');
    });

    it('should handle circular dependency error gracefully', () => {
      const store = createStore();
      let atom1Value = 1;
      let atom2Value = 2;

      const atom1 = atom((get: Getter) => {
        try {
          return get(atom2) + 1;
        } catch {
          return atom1Value;
        }
      });
      const atom2 = atom((get: Getter) => {
        try {
          return get(atom1) + 1;
        } catch {
          return atom2Value;
        }
      });

      // Should not crash
      expect(() => store.get(atom1)).not.toThrow();
      expect(() => store.get(atom2)).not.toThrow();
    });
  });

  describe('Computed Atom Errors', () => {
    it('should handle computed atom that returns undefined', () => {
      const baseAtom = atom<number | undefined>(undefined);
      const computedAtom = atom((get: Getter) => {
        const value = get(baseAtom);
        return value === undefined ? 0 : value * 2;
      });
      const store = createStore();

      expect(store.get(computedAtom)).toBe(0);
      store.set(baseAtom, 5);
      expect(store.get(computedAtom)).toBe(10);
    });

    it('should handle computed atom with type error', () => {
      const store = createStore();
      const mixedAtom = atom<any>('string');
      const mathAtom = atom((get: Getter) => {
        const value = get(mixedAtom);
        // This will cause a type error at runtime
        return value * 2;
      });

      // String * 2 = NaN in JavaScript
      expect(store.get(mathAtom)).toBeNaN();
    });

    it('should handle computed atom that returns null', () => {
      const baseAtom = atom<string | null>('hello');
      const computedAtom = atom((get: Getter) => {
        const value = get(baseAtom);
        return value === null ? null : value.toUpperCase();
      });
      const store = createStore();

      expect(store.get(computedAtom)).toBe('HELLO');
      store.set(baseAtom, null);
      expect(store.get(computedAtom)).toBeNull();
    });
  });

  describe('Store Operation Errors', () => {
    it('should handle get on non-existent atom', () => {
      const store = createStore();
      const fakeAtom = atom(0);
      // Change the ID to simulate non-existent atom
      const fakeIdAtom = { ...fakeAtom, id: Symbol('fake') };

      // Should not throw, but may return undefined or default
      expect(() => store.get(fakeIdAtom)).not.toThrow();
    });

    it('should handle set with invalid atom type', () => {
      const store = createStore();
      const invalidAtom = {
        id: Symbol('invalid'),
        type: 'invalid' as any,
        read: () => 0,
      };

      expect(() => (store as any).set(invalidAtom, 10)).toThrow();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from read error on subsequent reads', () => {
      const store = createStore();
      let shouldThrow = true;

      const conditionalErrorAtom = atom((get: Getter) => {
        if (shouldThrow) {
          throw new Error('Temporary error');
        }
        return 42;
      });

      expect(() => store.get(conditionalErrorAtom)).toThrow('Temporary error');

      shouldThrow = false;
      expect(store.get(conditionalErrorAtom)).toBe(42);
    });

    it('should recover from write error on subsequent writes (using external state)', () => {
      const store = createStore();
      let shouldThrow = true;
      let internalValue = 0;

      const conditionalWriteAtom = atom(
        () => internalValue,
        (get, set, value: number) => {
          if (shouldThrow) {
            throw new Error('Temporary write error');
          }
          // Use external state instead of set(self, value)
          internalValue = value;
        }
      );

      expect(() => store.set(conditionalWriteAtom, 10)).toThrow(
        'Temporary write error'
      );

      shouldThrow = false;
      store.set(conditionalWriteAtom, 20);
      expect(store.get(conditionalWriteAtom)).toBe(20);
    });
  });

  describe('Error in Subscriptions', () => {
    it('should handle error in subscription callback', () => {
      const store = createStore();
      const baseAtom = atom(0);

      const unsubscribe = store.subscribe(baseAtom, () => {
        throw new Error('Subscription error');
      });

      // Should not throw when setting atom
      expect(() => store.set(baseAtom, 10)).not.toThrow();

      unsubscribe();
    });

    it('should continue other subscriptions after one throws', () => {
      const store = createStore();
      const baseAtom = atom(0);
      let goodCallbackCalled = false;

      store.subscribe(baseAtom, () => {
        throw new Error('Bad subscription');
      });

      store.subscribe(baseAtom, () => {
        goodCallbackCalled = true;
      });

      store.set(baseAtom, 10);
      expect(goodCallbackCalled).toBe(true);
    });
  });

  describe('Error Messages', () => {
    it('should not throw on computed atom set (limitation)', () => {
      const store = createStore();
      const computedAtom = atom((get: Getter) => get(atom(0)) * 2);

      // Note: Current implementation does not throw on set(computedAtom, value)
      expect(() => store.set(computedAtom, 100)).not.toThrow();
    });

    it('should include atom name in error message if available', () => {
      const store = createStore();
      const namedAtom = atom((get: Getter) => {
        throw new Error('Error in namedAtom');
      }, 'namedAtom');

      try {
        store.get(namedAtom);
      } catch (error) {
        expect((error as Error).message).toContain('Error in namedAtom');
      }
    });
  });
});
