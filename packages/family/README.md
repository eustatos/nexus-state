# @nexus-state/family

[![npm version](https://img.shields.io/npm/v/@nexus-state/family.svg)](https://www.npmjs.com/package/@nexus-state/family)
[![Bundle Size](https://img.shields.io/bundlephobia/min/@nexus-state/family)](https://bundlephobia.com/package/@nexus-state/family)
[![License](https://img.shields.io/npm/l/@nexus-state/family.svg)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

> 👨‍👩‍👧‍👦 Dynamic atom creation: manage lists, entities, and collections without code duplication

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## ✨ Why It's Cool

- 🎯 **Dynamic Atoms** — create atoms on the fly by ID
- 📦 **Caching** — atoms reused for same parameters
- 🗑️ **Cleanup** — remove unused atoms from memory
- 🔄 **Isolation** — each atom is independent
- ⚡ **Performance** — no unnecessary rerenders
- 🧩 **Versatility** — works with any parameters

---

## 📦 Installation

```bash
npm install @nexus-state/core @nexus-state/family
```

---

## 🚀 Quick Start

### Basic atomFamily Usage

```javascript
import { atom } from '@nexus-state/core'
import { atomFamily } from '@nexus-state/family'

// Create atom factory for users
const userAtomFamily = atomFamily((userId) =>
  atom({
    id: userId,
    name: '',
    email: '',
    isLoading: false
  }, `user-${userId}`)
)

// Get atoms for specific users
const user1Atom = userAtomFamily(1)
const user2Atom = userAtomFamily(2)
const user3Atom = userAtomFamily(3)

// Use like regular atoms
store.set(user1Atom, { id: 1, name: 'John', email: 'john@example.com' })
const user1 = store.get(user1Atom)
```

---

## 📖 API

### `atomFamily(createAtom, options?)`

Creates an atom factory.

| Parameter | Type | Description |
|-----------|------|-------------|
| `createAtom` | `Function` | Function `(param) => Atom<T>` to create atom |
| `options` | `Object` (optional) | Options |
| `options.equals` | `Function` (optional) | Parameter comparison function |
| `options.onRemove` | `Function` (optional) | Callback on atom removal |

**Returns:** `(param: any) => Atom<T>` — atom factory

### Factory Methods

| Method | Description |
|--------|-------------|
| `remove(param)` | Removes atom for given parameter |
| `clear()` | Removes all created atoms |
| `keys()` | Returns all created parameters |
| `atoms()` | Returns all created atoms |

---

## 💡 Usage Examples

### Todo List

```javascript
import { atom } from '@nexus-state/core'
import { atomFamily } from '@nexus-state/family'

// Factory for todo atoms
const todoAtomFamily = atomFamily((todoId) =>
  atom({
    id: todoId,
    text: '',
    completed: false,
    createdAt: Date.now()
  }, `todo-${todoId}`)
)

// Create todos
const todo1 = todoAtomFamily(1)
const todo2 = todoAtomFamily(2)

store.set(todo1, { id: 1, text: 'Learn Nexus State', completed: false })
store.set(todo2, { id: 2, text: 'Build an app', completed: true })

// Remove todo
todoAtomFamily.remove(1)
```

### API Data Caching

```javascript
import { atom } from '@nexus-state/core'
import { atomFamily } from '@nexus-state/family'

// Factory for user caching
const userCacheAtomFamily = atomFamily((userId) =>
  atom({
    data: null,
    isLoading: false,
    error: null,
    lastFetched: null
  }, `user-cache-${userId}`)
)

// Usage
async function fetchUser(userId) {
  const cacheAtom = userCacheAtomFamily(userId)
  const cache = store.get(cacheAtom)
  
  // Check cache (5 minutes)
  if (cache.data && cache.lastFetched > Date.now() - 5 * 60 * 1000) {
    return cache.data
  }
  
  // Fetch
  store.set(cacheAtom, { ...cache, isLoading: true })
  
  try {
    const response = await fetch(`/api/users/${userId}`)
    const data = await response.json()
    store.set(cacheAtom, {
      data,
      isLoading: false,
      error: null,
      lastFetched: Date.now()
    })
    return data
  } catch (error) {
    store.set(cacheAtom, {
      ...cache,
      isLoading: false,
      error: error.message
    })
    throw error
  }
}
```

### Filters and Sorting

```javascript
import { atom, createStore } from '@nexus-state/core'
import { atomFamily } from '@nexus-state/family'

const store = createStore()

// List of todo IDs
const todoIdsAtom = atom([1, 2, 3, 4, 5], 'todoIds')

// Factory for todo atoms
const todoAtomFamily = atomFamily((id) =>
  atom({ id, text: `Task ${id}`, completed: false }, `todo-${id}`)
)

// Computed atom for filtered todos
const filteredTodosAtom = atom((get) => {
  const ids = get(todoIdsAtom)
  return ids
    .map(id => get(todoAtomFamily(id)))
    .filter(todo => !todo.completed)
}, 'filteredTodos')

// Get only incomplete todos
const filteredTodos = store.get(filteredTodosAtom)
```

### Form with Dynamic Fields

```javascript
import { atom } from '@nexus-state/core'
import { atomFamily } from '@nexus-state/family'

// Factory for form fields
const formFieldAtomFamily = atomFamily((fieldName) =>
  atom({
    value: '',
    error: null,
    touched: false
  }, `form-field-${fieldName}`)
)

// Usage
const emailField = formFieldAtomFamily('email')
const passwordField = formFieldAtomFamily('password')

store.set(emailField, { value: 'john@example.com', error: null, touched: true })
store.set(passwordField, { value: 'secret', error: null, touched: false })

// Clear form
function clearForm(fields) {
  fields.forEach(name => formFieldAtomFamily(name).remove())
}
```

### Tree Structure (Comments)

```javascript
import { atom } from '@nexus-state/core'
import { atomFamily } from '@nexus-state/family'

// Factory for comments
const commentAtomFamily = atomFamily((commentId) =>
  atom({
    id: commentId,
    text: '',
    author: '',
    replies: [],  // IDs of child comments
    createdAt: Date.now()
  }, `comment-${commentId}`)
)

// Get parent comment
const parentComment = commentAtomFamily(1)
store.set(parentComment, {
  id: 1,
  text: 'Great post!',
  author: 'John',
  replies: [2, 3],
  createdAt: Date.now()
})

// Child comments
const reply1 = commentAtomFamily(2)
const reply2 = commentAtomFamily(3)
```

### Pagination

```javascript
import { atom } from '@nexus-state/core'
import { atomFamily } from '@nexus-state/family'

// Factory for pages
const pageAtomFamily = atomFamily((pageNumber) =>
  atom({
    number: pageNumber,
    items: [],
    isLoading: false,
    hasMore: true
  }, `page-${pageNumber}`)
)

// Load page
async function loadPage(pageNumber) {
  const pageAtom = pageAtomFamily(pageNumber)
  const page = store.get(pageAtom)
  
  if (page.items.length > 0) return page  // Already loaded
  
  store.set(pageAtom, { ...page, isLoading: true })
  
  const response = await fetch(`/api/items?page=${pageNumber}`)
  const data = await response.json()
  
  store.set(pageAtom, {
    ...page,
    items: data.items,
    isLoading: false,
    hasMore: data.hasMore
  })
}
```

---

## ⚙️ Configuration

### Custom Parameter Comparison

```javascript
const complexAtomFamily = atomFamily(
  (params) => atom({ ...params }, `complex-${params.id}`),
  {
    equals: (a, b) => a.id === b.id && a.type === b.type
  }
)
```

### Callback on Remove

```javascript
const cachedAtomFamily = atomFamily(
  (key) => atom(null, `cache-${key}`),
  {
    onRemove: (atom, key) => {
      console.log(`Removed cache for ${key}`)
      // Cleanup resources
    }
  }
)
```

---

## ⚠️ Troubleshooting

### Problem: Memory leak

**Cause:** Atoms not removed after use

**Solution:** Use `remove()` and `clear()`:

```javascript
// Remove specific atom
userAtomFamily.remove(userId)

// Clear all atoms
userAtomFamily.clear()
```

### Problem: Same atoms for different parameters

**Cause:** Parameters not compared correctly

**Solution:** Specify custom comparison function:

```javascript
const atomFam = atomFamily(
  (params) => atom(params),
  {
    equals: (a, b) => JSON.stringify(a) === JSON.stringify(b)
  }
)
```

---

## 📚 Documentation

- [Atom Families](https://nexus-state.website.yandexcloud.net/guide/family)
- [API Reference](https://nexus-state.website.yandexcloud.net/api/family)
- [Advanced Patterns](https://nexus-state.website.yandexcloud.net/guides/atom-family-patterns)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/eustatos/nexus-state/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT © [Nexus State](https://github.com/eustatos/nexus-state)
