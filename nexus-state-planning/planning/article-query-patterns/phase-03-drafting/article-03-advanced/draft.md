---
title: "Паттерны управления серверным состоянием: Продвинутый уровень (Часть 3/5)"
published: false
description: "Optimistic Updates, React Suspense интеграция и anti-patterns в data fetching"
tags: react, javascript, webdev, tutorial
series: "Query Patterns"
canonical_url: null
cover_image: null
---

# Паттерны управления серверным состоянием: Продвинутый уровень

> **Серия статей:** Часть 3 из 5  
> **Уровень:** Продвинутый  
> **Время чтения:** ~10 минут

## 📋 Содержание серии

1. Основы — Server vs Client State, Query Caching, Deduplication
2. Средний уровень — Background Refetching, Error Handling, Mutations
3. **Продвинутый уровень** (эта статья) — Optimistic Updates, React Suspense, Anti-patterns
4. Сравнение библиотек (часть 1) — TanStack Query, SWR, @nexus-state/query
5. Сравнение библиотек (часть 2) — Apollo Client, RTK Query, выбор решения

---

## 🎯 Введение

В предыдущих частях мы изучили базовые и средние паттерны управления серверным состоянием. Теперь переходим к продвинутым техникам, которые делают приложения максимально отзывчивыми и современными.

В этой статье:
- **Optimistic Updates** — мгновенный отклик UI
- **React Suspense** — декларативная загрузка данных
- **Anti-patterns** — типичные ошибки и как их избежать

---

## 1. Optimistic Updates

### 1.1. Что такое Optimistic Updates

**Определение:** Мгновенное обновление UI до подтверждения сервера.

**Зачем:**
- ⚡ Улучшение perceived performance
- 🎯 Мгновенный отклик
- 😊 Лучший UX

**Риски:**
- ⚠️ Нужен rollback при ошибке
- ⚠️ Усложнение логики
- ⚠️ Дезориентация пользователя при rollback

### 1.2. Паттерн реализации

**Алгоритм:**

```
1. Сохранить текущее состояние (для rollback)
2. Оптимистично обновить UI
3. Отправить запрос на сервер
4. Если успех → подтвердить обновление
5. Если ошибка → откатить к сохранённому состоянию
```

**Базовая реализация:**

```tsx
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    // 1. Отменить текущие запросы (избежать race condition)
    await queryClient.cancelQueries(['todos']);

    // 2. Сохранить текущее состояние
    const previousTodos = queryClient.getQueryData(['todos']);

    // 3. Оптимистично обновить UI
    queryClient.setQueryData(['todos'], (old) => 
      old.map(todo => todo.id === newTodo.id ? newTodo : todo)
    );

    // 4. Вернуть контекст для rollback
    return { previousTodos };
  },
  onError: (err, newTodo, context) => {
    // 5. Откатить при ошибке
    queryClient.setQueryData(['todos'], context.previousTodos);
  },
  onSettled: () => {
    // 6. Синхронизировать с сервером
    queryClient.invalidateQueries(['todos']);
  },
});
```

### 1.3. Примеры use cases

**Like/Unlike:**

```tsx
const likeMutation = useMutation({
  mutationFn: likePost,
  onMutate: async (postId) => {
    await queryClient.cancelQueries(['post', postId]);
    const previous = queryClient.getQueryData(['post', postId]);

    queryClient.setQueryData(['post', postId], (old) => ({
      ...old,
      likes: old.likes + 1,
      isLiked: true,
    }));

    return { previous };
  },
  onError: (err, postId, context) => {
    queryClient.setQueryData(['post', postId], context.previous);
  },
});
```

**Добавление комментария:**

```tsx
const addCommentMutation = useMutation({
  mutationFn: addComment,
  onMutate: async (newComment) => {
    await queryClient.cancelQueries(['comments', postId]);
    const previous = queryClient.getQueryData(['comments', postId]);

    const optimisticComment = {
      ...newComment,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isPending: true, // Индикатор оптимистичного обновления
    };

    queryClient.setQueryData(['comments', postId], (old) => 
      [...old, optimisticComment]
    );

    return { previous };
  },
  onSuccess: (data, variables, context) => {
    // Заменить временный ID на реальный
    queryClient.setQueryData(['comments', postId], (old) =>
      old.map(comment => 
        comment.id === `temp-${Date.now()}` ? data : comment
      )
    );
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['comments', postId], context.previous);
  },
});
```

**Удаление элемента:**

