/**
 * Shared utilities for atom operations
 */

import type {
  Atom,
  PrimitiveAtom,
  ComputedAtom,
  WritableAtom,
  Getter,
} from '../types';
import { isPrimitiveAtom, isComputedAtom, isWritableAtom } from '../types';

/**
 * Internal state for an atom
 */
export type AtomState<Value> = {
  value: Value;
  subscribers: Set<(value: Value) => void>;
  dependents: Set<Atom<any>>;
};

/**
 * Get or create atom state with proper initialization
 */
export function getOrCreateAtomState<Value>(
  atom: Atom<Value>,
  atomStates: Map<Atom<any>, AtomState<any>>,
  get: Getter,
  currentAtom: Atom<any> | null,
  setCurrentAtom: (atom: Atom<any> | null) => void
): { state: AtomState<Value>; created: boolean } {
  let atomState = atomStates.get(atom) as AtomState<Value> | undefined;

  if (!atomState) {
    // Determine atom type and get initial value
    const initialValue = getAtomInitialValue(
      atom,
      get,
      currentAtom,
      setCurrentAtom
    );

    atomState = {
      value: initialValue,
      subscribers: new Set(),
      dependents: new Set(),
    };
    atomStates.set(atom, atomState as any);

    return { state: atomState, created: true };
  }

  return { state: atomState, created: false };
}

/**
 * Get initial value from atom based on its type
 */
export function getAtomInitialValue<Value>(
  atom: Atom<Value>,
  get: Getter,
  currentAtom: Atom<any> | null,
  setCurrentAtom: (atom: Atom<any> | null) => void
): Value {
  if (isPrimitiveAtom(atom)) {
    return (atom as PrimitiveAtom<Value>).read();
  }

  if (isComputedAtom(atom) || isWritableAtom(atom)) {
    const previousAtom = currentAtom;
    setCurrentAtom(atom);
    try {
      return (atom as ComputedAtom<Value> | WritableAtom<Value>).read(get);
    } finally {
      setCurrentAtom(previousAtom);
    }
  }

  throw new Error('Unknown atom type');
}

/**
 * Register atom with store registry
 */
export function registerAtomWithStore(
  atom: Atom<any>,
  store: any,
  atomRegistry: any
): void {
  const storesMap = atomRegistry.getStoresMap();
  const registry = storesMap.get(store);
  if (registry && !registry.atoms.has(atom.id)) {
    registry.atoms.add(atom.id);
  }
}

/**
 * Check if value is a function (type guard)
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * Check if value is a plain object (type guard)
 */
export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Create unique ID with optional prefix
 */
export function createId(prefix = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Safely get property from object with default value
 */
export function safeGet<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  defaultValue: T[K]
): T[K] {
  return obj[key] ?? defaultValue;
}
