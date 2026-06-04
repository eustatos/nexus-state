---
title: "Сравнение библиотек Data Fetching: Apollo Client, RTK Query и выбор решения (Часть 5/5)"
published: false
description: "Завершающая часть серии: Apollo Client, RTK Query и полное руководство по выбору библиотеки data fetching"
tags: react, javascript, webdev, tutorial
series: "Query Patterns"
canonical_url: null
cover_image: null
---

# Сравнение библиотек Data Fetching: Часть 2

> **Серия статей:** Часть 5 из 5  
> **Уровень:** Практический  
> **Время чтения:** ~12 минут

## 📋 Содержание серии

1. Основы — Server vs Client State, Query Caching, Deduplication
2. Средний уровень — Background Refetching, Error Handling, Mutations
3. Продвинутый уровень — Optimistic Updates, React Suspense, Anti-patterns
4. Сравнение библиотек (часть 1) — TanStack Query, SWR, @nexus-state/query
5. **Сравнение библиотек (часть 2)** (эта статья) — Apollo Client, RTK Query, выбор решения

---

## 🎯 Введение

В предыдущей статье мы рассмотрели TanStack Query, SWR и @nexus-state/query. Теперь завершим обзор специализированными решениями: Apollo Client для GraphQL и RTK Query для Redux экосистемы. В конце дадим полное руководство по выбору библиотеки.

---

## 1. Apollo Client

### 1.1. Обзор

**Факты:**

| Характеристика | Значение |
|----------------|----------|
| **Текущая версия** | 3.x (Q1 2026) |
| **Размер** | ~25KB (gzip) |
| **Фреймворки** | React, Vue, Angular, Vanilla JS |
| **Лицензия** | MIT |
| **Недельные загрузки** | ~3M (npm) |

**Философия:** GraphQL-first подход к управлению данными.

**Ключевые фичи:**
- GraphQL-native
- Нормализация данных
- Мощный кэш с type policies
- Optimistic UI
- Local state management
- Subscriptions (real-time)
- Отличные DevTools
- SSR support
- Batch queries

**Когда подходит:**
- ✅ GraphQL API
- ✅ Нужна нормализация данных
- ✅ Сложные зависимости данных
- ✅ Real-time subscriptions
- ✅ Нужен local state management

**Когда не подходит:**
- ❌ REST API (избыточен)
- ❌ Критичен размер bundle (~25KB)
- ❌ Простые сценарии data fetching
- ❌ Команда не знакома с GraphQL

**Оценка автора (субъективно):**

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| **Функциональность** | ⭐⭐⭐⭐⭐ | Всё для GraphQL |
| **Документация** | ⭐⭐⭐⭐⭐ | Отличная, много примеров |
| **DX** | ⭐⭐⭐ | Высокая кривая обучения |
| **Производительность** | ⭐⭐⭐⭐ | Хорошая с нормализацией |
| **Комьюнити** | ⭐⭐⭐⭐⭐ | Огромное GraphQL комьюнити |

**По нашему опыту:** Apollo Client — стандарт де-факто для GraphQL проектов. Если у вас GraphQL API — это очевидный выбор.

### 1.2. Установка и настройка

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

### 1.3. API для каждого паттерна

**Basic Query:**
```tsx
import { useQuery, gql } from '@apollo/client';

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

**Query с переменными:**
```tsx
const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

const { data } = useQuery(GET_USER, {
  variables: { id: userId },
});
```

**Mutation:**
```tsx
const CREATE_POST = gql`
  mutation CreatePost($title: String!, $content: String!) {
    createPost(title: $title, content: $content) {
      id
      title
      content
    }
  }
`;

const [createPost, { loading, error }] = useMutation(CREATE_POST, {
  optimisticResponse: {
    createPost: {
      __typename: 'Post',
      id: 'temp-id',
      title: variables.title,
      content: variables.content,
    },
  },
  update: (cache, { data }) => {
    cache.modify({
      fields: {
        posts(existing = []) {
          const newPostRef = cache.writeFragment({
            data: data.createPost,
            fragment: gql`
              fragment NewPost on Post {
                id
                title
                content
              }
            `,
          });
          return [...existing, newPostRef];
        },
      },
    });
  },
});
```

**Pagination (cursor-based):**
```tsx
const GET_POSTS = gql`
  query GetPosts($after: String) {
    posts(first: 10, after: $after) {
      edges {
        node {
          id
          title
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const { data, fetchMore } = useQuery(GET_POSTS);

const loadMore = () => {
  fetchMore({
    variables: {
      after: data.posts.pageInfo.endCursor,
    },
  });
};
```

