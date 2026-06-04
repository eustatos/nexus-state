---
title: "Паттерны управления серверным состоянием: Средний уровень (Часть 2/5)"
published: false
description: "Background Refetching, обработка ошибок, мутации, infinite queries и стратегии prefetching"
tags: react, javascript, webdev, tutorial
series: "Query Patterns"
canonical_url: null
cover_image: null
---

# Паттерны управления серверным состоянием: Средний уровень

> **Серия статей:** Часть 2 из 5  
> **Уровень:** Средний  
> **Время чтения:** ~12 минут

## 📋 Содержание серии

1. Основы — Server vs Client State, Query Caching, Deduplication
2. **Средний уровень** (эта статья) — Background Refetching, Error Handling, Mutations
3. Продвинутый уровень — Optimistic Updates, React Suspense, Anti-patterns
4. Сравнение библиотек (часть 1) — TanStack Query, SWR, @nexus-state/query
5. Сравнение библиотек (часть 2) — Apollo Client, RTK Query, выбор решения

---

## 🎯 Введение

В первой части мы изучили базовые концепции: разницу между server и client state, кэширование и дедупликацию запросов. Теперь переходим к более продвинутым паттернам, которые делают приложения отзывчивыми и надёжными.

В этой статье:
- Background Refetching — автоматическое обновление данных
- Error Handling & Retry — обработка ошибок и повторные попытки
- Mutations & Invalidation — изменение данных на сервере
- Infinite Queries — бесконечная пагинация
- Prefetching Strategies — предзагрузка данных

---

## 1. Background Refetching

### 1.1. Window Focus refetch

**Зачем:** Пользователь переключился на другую вкладку → данные могли устареть. При возврате нужно обновить.

**Реализация:**

```tsx
// TanStack Query
useQuery(['posts'], fetchPosts, {
  refetchOnWindowFocus: true, // По умолчанию true
});

// SWR
useSWR('posts', fetcher, {
  revalidateOnFocus: true,
  focusThrottleInterval: 1000, // Throttle 1 секунда
});

// @nexus-state/query
useQuery('posts', fetchPosts, {
  refetchOnWindowFocus: true,
});
```

**Когда отключать:**
- ❌ Данные редко меняются (статичные справочники)
- ❌ Пользователь часто переключает вкладки (раздражает)
- ❌ Есть более эффективный способ обновления (WebSocket)

### 1.2. Reconnect refetch

**Зачем:** Сетевое соединение прерывалось → данные могли устареть.

```tsx
useQuery(['posts'], fetchPosts, {
  refetchOnReconnect: true, // По умолчанию true
});
```

**Важно:**
- Работает только online → offline → online
- Не путать с window focus
- Критично для мобильных приложений

### 1.3. Interval refetch

**Зачем:** Данные должны обновляться периодически (дашборды, тикеры).

```tsx
useQuery(['ticker'], fetchTicker, {
  refetchInterval: 5000, // 5 секунд
  refetchIntervalInBackground: false, // Только на переднем плане
});
```

**Use cases:**

| Сценарий | Интервал | Примечания |
|----------|----------|------------|
| Дашборд метрик | 30-60 сек | Не слишком часто |
| Тикер акций | 5-10 сек | Баланс UX/нагрузка |
| Чат | 1-2 сек | Лучше WebSocket |
| Статус заказа | 10-30 сек | Критично актуально |
| Погода | 5-15 мин | Медленные изменения |

### 1.4. Conditional refetch

**Кастомная логика:**

```tsx
useQuery(['posts'], fetchPosts, {
  refetchOnWindowFocus: (query) => {
    const state = query.state;
    return state.dataUpdatedAt < Date.now() - 1000 * 60;
    // Refetch только если данные старше 1 минуты
  },
});
```

**Пример: refetch только если есть изменения:**

```tsx
refetchOnWindowFocus: () => {
  return document.visibilityState === 'visible' && hasUnsavedChanges;
}
```

---

## 2. Error Handling & Retry

### 2.1. Базовая обработка

```tsx
const { error, isError } = useQuery(['posts'], fetchPosts);

if (isError) {
  return <ErrorDisplay error={error} />;
}
```

**Типы ошибок:**

| Тип | Описание | Пример |
|-----|----------|--------|
| **Network errors** | Нет соединения | Offline, DNS failure |
| **HTTP errors** | 4xx, 5xx ответы | 404 Not Found, 500 Server Error |
| **Parse errors** | Неверный формат | JSON parse failed |
| **Timeout errors** | Превышено время | Request timeout |

### 2.2. Retry logic

**Exponential backoff:**

```tsx
useQuery(['posts'], fetchPosts, {
  retry: 3,
  retryDelay: (failureCount) => Math.min(1000 * 2 ** failureCount, 30000),
  // 1s, 2s, 4s, 8s... (max 30s)
});
```

