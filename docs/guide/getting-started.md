# Getting Started

Welcome to Nexus State! This guide will help you get started with using Nexus State in your projects.

## What makes Nexus State unique?

### 1. Framework-Agnostic + Fine-Grained Reactivity

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

### 2. Isolated State + Time-Travel Per-Scope

**The Problem:**
- **Jotai/Recoil:** Global state, can't isolate for SSR or testing
- **Redux:** Single global store, time-travel affects entire app

**Nexus State Solution:**

#### SSR: Isolated state per request (no memory leaks)
```typescript
// Next.js / Nuxt.js
export async function getServerSideProps(context) {
  const store = createStore(); // ← Isolated store per request

  store.set(userAtom, await fetchUser(context.params.id));
  store.set(postsAtom, await fetchPosts(context.params.id));

  return { props: { initialState: store.getState() } };
}
// No Provider needed! No memory leaks between users!
```

#### Testing: Clean state per test
```typescript
describe('User feature', () => {
  it('should handle login', () => {
    const store = createStore(); // ← Fresh store per test
    const controller = new TimeTravelController(store);

    store.set(userAtom, { id: 1 });
    controller.capture('logged-in');

    // Test in isolation, no side effects
  });
});
```

#### Time-Travel: Independent timelines for different components
```typescript
// Component A has its own timeline
const storeA = createStore();
const controllerA = new TimeTravelController(storeA);

// Component B has its own timeline
const storeB = createStore();
const controllerB = new TimeTravelController(storeB);

// Debug Component A without affecting Component B
controllerA.undo(); // ← Only Component A state changes
controllerB.undo(); // ← Only Component B state changes
```

## Installation

To install Nexus State, run the following command:

```bash
npm install @nexus-state/core
```

For React integration:

```bash
npm install @nexus-state/react
```

For Vue integration:

```bash
npm install @nexus-state/vue
```

For Svelte integration:

```bash
npm install @nexus-state/svelte
```

### Additional Packages

For async operations:

```bash
npm install @nexus-state/async
```

For state families:

```bash
npm install @nexus-state/family
```

For middleware:

```bash
npm install @nexus-state/middleware
```

For persistence:

```bash
npm install @nexus-state/persist
```

For developer tools:

```bash
npm install @nexus-state/devtools
```

For Web Worker integration:

```bash
npm install @nexus-state/web-worker
```

## Basic Usage

Here's a simple example of how to use Nexus State:

```javascript
import { atom, createStore } from '@nexus-state/core';

// Create an atom
const countAtom = atom(0, 'count');

// Create a store
const store = createStore();

// Get the value of the atom
console.log(store.get(countAtom)); // 0

// Update the value of the atom
store.set(countAtom, 1);

// Functional update
store.set(countAtom, (prev) => prev + 1);
console.log(store.get(countAtom)); // 2

// Subscribe to changes
const unsubscribe = store.subscribe(countAtom, (value) => {
  console.log('Count changed:', value);
});
```

## Package-Specific Usage

### Async Operations

```javascript
import { createAsyncOperation } from '@nexus-state/async';

const fetchData = createAsyncOperation(async () => {
  const response = await fetch('/api/data');
  return await response.json();
});

// Execute async operation
const data = await fetchData.execute();
```

### State Families

```javascript
import { createFamily } from '@nexus-state/family';

const userFamily = createFamily({
  profile: { name: '', email: '' },
  preferences: { theme: 'light' }
});

// Access nested state
const name = userFamily.get('profile.name');
```

### Middleware

```javascript
import { createMiddleware } from '@nexus-state/middleware';

const logger = createMiddleware((action, next, store) => {
  console.log('Action:', action);
  return next(action);
});

store.use(logger);
```

### Persistence

```javascript
import { createPersist } from '@nexus-state/persist';

const persist = createPersist({
  key: 'app-state',
  storage: localStorage
});

store.use(persist);
```

## Next Steps

- Learn about [Core Concepts](/guide/core-concepts)
- Explore the [API reference](/api/)
- Check out [examples](/examples/)
- Try [recipes](/recipes/)
- See [package-specific examples](/recipes/package-examples)
- Migrating from v0.x? See the [Migration Guide](/migration/v0-to-v1)

## Quick Links

- [Installation](/getting-started/installation) - Detailed installation instructions
- [Core Concepts](/getting-started/core-concepts) - Understand the fundamental concepts
- [Time Travel](/examples/time-travel) - Learn about Time Travel functionality
- [DevTools](/guides/debugging) - Debug with DevTools
- [Best Practices](/guides/best-practices) - Follow best practices
- [Performance Guide](/performance/) - Optimize performance
