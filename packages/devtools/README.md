# @nexus-state/devtools

[![npm version](https://img.shields.io/npm/v/@nexus-state/devtools.svg)](https://www.npmjs.com/package/@nexus-state/devtools)
[![Bundle Size](https://img.shields.io/bundlephobia/min/@nexus-state/devtools)](https://bundlephobia.com/package/@nexus-state/devtools)
[![License](https://img.shields.io/npm/l/@nexus-state/devtools.svg)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

> 🔍 Real-time state debugging: Redux DevTools integration, Time Travel, action tracing

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## ✨ Why It's Cool

- 🔬 **State Inspection** — view all atoms and values
- ⏪ **Time Travel** — navigate between states
- 📝 **Action History** — full change logging
- 🏷️ **Atom Names** — meaningful names in DevTools
- 📍 **Stack Traces** — track change source
- 📦 **Batch Updates** — group related changes
- ⚡ **Performance** — lazy serialization
- 🎨 **Customization** — flexible settings

---

## 📦 Installation

```bash
npm install @nexus-state/core @nexus-state/devtools
```

---

## 🚀 Quick Start

### Basic Setup

```javascript
import { atom, createStore } from '@nexus-state/core'
import { devTools } from '@nexus-state/devtools'

// Create atoms
const countAtom = atom(0, 'counter')
const userAtom = atom({ name: 'John', email: '' }, 'user')

// Create store
const store = createStore()

// Apply DevTools
const devtoolsPlugin = devTools()
devtoolsPlugin.apply(store)

// Now all changes visible in Redux DevTools
store.set(countAtom, 5)
store.set(userAtom, { name: 'Jane', email: 'jane@example.com' })
```

---

## 📖 API

### `devTools(options?)`

Creates DevTools plugin.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | `'Nexus State'` | App name in DevTools |
| `trace` | `boolean` | `false` | Enable stack traces |
| `traceLimit` | `number` | `5` | Stack trace frame limit |
| `maxAge` | `number` | `100` | Max history depth |
| `showAtomNames` | `boolean` | `true` | Show atom names |
| `latency` | `number` | `0` | Delay before send (ms) |
| `actionNamingStrategy` | `string` | `'auto'` | Action naming strategy |
| `stateSanitizer` | `Function` | `(s) => s` | State cleanup |

**Returns:** DevToolsPlugin with `apply(store)` method

---

## 💡 Usage Examples

### React Integration

```javascript
import { atom, createStore } from '@nexus-state/core'
import { useAtom } from '@nexus-state/react'
import { devTools } from '@nexus-state/devtools'

const countAtom = atom(0, 'counter')
const firstNameAtom = atom('John', 'firstName')
const lastNameAtom = atom('Doe', 'lastName')

const store = createStore()
const devtoolsPlugin = devTools({ name: 'My App' })
devtoolsPlugin.apply(store)

function Counter() {
  const [count, setCount] = useAtom(countAtom, store)
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  )
}

function Profile() {
  const [firstName] = useAtom(firstNameAtom, store)
  const [lastName] = useAtom(lastNameAtom, store)
  return <div>{firstName} {lastName}</div>
}
```

### Custom Action Names

```javascript
import { devTools } from '@nexus-state/devtools'

const devtoolsPlugin = devTools({
  actionNamingStrategy: 'manual'
})
devtoolsPlugin.apply(store)

// Action name specified explicitly
store.set(countAtom, 5, 'INCREMENT_COUNT')
store.set(userAtom, userData, 'UPDATE_USER_PROFILE')
```

### Stack Trace for Debugging

```javascript
import { devTools } from '@nexus-state/devtools'

const devtoolsPlugin = devTools({
  trace: true,        // Enable stack traces
  traceLimit: 10      // Frame limit
})
devtoolsPlugin.apply(store)

// Now DevTools shows where change happened
store.set(countAtom, 5)
// Stack trace shows file and line
```

### Sanitize Sensitive Data

```javascript
import { devTools } from '@nexus-state/devtools'

const devtoolsPlugin = devTools({
  stateSanitizer: (state) => {
    // Remove passwords and tokens before sending to DevTools
    const sanitized = { ...state }
    Object.keys(sanitized).forEach(key => {
      if (key.includes('password') || key.includes('token')) {
        sanitized[key] = '[REDACTED]'
      }
    })
    return sanitized
  }
})
devtoolsPlugin.apply(store)
```

### Batch Updates

```javascript
import { devTools } from '@nexus-state/devtools'

const devtoolsPlugin = devTools()
devtoolsPlugin.apply(store)

// Group multiple changes into single action
store.startBatch('user-update')
store.set(firstNameAtom, 'Jane')
store.set(lastNameAtom, 'Smith')
store.set(ageAtom, 25)
store.endBatch('user-update')

// DevTools shows single action "user-update"
```

### Time Travel

```javascript
import { devTools } from '@nexus-state/devtools'

const devtoolsPlugin = devTools({
  maxAge: 50  // Store 50 states
})
devtoolsPlugin.apply(store)

// In Redux DevTools:
// 1. Open "History" tab
// 2. Click any previous state
// 3. Press "Jump to State" to restore
// 4. Use Undo/Redo for navigation
```

### Performance with Large Data

```javascript
import { devTools } from '@nexus-state/devtools'

const devtoolsPlugin = devTools({
  latency: 100,  // 100ms delay before send
  stateSanitizer: (state) => {
    // Serialize only changes
    return JSON.stringify(state, (key, value) => {
      if (Array.isArray(value) && value.length > 100) {
        return `[Array(${value.length})]`
      }
      return value
    })
  }
})
devtoolsPlugin.apply(store)
```

---

## ⚙️ Configuration

### Global Setup for All Stores

```javascript
// devtools-config.js
import { devTools } from '@nexus-state/devtools'

export const globalDevTools = devTools({
  name: 'My Application',
  trace: process.env.NODE_ENV === 'development',
  maxAge: 100,
  actionNamingStrategy: 'auto'
})

// In main app file
import { globalDevTools } from './devtools-config'
globalDevTools.apply(store)
```

### Production vs Development

```javascript
import { devTools } from '@nexus-state/devtools'

const devtoolsPlugin = devTools({
  // Enable only in development
  ...(process.env.NODE_ENV === 'development' ? {
    trace: true,
    maxAge: 100
  } : {
    trace: false,
    maxAge: 10
  })
})

devtoolsPlugin.apply(store)
```

---

## ⚠️ Troubleshooting

### Problem: DevTools not connecting

**Cause:** Redux DevTools extension not installed

**Solution:** Install extension:
- [Chrome Web Store](https://chrome.google.com/webstore/detail/redux-devtools/)
- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

### Problem: Too many actions in history

**Solution:** Reduce `maxAge` or use batch:

```javascript
const devtoolsPlugin = devTools({ maxAge: 20 })

// Or group actions
store.startBatch('bulk-update')
// ... multiple changes
store.endBatch('bulk-update')
```

### Problem: Slow performance with large data

**Solution:** Use sanitizer and latency:

```javascript
const devtoolsPlugin = devTools({
  latency: 200,  // Delay before send
  stateSanitizer: (state) => {
    // Remove large arrays
    const { largeArray, ...rest } = state
    return rest
  }
})
```

---

## 📚 Documentation

- [DevTools Guide](https://nexus-state.website.yandexcloud.net/guide/devtools)
- [API Reference](https://nexus-state.website.yandexcloud.net/api/devtools)
- [Time Travel Debugging](https://nexus-state.website.yandexcloud.net/guides/time-travel)
- [Performance Tips](https://nexus-state.website.yandexcloud.net/performance/devtools)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/eustatos/nexus-state/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT © [Nexus State](https://github.com/eustatos/nexus-state)
