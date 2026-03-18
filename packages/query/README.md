# @nexus-state/query

> Powerful data fetching and caching for Nexus State — with SSR prefetch, automatic caching, and optimistic updates
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/query)](https://www.npmjs.com/package/@nexus-state/query)
> [![Coverage for query package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=query)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
> [![npm downloads](https://img.shields.io/npm/dw/@nexus-state/query)](https://www.npmjs.com/package/@nexus-state/query)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 🚀 Quick Start (SSR Prefetch)

```tsx
import { prefetchQuery } from '@nexus-state/query/react';
import { useQuery } from '@nexus-state/query/react';

// Server (Next.js getServerSideProps)
export async function getServerSideProps(context) {
  await prefetchQuery({
    queryKey: ['user', context.params.id],
    queryFn: () => fetchUser(context.params.id),
  });
  return { props: {} };
}

// Client (data already cached!)
function Page() {
  const { data: user } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
  });
  return <div>{user.name}</div>;
}
```

**Like TanStack Query, but built on Nexus State's atomic architecture**

---

## 🎯 Why Nexus State Query?

### Comparison with Alternatives

| Feature | @nexus-state/query | TanStack Query | SWR |
|---------|-------------------|----------------|-----|
| **Bundle size** | 8KB | 13KB | 6KB |
| **SSR prefetch** | ✅ Built-in | ⚠️ Complex | ⚠️ Complex |
| **Atomic integration** | ✅ Shares atoms | ❌ Separate | ❌ Separate |
| **Fine-grained updates** | ✅ Per-atom | ⚠️ Per-query | ⚠️ Per-key |
| **Multi-framework** | ✅ React/Vue/Svelte | ⚠️ React-focused | ⚠️ React-focused |
| **DevTools** | ✅ Redux DevTools | ✅ Own DevTools | ❌ |

### ✅ Choose Nexus State Query if you need:

- SSR prefetch with automatic hydration
- Automatic caching with configurable stale time
- Optimistic updates for mutations
- Integration with Nexus State atoms
- Multi-framework support (React, Vue, Svelte)

### ❌ Use alternatives if:

- React-only project → **TanStack Query** (more plugins)
- Simple fetch → **@nexus-state/async** (lighter, 2KB)
- Minimal bundle → **SWR** (6KB)

---

## 📦 Installation

```bash
npm install @nexus-state/query
```

**For React:**
```bash
npm install @nexus-state/query @nexus-state/react
```

---

## 📖 Core Features

### Queries

```tsx
import { useQuery, useQueries, useSuspenseQuery } from '@nexus-state/query/react';
```

### Mutations

```tsx
import { useMutation } from '@nexus-state/query/react';
```

### Prefetch

```tsx
import { prefetchQuery, usePrefetch } from '@nexus-state/query/react';
```

### Cache Management

```tsx
import { getQueryData, setQueryData, invalidateQuery } from '@nexus-state/query/react';
```

---

## 🔌 React API

### useQuery

```tsx
import { useQuery } from '@nexus-state/query/react';

function UserProfile({ userId }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data.name}</div>;
}
```

**Options:**
- `enabled` — Enable/disable query (default: `true`)
- `staleTime` — Time in ms before data is stale
- `retry` — Number of retry attempts (default: `3`)
- `useErrorBoundary` — Throw errors to React Error Boundary
- `suspense` — Enable React Suspense mode

**Result:**
- `data` — The fetched data
- `isLoading` — Initial loading state
- `isSuccess` — Query succeeded
- `isError` — Query failed
- `isIdle` — Query hasn't run yet
- `isFetching` — Currently fetching
- `error` — Error if failed
- `refetch()` — Manually refetch
- `status` — 'idle' | 'loading' | 'success' | 'error'

---

### useSuspenseQuery

```tsx
import { useSuspenseQuery } from '@nexus-state/query/react';

function UserProfile({ userId }) {
  const { data } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  return <div>{data.name}</div>;
}

// Wrap with Suspense
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId={1} />
    </Suspense>
  );
}
```

---

### useMutation (with Optimistic Updates)

```tsx
import { useMutation, useQueryClient } from '@nexus-state/query/react';

function AddTodo() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createTodo,
    onMutate: async (newTodo) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: 'todos' });

      // Snapshot previous value
      const previousTodos = queryClient.getQueryData('todos');

      // Optimistically update
      queryClient.setQueryData('todos', (old) => [...old, newTodo]);

      return { previousTodos };
    },
    onError: (err, newTodo, context) => {
      // Rollback on error
      queryClient.setQueryData('todos', context.previousTodos);
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: 'todos' });
    },
  });

  return <button onClick={() => mutation.mutate({ text: 'New' })}>Add</button>;
}
```

---

## 🌐 SSR Patterns

### Next.js (getServerSideProps)

```tsx
export async function getServerSideProps(context) {
  await prefetchQuery({
    queryKey: ['user', context.params.id],
    queryFn: () => fetchUser(context.params.id),
  });
  return { props: {} };
}
```

### Remix (loaders)

```tsx
export async function loader({ params }) {
  await prefetchQuery({
    queryKey: ['user', params.id],
    queryFn: () => fetchUser(params.id),
  });
  return json({});
}
```

### Nuxt (asyncData)

```vue
<script setup>
export default {
  async asyncData({ app }) {
    await prefetchQuery({
      queryKey: 'user',
      queryFn: fetchUser,
    });
  }
}
</script>
```

---

## 🔥 Prefetch Strategies

### Manual Prefetch

```tsx
import { usePrefetch } from '@nexus-state/query/react';

function Button() {
  const prefetch = usePrefetch();
  return (
    <button onMouseEnter={() => prefetch({
      queryKey: 'user',
      queryFn: fetchUser,
    })}>
      Load User
    </button>
  );
}
```

### Hover Prefetch

```tsx
import { usePrefetchOnHover } from '@nexus-state/query/react';

function UserLink({ userId }) {
  const { onMouseEnter, onMouseLeave } = usePrefetchOnHover({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    delay: 200, // Wait 200ms before prefetching
  });

  return (
    <a href={`/users/${userId}`} {...{ onMouseEnter, onMouseLeave }}>
      {userId}
    </a>
  );
}
```

### Viewport Prefetch

```tsx
import { usePrefetchOnViewport } from '@nexus-state/query/react';

function Card({ itemId }) {
  const ref = usePrefetchOnViewport({
    queryKey: ['item', itemId],
    queryFn: () => fetchItem(itemId),
    threshold: 0.5, // Prefetch when 50% visible
  });

  return <div ref={ref}>...</div>;
}
```

---

## 🔧 Cache Management

### Get/Set Query Data

```tsx
import { getQueryData, setQueryData } from '@nexus-state/query/react';

// Get cached data
const user = getQueryData(['user', id]);

// Update cached data
setQueryData(['user', id], (old) => ({
  ...old,
  name: 'Updated',
}));
```

### Invalidate Queries

```tsx
import { invalidateQuery } from '@nexus-state/query/react';

// Invalidate specific query
await invalidateQuery(['user', id]);

// Invalidate all queries
await invalidateQuery();
```

---

## 📚 Async vs Query: When to Use Which?

| Scenario | @nexus-state/async | @nexus-state/query |
|----------|-------------------|-------------------|
| **Simple fetch with loading** | ✅ | ⚠️ Overkill |
| **SSR prefetch** | ❌ | ✅ |
| **Automatic caching** | ❌ | ✅ |
| **Background refetch** | ❌ | ✅ |
| **Optimistic updates** | ❌ | ✅ |
| **Mutations** | ❌ | ✅ |
| **Bundle size** | 2KB | 8KB |

**Use @nexus-state/async when:** You need basic async state without caching, prefetch, or SSR.

**Use @nexus-state/query when:** You need caching, SSR prefetch, mutations, or optimistic updates.

📖 **@nexus-state/async docs:** [npm](https://www.npmjs.com/package/@nexus-state/async)

---

## 🔗 Migration from TanStack Query

```tsx
// TanStack Query
import { useQuery } from '@tanstack/react-query';

// @nexus-state/query (almost identical!)
import { useQuery } from '@nexus-state/query/react';

// Same API:
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['user', id],
  queryFn: () => fetchUser(id),
  staleTime: 5 * 60 * 1000,
  retry: 3,
});
```

**Key differences:**
- Query client is optional (uses Nexus State store by default)
- Smaller bundle size (8KB vs 13KB)
- Built-in SSR prefetch utilities
- Multi-framework support (Vue, Svelte coming soon)

---

## 📦 Related Packages

| Package | Description | npm |
|---------|-------------|-----|
| [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) | Core concepts | [Install](https://www.npmjs.com/package/@nexus-state/core) |
| [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react) | React integration | [Install](https://www.npmjs.com/package/@nexus-state/react) |
| [@nexus-state/async](https://www.npmjs.com/package/@nexus-state/async) | Simple async state | [Install](https://www.npmjs.com/package/@nexus-state/async) |
| [@nexus-state/persist](https://www.npmjs.com/package/@nexus-state/persist) | Persistence | [Install](https://www.npmjs.com/package/@nexus-state/persist) |

---

## 🔗 See Also

- **Core:** [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) — Foundation (atoms, stores)
- **Framework integration:**
  - [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react) — React hooks
  - [@nexus-state/vue](https://www.npmjs.com/package/@nexus-state/vue) — Vue composables
  - [@nexus-state/svelte](https://www.npmjs.com/package/@nexus-state/svelte) — Svelte stores
- **Related:**
  - [@nexus-state/async](https://www.npmjs.com/package/@nexus-state/async) — Simple async state (lighter alternative)
  - [@nexus-state/persist](https://www.npmjs.com/package/@nexus-state/persist) — LocalStorage persistence

**Full ecosystem:** [Nexus State Packages](https://www.npmjs.com/org/nexus-state)

---

## 📄 License

MIT
