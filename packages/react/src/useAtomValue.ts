import type { Atom, Store } from '@nexus-state/core';
import { useAtom } from './useAtom';

/**
 * Hook to read an atom's value without a setter function.
 * Use this when you only need to read the value and don't need to update it.
 *
 * @template T - The type of the atom's value
 * @param atom - The atom to read
 * @param store - Optional store instance (defaults to auto-created store)
 * @returns The current value of the atom
 *
 * @example
 * ```tsx
 * import { atom } from '@nexus-state/core';
 * import { useAtomValue } from '@nexus-state/react';
 *
 * const countAtom = atom(0);
 *
 * function Counter() {
 *   const count = useAtomValue(countAtom);
 *   return <div>Count: {count}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Works with computed atoms too
 * const doubleAtom = atom((get) => get(countAtom) * 2);
 *
 * function DoubleCounter() {
 *   const double = useAtomValue(doubleAtom);
 *   return <div>Double: {double}</div>;
 * }
 * ```
 */
export function useAtomValue<T>(atom: Atom<T>, store?: Store): T {
  const [value] = useAtom(atom, store);
  return value;
}
