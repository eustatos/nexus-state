# Фаза 2: Структура и план

**Длительность:** 2-3 рабочих дня  
**Статус:** ⏳ Pending

---

## 🎯 Цели фазы

1. Детализировать структуру обеих частей статьи
2. Определить ключевые сообщения для каждого раздела
3. Подготовить план примеров кода
4. Создать прототипы сравнительных таблиц

---

## 📋 Задачи

### 2.1. Детальная структура Части 1 (Теория)

| # | Раздел | Подразделы | Статус |
|---|--------|------------|--------|
| 1 | **Введение** | Server state vs Client state, Проблемы | ⬜ Todo |
| 2 | **Query Caching** | TTL, Stale-while-revalidate, LRU | ⬜ Todo |
| 3 | **Request Deduplication** | Почему важно, как работает | ⬜ Todo |
| 4 | **Background Refetching** | Window focus, Reconnect, Interval | ⬜ Todo |
| 5 | **React Suspense** | Что решает, альтернативы, проблемы | ⬜ Todo |
| 6 | **Infinite Queries** | Cursor vs Offset, Bi-directional | ⬜ Todo |
| 7 | **Optimistic Updates** | Когда применять, Rollback стратегии | ⬜ Todo |
| 8 | **Mutations** | Invalidation, Refetch, Dependencies | ⬜ Todo |
| 9 | **Prefetching** | On hover, Viewport, Idle, Predictive | ⬜ Todo |
| 10 | **Error Handling** | Retry logic, Error boundaries, Fallbacks | ⬜ Todo |
| 11 | **Anti-patterns** | Частые ошибки, Как избежать | ⬜ Todo |
| 12 | **Заключение** | Ключевые выводы, Что дальше | ⬜ Todo |

### 2.2. Детальная структура Части 2 (Практика)

| # | Раздел | Подразделы | Статус |
|---|--------|------------|--------|
| 1 | **Сравнительная матрица** | Таблица всех паттернов по библиотекам | ⬜ Todo |
| 2 | **TanStack Query** | API, примеры, плюсы/минусы | ⬜ Todo |
| 3 | **SWR** | API, примеры, плюсы/минусы | ⬜ Todo |
| 4 | **@nexus-state/query** | API, примеры, уникальные фичи | ⬜ Todo |
| 5 | **Apollo Client** | GraphQL специфика, Cache policies | ⬜ Todo |
| 6 | **RTK Query** | Redux интеграция, Auto invalidation | ⬜ Todo |
| 7 | **Итоговое сравнение** | Когда что выбирать, Миграция | ⬜ Todo |

### 2.3. План примеров кода

| # | Паттерн | Библиотеки | Сложность | Статус |
|---|---------|------------|-----------|--------|
| 1 | Базовый query | Все 5 | 🟢 Easy | ⬜ Todo |
| 2 | Suspense query | Все 5 | 🟡 Medium | ⬜ Todo |
| 3 | Infinite query | Все 5 | 🟡 Medium | ⬜ Todo |
| 4 | Deduplication demo | 3 основные | 🟢 Easy | ⬜ Todo |
| 5 | Refetch стратегии | Все 5 | 🟡 Medium | ⬜ Todo |
| 6 | Mutation + optimistic | Все 5 | 🔴 Hard | ⬜ Todo |
| 7 | Prefetching | Все 5 | 🟡 Medium | ⬜ Todo |
| 8 | Error handling | Все 5 | 🟡 Medium | ⬜ Todo |

### 2.4. Прототипы таблиц

| # | Таблица | Данные | Статус |
|---|---------|--------|--------|
| 1 | API Comparison | Методы, опции, return types | ⬜ Todo |
| 2 | Bundle Size | KB, gzip, dependencies | ⬜ Todo |
| 3 | Features Matrix | Паттерны vs Библиотеки | ⬜ Todo |
| 4 | Learning Curve | Время освоения, сложность | ⬜ Todo |
| 5 | Performance | Benchmarks (если есть) | ⬜ Todo |

### 2.5. Иллюстрации и диаграммы

| # | Иллюстрация | Тип | Статус |
|---|-------------|-----|--------|
| 1 | Stale-while-revalidate схема | Диаграмма | ⬜ Todo |
| 2 | Deduplication flow | Sequence diagram | ⬜ Todo |
| 3 | Suspense lifecycle | State diagram | ⬜ Todo |
| 4 | Infinite query pagination | UI mockup | ⬜ Todo |
| 5 | Optimistic update flow | Sequence diagram | ⬜ Todo |
| 6 | Prefetching strategies | Comparison chart | ⬜ Todo |
| 7 | Library comparison radar | Radar chart | ⬜ Todo |

---

## 📐 Шаблон структуры статьи

### Часть 1: Паттерны (черновик)

```markdown
# Паттерны управления серверным состоянием в React (2026)

## Введение
- [Hook] История проблемы
- [Hook] Статистика (опрос)
- Thesis: Server state требует особого подхода

## 1. Server State vs Client State
- Определения
- Почему нельзя хранить вместе
- Таблица сравнения

## 2. Query Caching
...
```

### Часть 2: Сравнение (черновик)

```markdown
# Сравнение библиотек для data fetching (2026)

## Введение
- Критерии сравнения
- Обзор участников

## 1. TanStack Query
- Философия
- API overview
- Примеры для каждого паттерна
- Плюсы/минусы

## 2. SWR
...
```

---

## ✅ Deliverables

- [ ] Детальная структура Части 1 (Markdown)
- [ ] Детальная структуры Части 2 (Markdown)
- [ ] Список из 8+ примеров кода
- [ ] 5 прототипов сравнительных таблиц
- [ ] План иллюстраций и диаграмм
- [ ] Timeline написания (по разделам)

---

## 🚪 Definition of Done

- [ ] Структура утверждена и логична
- [ ] Все разделы имеют четкую цель
- [ ] Примеры кода покрывают все паттерны
- [ ] Таблицы готовы к заполнению
- [ ] План иллюстраций понятен дизайнеру

---

## 📝 Заметки

_Добавляйте заметки в процессе планирования_
