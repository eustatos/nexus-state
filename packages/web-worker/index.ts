// Web Worker integration for nexus-state
import { atom, Atom, Store, createStore, atomRegistry } from '@nexus-state/core';

// Type definitions for web worker atom
export type WorkerAtomOptions<T> = {
  worker: Worker;
  initialValue: T;
};

// Global map to track worker atoms and their current values
const workerAtomValues = new Map<Atom<any>, any>();

/**
 * Creates an atom that is managed in a Web Worker.
 * @template T - The type of the atom's value
 * @param {WorkerAtomOptions<T>} options - Configuration options for the worker atom
 * @returns {Atom<T>} An atom managed in a Web Worker
 * @example
 * const worker = new Worker('./worker.js');
 * const counterAtom = atom.worker({
 *   worker,
 *   initialValue: 0
 * });
 */
export function workerAtom<T>(options: WorkerAtomOptions<T>): Atom<T> {
  const { worker, initialValue } = options;

  // Create a regular atom to hold the value
  const internalAtom = atom(initialValue);

  // Store the initial value
  workerAtomValues.set(internalAtom, initialValue);

  // Listen for messages from the worker
  worker.onmessage = (event: MessageEvent) => {
    const { type, value } = event.data;

    switch (type) {
      case 'UPDATE': {
        // Update our local value map
        workerAtomValues.set(internalAtom, value);

        // Update the atom's value in all stores that contain it
        const stores = atomRegistry.getAllStoresForAtom(internalAtom.id);
        for (const store of stores) {
          try {
            store.set(internalAtom, value);
          } catch (e) {
            // Ignore errors - atom might not be settable in this store
          }
        }
        break;
      }
      default:
        console.warn(`Unknown message type: ${type}`);
    }
  };

  // Handle errors from the worker
  worker.onerror = (error: ErrorEvent) => {
    console.error('Web Worker error:', error.error);
  };

  return internalAtom;
}

// Extend the atom function to support web workers
export const atomWithWorker = Object.assign(atom, {
  worker: workerAtom,
});

/**
 * Helper function to create a store in a Web Worker.
 * @returns {Store} A store that can be used in a Web Worker
 */
export function createWorkerStore(): Store {
  return createStore();
}