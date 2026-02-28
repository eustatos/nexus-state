# @nexus-state/core

[![npm version](https://img.shields.io/npm/v/@nexus-state/core.svg)](https://www.npmjs.com/package/@nexus-state/core)
[![Bundle Size](https://img.shields.io/bundlephobia/min/@nexus-state/core)](https://bundlephobia.com/package/@nexus-state/core)
[![License](https://img.shields.io/npm/l/@nexus-state/core.svg)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)
[![Tests](https://img.shields.io/github/actions/workflow/status/eustatos/nexus-state/test.yml?branch=main)](https://github.com/eustatos/nexus-state/actions)

> 🎯 The core of Nexus State — a framework-agnostic state management library with atomic architecture

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state) • [Examples](https://github.com/eustatos/nexus-state/tree/main/examples)

---

## ✨ Why It's Cool

- 🎯 **Atomic Architecture** — granular state management
- ⚡ **Reactivity** — automatic updates on changes
- 🚀 **Performance** — selective rerenders, minimal overhead
- 🛠 **TypeScript** — full type inference from day one
- 🔌 **Framework-Agnostic** — works with React, Vue, Svelte, Vanilla
- 🧩 **Extensible** — middleware, plugins, integrations
- 🔍 **DevTools** — built-in debugging support
- ⏪ **Time Travel** — navigate through state history

---

## 📦 Installation

```bash
npm install @nexus-state/core
```

---

## 🚀 Quick Start

### Basic Usage

```javascript
import { atom, createStore } from '@nexus-state/core'

// Create an atom
const countAtom = atom(0, 'counter')

// Create a store
const store = createStore()

// Get value
console.log(store.get(countAtom)) // 0

// Set value
store.set(countAtom, 5)
console.log(store.get(countAtom)) // 5

// Subscribe to changes
const unsubscribe = store.subscribe(countAtom, (value) => {
  console.log('Count changed to:', value)
})

store.set(countAtom, 10) // "Count changed to: 10"
unsubscribe()
```

---

## 📖 API

### `atom(initialValue, [name])`

Creates an atom — the basic unit of state.

| Parameter | Type | Description |
|-----------|------|-------------|
| `initialValue` | `T` | Initial atom value |
| `name` | `string` (optional) | Name for debugging and DevTools |

**Returns:** `Atom<T>`

### `atom(computeFn, [name])`

Creates a computed atom.

| Parameter | Type | Description |
|-----------|------|-------------|
| `computeFn` | `Function` | `(get) => T` — compute function |
| `name` | `string` (optional) | Name for debugging |

**Returns:** `Atom<T>`

### `createStore([options])`

Creates a store for atoms.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | `'default'` | Store name |
| `devTools` | `boolean` | `true` | Enable DevTools |

**Returns:** `Store`

### Store Methods

| Method | Description |
|--------|-------------|
| `get(atom)` | Get atom value |
| `set(atom, value)` | Set atom value |
| `subscribe(atom, callback)` | Subscribe to changes |
| `batch(fn)` | Execute batch update |

---

## 💡 Usage Examples

### Computed Atoms

```javascript
import { atom, createStore } from '@nexus-state/core'

const store = createStore()

const firstNameAtom = atom('John', 'firstName')
const lastNameAtom = atom('Doe', 'lastName')

// Computed atom
const fullNameAtom = atom(
  (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
  'fullName'
)

console.log(store.get(fullNameAtom)) // "John Doe"

// Computed atom updates automatically when dependencies change
store.set(firstNameAtom, 'Jane')
console.log(store.get(fullNameAtom)) // "Jane Doe"
```

### Counter with History

```javascript
import { atom, createStore } from '@nexus-state/core'

const store = createStore()
const countAtom = atom(0, 'counter')
const historyAtom = atom([], 'history')

// Subscribe with history tracking
store.subscribe(countAtom, (value) => {
  const history = store.get(historyAtom)
  store.set(historyAtom, [...history, { value, time: Date.now() }])
})

store.set(countAtom, 1)
store.set(countAtom, 2)
store.set(countAtom, 3)

console.log(store.get(historyAtom))
// [{value: 1, time: ...}, {value: 2, time: ...}, {value: 3, time: ...}]
```

### Form with Validation

```javascript
import { atom, createStore } from '@nexus-state/core'

const store = createStore()

const formAtom = atom({
  email: '',
  password: '',
  errors: {},
  isValid: false
}, 'loginForm')

// Computed atom for validation
const validationAtom = atom((get) => {
  const form = get(formAtom)
  const errors = {}
  
  if (!form.email.includes('@')) {
    errors.email = 'Invalid email'
  }
  
  if (form.password.length < 6) {
    errors.password = 'Min 6 characters'
  }
  
  return {
    ...form,
    errors,
    isValid: Object.keys(errors).length === 0
  }
}, 'validatedForm')

// Update form field
function updateField(field, value) {
  const form = store.get(formAtom)
  store.set(formAtom, { ...form, [field]: value })
}

// Get validated form
const validatedForm = store.get(validationAtom)
console.log(validatedForm.isValid)
```

### Time Travel

```javascript
import { 
  atom, 
  createStore, 
  StateSnapshotManager,
  StateRestorer 
} from '@nexus-state/core'

const store = createStore()
const countAtom = atom(0, 'counter')

// Create snapshot manager
const snapshotManager = new StateSnapshotManager()
const stateRestorer = new StateRestorer()

// Take a snapshot
store.set(countAtom, 5)
const snapshot1 = snapshotManager.createSnapshot('Initial state')

store.set(countAtom, 10)
const snapshot2 = snapshotManager.createSnapshot('After increment')

store.set(countAtom, 15)

// Restore state
stateRestorer.restoreFromSnapshot(snapshot2)
console.log(store.get(countAtom)) // 10

stateRestorer.restoreFromSnapshot(snapshot1)
console.log(store.get(countAtom)) // 5
```

### Selector Pattern

```javascript
import { atom, createStore } from '@nexus-state/core'

const store = createStore()

const userAtom = atom({
  id: 1,
  name: 'John',
  email: 'john@example.com',
  settings: {
    theme: 'dark',
    notifications: true,
    language: 'en'
  }
}, 'user')

// Selectors for specific fields
const userNameAtom = atom((get) => get(userAtom).name, 'userName')
const userThemeAtom = atom((get) => get(userAtom).settings.theme, 'userTheme')

// Components subscribe only to needed data
console.log(store.get(userNameAtom)) // "John"
console.log(store.get(userThemeAtom)) // "dark"

// When name changes, only userNameAtom updates
store.set(userAtom, { ...store.get(userAtom), name: 'Jane' })
```

---

## ⚙️ Configuration

### Global Store

```javascript
// store.js
import { createStore } from '@nexus-state/core'
export const store = createStore({ name: 'global' })
```

### Multiple Stores

```javascript
import { createStore } from '@nexus-state/core'

const userStore = createStore({ name: 'user' })
const uiStore = createStore({ name: 'ui' })
const cacheStore = createStore({ name: 'cache' })

// Use different stores for different purposes
userStore.set(userAtom, userData)
uiStore.set(sidebarAtom, true)
cacheStore.set(apiCacheAtom, cachedData)
```

---

## ⚠️ Troubleshooting

### Problem: Computed atom doesn't update

**Cause:** Dependencies not being tracked

**Solution:** Use `get` inside computeFn:

```javascript
// ❌ Wrong
const totalAtom = atom(() => price * quantity)

// ✅ Correct
const totalAtom = atom((get) => get(priceAtom) * get(quantityAtom))
```

### Problem: Circular dependencies

**Cause:** Atoms depend on each other in a cycle

**Solution:** Restructure dependencies:

```javascript
// ❌ Circular dependency
const a = atom((get) => get(b))
const b = atom((get) => get(a))

// ✅ Separate the logic
const baseAtom = atom(0)
const a = atom((get) => get(baseAtom) * 2)
const b = atom((get) => get(baseAtom) + 10)
```

### Problem: Memory leaks

**Solution:** Clean up subscriptions:

```javascript
const unsubscribe = store.subscribe(atom, callback)

// Call on unmount
unsubscribe()
```

---

## 📚 Documentation

- [Getting Started](https://nexus-state.website.yandexcloud.net/guide/getting-started)
- [Core Concepts](https://nexus-state.website.yandexcloud.net/guide/core-concepts)
- [API Reference](https://nexus-state.website.yandexcloud.net/api/core)
- [Advanced Patterns](https://nexus-state.website.yandexcloud.net/guides/advanced-patterns)
- [Performance Tips](https://nexus-state.website.yandexcloud.net/performance/optimization)

---

## 🌐 Ecosystem

| Package | Description |
|---------|-------------|
| [@nexus-state/react](../react) | React integration |
| [@nexus-state/vue](../vue) | Vue integration |
| [@nexus-state/svelte](../svelte) | Svelte integration |
| [@nexus-state/immer](../immer) | Immer for mutable syntax |
| [@nexus-state/persist](../persist) | State persistence |
| [@nexus-state/middleware](../middleware) | Middleware system |
| [@nexus-state/devtools](../devtools) | DevTools integration |
| [@nexus-state/async](../async) | Async operations |
| [@nexus-state/family](../family) | Dynamic atom families |
| [@nexus-state/web-worker](../web-worker) | Web Worker integration |
| [@nexus-state/cli](../cli) | CLI utilities |

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/eustatos/nexus-state/blob/main/CONTRIBUTING.md)

### Quick Start for Contributors

```bash
# Clone the repository
git clone https://github.com/eustatos/nexus-state.git
cd nexus-state

# Install dependencies
pnpm install

# Run tests
pnpm test

# Run build
pnpm build
```

---

## 📄 License

MIT © [Nexus State](https://github.com/eustatos/nexus-state)
