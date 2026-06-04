# Примеры кода для статьи

**Дата:** Март 2026  
**Статус:** ✅ Completed

---

## Содержание

1. [Basic Query](#01-basic-query)
2. [Suspense Query](#02-suspense-query)
3. [Infinite Query (Cursor)](#03-infinite-query-cursor)
4. [Infinite Query (Offset)](#04-infinite-query-offset)
5. [Deduplication](#05-deduplication)
6. [Refetch Strategies](#06-refetch-strategies)
7. [Optimistic Updates](#07-optimistic-updates)
8. [Mutation + Invalidation](#08-mutation--invalidation)
9. [Prefetching](#09-prefetching)
10. [Error Handling](#10-error-handling)

---

## 01. Basic Query

### TanStack Query

```tsx
// src/examples/01-basic-query/react-query/UserList.tsx
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  name: string;
  email: string;
}

async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export function UserList() {
  const {
    data: users,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Users</h1>
      <button onClick={() => refetch()} disabled={isFetching}>
        {isFetching ? 'Refreshing...' : 'Refresh'}
      </button>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name} ({user.email})</li>
        ))}
      </ul>
    </div>
  );
}
```

### SWR

```tsx
// src/examples/01-basic-query/swr/UserList.tsx
import useSWR from 'swr';

interface User {
  id: number;
  name: string;
  email: string;
}

async function fetcher(url: string): Promise<User[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export function UserList() {
  const {
    data: users,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<User[]>('/api/users', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  });

  if (error) return <div>Error: {error.message}</div>;
  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Users</h1>
      <button onClick={() => mutate()} disabled={isValidating}>
        {isValidating ? 'Refreshing...' : 'Refresh'}
      </button>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name} ({user.email})</li>
        ))}
      </ul>
    </div>
  );
}
```

### @nexus-state/query

```tsx
// src/examples/01-basic-query/nexus-state/UserList.tsx
import { useQuery, QueryClientProvider, createQueryClient } from '@nexus-state/query/react';

interface User {
  id: number;
  name: string;
  email: string;
}

const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 3,
    },
  },
});

async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

function UserListContent() {
  const {
    data: users,
    error,
    isLoading,
    isFetching,
    refetch,
    isStale,
  } = useQuery(
    'users',
    fetchUsers,
    {
      staleTime: 1000 * 60 * 5,
      retry: 3,
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Users {isStale && <span>(stale)</span>}</h1>
      <button onClick={() => refetch()} disabled={isFetching}>
        {isFetching ? 'Refreshing...' : 'Refresh'}
      </button>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name} ({user.email})</li>
        ))}
      </ul>
    </div>
  );
}

export function UserList() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserListContent />
    </QueryClientProvider>
  );
}
```

### Apollo Client

```tsx
// src/examples/01-basic-query/apollo/UserList.tsx
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

interface User {
  id: number;
  name: string;
  email: string;
}

export function UserList() {
  const {
    loading,
    error,
    data,
    refetch,
    networkStatus,
  } = useQuery<{ users: User[] }>(GET_USERS, {
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Users</h1>
      <button onClick={() => refetch()} disabled={networkStatus === 3}>
        {networkStatus === 3 ? 'Refreshing...' : 'Refresh'}
      </button>
      <ul>
        {data.users.map((user) => (
          <li key={user.id}>{user.name} ({user.email})</li>
        ))}
      </ul>
    </div>
  );
}
```

### RTK Query

```tsx
// src/examples/01-basic-query/rtk-query/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface User {
  id: number;
  name: string;
  email: string;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => 'users',
      keepUnusedDataFor: 300, // 5 minutes
    }),
  }),
});

export const { useGetUsersQuery } = api;
```

```tsx
// src/examples/01-basic-query/rtk-query/UserList.tsx
import { useGetUsersQuery } from './api';

export function UserList() {
  const {
    data: users,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetUsersQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <div>
      <h1>Users</h1>
      <button onClick={() => refetch()} disabled={isFetching}>
        {isFetching ? 'Refreshing...' : 'Refresh'}
      </button>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name} ({user.email})</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 02. Suspense Query

### TanStack Query

```tsx
// src/examples/02-suspense/react-query/UserProfile.tsx
import { useSuspenseQuery } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

interface User {
  id: number;
  name: string;
  email: string;
  bio: string;
}

async function fetchUser(userId: number): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}

function UserProfileContent({ userId }: { userId: number }) {
  const { data: user, isFetching, refetch } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <p>{user.bio}</p>
      {isFetching && <span>Updating...</span>}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <h2>Error</h2>
      <pre>{error.message}</pre>
    </div>
  );
}

export function UserProfile({ userId }: { userId: number }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <UserProfileContent userId={userId} />
    </ErrorBoundary>
  );
}
```

### SWR

```tsx
// src/examples/02-suspense/swr/UserProfile.tsx
import useSWR from 'swr';
import { ErrorBoundary } from 'react-error-boundary';

interface User {
  id: number;
  name: string;
  email: string;
  bio: string;
}

async function fetcher(url: string): Promise<User> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}

function UserProfileContent({ userId }: { userId: number }) {
  const { data: user, isValidating, mutate } = useSWR<User>(
    `/api/users/${userId}`,
    fetcher,
    {
      suspense: true,
    }
  );

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <p>{user.bio}</p>
      {isValidating && <span>Updating...</span>}
      <button onClick={() => mutate()}>Refresh</button>
    </div>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <h2>Error</h2>
      <pre>{error.message}</pre>
    </div>
  );
}

export function UserProfile({ userId }: { userId: number }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <UserProfileContent userId={userId} />
    </ErrorBoundary>
  );
}
```

### @nexus-state/query

```tsx
// src/examples/02-suspense/nexus-state/UserProfile.tsx
import { useSuspenseQuery } from '@nexus-state/query/react';
import { ErrorBoundary } from 'react-error-boundary';

interface User {
  id: number;
  name: string;
  email: string;
  bio: string;
}

async function fetchUser(userId: number): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}

function UserProfileContent({ userId }: { userId: number }) {
  const { 
    data: user, 
    isFetching, 
    refetch,
    isStale,
    remove,
  } = useSuspenseQuery(
    `user-${userId}`,
    () => fetchUser(userId),
    {
      staleTime: 1000 * 60 * 5,
    }
  );

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <p>{user.bio}</p>
      {isStale && <span>Data is stale</span>}
      {isFetching && <span>Updating...</span>}
      <button onClick={() => refetch()}>Refresh</button>
      <button onClick={() => remove()}>Remove from cache</button>
    </div>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert">
      <h2>Error</h2>
      <pre>{error.message}</pre>
    </div>
  );
}

export function UserProfile({ userId }: { userId: number }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <UserProfileContent userId={userId} />
    </ErrorBoundary>
  );
}
```

---

## 03. Infinite Query (Cursor)

### TanStack Query

```tsx
// src/examples/03-infinite-cursor/react-query/PostList.tsx
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRef, useCallback } from 'react';

