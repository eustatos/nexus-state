# Задача 002: Добавить хелперы для работы с AxiosResponse

## Описание
Добавить утилиты для упрощения работы с API, которые возвращают `AxiosResponse<T>`, чтобы устранить необходимость ручного извлечения данных через `.then((r) => r.data)`.

## Проблемы текущей реализации

### Текущее поведение

```typescript
// API возвращает AxiosResponse<T>
dictionaryApi.archiveDictionary(id): Promise<AxiosResponse<Dictionary>>

// Требуется ручное извлечение данных в каждой мутации
const mutation = useMutation({
  mutationFn: (id: number) => 
    dictionaryApi.archiveDictionary(id).then((r) => r.data.id),
});
```

**Проблемы:**
1. Бойлерплейт в каждой мутации
2. Повторяющийся код
3. Возможность забыть извлечь `r.data`

### Ожидаемое поведение

```typescript
// С хелпером
const mutation = useMutation({
  mutationFn: (id: number) => 
    unwrapAxiosResponse(dictionaryApi.archiveDictionary(id)),
});

// Или с автоматическим маппингом
const mutation = useMutation({
  mutationFn: axiosMapper(dictionaryApi.archiveDictionary),
});
```

## Решение

### 1. Функция `unwrapAxiosResponse`

**Файл:** `packages/query/src/axios-helpers.ts`

```typescript
import type { AxiosResponse } from 'axios';

/**
 * Извлекает данные из AxiosResponse
 * 
 * @example
 * ```typescript
 * const mutation = useMutation({
 *   mutationFn: (id) => unwrapAxiosResponse(api.archive(id)),
 * });
 * ```
 */
export function unwrapAxiosResponse<T>(
  promise: Promise<AxiosResponse<T>>
): Promise<T> {
  return promise.then((response) => response.data);
}
```

### 2. Функция `axiosMapper` для обёртывания функций

```typescript
/**
 * Создаёт обёртку над API функцией для автоматического извлечения данных
 * 
 * @example
 * ```typescript
 * const mutation = useMutation({
 *   mutationFn: axiosMapper(dictionaryApi.archiveDictionary),
 * });
 * ```
 */
export function axiosMapper<
  TFn extends (...args: any[]) => Promise<AxiosResponse<any>>,
>(fn: TFn): (...args: Parameters<TFn>) => Promise<AxiosResponseData<TFn>> {
  return (...args) => fn(...args).then((response) => response.data);
}

// Вспомогательный тип для извлечения типа данных
type AxiosResponseData<TFn> = 
  TFn extends (...args: any[]) => Promise<AxiosResponse<infer T>> ? T : never;
```

### 3. Функция `axiosErrorMapper` для обработки ошибок

```typescript
/**
 * Преобразует AxiosError в удобный формат
 * 
 * @example
 * ```typescript
 * const mutation = useMutation({
 *   mutationFn: (id) => api.archive(id),
 *   onError: axiosErrorHandler((error) => {
 *     console.error('Archive failed:', error.message);
 *   }),
 * });
 * ```
 */
export function axiosErrorHandler<T = unknown>(
  handler: (error: SerializedAxiosError<T>) => void
): (error: unknown) => void {
  return (error: unknown) => {
    if (isAxiosError(error)) {
      const serialized: SerializedAxiosError<T> = {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data as T,
        isAxiosError: true,
      };
      handler(serialized);
    } else {
      handler({
        message: String(error),
        isAxiosError: false,
      });
    }
  };
}

export interface SerializedAxiosError<T = unknown> {
  message: string;
  code?: string;
  status?: number;
  data?: T;
  isAxiosError: boolean;
}
```

## Критерии приёмки

- [ ] Добавлена функция `unwrapAxiosResponse`
- [ ] Добавлена функция `axiosMapper`
- [ ] Добавлена функция `axiosErrorHandler`
- [ ] Экспорт хелперов из `packages/query/src/index.ts`
- [ ] Unit тесты на все хелперы
- [ ] Документация использования

## Изменения в файлах

### 1. `packages/query/src/axios-helpers.ts` (новый файл)

```typescript
import type { AxiosResponse, AxiosError } from 'axios';

// unwrapAxiosResponse
// axiosMapper
// axiosErrorHandler
// Вспомогательные типы
```

### 2. `packages/query/src/index.ts`

```typescript
// Добавить экспорт
export {
  unwrapAxiosResponse,
  axiosMapper,
  axiosErrorHandler,
  type SerializedAxiosError,
} from './axios-helpers';
```

### 3. `packages/query/src/__tests__/axios-helpers.test.ts` (новый файл)

