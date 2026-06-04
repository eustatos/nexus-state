# Исследование паттернов Data Fetching

**Дата:** Март 2026  
**Автор:** @astashkin-a  
**Статус:** ✅ Completed

---

## 📋 Содержание

1. [Suspense для Data Fetching](#1-suspense-для-data-fetching)
2. [Infinite Queries](#2-infinite-queries)
3. [Request Deduplication](#3-request-deduplication)
4. [Refetch Стратегии](#4-refetch-стратегии)
5. [Mutation Паттерны](#5-mutation-паттерны)
6. [Prefetching](#6-prefetching)
7. [Error Handling & Retry](#7-error-handling--retry)
8. [Cache Invalidation](#8-cache-invalidation)

---

## 1. Suspense для Data Fetching

### Что такое React Suspense

**Suspense** — это механизм React для декларативного управления асинхронными операциями, позволяющий компоненту "приостанавливать" рендеринг до готовности данных.

### Проблема, которую решает Suspense

**Без Suspense (традиционный подход):**
```tsx
function UserProfile({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(
      (user) => { setData(user); setLoading(false); },
      (err) => { setError(err); setLoading(false); }
    );
  }, [userId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  return <div>{data.name}</div>;
}
```

**Проблемы:**
- Waterfall запросов (последовательная загрузка)
- Сложность координации нескольких запросов
- Громоздкий код с множеством состояний
- Loading state в каждом компоненте

**С Suspense:**
```tsx
function UserProfile({ userId }) {
  const { data } = useSuspenseQuery(
    ['user', userId],
    () => fetchUser(userId)
  );
  return <div>{data.name}</div>;
}

// Обёртка с Boundary
<Suspense fallback={<LoadingSpinner />}>
  <UserProfile userId={1} />
</Suspense>
```

### Как работает Suspense

```
┌─────────────────────────────────────────────────────────┐
│  1. Компонент начинает рендеринг                        │
│  2. useSuspenseQuery начинает fetch                     │
│  3. Если данных нет → throw Promise                     │
│  4. Suspense Boundary ловит Promise                     │
│  5. Рендерится fallback                                 │
│  6. Promise разрешается → повторный рендер              │
│  7. Компонент рендерится с данными                      │
└─────────────────────────────────────────────────────────┘
```

### Преимущества Suspense

| Преимущество | Описание |
|--------------|----------|
| **Declarative Loading** | Не нужно управлять loading state вручную |
| **Waterfall Prevention** | Параллельная загрузка данных |
| **Coordinated Transitions** | Синхронное обновление нескольких компонентов |
| **Better UX** | Показываем UI когда всё готово, а не частями |
| **Simpler Code** | Меньше бойлерплейта с состояниями |

### Недостатки / Ограничения

| Ограничение | Описание |
|-------------|----------|
| **Error Boundaries Required** | Нужны Error Boundaries для обработки ошибок |
| **React 18+** | Полная поддержка только в React 18+ |
| **Learning Curve** | Требует понимания нового менталитета |
| **SSR Complexity** | Усложняет серверный рендеринг |

### Best Practices

```tsx
// ✅ Хорошо: Nested Suspense для постепенной загрузки
<Suspense fallback={<PageSkeleton />}>
  <ProfileSection />
  <Suspense fallback={<PostsSkeleton />}>
    <PostsSection />
  </Suspense>
</Suspense>

// ✅ Хорошо: Error Boundary + Suspense
<ErrorBoundary fallback={<ErrorFallback />}>
  <Suspense fallback={<Loading />}>
    <UserProfile />
  </Suspense>
</ErrorBoundary>

// ❌ Плохо: Suspense без Error Boundary
<Suspense fallback={<Loading />}>
  <UserProfile /> {/* Может выбросить ошибку */}
</Suspense>
```

---

## 2. Infinite Queries

### Что такое Infinite Query

Паттерн для загрузки данных с пагинацией, где пользователь может скроллить/загружать больше данных бесконечно.

### Типы пагинации

#### Cursor-based Pagination

**Описание:** Использует курсор (уникальный идентификатор) для указания позиции в наборе данных.

**Преимущества:**
- ✅ Стабильность при изменении данных
- ✅ Высокая производительность на больших наборах
- ✅ Невозможно пропустить или дублировать записи

**Недостатки:**
- ❌ Нельзя перейти к конкретной странице
- ❌ Требует поддержки со стороны API

**API Response:**
```json
{
  "data": [...],
  "nextCursor": "eyJpZCI6MTAwfQ==",
  "hasNextPage": true
}
```

**Пример реализации:**
```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: async ({ pageParam }) => {
    const response = await fetch(`/api/posts?cursor=${pageParam || ''}`);
    return response.json();
  },
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

#### Offset-based Pagination

**Описание:** Использует смещение (offset) и лимит (limit) для указания диапазона данных.

**Преимущества:**
- ✅ Прямой доступ к любой странице
- ✅ Простота реализации
- ✅ Интуитивно понятный URL (`?page=3`)

**Недостатки:**
- ❌ Производительность падает на больших offset
- ❌ Проблемы при изменении данных (дубликаты/пропуски)

**API Response:**
```json
{
  "data": [...],
  "offset": 20,
  "limit": 10,
  "total": 150,
  "hasNextPage": true
}
```

**Пример реализации:**
```tsx
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: async ({ pageParam }) => {
    const offset = (pageParam || 0) * 10;
    const response = await fetch(`/api/posts?offset=${offset}&limit=10`);
    return response.json();
  },
  initialPageParam: 0,
  getNextPageParam: (lastPage, allPages) => {
    const loadedItems = allPages.reduce((sum, page) => sum + page.data.length, 0);
    return loadedItems < lastPage.total ? allPages.length : undefined;
  },
});
```

### Сравнение подходов

| Критерий | Cursor-based | Offset-based |
|----------|--------------|--------------|
| Производительность | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Стабильность данных | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Прямой доступ к странице | ❌ | ✅ |
| Сложность реализации | Средняя | Низкая |
| Поддержка API | Требуется | Обычно есть |

### Bi-directional Scrolling

Загрузка данных в обоих направлениях (вверх и вниз).

```tsx
const {
  data,
  fetchNextPage,
  fetchPreviousPage,
  hasNextPage,
  hasPreviousPage,
} = useInfiniteQuery({
  queryKey: ['messages'],
  queryFn: async ({ pageParam }) => {
    // Fetch page
  },
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage) => firstPage.previousCursor,
});
```

### Intersection Observer для автоскролла

```tsx
function PostList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({...});
  
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
            const isLast = i === data.pages.length - 1 && j === page.posts.length - 1;
            return (
              <div key={post.id} ref={isLast ? lastElementRef : null}>
                {post.title}
              </div>
            );
          })}
        </div>
      ))}
      {isFetchingNextPage && <div>Loading more...</div>}
    </div>
  );
}
```

---

## 3. Request Deduplication

### Что такое Deduplication

Автоматическое объединение нескольких одинаковых запросов в один для предотвращения дублирования сетевых вызовов.

### Проблема без Deduplication

```tsx
// Три компонента запрашивают одни и те же данные
function App() {
  return (
    <>
      <Header />    {/* fetchUser(1) */}
      <Sidebar />   {/* fetchUser(1) */}
      <Main />      {/* fetchUser(1) */}
    </>
  );
}
// Результат: 3 одинаковых запроса к API ❌
```

### Как работает Deduplication

```
Время 0ms:   Компонент A → useQuery('user-1') → [Запрос отправлен]
Время 10ms:  Компонент B → useQuery('user-1') → [Ждёт тот же запрос]
Время 15ms:  Компонент C → useQuery('user-1') → [Ждёт тот же запрос]
Время 100ms: Ответ получен → [Все 3 компонента получают данные]
```

### Реализация в библиотеках

#### TanStack Query
```tsx
// Встроенная дедупликация в окне 100ms
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 минут
    },
  },
});
```

#### SWR
```tsx
// dedupingInterval по умолчанию 2000ms
useSWR('user-1', fetcher, {
  dedupingInterval: 2000, // 2 секунды
});
```

#### @nexus-state/query
```tsx
// Дедупликация через request-tracker
import { createRequestTracker } from '@nexus-state/query';

