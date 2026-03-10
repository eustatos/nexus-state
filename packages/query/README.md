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
>
> [![Coverage for query package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=query)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
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
- ✅ React Suspense support
- ✅ Advanced prefetching utilities
- ✅ Infinite Queries for pagination
- ✅ Built-in DevTools panel

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

### useSuspenseQuery

Hook for fetching data with React Suspense for declarative loading states.

```tsx
import { Suspense } from 'react';
import { useSuspenseQuery } from '@nexus-state/query/react';

function UserProfile({ userId }: { userId: number }) {
  // No loading check needed - Suspense handles it
  const { data, refetch } = useSuspenseQuery(
    `user-${userId}`,
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    }
  );

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}

// Wrap with Suspense boundary
function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UserProfile userId={1} />
    </Suspense>
  );
}
```

**Options:**
- `staleTime` - Time in ms before data is considered stale (default: `0`)

**Result:**
- `data` - The fetched data (never undefined when rendered)
- `error` - Always null (errors thrown to boundary)
- `isLoading` - Always false (suspends instead)
- `isSuccess` - Always true when rendered
- `isFetching` - Currently fetching in background
- `isStale` - Data is stale
- `refetch()` - Manually refetch
- `remove()` - Remove from cache

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

### Prefetching

Proactively load data for improved perceived performance.

#### Programmatic Prefetch

```tsx
import { prefetchQuery, prefetchQueries, setQueryData, getQueryData, invalidateQuery } from '@nexus-state/query/react';

// Prefetch single query
await prefetchQuery({
  queryKey: 'user-1',
  queryFn: () => fetch('/api/users/1').then(r => r.json()),
  staleTime: 5 * 60 * 1000,
});

// Prefetch multiple queries in parallel
await prefetchQueries([
  { queryKey: 'user', queryFn: fetchUser },
  { queryKey: 'posts', queryFn: fetchPosts },
  { queryKey: 'comments', queryFn: fetchComments },
]);

// Set query data manually (optimistic update)
setQueryData('user-1', { id: 1, name: 'John' });

// Get query data without suspending
const userData = getQueryData('user-1');

// Invalidate query cache
invalidateQuery('users');
```

**Functions:**
- `prefetchQuery(options)` - Prefetch single query
- `prefetchQueries(queries)` - Prefetch multiple queries in parallel
- `setQueryData(key, data)` - Set query data manually
- `getQueryData(key)` - Get query data without suspending
- `invalidateQuery(key)` - Invalidate query cache

#### usePrefetch Hook

```tsx
import { usePrefetch } from '@nexus-state/query/react';

function UserList() {
  const prefetchUser = usePrefetch();

  return (
    <div>
      {users.map(user => (
        <div
          key={user.id}
          onMouseEnter={() => prefetchUser({
            queryKey: `user-${user.id}`,
            queryFn: () => fetchUser(user.id),
            staleTime: 5 * 60 * 1000,
          })}
        >
          {user.name}
        </div>
      ))}
    </div>
  );
}
```

#### Hover Prefetch

```tsx
import { usePrefetchOnHover } from '@nexus-state/query/react';

function UserLink({ userId }) {
  const { onMouseEnter, onMouseLeave } = usePrefetchOnHover({
    queryKey: `user-${userId}`,
    queryFn: () => fetchUser(userId),
    delay: 200, // Wait 200ms before prefetching
  });

  return (
    <a href={`/users/${userId}`} {...{ onMouseEnter, onMouseLeave }}>
      View Profile
    </a>
  );
}
```

#### PrefetchLink Component

```tsx
import { PrefetchLink } from '@nexus-state/query/react';

<PrefetchLink
  href="/users/1"
  prefetch={{
    queryKey: 'user-1',
    queryFn: () => fetchUser(1),
  }}
  prefetchDelay={150}
>
  View User
</PrefetchLink>
```

#### Viewport Prefetch

```tsx
import { usePrefetchOnViewport } from '@nexus-state/query/react';

function LazySection({ sectionId }) {
  const ref = usePrefetchOnViewport({
    queryKey: `section-${sectionId}`,
    queryFn: () => fetchSection(sectionId),
    threshold: 0.5, // Prefetch when 50% visible
  });

  return <div ref={ref}>...</div>;
}
```

#### Idle Prefetch

```tsx
import { usePrefetchOnIdle } from '@nexus-state/query/react';

function Page() {
  // Prefetch when browser is idle
  usePrefetchOnIdle([
    {
      queryKey: 'user',
      queryFn: fetchUser,
    },
    {
      queryKey: 'posts',
      queryFn: fetchPosts,
    },
  ]);

  return <div>...</div>;
}
```

#### Focus Prefetch

```tsx
import { usePrefetchOnFocus } from '@nexus-state/query/react';

function SearchInput() {
  const { onFocus } = usePrefetchOnFocus({
    queryKey: 'search-results',
    queryFn: fetchSearchResults,
    delay: 100,
  });

  return <input onFocus={onFocus} />;
}
```

#### PrefetchManager API

```tsx
import { getPrefetchManager } from '@nexus-state/query';

const manager = getPrefetchManager();

// Prefetch with priority
await manager.prefetch({
  queryKey: 'important-data',
  queryFn: fetchImportantData,
  priority: 'high',
  timeout: 5000,
});

// Cancel specific prefetch
manager.cancel('important-data');

// Cancel all prefetches
manager.cancelAll();

// Get prefetch status
const status = manager.getPrefetchStatus('important-data');
console.log(status?.status); // 'pending' | 'success' | 'error' | 'cancelled'
```

### Infinite Queries

For infinite scrolling and pagination.

#### Cursor-Based Pagination

```tsx
import { useInfiniteQuery } from '@nexus-state/query/react';

interface PostsResponse {
  posts: Post[];
  nextCursor?: string;
}

function PostList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<PostsResponse, Error, string>({
    queryKey: 'posts',
    queryFn: async ({ pageParam }) => {
      const response = await fetch(`/api/posts?cursor=${pageParam}`);
      return response.json();
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading more...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

#### Offset-Based Pagination

```tsx
interface PostsResponse {
  posts: Post[];
  total: number;
}

function PostList() {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: 'posts',
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      const limit = 20;

      const response = await fetch(
        `/api/posts?offset=${offset}&limit=${limit}`
      );
      return response.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedItems = allPages.reduce((sum, page) => sum + page.posts.length, 0);
      return loadedItems < lastPage.total ? loadedItems : undefined;
    },
  });

  // ... render
}
```

#### Infinite Scroll with Intersection Observer

```tsx
import { useRef, useCallback } from 'react';

