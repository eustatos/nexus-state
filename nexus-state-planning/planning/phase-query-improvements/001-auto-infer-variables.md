# Задача 001: Добавить автоматический вывод TVariables из mutationFn

## Описание
Реализовать автоматический вывод типа `TVariables` из функции `mutationFn` в хуке `useMutation`, чтобы устранить необходимость явной типизации при использовании мутаций.

## Проблемы текущей реализации

### Текущее поведение

```typescript
// @nexus-state/query v0.1.3
const mutation = useMutation({
  mutationFn: (id: number) => api.archive(id),
});
mutation.mutate(123);  // ❌ Ошибка TypeScript: ожидается void
```

**Причина:** В сигнатуре `useMutation` параметр `TVariables` имеет значение по умолчанию `void`:

```typescript
export function useMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,  // ← Проблема здесь
  TContext = unknown,
>(options: UseMutationOptions<TData, TError, TVariables, TContext>)
```

TypeScript не выводит `TVariables` из `mutationFn`, потому что дженерик-параметры объявлены независимо.

### Ожидаемое поведение

```typescript
// После исправления
const mutation = useMutation({
  mutationFn: (id: number) => api.archive(id),
});
mutation.mutate(123);  // ✅ OK - тип выведен автоматически
```

## Решение

### Вариант 1: Вывод типов через conditional types

**Файл:** `packages/query/src/react/useMutation.tsx`

```typescript
// Новая сигнатура
export function useMutation<
  TFn extends (...args: any[]) => Promise<any>,
  TError = Error,
  TContext = unknown,
>(options: UseMutationOptions<TFn, TError, TContext>): UseMutationResult<TFn> {
  // TVariables выводится из параметров TFn
  // TData выводится из возвращаемого типа TFn
}
```

**Типы:**

```typescript
// packages/query/src/types.ts
export type MutationFnVariables<TFn> = TFn extends (...args: infer P) => any 
  ? P[0] 
  : void;

export type MutationFnData<TFn> = TFn extends (...args: any[]) => Promise<infer T>
  ? T
  : unknown;

export interface UseMutationResult<TFn, TError = Error> {
  mutate: (variables: MutationFnVariables<TFn>) => void;
  mutateAsync: (variables: MutationFnVariables<TFn>) => Promise<MutationFnData<TFn>>;
  // ... остальные поля
}
```

### Вариант 2: Function overloading (предпочтительный)

**Файл:** `packages/query/src/react/useMutation.tsx`

```typescript
// Перегрузка 1: Автоматический вывод типов
export function useMutation<TFn extends (...args: any[]) => Promise<any>>(
  options: UseMutationOptions<TFn>
): UseMutationResult<TFn>;

// Перегрузка 2: Явная типизация (для обратной совместимости)
export function useMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext>;

// Реализация
export function useMutation(options: any): any {
  // ... реализация
}
```

## Преимущества варианта 2

| Аспект | Вариант 1 | Вариант 2 |
|--------|-----------|-----------|
| **Обратная совместимость** | ❌ Ломает существующий код | ✅ Полная совместимость |
| **Гибкость** | Только автоматический вывод | Оба подхода доступны |
| **Сложность** | Низкая | Средняя |
| **Эргономика** | Хорошая | Отличная |

## Критерии приёмки

- [ ] TypeScript выводит `TVariables` из `mutationFn` автоматически
- [ ] Сохранена обратная совместимость с явной типизацией
- [ ] Все существующие тесты проходят
- [ ] Добавлены тесты на вывод типов:
  ```typescript
  describe('useMutation type inference', () => {
    it('должен выводить TVariables из mutationFn', () => {
      const { result } = renderHook(() => 
        useMutation({
          mutationFn: (id: number) => Promise.resolve(id),
        })
      );
      
      // Тип должен быть выведен как number
      result.current.mutate(123); // ✅ OK
      result.current.mutate('abc'); // ❌ Type error
    });
  });
  ```
- [ ] Обновлена документация типов в `types.ts`

## Изменения в файлах

### 1. `packages/query/src/types.ts`

