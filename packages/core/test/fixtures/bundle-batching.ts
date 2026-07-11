/**
 * Scenario 2: Minimal core + batching subpath
 * Measures: atom + createStore + batch
 * Expected: +1KB gzip over minimal
 */
import { atom, createStore } from '@nexus-state/core';
import { batch } from '@nexus-state/core/batching';

const count = atom(0, 'count');
const store = createStore();

export { count, store, batch };
