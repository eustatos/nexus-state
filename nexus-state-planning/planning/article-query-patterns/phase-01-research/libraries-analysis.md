# Анализ библиотек Data Fetching

**Дата:** Март 2026  
**Автор:** @astashkin-a  
**Статус:** ✅ Completed

---

## 📋 Содержание

1. [TanStack Query (React Query)](#1-tanstack-query-react-query)
2. [SWR](#2-swr)
3. [@nexus-state/query](#3-nexus-statequery)
4. [Apollo Client](#4-apollo-client)
5. [RTK Query](#5-rtk-query)
6. [Сравнительная матрица](#6-сравнительная-матрица)

---

## 1. TanStack Query (React Query)

**Версия:** 5.x (2026)  
**Размер:** ~13KB (gzip)  
**Лицензия:** MIT  
**Репозиторий:** https://github.com/TanStack/query

### Философия

«Don't manage state, manage async state» — разделение client state и server state.

### Ключевые возможности

- ✅ Автоматическое кэширование
- ✅ Background refetching
- ✅ Request deduplication
- ✅ Retry logic с exponential backoff
- ✅ Optimistic updates
- ✅ Pagination / Infinite queries
- ✅ Prefetching
- ✅ React Suspense
- ✅ SSR support
- ✅ DevTools

### API Overview

#### useQuery

```tsx
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }) {
  const {
    data,
    error,
    isLoading,
    isFetching,
    isStale,
    refetch,
    status, // 'idle' | 'loading' | 'success' | 'error'
  } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    },
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 минут
    retry: 3,
    retryDelay: (failureCount) => Math.min(1000 * 2 ** failureCount, 30000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    useErrorBoundary: true,
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.log('Error:', error),
  });
}
```

#### useSuspenseQuery

```tsx
import { useSuspenseQuery } from '@tanstack/react-query';

function UserProfile({ userId }) {
  const {
    data, // Всегда определён (не undefined)
    isFetching,
    isStale,
    refetch,
    remove,
  } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: fetchUser,
    staleTime: 1000 * 60 * 5,
  });
  
  return <div>{data.name}</div>;
}

// Обёртка
<Suspense fallback={<Loading />}>
  <UserProfile userId={1} />
</Suspense>
```

#### useMutation

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreatePost() {
  const queryClient = useQueryClient();
  
  const {
    data,
    error,
    isPending,
    isError,
    isSuccess,
    mutate,
    mutateAsync,
    reset,
  } = useMutation({
    mutationFn: async (post) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(post),
      });
      return response.json();
    },
    onMutate: async (newPost) => {
      await queryClient.cancelQueries(['posts']);
      const previousPosts = queryClient.getQueryData(['posts']);
      
      queryClient.setQueryData(['posts'], (old) => [...old, { ...newPost, id: Date.now() }]);
      
      return { previousPosts };
    },
    onError: (err, newPost, context) => {
      queryClient.setQueryData(['posts'], context.previousPosts);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['posts']);
    },
    onSuccess: (data) => {
      console.log('Post created:', data);
    },
  });
  
  return (
    <button onClick={() => mutate({ title: 'New Post' })}>
      Create
    </button>
  );
}
```

#### useInfiniteQuery

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';

function PostList() {
  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: async ({ pageParam }) => {
      const response = await fetch(`/api/posts?cursor=${pageParam || ''}`);
      return response.json();
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage) => firstPage.previousCursor,
    staleTime: 1000 * 60 * 5,
  });
  
  return (
    <div>
      {data.pages.map((page) => (
        <div key={page.cursor}>
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

#### useQueries

```tsx
import { useQueries } from '@tanstack/react-query';

function Dashboard() {
  const [user, posts, comments] = useQueries({
    queries: [
      { queryKey: ['user'], queryFn: fetchUser },
      { queryKey: ['posts'], queryFn: fetchPosts },
      { queryKey: ['comments'], queryFn: fetchComments },
    ],
  });
}
```

#### QueryClient API

```tsx
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Prefetch
await queryClient.prefetchQuery({
  queryKey: ['user', 1],
  queryFn: fetchUser,
  staleTime: 1000 * 60 * 5,
});

// Invalidate
queryClient.invalidateQueries(['posts']);

// Refetch
await queryClient.refetchQueries(['posts']);

// Set query data
queryClient.setQueryData(['user', 1], newData);

// Get query data
const user = queryClient.getQueryData(['user', 1]);

// Cancel query
await queryClient.cancelQueries(['user', 1]);

// Remove query
queryClient.removeQueries(['user', 1]);
```

### Конфигурация

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 минут
      gcTime: 1000 * 60 * 10,   // 10 минут (ранее cacheTime)
      retry: 3,
      retryDelay: (failureCount) => Math.min(1000 * 2 ** failureCount, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
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

### DevTools

```tsx
import { ReactQueryDevTools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <YourApp />
      <ReactQueryDevTools initialIsOpen={false} position="bottom-right" />
    </>
  );
}
```

### Преимущества

| Преимущество | Описание |
|--------------|----------|
| **Зрелость** | Самая популярная библиотека, большое комьюнити |
| **Документация** | Отличная документация с примерами |
| **Функциональность** | Все необходимые фичи из коробки |
| **TypeScript** | Полная поддержка типов |
| **Экосистема** | Интеграции с React Router, Next.js и др. |

### Недостатки

| Недостаток | Описание |
|------------|----------|
| **Размер** | ~13KB (больше конкурентов) |
| **Сложность** | Много опций, кривая обучения |
| **React-центричность** | Основная фокус на React |

---

## 2. SWR

**Версия:** 2.x (2026)  
**Размер:** ~6KB (gzip)  
**Лицензия:** MIT  
**Репозиторий:** https://github.com/vercel/swr

### Философия

«SWR» — stale-while-revalidate (HTTP cache pattern). Минимализм и простота.

### Ключевые возможности

- ✅ Stale-while-revalidate
- ✅ Automatic revalidation
- ✅ Request deduplication
- ✅ Focus revalidation
- ✅ Reconnect revalidation
- ✅ Pagination / Infinite queries
- ✅ Optimistic UI
- ✅ React Suspense
- ✅ SSR support
- ✅ Minimal API

### API Overview

#### useSWR (базовый)

```tsx
import useSWR from 'swr';

function UserProfile({ userId }) {
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(
    `/api/users/${userId}`, // key
    async (url) => {        // fetcher
      const response = await fetch(url);
      return response.json();
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 0,
      dedupingInterval: 2000,
      staleTime: 0, // По умолчанию данные stale сразу
      shouldRetryOnError: true,
      errorRetryInterval: 1000,
      errorRetryCount: 3,
      onSuccess: (data) => console.log('Success:', data),
      onError: (error) => console.log('Error:', error),
    }
  );
  
  if (error) return <div>Error: {error.message}</div>;
  if (isLoading) return <div>Loading...</div>;
  
  return <div>{data.name}</div>;
}
```

#### useSWR с Suspense

```tsx
import useSWR from 'swr';

function UserProfile({ userId }) {
  const { data } = useSWR(`/api/users/${userId}`, fetcher, {
    suspense: true,
  });
  
  return <div>{data.name}</div>;
}

// Обёртка
<Suspense fallback={<Loading />}>
  <UserProfile userId={1} />
</Suspense>
```

#### useSWRInfinite

```tsx
import useSWRInfinite from 'swr/infinite';

function PostList() {
  const {
    data,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
  } = useSWRInfinite(
    (index) => `/api/posts?page=${index + 1}&limit=10`,
    async (url) => {
      const response = await fetch(url);
      return response.json();
    },
    {
      revalidateFirstPage: false,
    }
  );
  
  const handleLoadMore = () => {
    setSize(size + 1);
  };
  
  return (
    <div>
      {data?.map((page) => (
        <div key={page.page}>
          {page.posts.map((post) => (
            <div key={post.id}>{post.title}</div>
          ))}
        </div>
      ))}
      
      <button onClick={handleLoadMore} disabled={isLoading}>
        Load More
      </button>
    </div>
  );
}
```

#### useSWRSubscription (Real-time)

```tsx
import { useSWRSubscription } from 'swr/subscription';

function LiveCounter() {
  const { data } = useSWRSubscription(
    'counter',
    (key, { next }) => {
      const channel = new BroadcastChannel('counter');
      
      channel.onmessage = (event) => {
        next(null, event.data);
      };
      
      return () => channel.close();
    }
  );
  
  return <div>Counter: {data}</div>;
}
```

#### Global Mutate

```tsx
import { mutate } from 'swr';

// Обновить конкретный key
await mutate('/api/users/1', newData);

// Обновить по префиксу
await mutate((key) => key.startsWith('/api/users'), newData);

// Optimistic update
await mutate(
  '/api/users/1',
  async (data) => {
    const response = await fetch('/api/users/1', {
      method: 'PUT',
      body: JSON.stringify(newData),
    });
    return response.json();
  },
  {
    optimisticData: { ...currentUser, ...newData },
    rollbackOnError: true,
  }
);
```

### Конфигурация

#### Глобальная

```tsx
import { SWRConfig } from 'swr';

function App() {
  return (
    <SWRConfig
      value={{
        fetcher: (url) => fetch(url).then((r) => r.json()),
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        refreshInterval: 0,
        dedupingInterval: 2000,
        staleTime: 0,
      }}
    >
      <YourApp />
    </SWRConfig>
  );
}
```

#### Хук-конфигурация

```tsx
import { useSWRConfig } from 'swr';

function Component() {
  const { cache, mutate } = useSWRConfig();
  
  // Доступ к кэшу
  console.log(cache);
  
  // Мутация
  mutate('/api/users/1', newData);
}
```

### Преимущества

| Преимущество | Описание |
|--------------|----------|
| **Минимализм** | Простой API, мало кода |
| **Размер** | ~6KB (меньше React Query) |
| **Stale-while-revalidate** | Встроенная стратегия по умолчанию |
| **Vercel backing** | Активная разработка и поддержка |

### Недостатки

| Недостаток | Описание |
|------------|----------|
| **Меньше фич** | Нет встроенных DevTools |
| **Меньше контроля** | Меньше опций для тонкой настройки |
| **React-центричность** | Только для React |

---

## 3. @nexus-state/query

**Версия:** 0.1.2 (2026)  
**Размер:** ~8KB (gzip, оценка)  
**Лицензия:** MIT  
**Репозиторий:** https://github.com/eustatos/nexus-state

### Философия

Интеграция data fetching с атомарной архитектурой Nexus State. Framework-agnostic подход с мощными DevTools.

### Ключевые возможности

- ✅ Автоматическое кэширование
- ✅ Background refetching
- ✅ Request deduplication
- ✅ Retry logic
- ✅ Optimistic updates
- ✅ Infinite queries
- ✅ React Suspense
- ✅ **Framework-agnostic** (React, Vue, Svelte, Vanilla)
- **Prefetching API** (5+ стратегий)
- **Time Travel Debugging** (интеграция с Nexus State)
- **DevTools** (встроенная панель)

### API Overview

#### useQuery (React)

```tsx
import { useQuery, QueryClientProvider, createQueryClient } from '@nexus-state/query/react';

const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 3,
    },
  },
});

