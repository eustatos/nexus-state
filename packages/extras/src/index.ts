/**
 * @nexus-state/extras - Collection of optional plugins and utilities
 *
 * This package consolidates several small utility packages into one
 * with subpath exports for tree-shaking.
 *
 * @packageDocumentation
 */

export { asyncAtom, atomWithAsync, type AsyncAtomData, type AsyncAtomOptions, type AsyncAtomDataWithFetch } from './async';
export { atomFamily, atomWithFamily } from './family';
export { immerAtom, setImmer } from './immer';
export { persist, localStorageStorage, sessionStorageStorage, type PersistStorage, type PersistConfig } from './persist';
export { middleware, type MiddlewareConfig } from './middleware';
export { workerAtom, type WorkerAtomOptions } from './web-worker';
