// tests/fixtures/test-atoms.ts
/**
 * Test fixtures for atom registry
 */

import { atom } from '../../packages/core/atom';

// Primitive atoms
export const primitiveAtom = atom(42, 'primitive-atom');
export const stringAtom = atom('hello', 'string-atom');
export const booleanAtom = atom(true, 'boolean-atom');

// Computed atoms
export const computedAtom = atom(
  (get) => get(primitiveAtom) * 2,
  'computed-atom'
);

// Writable atoms
export const writableAtom = atom(
  0,
  (get, set, value: number) => {
    set(primitiveAtom, get(primitiveAtom) + value);
  },
  'writable-atom'
);

// Unnamed atoms
export const unnamedAtom1 = atom({ count: 0 });
export const unnamedAtom2 = atom((get) => get(unnamedAtom1).count);

// Collection of all test atoms
export const testAtoms = [
  primitiveAtom,
  stringAtom,
  booleanAtom,
  computedAtom,
  writableAtom,
  unnamedAtom1,
  unnamedAtom2,
];