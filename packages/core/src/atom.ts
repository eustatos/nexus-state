// Implementation of atom function

import type { Atom, Getter, Setter, PrimitiveAtom, ComputedAtom, WritableAtom } from './types';
import { atomRegistry } from './atom-registry';

/**
 * Create a primitive atom with an initial value
 * @template Value The type of the initial value
 * @param initialValue The initial value of the atom
 * @param name Optional name for the atom for DevTools display
 * @returns A primitive atom
 * @example
 * const countAtom = atom(0);
 * const nameAtom = atom("John", "user-name");
 */
export function atom<Value>(initialValue: Value, name?: string): PrimitiveAtom<Value>;

/**
 * Create a computed atom that derives its value from other atoms
 * @template Value The type of the computed value
 * @param read Function to compute the atom's value based on other atoms
 * @param name Optional name for the atom for DevTools display
 * @returns A computed atom
 * @example
 * const doubleCountAtom = atom((get) => get(countAtom) * 2);
 * const displayNameAtom = atom((get) => `Hello, ${get(nameAtom)}!`, "display-name");
 */
export function atom<Value>(read: (get: Getter) => Value, name?: string): ComputedAtom<Value>;

/**
 * Create a writable atom that can both read and write values
 * @template Value The type of the atom's value
 * @param read Function to compute the atom's value based on other atoms
 * @param write Function to write to the atom
 * @param name Optional name for the atom for DevTools display
 * @returns A writable atom
 * @example
 * const writableCountAtom = atom(
 *   (get) => get(countAtom),
 *   (get, set, value: number) => set(countAtom, value),
 *   "writable-count"
 * );
 */
export function atom<Value>(
  read: (get: Getter) => Value,
  write: (get: Getter, set: Setter, value: Value) => void,
  name?: string
): WritableAtom<Value>;

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
        type: 'computed',
        name,
        read: initialValue,
      } as ComputedAtom<Value>;
    } else {
      // Primitive atom
      atomInstance = {
        id: Symbol('atom'),
        type: 'primitive',
        name,
        read: () => initialValue,
      } as PrimitiveAtom<Value>;
    }
  } else if (args.length === 2) {
    const [read, write] = args;
    atomInstance = {
      id: Symbol('atom'),
      type: 'writable',
      name,
      read,
      write,
    } as WritableAtom<Value>;
  } else {
    throw new Error('Invalid arguments for atom function');
  }

  // Register atom with the global registry
  atomRegistry.register(atomInstance, name);

  return atomInstance;
}