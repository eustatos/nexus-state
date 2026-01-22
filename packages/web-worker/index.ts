// Web Worker integration for nexus-state
import { atom, Atom, Store, createStore } from '@nexus-state/core';

// Type definitions for web worker atom
export type WorkerAtomOptions<T> = {
  worker: Worker;
  initialValue: T;
};

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
  
  // Listen for messages from the worker
  worker.onmessage = (event) => {
    const { type } = event.data;
    
    switch (type) {
      case 'UPDATE':
        // Update the internal atom with the value from the worker
        // In a real implementation, we would need a way to update the store
        // This is a simplified example
        break;
      default:
        console.warn(`Unknown message type: ${type}`);
    }
  };
  
  // Handle errors from the worker
  worker.onerror = (error) => {
    console.error('Web Worker error:', error);
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