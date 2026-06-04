# Часть 2: Сравнение библиотек Data Fetching

**Формат:** Практическое руководство с гибридным подходом (факты + контекст + оценка)  
**Объём:** ~7,800 слов  
**Время чтения:** 28-32 минуты  
**Срок актуальности:** 1-2 года (требует обновлений версий)

---

## 🔬 Методология и подход

### Формат статьи: Гибридный

Эта статья использует **гибридный подход** к сравнению:

| Компонент | Доля | Описание |
|-----------|------|----------|
| **Факты** | 70% | Объективные данные: API, размер, фичи, версии |
| **Контекст** | 20% | Когда подходит / когда не подходит |
| **Оценка автора** | 10% | Субъективное мнение с дисклеймером |

**Почему гибридный:**
- ✅ Даёт готовые выводы (ценность для читателя)
- ✅ Остаётся прозрачным о субъективности (доверие)
- ✅ Разделяет факты и мнения (честность)

---

### На чём основан материал

#### 1. Практическом опыте
- Использование всех рассмотренных библиотек в production-проектах (2024-2026)
- Реальные сценарии: от простых дашбордов до сложных enterprise-приложений
- Командный опыт: feedback от 10+ разработчиков

#### 2. Техническом анализе
- Детальное изучение документации каждой библиотеки
- Анализ исходного кода для понимания внутренних механизмов
- Тестирование актуальных версий (Q1 2026)

#### 3. Сравнительном тестировании
- Реализация 10 общих паттернов в каждой библиотеке
- Сравнение API, DX, производительности
- Оценка размера bundle (BundlePhobia данные)

---

### ⚠️ Ограничения и дисклеймеры

| Аспект | Ограничение |
|--------|-------------|
| **Субъективность** | DX оценка может варьироваться в зависимости от опыта разработчика |
| **Версии** | Актуально на Q1 2026, библиотеки обновляются и меняются |
| **Контекст** | Production-опыт варьируется по проектам и командам |
| **Фреймворки** | Основной фокус на React, Vue, Svelte; другие фреймворки охвачены меньше |
| **Предвзятость** | Авторы используют @nexus-state/query в своих проектах |

**Важно:** Оценки и рекомендации в этой статье — это **мнение авторов**, основанное на их опыте. Ваши результаты могут отличаться.

---

### Как читать эту статью

1. **Факты** (объективно) — данные, которые можно проверить
2. **Контекст** (нейтрально) — когда библиотека подходит, а когда нет
3. **Оценка** (субъективно) — мнение авторов с пометкой «по нашему опыту»

**Пример маркировки:**
```
✅ Факт: «Размер ~13KB (gzip)»
✅ Контекст: «Подходит для React-проектов»
⚠️ Оценка: «По нашему опыту, лучшая документация» (субъективно)
```

---

## 📋 Детальная структура

### Введение (~500 слов)

```
1. Контекст (из Части 1)
   - Краткое напоминание о паттернах
   - Ссылка на Часть 1

2. Критерии сравнения
   - Функциональность
   - Размер bundle
   - DX (Developer Experience)
   - Производительность
   - Комьюнити и поддержка

3. Участники сравнения
   - TanStack Query (React Query)
   - SWR
   - @nexus-state/query
   - Apollo Client
   - RTK Query

4. Как использовать материал
   - Decision guide в конце
   - Примеры кода для каждой библиотеки
```

**Таблица быстрого сравнения:**

| Библиотека | Размер | Learning Curve | Best For |
|------------|--------|----------------|----------|
| TanStack Query | ~13KB | Средняя | Универсальный выбор |
| SWR | ~6KB | Низкая | Минимализм |
| @nexus-state/query | ~8KB | Средняя | Multi-framework |
| Apollo Client | ~25KB | Высокая | GraphQL проекты |
| RTK Query | ~15KB | Средняя | Redux проекты |

---

## 1. Сравнительная матрица (~400 слов)

### 1.1. Функциональность