const requestTracker = createRequestTracker({
  deduplicationWindow: 100, // 100ms
});
```

### Преимущества Deduplication

| Преимущество | Описание |
|--------------|----------|
| **Снижение нагрузки** | Меньше запросов к серверу |
| **Экономия трафика** | Меньше переданных данных |
| **Улучшение UX** | Быстрая загрузка для всех компонентов |
| **Предотвращение Race Conditions** | Гарантированный порядок ответов |

### Best Practices

```tsx
// ✅ Хорошо: Стабильные query keys
useQuery(['user', userId], fetchUser);

// ❌ Плохо: Нестабильные query keys
useQuery(['user', Date.now()], fetchUser); // Новый запрос каждый рендер

// ✅ Хорошо: Нормализация ключей
const queryKey = ['posts', { sort, filter }].flat();

// ❌ Плохо: Разные объекты в ключе
useQuery(['posts', { sort: 'asc' }], fetchPosts);
useQuery(['posts', { sort: 'asc' }], fetchPosts); // Разные ссылки!
```

---

## 4. Refetch Стратегии

### Обзор стратегий

| Стратегия | Когда | Приоритет |
|-----------|-------|-----------|
| **On Window Focus** | Пользователь вернулся на вкладку | 🔴 High |
| **On Reconnect** | Восстановление соединения | 🔴 High |
| **Interval** | Периодическое обновление | 🟡 Medium |
| **On Mount** | При монтировании компонента | 🟡 Medium |
| **Manual** | По явному вызову | 🟢 Low |

### On Window Focus

**Зачем:** Пользователь мог уйти на другую вкладку, данные устарели.

```tsx
// TanStack Query
useQuery(['posts'], fetchPosts, {
  refetchOnWindowFocus: true, // По умолчанию true
  staleTime: 1000 * 60 * 5,   // 5 минут
});

