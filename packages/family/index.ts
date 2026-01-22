// Atom family implementation for nexus-state
import { atom, Atom } from "@nexus-state/core";

/**
 * Creates a family of atoms with parameters.
 * @template T - The type of the atom's value
 * @template P - The type of the parameter
 * @param {Function} createAtom - Function that creates an atom based on a parameter
 * @returns {Function} A function that returns an atom for a given parameter
 * @example
 * const userAtomFamily = atom.family((id: string) =>
 *   atom(async () => {
 *     const response = await fetch(`/api/users/${id}`);
 *     return response.json();
 *   })
 * );
 *
 * const userAtom = userAtomFamily('123');
 */
export function atomFamily<T, P>(
  createAtom: (param: P) => Atom<T>,
): (param: P) => Atom<T> {
  const atomsCache = new Map<string, Atom<T>>();

  return (param: P): Atom<T> => {
    // Create a cache key from the parameter
    const cacheKey = JSON.stringify(param);

    // Check if we already have an atom for this parameter
    if (atomsCache.has(cacheKey)) {
      return atomsCache.get(cacheKey)!;
    }

    // Create a new atom for this parameter
    const newAtom = createAtom(param);
    atomsCache.set(cacheKey, newAtom);

    return newAtom;
  };
}

// Create a new atom function with family support
const atomWithFamily = Object.assign({}, atom, {
  family: atomFamily,
});

// Export both the original atom and the enhanced version
export { atom, atomWithFamily };
export type { Atom } from "@nexus-state/core";
