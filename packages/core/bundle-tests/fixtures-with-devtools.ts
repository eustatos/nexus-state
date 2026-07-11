// Fixture: Core + devtools
import { atom, createStore } from '../src/index';
import { devtools } from '../src/devtools';

const countAtom = atom(0);
const store = createStore({ plugins: [devtools({ name: 'TestApp' })] });

export { store, countAtom };