```tsx
const deleteMutation = useMutation({
  mutationFn: deletePost,
  onMutate: async (postId) => {
    await queryClient.cancelQueries(['posts']);
    const previous = queryClient.getQueryData(['posts']);

    queryClient.setQueryData(['posts'], (old) =>
      old.filter(post => post.id !== postId)
    );

    return { previous };
  },
  onError: (err, postId, context) => {
    queryClient.setQueryData(['posts'], context.previous);
    toast.error('Не удалось удалить пост');
  },
});
```

### 1.4. Best practices

**Визуальные индикаторы:**

```tsx
function CommentItem({ comment }) {
  return (
    <div className={comment.isPending ? 'opacity-50' : ''}>
      {comment.text}
      {comment.isPending && <Spinner size="sm" />}
    </div>
  );
}
```

**Обработка конфликтов:**

```tsx
onError: (err, variables, context) => {
  if (err.status === 409) {
    // Конфликт версий
    toast.error('Данные были изменены другим пользователем');
    queryClient.invalidateQueries(['post', postId]); // Получить свежие данные
  } else {
    // Обычный rollback
    queryClient.setQueryData(['post', postId], context.previous);
  }
}
```

**Когда использовать:**

| Сценарий | Использовать? | Причина |
|----------|---------------|---------|
| Like/Unlike | ✅ | Мгновенный отклик критичен |
| Добавление комментария | ✅ | Улучшает UX |
| Редактирование текста | ⚠️ | Риск конфликтов |
| Удаление | ⚠️ | Нужна уверенность |
| Финансовые операции | ❌ | Слишком критично |
| Изменение настроек | ✅ | Хороший UX |

---

## 2. React Suspense

### 2.1. Что такое Suspense

**Определение:** Декларативный способ обработки асинхронных операций в React.

**Преимущества:**
- 🎯 Декларативный подход
- 🔄 Автоматическое управление loading states
- 🎨 Композиция loading UI
- 🚀 Concurrent rendering

**Как работает:**

```tsx
<Suspense fallback={<Loading />}>
  <UserProfile /> {/* Выбрасывает Promise при загрузке */}
</Suspense>
```

### 2.2. Suspense Query

**Базовое использование:**

```tsx
// Компонент
function UserProfile({ userId }) {
  const { data } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  return <div>{data.name}</div>; // data всегда определён
}

// Обёртка
function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<LoadingSkeleton />}>
        <UserProfile userId={1} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### 2.3. Вложенные Suspense границы

**Гранулярный контроль:**

```tsx
function Dashboard() {
  return (
    <div>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>

      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>

      <Suspense fallback={<ContentSkeleton />}>
        <MainContent />
      </Suspense>
    </div>
  );
}
```

**Преимущества:**
- Каждая секция загружается независимо
- Пользователь видит контент по мере готовности
- Лучший perceived performance

### 2.4. Suspense + Error Boundaries

**Полная обработка состояний:**

```tsx
function App() {
  return (
    <ErrorBoundary 
      fallback={<ErrorFallback />}
      onReset={() => queryClient.resetQueries()}
    >
      <Suspense fallback={<Loading />}>
        <UserProfile />
      </Suspense>
    </ErrorBoundary>
  );
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h3>Ошибка загрузки</h3>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>
        Попробовать снова
      </button>
    </div>
  );
}
```

### 2.5. Prefetching для Suspense

**Предзагрузка данных:**

```tsx
function PostList() {
  const { data: posts } = useSuspenseQuery(['posts'], fetchPosts);

  return (
    <div>
      {posts.map(post => (
        <Link
          key={post.id}
          to={`/post/${post.id}`}
          onMouseEnter={() => {
            // Prefetch при hover
            queryClient.prefetchQuery(['post', post.id], () => 
              fetchPost(post.id)
            );
          }}
        >
          {post.title}
        </Link>
      ))}
    </div>
  );
}
```

### 2.6. Ограничения и компромиссы

**Когда использовать:**

| Сценарий | Suspense | Традиционный подход |
|----------|----------|---------------------|
| Новый проект | ✅ | ⚠️ |
| Критичные данные | ✅ | ✅ |
| Прогрессивная загрузка | ✅ | ❌ |
| Сложная обработка ошибок | ⚠️ | ✅ |
| Legacy код | ❌ | ✅ |

**Ограничения:**
- Требует React 18+
- Сложнее отладка
- Меньше контроля над loading states
- Не все библиотеки поддерживают

---

## 3. Anti-patterns

### 3.1. Хранение server state в useState

**❌ Плохо:**

```tsx
function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchUser()
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  // ...
}
```

**✅ Хорошо:**

```tsx
function UserProfile() {
  const { data: user, isLoading, error } = useQuery(['user'], fetchUser);
  // ...
}
```

**Почему плохо:**
- Нет кэширования
- Нет автоматического refetch
- Нет deduplication
- Много boilerplate

### 3.2. Игнорирование staleTime

**❌ Плохо:**

```tsx
useQuery(['posts'], fetchPosts); // staleTime = 0 (по умолчанию)
// Каждый refocus → новый запрос
```

**✅ Хорошо:**

```tsx
useQuery(['posts'], fetchPosts, {
  staleTime: 5 * 60 * 1000, // 5 минут
});
```

**Почему плохо:**
- Лишние запросы
- Нагрузка на сервер
- Плохой UX (мигание)

### 3.3. Мутации без инвалидации

**❌ Плохо:**

```tsx
const mutation = useMutation({
  mutationFn: createPost,
  // Нет инвалидации!
});
```

**✅ Хорошо:**

```tsx
const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    queryClient.invalidateQueries(['posts']);
  },
});
```

**Почему плохо:**
- Устаревшие данные в кэше
- Рассинхронизация UI и сервера

### 3.4. Нестабильные query keys

**❌ Плохо:**

```tsx
useQuery(['user', { id: userId }], fetchUser); // Новый объект каждый рендер
useQuery(['posts', Date.now()], fetchPosts); // Всегда новый ключ
```

**✅ Хорошо:**

```tsx
useQuery(['user', userId], fetchUser);
useQuery(['posts'], fetchPosts);
```

**Почему плохо:**
- Нет deduplication
- Нет кэширования
- Лишние запросы

### 3.5. Игнорирование ошибок

**❌ Плохо:**

```tsx
const { data } = useQuery(['posts'], fetchPosts);
return <PostList posts={data} />; // Что если ошибка?
```

**✅ Хорошо:**

```tsx
const { data, error, isError } = useQuery(['posts'], fetchPosts);