**Subscription (real-time):**
```tsx
const MESSAGE_SUBSCRIPTION = gql`
  subscription OnMessageAdded {
    messageAdded {
      id
      text
      user {
        name
      }
    }
  }
`;

const { data, loading } = useSubscription(MESSAGE_SUBSCRIPTION);
```

### 1.4. Нормализация данных

**Автоматическая нормализация:**

```tsx
// Query 1: Получить пользователя
const { data } = useQuery(gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`, { variables: { id: '1' } });

// Query 2: Получить посты пользователя
const { data: posts } = useQuery(gql`
  query GetUserPosts($userId: ID!) {
    posts(userId: $userId) {
      id
      title
      author {
        id
        name  # Уже в кэше!
      }
    }
  }
`, { variables: { userId: '1' } });

// author.name берётся из кэша, не делается новый запрос
```

**Custom type policies:**

```tsx
const cache = new InMemoryCache({
  typePolicies: {
    User: {
      keyFields: ['email'], // Использовать email вместо id
    },
    Post: {
      fields: {
        comments: {
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
      },
    },
  },
});
```

### 1.5. DevTools

```tsx
// DevTools автоматически доступны в development
// Откройте Chrome DevTools → вкладка Apollo
```

**Возможности:**
- Инспекция GraphQL запросов
- Просмотр нормализованного кэша
- Мутации и subscriptions
- Query explorer

### 1.6. Плюсы и минусы

| Плюсы | Минусы |
|-------|--------|
| ✅ GraphQL-native | ❌ Только для GraphQL |
| ✅ Нормализация данных | ❌ Большой размер (~25KB) |
| ✅ Мощный кэш | ❌ Высокая кривая обучения |
| ✅ Real-time subscriptions | ❌ Сложная настройка |
| ✅ DevTools | ❌ Overhead для простых случаев |
| ✅ Огромная экосистема | |

**Оценка:** ⭐⭐⭐⭐⭐ (5/5) для GraphQL проектов

---

## 2. RTK Query

### 2.1. Обзор

**Факты:**

| Характеристика | Значение |
|----------------|----------|
| **Текущая версия** | 2.x (Q1 2026) |
| **Размер** | ~15KB (gzip, с Redux Toolkit) |
| **Фреймворки** | React (через Redux) |
| **Лицензия** | MIT |
| **Недельные загрузки** | ~4M (npm, Redux Toolkit) |

**Философия:** Data fetching и кэширование «из коробки» для Redux экосистемы.

**Ключевые фичи:**
- Бесшовная Redux интеграция
- Auto-generated hooks
- Tag-based invalidation
- Optimistic updates
- Polling и streaming
- Code splitting
- Redux DevTools интеграция
- TypeScript-first

**Когда подходит:**
- ✅ Уже используется Redux Toolkit
- ✅ Нужна Redux интеграция
- ✅ Tag-based invalidation важен
- ✅ Нужен централизованный state

**Когда не подходит:**
- ❌ Нет Redux в проекте
- ❌ Критичен размер (Redux + RTK Query ~15KB)
- ❌ Нужна простота (много boilerplate)
- ❌ Multi-framework проект

**Оценка автора (субъективно):**

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| **Функциональность** | ⭐⭐⭐⭐ | Всё для Redux проектов |
| **Документация** | ⭐⭐⭐⭐ | Хорошая, часть Redux Toolkit |
| **DX** | ⭐⭐⭐ | Много boilerplate |
| **Производительность** | ⭐⭐⭐⭐ | Хорошая с Redux |
| **Комьюнити** | ⭐⭐⭐⭐⭐ | Огромное Redux комьюнити |

**По нашему опыту:** RTK Query — отличный выбор если уже используете Redux. Не стоит добавлять Redux только ради RTK Query.

### 2.2. Установка и настройка

```bash
npm install @reduxjs/toolkit react-redux
```

```tsx
import { configureStore } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Определение API
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Post', 'User'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => 'users',
      providesTags: ['User'],
    }),
    getUser: builder.query({
      query: (id) => `users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    createPost: builder.mutation({
      query: (post) => ({
        url: 'posts',
        method: 'POST',
        body: post,
      }),
      invalidatesTags: ['Post'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `users/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
    }),
  }),
});

