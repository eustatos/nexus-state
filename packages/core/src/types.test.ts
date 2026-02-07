// Type tests for new atom types
// This file is used to verify type inference and type safety

import { atom, createStore } from './index';
import type { Atom, PrimitiveAtom, ComputedAtom, WritableAtom, AtomValue } from './types';

// Test type inference for primitive atoms
const primitiveAtom = atom(0);
// @ts-expect-error This should be a PrimitiveAtom<number>
const primitiveAtomTest: PrimitiveAtom<number> = primitiveAtom;

// Test type inference for computed atoms
const computedAtom = atom((get) => get(primitiveAtom) * 2);
// @ts-expect-error This should be a ComputedAtom<number>
const computedAtomTest: ComputedAtom<number> = computedAtom;

// Test type inference for writable atoms
const writableAtom = atom(
  (get) => get(primitiveAtom),
  (get, set, value: number) => set(primitiveAtom, value)
);
// @ts-expect-error This should be a WritableAtom<number>
const writableAtomTest: WritableAtom<number> = writableAtom;

// Test type inference with names
const namedPrimitiveAtom = atom(0, 'count');
const namedComputedAtom = atom((get) => get(namedPrimitiveAtom) * 2, 'doubleCount');
const namedWritableAtom = atom(
  (get) => get(namedPrimitiveAtom),
  (get, set, value: number) => set(namedPrimitiveAtom, value),
  'writableCount'
);

// Test AtomValue utility type
type PrimitiveAtomValue = AtomValue<typeof primitiveAtom>; // Should be number
type ComputedAtomValue = AtomValue<typeof computedAtom>; // Should be number
type WritableAtomValue = AtomValue<typeof writableAtom>; // Should be number

// Test store operations
const store = createStore();

// Test get operation
const primitiveValue = store.get(primitiveAtom); // Should be number
const computedValue = store.get(computedAtom); // Should be number
const writableValue = store.get(writableAtom); // Should be number

// Test set operation
store.set(primitiveAtom, 5);
store.set(primitiveAtom, (prev) => prev + 1);
// @ts-expect-error Computed atoms cannot be set
store.set(computedAtom, 5);

// Test subscribe operation
const primitiveUnsubscribe = store.subscribe(primitiveAtom, (value) => {
  // value should be number
  console.log(value);
});

const computedUnsubscribe = store.subscribe(computedAtom, (value) => {
  // value should be number
  console.log(value);
});

const writableUnsubscribe = store.subscribe(writableAtom, (value) => {
  // value should be number
  console.log(value);
});

// Test type guards
if (primitiveAtom.type === 'primitive') {
  // primitiveAtom should be PrimitiveAtom<number>
  const primitiveTest: PrimitiveAtom<number> = primitiveAtom;
}

if (computedAtom.type === 'computed') {
  // computedAtom should be ComputedAtom<number>
  const computedTest: ComputedAtom<number> = computedAtom;
}

if (writableAtom.type === 'writable') {
  // writableAtom should be WritableAtom<number>
  const writableTest: WritableAtom<number> = writableAtom;
}

// Test utility types
const anyAtom: Atom<any> = primitiveAtom;
const atomValue: AtomValue<typeof anyAtom> = store.get(anyAtom);

// Clean up subscriptions
primitiveUnsubscribe();
computedUnsubscribe();
writableUnsubscribe();

export {
  primitiveAtom,
  computedAtom,
  writableAtom,
  namedPrimitiveAtom,
  namedComputedAtom,
  namedWritableAtom,
  store
};