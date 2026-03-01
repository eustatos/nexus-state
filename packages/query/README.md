# @nexus-state/query

Powerful data fetching and caching for Nexus State.

## Installation

```bash
npm install @nexus-state/query
```

For React integration:

```bash
npm install @nexus-state/query @nexus-state/react
```

## Quick Start

### React Hooks (Recommended)

```tsx
import { useQuery, useMutation, QueryClientProvider, createQueryClient } from '@nexus-state/query/react';

// Create query client
const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
});

// Wrap your app
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  );
}

// Use in components
function UserProfile({ userId }: { userId: number }) {
  const { data, isLoading, error, refetch } = useQuery(
    `user-${userId}`,
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    },
    {
      staleTime: 5 * 60 * 1000,
      retry: 3,
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Framework-Agnostic Queries

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
- ✅ React hooks with automatic re-renders
- ✅ Mutations with optimistic updates
- ✅ Query invalidation
- ✅ Error boundary integration
- ✅ SSR compatible
- ⬜ Infinite Queries (coming soon)
- ⬜ Suspense support (coming soon)

## React API

### useQuery

Hook for fetching data with automatic caching and re-renders.

```tsx
import { useQuery } from '@nexus-state/query/react';

function UserProfile({ userId }: { userId: number }) {
  const { data, isLoading, error, refetch, isFetching, isStale } = useQuery(
    `user-${userId}`,
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    },
    {
      enabled: true, // Enable/disable query
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      useErrorBoundary: true, // Throw errors to React Error Boundary
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{isStale ? 'Data is stale' : 'Data is fresh'}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

**Options:**
- `enabled` - Enable/disable query (default: `true`)
- `staleTime` - Time in ms before data is considered stale
- `retry` - Number of retry attempts (default: `3`)
- `retryDelay` - Delay between retries in ms
- `useErrorBoundary` - Throw errors to React Error Boundary
- `suspense` - Enable React Suspense mode
- `onSuccess` - Callback on success
- `onError` - Callback on error

**Result:**
- `data` - The fetched data
- `error` - Error if failed
- `isLoading` - Initial loading state
- `isSuccess` - Query succeeded
- `isError` - Query failed
- `isIdle` - Query hasn't run yet
- `isFetching` - Currently fetching
- `isStale` - Data is stale
- `status` - 'idle' | 'loading' | 'success' | 'error'
- `refetch()` - Manually refetch

### useMutation

Hook for executing mutations with state management.

```tsx
import { useMutation } from '@nexus-state/query/react';

function CreatePost() {
  const { mutate, mutateAsync, isPending, isError, error, data, reset } = useMutation({
    mutationFn: async (post: { title: string; content: string }) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(post),
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Post created:', data);
    },
    onError: (error) => {
      console.error('Creation failed:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ title: 'New Post', content: 'Content here' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
      {isError && <div>Error: {error.message}</div>}
      {data && <div>Created: {data.id}</div>}
      <button type="button" onClick={reset}>Reset</button>
    </form>
  );
}
```

**Options:**
- `mutationFn` - Function to execute mutation
- `onSuccess` - Callback on success
- `onError` - Callback on error
- `onSettled` - Callback on success or error
- `onMutate` - Callback for optimistic updates
- `retry` - Number of retry attempts
- `invalidateQueries` - Query keys to invalidate after success
- `refetchQueries` - Query keys to refetch after success

**Result:**
- `data` - The mutation result
- `error` - Error if failed
- `isIdle` - Mutation hasn't run
- `isPending` - Mutation is executing
- `isSuccess` - Mutation succeeded
- `isError` - Mutation failed
- `status` - 'idle' | 'loading' | 'success' | 'error'
- `variables` - Variables from last execution
- `failureCount` - Number of failed attempts
- `mutate(variables)` - Execute mutation (fire and forget)
- `mutateAsync(variables)` - Execute mutation (returns promise)
- `reset()` - Reset to initial state

### useQueries

Execute multiple queries in parallel.

```tsx
import { useQueries } from '@nexus-state/query/react';

function Dashboard() {
  const [user, posts, comments] = useQueries([
    {
      queryKey: 'user',
      queryFn: () => fetch('/api/user').then((r) => r.json()),
    },
    {
      queryKey: 'posts',
      queryFn: () => fetch('/api/posts').then((r) => r.json()),
    },
    {
      queryKey: 'comments',
      queryFn: () => fetch('/api/comments').then((r) => r.json()),
    },
  ]);

  if (user.isLoading || posts.isLoading || comments.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{user.data?.name}</h1>
      <p>Posts: {posts.data?.length}</p>
      <p>Comments: {comments.data?.length}</p>
    </div>
  );
}
```

### useIsFetching

Get the number of currently fetching queries.

```tsx
import { useIsFetching } from '@nexus-state/query/react';

function GlobalLoadingIndicator() {
  const isFetching = useIsFetching();

  return (
    <div>
      {isFetching > 0 && (
        <div className="loading-spinner">
          Loading {isFetching} query...
        </div>
      )}
    </div>
  );
}
```

### QueryClientProvider

Provider for sharing query client configuration.

```tsx
import { QueryClientProvider, createQueryClient } from '@nexus-state/query/react';

const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 3,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  );
}
```

### useQueryClient

Access the query client for imperative operations.

```tsx
import { useQueryClient, useInvalidateQueries } from '@nexus-state/query/react';

function RefreshButton() {
  const queryClient = useQueryClient();
  const invalidateQueries = useInvalidateQueries();

  const handleRefresh = () => {
    queryClient.invalidateQueries('users');
    invalidateQueries('posts');
  };

  return <button onClick={handleRefresh}>Refresh</button>;
}
```

## Framework-Agnostic API

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

## TypeScript

Full TypeScript support with type inference:

```tsx
interface User {
  id: number;
  name: string;
  email: string;
}

function UserComponent() {
  const { data, isLoading, error } = useQuery<User, Error>(
    'current-user',
    async () => {
      const response = await fetch('/api/user');
      return response.json();
    }
  );

  // data is typed as User | undefined
  // error is typed as Error | null
}
```

## License

MIT
