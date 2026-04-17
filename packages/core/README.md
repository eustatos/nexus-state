# @nexus-state/core

> The only state management with **isolated stores** and **independent time-travel** per scope — framework-agnostic with fine-grained reactivity
>
> **🚀 Signal-Ready Architecture** — Future-proof design ready for TC39 Signals standard
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/core)](https://www.npmjs.com/package/@nexus-state/core)
> [![npm downloads](https://img.shields.io/npm/dw/@nexus-state/core)](https://www.npmjs.com/package/@nexus-state/core)
> [![Coverage Status](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 🚀 Signal-Ready Architecture

**Nexus State is designed for the future** with Signal-Ready Architecture that prepares your codebase for the upcoming [TC39 Signals](https://github.com/tc39/proposal-signals) standard.

### What is Signal-Ready?

Signal-Ready means:

1. **IReactiveValue abstraction** — Unified interface for reactive values
2. **AtomContext support** — Metadata for operations (silent, time-travel, etc.)
3. **Fine-grained reactivity** — Already implemented, Signals will enhance it
4. **Backward compatible** — Your code works today and tomorrow

### Migration Path

```typescript
// Current API (v1.x)
const reactive = new StoreBasedReactive(store, atom);
reactive.getValue();
reactive.setValue(10, { silent: true });

// Future API (v2.0 with Signals)
const reactive = createReactiveValue(store, atom); // Same interface!
reactive.getValue();
reactive.setValue(10, { silent: true }); // Same API!
```

---

## 🎯 What Makes Nexus State Unique?

### 1. Framework-Agnostic + Fine-Grained Reactivity

**The Problem:**

- **Jotai/Recoil:** React-only, can't share state logic with Vue/Svelte
- **Redux/Zustand:** Framework-agnostic, but coarse-grained (whole store updates)

**Nexus State Solution:**

```typescript
import { atom } from '@nexus-state/core';

// Define atoms ONCE
const userAtom = atom(null, 'user');
const cartAtom = atom([], 'cart');

// Use in React, Vue, Svelte — same atoms, same logic
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

```typescript
import { createStore } from '@nexus-state/core';

// Each store has independent state
const store1 = createStore();
const store2 = createStore();

// Same atom, different values — no interference
store1.set(userAtom, { name: 'Alice' });
store2.set(userAtom, { name: 'Bob' });
```

**Use Cases:**

- ✅ **SSR:** Isolated state per request (no memory leaks)
- ✅ **Testing:** Clean state per test (no mocks needed)
- ✅ **Multi-tenancy:** Different users, different states, same atoms

---

## 📦 Installation

```bash
npm install @nexus-state/core
```

**Optional integrations:**

```bash
npm install @nexus-state/react    # React hooks
npm install @nexus-state/query    # Data fetching (SSR, caching)
npm install @nexus-state/time-travel  # Time-travel debugging
npm install @nexus-state/undo-redo    # User-facing undo/redo
```

---

## 🚀 Quick Start (60 seconds)

```typescript
import { atom, createStore } from '@nexus-state/core';

// Create atom with initial value
const countAtom = atom(0, 'count');

// Create store
const store = createStore();

// Get value (auto-initialized from atom)
console.log(store.get(countAtom)); // 0

// Set value
store.set(countAtom, 5);
console.log(store.get(countAtom)); // 5
```

---

## 🤔 When to Use Nexus State?

### ✅ Choose Nexus State if you need:

| Use Case                | Why Nexus State?                                |
| ----------------------- | ----------------------------------------------- |
| Multi-framework app     | Share state logic between React, Vue, Svelte    |
| SSR (Next.js, Nuxt)     | Isolated stores per request, no Provider needed |
| Time-travel debugging   | Independent timelines per component             |
| Testing                 | Clean state per test, no mocks                  |
| Fine-grained reactivity | Only affected components re-render              |

### ❌ Don't use Nexus State if:

| Use Case           | Better Alternative                     |
| ------------------ | -------------------------------------- |
| Simple React app   | Jotai (simpler API)                    |
| Global state only  | Zustand (lighter)                      |
| Redux ecosystem    | Redux Toolkit (more plugins)           |
| React-only project | Jotai/Recoil (more React integrations) |

---

## 📖 Core Concepts

### Atoms

Atoms are **descriptors** that define initial values and names. They don't store state.

```typescript
import { atom } from '@nexus-state/core';

// Primitive atom
const countAtom = atom(0, 'count');

// Computed atom (derives from other atoms)
const doubleAtom = atom((get) => get(countAtom) * 2, 'double');

// Writable atom (custom read/write logic)
const customAtom = atom(
  (get) => get(countAtom),
  (get, set, value: number) => set(countAtom, value),
  'custom'
);
```

### Stores

Stores **hold state** for atoms. Each store has independent state.

```typescript
import { createStore } from '@nexus-state/core';

const store = createStore();

// Get value (lazy initialization from atom.read())
const count = store.get(countAtom);

// Set value
store.set(countAtom, 5);

// Subscribe to changes
const unsubscribe = store.subscribe(countAtom, (value) => {
  console.log('Count changed:', value);
});

// Get all state (for SSR hydration)
const state = store.getState();
```

### Architecture: Atoms vs Stores

**Key Concept:** Atoms are descriptors (keys), stores hold actual state.

**What this means:**

1. **Atom is a descriptor** — defines initial value and name, but doesn't store state
2. **Store holds state** — each store has its own state for each atom
3. **One atom, many states** — the same atom can have different values in different stores
4. **Lazy initialization** — state is created on first `get()` or `set()`

```typescript
import { atom, createStore } from '@nexus-state/core';

// Define atom ONCE (anywhere in your code)
const userAtom = atom({ name: 'Anonymous' }, 'user');

// Create multiple stores
const store1 = createStore();
const store2 = createStore();

// Each store has INDEPENDENT state for the same atom
store1.set(userAtom, { name: 'Alice' });
store2.set(userAtom, { name: 'Bob' });

// No interference between stores
console.log(store1.get(userAtom)); // { name: 'Alice' }
console.log(store2.get(userAtom)); // { name: 'Bob' }
```

**Why this matters:**

- ✅ **SSR:** Isolated state per request (no memory leaks)
- ✅ **Testing:** Clean state per test (no mocks needed)
- ✅ **Multi-tenancy:** Different users, different states, same atoms

---

## 🔌 Ecosystem Extensions

| Package                      | Purpose                      | Example                           |
| ---------------------------- | ---------------------------- | --------------------------------- |
| **@nexus-state/react**       | React hooks                  | `useAtom(atom, store)`            |
| **@nexus-state/query**       | Data fetching (SSR, caching) | `useSuspenseQuery({ queryKey, queryFn })` |
| **@nexus-state/async**       | Simple async state           | `asyncAtom({ fetchFn })`          |
| **@nexus-state/time-travel** | Undo/redo debugging          | `controller.undo()`               |
| **@nexus-state/persist**     | LocalStorage persistence     | `persistAtom('key', value)`       |
| **@nexus-state/form**        | Form management              | `createFormAtom(schema)`          |
| **@nexus-state/middleware**  | Per-atom validation & transforms | `createMiddlewarePlugin(atom, config)` |
| **@nexus-state/devtools**    | Redux DevTools integration   | `devTools()`                      |
| **@nexus-state/immer**       | Immutable updates            | `produce(draft => ...)`           |
| **@nexus-state/family**      | Atom families                | `atomFamily(param => atom())`     |
| **@nexus-state/web-worker**  | Web Worker support           | `workerAtom({ fn })`              |
| **@nexus-state/cli**         | CLI tools                    | `nexus-state generate`            |

📖 **Full ecosystem overview:** [Nexus State Packages](../../README.md)

---

### @nexus-state/react

React hooks for Nexus State.

```typescript
import { useAtom } from '@nexus-state/react';
import { atom, createStore } from '@nexus-state/core';

const countAtom = atom(0, 'count');
const store = createStore();

function Counter() {
  const [count, setCount] = useAtom(countAtom, store);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  );
}
```

📖 **Full docs:** [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react)

---

### @nexus-state/query

Data fetching & caching with SSR support.

```typescript
import { prefetchQuery } from '@nexus-state/query/react';
import { useSuspenseQuery } from '@nexus-state/query/react';

// SSR - prefetch data before rendering
export async function getServerSideProps(context) {
  await prefetchQuery({
    queryKey: ['user', context.params.id],
    queryFn: () => fetchUser(context.params.id),
  });
  return { props: {} };
}

// Client - useSuspenseQuery for Suspense integration
function Page() {
  const { data } = useSuspenseQuery({
    queryKey: ['user', id],
    queryFn: fetchUser,
  });
  return <div>{data.name}</div>;
}
```

📖 **Full docs:** [@nexus-state/query](https://www.npmjs.com/package/@nexus-state/query)

---

### @nexus-state/async

Async atoms for data fetching.

```typescript
import { asyncAtom } from '@nexus-state/async';
import { createStore } from '@nexus-state/core';

const store = createStore();

const [userAtom, fetchUser] = asyncAtom({
  fetchFn: async (store) => {
    const response = await fetch('/api/user');
    return response.json();
  },
  initialValue: null,
});

// Fetch data
fetchUser(store);

// Get state: { loading, error, data }
const state = store.get(userAtom);
```

📖 **Full docs:** [@nexus-state/async](https://www.npmjs.com/package/@nexus-state/async)

---

### @nexus-state/time-travel

Time-travel debugging для разработчиков.

```typescript
import { TimeTravelController } from '@nexus-state/time-travel';
import { createStore } from '@nexus-state/core';

const store = createStore();
const controller = new TimeTravelController(store);

controller.capture('init');
store.set(countAtom, 5);
controller.capture('increment');

controller.undo(); // Отладка: назад к init
controller.redo(); // Вперёд к increment
```

📖 **Full docs:** [@nexus-state/time-travel](https://www.npmjs.com/package/@nexus-state/time-travel)

---

### @nexus-state/undo-redo

User-facing undo/redo для вашего приложения.

```typescript
import { createUndoRedo } from '@nexus-state/undo-redo';
import { atom, createStore } from '@nexus-state/core';

const editorAtom = atom({ text: '' }, 'editor');
const store = createStore();

const undoRedo = createUndoRedo({
  maxLength: 50,
  debounce: 300,
});

// Push state changes
store.subscribe(editorAtom, (state) => {
  undoRedo.push(state);
});

// User can undo/redo
function onUndo() {
  const previousState = undoRedo.undo();
  if (previousState) store.set(editorAtom, previousState);
}

function onRedo() {
  const nextState = undoRedo.redo();
  if (nextState) store.set(editorAtom, nextState);
}
```

📖 **Full docs:** [@nexus-state/undo-redo](https://www.npmjs.com/package/@nexus-state/undo-redo)

---

## ⚡ Performance

Nexus State provides fine-grained reactivity with minimal overhead. Benchmarks run on **M1 MacBook Pro, Node.js 20, vitest 3.0**.

### Core Operations (10,000 iterations)

| Operation | ops/sec | mean (ms) | Stability |
|-----------|---------|-----------|-----------|
| `store.get()` | **1,728** | 0.58 | ±2.73% |
| `store.set()` + 1 subscriber | **16.7** | 59.8 | ±3.14% |
| Computed atom (1 dep) | **17.1** | 58.6 | ±8.36% |
| Computed atom (5 deps) | **3.1** | 321 | ±2.51% |

> **Note:** `set()` is slower due to dependency tracking, notifications, and DevTools integration. Use `batch()` for bulk updates.

### Batching Benefits

Batching reduces notification overhead for multiple updates:

| Scenario | ops/sec | Speedup |
|----------|---------|---------|
| Batch: 100 sets | **6.8** | **1.4x faster** |
| No batch: 100 sets | **4.9** | Baseline |

```typescript
import { batch } from '@nexus-state/core';

// Batch multiple updates
batch(() => {
  store.set(atom1, value1);
  store.set(atom2, value2);
  // Single notification cycle instead of 100
});
```

### Silent Mode (for time-travel, undo/redo)

Silent mode suppresses notifications for better performance:

| Mode | Time (10K ops) | Speedup |
|------|----------------|---------|
| Silent | 6.14ms | **49% faster** |
| Normal | 11.95ms | Baseline |

```typescript
// Silent update (no notifications)
store.set(atom, value, { silent: true });

// Or use setSilently
store.setSilently(atom, value);
```

### Plugin Overhead

Plugins add minimal overhead:

| Plugins | Overhead |
|---------|----------|
| 3 plugins | **+8%** |

### Dependency Patterns

Performance varies by dependency graph complexity:

| Pattern | ops/sec | mean (ms) |
|---------|---------|-----------|
| Diamond (2 deps → 1) | **13.7** | 73 |
| Chain of 5 | **14.4** | 70 |
| Chain of 10 | **12.3** | 82 |
| Complex graph (6 atoms) | **6.5** | 154 |

> **Key finding:** Linear dependencies scale better than deep graphs.

### Running Benchmarks

```bash
# Core store benchmarks
npx vitest bench __benchmarks__/store.bench.ts

# IReactiveValue abstraction benchmarks
pnpm test -- src/reactive/__tests__/benchmarks.test.ts
```

> **Note:** Results vary by hardware and environment. For accurate comparisons, run benchmarks on your target machine.

---

## 📚 API Reference

### Core Functions

| Function      | Signature                   | Description           |
| ------------- | --------------------------- | --------------------- |
| `atom`        | `atom(initialValue, name?)` | Create primitive atom |
| `atom`        | `atom(read, name?)`         | Create computed atom  |
| `atom`        | `atom(read, write, name?)`  | Create writable atom  |
| `createStore` | `createStore(plugins?)`     | Create isolated store |

### Store Methods

| Method        | Signature                            | Description                      |
| ------------- | ------------------------------------ | -------------------------------- |
| `get`         | `get(atom)`                          | Get atom value                   |
| `set`         | `set(atom, update)`                  | Set atom value                   |
| `subscribe`   | `subscribe(atom, callback)`          | Subscribe to changes             |
| `getState`    | `getState()`                         | Get all state (for SSR)          |
| `setState`    | `setState(state)`                    | Set multiple atoms by name       |
| `applyPlugin` | `applyPlugin(plugin)`                | Add a plugin (e.g. middleware)   |
| `reset`       | `reset(atom)`                        | Reset atom to default            |
| `clear`       | `clear()`                            | Clear all atoms to defaults      |

### Utilities

| Utility        | Description                              |
| -------------- | ---------------------------------------- |
| `batch`        | Batch multiple state updates             |
| `createEnhancedStore` | Create store with plugin support  |
| `logger`       | Debug logging utilities                  |
| `serializeState` | Serialize store state for SSR/hydration |

> **Note:** Atoms are lazily registered in each store's `ScopedRegistry` on first access — no global registry exists.

---

## 🔧 Troubleshooting

### 1. "Atom already exists" warning

**Cause:** Duplicate atom names in development.

**Solution:** Use unique names or accept the warning (atoms still work).

```typescript
// ✅ Good
const userAtom = atom(null, 'user-unique-id');

// ⚠️ Warning (but works)
const userAtom = atom(null, 'user');
const anotherUserAtom = atom(null, 'user'); // Duplicate name
```

---

### 2. State not updating in component

**Cause:** Missing subscription or wrong store reference.

**Solution:** Use framework hooks (e.g., `useAtom`) or subscribe manually.

```typescript
// React
import { useAtom } from '@nexus-state/react';
const [value, setValue] = useAtom(atom, store);

// Vanilla
const unsubscribe = store.subscribe(atom, (value) => {
  // Update UI
});
```

---

### 3. SSR: State leaks between requests

**Cause:** Using global store instead of per-request store.

**Solution:** Create new store per request.

```typescript
// ✅ Correct
export async function getServerSideProps(context) {
  const store = createStore(); // ← New store per request
  // ...
}

// ❌ Wrong
const globalStore = createStore(); // ← Shared between requests!
```

---

### 4. Computed atom not recalculating

**Cause:** Missing `get()` call in computed function.

**Solution:** Use `get()` for all dependencies.

```typescript
// ✅ Correct
const sumAtom = atom((get) => get(aAtom) + get(bAtom));

// ❌ Wrong
const sumAtom = atom((get) => aAtom + bAtom); // ← Not reactive!
```

---

### 5. setState doesn't work

**Cause:** Atom not initialized (never accessed) or name mismatch.

**Solution:** Access atom first or use correct names.

```typescript
const store = createStore();
const userAtom = atom(null, 'user');

// Initialize atom first
store.get(userAtom);

// Now setState works
store.setState({ user: { name: 'John' } });
```

---

## 📦 Full Ecosystem

### Core Packages

| Package                                                                  | Description             | npm                                                          |
| ------------------------------------------------------------------------ | ----------------------- | ------------------------------------------------------------ |
| [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core)     | Framework-agnostic core | [Install](https://www.npmjs.com/package/@nexus-state/core)   |
| [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react)   | React hooks             | [Install](https://www.npmjs.com/package/@nexus-state/react)  |
| [@nexus-state/vue](https://www.npmjs.com/package/@nexus-state/vue)       | Vue integration         | [Install](https://www.npmjs.com/package/@nexus-state/vue)    |
| [@nexus-state/svelte](https://www.npmjs.com/package/@nexus-state/svelte) | Svelte integration      | [Install](https://www.npmjs.com/package/@nexus-state/svelte) |

### Data & State

| Package                                                                    | Description             | npm                                                           |
| -------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------- |
| [@nexus-state/query](https://www.npmjs.com/package/@nexus-state/query)     | Data fetching & caching | [Install](https://www.npmjs.com/package/@nexus-state/query)   |
| [@nexus-state/async](https://www.npmjs.com/package/@nexus-state/async)     | Async atoms             | [Install](https://www.npmjs.com/package/@nexus-state/async)   |
| [@nexus-state/persist](https://www.npmjs.com/package/@nexus-state/persist) | Persistence             | [Install](https://www.npmjs.com/package/@nexus-state/persist) |

### Forms

| Package                                                                                          | Description                   | npm                                                                      |
| ------------------------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------ |
| [@nexus-state/form](https://www.npmjs.com/package/@nexus-state/form)                             | Form management with DevTools | [Install](https://www.npmjs.com/package/@nexus-state/form)               |
| [@nexus-state/form-builder-react](https://www.npmjs.com/package/@nexus-state/form-builder-react) | Visual form builder           | [Install](https://www.npmjs.com/package/@nexus-state/form-builder-react) |
| [@nexus-state/form-schema-zod](https://www.npmjs.com/package/@nexus-state/form-schema-zod)       | Zod validation                | [Install](https://www.npmjs.com/package/@nexus-state/form-schema-zod)    |
| [@nexus-state/form-schema-yup](https://www.npmjs.com/package/@nexus-state/form-schema-yup)       | Yup validation                | [Install](https://www.npmjs.com/package/@nexus-state/form-schema-yup)    |

### DevTools & Debugging

| Package                                                                            | Description                 | npm                                                               |
| ---------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| [@nexus-state/time-travel](https://www.npmjs.com/package/@nexus-state/time-travel) | Time-travel debugging (dev) | [Install](https://www.npmjs.com/package/@nexus-state/time-travel) |
| [@nexus-state/undo-redo](https://www.npmjs.com/package/@nexus-state/undo-redo)     | User-facing undo/redo       | [Install](https://www.npmjs.com/package/@nexus-state/undo-redo)   |
| [@nexus-state/middleware](https://www.npmjs.com/package/@nexus-state/middleware)   | Per-atom validation & transforms | [Install](https://www.npmjs.com/package/@nexus-state/middleware) |
| [@nexus-state/devtools](https://www.npmjs.com/package/@nexus-state/devtools)       | Redux DevTools integration  | [Install](https://www.npmjs.com/package/@nexus-state/devtools)    |

**Full documentation:** [nexus-state.website.yandexcloud.net](https://nexus-state.website.yandexcloud.net/)

---

## 📄 License

MIT
