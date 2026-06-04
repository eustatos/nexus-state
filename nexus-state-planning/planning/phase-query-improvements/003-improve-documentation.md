# Задача 003: Улучшить документацию по типизации мутаций

## Описание
Создать подробное руководство по типизации мутаций в `@nexus-state/query`, включая сравнение с TanStack Query и примеры для различных сценариев использования.

## Проблемы текущей документации

### Отсутствие информации о типизации
Пользователи не знают, что требуется явная типизация `TVariables`:

```typescript
// Пользователи ожидают (как в TanStack Query):
const mutation = useMutation({
  mutationFn: (id: number) => api.archive(id),
});
mutation.mutate(123);  // ❌ Ошибка в текущей версии

// Требуется (неочевидно):
const mutation = useMutation<number, Error, number>({
  mutationFn: (id) => api.archive(id),
});
```

### Нет примеров для сложных случаев
Отсутствуют примеры для:
- Мутаций с объектами-аргументами
- Мутаций с AxiosResponse
- Мутаций без аргументов
- Optimistic updates с контекстом

## Решение

### 1. Создать руководство в документации

**Файл:** `docs/query/mutations-typing.md`

```markdown
# Типизация мутаций в @nexus-state/query

## Быстрый старт

### Базовый пример

```typescript
import { useMutation } from '@nexus-state/query';

// Мутация с одним аргументом
const deleteMutation = useMutation<void, Error, number>({
  mutationFn: (id: number) => api.delete(id),
});

// Использование
deleteMutation.mutate(123);
```

### Параметры типов

```typescript
useMutation<TData, TError, TVariables, TContext>
//              ^^^^^^  ^^^^^^  ^^^^^^^^^  ^^^^^^^
//              Данные  Ошибка  Аргументы  Контекст
```

| Параметр | Описание | Пример |
|----------|----------|--------|
| `TData` | Тип возвращаемых данных | `Dictionary`, `void`, `number` |
| `TError` | Тип ошибки | `Error`, `AxiosError` |
| `TVariables` | Тип аргумента `mutate()` | `number`, `{ id: number }` |
| `TContext` | Тип контекста для optimistic updates | `{ previousData: Dictionary[] }` |

## Сценарии использования

### 1. Удаление (возвращает void)

```typescript
const deleteMutation = useMutation<void, Error, number>({
  mutationFn: (id: number) => api.delete(id),
});

deleteMutation.mutate(123);
```

### 2. Создание (возвращает созданный объект)

```typescript
interface CreateDictionaryRequest {
  code: string;
  name: string;
}

interface Dictionary {
  id: number;
  code: string;
  name: string;
}

const createMutation = useMutation<Dictionary, Error, CreateDictionaryRequest>({
  mutationFn: (payload) => api.create(payload),
});

createMutation.mutate({ code: 'TEST', name: 'Test' });
```

### 3. Обновление (сложные аргументы)

```typescript
interface UpdateDictionaryVars {
  id: number;
  values: Partial<Dictionary>;
}

const updateMutation = useMutation<Dictionary, Error, UpdateDictionaryVars>({
  mutationFn: ({ id, values }) => api.update(id, values),
});

updateMutation.mutate({ 
  id: 123, 
  values: { name: 'New Name' } 
});
```

### 4. Мутация без аргументов

```typescript
const refreshMutation = useMutation<void, Error>({
  mutationFn: () => api.refresh(),
});

refreshMutation.mutate(); // void аргумент
```

### 5. Работа с AxiosResponse

```typescript
import { unwrapAxiosResponse } from '@nexus-state/query';

// API возвращает AxiosResponse<Dictionary>
const mutation = useMutation<Dictionary, Error, number>({
  mutationFn: (id) => unwrapAxiosResponse(api.getById(id)),
});
```

### 6. Optimistic updates

```typescript
const deleteMutation = useMutation<void, Error, number, { previousData: Dictionary[] }>({
  mutationFn: (id) => api.delete(id),
  onMutate: async (id) => {
    // Сохраняем текущие данные
    const previousData = queryClient.getQueryData<Dictionary[]>('dictionaries');
    
    // Оптимистически удаляем
    queryClient.setQueryData<Dictionary[]>('dictionaries', old => 
      old?.filter(d => d.id !== id)
    );
    
    return { previousData };
  },
  onError: (err, id, context) => {
    // Откат при ошибке
    queryClient.setQueryData('dictionaries', context?.previousData);
  },
});
```

## Сравнение с TanStack Query

| Возможность | TanStack Query | @nexus-state/query |
|-------------|----------------|-------------------|
| Автоматический вывод `TVariables` | ✅ Да | ❌ Требуется явно |
| Явная типизация | ✅ Опционально | ✅ Требуется |
| Синтаксис | `useMutation({ mutationFn })` | `useMutation<TData, TError, TVariables>({...})` |

### Пример: TanStack Query vs @nexus-state/query

```typescript
// TanStack Query - автоматический вывод
const mutation = useMutation({
  mutationFn: (id: number) => api.archive(id),
});
mutation.mutate(123);  // ✅

// @nexus-state/query - явная типизация
const mutation = useMutation<void, Error, number>({
  mutationFn: (id) => api.archive(id),
});
mutation.mutate(123);  // ✅
```

## Частые ошибки

### 1. Забыт тип `TVariables`

```typescript
// ❌ НЕПРАВИЛЬНО
const mutation = useMutation<void, Error>({
  mutationFn: (id: number) => api.delete(id),
});
mutation.mutate(123);  // Ошибка: ожидается void

// ✅ ПРАВИЛЬНО
const mutation = useMutation<void, Error, number>({
  mutationFn: (id: number) => api.delete(id),
});
mutation.mutate(123);  // OK
```

### 2. Неправильный порядок типов

```typescript
// ❌ НЕПРАВИЛЬНО (перепутан порядок)
const mutation = useMutation<number, void, Error>({
  // ...
});

