# Часть 1: Паттерны управления серверным состоянием

**Формат:** Evergreen теория (срок жизни 5-7 лет)  
**Объём:** ~7,200 слов  
**Время чтения:** 25-30 минут  
**Уровень:** От новичка до продвинутого

---

## 📋 Оптимизированная структура (от простого к сложному)

### Уровень 1: Базовые концепции (🟢 Low)

| № | Раздел | Слов | Время | Зависимости |
|---|--------|------|-------|-------------|
| 0 | Введение | 400 | 1 мин | — |
| 1 | Server State vs Client State | 600 | 2 мин | — |
| 2 | Query Caching | 800 | 3 мин | #1 |
| 3 | Basic Query Pattern 🆕 | 500 | 2 мин | #2 |
| 4 | Request Deduplication | 500 | 2 мин | — |

### Уровень 2: Средние концепции (🟡 Medium)

| № | Раздел | Слов | Время | Зависимости |
|---|--------|------|-------|-------------|
| 5 | Background Refetching | 600 | 2 мин | #2 |
| 6 | Error Handling & Retry 📍 | 700 | 3 мин | #3 |
| 7 | Mutations & Invalidation 📍 | 700 | 3 мин | #2 |
| 8 | Infinite Queries | 800 | 3 мин | #2 |
| 9 | Prefetching Strategies | 700 | 3 мин | #2 |

### Уровень 3: Продвинутые концепции (🔴 High)

| № | Раздел | Слов | Время | Зависимости |
|---|--------|------|-------|-------------|
| 10 | Optimistic Updates 📍 | 800 | 3 мин | #7 |
| 11 | React Suspense 📍 | 1000 | 4 мин | #2, #6, #7 |
| 12 | Anti-patterns | 500 | 2 мин | Все |

**Итого:** ~7,200 слов | ~28 минут

---

## 📝 Детальная структура

### Введение (~400 слов)

```markdown
1. Hook: Эволюция data fetching (2-3 абзаца)
   - От XMLHttpRequest к современным решениям
   - Почему это всё ещё проблема в 2026

2. Контекст: Почему это важно
   - Сколько времени разработчики тратят на data fetching
   - Проблемы без правильного подхода

3. Thesis statement
   - Server state требует особого подхода
   - Паттерны важнее инструментов
   - Этот гайд охватывает все основные концепции

4. Roadmap статьи
   - Часть 1: Паттерны (framework-agnostic)
   - Часть 2: Реализации (сравнение библиотек)
   - Как использовать материал (последовательно / выборочно)
```

**Ключевые элементы:**
- Цитата из React Team про server vs client state
- Ссылка на State of JS 2025
- Preview сравнительной таблицы из Части 2

---

## Уровень 1: Базовые концепции

### 1. Server State vs Client State (~600 слов)

#### 1.1. Определения (~200 слов)

**Server State:**
- Хранится на сервере
- Не принадлежит вам
- Может измениться без вашего ведома
- Требует синхронизации
- Асинхронные операции

**Client State:**
- Хранится локально
- Полностью под вашим контролем
- Предсказуемо
- Не требует синхронизации
- Синхронные операции

**Примеры:**

| Server State | Client State |
|--------------|--------------|
| Пользовательские данные | UI состояние (modal open/close) |
| Посты, комментарии | Форма (до отправки) |
| Настройки аккаунта | Тема оформления |
| Товары в каталоге | Язык интерфейса |
| Статус заказа | Sidebar collapsed/expanded |

#### 1.2. Почему нельзя хранить вместе (~250 слов)

**Проблемы смешивания:**

| Проблема | Описание | Пример |
|----------|----------|--------|
| **Рассинхронизация** | Server state устаревает | Кэш не обновляется, показываются старые данные |
| **Лишний boilerplate** | Ручное управление loading/error | 5 состояний в компоненте |
| **Сложность отладки** | Непонятно где проблема | UI баг или сеть? |
| **Плохой UX** | Показываются устаревшие данные | Кэш не инвалидируется |

**Код до/после:**