| Функция | TanStack | SWR | @nexus-state | Apollo | RTK Query |
|---------|----------|-----|--------------|--------|-----------|
| Basic queries | ✅ | ✅ | ✅ | ✅ | ✅ |
| Suspense | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| Infinite queries | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mutations | ✅ | ✅ | ✅ | ✅ | ✅ |
| Optimistic updates | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Prefetching | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| DevTools | ✅ | ❌ | ✅ | ✅ | ✅ |
| Framework-agnostic | ❌ | ❌ | ✅ | ❌ | ❌ |

### 1.2. Технические характеристики

| Характеристика | TanStack | SWR | @nexus-state | Apollo | RTK Query |
|----------------|----------|-----|--------------|--------|-----------|
| Размер (gzip) | ~13KB | ~6KB | ~8KB | ~25KB | ~15KB |
| Версия | 5.x | 2.x | 0.1.2 | 3.x | 2.x |
| TypeScript | ✅ | ✅ | ✅ | ✅ | ✅ |
| React 17+ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SSR support | ✅ | ✅ | ✅ | ✅ | ✅ |

### 1.3. Визуализация размера

```
Размер bundle (gzip):

SWR:              ██████ 6KB
@nexus-state:     ████████ 8KB
TanStack Query:   █████████████ 13KB
RTK Query:        ███████████████ 15KB
Apollo Client:    █████████████████████████ 25KB
```

---

## 2. TanStack Query (React Query) (~1500 слов)

### 2.1. Обзор (~250 слов)

**Факты:**

| Характеристика | Значение |
|----------------|----------|
| **Текущая версия** | 5.x (Q1 2026) |
| **Размер** | ~13KB (gzip) |
| **Фреймворки** | React только |
| **Лицензия** | MIT |
| **Репозиторий** | github.com/TanStack/query |
| **Недельные загрузки** | ~2.5M (npm) |

**Философия:**
«Don't manage state, manage async state»

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

---

**Оценка автора (субъективно):**

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| **Функциональность** | ⭐⭐⭐⭐⭐ | Все фичи из коробки |
| **Документация** | ⭐⭐⭐⭐⭐ | Одна из лучших в экосистеме |
| **DX** | ⭐⭐⭐⭐ | Много опций, кривая обучения |
| **Производительность** | ⭐⭐⭐⭐ | Хорошая, но не лучшая в классе |
| **Комьюнити** | ⭐⭐⭐⭐⭐ | Огромное, активное |

**По нашему опыту:** TanStack Query — безопасный выбор для большинства React-проектов. Если не знаете что выбрать — выбирайте его.

---

### 2.2. Установка и настройка (~200 слов)

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

### 2.3. API для каждого паттерна (~600 слов)

#### Basic Query
```tsx
const { data, error, isLoading, refetch } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  staleTime: 1000 * 60 * 5,
  retry: 3,
});
```

#### Suspense Query
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

#### Infinite Query
```tsx
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: async ({ pageParam }) => fetchPosts(pageParam),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

#### Mutation
```tsx
const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: () => queryClient.invalidateQueries(['posts']),
  onMutate: async (newPost) => {
    // Optimistic update
  },
});
```

#### Prefetching
```tsx
await queryClient.prefetchQuery({
  queryKey: ['user', 1],
  queryFn: fetchUser,
  staleTime: 1000 * 60 * 5,
});
```

### 2.4. DevTools (~150 слов)

```tsx
import { ReactQueryDevTools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <YourApp />
      <ReactQueryDevTools initialIsOpen={false} />
    </>
  );
}
```

**Возможности DevTools:**
- Просмотр кэша
- Инвалидация query
- Инспекция мутаций
- Фильтрация

### 2.5. Продвинутые техники (~200 слов)

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

### 2.6. Плюсы и минусы (~150 слов)

| Плюсы | Минусы |
|-------|--------|
| ✅ Полная функциональность | ❌ Размер ~13KB |
| ✅ Отличная документация | ❌ Сложность для новичков |
| ✅ Большое комьюнити | ❌ React-центричный |
| ✅ DevTools | ❌ Много опций |
| ✅ TypeScript support | ❌ Кривая обучения |

**Оценка:** ⭐⭐⭐⭐⭐ (5/5)

---

## 3. SWR (~1200 слов)

### 3.1. Обзор (~250 слов)

**Факты:**

| Характеристика | Значение |
|----------------|----------|
| **Текущая версия** | 2.x (Q1 2026) |
| **Размер** | ~6KB (gzip) |
| **Фреймворки** | React только |
| **Лицензия** | MIT |
| **Репозиторий** | github.com/vercel/swr |
| **Недельные загрузки** | ~1.8M (npm) |
| **Разработчик** | Vercel |

**Философия:**
«Stale-while-revalidate» — минимализм и простота.

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

---

**Оценка автора (субъективно):**

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| **Функциональность** | ⭐⭐⭐⭐ | Базовые фичи есть, продвинутых меньше |
| **Документация** | ⭐⭐⭐⭐ | Хорошая, но меньше примеров |
| **DX** | ⭐⭐⭐⭐⭐ | Простой API, низкая кривая обучения |
| **Производительность** | ⭐⭐⭐⭐⭐ | Минимальный оверхед |
| **Комьюнити** | ⭐⭐⭐⭐ | Большое, поддержка Vercel |

**По нашему опыту:** SWR — отличный выбор для проектов, где важна простота. Если TanStack Query кажется избыточным — попробуйте SWR.

---

### 3.2. Установка и настройка (~150 слов)

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

### 3.3. API для каждого паттерна (~500 слов)

#### Basic Query
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

#### Suspense Query
```tsx
const { data } = useSWR('/api/user/1', fetcher, {
  suspense: true,
});