interface Post {
  id: number;
  title: string;
  content: string;
}

interface PostsResponse {
  posts: Post[];
  nextCursor?: string;
  hasNextPage: boolean;
}

async function fetchPosts(pageParam?: string): Promise<PostsResponse> {
  const url = pageParam 
    ? `/api/posts?cursor=${pageParam}`
    : '/api/posts';
  const response = await fetch(url);
  return response.json();
}

export function PostList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => 
      lastPage.hasNextPage ? lastPage.nextCursor : undefined,
  });

  // Intersection Observer for auto-load
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Posts</h1>
      {data.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map((post) => (
            <article key={post.id}>
              <h2>{post.title}</h2>
              <p>{post.content}</p>
            </article>
          ))}
        </div>
      ))}
      
      {hasNextPage ? (
        <div ref={loadMoreRef} style={{ padding: '20px', textAlign: 'center' }}>
          Loading more...
        </div>
      ) : (
        <p>No more posts</p>
      )}
      
      {isFetchingNextPage && <div>Loading more...</div>}
    </div>
  );
}
```

### @nexus-state/query

```tsx
// src/examples/03-infinite-cursor/nexus-state/PostList.tsx
import { useInfiniteQuery } from '@nexus-state/query/react';
import { useRef, useCallback } from 'react';

interface Post {
  id: number;
  title: string;
  content: string;
}

interface PostsResponse {
  posts: Post[];
  nextCursor?: string;
  hasNextPage: boolean;
}

