import { atom, createStore } from '@nexus-state/core';
import { devtools } from '@nexus-state/core/devtools';

const countAtom = atom(0);
const store = createStore({ plugins: [devtools] });
export { store, countAtom };
