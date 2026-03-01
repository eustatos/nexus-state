# Async API

## atom.async(options)

Creates an async atom with built-in loading, error, and data states.

```javascript
import { atom } from '@nexus-state/async';

const userAtom = atom.async({
  fetchFn: () => fetch('/api/user').then(res => res.json())
});
```

### Options

- `fetchFn` (required): A function that returns a Promise with the data
- `initialValue` (optional): The initial value for the data state

### Usage

```javascript
import { createStore } from '@nexus-state/core';
import { atom } from '@nexus-state/async';

const userAtom = atom.async({
  fetchFn: () => fetch('/api/user').then(res => res.json()),
  initialValue: null
});

const store = createStore();

// Fetch the data
store.get(userAtom).fetch(store);

// Access the state
const state = store.get(userAtom);
console.log(state.loading); // true
console.log(state.error); // null
console.log(state.data); // null
```