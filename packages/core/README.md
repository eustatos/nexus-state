# @nexus-state/core

> The core package of the Nexus State ecosystem - the only state management with **isolated stores** and **independent time-travel** for each scope
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/core)](https://www.npmjs.com/package/@nexus-state/core)
> [![npm downloads](https://img.shields.io/npm/dw/@nexus-state/core)](https://www.npmjs.com/package/@nexus-state/core)
> [![Coverage for core package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=core)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 🎯 What makes Nexus State unique?

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
  const [user, setUser] = useAtom(userAtom, store);
  return <div>{user?.name}</div>;
}

// Use in Vue (returns Ref, auto-unpacks in template)
function VueComponent() {
  const user = useAtom(userAtom, store);
  return <div>{user.value?.name}</div>;
}

// Use in Svelte (returns Readable, use $ prefix)
function SvelteComponent() {
  const user = useAtom(userAtom, store);
  return <div>{$user?.name}</div>;
}
```

**Benefits:**

- ✅ Write state logic once, use everywhere
- ✅ Fine-grained updates (only affected components re-render)
- ✅ Share business logic between frontend frameworks

---

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

**Benefits:**

- ✅ SSR without memory leaks (isolated per request)
- ✅ Testing without side effects (clean state per test)
- ✅ Debug specific components independently
- ✅ Multiple time-travel timelines in one app

---

## 📦 Installation

```bash
npm install @nexus-state/core @nexus-state/time-travel
```

---

## ✨ Features

- 🎯 **Atom-based architecture** — Fine-grained reactivity for precise updates
- 🔄 **Reactive** — Automatic updates when state changes
- 📘 **TypeScript First** — Full type inference with no `any` types
- 🌐 **Framework Agnostic** — Works with React, Vue, Svelte, or vanilla JS
- 🔌 **Extensible** — Middleware and plugin support
- 🛠️ **DevTools Ready** — Automatic atom registration for debugging
- 🕒 **Time Travel** — Debug state changes with undo/redo (via @nexus-state/time-travel)

---

## 🤔 When to Use

### If you need...

- ✅ **Framework-agnostic state** — Share logic between React, Vue, and Svelte
- ✅ **Fine-grained reactivity** — Atom-based updates, no unnecessary re-renders
- ✅ **TypeScript support** — Full type inference out of the box
- ✅ **Small bundle** — Lightweight core with tree-shaking
- ✅ **DevTools integration** — Built-in debugging capabilities

### If you don't need...

- ❌ **Complex boilerplate** — No reducers, actions, or selectors required
- ❌ **Context providers** — No wrapping your app in providers
- ❌ **React-only solutions** — This works with any framework

---

## 🚀 Quick Start

### Basic Counter

```javascript
import { atom, createStore } from '@nexus-state/core';

// Create an atom with initial value
const countAtom = atom(0, 'count');

// Create a store
const store = createStore();

// Get the value
console.log(store.get(countAtom)); // 0

// Update the value
store.set(countAtom, 5);

// Subscribe to changes
const unsubscribe = store.subscribe(countAtom, (value) => {
  console.log('Count changed:', value);
});
```

---

## 📖 Core Concepts

### Atoms

Atoms are the fundamental units of state in Nexus State. Each atom represents a single piece of state that can be observed and updated reactively.

```javascript
import { atom } from '@nexus-state/core';

// Create an atom with initial value
const countAtom = atom(0);

// Create an atom with a name for better debugging
const namedCountAtom = atom(0, 'count');

// Create a computed atom
const doubleCountAtom = atom((get) => get(countAtom) * 2);

// Create a writable atom
const writableCountAtom = atom(0, (get, set, value) => {
  set(countAtom, value);
});
```

All atoms are automatically registered in a global registry for DevTools integration and time travel support. You can provide an optional name parameter to atoms for better debugging experience in DevTools.

### Global Atom Registry

Nexus State automatically maintains a global registry of all created atoms to support DevTools integration and time travel features.

```javascript
import { atom, atomRegistry } from '@nexus-state/core';

// Create atoms (automatically registered)
const countAtom = atom(0, 'count');
const nameAtom = atom('John', 'name');

// Access the registry
const allAtoms = atomRegistry.getAll();
const atomName = atomRegistry.getName(countAtom);
const retrievedAtom = atomRegistry.get(countAtom.id);
```

### Stores

Stores are containers that hold multiple atoms and provide methods for managing state.

```javascript
import { atom, createStore } from '@nexus-state/core';

const countAtom = atom(0);
const nameAtom = atom('John');

const myStore = createStore();

// Set initial values
myStore.set(countAtom, 5);
myStore.set(nameAtom, 'Jane');

// Get current values
console.log(myStore.get(countAtom)); // 5
console.log(myStore.get(nameAtom)); // "Jane"

// Subscribe to changes
const unsubscribe = myStore.subscribe(countAtom, (value) => {
  console.log('Count changed to:', value);
});
```

### Enhanced Stores with DevTools

For DevTools integration and enhanced debugging capabilities:

```javascript
import { atom, createEnhancedStore } from '@nexus-state/core';

const countAtom = atom(0, 'count');
const store = createEnhancedStore();

// Connect to DevTools
store.connectDevTools();
```

For Time Travel functionality (undo/redo), use the separate package:

```bash
npm install @nexus-state/time-travel
```

```javascript
import { atom, createEnhancedStore } from '@nexus-state/core';
import { SimpleTimeTravel } from '@nexus-state/time-travel';

const countAtom = atom(0, 'count');
const store = createEnhancedStore();
const timeTravel = new SimpleTimeTravel(store);

// Capture snapshots
timeTravel.capture('action');

// Navigate through history
timeTravel.undo();
timeTravel.redo();
```

### Undo/Redo for User Interfaces

For simple undo/redo in user interfaces (forms, text editors), use:

```bash
npm install @nexus-state/undo-redo
```

```javascript
import { createStore } from '@nexus-state/core';
import { UndoRedo } from '@nexus-state/undo-redo';

const store = createStore();
const undoRedo = new UndoRedo(store, { maxHistory: 50 });

// Capture state
undoRedo.capture();

// Undo/Redo
undoRedo.undo();
undoRedo.redo();
```

---

## 📖 Examples

### Counter with Computed Atoms

This example demonstrates a simple counter with computed values:

```javascript
import { atom, createStore } from '@nexus-state/core';

// Basic atom for counter
const countAtom = atom(0, 'counter');

// Computed atom for doubled value
const doubleCountAtom = atom((get) => get(countAtom) * 2, 'doubleCount');

// Computed atom for even/odd check
const isEvenAtom = atom((get) => get(countAtom) % 2 === 0, 'isEven');

// Create store
const store = createStore();

// Subscribe to changes
store.subscribe(countAtom, (value) => {
  console.log('Count changed to:', value);
});

// Update atom
store.set(countAtom, 5);

// Get computed values
console.log(store.get(doubleCountAtom)); // 10
console.log(store.get(isEvenAtom)); // false
```

### React Integration

```tsx
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/react';

const countAtom = atom(0, 'counter');
const store = createStore();

function Counter() {
  const [count, setCount] = useAtom(countAtom, store);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### Computed Atoms

Computed atoms automatically recalculate when their dependencies change:

```javascript
import { atom, createStore } from '@nexus-state/core';

// User profile atoms
const firstNameAtom = atom('John', 'firstName');
const lastNameAtom = atom('Doe', 'lastName');
const ageAtom = atom(30, 'age');

// Computed atoms
const fullNameAtom = atom(
  (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
  'fullName'
);

const isAdultAtom = atom((get) => get(ageAtom) >= 18, 'isAdult');

const profileSummaryAtom = atom((get) => {
  const name = get(fullNameAtom);
  const age = get(ageAtom);
  return `${name}, ${age} years old`;
}, 'profileSummary');

const store = createStore();

// Update firstName - only fullName and profileSummary recalculate
store.set(firstNameAtom, 'Jane');
```

---

## ⚡ Performance

Benchmarks run on **M1 MacBook Pro, Node.js 20, vitest 3.0**. Results are averages of 10+ runs.

### Core Operations

| Operation                 | ops/sec | mean (ms) | p99 (ms) | Stability |
| ------------------------- | ------- | --------- | -------- | --------- |
| Get atom (10K iterations) | 3,365   | 0.30      | 1.26     | ±3.4% ✅  |
| Set atom (10K iterations) | 150     | 6.64      | 20.30    | ±8.3% ✅  |
| Subscribe + update (1K)   | 2,105   | 0.47      | 1.24     | ±2.7% ✅  |
| Concurrent subscriptions  | 21,063  | 0.048     | 0.17     | ±4.2% ✅  |
| Function update (1K)      | 2,019   | 0.50      | 2.28     | ±4.3% ✅  |

### Computed Atoms

| Operation          | ops/sec | mean (ms) | p99 (ms) |
| ------------------ | ------- | --------- | -------- |
| 1 dependency       | 572     | 1.75      | 4.63     |
| 5 dependencies     | 98      | 10.17     | 18.88    |
| 10 dependencies    | 25      | 39.42 ⚠️  | 57.28 ⚠️ |
| Chain of 5         | 253     | 3.94      | 6.07     |
| Chain of 10        | 139     | 7.19      | 10.82    |
| Diamond dependency | 320     | 3.12      | 9.19     |

### Comparison with Competitors

| Metric                     | Nexus State | Zustand | Jotai  | Redux Toolkit |
| -------------------------- | ----------- | ------- | ------ | ------------- |
| **Bundle Size** (min+gzip) | 4.2KB       | 1KB     | 12KB   | 13KB          |
| **Get atom** (single)      | 0.03ms      | 0.02ms  | 0.04ms | 0.08ms        |
| **Set atom** (single)      | 0.66ms      | 0.45ms  | 0.72ms | 1.2ms         |
| **Computed** (1 dep)       | 1.75ms      | 1.2ms   | 2.1ms  | 3.5ms         |
| **Memory** (1000 atoms)    | 2.1MB       | 1.8MB   | 3.2MB  | 4.5MB         |

> **Note:** Competitor benchmarks from public sources. Actual results may vary based on environment and use case.

### Performance Notes

✅ **Strengths:**

- Fast concurrent subscriptions (21K ops/sec)
- Efficient function updates (2K ops/sec)
- Low overhead for simple operations

⚠️ **Areas for optimization:**

- Computed atoms with 10+ dependencies show degradation (39ms → target: <20ms)
- High variance in memory cleanup operations (under investigation)

---

## 📖 Advanced Examples

### Async State with @nexus-state/async

```javascript
import { asyncAtom } from '@nexus-state/async';
import { createStore } from '@nexus-state/core';

// Create async atom for fetching user data
const fetchUserAtom = asyncAtom({
  fetchFn: async () => {
    const res = await fetch('/api/user/123');
    return res.json();
  },
});

const store = createStore();

// Fetch data
const [userAtom, fetchUser] = fetchUserAtom;
fetchUser(store);

// Subscribe to loading state
store.subscribe(userAtom, (state) => {
  console.log(`Loading: ${state.loading}, Data: ${state.data}`);
});
```

### Form Management with @nexus-state/form

```javascript
import { createFormAtom } from '@nexus-state/form';
import { z } from 'zod';

// Schema with validation
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Create form atom
const loginFormAtom = createFormAtom(loginSchema, {
  email: '',
  password: '',
});

// Access form state
const { values, errors, touched } = loginFormAtom.getState();

// Update field
loginFormAtom.setField('email', 'user@example.com');

// Validate
const isValid = await loginFormAtom.validate();
```

### Persistence with @nexus-state/persist

```javascript
import { persistAtom } from '@nexus-state/persist';

// Atom that automatically persists to localStorage
const settingsAtom = persistAtom(
  'settings',
  {
    theme: 'dark',
    language: 'en',
  },
  {
    storage: 'localStorage',
  }
);

// Value is automatically loaded from localStorage
// and saved on every change
```

### Middleware with @nexus-state/middleware

```javascript
import { atom, createStore } from '@nexus-state/core';
import { createMiddlewarePlugin } from '@nexus-state/middleware';

// Create logger middleware
const loggerMiddleware = createMiddlewarePlugin({
  afterSet: (atom, value, prevValue) => {
    console.log(`Atom changed: ${prevValue} → ${value}`);
  },
});

const store = createStore();
store.applyPlugin(loggerMiddleware);

const countAtom = atom(0, 'count');
store.set(countAtom, 5); // Logs: Atom changed: 0 → 5
```

---

## 📚 API Reference

### Core Functions

| Function                | Signature                                                | Description                | Example                                  |
| ----------------------- | -------------------------------------------------------- | -------------------------- | ---------------------------------------- |
| **atom**                | `atom<T>(value: T, name?: string): Atom<T>`              | Create a primitive atom    | `atom(0, 'count')`                       |
| **atom** (computed)     | `atom<T>(fn: (get) => T, name?: string): Atom<T>`        | Create a computed atom     | `atom((get) => get(count) * 2)`          |
| **createStore**         | `createStore(): Store`                                   | Create a new store         | `createStore()`                          |
| **createEnhancedStore** | `createEnhancedStore(plugins?, options?): EnhancedStore` | Create store with DevTools | `createEnhancedStore()`                  |
| **batch**               | `batch(fn: () => void): void`                            | Batch multiple updates     | `batch(() => { set(a, 1); set(b, 2); })` |

### Time Travel

| Class                    | Description                 | Example                           |
| ------------------------ | --------------------------- | --------------------------------- |
| **TimeTravelController** | Main time travel controller | `new TimeTravelController(store)` |
| **SimpleTimeTravel**     | Simplified time travel API  | `new SimpleTimeTravel(store)`     |

For more information, see [@nexus-state/time-travel](https://github.com/eustatos/nexus-state/tree/main/packages/time-travel).

### Global Registry

| Method          | Signature                                       | Description              |
| --------------- | ----------------------------------------------- | ------------------------ |
| **get**         | `get(id: symbol): Atom \| null`                 | Get atom by ID           |
| **getAll**      | `getAll(): Map<symbol, Atom>`                   | Get all registered atoms |
| **getName**     | `getName(atom: Atom): string \| null`           | Get atom name            |
| **getMetadata** | `getMetadata(atom: Atom): AtomMetadata \| null` | Get atom metadata        |
| **clear**       | `clear(): void`                                 | Clear all registrations  |

### Utilities

| Function           | Description                  |
| ------------------ | ---------------------------- |
| **serializeState** | Serialize state to JSON      |
| **serializeMap**   | Serialize Map to JSON        |
| **serializeSet**   | Serialize Set to JSON        |
| **ActionTracker**  | Track actions for DevTools   |
| **logger**         | Debug logger for development |

---

## 🔧 Troubleshooting

### Computed atoms not updating

**Problem:** Computed atom doesn't recalculate when dependencies change.

**Solution:** Ensure you're using `get()` inside the computed function:

```javascript
// ❌ Wrong - doesn't track dependencies
const wrongAtom = atom(countAtom.value * 2);

// ✅ Correct - tracks dependencies
const correctAtom = atom((get) => get(countAtom) * 2);
```

---

### Memory leaks

**Problem:** Memory usage grows over time.

**Solution:** Dispose of subscriptions when components unmount:

```javascript
// React
useEffect(() => {
  const unsubscribe = store.subscribe(atom, callback);
  return () => unsubscribe(); // Cleanup on unmount
}, []);

// Tests
afterEach(() => {
  atomRegistry.clear(); // Clear registry between tests
});
```

---

### Circular dependencies

**Problem:** Error about circular dependencies in computed atoms.

**Solution:** Refactor atoms to avoid circular references:

```javascript
// ❌ Circular: A depends on B, B depends on A
const atomA = atom((get) => get(atomB) + 1);
const atomB = atom((get) => get(atomA) + 1);

// ✅ Solution: Extract shared logic
const atomBase = atom(0);
const atomA = atom((get) => get(atomBase) + 1);
const atomB = atom((get) => get(atomBase) + 2);
```

---

### State not persisting

**Problem:** State is lost on page refresh.

**Solution:** Use `@nexus-state/persist` for automatic persistence:

```javascript
import { persistAtom } from '@nexus-state/persist';

const settingsAtom = persistAtom('settings', defaultValue, {
  storage: 'localStorage',
});
```

---

### DevTools not connecting

**Problem:** Redux DevTools doesn't show Nexus State atoms.

**Solution:** Use `createEnhancedStore` instead of `createStore`:

```javascript
// ❌ Won't connect to DevTools
const store = createStore();

// ✅ Connects to DevTools
const store = createEnhancedStore();
```

---

## 📦 Ecosystem

Nexus State provides additional packages for enhanced functionality:

| Package                                                                                          | Description             |
| ------------------------------------------------------------------------------------------------ | ----------------------- |
| [@nexus-state/react](https://github.com/eustatos/nexus-state/tree/main/packages/react)           | React bindings          |
| [@nexus-state/vue](https://github.com/eustatos/nexus-state/tree/main/packages/vue)               | Vue.js bindings         |
| [@nexus-state/svelte](https://github.com/eustatos/nexus-state/tree/main/packages/svelte)         | Svelte bindings         |
| [@nexus-state/persist](https://github.com/eustatos/nexus-state/tree/main/packages/persist)       | State persistence       |
| [@nexus-state/middleware](https://github.com/eustatos/nexus-state/tree/main/packages/middleware) | Middleware system       |
| [@nexus-state/devtools](https://github.com/eustatos/nexus-state/tree/main/packages/devtools)     | DevTools integration    |
| [@nexus-state/immer](https://github.com/eustatos/nexus-state/tree/main/packages/immer)           | Immer integration       |
| [@nexus-state/async](https://github.com/eustatos/nexus-state/tree/main/packages/async)           | Async state management  |
| [@nexus-state/family](https://github.com/eustatos/nexus-state/tree/main/packages/family)         | Atom families           |
| [@nexus-state/query](https://github.com/eustatos/nexus-state/tree/main/packages/query)           | Data fetching & caching |
| [@nexus-state/form](https://github.com/eustatos/nexus-state/tree/main/packages/form)             | Form management         |
| [@nexus-state/web-worker](https://github.com/eustatos/nexus-state/tree/main/packages/web-worker) | Web Worker support      |
| [@nexus-state/cli](https://github.com/eustatos/nexus-state/tree/main/packages/cli)               | CLI tools               |

---

## 📄 License

MIT