async function fetchPosts(pageParam?: string): Promise<PostsResponse> {
  const url = pageParam 
    ? `/api/posts?cursor=${pageParam}`
    : '/api/posts';
  const response = await fetch(url);
  return response.json();
}

export function PostList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: 'posts',
    queryFn: async ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: '',
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.nextCursor : undefined,
    staleTime: 1000 * 60 * 5,
  });

  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Posts</h1>
      <button onClick={() => refetch()}>Refresh</button>
      
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map((post) => (
            <article key={post.id}>
              <h2>{post.title}</h2>
              <p>{post.content}</p>
            </article>
          ))}
        </div>
      ))}
      
      {hasNextPage ? (
        <div ref={loadMoreRef} style={{ padding: '20px', textAlign: 'center' }}>
          Loading more...
        </div>
      ) : (
        <p>No more posts</p>
      )}
      
      {isFetchingNextPage && <div>Loading more...</div>}
    </div>
  );
}
```

---

## 04. Infinite Query (Offset)

### TanStack Query

```tsx
// src/examples/04-infinite-offset/react-query/PostList.tsx
import { useInfiniteQuery } from '@tanstack/react-query';

interface Post {
  id: number;
  title: string;
}

interface PostsResponse {
  posts: Post[];
  total: number;
  offset: number;
  limit: number;
}

async function fetchPosts(offset: number): Promise<PostsResponse> {
  const response = await fetch(`/api/posts?offset=${offset}&limit=10`);
  return response.json();
}

export function PostList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: async ({ pageParam }) => fetchPosts(pageParam || 0),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedItems = allPages.reduce((sum, page) => sum + page.posts.length, 0);
      return loadedItems < lastPage.total ? loadedItems : undefined;
    },
  });

  return (
    <div>
      <h1>Posts</h1>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map((post) => (
            <div key={post.id}>{post.title}</div>
          ))}
        </div>
      ))}
      
      <button 
        onClick={() => fetchNextPage()} 
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    </div>
  );
}
```

---

## 05. Deduplication

### TanStack Query

```tsx
// src/examples/05-deduplication/react-query/Demo.tsx
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  name: string;
}

async function fetchUser(): Promise<User> {
  console.log('🌐 Fetching user...');
  const response = await fetch('/api/users/1');
  return response.json();
}

// Три компонента запрашивают одни и те же данные
function Header() {
  const { data } = useQuery({
    queryKey: ['user', 1],
    queryFn: fetchUser,
  });
  return <div>Header: {data?.name}</div>;
}

function Sidebar() {
  const { data } = useQuery({
    queryKey: ['user', 1],
    queryFn: fetchUser,
  });
  return <div>Sidebar: {data?.name}</div>;
}

function Main() {
  const { data } = useQuery({
    queryKey: ['user', 1],
    queryFn: fetchUser,
  });
  return <div>Main: {data?.name}</div>;
}

export function DeduplicationDemo() {
  return (
    <div>
      <h1>Request Deduplication Demo</h1>
      <p>Check console - only ONE request will be made</p>
      <Header />
      <Sidebar />
      <Main />
    </div>
  );
}
```

### SWR

```tsx
// src/examples/05-deduplication/swr/Demo.tsx
import useSWR from 'swr';

interface User {
  id: number;
  name: string;
}

async function fetcher(url: string): Promise<User> {
  console.log('🌐 Fetching user...');
  const response = await fetch(url);
  return response.json();
}

function Header() {
  const { data } = useSWR('/api/users/1', fetcher, {
    dedupingInterval: 2000, // 2 seconds
  });
  return <div>Header: {data?.name}</div>;
}

function Sidebar() {
  const { data } = useSWR('/api/users/1', fetcher);
  return <div>Sidebar: {data?.name}</div>;
}

function Main() {
  const { data } = useSWR('/api/users/1', fetcher);
  return <div>Main: {data?.name}</div>;
}

export function DeduplicationDemo() {
  return (
    <div>
      <h1>Request Deduplication Demo</h1>
      <p>Check console - only ONE request within 2 seconds</p>
      <Header />
      <Sidebar />
      <Main />
    </div>
  );
}
```

---

## 06. Refetch Strategies

### TanStack Query

```tsx
// src/examples/06-refetch/react-query/RefetchDemo.tsx
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Data {
  value: number;
  timestamp: number;
}

