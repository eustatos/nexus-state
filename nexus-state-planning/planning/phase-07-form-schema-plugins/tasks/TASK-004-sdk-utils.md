# TASK-004: SDK — Утилиты

## 📋 Описание

Реализация набора утилитных функций для упрощения разработки плагинов схем валидации. Утилиты предоставляют общие функции для работы с ошибками, путями полей и слияния результатов валидации.

## 🎯 Цель

Предоставить разработчикам плагинов готовые решения для:
- Нормализации путей полей (AJV style → JS style)
- Слияния ошибок валидации из нескольких источников
- Создания типизированных объектов FieldError
- Проверки на пустые значения
- Глубокого сравнения значений

## 📦 Требования к реализации

### Файлы для создания

```
packages/form/src/schema/
├── utils.ts              # Утилитные функции
├── __tests__/
│   └── utils.test.ts     # Тесты утилит
```

### Реализуемые функции

#### 1. Нормализация пути поля

```typescript
// packages/form/src/schema/utils.ts

/**
 * Нормализовать путь поля из различных форматов
 * 
 * Поддерживаемые форматы:
 * - AJV: '/users/0/name' → 'users.0.name'
 * - JSON Pointer: '/foo/bar' → 'foo.bar'
 * - lodash: 'foo[0].bar' → 'foo.0.bar'
 * 
 * @param path - Путь в любом формате
 * @returns Нормализованный путь (dot notation)
 * 
 * @example
 * ```typescript
 * normalizeFieldPath('/users/0/name');  // 'users.0.name'
 * normalizeFieldPath('foo[0].bar');     // 'foo.0.bar'
 * normalizeFieldPath('nested.path');    // 'nested.path'
 * ```
 */
export function normalizeFieldPath(path: string): string {
  if (!path) return '';
  
  return path
    // Remove leading slash
    .replace(/^\//, '')
    // Replace slashes with dots
    .replace(/\//g, '.')
    // Replace array notation [0] with .0
    .replace(/\[(\d+)\]/g, '.$1')
    // Remove leading dot if present
    .replace(/^\./, '')
    // Remove trailing dot if present
    .replace(/\.$/, '');
}
```

#### 2. Слияние ошибок валидации

```typescript
import { FieldError, ValidationErrors } from './types';

/**
 * Объединить несколько объектов ValidationErrors
 * 
 * При конфликте ошибок одного поля:
 * - Первая ошибка имеет приоритет
 * - Или можно передать mergeFn для кастомного слияния
 * 
 * @param errors - Массив ошибок для слияния
 * @returns Объединённые ошибки
 * 
 * @example
 * ```typescript
 * const merged = mergeValidationErrors(errors1, errors2, errors3);
 * ```
 */
export function mergeValidationErrors<T extends Record<string, any>>(
  ...errors: Array<ValidationErrors<T> | null | undefined>
): ValidationErrors<T> {
  const result: ValidationErrors<T> = {
    fieldErrors: {},
    formErrors: [],
  };

  for (const error of errors) {
    if (!error) continue;

    // Merge field errors
    if (error.fieldErrors) {
      for (const [key, fieldError] of Object.entries(error.fieldErrors)) {
        if (fieldError && !(key in result.fieldErrors)) {
          (result.fieldErrors as any)[key] = fieldError;
        }
      }
    }

    // Merge form errors
    if (error.formErrors?.length) {
      result.formErrors = [
        ...(result.formErrors ?? []),
        ...error.formErrors
      ];
    }
  }

  return result;
}

/**
 * Объединить ошибки с кастомной функцией слияния
 * 
 * @param errors - Массив ошибок
 * @param mergeFn - Функция слияния для конфликтов
 * @returns Объединённые ошибки
 */
export function mergeValidationErrorsWith<T extends Record<string, any>>(
  errors: Array<ValidationErrors<T> | null | undefined>,
  mergeFn: (a: FieldError | null, b: FieldError | null) => FieldError | null
): ValidationErrors<T> {
  const result: ValidationErrors<T> = {
    fieldErrors: {},
    formErrors: [],
  };

  for (const error of errors) {
    if (!error) continue;

    if (error.fieldErrors) {
      for (const [key, fieldError] of Object.entries(error.fieldErrors)) {
        const existingError = (result.fieldErrors as any)[key];
        
        if (existingError && fieldError) {
          // Conflict - use merge function
          (result.fieldErrors as any)[key] = mergeFn(existingError, fieldError);
        } else if (fieldError) {
          (result.fieldErrors as any)[key] = fieldError;
        }
      }
    }

    if (error.formErrors?.length) {
      result.formErrors = [
        ...(result.formErrors ?? []),
        ...error.formErrors
      ];
    }
  }

  return result;
}
```

