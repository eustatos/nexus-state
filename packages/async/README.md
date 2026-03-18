# @nexus-state/async

> Simple async state management with loading/error/data states
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/async)](https://www.npmjs.com/package/@nexus-state/async)
> [![Coverage for async package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=async)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
> [![npm downloads](https://img.shields.io/npm/dw/@nexus-state/async)](https://www.npmjs.com/package/@nexus-state/async)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 🚀 Quick Start

```tsx
import { asyncAtom } from '@nexus-state/async';
import { createStore } from '@nexus-state/core';

// Create async atom
const userId = 123;
const [userAtom, fetchUser] = asyncAtom({
  fetchFn: async (store) => {
    const res = await fetch(`/api/users/${userId}`);
    return res.json();
  },
  initialValue: null,
});

const store = createStore();

// Subscribe to state changes
store.subscribe(userAtom, (state) => {
  console.log(`Loading: ${state.loading}`);
  console.log(`Data: ${state.data}`);
  console.log(`Error: ${state.error}`);
});

// Fetch data
await fetchUser(store);
```

**Use when:** You need basic async state without caching, prefetch, or SSR.

**Use @nexus-state/query instead when:** You need caching, prefetch, SSR, mutations.

---

## 🎯 Async vs Query

| Scenario | @nexus-state/async | @nexus-state/query |
|----------|-------------------|-------------------|
| **Simple fetch with loading** | ✅ | ⚠️ Overkill |
| **SSR prefetch** | ❌ | ✅ |
| **Automatic caching** | ❌ | ✅ |
| **Background refetch** | ❌ | ✅ |
| **Optimistic updates** | ❌ | ✅ |
| **Mutations** | ❌ | ✅ |
| **Bundle size** | 2KB | 8KB |

### ✅ Choose @nexus-state/async if you need:

- Simple loading/error/data state
- Minimal bundle size (2KB)
- No caching needed
- One-time fetches

### ❌ Use @nexus-state/query if you need:

- Automatic caching
- SSR prefetch
- Background refetch
- Optimistic updates
- Mutations

📖 **@nexus-state/query docs:** [npm](https://www.npmjs.com/package/@nexus-state/query)

---

## 📦 Installation

```bash
npm install @nexus-state/async
```

**Required:**
```bash
npm install @nexus-state/core
```

---

## 📖 Core API

### asyncAtom

```tsx
import { asyncAtom } from '@nexus-state/async';

// Basic async atom
const userId = 123;
const [userAtom, fetchUser] = asyncAtom({
  fetchFn: async (store) => {
    const res = await fetch(`/api/users/${userId}`);
    return res.json();
  },
  initialValue: null,
});

// With custom name
const [postsAtom, fetchPosts] = asyncAtom({
  fetchFn: async () => fetchPosts(),
  initialValue: [],
  name: 'posts',
});
```

### State Shape

```tsx
type AsyncState<T> = {
  loading: boolean;
  error: Error | null;
  data: T | null;
};

// Subscribe to state
store.subscribe(userAtom, (state: AsyncState<User>) => {
  if (state.loading) {
    console.log('Loading...');
  } else if (state.error) {
    console.error('Error:', state.error.message);
  } else if (state.data) {
    console.log('Data:', state.data);
  }
});
```

---

## 🔌 Integration with Core

### Computed Atoms from Async Data

```tsx
import { atom, createStore } from '@nexus-state/core';
import { asyncAtom } from '@nexus-state/async';

const userId = 123;
const [userAtom, fetchUser] = asyncAtom({
  fetchFn: async (store) => fetchUserById(userId),
  initialValue: null,
});

// Computed atom from async data
const userNameAtom = atom((get) => {
  const userState = get(userAtom);
  return userState.data?.name ?? 'Loading...';
});

const store = createStore();
console.log(store.get(userNameAtom));
```

### Multiple Async Atoms

```tsx
import { asyncAtom } from '@nexus-state/async';

const userId = 123;
const [userAtom, fetchUser] = asyncAtom({
  fetchFn: async (store) => fetchUserById(userId),
  initialValue: null,
});

const [postsAtom, fetchPosts] = asyncAtom({
  fetchFn: async (store) => fetchPostsByUser(userId),
  initialValue: [],
});

const store = createStore();

// Fetch both
await Promise.all([
  fetchUser(store),
  fetchPosts(store),
]);
```

---

## 🔧 Error Handling

### Basic Error Handling

```tsx
import { asyncAtom } from '@nexus-state/async';

const [dataAtom, fetchData] = asyncAtom({
  fetchFn: async () => {
    const res = await fetch('/api/data');
    if (!res.ok) {
      throw new Error('Failed to fetch');
    }
    return res.json();
  },
  initialValue: null,
});

// Subscribe to error changes
store.subscribe(dataAtom, (state) => {
  if (state.error) {
    console.error('Fetch failed:', state.error.message);
  }
});
```

### Retry Logic

```tsx
import { asyncAtom } from '@nexus-state/async';

const [dataAtom, fetchData] = asyncAtom({
  fetchFn: async () => {
    let lastError;
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch('/api/data');
        return res.json();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  },
  initialValue: null,
});
```

---

## 📦 Related Packages

| Package | Description | npm |
|---------|-------------|-----|
| [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) | Core concepts | [Install](https://www.npmjs.com/package/@nexus-state/core) |
| [@nexus-state/query](https://www.npmjs.com/package/@nexus-state/query) | Data fetching with caching | [Install](https://www.npmjs.com/package/@nexus-state/query) |
| [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react) | React integration | [Install](https://www.npmjs.com/package/@nexus-state/react) |

---

## 🔗 See Also

- **Core:** [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) — Foundation (atoms, stores)
- **Framework integration:**
  - [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react) — React hooks
  - [@nexus-state/vue](https://www.npmjs.com/package/@nexus-state/vue) — Vue composables
  - [@nexus-state/svelte](https://www.npmjs.com/package/@nexus-state/svelte) — Svelte stores
- **Related:**
  - [@nexus-state/query](https://www.npmjs.com/package/@nexus-state/query) — Data fetching with caching, SSR prefetch

**Full ecosystem:** [Nexus State Packages](https://www.npmjs.com/org/nexus-state)

---

## 📄 License

MIT