// SWR
useSWR('posts', fetcher, {
  revalidateOnFocus: true,
  focusThrottleInterval: 1000, // 1 секунда
});

// @nexus-state/query
useQuery(store, {
  queryKey: 'posts',
  queryFn: fetchPosts,
  refetchOnWindowFocus: true,
});
```

### On Reconnect

**Зачем:** Сетевое соединение прерывалось, данные могли устареть.

```tsx
// TanStack Query
useQuery(['posts'], fetchPosts, {
  refetchOnReconnect: true, // По умолчанию true
});

// SWR
useSWR('posts', fetcher, {
  revalidateOnReconnect: true,
});
```

### Interval Refetch

**Зачем:** Данные должны обновляться периодически (дашборды, тикеты).

```tsx
// TanStack Query
useQuery(['ticker'], fetchTicker, {
  refetchInterval: 5000, // 5 секунд
  refetchIntervalInBackground: false, // Только на переднем плане
});

// SWR
useSWR('ticker', fetcher, {
  refreshInterval: 5000,
  dedupingInterval: 1000,
});
```

### Conditional Refetch

**Зачем:** Обновлять только при выполнении условия.

```tsx
// TanStack Query
useQuery(['posts'], fetchPosts, {
  refetchOnWindowFocus: (query) => {
    const state = query.state;
    return state.dataUpdatedAt < Date.now() - 1000 * 60; // Старше 1 минуты
  },
});

