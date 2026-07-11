// Fixture: Core + reactive
import { atom, createStore } from '../src/index';
import { createReactiveValue } from '../src/reactive';

const countAtom = atom(0);
const store = createStore();
const reactive = createReactiveValue(store, countAtom);

export { store, countAtom, reactive };