// В обёртке
<Suspense fallback={<Loading />}>
  <UserProfile />
</Suspense>
```

#### Infinite Query
```tsx
const { data, size, setSize } = useSWRInfinite(
  (index) => `/api/posts?page=${index}`,
  fetcher
);

// Load more
setSize(size + 1);
```

#### Optimistic Update
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

### 3.4. Особенности (~200 слов)

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

### 3.5. Плюсы и минусы (~150 слов)

| Плюсы | Минусы |
|-------|--------|
| ✅ Минимальный размер (~6KB) | ❌ Меньше фич |
| ✅ Простой API | ❌ Нет DevTools |
| ✅ Stale-while-revalidate по умолчанию | ❌ Меньше контроля |
| ✅ Vercel backing | ❌ Только React |
| ✅ Хорошая документация | ❌ Ограниченные prefetching |

**Оценка:** ⭐⭐⭐⭐ (4/5)

---

## 4. @nexus-state/query (~1500 слов)

### 4.1. Обзор (~250 слов)

**Факты:**

| Характеристика | Значение |
|----------------|----------|
| **Текущая версия** | 0.1.2 (Q1 2026) |
| **Размер** | ~8KB (gzip, оценка) |
| **Фреймворки** | React, Vue, Svelte, Vanilla JS |
| **Лицензия** | MIT |
| **Репозиторий** | github.com/eustatos/nexus-state |
| **Статус** | Beta / ранний релиз |

**Философия:**
Интеграция data fetching с атомарной архитектурой Nexus State. Framework-agnostic подход.

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

---

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

---

### 4.2. Установка и настройка (~200 слов)

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

### 4.3. API для каждого паттерна (~600 слов)

#### Basic Query
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

#### Suspense Query
```tsx
const { data, refetch, isStale, remove } = useSuspenseQuery(
  `user-${userId}`,
  () => fetchUser(userId),
  {
    staleTime: 1000 * 60 * 5,
  }
);
```

#### Infinite Query
```tsx
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: 'posts',
  queryFn: async ({ pageParam }) => fetchPosts(pageParam),
  initialPageParam: '',
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

#### Mutation
```tsx
const mutation = useMutation({
  mutationFn: createPost,
  invalidateQueries: ['posts'],
  onSuccess: (data) => console.log('Success:', data),
});
```

#### Prefetching Hooks (уникальная фича!)
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

#### PrefetchManager API
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

### 4.4. Framework-agnostic использование (~150 слов)

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

### 4.5. DevTools (~150 слов)

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

### 4.6. Плюсы и минусы (~200 слов)

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

## 5. Apollo Client (~1000 слов)

### 5.1. Обзор (~150 слов)

**Философия:**
GraphQL-first подход к управлению данными.

**Ключевые преимущества:**
- GraphQL-native
- Нормализация данных
- Мощный кэш
- Отличные DevTools

