# Сравнительные таблицы библиотек Data Fetching

**Дата:** Март 2026  
**Статус:** ✅ Completed

---

## 1. API Comparison: Basic Query

| Аспект | TanStack Query | SWR | @nexus-state/query | Apollo Client | RTK Query |
|--------|----------------|-----|-------------------|---------------|-----------|
| **Hook** | `useQuery(options)` | `useSWR(key, fetcher, options)` | `useQuery(key, queryFn, options)` | `useQuery(gql, options)` | `useGetXxxQuery(args)` |
| **Key format** | `['user', userId]` | `'/api/users/1'` | `'user-1'` | `GET_USER` (gql) | Auto-generated |
| **Return: data** | `T \| undefined` | `T \| undefined` | `T \| undefined` | `T \| undefined` | `T \| undefined` |
| **Return: error** | `Error \| null` | `Error \| undefined` | `Error \| null` | `ApolloError` | `Error \| undefined` |
| **Return: loading** | `isLoading` | `isLoading` | `isLoading` | `loading` | `isLoading` |
| **Return: fetching** | `isFetching` | `isValidating` | `isFetching` | `networkStatus` | `isFetching` |
| **Return: refetch** | `refetch()` | `mutate()` | `refetch()` | `refetch()` | `refetch()` |
| **Status enum** | `'idle' \| 'loading' \| 'success' \| 'error'` | — | `'idle' \| 'loading' \| 'success' \| 'error'` | `networkStatus` | — |

### Примеры кода

**TanStack Query:**
```tsx
const { data, error, isLoading, refetch } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});
```

**SWR:**
```tsx
const { data, error, isLoading, mutate } = useSWR(
  `/api/users/${userId}`,
  () => fetchUser(userId)
);
```

**@nexus-state/query:**
```tsx
const { data, error, isLoading, refetch } = useQuery(
  `user-${userId}`,
  () => fetchUser(userId)
);
```

**Apollo Client:**
```tsx
const { data, error, loading, refetch } = useQuery(GET_USER, {
  variables: { userId },
});
```

**RTK Query:**
```tsx
const { data, error, isLoading, refetch } = useGetUserQuery(userId);
```

---

## 2. API Comparison: Suspense

| Аспект | TanStack Query | SWR | @nexus-state/query | Apollo Client | RTK Query |
|--------|----------------|-----|-------------------|---------------|-----------|
| **Hook** | `useSuspenseQuery(options)` | `useSWR(key, fetcher, { suspense: true })` | `useSuspenseQuery(key, queryFn, options)` | `useSuspenseQuery(gql, options)` | ❌ |
| **data** | `T` (всегда определён) | `T` | `T` (всегда определён) | `T` | — |
| **error** | `null` (throw to boundary) | — | `null` (throw to boundary) | — | — |
| **isLoading** | `false` (suspend вместо) | — | `false` (suspend вместо) | — | — |
| **refetch** | `refetch()` | `mutate()` | `refetch()` | `refetch()` | — |
| **remove** | `remove()` | — | `remove()` | — | — |

### Примеры кода

**TanStack Query:**
```tsx
const { data, refetch } = useSuspenseQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});
```

**SWR:**
```tsx
const { data } = useSWR(`/api/users/${userId}`, fetcher, {
  suspense: true,
});
```

**@nexus-state/query:**
```tsx
const { data, refetch } = useSuspenseQuery(
  `user-${userId}`,
  () => fetchUser(userId)
);
```

---

## 3. API Comparison: Infinite Query

