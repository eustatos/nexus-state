# Задача 004: Добавить перегрузки функций для упрощения API

## Описание
Добавить перегрузки функций для `useMutation`, `useQuery` и других хуков, чтобы поддержать как автоматический вывод типов, так и явную типизацию для обратной совместимости.

## Проблемы текущей реализации

### Единственная сигнатура с дженериками

```typescript
// Текущая реализация
export function useMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,  // ← По умолчанию void - проблема!
  TContext = unknown,
>(options: UseMutationOptions<TData, TError, TVariables, TContext>)
```

**Проблемы:**
1. `TVariables = void` по умолчанию ломает эргономику
2. Нет возможности автоматического вывода типов
3. Пользователи вынуждены указывать все 3 типа явно

## Решение

### Перегрузки для useMutation

**Файл:** `packages/query/src/react/useMutation.tsx`

```typescript
import type { 
  UseMutationOptions, 
  UseMutationResult,
  ExtractFnVariables,
  ExtractFnData,
} from '../types';

// ============================================================================
// Перегрузка 1: Автоматический вывод типов из mutationFn
// ============================================================================
export function useMutation<TFn extends (...args: any[]) => Promise<any>>(
  options: UseMutationOptions<TFn>
): UseMutationResult<
  ExtractFnData<TFn>,
  Error,
  ExtractFnVariables<TFn>
>;

// ============================================================================
// Перегрузка 2: Явная типизация (для обратной совместимости)
// ============================================================================
export function useMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext>;

// ============================================================================
// Реализация
// ============================================================================
export function useMutation(options: any): any {
  // ... существующая реализация
}
```

### Обновление типов

**Файл:** `packages/query/src/types.ts`

```typescript
// ============================================================================
// Вспомогательные типы для выведения типов из функции
// ============================================================================

/**
 * Извлекает тип первого аргумента функции
 */
export type ExtractFnVariables<TFn extends (...args: any[]) => any> = 
  TFn extends (...args: infer P) => any 
    ? P[0] 
    : void;

/**
 * Извлекает возвращаемый тип Promise из функции
 */
export type ExtractFnData<TFn extends (...args: any[]) => any> = 
  TFn extends (...args: any[]) => Promise<infer T> 
    ? T 
    : unknown;

/**
 * Опции мутации с поддержкой выведения типов
 */
export interface UseMutationOptions<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> {
  mutationFn: TVariables extends void
    ? () => Promise<TData>
    : (variables: TVariables) => Promise<TData>;
  
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
  onError?: (error: TError, variables: TVariables, context: TContext) => void;
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext
  ) => void;
  
  // ... остальные поля
}

/**
 * Результат мутации
 */
export interface UseMutationResult<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  
  data: TData | undefined;
  error: TError | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  
  // ... остальные поля
}
```

### Перегрузки для useQuery

**Файл:** `packages/query/src/react/useQuery.tsx`

```typescript
// ============================================================================
// Перегрузка 1: Автоматический вывод типов
// ============================================================================
export function useQuery<TFn extends () => Promise<any>>(
  key: QueryKey,
  queryFn: TFn,
  options?: Omit<UseQueryOptions<ExtractFnData<TFn>, Error>, 'queryKey' | 'queryFn'>
): UseQueryResult<ExtractFnData<TFn>, Error>;

// ============================================================================
// Перегрузка 2: Явная типизация
// ============================================================================
export function useQuery<
  TData = unknown,
  TError = Error,
>(
  key: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError>;

// ============================================================================
// Реализация
// ============================================================================
export function useQuery(...args: any[]): any {
  // ... существующая реализация
}
```

## Критерии приёмки

- [ ] Добавлены перегрузки для `useMutation`
- [ ] Добавлены перегрузки для `useQuery`
- [ ] Все существующие тесты проходят
- [ ] Добавлены тесты на вывод типов
- [ ] Обновлена документация типов
- [ ] JSDoc комментарии для перегрузок

## Изменения в файлах

### 1. `packages/query/src/types.ts`

```typescript
// Добавить вспомогательные типы
export type ExtractFnVariables<TFn> = ...;
export type ExtractFnData<TFn> = ...;

// Обновить UseMutationOptions для поддержки обоих подходов
```

### 2. `packages/query/src/react/useMutation.tsx`

```typescript
// Добавить перегрузки функций
// (см. раздел "Решение" выше)
```

### 3. `packages/query/src/react/useQuery.tsx`

```typescript
// Добавить перегрузки функций
```

### 4. `packages/query/src/react/__tests__/useMutation-types.test.ts`

