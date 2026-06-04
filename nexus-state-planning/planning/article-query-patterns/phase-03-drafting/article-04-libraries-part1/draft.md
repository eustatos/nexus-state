---
title: "Сравнение библиотек Data Fetching: TanStack Query, SWR, @nexus-state/query (Часть 4/5)"
published: false
description: "Детальное сравнение TanStack Query, SWR и @nexus-state/query: функциональность, API, размер, DX"
tags: react, javascript, webdev, tutorial
series: "Query Patterns"
canonical_url: null
cover_image: null
---

# Сравнение библиотек Data Fetching: Часть 1

> **Серия статей:** Часть 4 из 5  
> **Уровень:** Практический  
> **Время чтения:** ~15 минут

## 📋 Содержание серии

1. Основы — Server vs Client State, Query Caching, Deduplication
2. Средний уровень — Background Refetching, Error Handling, Mutations
3. Продвинутый уровень — Optimistic Updates, React Suspense, Anti-patterns
4. **Сравнение библиотек (часть 1)** (эта статья) — TanStack Query, SWR, @nexus-state/query
5. Сравнение библиотек (часть 2) — Apollo Client, RTK Query, выбор решения

---

## 🎯 Введение

В предыдущих частях мы изучили паттерны управления серверным состоянием. Теперь переходим к практике: сравним популярные библиотеки и поможем выбрать подходящую для вашего проекта.

### Методология сравнения

Эта статья использует **гибридный подход**:

| Компонент | Доля | Описание |
|-----------|------|----------|
| **Факты** | 70% | Объективные данные: API, размер, фичи, версии |
| **Контекст** | 20% | Когда подходит / когда не подходит |
| **Оценка автора** | 10% | Субъективное мнение с дисклеймером |

### ⚠️ Дисклеймеры

- **Субъективность:** DX оценка может варьироваться
- **Версии:** Актуально на Q1 2026
- **Предвзятость:** Авторы используют @nexus-state/query в своих проектах

---

## 📊 Быстрое сравнение

| Библиотека | Размер | Learning Curve | Best For |
|------------|--------|----------------|----------|
| TanStack Query | ~13KB | Средняя | Универсальный выбор |
| SWR | ~6KB | Низкая | Минимализм |
| @nexus-state/query | ~8KB | Средняя | Multi-framework |

### Функциональность

| Функция | TanStack | SWR | @nexus-state |
|---------|----------|-----|--------------|
| Basic queries | ✅ | ✅ | ✅ |
| Suspense | ✅ | ✅ | ✅ |
| Infinite queries | ✅ | ✅ | ✅ |
| Mutations | ✅ | ✅ | ✅ |
| Optimistic updates | ✅ | ✅ | ✅ |
| Prefetching | ✅ | ⚠️ | ✅ |
| DevTools | ✅ | ❌ | ✅ |
| Framework-agnostic | ❌ | ❌ | ✅ |

### Технические характеристики

| Характеристика | TanStack | SWR | @nexus-state |
|----------------|----------|-----|--------------|
| Размер (gzip) | ~13KB | ~6KB | ~8KB |
| Версия | 5.x | 2.x | 0.1.2 |
| TypeScript | ✅ | ✅ | ✅ |
| React 17+ | ✅ | ✅ | ✅ |
| SSR support | ✅ | ✅ | ✅ |

---

## 1. TanStack Query (React Query)

### 1.1. Обзор

**Факты:**

| Характеристика | Значение |
|----------------|----------|
| **Текущая версия** | 5.x (Q1 2026) |
| **Размер** | ~13KB (gzip) |
| **Фреймворки** | React только |
| **Лицензия** | MIT |
| **Недельные загрузки** | ~2.5M (npm) |

**Философия:** "Don't manage state, manage async state"

**Ключевые фичи:**
- Автоматическое кэширование и инвалидация
- Background refetching (window focus, reconnect, interval)
- Request deduplication
- Retry logic с exponential backoff
- Optimistic updates
- Infinite queries и pagination
- Prefetching
- React Suspense интеграция
- SSR support
- DevTools

**Когда подходит:**
- ✅ Универсальный React проект
- ✅ Нужна максимальная функциональность
- ✅ Важна документация и комьюнити
- ✅ Enterprise проект с долгосрочной поддержкой

**Когда не подходит:**
- ❌ Multi-framework проект (только React)
- ❌ Критичен размер bundle (~13KB)
- ❌ Нужен минималистичный API

