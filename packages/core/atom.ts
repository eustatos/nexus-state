// Implementation of atom function

import type { Atom, Getter, Setter } from './types';
import { atomRegistry } from './atom-registry';

// Overload signatures
export function atom<Value>(initialValue: Value): Atom<Value>;
export function atom<Value>(read: (get: Getter) => Value): Atom<Value>;
export function atom<Value>(
  initialValue: Value,
  write: (get: Getter, set: Setter, value: Value) => void
): Atom<Value>;

// Implementation with optional name parameter for DevTools
export function atom<Value>(...args: any[]): Atom<Value> {
  // Extract optional name parameter if provided
  let name: string | undefined;
  if (args.length > 0 && typeof args[args.length - 1] === 'string') {
    name = args.pop() as string;
  }

  let atomInstance: Atom<Value>;

  if (args.length === 1) {
    const [initialValue] = args;
    if (typeof initialValue === 'function') {
      // Computed atom
      atomInstance = {
        id: Symbol('atom'),
        read: initialValue,
      };
    } else {
      // Primitive atom
      atomInstance = {
        id: Symbol('atom'),
        read: () => initialValue,
        write: (
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _get: Getter,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _set: Setter,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _value: Value
        ) => {
          // For primitive atoms, we'll handle the write operation in the store
          // These parameters are required to match the write function signature
          // but are not used in this implementation
        },
      } as Atom<Value>; // Type assertion to ensure correct return type
    }
  } else if (args.length === 2) {
    const [read, write] = args;
    atomInstance = {
      id: Symbol('atom'),
      read,
      write,
    };
  } else {
    throw new Error('Invalid arguments for atom function');
  }

  // Register atom with the global registry
  atomRegistry.register(atomInstance, name);

  return atomInstance;
}