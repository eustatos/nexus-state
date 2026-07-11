import { atom, createStore } from '@nexus-state/core';

const countAtom = atom(0);
const store = createStore();
export { store, countAtom };
