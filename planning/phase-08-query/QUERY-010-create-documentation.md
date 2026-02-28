# QUERY-010: Create Documentation

## 📋 Task Overview

**Priority:** 🟢 Low  
**Estimated Time:** 6 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  

---

## 🎯 Objective

Create comprehensive documentation for the query package including API reference, usage guides, and examples.

---

## 📦 Affected Components

**Package:** `@nexus-state/query`  
**Files:**
- `packages/query/README.md` (UPDATE)
- `docs/query/getting-started.md` (NEW)
- `docs/query/api-reference.md` (NEW)
- `docs/query/examples.md` (NEW)

---

## 🔍 Current State Analysis

**Findings:**
- Current behavior: Basic README from QUERY-001
- Issues: Lacks detailed usage examples, API docs
- Root cause: Full documentation not yet written

---

## ✅ Acceptance Criteria

- [ ] README.md with complete overview
- [ ] Getting started guide
- [ ] API reference for all exports
- [ ] Usage examples (5+ scenarios)
- [ ] Migration guide from React Query
- [ ] Troubleshooting section
- [ ] All code examples tested

---

## 📝 Implementation Steps

### Step 1: Update Package README

**How:**
```markdown
# @nexus-state/query

[![npm version](https://img.shields.io/npm/v/@nexus-state/query.svg)](https://www.npmjs.com/package/@nexus-state/query)
[![Bundle Size](https://img.shields.io/bundlephobia/min/@nexus-state/query)](https://bundlephobia.com/package/@nexus-state/query)
[![Coverage](https://img.shields.io/codecov/c/github/eustatos/nexus-state/main)](https://codecov.io/gh/eustatos/nexus-state)

> 🔄 Data fetching and caching on top of Nexus State atoms

---

## ✨ Features

- 🎯 **Query Atoms** - Declarative async data management
- 💾 **Smart Caching** - 3-tier caching (memory, session, IndexedDB)
- 🔄 **Request Deduplication** - Automatic duplicate prevention
- 🔁 **Background Refetch** - Polling, focus, network-based
- ⚡ **Optimistic Updates** - Instant UI with rollback
- 🗑️ **Garbage Collection** - Automatic memory management

## 📦 Installation

```bash
npm install @nexus-state/core @nexus-state/query
```

## 🚀 Quick Start

```typescript
import { queryAtom } from '@nexus-state/query';
import { useAtomValue } from '@nexus-state/react';

// Define query
const userQuery = queryAtom({
  key: ['user', userId],
  fetcher: async ({ queryKey }) => {
    const [, userId] = queryKey;
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  },
  staleTime: 5 * 60 * 1000,    // 5 minutes
  cacheTime: 10 * 60 * 1000,   // 10 minutes
});

// Use in component
function UserProfile({ userId }) {
  const user = useAtomValue(userQuery);

  if (user.status === 'loading') return <div>Loading...</div>;
  if (user.status === 'error') return <div>Error: {user.error.message}</div>;

  return <div>{user.data.name}</div>;
}
```

## 📚 Documentation

- [Getting Started](/docs/query/getting-started.md)
- [API Reference](/docs/query/api-reference.md)
- [Examples](/docs/query/examples.md)
- [Migration from React Query](/docs/query/migration-react-query.md)

## 📊 Comparison

| Feature | Nexus Query | React Query | SWR |
|---------|-------------|-------------|-----|
| Framework Agnostic | ✅ | ❌ | ❌ |
| Bundle Size | ~5KB | ~13KB | ~4KB |
| Built on Atoms | ✅ | ❌ | ❌ |
| DevTools | ✅ | ✅ | ❌ |

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## 📄 License

MIT © [Nexus State](https://github.com/eustatos/nexus-state)
```

### Step 2: Create API Reference

**How:**
```markdown
# API Reference

## queryAtom

Creates a query atom for managing async data.

### Signature

```typescript
function queryAtom<T>(options: QueryOptions<T>): QueryAtom<T>
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `key` | `QueryKey` | - | Unique query identifier |
| `fetcher` | `QueryFunction<T>` | - | Function that fetches data |
| `staleTime` | `number` | `300000` | Time until data is stale |
| `cacheTime` | `number` | `600000` | Time until cache eviction |
| `retry` | `number` | `0` | Number of retry attempts |
| `enabled` | `boolean` | `true` | Enable/disable query |
| `initialData` | `T` | `undefined` | Initial data |

### Returns

`QueryAtom<T>` - Atom with QueryState<T>

### Example

```typescript
const userQuery = queryAtom({
  key: 'user',
  fetcher: async () => {
    const res = await fetch('/api/user');
    return res.json();
  },
});
```

## queryCache

Cache management utilities.

### Methods

- `get(key)` - Get cached entry
- `set(key, entry)` - Set cache entry
- `invalidate(key)` - Invalidate entry
- `clear()` - Clear all cache

### Example

```typescript
import { queryCache } from '@nexus-state/query';

// Invalidate specific query
await queryCache.invalidate('user');

// Clear all cache
await queryCache.clear();
```

## invalidateQuery

Invalidates a query and triggers refetch.

### Signature

```typescript
function invalidateQuery(queryKey: QueryKey): void
```

### Example

```typescript
import { invalidateQuery } from '@nexus-state/query';

// Invalidate user query
invalidateQuery('user');

// Invalidate all user queries
invalidateQuery(['users']);
```

## refetchQuery

Refetches a query immediately.

### Signature

```typescript
function refetchQuery(queryKey: QueryKey): Promise<void>
```

### Example

```typescript
import { refetchQuery } from '@nexus-state/query';

await refetchQuery('user');
```
```

### Step 3: Create Examples

**How:**
```markdown
# Examples

## Basic Data Fetching

```typescript
const userQuery = queryAtom({
  key: ['user', id],
  fetcher: async ({ queryKey }) => {
    const [, id] = queryKey;
    const res = await fetch(`/api/users/${id}`);
    return res.json();
  },
});
```

## Polling

```typescript
const statsQuery = queryAtom({
  key: 'stats',
  fetcher: fetchStats,
  refetchInterval: 10000, // 10 seconds
});
```

## Optimistic Updates

```typescript
const updateMutation = mutationAtom({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    // Optimistic update
    setQueryData(todosQuery, old => [...old, newTodo]);
  },
  onError: (error, variables, context) => {
    // Rollback
    setQueryData(todosQuery, context.previousTodos);
  },
});
```

## Dependent Queries

```typescript
const userQuery = queryAtom({
  key: ['user', id],
  fetcher: fetchUser,
});

const postsQuery = queryAtom({
  key: ['user', id, 'posts'],
  fetcher: async ({ get }) => {
    const user = get(userQuery);
    if (!user.data) return null;
    return fetchPosts(user.data.id);
  },
  enabled: (get) => !!get(userQuery).data,
});
```

## Pagination

```typescript
const createPaginatedQuery = (key, fetcher) => {
  return queryAtom({
    key: [key, 'page'],
    fetcher: ({ queryKey }) => {
      const [, page] = queryKey;
      return fetcher(page);
    },
  });
};

const productsQuery = createPaginatedQuery('products', fetchProducts);
```
```

---

## 🔗 Related Tasks

- **Depends On:** QUERY-001 through QUERY-009 (all previous tasks)
- **Blocks:** Phase 08 completion
- **Related:** Phase 06 (Documentation & Community)

---

**Created:** 2026-02-28  
**Estimated Completion:** 2026-03-11  
**Actual Completion:** TBD