```tsx
// ❌ До: Смешивание состояний
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [stale, setStale] = useState(false);

useEffect(() => {
  fetchUsers().then(setUsers).catch(setError).finally(() => setLoading(false));
}, []);

// ✅ После: Разделение
const { data: users, isLoading, error, isStale } = useQuery(['users'], fetchUsers);
```

#### 1.3. Таблица сравнения (~150 слов)

| Характеристика | Server State | Client State |
|----------------|--------------|--------------|
| **Источник** | Сервер / API | Локально (память, localStorage) |
| **Владелец** | Сервер | Клиент |
| **Синхронизация** | Требуется | Не нужна |
| **Персистентность** | На сервере | В памяти / localStorage |
| **Обновления** | Асинхронные | Синхронные |
| **Кэширование** | Обязательно | Опционально |
| **Инвалидация** | По времени/событию | По изменению |
| **Ошибка сети** | Влияет | Не влияет |

**Выводы раздела:**
- Server state требует специальных инструментов
- Кэширование обязательно
- Инвалидация критична
- Нельзя обрабатывать как client state

---

### 2. Query Caching (~800 слов)

#### 2.1. Что такое кэширование запросов (~150 слов)

**Определение:**
Сохранение результатов запросов для повторного использования без повторного сетевого вызова.

**Зачем нужно:**
- ⚡ Ускорение отклика UI (мгновенные данные из кэша)
- 📉 Снижение нагрузки на сервер (меньше запросов)
- 🌐 Офлайн работа (ограниченная, показ кэша)
- 💰 Экономия трафика (особенно важно для мобильных)

#### 2.2. Stale-while-revalidate стратегия (~300 слов)

**RFC 5861 определение:**

```
Stale-while-revalidate:
1. Показываем кэш (даже если устарел)
2. Асинхронно обновляем кэш в фоне
3. Следующий рендер — свежие данные
```

**Визуализация:**

```
Время:    0ms      100ms     5000ms    5100ms
          │────────│─────────│─────────│
Кэш:      [Свежий] → [Stale] → [Stale] → [Свежий]
UI:       Показываем кэш → Показываем кэш → Показываем новые данные
Запрос:            └─────────────┘
                   Background refetch
```

**Реализация в библиотеках:**

```tsx
// TanStack Query
useQuery({ queryKey: ['users'], queryFn: fetchUsers, staleTime: 5 * 60 * 1000 });

// SWR
useSWR('users', fetcher, { staleTime: 0 }); // Stale сразу

// @nexus-state/query
useQuery('users', fetchUsers, { staleTime: 5 * 60 * 1000 });
```

#### 2.3. TTL (Time To Live) (~200 слов)

**Как работает:**

```
t=0:      Данные получены → [Свежие ✓]
t=2min:   Всё ещё свежие (staleTime=5min) [Свежие ✓]
t=6min:   Данные stale → нужен refetch [Stale ⚠️]
t=10min:  Данные удалены из кэша (gcTime=10min) [Удалено]
```

**Рекомендации по выбору staleTime:**

| Тип данных | Рекомендуемый staleTime | Обоснование |
|------------|------------------------|-------------|
| Профиль пользователя | 5-10 минут | Редко меняется |
| Лента новостей | 1-2 минуты | Часто обновляется |
| Котировки акций | 10-30 секунд | Высокая волатильность |
| Настройки | 30+ минут | Почти статичны |
| Статус заказа | 30 секунд | Критично актуально |
| Публичные данные (API) | 5-15 минут | Баланс актуальность/нагрузка |

#### 2.4. LRU eviction (~150 слов)

**Least Recently Used:**
Алгоритм вытеснения наименее используемых данных из кэша.

**Как работает:**

```
Кэш: [A, B, C, D] (max: 4 элемента)

1. Запрос E → [A, B, C, D, E]
2. Превышен лимит → удалить наименее используемый
3. Кэш: [B, C, D, E] (A удалён, если не использовался)
```

