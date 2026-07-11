/**
 * Scenario 4: Minimal core + reactive subpath
 * Measures: atom + createStore + createReactiveValue
 * Expected: +1KB gzip over minimal
 */
import { atom, createStore } from '@nexus-state/core';
import { createReactiveValue } from '@nexus-state/core/reactive';

const count = atom(0, 'count');
const store = createStore();

export { count, store, createReactiveValue };