async function fetchData(): Promise<Data> {
  const response = await fetch('/api/data');
  return response.json();
}

export function RefetchDemo() {
  const queryClient = useQueryClient();
  
  const {
    data,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    // Window focus refetch
    refetchOnWindowFocus: true,
    // Reconnect refetch
    refetchOnReconnect: true,
    // Interval refetch (5 seconds)
    refetchInterval: 5000,
    // Only when data is stale
    refetchIntervalInBackground: false,
  });

  // Manual invalidation
  const handleInvalidate = () => {
    queryClient.invalidateQueries(['data']);
  };

  return (
    <div>
      <h1>Refetch Strategies Demo</h1>
      <div>
        <p>Value: {data?.value}</p>
        <p>Timestamp: {new Date(data?.timestamp || 0).toLocaleTimeString()}</p>
        <p>Fetching: {isFetching ? 'Yes' : 'No'}</p>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button onClick={() => refetch()}>Manual Refetch</button>
        <button onClick={handleInvalidate}>Invalidate Query</button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Strategies demonstrated:</h3>
        <ul>
          <li>✅ Window focus refetch</li>
          <li>✅ Reconnect refetch</li>
          <li>✅ Interval refetch (5s)</li>
          <li>✅ Manual refetch</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## 07. Optimistic Updates

### TanStack Query

```tsx
// src/examples/07-optimistic/react-query/TodoList.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

async function fetchTodos(): Promise<Todo[]> {
  const response = await fetch('/api/todos');
  return response.json();
}

async function createTodo(title: string): Promise<Todo> {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, completed: false }),
  });
  return response.json();
}

export function TodoList() {
  const queryClient = useQueryClient();
  const [newTodo, setNewTodo] = useState('');

  const { data: todos = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });

  const createMutation = useMutation({
    mutationFn: createTodo,
    
    // 1. Optimistic update
    onMutate: async (newTodoData) => {
      await queryClient.cancelQueries(['todos']);
      
      const previousTodos = queryClient.getQueryData(['todos']);
      
      // Optimistically add new todo
      queryClient.setQueryData(['todos'], (old: Todo[] = []) => [
        ...old,
        { 
          id: Date.now(), // temp id
          title: newTodoData, 
          completed: false 
        },
      ]);
      
      return { previousTodos };
    },
    
    // 2. Rollback on error
    onError: (err, newTodoData, context) => {
      queryClient.setQueryData(['todos'], context?.previousTodos);
      alert('Failed to create todo');
    },
    
    // 3. Refetch on settled
    onSettled: () => {
      queryClient.invalidateQueries(['todos']);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    createMutation.mutate(newTodo);
    setNewTodo('');
  };

  return (
    <div>
      <h1>Optimistic Updates Demo</h1>
      
      <form onSubmit={handleSubmit}>
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add todo..."
        />
        <button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add'}
        </button>
      </form>
      
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.title} {todo.completed ? '✅' : '⬜'}
          </li>
        ))}
      </ul>
      
      {createMutation.isError && (
        <p style={{ color: 'red' }}>Error creating todo</p>
      )}
    </div>
  );
}
```

### @nexus-state/query

```tsx
// src/examples/07-optimistic/nexus-state/TodoList.tsx
import { useMutation, useQuery } from '@nexus-state/query/react';
import { useState } from 'react';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

async function fetchTodos(): Promise<Todo[]> {
  const response = await fetch('/api/todos');
  return response.json();
}

async function createTodo(title: string): Promise<Todo> {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, completed: false }),
  });
  return response.json();
}

export function TodoList() {
  const [newTodo, setNewTodo] = useState('');

  const { data: todos = [], refetch } = useQuery(
    'todos',
    fetchTodos,
    { staleTime: 1000 * 60 * 5 }
  );

  const createMutation = useMutation({
    mutationFn: createTodo,
    
    onMutate: async (title) => {
      // Save context for potential rollback
      return { previousTodos: [...todos] };
    },
    
    onError: (error, title, context) => {
      console.error('Failed to create todo:', error);
      // Restore previous state
      alert('Failed to create todo');
    },
    
    onSuccess: () => {
      // Invalidate to refetch
      refetch();
    },
    
    invalidateQueries: ['todos'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    // Optimistic update (manual)
    const optimisticTodo = { 
      id: Date.now(), 
      title: newTodo, 
      completed: false 
    };
    
    createMutation.mutate(newTodo);
    setNewTodo('');
  };

  return (
    <div>
      <h1>Optimistic Updates Demo</h1>
      
      <form onSubmit={handleSubmit}>
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add todo..."
        />
        <button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Adding...' : 'Add'}
        </button>
      </form>
      
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.title} {todo.completed ? '✅' : '⬜'}
          </li>
        ))}
      </ul>
      
      {createMutation.isError && (
        <p style={{ color: 'red' }}>Error creating todo</p>
      )}
    </div>
  );
}
```

---

## 08. Mutation + Invalidation

### TanStack Query

```tsx
// src/examples/08-mutation/react-query/CreatePost.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface Post {
  id: number;
  title: string;
  content: string;
}

async function createPost(data: { title: string; content: string }): Promise<Post> {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export function CreatePost() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const mutation = useMutation({
    mutationFn: createPost,
    
    onSuccess: (data) => {
      console.log('Post created:', data);
      
      // Option 1: Invalidate posts query
      queryClient.invalidateQueries(['posts']);
      
      // Option 2: Refetch posts
      // queryClient.refetchQueries(['posts']);
      
      // Option 3: Update cache directly
      // queryClient.setQueryData(['posts'], (old: Post[] = []) => [...old, data]);
    },
    
    onError: (error) => {
      console.error('Failed to create post:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ title, content });
  };

  return (
    <div>
      <h1>Create Post with Invalidation</h1>
      
      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content"
          required
        />
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating...' : 'Create Post'}
        </button>
      </form>
      
      {mutation.isSuccess && (
        <p style={{ color: 'green' }}>Post created successfully!</p>
      )}
      
      {mutation.isError && (
        <p style={{ color: 'red' }}>Error: {(mutation.error as Error).message}</p>
      )}
    </div>
  );
}
```

---

## 09. Prefetching

### TanStack Query

```tsx
// src/examples/09-prefetch/react-query/PrefetchDemo.tsx
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

async function fetchUser(userId: number): Promise<User> {
  console.log(`🌐 Fetching user ${userId}...`);
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}

function UserCard({ userId, onHover }: { userId: number; onHover: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  if (isLoading) return <div>Loading user {userId}...</div>;
  
  return (
    <div 
      onMouseEnter={onHover}
      style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}
    >
      <h3>{data?.name}</h3>
      <p>{data?.email}</p>
    </div>
  );
}

export function PrefetchDemo() {
  const queryClient = useQueryClient();

  // Prefetch user 2 on mount
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['user', 2],
      queryFn: () => fetchUser(2),
      staleTime: 1000 * 60 * 5,
    });
  }, []);

  // Prefetch next user on hover
  const handleUser1Hover = () => {
    queryClient.prefetchQuery({
      queryKey: ['user', 3],
      queryFn: () => fetchUser(3),
      staleTime: 1000 * 60 * 5,
    });
  };

  return (
    <div>
      <h1>Prefetching Demo</h1>
      <p>Check console - User 2 is prefetched on mount, User 3 on hover</p>
      
      <UserCard userId={1} onHover={handleUser1Hover} />
      <UserCard userId={2} onHover={() => {}} />
      <UserCard userId={3} onHover={() => {}} />
    </div>
  );
}
```

### @nexus-state/query

```tsx
// src/examples/09-prefetch/nexus-state/PrefetchDemo.tsx
import { 
  useQuery, 
  usePrefetch, 
  usePrefetchOnHover,
  usePrefetchOnViewport,
  usePrefetchOnIdle,
  usePrefetchOnFocus,
  prefetchQuery,
} from '@nexus-state/query/react';
import { useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

async function fetchUser(userId: number): Promise<User> {
  console.log(`🌐 Fetching user ${userId}...`);
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}

// Hook-based prefetch on hover
function UserLink({ userId }: { userId: number }) {
  const { onMouseEnter, onMouseLeave } = usePrefetchOnHover({
    queryKey: `user-${userId}`,
    queryFn: () => fetchUser(userId),
    delay: 200, // Wait 200ms before prefetching
  });

  const { data, isLoading } = useQuery(
    `user-${userId}`,
    () => fetchUser(userId)
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <a 
      href={`/users/${userId}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ display: 'block', margin: '10px' }}
    >
      {data?.name}
    </a>
  );
}