| Аспект | TanStack Query | SWR | @nexus-state/query | Apollo Client | RTK Query |
|--------|----------------|-----|-------------------|---------------|-----------|
| **Hook** | `useInfiniteQuery(options)` | `useSWRInfinite(getKey, fetcher)` | `useInfiniteQuery(options)` | `useQuery + fetchMore` | `useGetXxxQuery` + pagination |
| **pageParam** | `pageParam` в `queryFn` | `index` в `getKey` | `pageParam` в `queryFn` | `variables` | Auto |
| **Initial param** | `initialPageParam` | — | `initialPageParam` | `variables` | — |
| **Next page** | `getNextPageParam(lastPage)` | — | `getNextPageParam(lastPage)` | `fetchMore()` | `fetchMore()` |
| **Prev page** | `getPreviousPageParam(firstPage)` | — | `getPreviousPageParam(firstPage)` | — | — |
| **Fetch next** | `fetchNextPage()` | `setSize(size + 1)` | `fetchNextPage()` | `fetchMore()` | `fetchMore()` |
| **Fetch prev** | `fetchPreviousPage()` | — | `fetchPreviousPage()` | — | — |
| **Has next** | `hasNextPage` | — | `hasNextPage` | `hasNextPage` | — |
| **Has prev** | `hasPreviousPage` | — | `hasPreviousPage` | — | — |
| **Fetching next** | `isFetchingNextPage` | — | `isFetchingNextPage` | — | — |

### Примеры кода

**TanStack Query:**
```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: async ({ pageParam }) => fetchPosts(pageParam),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

**SWR:**
```tsx
const { data, size, setSize } = useSWRInfinite(
  (index) => `/api/posts?page=${index}`,
  fetcher
);
```

**@nexus-state/query:**
```tsx
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: 'posts',
  queryFn: async ({ pageParam }) => fetchPosts(pageParam),
  initialPageParam: '',
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

---

## 4. API Comparison: Mutation

| Аспект | TanStack Query | SWR | @nexus-state/query | Apollo Client | RTK Query |
|--------|----------------|-----|-------------------|---------------|-----------|
| **Hook** | `useMutation(options)` | — | `useMutation(options)` | `useMutation(gql)` | `useXxxMutation()` |
| **mutationFn** | `mutationFn` | — | `mutationFn` | В gql | Auto |
| **Execute** | `mutate(vars)` / `mutateAsync(vars)` | `mutate(key, data)` | `mutate(vars)` / `mutateAsync(vars)` | `mutate({ vars })` | `mutate(vars)` |
| **State: pending** | `isPending` | — | `isPending` | `loading` | `isLoading` |
| **State: success** | `isSuccess` | — | `isSuccess` | — | — |
| **State: error** | `isError` | — | `isError` | `error` | `isError` |
| **onMutate** | ✅ (context) | — | ✅ | — | — |
| **onSuccess** | ✅ | — | ✅ | ✅ | — |
| **onError** | ✅ | — | ✅ | ✅ | — |
| **onSettled** | ✅ | — | ✅ | — | — |
| **Optimistic** | `onMutate + setQueryData` | `mutate(optimisticData)` | `onMutate` | `optimisticResponse` | — |
| **Invalidate** | `invalidateQueries()` | `mutate(key)` | `invalidateQueries` | `refetch()` | `invalidatesTags` |

### Примеры кода

**TanStack Query:**
```tsx
const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: () => queryClient.invalidateQueries(['posts']),
});
mutation.mutate({ title: 'New Post' });
```

**SWR:**
```tsx
const { data, mutate } = useSWR('/api/posts', fetcher);
await mutate('/api/posts', createPost(newData), {
  optimisticData: [...data, newData],
});
```

**@nexus-state/query:**
```tsx
const mutation = useMutation({
  mutationFn: createPost,
  invalidateQueries: ['posts'],
});
mutation.mutate({ title: 'New Post' });
```

**Apollo Client:**
```tsx
const [createPost] = useMutation(CREATE_POST, {
  optimisticResponse: { ... },
  update: (cache, { data }) => { ... },
});
createPost({ variables: { title: 'New Post' } });
```

**RTK Query:**
```tsx
const [createPost] = useCreatePostMutation();
await createPost({ title: 'New Post' });
```

---

## 5. API Comparison: Prefetching

