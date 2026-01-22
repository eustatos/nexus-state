// Core implementation of nexus-state

/**
 * Represents an atom which holds a value and can be updated and subscribed to.
 * @typedef {Object} Atom
 * @property {symbol} id - Unique identifier for the atom
 * @property {Function} read - Function to read the atom's value
 * @property {Function} [write] - Function to write to the atom
 */

/**
 * Represents a store which holds atoms and provides methods to interact with them.
 * @typedef {Object} Store
 * @property {Function} get - Get the current value of an atom
 * @property {Function} set - Set the value of an atom
 * @property {Function} subscribe - Subscribe to changes in an atom
 * @property {Function} getState - Get the state of all atoms
 */

/**
 * Creates an atom with an initial value or a computed atom based on other atoms.
 * @param {any|Function} initialValue - The initial value or a function to compute the value
 * @returns {Atom} The created atom
 * @example
 * // Create an atom with an initial value
 * const countAtom = atom(0);
 * 
 * // Create a computed atom
 * const doubleCountAtom = atom((get) => get(countAtom) * 2);
 */
export { atom } from './atom';

/**
 * Creates a store to hold atoms.
 * @param {Array<Function>} [plugins] - Array of plugins to apply to the store
 * @returns {Store} The created store
 * @example
 * // Create a basic store
 * const store = createStore();
 * 
 * // Create a store with plugins
 * const store = createStore([plugin1, plugin2]);
 */
export { createStore } from './store';

export type { Atom, Store } from './types';