**Настройка gcTime:**

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 10, // 10 минут до удаления из кэша
    },
  },
});
```

**Best practices:**
- Не хранить слишком долго (память)
- Не удалять слишком быстро (лишние запросы)
- Учитывать тип данных (статичные vs динамичные)

---

### 3. Basic Query Pattern 🆕 (~500 слов)

#### 3.1. Жизненный цикл запроса (~200 слов)

**Состояния query:**

```
┌─────────┐     ┌──────────┐     ┌───────────┐
│  idle   │ ──→ │ loading  │ ──→ │  success  │
└─────────┘     └──────────┘     └───────────┘
                     │                │
                     ↓                ↓
               ┌──────────┐     ┌──────────┐
               │  error   │     │  stale   │
               └──────────┘     └──────────┘
```

**Описания состояний:**

| Состояние | Описание | Когда |
|-----------|----------|-------|
| **idle** | Запрос ещё не начался | Initial render |
| **loading** | Запрос в процессе | Ожидание ответа |
| **success** | Данные получены | Response 200 OK |
| **error** | Ошибка запроса | Response 4xx/5xx, network error |
| **stale** | Данные устарели | Прошло staleTime |

#### 3.2. Базовый API (абстрактный) (~150 слов)

```javascript
// Концептуальный API (framework-agnostic)
const query = createQuery({
  key: 'users',           // Уникальный идентификатор
  fn: fetchUsers,         // Функция запроса
  staleTime: 300000,      // 5 минут
  retry: 3,               // Количество попыток
});

// Результат
{
  data: undefined,        // Данные (T | undefined)
  error: null,            // Ошибка (Error | null)
  status: 'loading',      // 'idle' | 'loading' | 'success' | 'error'
  isLoading: true,        // Булево: loading
  isSuccess: false,       // Булево: success
  isError: false,         // Булево: error
  isStale: false,         // Булево: stale
  refetch: () => {},      // Функция повторного запроса
  remove: () => {},       // Удалить из кэша
}
```

#### 3.3. Примеры для фреймворков (~150 слов)

**React:**

```tsx
const { data, isLoading, error, refetch } = useQuery(['users'], fetchUsers);
```

**Vue:**

```tsx
const { data, isLoading, error, refetch } = useQuery(['users'], fetchUsers);
```

**Svelte:**

```tsx
const { data, isLoading, error, refetch } = query(['users'], fetchUsers);
```

**Vanilla JS:**

```tsx
const query = createQuery(store, {
  queryKey: 'users',
  queryFn: fetchUsers,
});

query.subscribe((result) => {
  console.log(result.data);
});
```

---

### 4. Request Deduplication (~500 слов)

#### 4.1. Проблема дублирования (~150 слов)

**Сценарий:**

```tsx
function App() {
  return (
    <>
      <Header />    // useQuery('user-1')
      <Sidebar />   // useQuery('user-1')
      <Main />      // useQuery('user-1')
    </>
  );
}
// Без deduplication: 3 запроса ❌
// С deduplication: 1 запрос ✅
```

**Почему это происходит:**
- Несколько компонентов используют одни данные
- Каждый компонент монтируется независимо
- Без координации → каждый делает запрос

#### 4.2. Как работает дедупликация (~200 слов)

**Механизм:**

```
t=0ms:   Компонент A → useQuery('user-1') → [Запрос отправлен]
t=10ms:  Компонент B → useQuery('user-1') → [Подписка на тот же запрос]
t=15ms:  Компонент C → useQuery('user-1') → [Подписка на тот же запрос]
t=100ms: Ответ получен → [Все 3 компонента получают данные]
```

**Окно дедупликации:**

| Библиотека | Окно | Настройка |
|------------|------|-----------|
| TanStack Query | 100ms | Встроенное (не настраивается) |
| SWR | 2000ms | `dedupingInterval: 2000` |
| @nexus-state/query | 100ms | Встроенное |

**Преимущества:**
- ⚡ Меньше запросов к серверу
- 💰 Экономия трафика
- 🎯 Предотвращение race conditions
- 📊 Гарантированный порядок ответов

#### 4.3. Best practices (~150 слов)

**Стабильные query keys:**

```tsx
// ✅ Хорошо: Стабильная ссылка
useQuery(['user', userId], fetchUser);