**Когда выбирать:**
- ✅ GraphQL API
- ✅ Нужна нормализация
- ✅ Сложные зависимости данных
- ❌ REST API
- ❌ Критичен размер

### 5.2. Установка и настройка (~200 слов)

```bash
npm install @apollo/client graphql
```

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
});

function App() {
  return (
    <ApolloProvider client={client}>
      <YourApp />
    </ApolloProvider>
  );
}
```

### 5.3. API для каждого паттерна (~400 слов)

#### Basic Query
```tsx
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

const { loading, error, data, refetch } = useQuery(GET_USERS, {
  fetchPolicy: 'cache-first',
});
```

#### Mutation
```tsx
const [createPost] = useMutation(CREATE_POST, {
  optimisticResponse: {
    createPost: { id: 'temp', title: 'New', __typename: 'Post' },
  },
  update: (cache, { data }) => {
    cache.modify({
      fields: {
        posts(existing = []) {
          return [...existing, data.createPost];
        },
      },
    });
  },
});
```

#### Pagination
```tsx
const { data, fetchMore } = useQuery(GET_POSTS, {
  variables: { first: 10, after: null },
});

fetchMore({
  variables: { after: data.posts.pageInfo.endCursor },
  updateQuery: (prev, { fetchMoreResult }) => {
    return {
      posts: {
        ...fetchMoreResult.posts,
        edges: [...prev.posts.edges, ...fetchMoreResult.posts.edges],
      },
    };
  },
});
```

### 5.4. Плюсы и минусы (~150 слов)

| Плюсы | Минусы |
|-------|--------|
| ✅ GraphQL-native | ❌ Только для GraphQL |
| ✅ Нормализация | ❌ Большой размер (~25KB) |
| ✅ Мощный кэш | ❌ Высокая кривая обучения |
| ✅ DevTools | ❌ Сложная настройка |
| ✅ Экосистема | ❌ Overhead для простых случаев |

**Оценка:** ⭐⭐⭐⭐ (4/5) для GraphQL проектов

---

## 6. RTK Query (~1000 слов)

### 6.1. Обзор (~150 слов)

**Философия:**
Data fetching и кэширование «из коробки» для Redux экосистемы.

**Ключевые преимущества:**
- Бесшовная Redux интеграция
- Auto invalidation по тегам
- Generated hooks
- Redux DevTools

**Когда выбирать:**
- ✅ Уже используется Redux Toolkit
- ✅ Нужна Redux интеграция
- ✅ Auto invalidation важен
- ❌ Нет Redux в проекте
- ❌ Критичен размер

### 6.2. Установка и настройка (~200 слов)

```bash
npm install @reduxjs/toolkit react-redux
```

```tsx
import { configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Post', 'User'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => 'users',
      providesTags: ['User'],
    }),
    createPost: builder.mutation({
      query: (post) => ({
        url: 'posts',
        method: 'POST',
        body: post,
      }),
      invalidatesTags: ['Post'],
    }),
  }),
});

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});
```

### 6.3. API для каждого паттерна (~400 слов)

#### Basic Query
```tsx
const { data, error, isLoading, refetch } = useGetUsersQuery();
```

#### Mutation с auto invalidation
```tsx
const [createPost] = useCreatePostMutation();
// Автоматически инвалидирует 'Post' tag
```

#### Prefetching
```tsx
import { api } from './api';

