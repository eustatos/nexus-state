// Web Worker integration for nexus-state
import { atom, Atom, Store, createStore } from '@nexus-state/core';

// Type definitions for web worker atom
export type WorkerAtomOptions<T> = {
  worker: Worker;
  initialValue: T;
};

// Global map to track worker atoms and their current values
const workerAtomValues = new Map<Atom<any>, any>();

// Track all stores that have accessed any worker atom
const atomToStores = new Map<symbol, Set<Store>>();

/**
 * Register that a store has accessed a specific worker atom
 */
function registerAtomInStore(atomId: symbol, store: Store): void {
  if (!atomToStores.has(atomId)) {
    atomToStores.set(atomId, new Set());
  }
  atomToStores.get(atomId)!.add(store);
}

/**
 * Patch a store's get/set/subscribe to track worker atom access
 */
function patchStoreForTracking(store: Store): void {
  // Only patch once
  if ((store as any).__workerTrackingPatched) return;
  (store as any).__workerTrackingPatched = true;

  const originalGet = store.get.bind(store);
  const originalSet = store.set.bind(store);
  const originalSubscribe = store.subscribe?.bind(store);

  (store as any).get = (atom: Atom<any>) => {
    if (workerAtomValues.has(atom)) {
      registerAtomInStore(atom.id, store);
    }
    return originalGet(atom);
  };

  (store as any).set = (atom: Atom<any>, value: any) => {
    if (workerAtomValues.has(atom)) {
      registerAtomInStore(atom.id, store);
    }
    return originalSet(atom, value);
  };

  if (originalSubscribe) {
    (store as any).subscribe = (atom: Atom<any>, cb: (v: any) => void) => {
      if (workerAtomValues.has(atom)) {
        registerAtomInStore(atom.id, store);
      }
      return originalSubscribe(atom, cb);
    };
  }
}

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
  const internalAtom = atom(initialValue, `worker-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

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
        const stores = atomToStores.get(internalAtom.id) || new Set<Store>();
        for (const s of stores) {
          try {
            s.set(internalAtom, value);
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

// Re-export createStore for convenience (uses worker-aware version)
const _originalCreateStore = createStore;

/**
 * Creates a store that tracks worker atom registrations
 */
export function createWorkerStore(): Store {
  const store = _originalCreateStore();
  patchStoreForTracking(store);
  return store;
}

// Monkey-patch the core createStore so all stores track worker atoms
// This is done by re-exporting our patched version
export { _originalCreateStore as _unpatchedCreateStore };

// Auto-patch: override createStore in the global module scope
// Any store created via `createStore` from @nexus-state/core will NOT be auto-patched,
// so consumers should use `createWorkerStore` from this package.
// For backward compat, we also patch store on first access:

/**
 * Ensure a store is patched for worker atom tracking.
 * Call this if you use `createStore` from core with worker atoms.
 */
export function ensureWorkerTracking(store: Store): void {
  patchStoreForTracking(store);
}