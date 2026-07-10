// Fixture: Minimal core import (atom + createStore only)
import { atom, createStore } from '../src/index';

const countAtom = atom(0);
const store = createStore();

export { store, countAtom };
