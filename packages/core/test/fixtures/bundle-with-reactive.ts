import { atom, createStore } from '@nexus-state/core';
import { createReactiveValue } from '@nexus-state/core/reactive';

const countAtom = atom(0);
const store = createStore();
export { store, countAtom, createReactiveValue };