| Аспект | TanStack Query | SWR | @nexus-state/query | Apollo Client | RTK Query |
|--------|----------------|-----|-------------------|---------------|-----------|
| **Programmatic** | `queryClient.prefetchQuery()` | `mutate(key, fetcher)` | `prefetchQuery()` | `client.query()` | `api.endpoints.Xxx.initiate()` |
| **On hover** | Manual | Manual | `usePrefetchOnHover()` | Manual | Manual |
| **On viewport** | Manual | Manual | `usePrefetchOnViewport()` | Manual | Manual |
| **On idle** | Manual | Manual | `usePrefetchOnIdle()` | Manual | Manual |
| **On focus** | Manual | Manual | `usePrefetchOnFocus()` | Manual | Manual |
| **PrefetchManager** | — | — | `getPrefetchManager()` | — | — |
| **Priority** | — | — | ✅ | — | — |
| **Cancel** | `cancelQueries()` | — | `manager.cancel()` | — | — |

### Примеры кода

**TanStack Query:**
```tsx
await queryClient.prefetchQuery({
  queryKey: ['user', 1],
  queryFn: fetchUser,
  staleTime: 1000 * 60 * 5,
});
```

**SWR:**
```tsx
await mutate('/api/users/1', fetchUser('/api/users/1'), {
  revalidate: false,
});
```

**@nexus-state/query:**
```tsx
await prefetchQuery({
  queryKey: 'user-1',
  queryFn: fetchUser,
  staleTime: 5 * 60 * 1000,
});

// Hooks
const { onMouseEnter } = usePrefetchOnHover({
  queryKey: 'user-1',
  queryFn: fetchUser,
  delay: 200,
});
```

---

## 6. API Comparison: Refetch Strategies

| Стратегия | TanStack Query | SWR | @nexus-state/query | Apollo Client | RTK Query |
|-----------|----------------|-----|-------------------|---------------|-----------|
| **On mount** | По умолчанию | По умолчанию | По умолчанию | По умолчанию | По умолчанию |
| **On window focus** | `refetchOnWindowFocus: true` | `revalidateOnFocus: true` | `refetchOnWindowFocus: true` | ❌ | `refetchOnMountOrArgChange` |
| **On reconnect** | `refetchOnReconnect: true` | `revalidateOnReconnect: true` | `refetchOnReconnect: true` | ❌ | ❌ |
| **Interval** | `refetchInterval: number` | `refreshInterval: number` | `refetchInterval: number` | `pollingInterval` | `pollingInterval` |
| **Conditional** | `refetchOnWindowFocus: (query) => boolean` | `revalidateOnFocus: () => boolean` | ✅ | ❌ | ❌ |
| **Manual** | `refetch()` | `mutate()` | `refetch()` | `refetch()` | `refetch()` |

---

## 7. API Comparison: Cache Configuration

| Опция | TanStack Query | SWR | @nexus-state/query | Apollo Client | RTK Query |
|-------|----------------|-----|-------------------|---------------|-----------|
| **Stale time** | `staleTime` | `staleTime: 0` | `staleTime` | `fetchPolicy` | `keepUnusedDataFor` |
| **Cache time** | `gcTime` | — | — | — | `keepUnusedDataFor` |
| **Deduping** | 100ms (встроен) | `dedupingInterval: 2000` | — | — | — |
| **Retry count** | `retry: 3` | `errorRetryCount: 3` | `retry: 3` | `errorPolicy` | — |
| **Retry delay** | `retryDelay: (count) => ms` | `errorRetryInterval: 1000` | `retryDelay` | — | — |

---

## 8. Bundle Size Comparison

| Библиотека | Размер (min) | Размер (gzip) | Dependencies |
|------------|--------------|---------------|--------------|
| **TanStack Query** | ~45KB | ~13KB | React |
| **SWR** | ~15KB | ~6KB | React |
| **@nexus-state/query** | ~25KB | ~8KB | @nexus-state/core, @nexus-state/react |
| **Apollo Client** | ~80KB | ~25KB | GraphQL, React |
| **RTK Query** | ~45KB | ~15KB | Redux Toolkit |

### Визуализация

