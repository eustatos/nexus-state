# @nexus-state/middleware

[![npm version](https://img.shields.io/npm/v/@nexus-state/middleware.svg)](https://www.npmjs.com/package/@nexus-state/middleware)
[![Bundle Size](https://img.shields.io/bundlephobia/min/@nexus-state/middleware)](https://bundlephobia.com/package/@nexus-state/middleware)
[![License](https://img.shields.io/npm/l/@nexus-state/middleware.svg)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

> 🔌 Middleware plugins for Nexus State: validation, logging, persistence, and more

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## ✨ Why It's Cool

- 🎯 **Atom-specific** — apply middleware to specific atoms
- 🔌 **Plugin-based** — works with `store.use()`
- 🛡️ **Validation** — validate values before setting
- 📝 **Logging** — track all atom updates
- 💾 **Persistence** — auto-save to localStorage
- ⚡ **Throttling** — rate-limit rapid updates

---

## 📦 Installation

```bash
npm install @nexus-state/core @nexus-state/middleware
```

---

## 🚀 Quick Start

### Basic Middleware

```javascript
import { atom, createStore } from '@nexus-state/core'
import { middleware } from '@nexus-state/middleware'

const store = createStore()
const countAtom = atom(0, 'count')

// Apply middleware to specific atom
store.use(middleware(countAtom, {
  beforeSet: (atom, value) => {
    console.log('Before set:', value)
    // Validate: don't allow negative values
    return value < 0 ? 0 : value
  },
  afterSet: (atom, value) => {
    console.log('After set:', value)
    // Side effect: save to storage
    localStorage.setItem('count', value)
  }
}))

store.set(countAtom, 5)  // Logs and validates
```

---

## 📖 API

### `middleware(atom, config)`

Creates a middleware plugin for a specific atom.

| Parameter | Type | Description |
|-----------|------|-------------|
| `atom` | `Atom<T>` | Target atom |
| `config.beforeSet` | `Function` (optional) | Called before set, can modify value |
| `config.afterSet` | `Function` (optional) | Called after set |

**Returns:** `Plugin` — plugin function for `store.use()`

### `createLogger()`

Creates a logger plugin that logs all atom updates.

**Returns:** `Plugin`

### `createValidator(atom, validate)`

Creates a validation plugin.

| Parameter | Type | Description |
|-----------|------|-------------|
| `atom` | `Atom<T>` | Target atom |
| `validate` | `Function` | `(value) => boolean` — returns true if valid |

**Returns:** `Plugin`

### `createPersist(atom, storageKey)`

Creates a persistence plugin (localStorage).

| Parameter | Type | Description |
|-----------|------|-------------|
| `atom` | `Atom<T>` | Target atom |
| `storageKey` | `string` | LocalStorage key |

**Returns:** `Plugin`

### `createThrottle(atom, delay)`

Creates a throttle plugin.

| Parameter | Type | Description |
|-----------|------|-------------|
| `atom` | `Atom<T>` | Target atom |
| `delay` | `number` | Delay in milliseconds |

**Returns:** `Plugin`

---

## 💡 Usage Examples

### Validation

```javascript
import { middleware, createValidator } from '@nexus-state/middleware'

const store = createStore()
const emailAtom = atom('', 'email')
const ageAtom = atom(0, 'age')

// Custom validation with middleware
store.use(middleware(emailAtom, {
  beforeSet: (atom, value) => {
    if (!value.includes('@')) {
      throw new Error('Invalid email')
    }
    return value
  }
}))

// Or use createValidator
store.use(createValidator(ageAtom, (value) => value >= 18))

store.set(emailAtom, 'invalid')  // Throws error
store.set(ageAtom, 15)           // Throws error
```

### Logging

```javascript
import { createLogger } from '@nexus-state/middleware'

const store = createStore()

// Log all atom updates
store.use(createLogger())

// Output:
// [12:30:45] SET: count
// Prev value: 0
// New value: 5
```

### Persistence

```javascript
import { createPersist } from '@nexus-state/middleware'

const store = createStore()
const settingsAtom = atom({ theme: 'light' }, 'settings')

// Auto-save to localStorage
store.use(createPersist(settingsAtom, 'app-settings'))

store.set(settingsAtom, { theme: 'dark' })
// Saved to localStorage automatically
```

### Throttling

```javascript
import { createThrottle } from '@nexus-state/middleware'

const store = createStore()
const searchAtom = atom('', 'search')

// Throttle search updates (300ms)
store.use(createThrottle(searchAtom, 300))

// Rapid updates are throttled
store.set(searchAtom, 'r')
store.set(searchAtom, 're')
store.set(searchAtom, 'rea')
store.set(searchAtom, 'react')  // This one goes through
```

### Multiple Middleware

```javascript
import { middleware, createLogger, createValidator } from '@nexus-state/middleware'

const store = createStore()
const userAtom = atom({ name: '', age: 0 }, 'user')

// Stack multiple middleware
store.use(createLogger())
store.use(middleware(userAtom, {
  beforeSet: (atom, value) => {
    // Validate name
    if (!value.name) throw new Error('Name required')
    return value
  },
  afterSet: (atom, value) => {
    // Save to API
    api.saveUser(value)
  }
}))
store.use(createValidator(userAtom, (value) => value.age >= 18))
```

### Form with Validation

```javascript
import { middleware, createValidator } from '@nexus-state/middleware'

const store = createStore()
const formAtom = atom({
  email: '',
  password: '',
  errors: {}
}, 'form')

// Email validation
store.use(middleware(formAtom, {
  beforeSet: (atom, value) => {
    const errors = {}
    if (!value.email.includes('@')) {
      errors.email = 'Invalid email'
    }
    if (value.password.length < 6) {
      errors.password = 'Min 6 characters'
    }
    return { ...value, errors }
  }
}))

// Usage in component
function updateField(field, value) {
  const form = store.get(formAtom)
  store.set(formAtom, { ...form, [field]: value })
}
```

### Analytics Tracking

```javascript
import { middleware } from '@nexus-state/middleware'

const store = createStore()
const purchaseAtom = atom({ items: [], total: 0 }, 'purchase')

// Track purchases
store.use(middleware(purchaseAtom, {
  afterSet: (atom, value) => {
    if (value.total > 0) {
      // Send to analytics
      gtag('event', 'purchase', {
        value: value.total,
        items: value.items.length
      })
    }
  }
}))
```

---

## ⚙️ Configuration

### Middleware Order

```javascript
// ✅ Correct order: logger → validator → persist
store.use(createLogger())
store.use(createValidator(atom, validate))
store.use(createPersist(atom, 'key'))

// ❌ Wrong order: persist before validator
// Invalid data might be saved!
```

### Conditional Middleware

```javascript
// Only validate in development
if (process.env.NODE_ENV === 'development') {
  store.use(createValidator(atom, validate))
}

// Only persist in production
if (process.env.NODE_ENV === 'production') {
  store.use(createPersist(atom, 'key'))
}
```

---

## ⚠️ Troubleshooting

### Problem: Middleware not called

**Cause:** Middleware applied after atom updates

**Solution:** Apply middleware before any updates:

```javascript
const store = createStore()

// ✅ Apply middleware first
store.use(middleware(atom, config))

// ❌ Don't apply after updates
store.set(atom, value)
store.use(middleware(atom, config))  // Too late!
```

### Problem: Validation throws error

**Cause:** Value doesn't pass validation

**Solution:** Check validation logic:

```javascript
store.use(createValidator(ageAtom, (value) => {
  console.log('Validating:', value)  // Debug
  return value >= 18
}))
```

### Problem: localStorage errors

**Cause:** Quota exceeded or localStorage disabled

**Solution:** createPersist handles errors gracefully:

```javascript
// Errors are caught internally
store.use(createPersist(atom, 'key'))
// Won't throw, just won't save
```

---

## 📚 Documentation

- [Middleware Guide](https://nexus-state.website.yandexcloud.net/guide/middleware)
- [API Reference](https://nexus-state.website.yandexcloud.net/api/middleware)
- [Validation Patterns](https://nexus-state.website.yandexcloud.net/guides/validation)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/eustatos/nexus-state/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT © [Nexus State](https://github.com/eustatos/nexus-state)
