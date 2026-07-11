import { atom, createStore } from '@nexus-state/core';
import { batch } from '@nexus-state/core/batching';

const countAtom = atom(0);
const store = createStore();
export { store, countAtom, batch };