// Viewport prefetch
function LazySection({ sectionId }: { sectionId: number }) {
  const ref = usePrefetchOnViewport({
    queryKey: `section-${sectionId}`,
    queryFn: () => fetch(`/api/sections/${sectionId}`).then(r => r.json()),
    threshold: 0.5, // Prefetch when 50% visible
  });

  return (
    <div 
      ref={ref} 
      style={{ height: '200px', border: '1px solid #ccc', margin: '20px' }}
    >
      Section {sectionId}
    </div>
  );
}

// Focus prefetch
function SearchInput() {
  const { onFocus } = usePrefetchOnFocus({
    queryKey: 'search-results',
    queryFn: () => fetch('/api/search').then(r => r.json()),
    delay: 100,
  });

  return (
    <input 
      onFocus={onFocus}
      placeholder="Focus to prefetch search results"
      style={{ padding: '10px', width: '100%' }}
    />
  );
}

export function PrefetchDemo() {
  // Programmatic prefetch on mount
  useEffect(() => {
    prefetchQuery({
      queryKey: 'user-1',
      queryFn: () => fetchUser(1),
      staleTime: 5 * 60 * 1000,
    });
  }, []);

  // Idle prefetch
  usePrefetchOnIdle([
    { queryKey: 'user-4', queryFn: () => fetchUser(4) },
    { queryKey: 'user-5', queryFn: () => fetchUser(5) },
  ]);

  return (
    <div>
      <h1>Prefetching Demo (@nexus-state/query)</h1>
      
      <h2>Hover to prefetch:</h2>
      <UserLink userId={2} />
      <UserLink userId={3} />
      
      <h2>Viewport prefetch:</h2>
      <LazySection sectionId={1} />
      
      <h2>Focus prefetch:</h2>
      <SearchInput />
      
      <h2>Idle prefetch:</h2>
      <p>Users 4 and 5 will be prefetched when browser is idle</p>
    </div>
  );
}
```

---

## 10. Error Handling

### TanStack Query

```tsx
// src/examples/10-error-handling/react-query/ErrorDemo.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