**Оценка автора (субъективно):**

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| **Функциональность** | ⭐⭐⭐⭐⭐ | Все фичи из коробки |
| **Документация** | ⭐⭐⭐⭐⭐ | Одна из лучших в экосистеме |
| **DX** | ⭐⭐⭐⭐ | Много опций, кривая обучения |
| **Производительность** | ⭐⭐⭐⭐ | Хорошая, но не лучшая в классе |
| **Комьюнити** | ⭐⭐⭐⭐⭐ | Огромное, активное |

**По нашему опыту:** TanStack Query — безопасный выбор для большинства React-проектов. Если не знаете что выбрать — выбирайте его.

### 1.2. Установка и настройка

```bash
npm install @tanstack/react-query
```

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 3,
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

### 1.3. API для каждого паттерна

**Basic Query:**
```tsx
const { data, error, isLoading, refetch } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  staleTime: 1000 * 60 * 5,
  retry: 3,
});
```

**Suspense Query:**
```tsx
const { data } = useSuspenseQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});

// В обёртке
<Suspense fallback={<Loading />}>
  <UserProfile userId={1} />
</Suspense>
```

**Infinite Query:**
```tsx
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: async ({ pageParam }) => fetchPosts(pageParam),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

**Mutation:**
```tsx
const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: () => queryClient.invalidateQueries(['posts']),
  onMutate: async (newPost) => {
    // Optimistic update
  },
});
```

**Prefetching:**
```tsx
await queryClient.prefetchQuery({
  queryKey: ['user', 1],
  queryFn: fetchUser,
  staleTime: 1000 * 60 * 5,
});
```

### 1.4. DevTools

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

**Возможности DevTools:**
- Просмотр кэша
- Инвалидация query
- Инспекция мутаций
- Фильтрация

### 1.5. Продвинутые техники

**Query cancellation:**
```tsx
const query = useQuery({
  queryKey: ['todos'],
  queryFn: async ({ signal }) => {
    const response = await fetch('/api/todos', { signal });
    return response.json();
  },
});

// Отмена
queryClient.cancelQueries(['todos']);
```

**Optimistic updates:**
```tsx
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries(['todos']);
    const previous = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo]);
    return { previous };
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(['todos'], context.previous);
  },
});
```

### 1.6. Плюсы и минусы

| Плюсы | Минусы |
|-------|--------|
| ✅ Полная функциональность | ❌ Размер ~13KB |
| ✅ Отличная документация | ❌ Сложность для новичков |
| ✅ Большое комьюнити | ❌ React-центричный |
| ✅ DevTools | ❌ Много опций |
| ✅ TypeScript support | ❌ Кривая обучения |

**Оценка:** ⭐⭐⭐⭐⭐ (5/5)

---

## 2. SWR

### 2.1. Обзор

**Факты:**

| Характеристика | Значение |
|----------------|----------|
| **Текущая версия** | 2.x (Q1 2026) |
| **Размер** | ~6KB (gzip) |
| **Фреймворки** | React только |
| **Лицензия** | MIT |
| **Недельные загрузки** | ~1.8M (npm) |
| **Разработчик** | Vercel |

**Философия:** "Stale-while-revalidate" — минимализм и простота.

**Ключевые фичи:**
- Stale-while-revalidate по умолчанию
- Automatic revalidation (focus, reconnect)
- Request deduplication
- Optimistic UI updates
- Infinite queries (useSWRInfinite)
- Real-time subscription (useSWRSubscription)
- React Suspense интеграция
- SSR support

**Когда подходит:**
- ✅ Минимализм и простота важны
- ✅ Критичен размер bundle (~6KB)
- ✅ Простые сценарии data fetching
- ✅ Уже используете Vercel/Next.js

**Когда не подходит:**
- ❌ Нужны продвинутые фичи (prefetching, retry control)
- ❌ Multi-framework проект
- ❌ Нужен тонкий контроль над кэшированием

**Оценка автора (субъективно):**

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| **Функциональность** | ⭐⭐⭐⭐ | Базовые фичи есть, продвинутых меньше |
| **Документация** | ⭐⭐⭐⭐ | Хорошая, но меньше примеров |
| **DX** | ⭐⭐⭐⭐⭐ | Простой API, низкая кривая обучения |
| **Производительность** | ⭐⭐⭐⭐⭐ | Минимальный оверхед |
| **Комьюнити** | ⭐⭐⭐⭐ | Большое, поддержка Vercel |

**По нашему опыту:** SWR — отличный выбор для проектов, где важна простота. Если TanStack Query кажется избыточным — попробуйте SWR.

### 2.2. Установка и настройка

```bash
npm install swr
```

```tsx
import { SWRConfig } from 'swr';

