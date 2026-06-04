# Примеры кода для статьи

**Цель:** Рабочие примеры для всех паттернов и библиотек

---

## 📁 Структура

```
examples/
├── 01-basic-query/
│   ├── react-query/
│   ├── swr/
│   ├── nexus-state/
│   ├── apollo/
│   └── rtk-query/
├── 02-suspense/
├── 03-infinite-cursor/
├── 04-infinite-offset/
├── 05-deduplication/
├── 06-refetch/
├── 07-optimistic/
├── 08-mutation/
├── 09-prefetch/
└── 10-error-handling/
```

---

## 📋 Примеры

### 01. Basic Query

**Паттерн:** Базовый запрос данных

| Библиотека | Файл | Статус |
|------------|------|--------|
| TanStack Query | `01-basic-query/react-query/UserList.tsx` | ⬜ Todo |
| SWR | `01-basic-query/swr/UserList.tsx` | ⬜ Todo |
| @nexus-state/query | `01-basic-query/nexus-state/UserList.tsx` | ⬜ Todo |
| Apollo Client | `01-basic-query/apollo/UserList.tsx` | ⬜ Todo |
| RTK Query | `01-basic-query/rtk-query/UserList.tsx` | ⬜ Todo |

---

### 02. Suspense Query

**Паттерн:** React Suspense для data fetching

| Библиотека | Файл | Статус |
|------------|------|--------|
| TanStack Query | `02-suspense/react-query/UserProfile.tsx` | ⬜ Todo |
| SWR | `02-suspense/swr/UserProfile.tsx` | ⬜ Todo |
| @nexus-state/query | `02-suspense/nexus-state/UserProfile.tsx` | ⬜ Todo |
| Apollo Client | `02-suspense/apollo/UserProfile.tsx` | ⬜ Todo |
| RTK Query | `02-suspense/rtk-query/UserProfile.tsx` | ⬜ Todo |

---

### 03. Infinite Query (Cursor)

**Паттерн:** Бесконечная прокрутка с cursor-based pagination

| Библиотека | Файл | Статус |
|------------|------|--------|
| TanStack Query | `03-infinite-cursor/react-query/PostList.tsx` | ⬜ Todo |
| SWR | `03-infinite-cursor/swr/PostList.tsx` | ⬜ Todo |
| @nexus-state/query | `03-infinite-cursor/nexus-state/PostList.tsx` | ⬜ Todo |
| Apollo Client | `03-infinite-cursor/apollo/PostList.tsx` | ⬜ Todo |
| RTK Query | `03-infinite-cursor/rtk-query/PostList.tsx` | ⬜ Todo |

---

### 04. Infinite Query (Offset)

**Паттерн:** Бесконечная прокрутка с offset-based pagination

| Библиотека | Файл | Статус |
|------------|------|--------|
| TanStack Query | `04-infinite-offset/react-query/PostList.tsx` | ⬜ Todo |
| SWR | `04-infinite-offset/swr/PostList.tsx` | ⬜ Todo |
| @nexus-state/query | `04-infinite-offset/nexus-state/PostList.tsx` | ⬜ Todo |
| Apollo Client | `04-infinite-offset/apollo/PostList.tsx` | ⬜ Todo |
| RTK Query | `04-infinite-offset/rtk-query/PostList.tsx` | ⬜ Todo |

---

### 05. Deduplication

**Паттерн:** Автоматическая дедупликация запросов

| Библиотека | Файл | Статус |
|------------|------|--------|
| TanStack Query | `05-deduplication/react-query/Demo.tsx` | ⬜ Todo |
| SWR | `05-deduplication/swr/Demo.tsx` | ⬜ Todo |
| @nexus-state/query | `05-deduplication/nexus-state/Demo.tsx` | ⬜ Todo |

---

### 06. Refetch Strategies

**Паттерн:** Стратегии повторного запроса

| Библиотека | Файл | Статус |
|------------|------|--------|
| TanStack Query | `06-refetch/react-query/RefetchDemo.tsx` | ⬜ Todo |
| SWR | `06-refetch/swr/RefetchDemo.tsx` | ⬜ Todo |
| @nexus-state/query | `06-refetch/nexus-state/RefetchDemo.tsx` | ⬜ Todo |
| Apollo Client | `06-refetch/apollo/RefetchDemo.tsx` | ⬜ Todo |
| RTK Query | `06-refetch/rtk-query/RefetchDemo.tsx` | ⬜ Todo |