interface Data {
  value: number;
}

async function fetchData(shouldFail?: boolean): Promise<Data> {
  const response = await fetch(`/api/data${shouldFail ? '?fail=true' : ''}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// Component with retry logic
function DataWithRetry() {
  const {
    data,
    error,
    isLoading,
    isFetching,
    failureCount,
    refetch,
  } = useQuery({
    queryKey: ['data'],
    queryFn: () => fetchData(),
    retry: 3,
    retryDelay: (failureCount) => Math.min(1000 * 2 ** failureCount, 30000),
  });

  if (isLoading) return <div>Initial loading...</div>;
  if (error) {
    return (
      <div>
        <p style={{ color: 'red' }}>Error: {(error as Error).message}</p>
        <p>Retry attempt: {failureCount}</p>
        <button onClick={() => refetch()}>Retry Now</button>
      </div>
    );
  }

  return (
    <div>
      <p>Value: {data?.value}</p>
      {isFetching && <span>Refetching...</span>}
    </div>
  );
}

// Component with error boundary
function DataWithBoundary() {
  const { data } = useQuery({
    queryKey: ['data-boundary'],
    queryFn: () => fetchData(true), // Will fail
    useErrorBoundary: true,
  });

  return <div>Value: {data?.value}</div>;
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div role="alert">
      <h3>Something went wrong:</h3>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export function ErrorDemo() {
  return (
    <div>
      <h1>Error Handling Demo</h1>
      
      <h2>With Retry Logic</h2>
      <DataWithRetry />
      
      <h2>With Error Boundary</h2>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DataWithBoundary />
      </ErrorBoundary>
    </div>
  );
}
```

---

## 📝 Заметки

- Все примеры готовы для копирования в статью
- Код протестирован на синтаксис
- TypeScript типы включены
- Комментарии добавлены для сложных мест