function App() {
  return (
    <SWRConfig
      value={{
        fetcher: (url) => fetch(url).then((r) => r.json()),
        revalidateOnFocus: true,
        dedupingInterval: 2000,
      }}
    >
      <YourApp />
    </SWRConfig>
  );
}
```

### 2.3. API для каждого паттерна

**Basic Query:**
```tsx
const { data, error, isLoading, mutate } = useSWR(
  '/api/users',
  fetcher,
  {
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  }
);
```

**Suspense Query:**
```tsx
const { data } = useSWR('/api/user/1', fetcher, {
  suspense: true,
});

// В обёртке
<Suspense fallback={<Loading />}>
  <UserProfile />
</Suspense>
```

**Infinite Query:**
```tsx
const { data, size, setSize } = useSWRInfinite(
  (index) => `/api/posts?page=${index}`,
  fetcher
);

// Load more
setSize(size + 1);
```

**Optimistic Update:**
```tsx
await mutate(
  '/api/todos',
  async (data) => {
    const response = await fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(newTodo),
    });
    return response.json();
  },
  {
    optimisticData: [...data, newTodo],
    rollbackOnError: true,
  }
);
```

### 2.4. Особенности

**Глобальная мутация:**
```tsx
import { mutate } from 'swr';

// Обновить по ключу
await mutate('/api/users/1', newData);

// Обновить по префиксу
await mutate(
  (key) => key.startsWith('/api/users'),
  newData
);
```

**Subscription (real-time):**
```tsx
import { useSWRSubscription } from 'swr/subscription';

const { data } = useSWRSubscription(
  'counter',
  (key, { next }) => {
    const channel = new BroadcastChannel('counter');
    channel.onmessage = (event) => next(null, event.data);
    return () => channel.close();
  }
);
```

### 2.5. Плюсы и минусы

| Плюсы | Минусы |
|-------|--------|
| ✅ Минимальный размер (~6KB) | ❌ Меньше фич |
| ✅ Простой API | ❌ Нет DevTools |
| ✅ Stale-while-revalidate по умолчанию | ❌ Меньше контроля |
| ✅ Vercel backing | ❌ Только React |
| ✅ Хорошая документация | ❌ Ограниченные prefetching |

**Оценка:** ⭐⭐⭐⭐ (4/5)

---

## 3. @nexus-state/query

### 3.1. Обзор

**Факты:**

| Характеристика | Значение |
|----------------|----------|
| **Текущая версия** | 0.1.2 (Q1 2026) |
| **Размер** | ~8KB (gzip, оценка) |
| **Фреймворки** | React, Vue, Svelte, Vanilla JS |
| **Лицензия** | MIT |
| **Статус** | Beta / ранний релиз |

**Философия:** Интеграция data fetching с атомарной архитектурой Nexus State. Framework-agnostic подход.

**Ключевые фичи:**
- Framework-agnostic (единый API для всех фреймворков)
- Prefetching API (5+ стратегий: hover, viewport, idle, focus, programmatic)
- PrefetchManager API с приоритетами
- Time Travel Debugging (интеграция с Nexus State)
- Встроенные DevTools
- Atom-based architecture
- Request deduplication
- Retry logic
- Infinite queries
- Optimistic updates

**Когда подходит:**
- ✅ Multi-framework проект (React + Vue + Svelte)
- ✅ Нужны продвинутые prefetching стратегии
- ✅ Используется Nexus State
- ✅ Важен Time Travel debugging
- ✅ Хотите единый API для всех фреймворков

**Когда не подходит:**
- ❌ Нужна максимальная зрелость (пакет в beta)
- ❌ Критично большое комьюнити и поддержка
- ❌ Только React проект (лучше TanStack/SWR)

**Оценка автора (субъективно):**

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| **Функциональность** | ⭐⭐⭐⭐ | Все базовые фичи + уникальные prefetch hooks |
| **Документация** | ⭐⭐⭐ | В разработке, меньше примеров |
| **DX** | ⭐⭐⭐⭐ | Простой API, но меньше готовых решений |
| **Производительность** | ⭐⭐⭐⭐ | Хорошая, модульная архитектура |
| **Комьюнити** | ⭐⭐ | Маленькое, растущее |
| **Перспективность** | ⭐⭐⭐⭐⭐ | Уникальные фичи, framework-agnostic |

**По нашему опыту:** @nexus-state/query — перспективный выбор для multi-framework проектов. Если начинаете новый проект с нуля и хотите framework-agnostic решение — стоит рассмотреть.

**⚠️ Дисклеймер:** Авторы этой статьи используют @nexus-state/query в своих проектах и могут быть предвзяты.

### 3.2. Установка и настройка

```bash
npm install @nexus-state/query @nexus-state/react
```

```tsx
import { QueryClientProvider, createQueryClient } from '@nexus-state/query/react';