**Сценарии:**
- [ ] on window focus
- [ ] on reconnect
- [ ] interval refetch
- [ ] manual refetch

---

### 07. Optimistic Updates

**Паттерн:** Оптимистичное обновление UI

| Библиотека | Файл | Статус |
|------------|------|--------|
| TanStack Query | `07-optimistic/react-query/TodoList.tsx` | ⬜ Todo |
| SWR | `07-optimistic/swr/TodoList.tsx` | ⬜ Todo |
| @nexus-state/query | `07-optimistic/nexus-state/TodoList.tsx` | ⬜ Todo |
| Apollo Client | `07-optimistic/apollo/TodoList.tsx` | ⬜ Todo |
| RTK Query | `07-optimistic/rtk-query/TodoList.tsx` | ⬜ Todo |

---

### 08. Mutation + Invalidation

**Паттерн:** Мутации с инвалидацией запросов

| Библиотека | Файл | Статус |
|------------|------|--------|
| TanStack Query | `08-mutation/react-query/CreatePost.tsx` | ⬜ Todo |
| SWR | `08-mutation/swr/CreatePost.tsx` | ⬜ Todo |
| @nexus-state/query | `08-mutation/nexus-state/CreatePost.tsx` | ⬜ Todo |
| Apollo Client | `08-mutation/apollo/CreatePost.tsx` | ⬜ Todo |
| RTK Query | `08-mutation/rtk-query/CreatePost.tsx` | ⬜ Todo |

---

### 09. Prefetching

**Паттерн:** Предварительная загрузка данных

| Библиотека | Файл | Статус |
|------------|------|--------|
| TanStack Query | `09-prefetch/react-query/PrefetchDemo.tsx` | ⬜ Todo |
| SWR | `09-prefetch/swr/PrefetchDemo.tsx` | ⬜ Todo |
| @nexus-state/query | `09-prefetch/nexus-state/PrefetchDemo.tsx` | ⬜ Todo |
| Apollo Client | `09-prefetch/apollo/PrefetchDemo.tsx` | ⬜ Todo |
| RTK Query | `09-prefetch/rtk-query/PrefetchDemo.tsx` | ⬜ Todo |

**Стратегии:**
- [ ] on hover
- [ ] on viewport
- [ ] on idle
- [ ] on focus
- [ ] predictive

---

### 10. Error Handling

**Паттерн:** Обработка ошибок и retry logic

| Библиотека | Файл | Статус |
|------------|------|--------|
| TanStack Query | `10-error-handling/react-query/ErrorDemo.tsx` | ⬜ Todo |
| SWR | `10-error-handling/swr/ErrorDemo.tsx` | ⬜ Todo |
| @nexus-state/query | `10-error-handling/nexus-state/ErrorDemo.tsx` | ⬜ Todo |
| Apollo Client | `10-error-handling/apollo/ErrorDemo.tsx` | ⬜ Todo |
| RTK Query | `10-error-handling/rtk-query/ErrorDemo.tsx` | ⬜ Todo |

**Сценарии:**
- [ ] Error boundary integration
- [ ] Retry with delay
- [ ] Fallback UI
- [ ] Error toast notification

---

## 🛠️ Требования к примерам

### Общие
- [ ] TypeScript с строгими типами
- [ ] Рабочий код (протестирован)
- [ ] Комментарии к сложным местам
- [ ] Единый стиль форматирования
- [ ] Минимум зависимостей

### Для каждого примера
- [ ] Файл компонента (.tsx)
- [ ] Файл API mock (.ts)
- [ ] Файл типов (.ts)
- [ ] README с инструкцией запуска

### CodeSandbox (опционально)
- [ ] Создать sandbox для каждого паттерна
- [ ] Добавить ссылки в статью
- [ ] Проверить работу онлайн

---

## 📝 Заметки

_Добавляйте заметки в процессе создания примеров_
