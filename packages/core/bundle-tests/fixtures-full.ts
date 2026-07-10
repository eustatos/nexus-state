// Fixture: Full backward-compatible import (star import from main)
import * as ns from '../src/index';
import { batch } from '../src/batching';
import { devtools } from '../src/devtools';
import { createReactiveValue } from '../src/reactive';
import { serializeState } from '../src/utils/serialization';

const countAtom = ns.atom(0);
const store = ns.createStore({
  plugins: [devtools({ name: 'TestApp' })],
  batching: true,
});
const reactive = createReactiveValue(store, countAtom);

// Prevent tree-shaking of serializeState
const state = serializeState(store);
void state;

export { ns, batch, store, countAtom, reactive };