// SWR
useSWR('posts', fetcher, {
  revalidateOnFocus: () => {
    return document.visibilityState === 'visible';
  },
});
```

### Manual Refetch

**Зачем:** Обновление по действию пользователя.

```tsx
function PostsList() {
  const { data, refetch, isFetching } = useQuery(['posts'], fetchPosts);
  
  return (
    <div>
      <button onClick={() => refetch()} disabled={isFetching}>
        {isFetching ? 'Loading...' : 'Refresh'}
      </button>
      {/* ... */}
    </div>
  );
}
```

### Сравнение стратегий

| Стратегия | Частота | Нагрузка | Актуальность |
|-----------|---------|----------|--------------|
| Window Focus | Средняя | Низкая | Хорошая |
| Reconnect | Низкая | Низкая | Хорошая |
| Interval | Высокая | Высокая | Отличная |
| Manual | Контроль | Минимальная | Зависит |

---

## 5. Mutation Паттерны

### Что такое Mutation

Изменение данных на сервере (CREATE, UPDATE, DELETE операции).

### Базовый паттерн

```tsx
// TanStack Query
const mutation = useMutation({
  mutationFn: (newPost) => fetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify(newPost),
  }),
  onSuccess: (data) => {
    console.log('Post created:', data);
  },
  onError: (error) => {
    console.error('Error:', error);
  },
});

// Использование
mutation.mutate({ title: 'New Post', content: '...' });
```

### Optimistic Updates

**Зачем:** Мгновенный отклик UI без ожидания сервера.

```tsx
const mutation = useMutation({
  mutationFn: updateTodo,
  
  // 1. Сохраняем контекст для rollback
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries(['todos']);
    
    const previousTodos = queryClient.getQueryData(['todos']);
    
    // 2. Оптимистичное обновление
    queryClient.setQueryData(['todos'], (old) => [
      ...old,
      { ...newTodo, id: Date.now() },
    ]);
    
    return { previousTodos };
  },
  
  // 3. Rollback при ошибке
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previousTodos);
  },
  
  // 4. Инвалидация после успеха
  onSettled: () => {
    queryClient.invalidateQueries(['todos']);
  },
});
```

### Mutation с Invalidation

```tsx
const createPost = useMutation({
  mutationFn: createPostApi,
  
  onSuccess: () => {
    // Инвалидировать все запросы posts
    queryClient.invalidateQueries(['posts']);
  },
});

const updatePost = useMutation({
  mutationFn: updatePostApi,
  
  onSuccess: (data, variables) => {
    // Инвалидировать конкретный пост
    queryClient.invalidateQueries(['posts', variables.id]);
  },
});
```

### Mutation с Refetch

```tsx
const deletePost = useMutation({
  mutationFn: deletePostApi,
  
  onSuccess: () => {
    // Refetch всех постов
    queryClient.refetchQueries(['posts']);
  },
});
```

### Parallel Mutations

```tsx
const mutation1 = useMutation({ mutationFn: api1 });
const mutation2 = useMutation({ mutationFn: api2 });

// Параллельное выполнение
await Promise.all([
  mutation1.mutateAsync(data1),
  mutation2.mutateAsync(data2),
]);
```

### Sequential Mutations

```tsx
const createUser = useMutation({ mutationFn: createUserApi });
const createProfile = useMutation({ mutationFn: createProfileApi });

// Последовательное выполнение
const user = await createUser.mutateAsync(userData);
await createProfile.mutateAsync({ ...profileData, userId: user.id });
```

### Сравнение подходов

| Подход | UX | Сложность | Риск |
|--------|-----|-----------|------|
| **Optimistic** | ⭐⭐⭐⭐⭐ | Средняя | Rollback |
| **Wait for Server** | ⭐⭐⭐ | Низкая | Нет |
| **Disabled State** | ⭐⭐ | Низкая | Нет |

---

## 6. Prefetching

### Что такое Prefetching

Предварительная загрузка данных до того, как они понадобятся пользователю.

### Стратегии Prefetching

#### On Hover

```tsx
// TanStack Query
function UserLink({ userId }) {
  const queryClient = useQueryClient();
  
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId),
      staleTime: 1000 * 60, // 1 минута
    });
  };
  
  return (
    <a 
      href={`/users/${userId}`}
      onMouseEnter={handleMouseEnter}
    >
      View Profile
    </a>
  );
}

// @nexus-state/query
import { usePrefetchOnHover } from '@nexus-state/query/react';

