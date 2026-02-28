# @nexus-state/async

[![npm version](https://img.shields.io/npm/v/@nexus-state/async.svg)](https://www.npmjs.com/package/@nexus-state/async)
[![Bundle Size](https://img.shields.io/bundlephobia/min/@nexus-state/async)](https://bundlephobia.com/package/@nexus-state/async)
[![License](https://img.shields.io/npm/l/@nexus-state/async.svg)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

> ⚡ Async operations with state: data fetching, caching, request cancellation, and error handling

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## ✨ Why It's Cool

- 🎯 **Async Atoms** — built-in Promise support
- 🔄 **Auto States** — loading, success, error
- 🚫 **Request Cancellation** — AbortController integration
- 💾 **Caching** — avoid unnecessary requests
- ⏱ **Debounce/Throttle** — control request frequency
- 🛡️ **Retry Logic** — automatic retry attempts

---

## 📦 Installation

```bash
npm install @nexus-state/core @nexus-state/async
```

---

## 🚀 Quick Start

### Basic Async Atom

```javascript
import { atom } from '@nexus-state/core'
import { asyncAtom } from '@nexus-state/async'

// Create async atom for user loading
const userAtom = asyncAtom(
  'user',
  async (userId) => {
    const response = await fetch(`/api/users/${userId}`)
    return response.json()
  }
)

// Start loading
store.set(userAtom, { params: 1 })

// Get state
const state = store.get(userAtom)
// { loading: true, data: null, error: null }
// → { loading: false, data: {...}, error: null }
```

---

## 📖 API

### `asyncAtom(name, fn, options?)`

Creates an async atom.

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Atom name for debugging |
| `fn` | `Function` | Async function `(params) => Promise<T>` |
| `options` | `Object` (optional) | Options |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultValue` | `any` | `null` | Initial value |
| `cacheTime` | `number` | `0` | Cache time (ms) |
| `staleTime` | `number` | `0` | Stale time (ms) |
| `retry` | `number` | `0` | Retry attempts |
| `retryDelay` | `number` | `1000` | Delay between retries (ms) |
| `debounce` | `number` | `0` | Debounce delay (ms) |
| `throttle` | `number` | `0` | Throttle delay (ms) |

**Returns:** `Atom<AsyncState<T>>`

### AsyncState Structure

```typescript
interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  isStale: boolean
  lastUpdated: number | null
}
```

### `createAsyncOperation(fn, options)`

Creates a managed async operation.

---

## 💡 Usage Examples

### Data Fetching with Error Handling

```javascript
import { asyncAtom } from '@nexus-state/async'

const userAtom = asyncAtom('user', async (userId) => {
  const response = await fetch(`/api/users/${userId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`)
  }
  return response.json()
}, {
  defaultValue: null,
  retry: 3,
  retryDelay: 1000
})

// In component
const state = store.get(userAtom)

if (state.loading) return <Spinner />
if (state.error) return <Error message={state.error.message} />
return <UserProfile data={state.data} />
```

### Request Caching

```javascript
import { asyncAtom } from '@nexus-state/async'

// Cache for 5 minutes
const productsAtom = asyncAtom('products', async () => {
  const response = await fetch('/api/products')
  return response.json()
}, {
  cacheTime: 5 * 60 * 1000,  // 5 minutes
  staleTime: 60 * 1000       // 1 minute until "stale"
})

// Subsequent request returns cached data
const cached = store.get(productsAtom)
```

### Request Cancellation

```javascript
import { asyncAtom, cancelAsyncOperation } from '@nexus-state/async'

const searchAtom = asyncAtom('search', async (query, { signal }) => {
  const response = await fetch(`/api/search?q=${query}`, { signal })
  return response.json()
})

// Start search
store.set(searchAtom, { params: 'react' })

// Cancel request (e.g., on unmount)
cancelAsyncOperation(searchAtom)
```

### Debounce for Search

```javascript
import { asyncAtom } from '@nexus-state/async'

// 300ms debounce for search
const searchAtom = asyncAtom('search', async (query) => {
  const response = await fetch(`/api/search?q=${query}`)
  return response.json()
}, {
  debounce: 300
})

// Rapid changes won't trigger extra requests
store.set(searchAtom, { params: 'r' })
store.set(searchAtom, { params: 're' })
store.set(searchAtom, { params: 'rea' })
store.set(searchAtom, { params: 'react' })  // Request only for this
```

### Polling

```javascript
import { asyncAtom, createPolling } from '@nexus-state/async'

const statsAtom = asyncAtom('stats', async () => {
  const response = await fetch('/api/stats')
  return response.json()
})

// Create polling with 10 second interval
const polling = createPolling(statsAtom, {
  interval: 10000,
  enabled: true
})

// Start
polling.start()

// Stop
polling.stop()

// Toggle
polling.toggle()
```

### Parallel Requests

```javascript
import { asyncAtom } from '@nexus-state/async'

const userAtom = asyncAtom('user', async (id) => {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
})

const postsAtom = asyncAtom('posts', async (userId) => {
  const res = await fetch(`/api/users/${userId}/posts`)
  return res.json()
})

const commentsAtom = asyncAtom('comments', async (postId) => {
  const res = await fetch(`/api/posts/${postId}/comments`)
  return res.json()
})

// Load all in parallel
store.set(userAtom, { params: 1 })
store.set(postsAtom, { params: 1 })
store.set(commentsAtom, { params: 1 })
```

### Sequential Requests (Dependencies)

```javascript
import { atom, createStore } from '@nexus-state/core'
import { asyncAtom } from '@nexus-state/async'

const store = createStore()

// First load user
const userAtom = asyncAtom('user', async (id) => {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
})

// Then load orders (depends on user)
const ordersAtom = asyncAtom('orders', async (_, { get }) => {
  const user = get(userAtom)
  if (!user.data) return null
  
  const res = await fetch(`/api/users/${user.data.id}/orders`)
  return res.json()
})

// Load user, orders will load automatically
store.set(userAtom, { params: 1 })
```

### Retry with Exponential Delay

```javascript
import { asyncAtom } from '@nexus-state/async'

const apiAtom = asyncAtom('api', async () => {
  const response = await fetch('/api/data')
  if (!response.ok) throw new Error('API Error')
  return response.json()
}, {
  retry: 5,
  retryDelay: (attempt) => Math.pow(2, attempt) * 1000  // 1s, 2s, 4s, 8s, 16s
})
```

### Upload with Progress

```javascript
import { atom } from '@nexus-state/core'
import { asyncAtom } from '@nexus-state/async'

const uploadAtom = asyncAtom('upload', async (file, { onProgress }) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    onProgress: (event) => {
      const progress = (event.loaded / event.total) * 100
      onProgress(progress)
    }
  })
  
  return response.json()
})

// Track progress
const progressAtom = atom(0, 'uploadProgress')

store.set(uploadAtom, {
  params: file,
  onProgress: (progress) => {
    store.set(progressAtom, progress)
  }
})
```

---

## ⚙️ Configuration

### Global Settings

```javascript
import { setAsyncDefaults } from '@nexus-state/async'

setAsyncDefaults({
  retry: 3,
  retryDelay: 1000,
  cacheTime: 5 * 60 * 1000,
  timeout: 30000
})
```

### Custom Fetch with Timeout

```javascript
import { asyncAtom } from '@nexus-state/async'

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

const dataAtom = asyncAtom('data', async () => {
  return fetchWithTimeout('/api/data')
})
```

---

## ⚠️ Troubleshooting

### Problem: Request not cancelled

**Solution:** Use signal from context:

```javascript
const atom = asyncAtom('data', async (params, { signal }) => {
  // ✅ Pass signal to fetch
  return fetch('/api/data', { signal })
})
```

### Problem: Extra requests on rapid input

**Solution:** Use debounce:

```javascript
const searchAtom = asyncAtom('search', async (query) => {
  return fetch(`/api/search?q=${query}`)
}, {
  debounce: 300  // Wait 300ms after last input
})
```

### Problem: Stale data

**Solution:** Check `isStale`:

```javascript
const state = store.get(dataAtom)

if (state.isStale) {
  // Data is stale, fetch new
  store.set(dataAtom, { params: id })
}
```

---

## 📚 Documentation

- [Async Operations](https://nexus-state.website.yandexcloud.net/guide/async)
- [API Reference](https://nexus-state.website.yandexcloud.net/api/async)
- [Data Fetching Patterns](https://nexus-state.website.yandexcloud.net/guides/data-fetching)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/eustatos/nexus-state/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT © [Nexus State](https://github.com/eustatos/nexus-state)
