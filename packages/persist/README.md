# @nexus-state/persist

[![npm version](https://img.shields.io/npm/v/@nexus-state/persist.svg)](https://www.npmjs.com/package/@nexus-state/persist)
[![Bundle Size](https://img.shields.io/bundlephobia/min/@nexus-state/persist)](https://bundlephobia.com/package/@nexus-state/persist)
[![License](https://img.shields.io/npm/l/@nexus-state/persist.svg)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

> 💾 Persist state between sessions: localStorage, sessionStorage, IndexedDB, and custom storage adapters

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## ✨ Why It's Cool

- 🗄️ **Multi-Storage** — localStorage, sessionStorage, IndexedDB
- 🎯 **Selective Persistence** — save only needed atoms
- 🔄 **Auto-Sync** — state saves on every change
- 🛡️ **Security** — data sanitization before save
- ⚡ **Async Support** — async storage adapters
- 🧩 **Extensible** — create your own adapters

---

## 📦 Installation

```bash
npm install @nexus-state/core @nexus-state/persist
```

---

## 🚀 Quick Start

### Basic Usage with localStorage

```javascript
import { atom, createStore } from '@nexus-state/core'
import { createPersist } from '@nexus-state/persist'

const store = createStore()

// Create a persistent atom
const userAtom = atom({ name: '', email: '' }, 'user')

// Configure persistence
const persist = createPersist({
  key: 'my-app-state',
  storage: localStorage,
  atoms: [userAtom]  // Persist only userAtom
})

persist.apply(store)

// Now userAtom state is saved automatically
store.set(userAtom, { name: 'John', email: 'john@example.com' })
```

### Restore on Load

```javascript
import { createStore } from '@nexus-state/core'
import { createPersist, loadPersistedState } from '@nexus-state/persist'

const store = createStore()

// Load saved state before creating atoms
const savedState = loadPersistedState({
  key: 'my-app-state',
  storage: localStorage
})

const persist = createPersist({
  key: 'my-app-state',
  storage: localStorage
})

persist.apply(store)

// Restore state
if (savedState) {
  Object.entries(savedState).forEach(([atomName, value]) => {
    const atom = atomRegistry.getByName(atomName)
    if (atom) store.set(atom, value)
  })
}
```

---

## 📖 API

### `createPersist(options)`

Creates a persistence plugin.

| Option | Type | Description |
|--------|------|-------------|
| `key` | `string` | Storage key |
| `storage` | `Storage` | Storage (localStorage, sessionStorage) |
| `atoms` | `Atom[]` (optional) | Atoms to persist (all by default) |
| `serialize` | `Function` (optional) | Custom serialization |
| `deserialize` | `Function` (optional) | Custom deserialization |
| `debounce` | `number` (optional) | Debounce delay before save (ms) |
| `filter` | `Function` (optional) | Filter atoms to persist |

**Returns:** PersistPlugin with `apply(store)` method

### `loadPersistedState(options)`

Loads persisted state.

| Option | Type | Description |
|--------|------|-------------|
| `key` | `string` | Storage key |
| `storage` | `Storage` | Storage instance |

**Returns:** `Record<string, any>` — persisted state

### `createStorageAdapter(adapter)`

Creates a custom storage adapter.

```javascript
const indexedDBAdapter = createStorageAdapter({
  get: async (key) => { /* ... */ },
  set: async (key, value) => { /* ... */ },
  remove: async (key) => { /* ... */ }
})
```

---

## 💡 Usage Examples

### App Theme Persistence

```javascript
import { atom, createStore } from '@nexus-state/core'
import { createPersist } from '@nexus-state/persist'

const store = createStore()
const themeAtom = atom('light', 'theme')

const themePersist = createPersist({
  key: 'app-theme',
  storage: localStorage,
  atoms: [themeAtom]
})

themePersist.apply(store)

// Theme toggle is saved automatically
store.set(themeAtom, 'dark')
```

### User Settings Persistence

```javascript
import { atom, createStore } from '@nexus-state/core'
import { createPersist } from '@nexus-state/persist'

const store = createStore()

const settingsAtom = atom({
  language: 'en',
  timezone: 'UTC',
  notifications: true,
  fontSize: 14
}, 'settings')

const settingsPersist = createPersist({
  key: 'user-settings',
  storage: localStorage,
  atoms: [settingsAtom],
  debounce: 500  // Save 500ms after change
})

settingsPersist.apply(store)
```

### Filter Sensitive Data

```javascript
import { atom, createStore } from '@nexus-state/core'
import { createPersist } from '@nexus-state/persist'

const store = createStore()
const userAtom = atom({
  name: 'John',
  email: 'john@example.com',
  password: 'secret123',  // Should not be saved!
  token: 'abc123'         // Should not be saved!
}, 'user')

const userPersist = createPersist({
  key: 'user',
  storage: localStorage,
  atoms: [userAtom],
  serialize: (state) => {
    const { password, token, ...safe } = state
    return JSON.stringify(safe)
  }
})

userPersist.apply(store)
```

### Async Storage (IndexedDB)

```javascript
import { createPersist, createStorageAdapter } from '@nexus-state/persist'

const indexedDBAdapter = createStorageAdapter({
  get: async (key) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('my-db', 1)
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('store', 'readonly')
        const store = tx.objectStore('store')
        const getReq = store.get(key)
        getReq.onsuccess = () => resolve(getReq.result)
      }
    })
  },
  set: async (key, value) => {
    // Similarly for write
  }
})

const persist = createPersist({
  key: 'app-state',
  storage: indexedDBAdapter
})
```

### Session-based Persistence

```javascript
import { createPersist } from '@nexus-state/persist'

const sessionPersist = createPersist({
  key: 'session-state',
  storage: sessionStorage,  // Cleared on tab close
  debounce: 200
})

persist.apply(store)
```

### Multi-tenant Persistence

```javascript
import { atom, createStore } from '@nexus-state/core'
import { createPersist } from '@nexus-state/persist'

const store = createStore()
const currentUserId = 'user-123'

const userPersist = createPersist({
  key: `user-${currentUserId}`,  // Unique key per user
  storage: localStorage,
  atoms: [userAtom]
})

userPersist.apply(store)
```

---

## ⚙️ Configuration

### Global Persistence for All Atoms

```javascript
import { createPersist } from '@nexus-state/persist'

const globalPersist = createPersist({
  key: 'global-state',
  storage: localStorage
  // atoms not specified — all atoms persist
})

globalPersist.apply(store)
```

### Combined Storages

```javascript
// Important data in localStorage
const criticalPersist = createPersist({
  key: 'critical',
  storage: localStorage,
  atoms: [userAtom, settingsAtom]
})

// Temporary data in sessionStorage
const tempPersist = createPersist({
  key: 'temp',
  storage: sessionStorage,
  atoms: [uiStateAtom, filtersAtom]
})

criticalPersist.apply(store)
tempPersist.apply(store)
```

---

## ⚠️ Troubleshooting

### Problem: Data not saving

**Cause:** Browser blocks localStorage (incognito mode, private browsing)

**Solution:** Handle the error:

```javascript
try {
  const persist = createPersist({
    key: 'app-state',
    storage: localStorage
  })
  persist.apply(store)
} catch (error) {
  console.warn('Persistence disabled:', error)
  // Fallback: use sessionStorage or in-memory
}
```

### Problem: Too frequent writes

**Solution:** Use debounce:

```javascript
const persist = createPersist({
  key: 'app-state',
  storage: localStorage,
  debounce: 1000  // Save no more than once per second
})
```

### Problem: Circular references in data

**Solution:** Use custom serialization:

```javascript
const persist = createPersist({
  key: 'app-state',
  storage: localStorage,
  serialize: (state) => {
    const seen = new WeakSet()
    return JSON.stringify(state, (key, val) => {
      if (val != null && typeof val == "object") {
        if (seen.has(val)) return "[Circular]"
        seen.add(val)
      }
      return val
    })
  }
})
```

---

## 📚 Documentation

- [Persistence Guide](https://nexus-state.website.yandexcloud.net/guide/persist)
- [API Reference](https://nexus-state.website.yandexcloud.net/api/persist)
- [Storage Adapters](https://nexus-state.website.yandexcloud.net/guides/storage-adapters)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/eustatos/nexus-state/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT © [Nexus State](https://github.com/eustatos/nexus-state)