function PostList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: 'posts',
    queryFn: async ({ pageParam }) => {
      const response = await fetch(`/api/posts?cursor=${pageParam}`);
      return response.json();
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const observerRef = useRef<IntersectionObserver>();
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isFetchingNextPage) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });

    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, fetchNextPage, hasNextPage]);

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map((post, j) => {
            if (i === data.pages.length - 1 && j === page.posts.length - 1) {
              return <div ref={lastElementRef} key={post.id}>{post.title}</div>;
            }
            return <div key={post.id}>{post.title}</div>;
          })}
        </div>
      ))}
    </div>
  );
}
```

#### Bi-directional Scrolling

```tsx
const {
  data,
  fetchNextPage,
  fetchPreviousPage,
  hasNextPage,
  hasPreviousPage,
} = useInfiniteQuery({
  queryKey: 'messages',
  queryFn: async ({ pageParam }) => {
    // Fetch page
  },
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage) => firstPage.previousCursor,
});
```

**Options:**
- `queryKey` - Unique key for the infinite query
- `queryFn` - Function to fetch data for a specific page (receives `pageParam` in context)
- `initialPageParam` - The initial page parameter for the first page
- `getNextPageParam` - Function to get the next page parameter from the last page
- `getPreviousPageParam` - (Optional) Function to get the previous page parameter
- `staleTime` - Time in ms before data is considered stale
- `enabled` - Enable/disable the query
- `retry` - Number of retry attempts
- `onSuccess` - Callback on success
- `onError` - Callback on error

**Result:**
- `data` - Object with `pages` array and `pageParams` array
- `error` - Error if failed
- `isLoading` - Initial loading state
- `isSuccess` - Query succeeded
- `isError` - Query failed
- `isFetching` - Currently fetching any page
- `isFetchingNextPage` - Currently fetching the next page
- `isFetchingPreviousPage` - Currently fetching the previous page
- `hasNextPage` - Whether there is a next page available
- `hasPreviousPage` - Whether there is a previous page available
- `fetchNextPage()` - Fetch the next page
- `fetchPreviousPage()` - Fetch the previous page
- `refetch()` - Refetch all pages
- `remove()` - Remove the query from cache

### Error Boundaries

Integrate with React Error Boundaries for graceful error handling.

```tsx
import { ErrorBoundary } from 'react-error-boundary';
import { useSuspenseQuery } from '@nexus-state/query/react';

function UserProfile({ userId }: { userId: number }) {
  const { data } = useSuspenseQuery(
    `user-${userId}`,
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    }
  );

  return <div>{data.name}</div>;
}

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<Loading />}>
        <UserProfile userId={1} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### SSR Support

Server-side rendering with data prefetching.

```tsx
// Server-side prefetch (e.g., Next.js getServerSideProps)
import { prefetchQuery } from '@nexus-state/query/react';

export async function getServerSideProps() {
  await prefetchQuery({
    queryKey: 'user',
    queryFn: fetchUser,
  });

  return {
    props: {},
  };
}

// Client hydrates from cache
function Page() {
  const { data } = useSuspenseQuery('user', fetchUser);
  return <div>{data.name}</div>;
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

## DevTools

Visual debugging for queries and mutations with the built-in Query DevTools panel.

### Setup

```tsx
import { QueryDevTools } from '@nexus-state/query/react';

function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === 'development' && (
        <QueryDevTools position="bottom-right" />
      )}
    </>
  );
}
```

### Features

- **Query List**: See all active queries with their status
- **State Inspection**: View data, errors, loading states
- **Cache Control**: Invalidate, refetch, or remove queries
- **Mutation Tracking**: Monitor mutation state and variables
- **Network Timeline**: Track fetch timing and status
- **Search**: Filter queries and mutations by key

### Configuration

```tsx
<QueryDevTools
  position="bottom-right" // or 'top-left', 'top-right', 'bottom-left'
  initialIsOpen={false}
  panelPosition="bottom" // or 'left', 'right'
/>
```

### Programmatic API

```tsx
import {
  getQueryDevToolsStore,
  trackQuery,
  trackMutation,
} from '@nexus-state/query/devtools';

// Get store instance
const store = getQueryDevToolsStore();

// Manually track a query
trackQuery('my-query', {
  queryKey: 'my-query',
  status: 'success',
  data: { foo: 'bar' },
  error: null,
  dataUpdatedAt: Date.now(),
  errorUpdatedAt: 0,
  isFetching: false,
  isStale: false,
  failureCount: 0,
});

// Clear cache
store.clearCache();
```

### Production

DevTools automatically excluded in production builds when using tree-shaking.

```tsx
// Only in development
{process.env.NODE_ENV === 'development' && <QueryDevTools />}
```

## License

MIT
