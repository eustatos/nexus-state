# @nexus-state/query

Powerful data fetching and caching for Nexus State.

## Installation

```bash
npm install @nexus-state/query
```

## Quick Start

### Queries

```typescript
import { createStore } from '@nexus-state/core';
import { useQuery } from '@nexus-state/query';

const store = createStore();

const userQuery = useQuery(store, {
  queryKey: 'user',
  queryFn: async () => {
    const response = await fetch('/api/user');
    return response.json();
  }
});

console.log(userQuery.data); // User data
console.log(userQuery.isLoading); // Loading state
console.log(userQuery.error); // Error if any

// Refetch
await userQuery.refetch();
```

### Mutations

```typescript
import { mutation } from '@nexus-state/query';

const updateUser = mutation({
  mutationFn: async (user: { id: number; name: string }) => {
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
    return response.json();
  },
  onSuccess: (data) => {
    console.log('User updated:', data);
  },
  onError: (error) => {
    console.error('Update failed:', error);
  },
});

// Fire and forget
updateUser.mutate({ id: 1, name: 'John' });

// With await
const result = await updateUser.mutateAsync({ id: 1, name: 'John' });
```

## Features

- ✅ Automatic caching
- ✅ Background refetching (window focus, reconnect, interval)
- ✅ Retry logic
- ✅ TypeScript support
- ✅ Framework agnostic
- ✅ Mutations with optimistic updates
- ✅ Query invalidation
- ⬜ Infinite Queries (coming soon)
- ⬜ SSR support (coming soon)

## API

### Queries

#### `useQuery(store, options)`

Creates a query that automatically fetches and caches data.

```typescript
import { useQuery } from '@nexus-state/query';

const result = useQuery(store, {
  queryKey: 'posts',
  queryFn: async () => fetch('/api/posts').then(r => r.json()),
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: true,
  retry: 3,
});
```

**Result properties:**
- `status` - 'idle' | 'loading' | 'success' | 'error'
- `data` - The fetched data
- `error` - Error if failed
- `isLoading`, `isSuccess`, `isError`, `isIdle` - Boolean flags
- `refetch()` - Manually refetch
- `remove()` - Remove from cache

### Mutations

#### `mutation(options)`

Creates a mutation for data updates.

```typescript
import { mutation } from '@nexus-state/query';

const createPost = mutation({
  mutationFn: async (post) => {
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
    return response.json();
  },
  onSuccess: (data) => {
    console.log('Post created:', data);
  },
  invalidateQueries: ['posts'], // Invalidate after success
});
```

**Result properties:**
- `state` - Atom with mutation state
- `mutate(variables)` - Fire and forget
- `mutateAsync(variables)` - Returns promise
- `reset()` - Reset to initial state

**State properties:**
- `status` - 'idle' | 'loading' | 'success' | 'error'
- `data` - The mutation result
- `error` - Error if failed
- `variables` - The variables passed to mutate
- `isPending`, `isSuccess`, `isError`, `isIdle` - Boolean flags

### Optimistic Updates

```typescript
const updateTodo = mutation({
  mutationFn: async (todo) => {
    const response = await fetch(`/api/todos/${todo.id}`, {
      method: 'PUT',
      body: JSON.stringify(todo),
    });
    return response.json();
  },

  onMutate: async (newTodo) => {
    // Save current state for rollback
    const previousTodos = store.get(todosAtom);

    // Optimistically update UI
    store.set(todosAtom, (todos) =>
      todos.map((t) => (t.id === newTodo.id ? newTodo : t))
    );

    return { previousTodos };
  },

  onError: (error, newTodo, context) => {
    // Rollback on error
    if (context?.previousTodos) {
      store.set(todosAtom, context.previousTodos);
    }
  },
});
```

### Retry Configuration

```typescript
const riskyMutation = mutation({
  mutationFn: async (data) => {
    return await fetch('/api/risky', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  retry: 3,
  retryDelay: (failureCount) => Math.min(1000 * 2 ** failureCount, 30000),
});
```

## License

MIT