#### 3. Создание FieldError

```typescript
/**
 * Создать объект FieldError
 * 
 * @param message - Сообщение об ошибке
 * @param code - Код ошибки (опционально)
 * @param params - Параметры для сообщения (опционально)
 * @returns FieldError объект
 * 
 * @example
 * ```typescript
 * const error = createFieldError(
 *   'Must be at least {min} characters',
 *   'min_length',
 *   { min: 3 }
 * );
 * ```
 */
export function createFieldError(
  message: string,
  code?: string,
  params?: Record<string, any>
): FieldError {
  return { message, code, params };
}

/**
 * Создать FieldError с интернационализацией
 * 
 * @param code - Код ошибки для i18n
 * @param params - Параметры для подстановки
 * @param defaultMessages - Сообщения по умолчанию для разных языков
 * @returns FieldError объект
 * 
 * @example
 * ```typescript
 * const error = createI18nFieldError(
 *   'required',
 *   { field: 'Email' },
 *   {
 *     en: 'Email is required',
 *     ru: 'Email обязателен',
 *   }
 * );
 * ```
 */
export function createI18nFieldError(
  code: string,
  params: Record<string, any>,
  defaultMessages: Record<string, string>
): FieldError {
  // Use first message as default
  const message = Object.values(defaultMessages)[0] ?? code;
  
  return {
    message,
    code,
    params: {
      ...params,
      i18n: {
        code,
        messages: defaultMessages,
      },
    },
  };
}
```

#### 4. Проверка на пустое значение

```typescript
/**
 * Проверить является ли значение пустым
 * 
 * Пустыми считаются:
 * - null
 * - undefined
 * - '' (пустая строка)
 * - [] (пустой массив)
 * - {} (пустой объект)
 * 
 * @param value - Значение для проверки
 * @returns true если значение пустое
 * 
 * @example
 * ```typescript
 * isEmpty(null);           // true
 * isEmpty('');             // true
 * isEmpty([]);             // true
 * isEmpty({});             // true
 * isEmpty(0);              // false
 * isEmpty('text');         // false
 * ```
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string') {
    return value === '';
  }
  
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
}

/**
 * Проверить является ли значение непустым
 * 
 * @param value - Значение для проверки
 * @returns true если значение непустое
 */
export function isNotEmpty(value: any): boolean {
  return !isEmpty(value);
}
```

#### 5. Глубокое сравнение (для кэширования)

```typescript
/**
 * Глубокое сравнение двух значений
 * 
 * @param a - Первое значение
 * @param b - Второе значение
 * @returns true если значения равны
 * 
 * @example
 * ```typescript
 * deepEqual({ a: 1 }, { a: 1 });  // true
 * deepEqual([1, 2], [1, 2]);      // true
 * deepEqual({ a: 1 }, { a: 2 });  // false
 * ```
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual((a as any)[key], (b as any)[key])) return false;
  }
  
  return true;
}
```

#### 6. Debounce утилита (для async валидации)