// Auto-generated hooks
export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreatePostMutation,
  useUpdateUserMutation,
} = api;

// Store setup
export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});
```

### 2.3. API для каждого паттерна

**Basic Query:**
```tsx
function UserList() {
  const { data, error, isLoading, refetch } = useGetUsersQuery();

  if (isLoading) return <Loading />;
  if (error) return <Error error={error} />;

  return (
    <div>
      {data.map(user => <UserCard key={user.id} user={user} />)}
    </div>
  );
}
```

**Query с параметрами:**
```tsx
function UserProfile({ userId }) {
  const { data: user } = useGetUserQuery(userId, {
    pollingInterval: 30000, // Poll каждые 30 секунд
    skip: !userId, // Skip если нет userId
  });

  return <div>{user?.name}</div>;
}
```

**Mutation с auto invalidation:**
```tsx
function CreatePostForm() {
  const [createPost, { isLoading }] = useCreatePostMutation();

  const handleSubmit = async (formData) => {
    try {
      await createPost(formData).unwrap();
      // Автоматически инвалидирует 'Post' tag
      toast.success('Post created!');
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**Optimistic Update:**
```tsx
const api = createApi({
  // ...
  endpoints: (builder) => ({
    updatePost: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        // Optimistic update
        const patchResult = dispatch(
          api.util.updateQueryData('getPost', id, (draft) => {
            Object.assign(draft, patch);
          })
        );

        try {
          await queryFulfilled;
        } catch {
          // Rollback on error
          patchResult.undo();
        }
      },
    }),
  }),
});
```

**Prefetching:**
```tsx
import { api } from './api';

function PostList() {
  const { data: posts } = useGetPostsQuery();

  const handleMouseEnter = (postId) => {
    // Prefetch post details
    dispatch(api.util.prefetch('getPost', postId, { force: false }));
  };

  return (
    <div>
      {posts.map(post => (
        <Link
          key={post.id}
          to={`/post/${post.id}`}
          onMouseEnter={() => handleMouseEnter(post.id)}
        >
          {post.title}
        </Link>
      ))}
    </div>
  );
}
```

### 2.4. Tag-based Invalidation

**Мощная система тегов:**

```tsx
const api = createApi({
  tagTypes: ['Post', 'User', 'Comment'],
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: () => 'posts',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Post', id })),
              { type: 'Post', id: 'LIST' },
            ]
          : [{ type: 'Post', id: 'LIST' }],
    }),
    getPost: builder.query({
      query: (id) => `posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    createPost: builder.mutation({
      query: (post) => ({
        url: 'posts',
        method: 'POST',
        body: post,
      }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),
    updatePost: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }],
    }),
  }),
});
```

### 2.5. Code Splitting

**Инъекция endpoints:**

```tsx
// api.ts (базовый API)
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Post', 'User'],
  endpoints: () => ({}),
});

// postsApi.ts (отдельный модуль)
import { api } from './api';

export const postsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: () => 'posts',
      providesTags: ['Post'],
    }),
  }),
});

export const { useGetPostsQuery } = postsApi;
```

### 2.6. Плюсы и минусы

| Плюсы | Минусы |
|-------|--------|
| ✅ Redux интеграция | ❌ Требует Redux |
| ✅ Auto-generated hooks | ❌ Много boilerplate |
| ✅ Tag-based invalidation | ❌ Размер + Redux (~15KB) |
| ✅ Redux DevTools | ❌ Сложность для новичков |
| ✅ TypeScript-first | ❌ Меньше гибкости |
| ✅ Code splitting | |

**Оценка:** ⭐⭐⭐⭐ (4/5) для Redux проектов

---

## 3. Decision Guide: Как выбрать библиотеку

### 3.1. Блок-схема выбора

```
Начало
  │
  ├─ GraphQL API?
  │   └─ ДА → Apollo Client ✅
  │
  ├─ Уже используете Redux?
  │   └─ ДА → RTK Query ✅
  │
  ├─ Multi-framework проект?
  │   └─ ДА → @nexus-state/query ✅
  │
  ├─ Критичен размер bundle?
  │   └─ ДА → SWR ✅
  │
  └─ Универсальный React проект?
      └─ ДА → TanStack Query ✅
