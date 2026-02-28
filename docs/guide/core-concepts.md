# Core Concepts

Nexus State is built around a few core concepts that make it powerful and flexible.

## Atoms

Atoms are the basic units of state in Nexus State. They hold a single value and can be updated and subscribed to.

```javascript
import { atom } from '@nexus-state/core';

// Create an atom with an initial value
const countAtom = atom(0, 'count');

// Create a computed atom
const doubleCountAtom = atom((get) => get(countAtom) * 2, 'doubleCount');
```

## Store

A store holds atoms and provides methods to interact with them.

### Basic Store

```javascript
import { createStore } from '@nexus-state/core';

const store = createStore();

// Get atom value
const value = store.get(countAtom);

// Set atom value
store.set(countAtom, newValue);

// Subscribe to atom changes
const unsubscribe = store.subscribe(countAtom, (value) => {
  console.log('Value changed:', value);
});
```

### Store with Plugins

```javascript
import { createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';
import { middleware } from '@nexus-state/middleware';

const store = createStore([
  devTools({ name: 'My App' }),
  middleware(userAtom, {
    beforeSet: (atom, value) => validateUser(value),
    afterSet: (atom, value) => saveToStorage(value)
  })
]);
```

### Enhanced Store (Advanced)

For advanced features like **Time Travel** (undo/redo) and enhanced DevTools, use `createEnhancedStore`:

```javascript
import { createEnhancedStore } from '@nexus-state/core';

const store = createEnhancedStore([], {
  enableTimeTravel: true,
  enableDevTools: true,
  maxHistory: 50
});

// Now you can use time travel features
store.undo();
store.redo();
store.jumpTo(5);
```

> 📚 **Learn more:** See [Enhanced Store Guide](../guides/enhanced-store.md) for detailed documentation.

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
    const [count, setCount] = useAtom(countAtom);
    return { count, setCount };
  }
};
```

### Svelte

```javascript
import { useAtom } from '@nexus-state/svelte';

const [count, setCount] = useAtom(countAtom);
```

## Packages

Nexus State provides additional packages that extend functionality for specific use cases.

### @nexus-state/async

Handle asynchronous operations with built-in loading and error states.

```javascript
import { asyncAtom } from '@nexus-state/async';

const userAtom = asyncAtom('user', async (userId) => {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}, {
  retry: 3,
  cacheTime: 5 * 60 * 1000
});

// In component
const state = store.get(userAtom);
// state: { loading, data, error, isStale }
```

### @nexus-state/family

Manage related state as a group with dynamic atom creation.

```javascript
import { atom } from '@nexus-state/core';
import { atomFamily } from '@nexus-state/family';

// Create atom factory for users
const userAtomFamily = atomFamily((userId) =>
  atom({ id: userId, name: '', email: '' }, `user-${userId}`)
);

// Get atoms for specific users
const user1Atom = userAtomFamily(1);
const user2Atom = userAtomFamily(2);

// Use like regular atoms
store.set(user1Atom, { id: 1, name: 'John', email: 'john@example.com' });
```

### @nexus-state/immer

Use Immer for immutable state updates with a mutable API.

```javascript
import { createStore } from '@nexus-state/core';
import { immerAtom, setImmer } from '@nexus-state/immer';

const store = createStore();

// Create an atom with Immer support
const userAtom = immerAtom({
  profile: { name: 'John', contacts: { email: 'john@example.com' } },
  posts: [{ id: 1, title: 'Hello World' }]
}, store);

// Update state with mutable syntax
setImmer(userAtom, (draft) => {
  draft.profile.name = 'Jane';
  draft.profile.contacts.email = 'jane@example.com';
  draft.posts.push({ id: 2, title: 'Second Post' });
});
```

### @nexus-state/middleware

Add cross-cutting concerns like logging, validation, and analytics.

```javascript
import { createStore } from '@nexus-state/core';
import { middleware, createLogger, createValidator } from '@nexus-state/middleware';

const store = createStore();

// Logger for all atoms
store.use(createLogger());

// Validation for specific atom
store.use(createValidator(ageAtom, (value) => value >= 18));

// Custom middleware
store.use(middleware(userAtom, {
  beforeSet: (atom, value) => {
    if (!value.name) throw new Error('Name required');
    return value;
  },
  afterSet: (atom, value) => {
    api.saveUser(value); // Side effect
  }
}));
```

### @nexus-state/persist

Persist state to localStorage, sessionStorage, or custom storage.

```javascript
import { createStore } from '@nexus-state/core';
import { createPersist } from '@nexus-state/persist';

const store = createStore();

// Auto-save settings to localStorage
store.use(createPersist(settingsAtom, 'app-settings'));

// Settings are automatically saved on every change
store.set(settingsAtom, { theme: 'dark', notifications: true });
```

### @nexus-state/devtools

Connect to Redux DevTools for debugging.

```javascript
import { createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

const store = createStore([
  devTools({
    name: 'My App',
    trace: true,        // Enable stack traces
    maxAge: 50,         // Maximum history depth
    showAtomNames: true // Show atom names
  })
]);
```

## Next Steps

- [Enhanced Store Guide](../guides/enhanced-store.md) — Time travel and advanced features
- [API Reference](../api/) — Complete API documentation
- [Recipes](../recipes/) — Common patterns and solutions
