# Фаза: Улучшения @nexus-state/query

## Цель
Улучшить эргономику и типизацию `@nexus-state/query` для соответствия ожиданиям разработчиков, знакомых с TanStack Query.

## Проблемы текущей реализации

### 1. Отсутствие автоматического вывода типов переменных мутации

**Проблема:**
```typescript
// TanStack Query - работает
const mutation = useMutation({
  mutationFn: (id: number) => api.archive(id),
});
mutation.mutate(123);  // ✅ OK

// @nexus-state/query - НЕ работает без явных типов
const mutation = useMutation({
  mutationFn: (id: number) => api.archive(id),
});
mutation.mutate(123);  // ❌ Ошибка: ожидается void
```

**Причина:** `TVariables = void` по умолчанию в сигнатуре `useMutation`.

### 2. Сложная типизация для мутаций с Axios

**Проблема:**
```typescript
// API возвращает AxiosResponse<T>
dictionaryApi.archiveDictionary(id): Promise<AxiosResponse<Dictionary>>

// Требуется ручное извлечение данных
mutationFn: (id) => 
  dictionaryApi.archiveDictionary(id).then((r) => r.data.id)
```

## Задачи фазы

| # | Задача | Приоритет | Сложность | Статус |
|---|--------|-----------|-----------|--------|
| 001 | Добавить автоматический вывод TVariables из mutationFn | Высокий | Средняя | 📋 Pending |
| 002 | Добавить хелперы для работы с AxiosResponse | Средний | Низкая | 📋 Pending |
| 003 | Улучшить документацию по типизации мутаций | Средний | Низкая | 📋 Pending |
| 004 | Добавить перегрузки функций для упрощения API | Низкий | Высокая | 📋 Pending |

## План реализации

### Задача 001: Автоматический вывод TVariables

**Файлы для изменения:**
- `packages/query/src/react/useMutation.tsx`
- `packages/query/src/types.ts`

**Критерии приёмки:**
- [ ] TypeScript выводит `TVariables` из `mutationFn` автоматически
- [ ] Сохранена обратная совместимость с явной типизацией
- [ ] Все существующие тесты проходят
- [ ] Добавлены тесты на вывод типов

### Задача 002: Axios хелперы

**Файлы для изменения:**
- `packages/query/src/axios-helpers.ts` (новый)
- `packages/query/src/index.ts`

**Критерии приёмки:**
- [ ] Добавлена функция `unwrapAxiosResponse()`
- [ ] Добавлен тип `AxiosResponseMapper`
- [ ] Документация использования с Axios

### Задача 003: Документация

**Файлы для изменения:**
- `packages/query/README.md`
- `docs/query/mutations.md`

**Критерии приёмки:**
- [ ] Руководство по типизации мутаций
- [ ] Примеры для разных сценариев
- [ ] Сравнение с TanStack Query

### Задача 004: Перегрузки функций

**Файлы для изменения:**
- `packages/query/src/react/useMutation.tsx`

**Критерии приёмки:**
- [ ] Перегрузка для автоматического вывода
- [ ] Перегрузка для явной типизации
- [ ] Все тесты проходят

## Зависимости

- ✅ Анализ проблемы завершён
- ⏳ Задача 001 → Задача 002 → Задача 003 → Задача 004

## Оценка усилий

| Задача | Оценка (часы) |
|--------|---------------|
| 001 | 4-6 |
| 002 | 2-3 |
| 003 | 2-3 |
| 004 | 6-8 |
| **Итого** | **14-20** |

## Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Нарушение обратной совместимости | Средняя | Высокое | Сохранить явную типизацию как опцию |
| Усложнение кодовой базы | Низкая | Среднее | Добавить комментарии к перегрузкам |
| Проблемы с выводом типов в сложных случаях | Средняя | Низкое | Добавить тесты на edge cases |

## Метрики успеха

- [ ] 90% мутаций работают без явной типизации
- [ ] Время на написание мутации сократилось на 30%
- [ ] Количество вопросов по типизации в issue уменьшилось

## Ссылки

- [Оригинальный анализ проблемы](./phase-query-improvements/001-auto-infer-variables.md)
- [TanStack Query API](https://tanstack.com/query/latest/docs/reference/useMutation)
- [TypeScript Handbook: Inferring Types](https://www.typescriptlang.org/docs/handbook/type-inference.html)