// ❌ Плохо: Новая ссылка каждый рендер
useQuery(['user', Date.now()], fetchUser);
useQuery(['user', { id: userId }], fetchUser); // Объект каждый раз новый
```

**Нормализация ключей:**

```tsx
// ✅ Хорошо: Сериализация
const key = ['posts', JSON.stringify({ sort, filter })];

// ✅ Хорошо: Flat structure
const key = ['posts', sort, filter];

// ❌ Плохо: Разные объекты
useQuery(['posts', { sort: 'asc' }], fetchPosts);
useQuery(['posts', { sort: 'asc' }], fetchPosts); // Разные ссылки!
```

---

## Уровень 2: Средние концепции

### 5. Background Refetching (~600 слов)

#### 5.1. Window Focus refetch (~150 слов)

**Зачем:**
Пользователь ушёл на другую вкладку → данные могли устареть.

**Реализация:**

```tsx
// TanStack Query
useQuery(['posts'], fetchPosts, {
  refetchOnWindowFocus: true, // По умолчанию true
});

// SWR
useSWR('posts', fetcher, {
  revalidateOnFocus: true,
  focusThrottleInterval: 1000,
});

// @nexus-state/query
useQuery('posts', fetchPosts, {
  refetchOnWindowFocus: true,
});
```

**Когда отключать:**
- Данные редко меняются (статичные справочники)
- Пользователь часто переключает вкладки (раздражает)
- Есть более эффективный способ обновления (WebSocket)

#### 5.2. Reconnect refetch (~100 слов)

**Зачем:**
Сетевое соединение прерывалось → данные могли устареть.

```tsx
useQuery(['posts'], fetchPosts, {
  refetchOnReconnect: true, // По умолчанию true
});
```

**Важно:**
- Работает только online → offline → online
- Не путать с window focus
- Критично для мобильных приложений

#### 5.3. Interval refetch (~200 слов)

**Зачем:**
Данные должны обновляться периодически (дашборды, тикеры).

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

#### 5.4. Conditional refetch (~150 слов)

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

### 6. Error Handling & Retry 📍 (~700 слов)

#### 6.1. Базовая обработка (~150 слов)

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

#### 6.2. Retry logic (~200 слов)

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
- Не retry для 4xx ошибок (клиентская ошибка)
- Retry для network errors и 5xx
- Максимум 3-5 попыток
- Exponential delay для снижения нагрузки

#### 6.3. Error Boundaries (~200 слов)

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
- Критичные компоненты (без них UI не работает)
- Suspense компоненты (ошибки выбрасываются)
- Границы функциональности (изолировать сбои)

#### 6.4. Fallback UI (~150 слов)

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

### 7. Mutations & Invalidation 📍 (~700 слов)

#### 7.1. Что такое Mutation (~100 слов)

**Определение:**
Изменение данных на сервере (CREATE, UPDATE, DELETE).

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

#### 7.2. Базовый паттерн (~200 слов)

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

#### 7.3. Invalidation стратегий (~250 слов)

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

#### 7.4. Dependent queries (~150 слов)

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

### 8. Infinite Queries (~800 слов)

#### 8.1. Что такое Infinite Query (~100 слов)

**Определение:**
Паттерн для загрузки данных с пагинацией, где пользователь может скроллить бесконечно.

**Use cases:**
- 📱 Социальные ленты
- 💬 Комментарии
- 🔍 Поисковые результаты
- 🛒 Каталоги товаров

#### 8.2. Cursor-based Pagination (~250 слов)

**Описание:**
Использует курсор (уникальный идентификатор) для указания позиции.

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

#### 8.3. Offset-based Pagination (~200 слов)

**Описание:**
Использует смещение (offset) и лимит (limit).

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

#### 8.4. Сравнение подходов (~100 слов)

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

#### 8.5. Intersection Observer для автоскролла (~150 слов)

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

### 9. Prefetching Strategies (~700 слов)

#### 9.1. Что такое Prefetching (~100 слов)

**Определение:**
Предварительная загрузка данных до того, как они понадобятся.

**Цель:**
Улучшение perceived performance (данные уже готовы).

**Риски:**
- ⚠️ Лишняя нагрузка на сеть
- ⚠️ Загрузка ненужных данных
- ⚠️ Батарея (мобильные)

#### 9.2. On Hover prefetch (~150 слов)

**Зачем:**
Пользователь навёл курсор → вероятно кликнет.

```tsx
const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 1000 * 60,
  });
};
```

**Задержка:**
- 100-300ms для предотвращения ложных срабатываний

**Use cases:**
- Ссылки в списке
- Кнопки действий
- Карточки товаров

#### 9.3. On Viewport prefetch (~150 слов)

**Зачем:**
Контент скоро станет видимым.

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

#### 9.4. On Idle prefetch (~100 слов)

**Зачем:**
Использовать простое время браузера.

```tsx
usePrefetchOnIdle([
  { queryKey: 'user', queryFn: fetchUser },
  { queryKey: 'posts', queryFn: fetchPosts },
]);
```

**Преимущество:**
Минимальное влияние на UX.

#### 9.5. On Focus prefetch (~100 слов)

**Зачем:**
Пользователь сфокусировался на элементе → вероятно взаимодействует.

```tsx
const { onFocus } = usePrefetchOnFocus({
  queryKey: 'search-results',
  queryFn: fetchSearchResults,
  delay: 100,
});

