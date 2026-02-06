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
        write: undefined, // Primitive atoms don't have a write function
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