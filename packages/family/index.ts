// Atom family implementation for nexus-state
import { atom, Atom } from "@nexus-state/core";

/**
 * Creates a family of atoms with parameters.
 * @template T - The type of the atom's value
 * @template P - The type of the parameter tuple
 * @param {Function} createAtom - Function that creates an atom based on parameters
 * @returns {Function} A function that returns an atom for given parameters
 * @example
 * // Single parameter
 * const userAtomFamily = atomFamily((id: number) =>
 *   atom(`User ${id}`)
 * );
 * const userAtom = userAtomFamily(123);
 *
 * // Multiple parameters
 * const todoAtomFamily = atomFamily((userId: number, todoId: number) =>
 *   atom({ userId, todoId, title: 'Todo' })
 * );
 * const todoAtom = todoAtomFamily(1, 2);
 */
export function atomFamily<T, P extends unknown[]>(
  createAtom: (...params: P) => Atom<T>,
): (...params: P) => Atom<T> {
  const atomsCache = new Map<string, Atom<T>>();

  return (...params: P): Atom<T> => {
    // Create a cache key from the parameter(s)
    const cacheKey = JSON.stringify(params);

    // Check if we already have an atom for this parameter
    if (atomsCache.has(cacheKey)) {
      return atomsCache.get(cacheKey)!;
    }

    // Create a new atom for this parameter
    const newAtom = createAtom(...params);
    atomsCache.set(cacheKey, newAtom);

    return newAtom;
  };
}

// Extend the atom function to support families
// Use a wrapper function that accepts any arguments
const atomWithFamily = ((...args: unknown[]) => {
  // Use spread operator instead of .apply()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (atom as any)(...args);
}) as unknown as {(...args: unknown[]): Atom<unknown>; family: typeof atomFamily};
atomWithFamily.family = atomFamily;

// Re-export atom for convenience
export { atom, atomWithFamily };
