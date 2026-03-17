# Getting Started

Welcome to Nexus State! This section will help you get started with using Nexus State in your projects.

## What makes Nexus State unique?

### Framework-Agnostic + Fine-Grained Reactivity

**The Problem:**
- **Jotai/Recoil:** React-only, can't share state logic with Vue/Svelte
- **Redux/Zustand:** Framework-agnostic, but coarse-grained (whole store updates)

**Nexus State Solution:**
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

### Isolated State + Time-Travel Per-Scope

**The Problem:**
- **Jotai/Recoil:** Global state, can't isolate for SSR or testing
- **Redux:** Single global store, time-travel affects entire app

**Nexus State Solution:**
```typescript
// SSR: Isolated store per request (no memory leaks!)
export async function getServerSideProps(context) {
  const store = createStore();
  store.set(userAtom, await fetchUser(context.params.id));
  return { props: { initialState: store.getState() } };
}

// Testing: Fresh store per test (no side effects!)
describe('User feature', () => {
  it('should handle login', () => {
    const store = createStore();
    store.set(userAtom, { id: 1 });
    // Test in isolation
  });
});

// Time-Travel: Independent timelines for different components
const storeA = createStore();
const controllerA = new TimeTravelController(storeA);

const storeB = createStore();
const controllerB = new TimeTravelController(storeB);

controllerA.undo(); // Only Component A state changes
controllerB.undo(); // Only Component B state changes
```

## Quick Start

Install the core package:

```bash
npm install @nexus-state/core
```

Create your first state:

```javascript
import { atom, createStore } from '@nexus-state/core';

// Create an atom
const countAtom = atom(0, 'count');

// Create a store
const store = createStore();

// Get current value
console.log(store.get(countAtom)); // 0

// Update value
store.set(countAtom, 1);
console.log(store.get(countAtom)); // 1

// Subscribe to changes
const unsubscribe = store.subscribe(countAtom, (value) => {
  console.log('Count changed:', value);
});
```

## Next Steps

- Learn about [Core Concepts](./core-concepts.md)
- Explore [Examples](../examples/index.md)
- Check out [Recipes](../recipes/index.md)
- See [Package-Specific Examples](../recipes/package-examples.md)
