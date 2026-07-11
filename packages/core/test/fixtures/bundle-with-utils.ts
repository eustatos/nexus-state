import { atom, createStore } from '@nexus-state/core';
import { serializeState } from '@nexus-state/core/utils';

const countAtom = atom(0);
const store = createStore();
export { store, countAtom, serializeState };