function UserLink({ userId }) {
  const { onMouseEnter, onMouseLeave } = usePrefetchOnHover({
    queryKey: `user-${userId}`,
    queryFn: () => fetchUser(userId),
    delay: 200, // Ждать 200ms перед prefetch
  });
  
  return (
    <a href={`/users/${userId}`} {...{ onMouseEnter, onMouseLeave }}>
      View Profile
    </a>
  );
}
```

#### On Viewport (Intersection Observer)

```tsx
// @nexus-state/query
import { usePrefetchOnViewport } from '@nexus-state/query/react';

function LazySection({ sectionId }) {
  const ref = usePrefetchOnViewport({
    queryKey: `section-${sectionId}`,
    queryFn: () => fetchSection(sectionId),
    threshold: 0.5, // Prefetch когда 50% видим
  });
  
  return <div ref={ref}>...</div>;
}
```

#### On Idle (requestIdleCallback)

```tsx
// @nexus-state/query
import { usePrefetchOnIdle } from '@nexus-state/query/react';

function Dashboard() {
  usePrefetchOnIdle([
    { queryKey: 'user', queryFn: fetchUser },
    { queryKey: 'posts', queryFn: fetchPosts },
  ]);
  
  return <div>...</div>;
}
```

#### On Focus

```tsx
// @nexus-state/query
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

#### Programmatic Prefetch

```tsx
// TanStack Query
const queryClient = useQueryClient();

// Prefetch single
await queryClient.prefetchQuery({
  queryKey: ['user', 1],
  queryFn: () => fetchUser(1),
  staleTime: 1000 * 60 * 5,
});

// Prefetch multiple
await Promise.all([
  queryClient.prefetchQuery({ queryKey: ['user'], queryFn: fetchUser }),
  queryClient.prefetchQuery({ queryKey: ['posts'], queryFn: fetchPosts }),
  queryClient.prefetchQuery({ queryKey: ['comments'], queryFn: fetchComments }),
]);

// @nexus-state/query
import { prefetchQuery, prefetchQueries } from '@nexus-state/query/react';

await prefetchQuery({
  queryKey: 'user-1',
  queryFn: () => fetch('/api/users/1').then(r => r.json()),
  staleTime: 5 * 60 * 1000,
});

await prefetchQueries([
  { queryKey: 'user', queryFn: fetchUser },
  { queryKey: 'posts', queryFn: fetchPosts },
]);
```

#### PrefetchManager API

```tsx
// @nexus-state/query
import { getPrefetchManager } from '@nexus-state/query';

const manager = getPrefetchManager();

// Prefetch с приоритетом
await manager.prefetch({
  queryKey: 'important-data',
  queryFn: fetchImportantData,
  priority: 'high',
  timeout: 5000,
});

// Отменить prefetch
manager.cancel('important-data');

// Отменить все
manager.cancelAll();

// Получить статус
const status = manager.getPrefetchStatus('important-data');
console.log(status?.status); // 'pending' | 'success' | 'error' | 'cancelled'
```

### Сравнение стратегий

| Стратегия | Trigger | latency | Network Impact |
|-----------|---------|---------|----------------|
| **On Hover** | Mouse Enter | ~100-300ms | Низкий |
| **On Viewport** | Visible | ~200-500ms | Средний |
| **On Idle** | Browser Idle | ~1-5s | Минимальный |
| **On Focus** | Input Focus | ~50-200ms | Низкий |
| **Programmatic** | Code | Immediate | Контроль |

---

## 7. Error Handling & Retry

### Базовая обработка ошибок

```tsx
// TanStack Query
const { error, isError } = useQuery(['posts'], fetchPosts);

if (isError) {
  return <ErrorDisplay error={error} />;
}
```

### Error Boundaries

```tsx
import { ErrorBoundary } from 'react-error-boundary';
import { useSuspenseQuery } from '@nexus-state/query/react';

function UserProfile({ userId }) {
  const { data } = useSuspenseQuery(
    ['user', userId],
    () => fetchUser(userId),
    { useErrorBoundary: true }
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

### Retry Logic

```tsx
// TanStack Query
useQuery(['posts'], fetchPosts, {
  retry: 3, // Количество попыток
  retryDelay: (failureCount) => Math.min(1000 * 2 ** failureCount, 30000),
  // retryDelay: 1000, 2000, 4000, 8000... (exponential backoff)
});