**Conditional retry:**

```tsx
retry: (failureCount, error) => {
  if (error.status === 404) return false; // Не retry для 404
  if (error.status === 403) return false; // Не retry для 403
  return failureCount < 3; // Retry для network/5xx
}
```

**Рекомендации:**
- ✅ Не retry для 4xx ошибок (клиентская ошибка)
- ✅ Retry для network errors и 5xx
- ✅ Максимум 3-5 попыток
- ✅ Exponential delay для снижения нагрузки

### 2.3. Error Boundaries

```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <Suspense fallback={<Loading />}>
    <UserProfile />
  </Suspense>
</ErrorBoundary>
```

**Fallback компонент:**

```tsx
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h3>Что-то пошло не так</h3>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Попробовать снова</button>
    </div>
  );
}
```

**Когда использовать:**
- ✅ Критичные компоненты (без них UI не работает)
- ✅ Suspense компоненты (ошибки выбрасываются)
- ✅ Границы функциональности (изолировать сбои)

### 2.4. Fallback UI

**Градуированные fallback:**

```tsx
if (isLoading) return <LoadingSkeleton />;
if (error) return <EmptyState onRetry={() => refetch()} />;
if (!data) return <EmptyState />;
return <DataView data={data} />;
```

**Примеры fallback UI:**

| Состояние | UI |
|-----------|-----|
| Loading | Skeleton, spinner |
| Error | Error message + retry button |
| Empty | Empty state illustration |
| Stale | Data + «stale» indicator |

---

## 3. Mutations & Invalidation

### 3.1. Что такое Mutation

**Определение:** Изменение данных на сервере (CREATE, UPDATE, DELETE).

**Типы:**

| Тип | HTTP метод | Пример |
|-----|------------|--------|
| **CREATE** | POST | Создать пост |
| **UPDATE** | PUT/PATCH | Обновить профиль |
| **DELETE** | DELETE | Удалить комментарий |

**State machine:**

```
idle → loading → success
              → error
```

### 3.2. Базовый паттерн

```tsx
const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: (data) => {
    console.log('Post created:', data);
  },
  onError: (error) => {
    console.error('Error:', error);
  },
});

mutation.mutate({ title: 'New Post' });
```

**Результат мутации:**

```tsx
{
  data: undefined,      // Результат мутации
  error: null,          // Ошибка
  isIdle: true,         // Не started
  isPending: false,     // В процессе
  isSuccess: false,     // Успех
  isError: false,       // Ошибка
  mutate: (vars) => {}, // Запустить (fire and forget)
  mutateAsync: (vars) => {}, // Запустить (returns Promise)
}
```

### 3.3. Invalidation стратегий

**После мутации:**

| Стратегия | Когда | Пример |
|-----------|-------|--------|
| **Invalidate** | Данные изменились | `invalidateQueries(['posts'])` |
| **Refetch** | Нужны свежие | `refetchQueries(['posts'])` |
| **Update cache** | Известен результат | `setQueryData(['posts'], ...)` |
| **Ничего** | Данные не изменились | — |

**Пример:**

```tsx
const createPost = useMutation({
  mutationFn: createPostApi,
  onSuccess: () => {
    // Вариант 1: Инвалидация
    queryClient.invalidateQueries(['posts']);

    // Вариант 2: Refetch
    queryClient.refetchQueries(['posts']);

    // Вариант 3: Обновление кэша
    queryClient.setQueryData(['posts'], (old) => [...old, newPost]);
  },
});
```

### 3.4. Dependent queries

**Цепочка зависимостей:**

```tsx
const createUser = useMutation({
  mutationFn: createUserApi,
  onSuccess: (user) => {
    // Инвалидировать список пользователей
    queryClient.invalidateQueries(['users']);

    // Prefetch детали созданного пользователя
    queryClient.prefetchQuery(['user', user.id], () => fetchUser(user.id));
  },
});
```

**Параллельные мутации:**

```tsx
await Promise.all([
  mutation1.mutateAsync(data1),
  mutation2.mutateAsync(data2),
]);
```

**Последовательные мутации:**

```tsx
const user = await createUser.mutateAsync(userData);
await createProfile.mutateAsync({ ...profileData, userId: user.id });
```

---

## 4. Infinite Queries

### 4.1. Что такое Infinite Query

**Определение:** Паттерн для загрузки данных с пагинацией, где пользователь может скроллить бесконечно.

**Use cases:**
- 📱 Социальные ленты
- 💬 Комментарии
- 🔍 Поисковые результаты
- 🛒 Каталоги товаров

### 4.2. Cursor-based Pagination

**Описание:** Использует курсор (уникальный идентификатор) для указания позиции.

**API Response:**

```json
{
  "data": [...],
  "nextCursor": "eyJpZCI6MTAwfQ==",
  "hasNextPage": true
}
```

