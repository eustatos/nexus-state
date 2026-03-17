# Examples

These examples demonstrate how to use Nexus State in various scenarios.

## Basic Examples

- [Counter](/examples/counter) - A simple counter implementation with increment/decrement/reset
- [Todo List](/examples/todo-list) - A todo list application with add/toggle/remove

## Advanced Examples

- [Forms](/examples/form) - Form handling with validation
- [Async Data](/examples/async-data) - Handling asynchronous data

## React-Specific Examples

- **Computed Atoms** - See the [Computed Atoms Demo](https://github.com/nexus-state/nexus-state/blob/main/apps/demo-react/src/computed-atoms-demo/index.jsx) in the repository for examples of:
  - Form with real-time validation
  - Selective updates (components only re-render when their atoms change)
  - Multiple computed values from the same source
  - Form batch updates
  - Render counters to demonstrate selective updates

- **DevTools Integration** - See the [DevTools Demo App](/examples/devtools-demo) for:
  - State inspection
  - Time-travel debugging
  - Action tracking
  - Stack traces

## Recipe Examples

- [DevTools Integration](/recipes/devtools) - Complete guide to debugging with DevTools
- [Forms with Validation](/recipes/forms) - Advanced form handling
- [Async Atoms](/recipes/async-atoms) - Handling async data
- [Caching](/recipes/caching) - Caching strategies

## Unique Nexus State Features

### SSR with Isolated Stores

Nexus State allows you to create isolated stores per request, perfect for SSR frameworks like Next.js and Nuxt.js:

```javascript
// pages/[id].tsx
import { atom, createStore } from '@nexus-state/core';

const userAtom = atom(null, 'user');

export async function getServerSideProps(context) {
  // Create isolated store per request - no memory leaks!
  const store = createStore();
  store.set(userAtom, await fetchUser(context.params.id));
  return { props: { initialState: store.getState() } };
}

function Page({ initialState }) {
  const store = useMemo(() => createStore().setState(initialState), [initialState]);
  const [user] = useAtom(userAtom);
  return <div>{user?.name}</div>;
}
```

### Testing with Clean State

Create fresh stores for each test - no mocks, no side effects:

```javascript
describe('User feature', () => {
  it('should handle login', () => {
    // Fresh store per test - no side effects!
    const store = createStore();
    store.set(userAtom, { id: 1, name: 'John' });
    expect(store.get(userAtom)).toEqual({ id: 1, name: 'John' });
  });
});
```

### Time-Travel Per-Scope

Each store has its own time-travel timeline - debug Component A without affecting Component B:

```javascript
// Component A has its own timeline
const storeA = createStore();
const controllerA = new TimeTravelController(storeA);

// Component B has its own timeline
const storeB = createStore();
const controllerB = new TimeTravelController(storeB);

controllerA.undo(); // Only Component A state changes
controllerB.undo(); // Only Component B state changes
```

### Multi-Framework State Sharing

Write state logic once, use in React, Vue, and Svelte:

```typescript
// Define atoms ONCE
const userAtom = atom(null, 'user');
const cartAtom = atom([], 'cart');

// Use in React
function ReactComponent() {
  const [user, setUser] = useAtom(userAtom);
  return <div>{user?.name}</div>;
}

// Use in Vue
function VueComponent() {
  const [user, setUser] = useAtom(userAtom);
  return <div>{{ user?.name }}</div>;
}

// Use in Svelte
function SvelteComponent() {
  const user = useAtom(userAtom);
  return <div>{$user?.name}</div>;
}
```