// В компоненте
dispatch(api.endpoints.getUser.initiate(userId));
```

### 6.4. Плюсы и минусы (~150 слов)

| Плюсы | Минусы |
|-------|--------|
| ✅ Redux интеграция | ❌ Требует Redux |
| ✅ Auto invalidation | ❌ Размер + Redux |
| ✅ Generated hooks | ❌ Boilerplate |
| ✅ DevTools | ❌ Сложность для новичков |
| ✅ TypeScript | ❌ Меньше гибкости |

**Оценка:** ⭐⭐⭐⭐ (4/5) для Redux проектов

---

## 7. Итоговое сравнение (~800 слов)

### 7.1. Decision Guide (~300 слов)

**Как использовать этот раздел:**
Этот guide помогает выбрать библиотеку на основе **вашего контекста**, а не «что лучше».

#### По типу проекта

| Тип проекта | Подходит | Альтернатива | Комментарий |
|-------------|----------|--------------|-------------|
| React + REST | TanStack Query | SWR | Обе решают задачу, TanStack функциональнее |
| React + GraphQL | Apollo Client | urql | GraphQL-native подход |
| React + Redux | RTK Query | TanStack Query | RTK Query бесшовно интегрируется |
| Multi-framework | @nexus-state/query | — | Единственный framework-agnostic вариант |
| Минимализм | SWR | TanStack Query | SWR проще, TanStack функциональнее |
| Enterprise | TanStack Query | Apollo Client | Поддержка, документация, комьюнити |

#### По приоритетам

| Приоритет | Подходит | Почему | Альтернатива |
|-----------|----------|--------|--------------|
| Размер bundle | SWR (~6KB) | Минимальный размер | @nexus-state/query (~8KB) |
| Функциональность | TanStack Query | Все фичи из коробки | @nexus-state/query |
| Prefetching | @nexus-state/query | 5+ хуков, PrefetchManager | TanStack Query (ручной) |
| GraphQL | Apollo Client | Native support | urql |
| Redux интеграция | RTK Query | Бесшовная | TanStack Query |
| DevTools | TanStack Query / @nexus-state/query | Встроенные | Apollo Client |
| Multi-framework | @nexus-state/query | Единственный вариант | — |
| Зрелость | TanStack Query | Популярность, время на рынке | SWR |
| Time Travel | @nexus-state/query | Интеграция с Nexus State | — |

### 7.2. Миграционные пути (~250 слов)

**От SWR к TanStack Query:**
```tsx
// До
const { data } = useSWR('/api/users', fetcher);

// После
const { data } = useQuery({ queryKey: ['users'], queryFn: fetcher });
```

**От React Query к @nexus-state/query:**
```tsx
// До
const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

// После
const { data } = useQuery('users', fetchUsers);
```

**От ручного fetch к любой библиотеке:**
```tsx
// До
const [data, setData] = useState(null);
useEffect(() => {
  fetch('/api/users').then(setData);
}, []);

