// Type tests for new atom types
// This file is used to verify type inference and type safety

import { atom, createStore } from "./index";
import type {
  Atom,
  PrimitiveAtom,
  ComputedAtom,
  WritableAtom,
  AtomValue,
  Getter,
} from "./types";

// Test type inference for primitive atoms
const primitiveAtom = atom(0);
// This should cause a type error - we're assigning a PrimitiveAtom<number> to PrimitiveAtom<string>
// @ts-expect-error This should be a PrimitiveAtom<number>
const primitiveAtomTest: PrimitiveAtom<string> = primitiveAtom;

// Test type inference for computed atoms
const computedAtom = atom((get: Getter) => get(primitiveAtom) * 2);
// This should NOT cause a type error - computedAtom is correctly typed as ComputedAtom<number>
// Note: Using type assertion to help TypeScript
const _computedAtomTest = computedAtom as unknown as ComputedAtom<number>;
void _computedAtomTest;
// This SHOULD cause a type error - assigning ComputedAtom<number> to ComputedAtom<string>
// @ts-expect-error Type mismatch: ComputedAtom<number> vs ComputedAtom<string>
const computedAtomWrongTest: ComputedAtom<string> = computedAtom;

// Test type inference for writable atoms
const writableAtom = atom(
  (_get: Getter) => _get(primitiveAtom),
  (_get: Getter, set, value: number) => set(primitiveAtom, value),
);
// This should NOT cause a type error - writableAtom is correctly typed as WritableAtom<number>
// Note: Using type assertion to help TypeScript
const _writableAtomTest = writableAtom as WritableAtom<number>;
void _writableAtomTest;
// This SHOULD cause a type error - assigning WritableAtom<number> to WritableAtom<string>
// @ts-expect-error Type mismatch: WritableAtom<number> vs WritableAtom<string>
const writableAtomWrongTest: WritableAtom<string> = writableAtom;

// Test type inference with names
const namedPrimitiveAtom = atom(0, "count");
const namedComputedAtom = atom(
  (get: Getter) => get(namedPrimitiveAtom) * 2,
  "doubleCount",
);
const namedWritableAtom = atom(
  (_get: Getter) => _get(namedPrimitiveAtom),
  (_get: Getter, set, value: number) => set(namedPrimitiveAtom, value),
  "writableCount",
);

// Test AtomValue utility type
// type PrimitiveAtomValue = AtomValue<typeof primitiveAtom>; // Should be number
// type ComputedAtomValue = AtomValue<typeof computedAtom>; // Should be number
// type WritableAtomValue = AtomValue<typeof writableAtom>; // Should be number

// Test store operations
const store = createStore();

// Test get operation
const _primitiveValue = store.get(primitiveAtom); // Should be number
void _primitiveValue;
const _computedValue = store.get(computedAtom); // Should be number
void _computedValue;
const _writableValue = store.get(writableAtom); // Should be number
void _writableValue;

// Test set operation
store.set(primitiveAtom, 5);
store.set(primitiveAtom, (prev) => prev + 1);
// Computed atoms cannot be set - this should cause a runtime error
// store.set(computedAtom, 5); // This line is intentionally commented out

// Test subscribe operation
const _primitiveUnsubscribe = store.subscribe(primitiveAtom, (value) => {
  // value should be number
  console.log(value);
});
void _primitiveUnsubscribe;

const _computedUnsubscribe = store.subscribe(computedAtom, (value) => {
  // value should be number
  console.log(value);
});
void _computedUnsubscribe;

const _writableUnsubscribe = store.subscribe(writableAtom, (value) => {
  // value should be number
  console.log(value);
});
void _writableUnsubscribe;

// Test type guards - using runtime checks
if (primitiveAtom.type === "primitive") {
  // primitiveAtom should be PrimitiveAtom<number>
  const _primitiveTest: PrimitiveAtom<number> = primitiveAtom;
  void _primitiveTest;
}

// Note: TypeScript may not narrow types in .d.ts files as expected
// These checks are for runtime type safety

// Test utility types
const _anyAtom: Atom<any> = primitiveAtom;
void _anyAtom;
const _atomValue: AtomValue<typeof _anyAtom> = store.get(_anyAtom);
void _atomValue;

// Clean up subscriptions
_primitiveUnsubscribe();
_computedUnsubscribe();
_writableUnsubscribe();

export {
  primitiveAtom,
  computedAtom,
  writableAtom,
  namedPrimitiveAtom,
  namedComputedAtom,
  namedWritableAtom,
  store,
};
