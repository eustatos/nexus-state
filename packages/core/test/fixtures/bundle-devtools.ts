/**
 * Scenario 3: Minimal core + devtools subpath
 * Measures: atom + createStore + devtools plugin
 * Expected: +2KB gzip over minimal
 */
import { atom, createStore } from '@nexus-state/core';
import { devtools } from '@nexus-state/core/devtools';

const count = atom(0, 'count');
const store = createStore();

export { count, store, devtools };