```typescript
import { describe, it, expect, vi } from 'vitest';
import {
  unwrapAxiosResponse,
  axiosMapper,
  axiosErrorHandler,
} from '../axios-helpers';

describe('axios-helpers', () => {
  describe('unwrapAxiosResponse', () => {
    it('должен извлекать данные из AxiosResponse', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      
      const promise = Promise.resolve(mockResponse);
      const result = await unwrapAxiosResponse(promise);
      
      expect(result).toEqual({ id: 1, name: 'Test' });
    });
  });

  describe('axiosMapper', () => {
    it('должен оборачивать API функцию', async () => {
      const mockApi = vi.fn().mockResolvedValue({
        data: { id: 1 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });
      
      const mappedFn = axiosMapper(mockApi);
      const result = await mappedFn(123);
      
      expect(result).toEqual({ id: 1 });
      expect(mockApi).toHaveBeenCalledWith(123);
    });

    it('должен сохранять тип аргументов', () => {
      const mockApi = (id: number, name: string) => 
        Promise.resolve({
          data: { id, name },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        });
      
      const mappedFn = axiosMapper(mockApi);
      
      // Тип должен быть (id: number, name: string) => Promise<{ id: number; name: string }>
      expectTypeOf(mappedFn).parameter(0).toEqualTypeOf<number>();
      expectTypeOf(mappedFn).parameter(1).toEqualTypeOf<string>();
    });
  });

  describe('axiosErrorHandler', () => {
    it('должен обрабатывать AxiosError', () => {
      const handler = vi.fn();
      const wrappedHandler = axiosErrorHandler(handler);
      
      const axiosError = {
        message: 'Network Error',
        code: 'ECONNREFUSED',
        response: {
          status: 500,
          data: { error: 'Server error' },
        },
        isAxiosError: true,
      } as AxiosError;
      
      wrappedHandler(axiosError);
      
      expect(handler).toHaveBeenCalledWith({
        message: 'Network Error',
        code: 'ECONNREFUSED',
        status: 500,
        data: { error: 'Server error' },
        isAxiosError: true,
      });
    });

    it('должен обрабатывать не-Axios ошибки', () => {
      const handler = vi.fn();
      const wrappedHandler = axiosErrorHandler(handler);
      
      wrappedHandler(new Error('Regular error'));
      
      expect(handler).toHaveBeenCalledWith({
        message: 'Error: Regular error',
        isAxiosError: false,
      });
    });
  });
});
```

## Примеры использования

### 1. Базовое использование с `unwrapAxiosResponse`

```typescript
import { useMutation, unwrapAxiosResponse } from '@nexus-state/query';
import { dictionaryApi } from './api';

export const useArchiveDictionary = () => {
  return useMutation({
    mutationFn: (id: number) => 
      unwrapAxiosResponse(dictionaryApi.archiveDictionary(id)),
  });
};
```

### 2. Использование с `axiosMapper`

```typescript
import { useMutation, axiosMapper } from '@nexus-state/query';
import { dictionaryApi } from './api';

export const useArchiveDictionary = () => {
  return useMutation({
    mutationFn: axiosMapper(dictionaryApi.archiveDictionary),
  });
};
```

### 3. Обработка ошибок с `axiosErrorHandler`

```typescript
import { useMutation, axiosMapper, axiosErrorHandler } from '@nexus-state/query';
import { dictionaryApi } from './api';

export const useArchiveDictionary = () => {
  return useMutation({
    mutationFn: axiosMapper(dictionaryApi.archiveDictionary),
    onError: axiosErrorHandler((error) => {
      if (error.isAxiosError) {
        console.error(`API Error ${error.status}: ${error.message}`);
        if (error.status === 404) {
          // Обработать 404
        }
      } else {
        console.error(`Unknown error: ${error.message}`);
      }
    }),
  });
};
```

### 4. Комплексный пример

```typescript
import { useMutation, axiosMapper, axiosErrorHandler } from '@nexus-state/query';
import { dictionaryApi } from './api';
import type { Dictionary } from './types';

interface UpdateDictionaryVars {
  id: number;
  data: Partial<Dictionary>;
}

export const useUpdateDictionary = () => {
  return useMutation({
    mutationFn: axiosMapper(
      ({ id, data }: UpdateDictionaryVars) => 
        dictionaryApi.updateDictionary(id, data)
    ),
    onError: axiosErrorHandler<{ message: string }>((error) => {
      if (error.isAxiosError && error.status === 409) {
        // Конфликт - словарь с таким именем уже существует
        console.error('Conflict:', error.data?.message);
      }
    }),
  });
};
```

## Влияние на существующий код

### Обратная совместимость
✅ **Полная** — хелперы являются опциональными утилитами

### Миграция
Постепенная, по мере необходимости:

```diff
// Было:
const mutation = useMutation({
  mutationFn: (id) => 
    dictionaryApi.archiveDictionary(id).then((r) => r.data.id),
});

// Стало:
const mutation = useMutation({
  mutationFn: (id) => 
    unwrapAxiosResponse(dictionaryApi.archiveDictionary(id)),
});
```

## Зависимости
- ✅ Задача проанализирована
- ⏳ Задача 001 (не требуется, может выполняться параллельно)

## Сложность
**Оценка:** Низкая

**Изменения:**
- ~80 строк в `axios-helpers.ts`
- ~60 строк тестов
- ~20 строк документации

## Приоритет
**Средний** — улучшает DX, но не критично

## Преимущества

| Аспект | До | После |
|--------|----|-------|
| **Бойлерплейт** | `.then((r) => r.data)` в каждой мутации | Один хелпер |
| **Читаемость** | Средняя | Высокая |
| **Безопасность** | Возможность забыть `.data` | Автоматическое извлечение |

## Риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Зависимость от axios | Низкая | Низкая | Хелперы опциональны |
| Путаница с типами | Низкая | Низкая | Добавить документацию |

## Ссылки

- [Axios: Response Type](https://axios-http.com/docs/handling_errors)
- [TypeScript: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