```typescript
/**
 * Создать debounced версию функции
 * 
 * @param fn - Функция для debounce
 * @param delay - Задержка в мс
 * @returns Debounced функция
 * 
 * @example
 * ```typescript
 * const debouncedValidate = debounce(async (value) => {
 *   return await api.validate(value);
 * }, 300);
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastResolve: ((result: ReturnType<T>) => void) | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const result = fn(...args);
        if (lastResolve) {
          lastResolve(result);
        }
        resolve(result);
        lastResolve = null;
      }, delay);

      lastResolve = resolve;
    });
  };
}
```

#### 7. Cache утилита (для кэширования результатов)

```typescript
/**
 * Создать кэшированную версию функции
 * 
 * @param fn - Функция для кэширования
 * @param options - Опции кэша
 * @returns Кэшированная функция
 * 
 * @example
 * ```typescript
 * const cachedValidate = cache(async (value) => {
 *   return await api.validate(value);
 * }, {
 *   keyFn: (value) => value,
 *   ttl: 60000,  // 1 minute
 * });
 * ```
 */
export interface CacheOptions<T extends (...args: any[]) => any> {
  /** Функция для создания ключа из аргументов */
  keyFn?: (...args: Parameters<T>) => string;
  /** Время жизни кэша в мс */
  ttl?: number;
  /** Максимальный размер кэша */
  maxSize?: number;
}

export function cache<T extends (...args: any[]) => any>(
  fn: T,
  options: CacheOptions<T> = {}
): T {
  const {
    keyFn = (...args) => JSON.stringify(args),
    ttl = 60000,
    maxSize = 100,
  } = options;

  const cache = new Map<string, { value: ReturnType<T>; expires: number }>();

  return ((...args: Parameters<T>) => {
    const key = keyFn(...args);
    const cached = cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    const result = fn(...args);

    // Clean up if cache is full
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }

    cache.set(key, {
      value: result,
      expires: Date.now() + ttl,
    });

    return result;
  }) as T;
}
```

## 🧪 Тестирование

### Требования
- **Coverage**: > 90% (branches > 85%)
- **Фреймворк**: Vitest

### Файлы тестов

```
packages/form/src/schema/__tests__/
└── utils.test.ts
```

### Сценарии для тестирования

```typescript
import { describe, it, expect } from 'vitest';
import {
  normalizeFieldPath,
  mergeValidationErrors,
  createFieldError,
  isEmpty,
  isNotEmpty,
  deepEqual,
  debounce,
  cache,
} from '../utils';

describe('normalizeFieldPath', () => {
  it('should normalize AJV style paths', () => {
    expect(normalizeFieldPath('/users/0/name')).toBe('users.0.name');
  });

  it('should normalize lodash style paths', () => {
    expect(normalizeFieldPath('foo[0].bar')).toBe('foo.0.bar');
  });

  it('should handle already normalized paths', () => {
    expect(normalizeFieldPath('nested.path')).toBe('nested.path');
  });

  it('should handle empty string', () => {
    expect(normalizeFieldPath('')).toBe('');
  });
});

describe('mergeValidationErrors', () => {
  it('should merge multiple error objects', () => {
    const errors1 = { fieldErrors: { name: { message: 'Required' } } };
    const errors2 = { fieldErrors: { email: { message: 'Invalid' } } };
    
    const merged = mergeValidationErrors(errors1, errors2);
    
    expect(merged.fieldErrors.name).toEqual({ message: 'Required' });
    expect(merged.fieldErrors.email).toEqual({ message: 'Invalid' });
  });

  it('should skip null/undefined errors', () => {
    const errors1 = { fieldErrors: { name: { message: 'Required' } } };
    const merged = mergeValidationErrors(errors1, null, undefined);
    
    expect(merged.fieldErrors.name).toEqual({ message: 'Required' });
  });

  it('should merge formErrors', () => {
    const errors1 = { fieldErrors: {}, formErrors: [{ message: 'Error 1' }] };
    const errors2 = { fieldErrors: {}, formErrors: [{ message: 'Error 2' }] };
    
    const merged = mergeValidationErrors(errors1, errors2);
    
    expect(merged.formErrors).toHaveLength(2);
  });
});