```typescript
import { describe, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMutation } from '../useMutation';
import { expectTypeOf } from 'vitest';

describe('useMutation - Type Overloads', () => {
  describe('Автоматический вывод типов', () => {
    it('должен выводить TVariables из mutationFn с number', () => {
      const { result } = renderHook(() =>
        useMutation({
          mutationFn: (id: number) => Promise.resolve(id),
        })
      );
      
      // Проверяем тип mutate
      expectTypeOf(result.current.mutate).parameter(0).toEqualTypeOf<number>();
      expectTypeOf(result.current.data).toEqualTypeOf<number | undefined>();
    });

    it('должен выводить TVariables из mutationFn с объектом', () => {
      const { result } = renderHook(() =>
        useMutation({
          mutationFn: (data: { name: string; age: number }) =>
            Promise.resolve({ id: 1, ...data }),
        })
      );
      
      expectTypeOf(result.current.mutate).parameter(0).toEqualTypeOf<
        { name: string; age: number }
      >();
    });

    it('должен выводить void для функции без аргументов', () => {
      const { result } = renderHook(() =>
        useMutation({
          mutationFn: () => Promise.resolve('success'),
        })
      );
      
      expectTypeOf(result.current.mutate).parameter(0).toEqualTypeOf<void>();
    });
  });

  describe('Явная типизация', () => {
    it('должен поддерживать явную типизацию', () => {
      const { result } = renderHook(() =>
        useMutation<string, Error, number>({
          mutationFn: (id) => Promise.resolve(String(id)),
        })
      );
      
      expectTypeOf(result.current.mutate).parameter(0).toEqualTypeOf<number>();
      expectTypeOf(result.current.data).toEqualTypeOf<string | undefined>();
    });

    it('должен позволять переопределить выведенные типы', () => {
      const { result } = renderHook(() =>
        useMutation<number, Error, string>({
          // mutationFn принимает string, но TData = number
          mutationFn: (name: string) => Promise.resolve(name.length),
        })
      );
      
      expectTypeOf(result.current.mutate).parameter(0).toEqualTypeOf<string>();
      expectTypeOf(result.current.data).toEqualTypeOf<number | undefined>();
    });
  });
});
```

## Примеры использования

### 1. Автоматический вывод типов (новый подход)

```typescript
// ✅ Работает без явных типов
const deleteMutation = useMutation({
  mutationFn: (id: number) => api.delete(id),
});
deleteMutation.mutate(123);

const createMutation = useMutation({
  mutationFn: (data: { name: string }) => api.create(data),
});
createMutation.mutate({ name: 'Test' });
```

### 2. Явная типизация (обратная совместимость)

```typescript
// ✅ Продолжает работать
const deleteMutation = useMutation<void, Error, number>({
  mutationFn: (id) => api.delete(id),
});
deleteMutation.mutate(123);
```

### 3. Сложные случаи

```typescript
// Функция без аргументов
const refreshMutation = useMutation({
  mutationFn: () => api.refresh(),
});
refreshMutation.mutate();

// Функция с несколькими аргументами (через объект)
const updateMutation = useMutation({
  mutationFn: ({ id, values }: { id: number; values: Partial<User> }) =>
    api.update(id, values),
});
updateMutation.mutate({ id: 1, values: { name: 'New' } });
```

## Влияние на существующий код

### Обратная совместимость
✅ **Полная** — перегрузки сохраняют поддержку явной типизации

### Миграция
Не требуется. Существующий код продолжит работать:

```typescript
// Продолжит работать
useMutation<void, Error, number>({
  mutationFn: (id) => api.archive(id),
});

// Теперь тоже работает
useMutation({
  mutationFn: (id: number) => api.archive(id),
});
```

## Тесты

### Unit тесты на перегрузки

**Файл:** `packages/query/src/react/__tests__/useMutation-overloads.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMutation } from '../useMutation';

describe('useMutation - Overloads', () => {
  it('должен работать с автоматическим выводом типов', async () => {
    const mockFn = vi.fn((id: number) => Promise.resolve(id * 2));
    
    const { result } = renderHook(() =>
      useMutation({
        mutationFn: mockFn,
      })
    );
    
    result.current.mutate(5);
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBe(10);
    });
  });

  it('должен работать с явной типизацией', async () => {
    const mockFn = vi.fn((id: number) => Promise.resolve(String(id)));
    
    const { result } = renderHook(() =>
      useMutation<string, Error, number>({
        mutationFn: mockFn,
      })
    );
    
    result.current.mutate(5);
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBe('5');
    });
  });
});
```

## Зависимости
- ✅ Задача 001 (автоматический вывод TVariables)
- ✅ Задача 003 (документация)

## Сложность
**Оценка:** Высокая

**Изменения:**
- ~50 строк в `types.ts` (вспомогательные типы)
- ~60 строк в `useMutation.tsx` (перегрузки)
- ~40 строк в `useQuery.tsx` (перегрузки)
- ~100 строк тестов

## Приоритет
**Низкий** — улучшает DX, но требует значительных изменений

## Преимущества

| Аспект | До | После |
|--------|----|-------|
| **Эргономика** | Средняя | Отличная |
| **Гибкость** | Один подход | Два подхода |
| **Совместимость** | Только явная типизация | Оба варианта |

## Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Усложнение типов | Средняя | Низкая | Добавить комментарии |
| Проблемы с выводом в IDE | Низкая | Средняя | Протестировать в VS Code |
| Конфликты перегрузок | Низкая | Высокая | Тщательное тестирование |

## Метрики успеха

- [ ] 95% мутаций работают без явной типизации
- [ ] Все существующие тесты проходят
- [ ] Нет регрессий в выводе типов

## Ссылки

- [TypeScript: Function Overloads](https://www.typescriptlang.org/docs/handbook/functions.html#function-overloads)
- [TypeScript: Inferring Types](https://www.typescriptlang.org/docs/handbook/type-inference.html)