<input onFocus={onFocus} />
```

#### 9.6. Сравнение стратегий (~100 слов)

| Стратегия | Latency | Network Impact | Рекомендация |
|-----------|---------|----------------|--------------|
| **On Hover** | ~100-300ms | Низкий | Ссылки, кнопки |
| **On Viewport** | ~200-500ms | Средний | Секции, карточки |
| **On Idle** | ~1-5s | Минимальный | Фоновые данные |
| **On Focus** | ~50-200ms | Низкий | Формы, input |
| **Programmatic** | Immediate | Контроль | Предсказуемые сценарии |

---

## Уровень 3: Продвинутые концепции

### 10. Optimistic Updates 📍 (~800 слов)

#### 10.1. Что такое Optimistic Updates (~100 слов)

**Определение:**
Мгновенное обновление UI до подтверждения сервера.

**Зачем:**
- ⚡ Улучшение perceived performance
- 🎯 Мгновенный отклик
- 😊 Лучший UX

**Риски:**
- ⚠️ Нужен rollback при ошибке
- ⚠️ Усложнение логики
- ⚠️ Дезориентация пользователя при rollback

#### 10.2. Паттерн реализации (~300 слов)

**Алгоритм:**

```
1. Сохранить текущее состояние (для rollback)
2. Оптимистично обновить UI
3. Отправить запрос на сервер
4. Если успех → подтвердить обновление
5. Если ошибка → откатить к сохранённому состоянию
```

**Пример:**

```tsx
const mutation = useMutation({
  mutationFn: updateTodo,
  
  // 1. Сохраняем контекст
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

#### 10.3. Когда применять (~200 слов)

| Сценарий | Рекомендация | Обоснование |
|----------|--------------|-------------|
| Лайки/реакции | ✅ Всегда | Низкий риск, обратимо |
| Добавление в корзину | ✅ Всегда | Обратимо, низкий риск |
| Отправка сообщения | ✅ Часто | Пользователь видит сразу |
| Финансовые операции | ❌ Никогда | Высокий риск, необратимо |
| Удаление данных | ⚠️ Осторожно | Нужен undo |
| Изменение настроек | ⚠️ Зависит | Критичность данных |

#### 10.4. Best practices (~200 слов)

**Визуальная индикация pending:**

```tsx
<li className={isPending ? 'pending' : ''}>
  {todo.title}
  {isPending && <Spinner />}
</li>
```

**Undo для критичных операций:**

```tsx
const [undoTimeout, setUndoTimeout] = useState(null);

onSuccess: () => {
  const timeout = setTimeout(() => {
    // Confirm after 5 seconds
  }, 5000);
  setUndoTimeout(timeout);
};

onUndo: () => {
  clearTimeout(undoTimeout);
  rollback();
};
```

**Текст для пользователя:**

```tsx
{isPending && <span className="pending-indicator">Сохранение...</span>}
{isError && <span className="error-indicator">Ошибка. Отмена изменений.</span>}
```

---

### 11. React Suspense 📍 (~1000 слов)

#### 11.1. Что такое Suspense (~150 слов)

**Определение:**
Механизм React для декларативного управления асинхронными операциями.

**Ключевая идея:**
Компонент «приостанавливает» рендеринг до готовности данных.

```tsx
// Традиционный подход
if (isLoading) return <Loading />;
return <Data data={data} />;

// Suspense подход
<Suspense fallback={<Loading />}>
  <Data data={data} />
</Suspense>
```

**Важно:** React-специфичная фичия (для других фреймворков есть аналоги)

#### 11.2. Как работает Suspense (~250 слов)

**Механизм:**

```
1. Компонент начинает рендеринг
2. useSuspenseQuery начинает fetch
3. Если данных нет → throw Promise
4. Suspense Boundary ловит Promise
5. Рендерится fallback
6. Promise разрешается → повторный рендер
7. Компонент рендерится с данными
```

**Диаграмма состояний:**

```
┌─────────────┐
│   Mount     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Throw Promise│ ← useSuspenseQuery
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Fallback  │ ← Suspense fallback
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Success   │ ← Promise resolved
└─────────────┘
```

#### 11.3. Преимущества (~200 слов)

| Преимущество | Описание | Пример |
|--------------|----------|--------|
| **Declarative Loading** | Не нужно управлять loading state | Меньше кода |
| **Waterfall Prevention** | Параллельная загрузка | Все запросы сразу |
| **Coordinated Transitions** | Синхронное обновление | Нет partial UI |
| **Better UX** | Показываем UI когда всё готово | Нет «мигания» |
| **Simpler Code** | Меньше бойлерплейта | Нет `if (loading)` |

**Пример waterfall prevention:**

```tsx
// ❌ Без Suspense: Waterfall
function Profile() {
  const { data: user } = useQuery('user', fetchUser);
  const { data: posts } = useQuery('posts', () => fetchPosts(user.id));
  // posts ждёт completion user
}

// ✅ С Suspense: Параллельно
function Profile() {
  const { data: user } = useSuspenseQuery('user', fetchUser);
  const { data: posts } = useSuspenseQuery('posts', fetchPosts);
  // Оба запроса начинаются одновременно
}
```

#### 11.4. Ограничения (~200 слов)

| Ограничение | Описание | Workaround |
|-------------|----------|------------|
| **Error Boundaries Required** | Нужны для обработки ошибок | Обёртывать в ErrorBoundary |
| **React 18+** | Полная поддержка только в 18+ | Использовать useQuery для старых |
| **Learning Curve** | Новый менталитет | Постепенное внедрение |
| **SSR Complexity** | Усложняет серверный рендеринг | Next.js, Remix решают |
| **Framework-specific** | Только React | Для других фреймворков — аналоги |

#### 11.5. Best practices (~200 слов)

**Nested Suspense для постепенной загрузки:**

```tsx
<Suspense fallback={<PageSkeleton />}>
  <ProfileSection />
  <Suspense fallback={<PostsSkeleton />}>
    <PostsSection />
  </Suspense>
</Suspense>
```

**Error Boundary + Suspense:**

```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <Suspense fallback={<Loading />}>
    <UserProfile />
  </Suspense>
</ErrorBoundary>
```

**Не выбрасывать ошибки вручную:**

```tsx
// ❌ Плохо
throw new Error('Loading...');

// ✅ Хорошо
const { data } = useSuspenseQuery('user', fetchUser);
```

---

### 12. Anti-patterns (~500 слов)

#### 12.1. Хранение server state в client state

```tsx
// ❌ Плохо
const [users, setUsers] = useState([]);
useEffect(() => {
  fetchUsers().then(setUsers);
}, []);

// ✅ Хорошо
const { data: users } = useQuery(['users'], fetchUsers);
```

#### 12.2. Отсутствие кэширования

```tsx
// ❌ Плохо
useQuery(['users'], fetchUsers, { staleTime: 0 });

// ✅ Хорошо
useQuery(['users'], fetchUsers, { staleTime: 5 * 60 * 1000 });
```

#### 12.3. Игнорирование error states

```tsx
// ❌ Плохо
const { data } = useQuery(['users'], fetchUsers);
return <div>{data.map(...)}</div>; // Crash если error

// ✅ Хорошо
const { data, error, isLoading } = useQuery(['users'], fetchUsers);
if (error) return <ErrorDisplay />;
return <div>{data?.map(...)}</div>;
```

#### 12.4. Нестабильные query keys

```tsx
// ❌ Плохо
useQuery(['user', Date.now()], fetchUser);

// ✅ Хорошо
useQuery(['user', userId], fetchUser);
```

#### 12.5. Отсутствие инвалидации

```tsx
// ❌ Плохо
const createPost = useMutation({
  mutationFn: createPost,
  // Нет инвалидации после создания
});

// ✅ Хорошо
const createPost = useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    queryClient.invalidateQueries(['posts']);
  },
});
```

---

## Заключение (~300 слов)

### Ключевые выводы

1. **Server state ≠ Client state**
   - Требует специальных инструментов
   - Кэширование обязательно
   - Инвалидация критична

2. **Паттерны важнее инструментов**
   - Stale-while-revalidate
   - Deduplication
   - Optimistic updates
   - Эти паттерны работают в любом фреймворке

3. **Прогрессия изучения**
   - Начните с базовых концепций (кэширование, query lifecycle)
   - Перейдите к средним (refetch, mutations, infinite)
   - Освойте продвинутые (optimistic, Suspense)

4. **Выбор инструмента зависит от контекста**
   - React → TanStack Query, SWR
   - Vue → Vue Query
   - Svelte → Svelte Query
   - Multi-framework → @nexus-state/query

### Что дальше

- **Часть 2:** Сравнение библиотек для каждого фреймворка
- **Практические примеры:** Код для всех паттернов
- **Decision guide:** Как выбрать для вашего проекта

---

## 🔬 Методология материала

Этот гайд основан на:

1. **Практическом опыте** — использование всех рассмотренных библиотек в production-проектах (2024-2026)

2. **Исследовании документации** — детальный анализ API каждой библиотеки на актуальные версии

3. **Сравнительном тестировании** — реализация одинаковых паттернов на разных библиотеках

4. **Опыте сообщества** — feedback от разработчиков, использующих эти инструменты ежедневно

**Ограничения:**
- Тесты проводились на учебных и production проектах ограниченного масштаба
- Production-опыт варьируется по библиотекам
- Версии актуальны на Q1 2026

---

## 🤝 Ваш опыт важен

Эта статья — живой материал. Если вы:

- Нашли неточность или устаревшую информацию
- Имеете опыт с библиотеками, не охваченными в статье
- Хотите поделиться интересным паттерном

**Напишите в комментариях** — лучшие инсайты будут включены в следующие обновления с указанием авторства.

[Открыть Issue на GitHub](ссылка) | [Обсудить в комментариях](ссылка)

*Последнее обновление: март 2026*

---

## 📊 Метрики раздела

| Раздел | Слов | Время чтения | Уровень |
|--------|------|--------------|---------|
| Введение | 400 | 1 мин | — |
| 1. Server vs Client | 600 | 2 мин | 🟢 Low |
| 2. Query Caching | 800 | 3 мин | 🟢 Low |
| 3. Basic Query Pattern | 500 | 2 мин | 🟢 Low |
| 4. Deduplication | 500 | 2 мин | 🟢 Low |
| 5. Refetching | 600 | 2 мин | 🟡 Medium |
| 6. Error Handling | 700 | 3 мин | 🟡 Medium |
| 7. Mutations | 700 | 3 мин | 🟡 Medium |
| 8. Infinite Queries | 800 | 3 мин | 🟡 Medium |
| 9. Prefetching | 700 | 3 мин | 🟡 Medium |
| 10. Optimistic Updates | 800 | 3 мин | 🔴 High |
| 11. Suspense | 1000 | 4 мин | 🔴 High |
| 12. Anti-patterns | 500 | 2 мин | 🔴 High |
| Заключение | 300 | 1 мин | — |
| **Итого** | **~7,200** | **~28 мин** | — |
