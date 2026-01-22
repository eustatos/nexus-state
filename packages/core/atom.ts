// Implementation of atom function

import type { Atom, Getter, Setter } from './types';

// Overload signatures
export function atom<Value>(initialValue: Value): Atom<Value>;
export function atom<Value>(read: (get: Getter) => Value): Atom<Value>;
export function atom<Value>(
  initialValue: Value,
  write: (get: Getter, set: Setter, value: Value) => void
): Atom<Value>;

// Implementation
export function atom<Value>(...args: any[]): Atom<Value> {
  if (args.length === 1) {
    const [initialValue] = args;
    if (typeof initialValue === 'function') {
      // Computed atom
      return {
        id: Symbol('atom'),
        read: initialValue,
      };
    } else {
      // Primitive atom
      return {
        id: Symbol('atom'),
        read: () => initialValue,
        write: (_get, _set, value) => {
          // For primitive atoms, we'll handle the write operation in the store
        },
      };
    }
  } else if (args.length === 2) {
    const [read, write] = args;
    return {
      id: Symbol('atom'),
      read,
      write,
    };
  }

  throw new Error('Invalid arguments for atom function');
}