# @nexus-state/immer

[![npm version](https://img.shields.io/npm/v/@nexus-state/immer.svg)](https://www.npmjs.com/package/@nexus-state/immer)
[![Bundle Size](https://img.shields.io/bundlephobia/min/@nexus-state/immer)](https://bundlephobia.com/package/@nexus-state/immer)
[![License](https://img.shields.io/npm/l/@nexus-state/immer.svg)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

> 🧊 Immutable updates with mutable syntax: simplified work with nested objects

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## ✨ Why It's Cool

- ✍️ **Mutable Syntax** — write like mutation, get immutability
- 🎯 **Deep Nesting** — easily update nested objects
- ⚡ **Performance** — structural sharing via Proxies
- 🛠 **TypeScript** — full type inference
- 📦 **Lightweight** — works on top of Immer (~8 KB)
- 🔒 **Safety** — new references created automatically

---

## 📦 Installation

```bash
npm install @nexus-state/core @nexus-state/immer
```

---

## 🚀 Quick Start

### Basic Usage

```javascript
import { createStore } from '@nexus-state/core'
import { immerAtom, setImmer } from '@nexus-state/immer'

const store = createStore()

// Create an atom with Immer support
const userAtom = immerAtom({
  profile: {
    name: 'John',
    contacts: { email: 'john@example.com' }
  },
  posts: [{ id: 1, title: 'Hello World' }]
}, store)

// Update state with mutable syntax
setImmer(userAtom, (draft) => {
  draft.profile.name = 'Jane'
  draft.profile.contacts.email = 'jane@example.com'
  draft.posts.push({ id: 2, title: 'Second Post' })
})

// Get new state (new reference!)
const user = store.get(userAtom)
```

---

## 📖 API

### `immerAtom(initialValue, store, config?)`

Creates an atom with Immer support.

| Parameter | Type | Description |
|-----------|------|-------------|
| `initialValue` | `T` | Initial value |
| `store` | `Store` | Store instance |
| `config` | `Object` (optional) | Configuration |
| `config.name` | `string` (optional) | Atom name for debugging |

**Returns:** `Atom<T>` — atom with Immer support

### `setImmer(atom, updater)`

Updates an atom using Immer draft function.

| Parameter | Type | Description |
|-----------|------|-------------|
| `atom` | `Atom<T>` | Atom to update |
| `updater` | `Function` | `(draft: T) => void` — mutation function |

### `createImmerStore(store)`

Wraps existing store for Immer support (deprecated, kept for compatibility).

**Returns:** `Store` — the same store

### `produce(baseState, recipe)`

Re-export of Immer's produce function for advanced usage.

### `setAutoFreeze(enabled)`

Re-export of Immer's setAutoFreeze for performance tuning.

---

## 💡 Usage Examples

### Deeply Nested Objects

```javascript
import { immerAtom, setImmer } from '@nexus-state/immer'

const appStateAtom = immerAtom({
  user: {
    profile: {
      name: 'John',
      address: {
        city: 'Moscow',
        street: 'Lenina',
        building: '10'
      }
    },
    settings: {
      theme: 'dark',
      notifications: {
        email: true,
        push: false
      }
    }
  }
})

// Update deeply nested value
setImmer(appStateAtom, (draft) => {
  draft.user.profile.address.city = 'Saint Petersburg'
  draft.user.settings.notifications.push = true
})

// Without Immer you'd have to write:
// setState(prev => ({
//   ...prev,
//   user: {
//     ...prev.user,
//     profile: {
//       ...prev.user.profile,
//       address: {
//         ...prev.user.profile.address,
//         city: 'Saint Petersburg'
//       }
//     }
//   }
// }))
```

### Working with Arrays

```javascript
import { immerAtom, setImmer } from '@nexus-state/immer'

const todosAtom = immerAtom([
  { id: 1, text: 'Learn React', completed: false },
  { id: 2, text: 'Learn Nexus State', completed: false }
])

// Add
setImmer(todosAtom, (draft) => {
  draft.push({ id: 3, text: 'Build an app', completed: false })
})

// Update
setImmer(todosAtom, (draft) => {
  const todo = draft.find(t => t.id === 1)
  if (todo) todo.completed = true
})

// Remove
setImmer(todosAtom, (draft) => {
  const index = draft.findIndex(t => t.id === 2)
  if (index !== -1) draft.splice(index, 1)
})
```

### Form with Validation

```javascript
import { immerAtom, setImmer } from '@nexus-state/immer'

const formAtom = immerAtom({
  values: {
    email: '',
    password: '',
    confirmPassword: ''
  },
  errors: {},
  touched: {},
  isSubmitting: false
})

// Update field
function updateField(field, value) {
  setImmer(formAtom, (draft) => {
    draft.values[field] = value
    draft.touched[field] = true
    
    // Validation
    if (field === 'email' && !value.includes('@')) {
      draft.errors.email = 'Invalid email'
    } else {
      draft.errors.email = null
    }
  })
}

// Submit form
async function submitForm() {
  setImmer(formAtom, (draft) => {
    draft.isSubmitting = true
  })
  
  try {
    await api.submit(store.get(formAtom).values)
    setImmer(formAtom, (draft) => {
      draft.isSubmitting = false
      draft.values = { email: '', password: '', confirmPassword: '' }
    })
  } catch (error) {
    setImmer(formAtom, (draft) => {
      draft.isSubmitting = false
      draft.errors.submit = error.message
    })
  }
}
```

### Normalized Data

```javascript
import { immerAtom, setImmer } from '@nexus-state/immer'

const normalizedDataAtom = immerAtom({
  users: {
    '1': { id: 1, name: 'John' },
    '2': { id: 2, name: 'Jane' }
  },
  posts: {
    '1': { id: 1, userId: 1, title: 'Hello' },
    '2': { id: 2, userId: 2, title: 'World' }
  },
  comments: {
    '1': { id: 1, postId: 1, text: 'Great!' }
  }
})

// Add user
setImmer(normalizedDataAtom, (draft) => {
  draft.users['3'] = { id: 3, name: 'Bob' }
})

// Update post
setImmer(normalizedDataAtom, (draft) => {
  const post = draft.posts['1']
  if (post) post.title = 'Hello World'
})

// Remove comment
setImmer(normalizedDataAtom, (draft) => {
  delete draft.comments['1']
})
```

### History (Undo/Redo)

```javascript
import { immerAtom, setImmer } from '@nexus-state/immer'

const historyAtom = immerAtom({
  past: [],
  present: null,
  future: []
})

function commit(state) {
  setImmer(historyAtom, (draft) => {
    draft.past.push(draft.present)
    draft.present = state
    draft.future = []
  })
}

function undo() {
  setImmer(historyAtom, (draft) => {
    if (draft.past.length === 0) return
    
    const previous = draft.past.pop()
    draft.future.unshift(draft.present)
    draft.present = previous
  })
}

function redo() {
  setImmer(historyAtom, (draft) => {
    if (draft.future.length === 0) return
    
    const next = draft.future.shift()
    draft.past.push(draft.present)
    draft.present = next
  })
}
```

### API Data Caching

```javascript
import { immerAtom, setImmer } from '@nexus-state/immer'

const cacheAtom = immerAtom({
  users: {},
  posts: {},
  timestamps: {}
})

// Save data to cache
function cacheData(type, id, data) {
  setImmer(cacheAtom, (draft) => {
    if (!draft[type]) draft[type] = {}
    draft[type][id] = data
    draft.timestamps[`${type}-${id}`] = Date.now()
  })
}

// Check freshness
function isStale(type, id, maxAge = 5 * 60 * 1000) {
  const state = store.get(cacheAtom)
  const timestamp = state.timestamps[`${type}-${id}`]
  return !timestamp || Date.now() - timestamp > maxAge
}
```

---

## ⚙️ Configuration

### Custom Immer Configuration

```javascript
import { setAutoFreeze, setUseProxies } from 'immer'
import { immerAtom } from '@nexus-state/immer'

// Disable auto-freeze (for performance)
setAutoFreeze(false)

// Force use Proxies
setUseProxies(true)

const atom = immerAtom({ data: {} })
```

### Combination with Regular Atoms

```javascript
import { atom, immerAtom, setImmer } from '@nexus-state/immer'

// Regular atom for UI state
const uiAtom = atom({ sidebar: true, theme: 'dark' })

// Immer atom for data
const dataAtom = immerAtom({ users: [], posts: [] })

// Update both
store.set(uiAtom, { sidebar: false, theme: 'light' })
setImmer(dataAtom, (draft) => {
  draft.users.push(newUser)
})
```

---

## ⚠️ Troubleshooting

### Problem: Changes not applied

**Cause:** You're mutating value directly instead of using draft

**Solution:** Always use `setImmer` with draft function:

```javascript
// ❌ Wrong (direct mutation)
const user = store.get(userAtom)
user.name = 'Jane'  // Won't work!

// ✅ Correct
setImmer(userAtom, (draft) => {
  draft.name = 'Jane'
})
```

### Problem: Returns old reference

**Cause:** Immer didn't detect changes

**Solution:** Make sure you're actually mutating draft:

```javascript
// ❌ Wrong (creating new object instead of mutating)
setImmer(atom, (draft) => {
  return { ...draft, value: 'new' }
})

// ✅ Correct
setImmer(atom, (draft) => {
  draft.value = 'new'
})
```

### Problem: Performance with large data

**Solution:** Disable auto-freeze:

```javascript
import { setAutoFreeze } from 'immer'
setAutoFreeze(false)  // Do this once at initialization
```

---

## 📚 Documentation

- [Immer Integration](https://nexus-state.website.yandexcloud.net/guide/immer)
- [API Reference](https://nexus-state.website.yandexcloud.net/api/immer)
- [Immer Documentation](https://immerjs.github.io/immer/)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/eustatos/nexus-state/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT © [Nexus State](https://github.com/eustatos/nexus-state)