// После (любая библиотека)
const { data } = useQuery(['users'], fetchUsers);
```

### 7.3. Таблица выбора (~250 слов)

| Сценарий | Подходит | Почему | На что обратить внимание |
|----------|----------|--------|-------------------------|
| Новый React проект | TanStack Query | Зрелость, документация | Если не знаете что выбрать |
| Маленький проект | SWR | Простота, размер | Меньше фичи, но достаточно |
| GraphQL проект | Apollo Client | GraphQL-native | Только для GraphQL |
| Redux проект | RTK Query | Интеграция | Требует Redux в проекте |
| Multi-framework | @nexus-state/query | Единственный вариант | Пакет в beta, растущий |
| Нужен prefetching | @nexus-state/query | 5+ стратегий из коробки | Уникальная фича |
| Важен bundle size | SWR | 6KB gzip | Минимальный размер |
| Enterprise проект | TanStack Query | Поддержка, комьюнити | Долгосрочная поддержка |
| Нужен Time Travel | @nexus-state/query | Интеграция с Nexus State | Уникальная фича |
| Простые запросы | SWR | Минимум кода | Низкая кривая обучения |

---

## 8. Рекомендации по выбору (~500 слов)

### 8.1. Чек-лист выбора (~200 слов)

**Вопросы для принятия решения:**

1. **Какой фреймворк?**
   - React → Все варианты
   - Vue/Svelte → @nexus-state/query
   - Vanilla → @nexus-state/query

2. **Какой API?**
   - REST → TanStack Query, SWR, @nexus-state/query
   - GraphQL → Apollo Client

3. **Есть ли Redux?**
   - Да → RTK Query
   - Нет → Любая другая

4. **Критичен ли размер?**
   - Да → SWR
   - Нет → TanStack Query

5. **Нужен ли prefetching?**
   - Да, продвинутый → @nexus-state/query
   - Нет → Любая

6. **Важен ли Time Travel?**
   - Да → @nexus-state/query
   - Нет → Любая

### 8.2. Комбинации библиотек (~150 слов)

**Можно комбинировать:**

| Комбинация | Когда | Пример |
|------------|-------|--------|
| TanStack Query + Apollo | GraphQL + REST | Основное из GraphQL, остальное из REST |
| SWR + Redux | Простые запросы + сложное state | Лёгкие запросы через SWR, сложное через Redux |
| @nexus-state/query + специализированные | Multi-framework + GraphQL | Основное через Nexus, GraphQL через Apollo |

**Не рекомендуется:**
- Две библиотеки для одного типа запросов
- TanStack Query + SWR (дублирование функциональности)

### 8.3. Будущее data fetching (~150 слов)

**Тренды 2026-2027:**

1. **Server Components**
   - React Server Components меняют парадигму
   - Меньше client-side fetching

2. **Edge Computing**
   - Запросы ближе к данным
   - Меньше latency

3. **AI-powered prefetching**
   - Предсказание запросов
   - Умное кэширование

4. **Framework convergence**
   - Унификация API
   - Меньше boilerplate

---

## Заключение (~300 слов)

### Ключевые выводы

1. **Нет «лучшей» библиотеки**
   - Выбор зависит от контекста
   - Все рассмотренные библиотеки решают задачи

2. **Паттерны важнее инструментов**
   - Понимание паттернов из Части 1 критично
   - Инструменты меняются, паттерны остаются

3. **@nexus-state/query — перспективный выбор**
   - Уникальные фичи (prefetch hooks, Time Travel)
   - Framework-agnostic
   - Молодой, но развивающийся

### Рекомендации

| Сценарий | Рекомендация |
|----------|--------------|
| Универсальный | TanStack Query |
| Минимализм | SWR |
| Multi-framework | @nexus-state/query |
| GraphQL | Apollo Client |
| Redux | RTK Query |

### Что дальше

- Изучить документацию выбранной библиотеки
- Практиковаться с примерами
- Следить за обновлениями

---

## 🤝 Вклад сообщества

Эта статья — живой материал, который будет обновляться по мере:

- Выхода новых версий библиотек
- Появления новых паттернов и лучших практик
- Получения feedback от сообщества

### Как вы можете помочь

**Если вы нашли:**
- ❌ Неточность или устаревшую информацию
- 💡 Интересный паттерн или лайфхак
- 📚 Опыт использования библиотек, не охваченный в статье

**Поделитесь в комментариях** или откройте Issue на GitHub.

### Форматы вклада

| Формат | Где | Что получить |
|--------|-----|--------------|
| **Комментарии** | Площадка публикации | Обсуждение, ответы автора |
| **GitHub Issue** | [Репозиторий](ссылка) | Трекинг, включение в обновления |
| **Pull Request** | [Репозиторий](ссылка) | Непосредственное улучшение контента |
| **Опрос** | [Форма](ссылка) | Анонимный сбор опыта |

### Что будет с вашим вкладом

1. **Модерация** — проверка релевантности и точности
2. **Интеграция** — лучшие инсайты войдут в следующее обновление
3. **Признание** — указание авторства в changelog обновлений

### План обновлений

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0 | Апрель 2026 | Первая публикация |
| 1.1 | Май 2026 | Исправления по фидбеку |
| 2.0 | Июль 2026 | Обновление версий библиотек |
| 2.1 | Сентябрь 2026 | Новые фичи библиотек |
| 3.0 | Январь 2027 | Годовое обновление |

---

## 📊 Метрики раздела

| Раздел | Слов | Время чтения |
|--------|------|--------------|
| Методология | 300 | 1 мин |
| Введение | 500 | 2 мин |
| 1. Сравнительная матрица | 400 | 1 мин |
| 2. TanStack Query | 1500 | 5 мин |
| 3. SWR | 1200 | 4 мин |
| 4. @nexus-state/query | 1500 | 5 мин |
| 5. Apollo Client | 1000 | 3 мин |
| 6. RTK Query | 1000 | 3 мин |
| 7. Итоговое сравнение | 800 | 3 мин |
| 8. Рекомендации | 500 | 2 мин |
| Заключение | 300 | 1 мин |
| Вклад сообщества | 400 | 1 мин |
| **Итого** | **~7,800** | **~30 мин** |