function UserProfile({ userId }) {
  const {
    data,
    error,
    isLoading,
    isFetching,
    isStale,
    refetch,
    status,
  } = useQuery(
    `user-${userId}`,
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    },
    {
      enabled: true,
      staleTime: 1000 * 60 * 5,
      retry: 3,
      useErrorBoundary: true,
      onSuccess: (data) => console.log('Success:', data),
      onError: (error) => console.log('Error:', error),
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

#### useSuspenseQuery

```tsx
import { useSuspenseQuery } from '@nexus-state/query/react';

function UserProfile({ userId }) {
  const { data, refetch, isFetching, isStale, remove } = useSuspenseQuery(
    `user-${userId}`,
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    },
    {
      staleTime: 1000 * 60 * 5,
    }
  );
  
  return <div>{data.name}</div>;
}

// Обёртка
<Suspense fallback={<Loading />}>
  <UserProfile userId={1} />
</Suspense>
```

#### useMutation

```tsx
import { useMutation } from '@nexus-state/query/react';

function CreatePost() {
  const {
    data,
    error,
    isPending,
    isError,
    isSuccess,
    mutate,
    mutateAsync,
    reset,
    variables,
    failureCount,
  } = useMutation({
    mutationFn: async (post) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(post),
      });
      return response.json();
    },
    onMutate: async (newPost) => {
      // Optimistic update logic
    },
    onError: (error) => {
      console.error('Error:', error);
    },
    onSuccess: (data) => {
      console.log('Success:', data);
    },
    onSettled: () => {
      // Invalidate queries
    },
    retry: 3,
    invalidateQueries: ['posts'],
    refetchQueries: ['user'],
  });
  
  return (
    <button onClick={() => mutate({ title: 'New Post' })}>
      Create
    </button>
  );
}
```

#### useInfiniteQuery

```tsx
import { useInfiniteQuery } from '@nexus-state/query/react';

function PostList() {
  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isLoading,
    error,
    refetch,
    remove,
  } = useInfiniteQuery({
    queryKey: 'posts',
    queryFn: async ({ pageParam }) => {
      const response = await fetch(`/api/posts?cursor=${pageParam || ''}`);
      return response.json();
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage) => firstPage.previousCursor,
    staleTime: 1000 * 60 * 5,
    enabled: true,
    retry: 3,
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.log('Error:', error),
  });
  
  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map((post) => (
            <div key={post.id}>{post.title}</div>
          ))}
        </div>
      ))}
      
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

#### useQueries

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
}
```

#### useIsFetching

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

#### Prefetching API

```tsx
import { 
  prefetchQuery, 
  prefetchQueries, 
  usePrefetch, 
  usePrefetchOnHover,
  usePrefetchOnViewport,
  usePrefetchOnIdle,
  usePrefetchOnFocus,
  getPrefetchManager,
} from '@nexus-state/query/react';

// Programmatic prefetch
await prefetchQuery({
  queryKey: 'user-1',
  queryFn: () => fetch('/api/users/1').then(r => r.json()),
  staleTime: 5 * 60 * 1000,
});

await prefetchQueries([
  { queryKey: 'user', queryFn: fetchUser },
  { queryKey: 'posts', queryFn: fetchPosts },
]);

// usePrefetch hook
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

// usePrefetchOnHover
function UserLink({ userId }) {
  const { onMouseEnter, onMouseLeave } = usePrefetchOnHover({
    queryKey: `user-${userId}`,
    queryFn: () => fetchUser(userId),
    delay: 200,
  });
  
  return (
    <a href={`/users/${userId}`} {...{ onMouseEnter, onMouseLeave }}>
      View Profile
    </a>
  );
}

// usePrefetchOnViewport
function LazySection({ sectionId }) {
  const ref = usePrefetchOnViewport({
    queryKey: `section-${sectionId}`,
    queryFn: () => fetchSection(sectionId),
    threshold: 0.5,
  });
  
  return <div ref={ref}>...</div>;
}

// usePrefetchOnIdle
function Page() {
  usePrefetchOnIdle([
    { queryKey: 'user', queryFn: fetchUser },
    { queryKey: 'posts', queryFn: fetchPosts },
  ]);
  
  return <div>...</div>;
}

// usePrefetchOnFocus
function SearchInput() {
  const { onFocus } = usePrefetchOnFocus({
    queryKey: 'search-results',
    queryFn: fetchSearchResults,
    delay: 100,
  });
  
  return <input onFocus={onFocus} />;
}

// PrefetchManager API
const manager = getPrefetchManager();

await manager.prefetch({
  queryKey: 'important-data',
  queryFn: fetchImportantData,
  priority: 'high',
  timeout: 5000,
});

manager.cancel('important-data');
manager.cancelAll();

const status = manager.getPrefetchStatus('important-data');
console.log(status?.status); // 'pending' | 'success' | 'error' | 'cancelled'
```

#### QueryClientProvider

```tsx
import { QueryClientProvider, createQueryClient, useQueryClient } from '@nexus-state/query/react';

const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
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

// Access query client
function Component() {
  const queryClient = useQueryClient();
  
  // Use queryClient methods
}
```

#### Framework-Agnostic Queries

```tsx
import { createStore } from '@nexus-state/core';
import { useQuery } from '@nexus-state/query';

const store = createStore();

const userQuery = useQuery(store, {
  queryKey: 'user',
  queryFn: async () => {
    const response = await fetch('/api/user');
    return response.json();
  },
  staleTime: 1000 * 60 * 5,
});

console.log(userQuery.data);
console.log(userQuery.isLoading);
console.log(userQuery.error);

await userQuery.refetch();
```

#### DevTools

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

### Конфигурация

```tsx
const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 3,
      retryDelay: (failureCount) => Math.min(1000 * 2 ** failureCount, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      invalidateQueries: [],
      refetchQueries: [],
    },
  },
});
```

### Преимущества

| Преимущество | Описание |
|--------------|----------|
| **Framework-agnostic** | Работает с React, Vue, Svelte, Vanilla JS |
| **Prefetching API** | 5+ стратегий из коробки |
| **Time Travel** | Интеграция с DevTools Nexus State |
| **Atom-based** | Гранулярный контроль кэша |
| **Модульность** | Только необходимые зависимости |

### Недостатки

| Недостаток | Описание |
|------------|----------|
| **Молодой пакет** | Версия 0.1.2, меньше стабильности |
| **Маленькое комьюнити** | Меньше ресурсов и примеров |
| **Документация** | В разработке |

---

## 4. Apollo Client

**Версия:** 3.x (2026)  
**Размер:** ~25KB (gzip)  
**Лицензия:** MIT  
**Репозиторий:** https://github.com/apollographql/apollo-client

### Философия

GraphQL-first подход к управлению данными с мощным кэшированием и нормализацией.

### Ключевые возможности

- ✅ GraphQL кэширование
- ✅ Нормализация данных
- ✅ Optimistic UI
- ✅ Pagination
- ✅ Refetching
- ✅ SSR support
- ✅ DevTools
- ✅ Local state management

### API Overview

#### useQuery

```tsx
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_USER = gql`
  query GetUser($userId: ID!) {
    user(id: $userId) {
      id
      name
      email
    }
  }
`;

function UserProfile({ userId }) {
  const {
    loading,
    error,
    data,
    refetch,
    fetchMore,
    networkStatus,
  } = useQuery(GET_USER, {
    variables: { userId },
    fetchPolicy: 'cache-first', // cache-first, network-only, cache-and-network, no-cache
    nextFetchPolicy: 'cache-first',
    returnPartialData: true,
    skip: false,
    onCompleted: (data) => console.log('Completed:', data),
    onError: (error) => console.log('Error:', error),
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{data.user.name}</h1>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

#### useMutation

```tsx
import { useMutation } from '@apollo/client';

const CREATE_POST = gql`
  mutation CreatePost($title: String!, $content: String!) {
    createPost(title: $title, content: $content) {
      id
      title
      content
    }
  }
`;

function CreatePost() {
  const [createPost, { data, loading, error }] = useMutation(CREATE_POST, {
    variables: { title: 'New Post', content: 'Content' },
    optimisticResponse: {
      createPost: {
        id: 'temp-id',
        title: 'New Post',
        content: 'Content',
        __typename: 'Post',
      },
    },
    update: (cache, { data: { createPost } }) => {
      cache.modify({
        fields: {
          posts(existingPosts = []) {
            const newPostRef = cache.writeFragment({
              data: createPost,
              fragment: gql`
                fragment NewPost on Post {
                  id
                  title
                }
              `,
            });
            return [...existingPosts, newPostRef];
          },
        },
      });
    },
    onCompleted: (data) => console.log('Completed:', data),
    onError: (error) => console.log('Error:', error),
  });
  
  return (
    <button onClick={() => createPost()} disabled={loading}>
      Create
    </button>
  );
}
```

#### useSuspenseQuery (Experimental)

```tsx
import { useSuspenseQuery } from '@apollo/client';

function UserProfile({ userId }) {
  const { data } = useSuspenseQuery(GET_USER, {
    variables: { userId },
  });
  
  return <div>{data.user.name}</div>;
}

// Обёртка
<Suspense fallback={<Loading />}>
  <UserProfile userId={1} />
</Suspense>
```

#### Pagination (fetchMore)

```tsx
function PostList() {
  const { loading, error, data, fetchMore, hasNextPage } = useQuery(GET_POSTS, {
    variables: { first: 10, after: null },
  });
  
  const handleLoadMore = () => {
    fetchMore({
      variables: {
        after: data.posts.pageInfo.endCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        
        return {
          posts: {
            ...fetchMoreResult.posts,
            edges: [...prev.posts.edges, ...fetchMoreResult.posts.edges],
          },
        };
      },
    });
  };
  
  return (
    <div>
      {/* Render posts */}
      <button onClick={handleLoadMore} disabled={!hasNextPage}>
        Load More
      </button>
    </div>
  );
}
```

### Конфигурация

```tsx
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://api.example.com/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            keyArgs: false,
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    query: {
      fetchPolicy: 'cache-first',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

function App() {
  return (
    <ApolloProvider client={client}>
      <YourApp />
    </ApolloProvider>
  );
}
```

### Преимущества

| Преимущество | Описание |
|--------------|----------|
| **GraphQL-native** | Оптимизирован для GraphQL |
| **Нормализация** | Автоматическая дедупликация данных |
| **Мощный кэш** | Продвинутые стратегии кэширования |
| **DevTools** | Отличные инструменты отладки |

### Недостатки

| Недостаток | Описание |
|------------|----------|
| **GraphQL required** | Только для GraphQL API |
| **Размер** | ~25KB (крупнее конкурентов) |
| **Сложность** | Высокая кривая обучения |

---

## 5. RTK Query

**Версия:** 2.x (2026)  
**Размер:** ~15KB (gzip, с Redux Toolkit)  
**Лицензия:** MIT  
**Репозиторий:** https://github.com/reduxjs/redux-toolkit

### Философия

Data fetching и кэширование «из коробки» для Redux экосистемы.

### Ключевые возможности

- ✅ Автоматическое кэширование
- ✅ Инвалидация по тегам
- ✅ Optimistic updates
- ✅ Prefetching
- ✅ SSR support
- ✅ DevTools (Redux DevTools)
- ✅ Интеграция с Redux

### API Overview

#### createApi

```tsx
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Post', 'User'],
  endpoints: (builder) => ({
    getUser: builder.query({
      query: (userId) => `users/${userId}`,
      providesTags: ['User'],
    }),
    getPosts: builder.query({
      query: () => 'posts',
      providesTags: ['Post'],
    }),
    createPost: builder.mutation({
      query: (post) => ({
        url: 'posts',
        method: 'POST',
        body: post,
      }),
      invalidatesTags: ['Post'],
    }),
    updatePost: builder.mutation({
      query: ({ id, ...post }) => ({
        url: `posts/${id}`,
        method: 'PUT',
        body: post,
      }),
      invalidatesTags: ['Post'],
    }),
  }),
});

export const {
  useGetUserQuery,
  useGetPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
} = api;
```

#### Использование хуков

```tsx
function UserProfile({ userId }) {
  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGetUserQuery(userId, {
    skip: !userId,
    pollingInterval: 30000,
    refetchOnMountOrArgChange: true,
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}

function PostList() {
  const { data: posts, isLoading } = useGetPostsQuery();
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  
  return (
    <div>
      <button onClick={() => createPost({ title: 'New Post' })}>
        Create Post
      </button>
      {/* Render posts */}
    </div>
  );
}
```

#### Конфигурация store

```tsx
import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});
```

#### Provider

```tsx
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
      <YourApp />
    </Provider>
  );
}
```

### Преимущества

| Преимущество | Описание |
|--------------|----------|
| **Redux интеграция** | Бесшовная работа с Redux |
| **Auto invalidation** | Инвалидация по тегам |
| **Generated hooks** | Автоматически генерируемые хуки |
| **DevTools** | Redux DevTools из коробки |

### Недостатки

| Недостаток | Описание |
|------------|----------|
| **Redux required** | Требует Redux |
| **Размер** | ~15KB + Redux |
| **Boilerplate** | Больше кода для настройки |

---

## 6. Сравнительная матрица

### Функциональность

| Функция | TanStack Query | SWR | @nexus-state/query | Apollo Client | RTK Query |
|---------|----------------|-----|-------------------|---------------|-----------|
| **Базовые query** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Suspense** | ✅ | ✅ | ✅ | ⚠️ Exp | ❌ |
| **Infinite queries** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Mutations** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Optimistic updates** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Prefetching** | ✅ | ⚠️ Basic | ✅ Advanced | ✅ | ✅ |
| **Deduplication** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Retry logic** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **DevTools** | ✅ | ❌ | ✅ | ✅ | ✅ (Redux) |
| **Framework-agnostic** | ❌ | ❌ | ✅ | ❌ | ❌ |

### Технические характеристики

| Характеристика | TanStack Query | SWR | @nexus-state/query | Apollo Client | RTK Query |
|----------------|----------------|-----|-------------------|---------------|-----------|
| **Размер (gzip)** | ~13KB | ~6KB | ~8KB | ~25KB | ~15KB |
| **Версия** | 5.x | 2.x | 0.1.2 | 3.x | 2.x |
| **Лицензия** | MIT | MIT | MIT | MIT | MIT |
| **React 17+** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **TypeScript** | ✅ | ✅ | ✅ | ✅ | ✅ |

### DX (Developer Experience)

| Аспект | TanStack Query | SWR | @nexus-state/query | Apollo Client | RTK Query |
|--------|----------------|-----|-------------------|---------------|-----------|
| **API простота** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Документация** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Комьюнити** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Learning curve** | Средняя | Низкая | Средняя | Высокая | Средняя |

---

## 📚 Источники

1. [TanStack Query Docs](https://tanstack.com/query/latest/docs)
2. [SWR Docs](https://swr.vercel.app/)
3. [Nexus State Query Package](/packages/query/)
4. [Apollo Client Docs](https://www.apollographql.com/docs/react/)
5. [RTK Query Docs](https://redux-toolkit.js.org/rtk-query/overview)

---

## 📝 Заметки

- TanStack Query — самый зрелый и популярный выбор
- SWR — минималистичная альтернатива от Vercel
- @nexus-state/query — перспективный framework-agnostic пакет
- Apollo Client — только для GraphQL
- RTK Query — лучший выбор для Redux проектов