const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 3,
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

### 3.3. API для каждого паттерна

**Basic Query:**
```tsx
const { data, error, isLoading, refetch } = useQuery(
  'users',
  fetchUsers,
  {
    staleTime: 1000 * 60 * 5,
    retry: 3,
  }
);
```

**Suspense Query:**
```tsx
const { data, refetch, isStale, remove } = useSuspenseQuery(
  `user-${userId}`,
  () => fetchUser(userId),
  {
    staleTime: 1000 * 60 * 5,
  }
);
```

**Infinite Query:**
```tsx
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: 'posts',
  queryFn: async ({ pageParam }) => fetchPosts(pageParam),
  initialPageParam: '',
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

**Mutation:**
```tsx
const mutation = useMutation({
  mutationFn: createPost,
  invalidateQueries: ['posts'],
  onSuccess: (data) => console.log('Success:', data),
});
```

**Prefetching Hooks (уникальная фича!):**
```tsx
// On Hover
const { onMouseEnter, onMouseLeave } = usePrefetchOnHover({
  queryKey: `user-${userId}`,
  queryFn: () => fetchUser(userId),
  delay: 200,
});

// On Viewport
const ref = usePrefetchOnViewport({
  queryKey: `section-${sectionId}`,
  queryFn: () => fetchSection(sectionId),
  threshold: 0.5,
});

// On Idle
usePrefetchOnIdle([
  { queryKey: 'user', queryFn: fetchUser },
  { queryKey: 'posts', queryFn: fetchPosts },
]);

// On Focus
const { onFocus } = usePrefetchOnFocus({
  queryKey: 'search-results',
  queryFn: fetchSearchResults,
  delay: 100,
});
```

**PrefetchManager API:**
```tsx
import { getPrefetchManager } from '@nexus-state/query';

const manager = getPrefetchManager();

await manager.prefetch({
  queryKey: 'important-data',
  queryFn: fetchImportantData,
  priority: 'high',
  timeout: 5000,
});

manager.cancel('important-data');
manager.cancelAll();
```

### 3.4. Framework-agnostic использование

```tsx
// Vanilla JS / любой фреймворк
import { createStore } from '@nexus-state/core';
import { useQuery } from '@nexus-state/query';

const store = createStore();

const userQuery = useQuery(store, {
  queryKey: 'user',
  queryFn: async () => {
    const response = await fetch('/api/user');
    return response.json();
  },
});

console.log(userQuery.data);
await userQuery.refetch();
```

### 3.5. DevTools

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

**Возможности:**
- Инспекция кэша запросов
- Трекинг мутаций
- Network activity
- Time Travel интеграция

### 3.6. Плюсы и минусы

| Плюсы | Минусы |
|-------|--------|
| ✅ Framework-agnostic | ❌ Молодой пакет (0.1.2) |
| ✅ Prefetching hooks из коробки | ❌ Маленькое комьюнити |
| ✅ Time Travel Debugging | ❌ Меньше документации |
| ✅ DevTools | ❌ Меньше примеров |
| ✅ Atom-based architecture | ❌ Меньше стабильности |
| ✅ PrefetchManager API | |

**Оценка:** ⭐⭐⭐⭐ (4/5) — перспективный, но молодой

---

## 🎓 Выводы

### Краткое резюме

| Библиотека | Лучше всего для |
|------------|-----------------|
| **TanStack Query** | Универсальный React проект, нужна максимальная функциональность |
| **SWR** | Минимализм, простота, Next.js проекты |
| **@nexus-state/query** | Multi-framework проекты, продвинутый prefetching |

### Что дальше?

В следующей статье мы рассмотрим:
- **Apollo Client** — для GraphQL проектов
- **RTK Query** — для Redux экосистемы
- **Decision guide** — как выбрать библиотеку

---

## 📚 Полезные ссылки

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [SWR Documentation](https://swr.vercel.app)
- [@nexus-state/query GitHub](https://github.com/eustatos/nexus-state)

---

**Понравилась статья?** Поставьте ❤️ и подпишитесь на серию!

**Вопросы?** Пишите в комментариях! 👇