```

### 3.2. Сравнительная таблица (все библиотеки)

| Критерий | TanStack | SWR | @nexus-state | Apollo | RTK Query |
|----------|----------|-----|--------------|--------|-----------|
| **Размер (gzip)** | 13KB | 6KB | 8KB | 25KB | 15KB |
| **Learning Curve** | Средняя | Низкая | Средняя | Высокая | Средняя |
| **Документация** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Комьюнити** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **DevTools** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Framework-agnostic** | ❌ | ❌ | ✅ | ⚠️ | ❌ |
| **GraphQL** | ⚠️ | ⚠️ | ⚠️ | ✅ | ⚠️ |
| **Prefetching** | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| **Optimistic Updates** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Suspense** | ✅ | ✅ | ✅ | ⚠️ | ❌ |

### 3.3. Рекомендации по сценариям

**Стартап / MVP:**
- **Выбор:** SWR или TanStack Query
- **Почему:** Быстрый старт, хорошая документация, большое комьюнити

**Enterprise проект:**
- **Выбор:** TanStack Query или Apollo Client (если GraphQL)
- **Почему:** Зрелость, долгосрочная поддержка, полная функциональность

**Multi-framework проект:**
- **Выбор:** @nexus-state/query
- **Почему:** Единый API для React, Vue, Svelte

**GraphQL проект:**
- **Выбор:** Apollo Client
- **Почему:** Нормализация, subscriptions, GraphQL-native

**Redux проект:**
- **Выбор:** RTK Query
- **Почему:** Бесшовная интеграция, tag-based invalidation

**Мобильное приложение:**
- **Выбор:** TanStack Query или SWR
- **Почему:** Малый размер, offline support

**Критичен размер bundle:**
- **Выбор:** SWR
- **Почему:** Минимальный размер (~6KB)

### 3.4. Миграция между библиотеками

**Сложность миграции:**

| От → К | Сложность | Комментарий |
|--------|-----------|-------------|
| useState → TanStack/SWR | 🟢 Низкая | Прямая замена |
| TanStack ↔ SWR | 🟡 Средняя | Похожий API |
| REST → Apollo | 🔴 Высокая | Нужен GraphQL API |
| Redux → RTK Query | 🟡 Средняя | Постепенная миграция |
| TanStack → @nexus-state | 🟡 Средняя | Похожие концепции |

---

## 🎓 Итоговые выводы серии

### Что мы изучили

**Часть 1-3: Паттерны**
- Server vs Client State
- Query Caching и Stale-while-revalidate
- Background Refetching
- Error Handling & Retry
- Mutations & Invalidation
- Infinite Queries
- Prefetching Strategies
- Optimistic Updates
- React Suspense
- Anti-patterns

**Часть 4-5: Библиотеки**
- TanStack Query — универсальный выбор
- SWR — минимализм и простота
- @nexus-state/query — multi-framework
- Apollo Client — GraphQL стандарт
- RTK Query — Redux интеграция

### Главные выводы

1. **Паттерны важнее инструментов** — понимание концепций позволяет работать с любой библиотекой
2. **Нет универсального решения** — выбор зависит от контекста проекта
3. **Server state требует специальных инструментов** — не используйте useState
4. **Кэширование обязательно** — для производительности и UX
5. **Тестируйте перед выбором** — попробуйте несколько библиотек на простом примере

### Следующие шаги

1. Выберите библиотеку по decision guide
2. Изучите документацию
3. Реализуйте простой пример
4. Постепенно внедряйте в проект
5. Настройте DevTools
6. Напишите тесты

---

## 📚 Полезные ссылки

**Документация:**
- [TanStack Query](https://tanstack.com/query/latest)
- [SWR](https://swr.vercel.app)
- [@nexus-state/query](https://github.com/eustatos/nexus-state)
- [Apollo Client](https://www.apollographql.com/docs/react/)
- [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)

**Дополнительные материалы:**
- [State of JS 2025](https://stateofjs.com)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)

---

## 🙏 Заключение

Спасибо, что прочитали всю серию статей! Надеюсь, этот материал помог вам разобраться в паттернах управления серверным состоянием и выбрать подходящую библиотеку.

**Если серия была полезна:**
- Поставьте ❤️ на все статьи
- Поделитесь с коллегами
- Оставьте feedback в комментариях

**Вопросы? Предложения?** Пишите в комментариях — обсудим! 👇

---

**Автор:** [Ваше имя]  
**GitHub:** [Ваш GitHub]  
**Twitter:** [Ваш Twitter]
