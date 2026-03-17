# Nexus State

> Framework-agnostic state management with built-in Time Travel debugging

[![Coverage Status](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/@nexus-state/core?label=@nexus-state/core)](https://www.npmjs.com/package/@nexus-state/core)
[![npm downloads](https://img.shields.io/npm/dw/@nexus-state/core)](https://www.npmjs.com/package/@nexus-state/core)

---

## ✨ Features

<<<<<<< Updated upstream
- 🎯 **Atom-based architecture** — Fine-grained reactivity like Jotai
- 🔄 **Built-in Time Travel** — Debug with undo/redo out of the box
- 🌐 **Framework Agnostic** — React, Vue, Svelte, vanilla JS
- 📦 **Lightweight** — Only ~4KB (smaller than Redux & Jotai)
- 🔌 **Extensible** — Middleware, plugins, DevTools integration
- 🛠️ **TypeScript First** — Full type inference
=======
### 1. Framework-Agnostic + Fine-Grained Reactivity

**The Problem:**
- **Jotai/Recoil:** React-only, can't share state logic with Vue/Svelte
- **Redux/Zustand:** Framework-agnostic, but coarse-grained (whole store updates)
- **Pinia/Vuex:** Vue-only, can't use in React

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
- ✅ Migrate from React to Vue without rewriting state management
>>>>>>> Stashed changes

---

## 🤔 Why Nexus State?

### If you need...

✅ **Multi-framework support** — Share state logic between React, Vue, and Svelte
✅ **Built-in debugging** — Time travel without additional setup
✅ **Fine-grained reactivity** — Atom-based updates, no unnecessary re-renders
✅ **TypeScript first** — Full type inference, no `any` types
✅ **Small bundle** — 4.2KB core with tree-shaking

### If you don't need...

❌ **Complex boilerplate** — No reducers, actions, or selectors required
❌ **Mandatory providers** — Optional StoreProvider for React (can pass store explicitly)
❌ **React-only solutions** — Works with any framework

---

## 🚀 Quick Start

### Installation

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

### Basic Usage

```javascript
import { atom, createStore } from '@nexus-state/core';

// Create an atom
const countAtom = atom(0);

// Create a store
const store = createStore();

// Get the value of the atom
console.log(store.get(countAtom)); // 0

// Update the value of the atom
store.set(countAtom, 1);

// Subscribe to changes
const unsubscribe = store.subscribe(countAtom, (value) => {
  console.log('Count changed:', value);
});
```

---

## 📖 Examples

### Counter with Computed Atoms

```javascript
import { atom, createStore } from '@nexus-state/core';

const countAtom = atom(0, 'count');
const doubleAtom = atom((get) => get(countAtom) * 2, 'double');
const isEvenAtom = atom((get) => get(countAtom) % 2 === 0, 'isEven');

const store = createStore();

store.subscribe(countAtom, (value) => {
  console.log(`Count: ${value}, Double: ${store.get(doubleAtom)}, Even: ${store.get(isEvenAtom)}`);
});

store.set(countAtom, 5); 
// Count: 5, Double: 10, Even: false
```

### React Integration

```tsx
import { useAtom } from '@nexus-state/react';
import { atom } from '@nexus-state/core';

const countAtom = atom(0, 'count');

function Counter() {
  const [count, setCount] = useAtom(countAtom);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <button onClick={() => setCount(c => c - 1)}>-</button>
    </div>
  );
}
```

**React Compatibility:**

| React Version | Support Status |
|---------------|----------------|
| 17.x          | ✅ Supported   |
| 18.x          | ✅ Supported   |
| 19.x          | ✅ Supported   |

Minimum required: React 17.0.0

### Vue Integration

```vue
<script setup>
import { atom } from '@nexus-state/core';
import { useAtom } from '@nexus-state/vue';

const countAtom = atom(0, 'count');
const [count, setCount] = useAtom(countAtom);
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="setCount(c => c + 1)">+</button>
  </div>
</template>
```

### Async Operations

```javascript
import { asyncAtom, createStore } from '@nexus-state/async';

const fetchUserAtom = asyncAtom(
  async (userId) => {
    const res = await fetch(`/api/users/${userId}`);
    return res.json();
  },
  { key: 'user' }
);

const store = createStore();
const user = await store.get(fetchUserAtom, { userId: 123 });
console.log(user); // { id: 123, name: 'John' }
```

### Form State Management

```javascript
import { createFormAtom } from '@nexus-state/form';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

const formAtom = createFormAtom(userSchema, {
  name: '',
  email: '',
});

// Access form state
const { values, errors, touched } = formAtom.getState();

// Update field
formAtom.setField('name', 'John');

// Validate
const isValid = await formAtom.validate();
```

### Persistence

```javascript
import { persistAtom } from '@nexus-state/persist';

const settingsAtom = persistAtom(
  'settings',
  { theme: 'dark', language: 'en' },
  { storage: 'localStorage' }
);

// Value is automatically loaded from localStorage
// and saved on every change
```

### Middleware

```javascript
import { atom, createStore } from '@nexus-state/core';
import { createMiddlewarePlugin } from '@nexus-state/middleware';

const loggerMiddleware = createMiddlewarePlugin({
  afterSet: (atom, value, prevValue) => {
    console.log(`Atom ${atom.name}: ${prevValue} → ${value}`);
  }
});

const store = createStore();
store.use(loggerMiddleware);

const countAtom = atom(0, 'count');
store.set(countAtom, 5); // Atom count: 0 → 5
```

### Time Travel Debugging

```javascript
import { 
  atom, 
  createStore,
  StateSnapshotManager,
  StateRestorer,
  atomRegistry 
} from '@nexus-state/core';

const store = createStore();
const countAtom = atom(0, 'count');

// Create snapshot managers
const snapshotManager = new StateSnapshotManager(atomRegistry);
const stateRestorer = new StateRestorer(atomRegistry);

// Make some changes
store.set(countAtom, 1);
store.set(countAtom, 2);
store.set(countAtom, 3);

// Create a snapshot
const snapshot = snapshotManager.createSnapshot('Before increment');

// Continue making changes
store.set(countAtom, 4);
store.set(countAtom, 5);

// Restore to previous state
const success = stateRestorer.restoreFromSnapshot(snapshot);
console.log(store.get(countAtom)); // 3
```

---

## ⏱️ Time Travel Debugging

Nexus State includes powerful Time Travel functionality that allows you to track state changes and move between different states for debugging and historical state restoration.

```javascript
import { 
  StateSnapshotManager,
  StateRestorer 
} from '@nexus-state/core';
import { atomRegistry } from '@nexus-state/core';

// Create time travel components
const snapshotManager = new StateSnapshotManager(atomRegistry);
const stateRestorer = new StateRestorer(atomRegistry);

// Create a snapshot of the current state
const snapshot = snapshotManager.createSnapshot('USER_ACTION');

// Restore state from a snapshot
const success = stateRestorer.restoreFromSnapshot(snapshot);
```

**Features:**
- 📸 Snapshot creation with custom labels
- ⏪ Undo/Redo support
- 🔄 Transactional restoration
- 🛡️ Error recovery with rollback
- 📊 Delta-based snapshots for memory efficiency

---

## ⚡ Performance

Benchmarks run on **M1 MacBook Pro, Node.js 20, vitest 3.0**. Results are averages of 10+ runs.

### Core Operations

| Operation | ops/sec | mean (ms) | p99 (ms) | Stability |
|-----------|---------|-----------|----------|-----------|
| Get atom (10K iterations) | 3,365 | 0.30 | 1.26 | ±3.4% ✅ |
| Set atom (10K iterations) | 150 | 6.64 | 20.30 | ±8.3% ✅ |
| Subscribe + update (1K) | 2,105 | 0.47 | 1.24 | ±2.7% ✅ |
| Concurrent subscriptions | 21,063 | 0.048 | 0.17 | ±4.2% ✅ |
| Function update (1K) | 2,019 | 0.50 | 2.28 | ±4.3% ✅ |
| Rapid set/get cycles | 1,207 | 0.83 | 3.10 | ±12.5% ⚠️ |

### Computed Atoms

| Operation | ops/sec | mean (ms) | p99 (ms) |
|-----------|---------|-----------|----------|
| 1 dependency | 572 | 1.75 | 4.63 |
| 5 dependencies | 98 | 10.17 | 18.88 |
| 10 dependencies | 25 | 39.42 | 57.28 ⚠️ |
| Chain of 5 | 253 | 3.94 | 6.07 |
| Chain of 10 | 139 | 7.19 | 10.82 |
| Diamond dependency | 320 | 3.12 | 9.19 |

### Comparison with Competitors

| Metric | Nexus State | Zustand | Jotai | Redux Toolkit |
|--------|-------------|---------|-------|---------------|
| Bundle Size (min+gzip) | 4.2KB | 1KB | 12KB | 13KB |
| Get atom (single) | 0.03ms | 0.02ms | 0.04ms | 0.08ms |
| Set atom (single) | 0.66ms | 0.45ms | 0.72ms | 1.2ms |
| Computed (1 dep) | 1.75ms | 1.2ms | 2.1ms | 3.5ms |
| Memory (1000 atoms) | 2.1MB | 1.8MB | 3.2MB | 4.5MB |

> **Note:** Competitor benchmarks from public sources. Actual results may vary based on environment and use case.

### Bundle Size Comparison

```
Zustand:       █ 1KB
Nexus State:   ████ 4.2KB
Jotai:         ████████████ 12KB
Redux Toolkit: █████████████ 13KB
MobX:          ██████████████ 14KB
```

### Performance Notes

✅ **Strengths:**
- Fast concurrent subscriptions (21K ops/sec)
- Efficient function updates (2K ops/sec)
- Low overhead for simple operations

⚠️ **Areas for optimization:**
- Computed atoms with 10+ dependencies show degradation (39ms → target: <20ms)
- High variance in memory cleanup operations (under investigation)

📊 [View full benchmark methodology and results](docs/performance/benchmarks.md)

---

## 📊 Comparison

| Feature | Nexus State | Zustand | Jotai | Redux Toolkit | MobX |
|---------|-------------|---------|-------|---------------|------|
| **Framework Support** |
| React | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vue | ✅ | ❌ | ❌ | ❌ | ✅ |
| Svelte | ✅ | ❌ | ❌ | ❌ | ❌ |
| Vanilla JS | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Architecture** |
| Atom-based | ✅ | ❌ | ✅ | ❌ | ❌ |
| Store-based | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Features** |
| Time Travel | ✅ Built-in | ❌ | ❌ | ✅ Plugin | ❌ |
| DevTools | ✅ | Plugin | Plugin | ✅ | Plugin |
| Persistence | ✅ Plugin | ✅ Built-in | ❌ | Plugin | Plugin |
| TypeScript | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Performance** |
| Bundle Size | 4.2KB | 1KB | 12KB | 13KB | 14KB |
| Tree-shakable | ✅ | ✅ | ✅ | ⚠️ Partial | ❌ |
| **DX** |
| Learning Curve | Medium | Low | Medium | High | Medium |
| Boilerplate | Low | Low | Low | High | Medium |

---

## 📦 Packages

| Package | Description |
|---------|-------------|
| [@nexus-state/core](packages/core) | Core library |
| [@nexus-state/react](packages/react) | React integration |
| [@nexus-state/vue](packages/vue) | Vue integration |
| [@nexus-state/svelte](packages/svelte) | Svelte integration |
| [@nexus-state/persist](packages/persist) | Persistence plugin |
| [@nexus-state/devtools](packages/devtools) | DevTools plugin |
| [@nexus-state/middleware](packages/middleware) | Middleware plugin |
| [@nexus-state/immer](packages/immer) | Immer integration |
| [@nexus-state/web-worker](packages/web-worker) | Web Worker integration |
| [@nexus-state/async](packages/async) | Async state management |
| [@nexus-state/family](packages/family) | Atom family utilities |
| [@nexus-state/cli](packages/cli) | CLI tools |
| [@nexus-state/query](packages/query) | Data fetching & caching |
| [@nexus-state/form](packages/form) | Form management |

---

## 🗺️ Roadmap

### Q2 2026
- [ ] v1.0 Release
- [ ] Query package stabilization
- [ ] Form package stabilization

### Q3 2026
- [ ] VSCode Extension
- [ ] Performance optimization (<3KB core)
- [ ] React Suspense integration

### Q4 2026
- [ ] Angular adapter
- [ ] Solid.js adapter
- [ ] State visualizer tool

---

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](docs/community/contributing.md) for details.

### Good First Issues
- [Link to good first issues](https://github.com/astashkin-a/nexus-state/contribute)

### Join Our Community
- 💬 [GitHub Discussions](https://github.com/astashkin-a/nexus-state/discussions)
- 📖 [Documentation](https://nexus-state.website.yandexcloud.net/)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/astashkin-a/nexus-state.git
cd nexus-state

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

---

## 📚 Documentation

Visit our [full documentation](docs/) for detailed guides and API references:

- [Getting Started](docs/getting-started/)
- [API Reference](docs/api/)
- [Examples](docs/examples/)
- [Migration Guides](docs/migration/)
- [Performance Guide](docs/performance/)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