// ✅ ПРАВИЛЬНО (TData, TError, TVariables)
const mutation = useMutation<void, Error, number>({
  // ...
});
```

### 3. Забыто извлечение данных из AxiosResponse

```typescript
// ❌ НЕПРАВИЛЬНО
const mutation = useMutation<AxiosResponse<Dictionary>, Error, number>({
  mutationFn: (id) => api.getById(id),
});

// ✅ ПРАВИЛЬНО
const mutation = useMutation<Dictionary, Error, number>({
  mutationFn: (id) => unwrapAxiosResponse(api.getById(id)),
});
```

## Миграция с TanStack Query

### Шаг 1: Добавьте явные типы

```diff
- const mutation = useMutation({
+ const mutation = useMutation<void, Error, number>({
    mutationFn: (id: number) => api.delete(id),
  });
```

### Шаг 2: Обновите обработку AxiosResponse

```diff
+ import { unwrapAxiosResponse } from '@nexus-state/query';

  const mutation = useMutation<Dictionary, Error, number>({
-   mutationFn: (id) => api.getById(id),
+   mutationFn: (id) => unwrapAxiosResponse(api.getById(id)),
  });
```

## Дополнительные ресурсы

- [API Reference: useMutation](./api/useMutation.md)
- [Axios Helpers](./guides/axios-helpers.md)
- [Optimistic Updates](./guides/optimistic-updates.md)
```

### 2. Обновить README пакета

**Файл:** `packages/query/README.md`

Добавить секцию "Типизация мутаций":

```markdown
## Типизация мутаций

`@nexus-state/query` требует явной типизации для мутаций:

```typescript
import { useMutation } from '@nexus-state/query';

// Формат: useMutation<TData, TError, TVariables>
const mutation = useMutation<void, Error, number>({
  mutationFn: (id: number) => api.delete(id),
});

mutation.mutate(123);
```

См. полное руководство в [документации](../../docs/query/mutations-typing.md).
```

### 3. Добавить JSDoc комментарии

**Файл:** `packages/query/src/react/useMutation.tsx`

```typescript
/**
 * Хук для создания мутации
 * 
 * @typeParam TData - Тип возвращаемых данных
 * @typeParam TError - Тип ошибки
 * @typeParam TVariables - Тип аргументов мутации
 * @typeParam TContext - Тип контекста для optimistic updates
 * 
 * @example
 * ```typescript
 * // Базовое использование
 * const mutation = useMutation<void, Error, number>({
 *   mutationFn: (id) => api.delete(id),
 * });
 * 
 * // С объектом-аргументом
 * const mutation = useMutation<Dictionary, Error, { name: string }>({
 *   mutationFn: (data) => api.create(data),
 * });
 * ```
 */
export function useMutation<...>() {
  // ...
}
```

## Критерии приёмки

- [ ] Создан файл `docs/query/mutations-typing.md`
- [ ] Обновлён `packages/query/README.md`
- [ ] Добавлены JSDoc комментарии в `useMutation.tsx`
- [ ] Добавлены примеры в `packages/query/examples/`
- [ ] Ссылка на документацию в `packages/query/package.json`

## Изменения в файлах

### 1. `docs/query/mutations-typing.md` (новый файл)
Полное руководство (см. выше)

### 2. `packages/query/README.md`
Добавить секцию о типизации

### 3. `packages/query/src/react/useMutation.tsx`
Добавить JSDoc

### 4. `packages/query/examples/mutations-typing.ts` (новый файл)

```typescript
/**
 * Примеры типизации мутаций
 */

import { useMutation, unwrapAxiosResponse } from '@nexus-state/query';
import type { Dictionary } from '../types';

// Пример 1: Удаление
export const useDeleteDictionary = () => {
  return useMutation<void, Error, number>({
    mutationFn: (id) => api.delete(id),
  });
};

// Пример 2: Создание
export const useCreateDictionary = () => {
  return useMutation<Dictionary, Error, { code: string; name: string }>({
    mutationFn: (data) => api.create(data),
  });
};

// Пример 3: Обновление
export const useUpdateDictionary = () => {
  return useMutation<Dictionary, Error, { id: number; values: Partial<Dictionary> }>({
    mutationFn: ({ id, values }) => api.update(id, values),
  });
};

// Пример 4: С Axios
export const useArchiveDictionary = () => {
  return useMutation<number, Error, number>({
    mutationFn: (id) => 
      unwrapAxiosResponse(api.archive(id).then((r) => r.data.id)),
  });
};
```

## Влияние на существующий код

### Обратная совместимость
✅ **Полная** — только документация

### Миграция
Не требуется

## Зависимости
- ✅ Задача проанализирована
- ⏳ Задача 001 (желательно завершить перед обновлением документации)
- ⏳ Задача 002 (для документации axios-helpers)

## Сложность
**Оценка:** Низкая

**Изменения:**
- ~200 строк документации
- ~50 строк примеров
- ~30 строк JSDoc

## Приоритет
**Средний** — улучшает onboarding новых пользователей

## Преимущества

| Аспект | До | После |
|--------|----|-------|
| **Onboarding** | 30+ минут | 10 минут |
| **Количество вопросов** | Высокое | Низкое |
| **Ясность API** | Средняя | Высокая |

## Метрики успеха

- [ ] Количество issue с вопросами по типизации уменьшилось на 50%
- [ ] Время до первого успешного использования мутации сократилось
- [ ] Положительные отзывы в Discord/Telegram

## Ссылки

- [TanStack Query: useMutation](https://tanstack.com/query/latest/docs/reference/useMutation)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
