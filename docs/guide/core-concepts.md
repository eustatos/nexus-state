# Core Concepts

Nexus State is built around a few core concepts that make it powerful and flexible.

## Atoms

Atoms are the basic units of state in Nexus State. They hold a single value and can be updated and subscribed to.

```javascript
import { atom } from '@nexus-state/core';

// Create an atom with an initial value
const countAtom = atom(0);

// Create a computed atom
const doubleCountAtom = atom((get) => get(countAtom) * 2);
```

## Store

A store holds atoms and provides methods to interact with them.

```javascript
import { createStore } from '@nexus-state/core';

const store = createStore();

// Get atom value
const value = store.get(atom);

// Set atom value
store.set(atom, newValue);

// Subscribe to atom changes
const unsubscribe = store.subscribe(atom, (value) => {
  console.log('Value changed:', value);
});
```

## Adapters

Adapters provide integration with different frameworks like React, Vue, and Svelte.

### React

```javascript
import { useAtom } from '@nexus-state/react';

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### Vue

```javascript
import { useAtom } from '@nexus-state/vue';

export default {
  setup() {
    const count = useAtom(countAtom);
    
    return { count };
  }
};
```

### Svelte

```javascript
import { useAtom } from '@nexus-state/svelte';

let count = useAtom(countAtom);
```

## Packages

Nexus State provides additional packages that extend functionality for specific use cases.

### @nexus-state/async

Handle asynchronous operations with built-in loading and error states.

```javascript
import { createAsyncOperation } from '@nexus-state/async';

const fetchData = createAsyncOperation(async () => {
  const response = await fetch('/api/data');
  return await response.json();
});

// Execute async operation
const data = await fetchData.execute();
```

### @nexus-state/family

Manage related state as a group with derived and computed values.

```javascript
import { createFamily } from '@nexus-state/family';

const userFamily = createFamily({
  profile: { name: '', email: '' },
  preferences: { theme: 'light' }
});

// Access nested state
const name = userFamily.get('profile.name');

// Update nested state
userFamily.set('profile.name', 'John Doe');

// Add derived state
userFamily.addDerived('displayName', (state) => {
  return state.profile.name || 'Anonymous';
});
```

### @nexus-state/immer

Use Immer for immutable state updates with a mutable API.

```javascript
import { createImmerStore } from '@nexus-state/immer';

const store = createImmerStore({ users: [] });

// Update state with mutable API
store.setState((draft) => {
  draft.users.push({ id: 1, name: 'John' });
});
```

### @nexus-state/middleware

Add cross-cutting concerns like logging, validation, and analytics.

```javascript
import { createMiddleware } from '@nexus-state/middleware';

const logger = createMiddleware((action, next, store) => {
  console.log('Action:', action);
  return next(action);
});

store.use(logger);
```

### @nexus-state/persist

Persist state to localStorage, sessionStorage, or custom storage.

```javascript
import { createPersist } from '@nexus-state/persist';

const persist = createPersist({
  key: 'app-state',
  storage: localStorage
});

store.use(persist);
```

## Plugins

Plugins extend the functionality of stores.

```javascript
import { createStore } from '@nexus-state/core';
import { persist } from '@nexus-state/persist';

const store = createStore([
  persist(countAtom, { key: 'count', storage: localStorage })
]);
```