describe('createFieldError', () => {
  it('should create error with message only', () => {
    const error = createFieldError('Required');
    expect(error).toEqual({ message: 'Required' });
  });

  it('should create error with code', () => {
    const error = createFieldError('Required', 'required');
    expect(error).toEqual({ message: 'Required', code: 'required' });
  });

  it('should create error with params', () => {
    const error = createFieldError('Min {min}', 'min_length', { min: 3 });
    expect(error).toEqual({
      message: 'Min {min}',
      code: 'min_length',
      params: { min: 3 }
    });
  });
});

describe('isEmpty', () => {
  it('should return true for null/undefined', () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(isEmpty('')).toBe(true);
  });

  it('should return true for empty array', () => {
    expect(isEmpty([])).toBe(true);
  });

  it('should return true for empty object', () => {
    expect(isEmpty({})).toBe(true);
  });

  it('should return false for non-empty values', () => {
    expect(isEmpty(0)).toBe(false);
    expect(isEmpty('text')).toBe(false);
    expect(isEmpty([1])).toBe(false);
    expect(isEmpty({ a: 1 })).toBe(false);
  });
});

describe('deepEqual', () => {
  it('should return true for primitive equality', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'a')).toBe(true);
  });

  it('should return true for deep object equality', () => {
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(deepEqual({ a: { b: 2 } }, { a: { b: 2 } })).toBe(true);
  });

  it('should return true for array equality', () => {
    expect(deepEqual([1, 2], [1, 2])).toBe(true);
    expect(deepEqual([[1], [2]], [[1], [2]])).toBe(true);
  });

  it('should return false for different values', () => {
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual([1, 2], [1, 3])).toBe(false);
  });
});

describe('debounce', () => {
  it('should debounce function calls', async () => {
    const fn = vi.fn((x) => x * 2);
    const debouncedFn = debounce(fn, 50);

    debouncedFn(1);
    debouncedFn(2);
    debouncedFn(3);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('cache', () => {
  it('should cache function results', () => {
    const fn = vi.fn((x) => x * 2);
    const cachedFn = cache(fn);

    cachedFn(1);
    cachedFn(1);
    cachedFn(1);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should expire cache after ttl', async () => {
    const fn = vi.fn((x) => x * 2);
    const cachedFn = cache(fn, { ttl: 50 });

    cachedFn(1);
    await new Promise(resolve => setTimeout(resolve, 100));
    cachedFn(1);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
```

## 📁 Зависимости

- [[TASK-001]](./TASK-001-sdk-types.md) — SDK: Типы и интерфейсы

## 🔗 Связанные задачи

- [[TASK-008]](./TASK-008-ajv-plugin.md) — Плагин AJV (использует normalizeFieldPath)
- [[TASK-011]](./TASK-011-dsl-async-validators.md) — DSL async валидаторы (использует debounce/cache)

## 📚 Ресурсы

- [lodash/normalizePath](https://lodash.com/docs/4.17.15#toPath)
- [lodash/debounce](https://lodash.com/docs/4.17.15#debounce)
- [fast-deep-equal](https://github.com/epoberezkin/fast-deep-equal)

## ✅ Критерии приемки

- [ ] Файл `utils.ts` создан со всеми функциями
- [ ] Все функции экспортированы из `index.ts`
- [ ] TypeScript компилируется без ошибок
- [ ] Тесты покрывают > 90% кода
- [ ] TSDoc комментарии для всех публичных функций
- [ ] ESLint без ошибок
- [ ] Прогресс отмечен в [tasks/README.md](./README.md)

## 📝 Заметки

- Утилиты должны быть чистыми функциями
- Избегать внешних зависимостей
- Документировать edge cases
- Предусмотреть обработку null/undefined

## 🔄 Прогресс

- [ ] Создание файла `utils.ts`
- [ ] Функция normalizeFieldPath
- [ ] Функция mergeValidationErrors
- [ ] Функция createFieldError
- [ ] Функции isEmpty/isNotEmpty
- [ ] Функция deepEqual
- [ ] Функция debounce
- [ ] Функция cache
- [ ] Написание тестов
- [ ] Достижение coverage > 90%
- [ ] TSDoc документация
- [ ] Финальная проверка ESLint