if (isError) {
  return <ErrorDisplay error={error} />;
}

return <PostList posts={data} />;
```

### 3.6. Избыточный prefetching

**❌ Плохо:**

```tsx
// Prefetch всех постов при hover на любой ссылке
onMouseEnter={() => {
  posts.forEach(post => {
    queryClient.prefetchQuery(['post', post.id], () => fetchPost(post.id));
  });
}}
```

**✅ Хорошо:**

```tsx
// Prefetch только конкретного поста
onMouseEnter={() => {
  queryClient.prefetchQuery(['post', post.id], () => fetchPost(post.id));
}}
```

**Почему плохо:**
- Лишняя нагрузка на сеть
- Расход батареи
- Плохой UX на медленном соединении

### 3.7. Синхронные операции в onSuccess

**❌ Плохо:**

```tsx
const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    // Синхронная навигация
    navigate('/posts');
    // Данные ещё не обновились!
  },
});
```

**✅ Хорошо:**

```tsx
const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: async () => {
    await queryClient.invalidateQueries(['posts']);
    navigate('/posts');
  },
});
```

### 3.8. Чек-лист best practices

**Перед релизом проверьте:**

- [ ] Все server state управляется через query library
- [ ] staleTime настроен для каждого query
- [ ] Мутации инвалидируют связанные queries
- [ ] Query keys стабильны и не меняются каждый рендер
- [ ] Обработка ошибок везде
- [ ] Prefetching используется разумно
- [ ] Error boundaries для критичных компонентов
- [ ] DevTools включены в development

---

## 🎓 Выводы

В этой статье мы изучили продвинутые паттерны:

1. **Optimistic Updates** — мгновенный отклик UI с rollback при ошибках
2. **React Suspense** — декларативная загрузка данных
3. **Anti-patterns** — типичные ошибки и как их избежать

### Что дальше?

В следующих статьях мы сравним популярные библиотеки data fetching:
- **Часть 4:** TanStack Query, SWR, @nexus-state/query
- **Часть 5:** Apollo Client, RTK Query, выбор решения

---

## 📚 Полезные ссылки

- [React Suspense Documentation](https://react.dev/reference/react/Suspense)
- [TanStack Query: Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Error Boundaries in React](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

---

**Понравилась статья?** Поставьте ❤️ и подпишитесь на серию!

**Вопросы?** Пишите в комментариях! 👇
