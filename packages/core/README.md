# @nexus-state/core

> The core package of the Nexus State ecosystem - a powerful state management solution for modern JavaScript applications
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/core)](https://www.npmjs.com/package/@nexus-state/core)
> [![npm downloads](https://img.shields.io/npm/dw/@nexus-state/core)](https://www.npmjs.com/package/@nexus-state/core)
> [![Coverage for core package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=core)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 📦 Installation

```bash
npm install @nexus-state/core
```

---

## ✨ Features

- 🎯 **Atom-based architecture** — Fine-grained reactivity for precise updates
- 🔄 **Reactive** — Automatic updates when state changes
- 📘 **TypeScript First** — Full type inference with no `any` types
- 🌐 **Framework Agnostic** — Works with React, Vue, Svelte, or vanilla JS
- 🔌 **Extensible** — Middleware and plugin support
- 🛠️ **DevTools Ready** — Automatic atom registration for debugging

---

## 🤔 When to Use

### If you need...

✅ **Framework-agnostic state** — Share logic between React, Vue, and Svelte
✅ **Fine-grained reactivity** — Atom-based updates, no unnecessary re-renders
✅ **TypeScript support** — Full type inference out of the box
✅ **Small bundle** — Lightweight core with tree-shaking
✅ **DevTools integration** — Built-in debugging capabilities

### If you don't need...

❌ **Complex boilerplate** — No reducers, actions, or selectors required
❌ **Context providers** — No wrapping your app in providers
❌ **React-only solutions** — This works with any framework

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

const isAdultAtom = atom(
  (get) => get(ageAtom) >= 18,
  'isAdult'
);

const profileSummaryAtom = atom(
  (get) => {
    const name = get(fullNameAtom);
    const age = get(ageAtom);
    return `${name}, ${age} years old`;
  },
  'profileSummary'
);

const store = createStore();

// Update firstName - only fullName and profileSummary recalculate
store.set(firstNameAtom, 'Jane');
```

---

## 📦 Ecosystem

Nexus State provides additional packages for enhanced functionality:

| Package | Description |
|---------|-------------|
| [@nexus-state/react](https://github.com/eustatos/nexus-state/tree/main/packages/react) | React bindings |
| [@nexus-state/vue](https://github.com/eustatos/nexus-state/tree/main/packages/vue) | Vue.js bindings |
| [@nexus-state/svelte](https://github.com/eustatos/nexus-state/tree/main/packages/svelte) | Svelte bindings |
| [@nexus-state/persist](https://github.com/eustatos/nexus-state/tree/main/packages/persist) | State persistence |
| [@nexus-state/middleware](https://github.com/eustatos/nexus-state/tree/main/packages/middleware) | Middleware system |
| [@nexus-state/devtools](https://github.com/eustatos/nexus-state/tree/main/packages/devtools) | DevTools integration |
| [@nexus-state/immer](https://github.com/eustatos/nexus-state/tree/main/packages/immer) | Immer integration |
| [@nexus-state/async](https://github.com/eustatos/nexus-state/tree/main/packages/async) | Async state management |
| [@nexus-state/family](https://github.com/eustatos/nexus-state/tree/main/packages/family) | Atom families |
| [@nexus-state/query](https://github.com/eustatos/nexus-state/tree/main/packages/query) | Data fetching & caching |
| [@nexus-state/form](https://github.com/eustatos/nexus-state/tree/main/packages/form) | Form management |
| [@nexus-state/web-worker](https://github.com/eustatos/nexus-state/tree/main/packages/web-worker) | Web Worker support |
| [@nexus-state/cli](https://github.com/eustatos/nexus-state/tree/main/packages/cli) | CLI tools |

---

## 📄 License

MIT