// SWR
useSWR('posts', fetcher, {
  shouldRetryOnError: true,
  errorRetryInterval: 1000,
  errorRetryCount: 3,
});
```

### Conditional Retry

```tsx
useQuery(['posts'], fetchPosts, {
  retry: (failureCount, error) => {
    // Не retry для 4xx ошибок
    if (error.status === 404) return false;
    // Retry для 5xx и network ошибок
    return failureCount < 3;
  },
});
```

### Fallback UI

```tsx
function PostsList() {
  const { data, error, isLoading } = useQuery(['posts'], fetchPosts);
  
  if (isLoading) return <LoadingSkeleton />;
  if (error) return <EmptyState onRetry={() => refetch()} />;
  if (!data) return <EmptyState />;
  
  return <PostsGrid posts={data} />;
}
```

### Error Notifications

```tsx
const mutation = useMutation({
  mutationFn: createPost,
  onError: (error) => {
    toast.error(`Failed to create post: ${error.message}`);
  },
  onSuccess: () => {
    toast.success('Post created successfully!');
  },
});
```

### Best Practices

```tsx
// ✅ Хорошо: Специфичные error messages
if (error?.status === 404) {
  return <NotFound />;
} else if (error?.status === 403) {
  return <AccessDenied />;
} else {
  return <GenericError />;
}

// ❌ Плохо: Generic error для всего
if (error) {
  return <div>Something went wrong</div>;
}
```

---

## 8. Cache Invalidation

### Стратегии инвалидации

#### Time-based (TTL)

```tsx
// TanStack Query
useQuery(['posts'], fetchPosts, {
  staleTime: 1000 * 60 * 5, // 5 минут
  gcTime: 1000 * 60 * 10,   // 10 минут до удаления из кэша
});
```

#### Manual Invalidation

```tsx
// TanStack Query
const queryClient = useQueryClient();

queryClient.invalidateQueries(['posts']);
queryClient.invalidateQueries(['posts', postId]);
queryClient.invalidateQueries({ queryKey: ['posts'], exact: true });
```

#### Tag-based Invalidation

```tsx
// TanStack Query v5
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
});

// Определение тегов
const postsQuery = {
  queryKey: ['posts'],
  queryFn: fetchPosts,
};

// Инвалидация по тегу
queryClient.invalidateQueries({ queryKey: ['posts'] });
```

#### Optimistic Invalidation

```tsx
const mutation = useMutation({
  mutationFn: updatePost,
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['posts']);
    
    const previousData = queryClient.getQueryData(['posts']);
    
    queryClient.setQueryData(['posts'], (old) => 
      old.map(post => post.id === newData.id ? newData : post)
    );
    
    return { previousData };
  },
  onSettled: () => {
    queryClient.invalidateQueries(['posts']);
  },
});
```

### Сравнение стратегий

| Стратегия | Актуальность | Нагрузка | Сложность |
|-----------|--------------|----------|-----------|
| **Time-based** | Средняя | Низкая | Низкая |
| **Manual** | Высокая | Средняя | Средняя |
| **Tag-based** | Высокая | Средняя | Средняя |
| **Optimistic** | Отличная | Высокая | Высокая |

---

## 📚 Источники

1. [React Suspense Documentation](https://react.dev/reference/react/Suspense)
2. [TanStack Query Documentation](https://tanstack.com/query/latest/docs)
3. [SWR Documentation](https://swr.vercel.app/)
4. [Patterns.dev](https://www.patterns.dev/)
5. [Nexus State Query Package](/packages/query/)

---

## 📝 Заметки

- Suspense требует React 18+ для полной поддержки
- Deduplication window: TanStack Query (100ms), SWR (2000ms)
- Cursor-based pagination предпочтительнее для больших данных
- Optimistic updates улучшают UX, но требуют rollback логики
