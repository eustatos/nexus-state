/**
 * Scenario 5: Minimal core + utils subpath
 * Measures: atom + createStore + serializeState
 * Expected: +1KB gzip over minimal
 */
import { atom, createStore } from '@nexus-state/core';
import { serializeState } from '@nexus-state/core/utils';

const count = atom(0, 'count');
const store = createStore();

export { count, store, serializeState };