**Преимущества:**
- ✅ Стабильность при изменении данных
- ✅ Высокая производительность
- ✅ Невозможно пропустить/дублировать

**Недостатки:**
- ❌ Нельзя перейти к конкретной странице
- ❌ Требует поддержки API

**Пример реализации:**

```tsx
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: async ({ pageParam }) => {
    const response = await fetch(`/api/posts?cursor=${pageParam || ''}`);
    return response.json();
  },
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

### 4.3. Offset-based Pagination

**Описание:** Использует смещение (offset) и лимит (limit).

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

**Преимущества:**
- ✅ Прямой доступ к любой странице
- ✅ Простота реализации
- ✅ Интуитивный URL (`?page=3`)

**Недостатки:**
- ❌ Производительность падает на больших offset
- ❌ Проблемы при изменении данных (дубликаты/пропуски)

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
    const loaded = allPages.reduce((sum, page) => sum + page.data.length, 0);
    return loaded < lastPage.total ? allPages.length : undefined;
  },
});
```

### 4.4. Сравнение подходов

| Критерий | Cursor-based | Offset-based |
|----------|--------------|--------------|
| Производительность | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Стабильность данных | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Прямой доступ к странице | ❌ | ✅ |
| Сложность реализации | Средняя | Низкая |
| Поддержка API | Требуется | Обычно есть |

**Рекомендация:**
- Cursor-based для больших данных (>10K записей)
- Offset-based для маленьких наборов и админок

### 4.5. Intersection Observer для автоскролла

```tsx
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
  <div ref={lastElementRef}>
    Load More
  </div>
);
```

---

## 5. Prefetching Strategies

### 5.1. Что такое Prefetching

**Определение:** Предварительная загрузка данных до того, как они понадобятся.

**Цель:** Улучшение perceived performance (данные уже готовы).

**Риски:**
- ⚠️ Лишняя нагрузка на сеть
- ⚠️ Загрузка ненужных данных
- ⚠️ Батарея (мобильные)

### 5.2. On Hover prefetch

**Зачем:** Пользователь навёл курсор → вероятно кликнет.

```tsx
const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 1000 * 60,
  });
};
```

**Задержка:** 100-300ms для предотвращения ложных срабатываний

**Use cases:**
- Ссылки в списке
- Кнопки действий
- Карточки товаров

### 5.3. On Viewport prefetch

**Зачем:** Контент скоро станет видимым.

```tsx
const ref = usePrefetchOnViewport({
  queryKey: `section-${sectionId}`,
  queryFn: () => fetchSection(sectionId),
  threshold: 0.5, // 50% видимости
});
```

**Use cases:**
- Ленивая загрузка секций
- Infinite scroll
- Карусели

### 5.4. On Idle prefetch

**Зачем:** Использовать простое время браузера.

```tsx
usePrefetchOnIdle([
  { queryKey: 'user', queryFn: fetchUser },
  { queryKey: 'posts', queryFn: fetchPosts },
]);
```

**Преимущество:** Минимальное влияние на UX.

### 5.5. On Focus prefetch

**Зачем:** Пользователь сфокусировался на элементе → вероятно взаимодействует.

```tsx
const { onFocus } = usePrefetchOnFocus({
  queryKey: 'search-results',
  queryFn: fetchSearchResults,
  delay: 100,
});

<input onFocus={onFocus} />
```

### 5.6. Сравнение стратегий

| Стратегия | Latency | Network Impact | Рекомендация |
|-----------|---------|----------------|--------------|
| **On Hover** | ~100-300ms | Низкий | Ссылки, кнопки |
| **On Viewport** | ~200-500ms | Средний | Секции, карточки |
| **On Idle** | ~1-5s | Минимальный | Фоновые данные |
| **On Focus** | ~50-200ms | Низкий | Формы, input |
| **Programmatic** | Immediate | Контроль | Предсказуемые сценарии |

---

## 🎓 Выводы

В этой статье мы изучили паттерны среднего уровня:

1. **Background Refetching** — автоматическое обновление данных
2. **Error Handling & Retry** — надёжная обработка ошибок
3. **Mutations & Invalidation** — изменение данных и синхронизация кэша
4. **Infinite Queries** — бесконечная пагинация
5. **Prefetching** — предзагрузка для улучшения UX

### Что дальше?

В следующей статье мы рассмотрим продвинутый уровень:
- Optimistic Updates
- React Suspense интеграция
- Anti-patterns и как их избежать

---

## 📚 Полезные ссылки

- [Exponential Backoff Algorithm](https://en.wikipedia.org/wiki/Exponential_backoff)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Cursor vs Offset Pagination](https://www.sitepoint.com/paginating-real-time-data-cursor-based-pagination/)

---

**Понравилась статья?** Поставьте ❤️ и подпишитесь на серию!

**Вопросы?** Пишите в комментариях! 👇