```typescript
// Добавить новые типы для выведения переменных
export type ExtractFnVariables<TFn extends (...args: any[]) => any> = 
  TFn extends (...args: infer P) => any ? P[0] : void;

export type ExtractFnData<TFn extends (...args: any[]) => any> = 
  TFn extends (...args: any[]) => Promise<infer T> ? T : unknown;

// Обновить UseMutationOptions
export interface UseMutationOptions<
  TFn extends (...args: any[]) => Promise<any> = (...args: any[]) => Promise<any>,
  TError = Error,
  TVariables = ExtractFnVariables<TFn>,
  TContext = unknown,
> {
  mutationFn: TFn;
  // ... остальные поля
}
```

### 2. `packages/query/src/react/useMutation.tsx`

```typescript
// Добавить перегрузки функций
// (см. раздел "Решение" выше)
```

### 3. `packages/query/src/react/__tests__/useMutation.test.tsx`

```typescript
// Добавить тесты на вывод типов
describe('Type inference', () => {
  it('должен выводить TVariables из mutationFn', () => {
    // Тест
  });
  
  it('должен поддерживать явную типизацию', () => {
    // Тест
  });
});
```

## Тесты

### Unit тест на вывод типов

**Файл:** `packages/query/src/react/__tests__/useMutation-types.test.ts`

```typescript
import { describe, it, expectTypeOf } from 'vitest';
import { useMutation } from '../useMutation';

describe('useMutation - Type Inference', () => {
  it('должен выводить TVariables из mutationFn с одним параметром', () => {
    const { result } = renderHook(() => 
      useMutation({
        mutationFn: (id: number) => Promise.resolve(id),
      })
    );
    
    // Проверяем тип mutate
    expectTypeOf(result.current.mutate).parameter(0).toEqualTypeOf<number>();
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

  it('должен выводить TData из возвращаемого типа', () => {
    const { result } = renderHook(() => 
      useMutation({
        mutationFn: (id: number) => Promise.resolve({ id, name: 'Test' }),
      })
    );
    
    expectTypeOf(result.current.data).toEqualTypeOf<
      { id: number; name: string } | undefined
    >();
  });

  it('должен поддерживать явную типизацию', () => {
    const { result } = renderHook(() => 
      useMutation<string, Error, number>({
        mutationFn: (id) => Promise.resolve(String(id)),
      })
    );
    
    expectTypeOf(result.current.mutate).parameter(0).toEqualTypeOf<number>();
    expectTypeOf(result.current.data).toEqualTypeOf<string | undefined>();
  });
});
```

## Влияние на существующий код

### Обратная совместимость
✅ **Полная** — перегрузка функций сохраняет поддержку явной типизации

### Миграция
Не требуется. Существующий код продолжит работать:

```typescript
// Продолжит работать
useMutation<string, Error, number>({
  mutationFn: (id) => api.archive(id),
});

// Теперь тоже работает
useMutation({
  mutationFn: (id: number) => api.archive(id),
});
```

## Зависимости
- ✅ Задача проанализирована
- ⏳ Требуется реализация

## Сложность
**Оценка:** Средняя

**Изменения:**
- ~30 строк в `types.ts` (новые типы)
- ~40 строк в `useMutation.tsx` (перегрузки)
- ~80 строк тестов

## Приоритет
**Высокий** — критично для эргономики библиотеки

## Преимущества

| Аспект | До | После |
|--------|----|-------|
| **Бойлерплейт** | 3 явных типа | 0 типов |
| **Эргономика** | Средняя | Высокая |
| **Совместимость с TanStack** | Частичная | Полная |

## Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Проблемы с выводом в сложных случаях | Средняя | Низкая | Добавить тесты на edge cases |
| Усложнение типов | Низкая | Низкая | Добавить комментарии |

## Ссылки

- [TypeScript: Inferring Types](https://www.typescriptlang.org/docs/handbook/type-inference.html)
- [TypeScript: Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [TanStack Query: useMutation](https://tanstack.com/query/latest/docs/reference/useMutation)
