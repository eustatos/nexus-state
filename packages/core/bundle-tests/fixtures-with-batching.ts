// Fixture: Core + batching
import { atom, createStore } from '../src/index';
import { batch } from '../src/batching';

const countAtom = atom(0);
const store = createStore({ batching: true });

// Use batch to prevent tree-shaking
batch(() => {
  store.set(countAtom, 1);
});

export { store, countAtom };