```
SWR:              ██████ 6KB
@nexus-state:     ████████ 8KB
TanStack Query:   █████████████ 13KB
RTK Query:        ███████████████ 15KB
Apollo Client:    █████████████████████████ 25KB
```

---

## 9. Features Matrix

| Функция | TanStack Query | SWR | @nexus-state/query | Apollo Client | RTK Query |
|---------|----------------|-----|-------------------|---------------|-----------|
| **Basic queries** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Suspense** | ✅ | ✅ | ✅ | ⚠️ Experimental | ❌ |
| **Infinite queries** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Mutations** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Optimistic updates** | ✅ | ✅ | ✅ | ✅ | ⚠️ Limited |
| **Prefetching** | ✅ Basic | ⚠️ Manual | ✅ Advanced | ✅ | ✅ |
| **Request deduplication** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Retry logic** | ✅ | ✅ | ✅ | ✅ | ⚠️ Limited |
| **Window focus refetch** | ✅ | ✅ | ✅ | ❌ | ⚠️ Partial |
| **Reconnect refetch** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Interval refetch** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Query invalidation** | ✅ | ⚠️ Manual | ✅ | ✅ | ✅ Auto |
| **DevTools** | ✅ | ❌ | ✅ | ✅ | ✅ (Redux) |
| **TypeScript** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **SSR support** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Framework-agnostic** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **GraphQL specific** | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 10. Decision Guide

| Use Case | Recommended | Why |
|----------|-------------|-----|
| **React + REST API** | TanStack Query | Зрелость, документация, комьюнити |
| **React + минимализм** | SWR | Простой API, маленький размер |
| **Multi-framework** | @nexus-state/query | React, Vue, Svelte, Vanilla |
| **GraphQL проект** | Apollo Client | GraphQL-native, нормализация |
| **Redux проект** | RTK Query | Бесшовная интеграция |
| **Advanced prefetching** | @nexus-state/query | 5+ стратегий из коробки |
| **DevTools важны** | TanStack Query / @nexus-state/query | Встроенные панели |
| **Маленький bundle** | SWR | ~6KB gzip |
| **Time Travel debugging** | @nexus-state/query | Интеграция с Nexus State |

---

## 11. Learning Curve Comparison

| Уровень | TanStack Query | SWR | @nexus-state/query | Apollo Client | RTK Query |
|---------|----------------|-----|-------------------|---------------|-----------|
| **Beginner** | 2-3 дня | 1 день | 2-3 дня | 5-7 дней | 3-5 дней |
| **Intermediate** | 1 неделя | 2-3 дня | 1 неделя | 2 недели | 1-2 недели |
| **Advanced** | 2-3 недели | 1 неделя | 2-3 недели | 1 месяц | 2-3 недели |

### Сложность концепций

| Концепция | TanStack Query | SWR | @nexus-state/query | Apollo Client | RTK Query |
|-----------|----------------|-----|-------------------|---------------|-----------|
| **Базовый query** | 🟢 Easy | 🟢 Easy | 🟢 Easy | 🟡 Medium | 🟡 Medium |
| **Suspense** | 🟡 Medium | 🟢 Easy | 🟡 Medium | 🔴 Hard | ❌ N/A |
| **Infinite query** | 🟡 Medium | 🟡 Medium | 🟡 Medium | 🔴 Hard | 🟢 Easy |
| **Mutations** | 🟢 Easy | 🟡 Medium | 🟢 Easy | 🟡 Medium | 🟢 Easy |
| **Optimistic updates** | 🟡 Medium | 🟡 Medium | 🟡 Medium | 🔴 Hard | 🟢 Easy |
| **Cache invalidation** | 🟡 Medium | 🔴 Hard | 🟢 Easy | 🔴 Hard | 🟢 Easy |

---

## 📝 Заметки

- TanStack Query имеет самый богатый API
- SWR самый простой для начала
- @nexus-state/query уникален prefetching hooks
- Apollo Client требует знания GraphQL
- RTK Query требует Redux
