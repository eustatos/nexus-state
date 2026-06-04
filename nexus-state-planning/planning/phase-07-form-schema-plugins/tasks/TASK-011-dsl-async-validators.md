# TASK-011: DSL валидаторы (async)

## 📋 Описание

Реализация набора асинхронных валидаторов для DSL плагина. Эти валидаторы выполняют проверки, требующие сетевых запросов или работы с базой данных.

## 🎯 Цель

Предоставить разработчикам готовые асинхронные валидаторы для распространённых случаев:
- Уникальность значения (API/DB проверка)
- Проверка существования (API/DB)
- Кастомная асинхронная валидация
- Debounce и retry логика
- Timeout обработка

## 📦 Требования к реализации

### Структура пакета

```
packages/form-schema-dsl/
├── src/
│   ├── __tests__/
│   │   └── async-validators.test.ts    # Тесты async валидаторов
│   ├── index.ts                        # Публичный API
│   ├── types.ts                        # DSL типы (из TASK-009)
│   ├── validator.ts                    # DSL ядро (из TASK-009)
│   ├── validators.ts                   # Sync валидаторы (из TASK-010)
│   └── async-validators.ts             # Async валидаторы (НОВЫЙ)
├── package.json
└── tsconfig.json
```

### Асинхронные валидаторы

```typescript
// packages/form-schema-dsl/src/async-validators.ts

import type { DSLRule } from './types';

/**
 * Опции для асинхронных валидаторов
 */
export interface AsyncValidatorOptions {
  /** Debounce delay в мс */
  debounce?: number;

  /** Количество retry попыток */
  retry?: number;

  /** Timeout в мс */
  timeout?: number;

  /** Кэшировать результаты */
  cache?: boolean;

  /** TTL кэша в мс (по умолчанию 5 минут) */
  cacheTTL?: number;
}

/**
 * Кэш для результатов валидации
 */
interface CacheEntry {
  result: string | null;
  timestamp: number;
}

/**
 * Проверка уникальности значения (API/DB)
 *
 * @param url - URL API для проверки или функция проверки
 * @param message - Сообщение об ошибке
 * @param options - Опции
 *
 * @example
 * ```typescript
 * // С URL
 * const schema: DSLSchema = {
 *   username: [
 *     required,
 *     unique('https://api.example.com/check-username', 'Username already taken'),
 *   ],
 * };
 *
 * // С функцией
 * const schema: DSLSchema = {
 *   email: [
 *     required,
 *     email(),
 *     unique(async (value) => {
 *       const exists = await checkEmailExists(value);
 *       return exists ? 'Email already registered' : null;
 *     }),
 *   ],
 * };
 * ```
 */
export function unique(
  url: string | ((value: string) => Promise<boolean>),
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<string> {
  const cache = new Map<string, CacheEntry>();

  const validateFn = async (value: string): Promise<string | null> => {
    if (!value) {
      return null; // Пустые значения обрабатываются required
    }

    // Проверка кэша
    if (options?.cache !== false) {
      const cached = cache.get(value);
      const ttl = options?.cacheTTL ?? 5 * 60 * 1000; // 5 минут

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
    }

    let isTaken: boolean;

    if (typeof url === 'string') {
      // HTTP запрос
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        isTaken = data.exists ?? data.taken ?? false;
      } catch (error) {
        console.error('Unique validation error:', error);
        return 'Validation failed';
      }
    } else {
      // Функция проверки
      isTaken = await url(value);
    }

    const result = isTaken ? (message ?? 'This value is already taken') : null;

    // Кэширование результата
    if (options?.cache !== false) {
      cache.set(value, { result, timestamp: Date.now() });
    }

    return result;
  };

  return {
    validate: validateFn,
    async: true,
    code: 'unique',
    options: {
      debounce: 300,
      ...options,
    },
  };
}

/**
 * Проверка существования значения (API/DB)
 *
 * @param url - URL API для проверки или функция проверки
 * @param message - Сообщение об ошибке
 * @param options - Опции
 *
 * @example
 * ```typescript
 * const schema: DSLSchema = {
 *   inviteCode: [
 *     required,
 *     exists('https://api.example.com/check-invite', 'Invalid invite code'),
 *   ],
 * };
 * ```
 */
export function exists(
  url: string | ((value: string) => Promise<boolean>),
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<string> {
  const cache = new Map<string, CacheEntry>();

  const validateFn = async (value: string): Promise<string | null> => {
    if (!value) {
      return null;
    }

    // Проверка кэша
    if (options?.cache !== false) {
      const cached = cache.get(value);
      const ttl = options?.cacheTTL ?? 5 * 60 * 1000;

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
    }

    let exists: boolean;

    if (typeof url === 'string') {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        exists = data.exists ?? false;
      } catch (error) {
        console.error('Exists validation error:', error);
        return 'Validation failed';
      }
    } else {
      exists = await url(value);
    }

    const result = exists ? null : (message ?? 'This value does not exist');

    if (options?.cache !== false) {
      cache.set(value, { result, timestamp: Date.now() });
    }

    return result;
  };

  return {
    validate: validateFn,
    async: true,
    code: 'exists',
    options: {
      debounce: 300,
      ...options,
    },
  };
}

/**
 * Валидация с использованием кастомной асинхронной функции
 *
 * @param fn - Асинхронная функция валидации
 * @param message - Сообщение по умолчанию
 * @param options - Опции
 *
 * @example
 * ```typescript
 * const schema: DSLSchema = {
 *   password: [
 *     required,
 *     asyncCustom(async (value) => {
 *       const strength = await checkPasswordStrength(value);
 *       return strength < 0.7 ? 'Password too weak' : null;
 *     }, 'Password validation failed'),
 *   ],
 * };
 * ```
 */
export function asyncCustom<T = any>(
  fn: (value: T, allValues?: any) => Promise<string | null>,
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<T> {
  return {
    validate: fn,
    async: true,
    message,
    code: 'async_custom',
    options,
  };
}

/**
 * Проверка доступности домена/email
 *
 * @param type - Тип проверки ('domain' | 'mx')
 * @param message - Сообщение об ошибке
 * @param options - Опции
 *
 * @example
 * ```typescript
 * const schema: DSLSchema = {
 *   email: [
 *     required,
 *     email(),
 *     checkDomain('mx', 'Email domain does not accept emails'),
 *   ],
 * };
 * ```
 */
export function checkDomain(
  type: 'domain' | 'mx' = 'domain',
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<string> {
  const cache = new Map<string, CacheEntry>();

  const validateFn = async (value: string): Promise<string | null> => {
    if (!value) {
      return null;
    }

    // Извлечение домена из email
    let domain = value;
    if (value.includes('@')) {
      domain = value.split('@')[1];
    }

    // Проверка кэша
    if (options?.cache !== false) {
      const cached = cache.get(domain);
      const ttl = options?.cacheTTL ?? 5 * 60 * 1000;

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
    }

    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=${type === 'mx' ? 'MX' : 'A'}`);
      const data = await response.json();

      const isValid = data.Answer && data.Answer.length > 0;
      const result = isValid ? null : (message ?? 'Invalid domain');

      if (options?.cache !== false) {
        cache.set(domain, { result, timestamp: Date.now() });
      }

      return result;
    } catch (error) {
      console.error('Domain validation error:', error);
      return 'Domain validation failed';
    }
  };

  return {
    validate: validateFn,
    async: true,
    code: 'domain_check',
    options: {
      debounce: 300,
      ...options,
    },
  };
}

/**
 * Проверка файла по URL (существует ли)
 *
 * @param message - Сообщение об ошибке
 * @param options - Опции
 *
 * @example
 * ```typescript
 * const schema: DSLSchema = {
 *   avatarUrl: [
 *     required,
 *     url(),
 *     checkFileExists('Image URL is not accessible'),
 *   ],
 * };
 * ```
 */
export function checkFileExists(
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<string> {
  const cache = new Map<string, CacheEntry>();

  const validateFn = async (value: string): Promise<string | null> => {
    if (!value) {
      return null;
    }

    // Проверка кэша
    if (options?.cache !== false) {
      const cached = cache.get(value);
      const ttl = options?.cacheTTL ?? 5 * 60 * 1000;

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
    }

    try {
      const response = await fetch(value, { method: 'HEAD' });
      const exists = response.ok;

      const result = exists ? null : (message ?? 'File not found');

      if (options?.cache !== false) {
        cache.set(value, { result, timestamp: Date.now() });
      }

      return result;
    } catch (error) {
      console.error('File exists validation error:', error);
      return 'File validation failed';
    }
  };

  return {
    validate: validateFn,
    async: true,
    code: 'file_exists',
    options: {
      debounce: 300,
      ...options,
    },
  };
}

/**
 * Проверка CAPTCHA
 *
 * @param verifyUrl - URL для проверки CAPTCHA
 * @param secretKey - Секретный ключ (на сервере)
 * @param message - Сообщение об ошибке
 * @param options - Опции
 *
 * @example
 * ```typescript
 * const schema: DSLSchema = {
 *   captcha: [
 *     required,
 *     checkCaptcha('https://api.example.com/verify-captcha', 'Captcha verification failed'),
 *   ],
 * };
 * ```
 */
export function checkCaptcha(
  verifyUrl: string,
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<string> {
  const validateFn = async (value: string, allValues?: any): Promise<string | null> => {
    if (!value) {
      return null;
    }

    try {
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captcha: value,
          ...allValues,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const isValid = data.valid ?? data.success ?? false;

      return isValid ? null : (message ?? 'Captcha verification failed');
    } catch (error) {
      console.error('Captcha validation error:', error);
      return 'Captcha validation failed';
    }
  };

  return {
    validate: validateFn,
    async: true,
    code: 'captcha',
    options: {
      debounce: 0, // CAPTCHA без debounce
      ...options,
    },
  };
}

/**
 * Проверка подписки/статуса пользователя
 *
 * @param checkFn - Функция проверки статуса
 * @param requiredStatus - Требуемый статус
 * @param message - Сообщение об ошибке
 * @param options - Опции
 *
 * @example
 * ```typescript
 * const schema: DSLSchema = {
 *   featureAccess: [
 *     checkUserStatus(
 *       async (userId) => {
 *         const user = await getUser(userId);
 *         return user?.subscription;
 *       },
 *       'premium',
 *       'Premium subscription required'
 *     ),
 *   ],
 * };
 * ```
 */
export function checkUserStatus<T = any>(
  checkFn: (userId: string, allValues?: any) => Promise<T>,
  requiredStatus: T,
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<string> {
  const cache = new Map<string, CacheEntry>();

  const validateFn = async (value: string, allValues?: any): Promise<string | null> => {
    if (!value) {
      return null;
    }

    // Проверка кэша
    if (options?.cache !== false) {
      const cached = cache.get(value);
      const ttl = options?.cacheTTL ?? 5 * 60 * 1000;

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
    }

    try {
      const status = await checkFn(value, allValues);
      const isValid = status === requiredStatus;

      const result = isValid ? null : (message ?? 'Insufficient permissions');

      if (options?.cache !== false) {
        cache.set(value, { result, timestamp: Date.now() });
      }

      return result;
    } catch (error) {
      console.error('User status validation error:', error);
      return 'Status validation failed';
    }
  };

  return {
    validate: validateFn,
    async: true,
    code: 'user_status',
    options: {
      debounce: 300,
      ...options,
    },
  };
}

/**
 * Проверка промокода
 *
 * @param url - URL API для проверки
 * @param message - Сообщение об ошибке
 * @param options - Опции
 *
 * @example
 * ```typescript
 * const schema: DSLSchema = {
 *   promoCode: [
 *     required,
 *     checkPromoCode('https://api.example.com/validate-promo', 'Invalid or expired promo code'),
 *   ],
 * };
 * ```
 */
export function checkPromoCode(
  url: string,
  message?: string,
  options?: AsyncValidatorOptions
): DSLRule<string> {
  const cache = new Map<string, CacheEntry>();

  const validateFn = async (value: string): Promise<string | null> => {
    if (!value) {
      return null;
    }

    // Проверка кэша
    if (options?.cache !== false) {
      const cached = cache.get(value);
      const ttl = options?.cacheTTL ?? 5 * 60 * 1000;

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const isValid = data.valid ?? data.success ?? false;

      const result = isValid ? null : (message ?? 'Invalid promo code');

      if (options?.cache !== false) {
        cache.set(value, { result, timestamp: Date.now() });
      }

      return result;
    } catch (error) {
      console.error('Promo code validation error:', error);
      return 'Promo code validation failed';
    }
  };

  return {
    validate: validateFn,
    async: true,
    code: 'promo_code',
    options: {
      debounce: 300,
      ...options,
    },
  };
}

/**
 * Утилита: Обёртка с debounce
 *
 * @param fn - Функция для debounce
 * @param delay - Задержка в мс
 */
export function withDebounce<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return ((...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise<any>((resolve) => {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        resolve(fn(...args));
      }, delay);
    });
  }) as T;
}

/**
 * Утилита: Обёртка с retry
 *
 * @param fn - Функция для retry
 * @param retries - Количество попыток
 * @param delay - Задержка между попытками в мс
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  retries: number = 3,
  delay: number = 1000
): T {
  return (async (...args: any[]) => {
    let lastError: Error | null = null;

    for (let i = 0; i <= retries; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;

        if (i < retries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }) as T;
}

/**
 * Утилита: Обёртка с timeout
 *
 * @param fn - Функция для timeout
 * @param timeout - Timeout в мс
 */
export function withTimeout<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  timeout: number
): T {
  return (async (...args: any[]) => {
    return Promise.race([
      fn(...args),
      new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      ),
    ]);
  }) as T;
}

/**
 * Композит: Применить все опции (debounce, retry, timeout)
 *
 * @param fn - Функция валидации
 * @param options - Опции
 */
export function withOptions<T extends (...args: any[]) => Promise<string | null>>(
  fn: T,
  options?: AsyncValidatorOptions
): T {
  let wrapped = fn;

  if (options?.timeout) {
    wrapped = withTimeout(wrapped, options.timeout);
  }

  if (options?.retry) {
    wrapped = withRetry(wrapped, options.retry);
  }

  if (options?.debounce) {
    wrapped = withDebounce(wrapped, options.debounce);
  }

  return wrapped;
}
```

### Обновление index.ts

```typescript
// packages/form-schema-dsl/src/index.ts

// Экспорт ядра (из TASK-009)
export { dslPlugin, compileRule, compileSchema } from './validator';
export type { DSLSchema, DSLRule, CompiledDSLRule, CompiledDSLSchema } from './types';

// Экспорт sync валидаторов (из TASK-010)
export {
  required,
  minLength,
  maxLength,
  lengthRange,
  length,
  minValue,
  maxValue,
  valueRange,
  pattern,
  email,
  url,
  phone,
  creditCard,
  equalTo,
  notEqualTo,
  oneOf,
  notOneOf,
  positive,
  negative,
  integer,
  arrayLength,
  custom,
  matchesField,
  conditional,
} from './validators';

// Экспорт async валидаторов
export {
  unique,
  exists,
  asyncCustom,
  checkDomain,
  checkFileExists,
  checkCaptcha,
  checkUserStatus,
  checkPromoCode,
  withDebounce,
  withRetry,
  withTimeout,
  withOptions,
  type AsyncValidatorOptions,
} from './async-validators';

// Группированный экспорт
export * as validators from './validators';
export * as asyncValidators from './async-validators';
```

## 🧪 Тестирование

### Требования
- **Coverage**: > 90% (branches > 85%)
- **Фреймворк**: Vitest

### Файлы тестов

```
packages/form-schema-dsl/src/__tests__/async-validators.test.ts
```

### Сценарии для тестирования

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  unique,
  exists,
  asyncCustom,
  checkDomain,
  checkFileExists,
  checkCaptcha,
  checkPromoCode,
  withDebounce,
  withRetry,
  withTimeout,
  withOptions,
} from '../async-validators';

// Mock fetch
global.fetch = vi.fn();

describe('Async Validators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('unique', () => {
    it('should pass when value is unique (URL)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false }),
      } as any);

      const validator = unique('https://api.example.com/check');
      const error = await validator.validate('newuser');

      expect(error).toBeNull();
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/check',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ value: 'newuser' }),
        })
      );
    });

    it('should fail when value is taken (URL)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      } as any);

      const validator = unique('https://api.example.com/check', 'Username taken');
      const error = await validator.validate('existinguser');

      expect(error).toBe('Username taken');
    });

    it('should pass when value is unique (function)', async () => {
      const checkFn = vi.fn().mockResolvedValue(false);

      const validator = unique(checkFn);
      const error = await validator.validate('newuser');

      expect(error).toBeNull();
      expect(checkFn).toHaveBeenCalledWith('newuser');
    });

    it('should fail when value is taken (function)', async () => {
      const checkFn = vi.fn().mockResolvedValue(true);

      const validator = unique(checkFn, 'Taken');
      const error = await validator.validate('existing');

      expect(error).toBe('Taken');
    });

    it('should skip empty values', async () => {
      const validator = unique('https://api.example.com/check');
      const error = await validator.validate('');

      expect(error).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should cache results', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false }),
      } as any);

      const validator = unique('https://api.example.com/check', 'Taken', { cache: true });

      await validator.validate('test');
      await validator.validate('test');

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('exists', () => {
    it('should pass when value exists', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      } as any);

      const validator = exists('https://api.example.com/check-invite');
      const error = await validator.validate('VALID123');

      expect(error).toBeNull();
    });

    it('should fail when value does not exist', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: false }),
      } as any);

      const validator = exists('https://api.example.com/check-invite', 'Invalid code');
      const error = await validator.validate('INVALID');

      expect(error).toBe('Invalid code');
    });
  });

  describe('asyncCustom', () => {
    it('should use custom async function', async () => {
      const customFn = vi.fn().mockResolvedValue(null);

      const validator = asyncCustom(customFn);
      const error = await validator.validate('test');

      expect(error).toBeNull();
      expect(customFn).toHaveBeenCalledWith('test', undefined);
    });

    it('should pass custom message on error', async () => {
      const customFn = vi.fn().mockResolvedValue('Error occurred');

      const validator = asyncCustom(customFn, 'Custom error');
      const error = await validator.validate('test');

      expect(error).toBe('Custom error');
    });
  });

  describe('checkDomain', () => {
    it('should pass for valid domain', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Answer: [{ type: 'A' }] }),
      } as any);

      const validator = checkDomain();
      const error = await validator.validate('test@example.com');

      expect(error).toBeNull();
    });

    it('should fail for invalid domain', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Answer: [] }),
      } as any);

      const validator = checkDomain('domain', 'Domain not found');
      const error = await validator.validate('test@invalid.invalid');

      expect(error).toBe('Domain not found');
    });
  });

  describe('checkFileExists', () => {
    it('should pass for existing file', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as any);

      const validator = checkFileExists();
      const error = await validator.validate('https://example.com/image.jpg');

      expect(error).toBeNull();
      expect(fetch).toHaveBeenCalledWith('https://example.com/image.jpg', {
        method: 'HEAD',
      });
    });

    it('should fail for non-existing file', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as any);

      const validator = checkFileExists('File not found');
      const error = await validator.validate('https://example.com/missing.jpg');

      expect(error).toBe('File not found');
    });
  });

  describe('checkCaptcha', () => {
    it('should pass for valid captcha', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as any);

      const validator = checkCaptcha('https://api.example.com/verify');
      const error = await validator.validate('captcha123');

      expect(error).toBeNull();
    });

    it('should fail for invalid captcha', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false }),
      } as any);

      const validator = checkCaptcha('https://api.example.com/verify', 'Invalid captcha');
      const error = await validator.validate('wrong');

      expect(error).toBe('Invalid captcha');
    });
  });

  describe('checkPromoCode', () => {
    it('should pass for valid promo code', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      } as any);

      const validator = checkPromoCode('https://api.example.com/promo');
      const error = await validator.validate('SAVE20');

      expect(error).toBeNull();
    });

    it('should fail for invalid promo code', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: false }),
      } as any);

      const validator = checkPromoCode('https://api.example.com/promo', 'Invalid code');
      const error = await validator.validate('INVALID');

      expect(error).toBe('Invalid code');
    });
  });

  describe('withDebounce', () => {
    it('should debounce function calls', async () => {
      vi.useFakeTimers();
      const fn = vi.fn().mockResolvedValue('result');
      const debounced = withDebounce(fn, 100);

      debounced('arg1');
      debounced('arg2');
      debounced('arg3');

      expect(fn).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(100);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('arg3');
    });
  });

  describe('withRetry', () => {
    it('should retry on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First'))
        .mockRejectedValueOnce(new Error('Second'))
        .mockResolvedValueOnce('success');

      const retried = withRetry(fn, 3, 0);
      const result = await retried();

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

      const retried = withRetry(fn, 2, 0);

      await expect(retried()).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('withTimeout', () => {
    it('should complete within timeout', async () => {
      const fn = vi.fn().mockResolvedValue('result');

      const wrapped = withTimeout(fn, 1000);
      const result = await wrapped();

      expect(result).toBe('result');
    });

    it('should timeout', async () => {
      const fn = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 2000))
      );

      const wrapped = withTimeout(fn, 100);

      await expect(wrapped()).rejects.toThrow('Timeout');
    });
  });

  describe('withOptions', () => {
    it('should apply all options', async () => {
      vi.useFakeTimers();

      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('First'))
        .mockResolvedValueOnce('success');

      const wrapped = withOptions(fn, {
        debounce: 50,
        retry: 2,
        timeout: 1000,
      });

      wrapped();
      await vi.advanceTimersByTimeAsync(50);

      const result = await Promise.resolve(); // Wait for async

      expect(fn).toHaveBeenCalled();
    });
  });
});
```

## 📁 Зависимости

- [[TASK-009]](./TASK-009-dsl-plugin-core.md) — DSL плагин (ядро)
- [[TASK-010]](./TASK-010-dsl-built-in-validators.md) — DSL валидаторы (sync)

## 🔗 Связанные задачи

- [[TASK-012]](./TASK-012-documentation.md) — Документация
- [[TASK-013]](./TASK-013-examples-demo.md) — Примеры и демо

## 📚 Ресурсы

- [DNS over HTTPS](https://developers.google.com/speed/public-dns/docs/doh) — Google Public DNS API
- [Luhn Algorithm](https://en.wikipedia.org/wiki/Luhn_algorithm) — Алгоритм проверки кредитных карт

## ✅ Критерии приемки

- [ ] async-validators.ts создан с набором валидаторов
- [ ] Все async валидаторы экспортируются из index.ts
- [ ] Утилиты withDebounce/withRetry/withTimeout реализованы
- [ ] Тесты покрывают > 90% кода
- [ ] TSDoc комментарии для всех валидаторов
- [ ] Примеры использования в TSDoc
- [ ] ESLint без ошибок
- [ ] Прогресс отмечен в [tasks/README.md](./README.md)

## 📝 Заметки

- Async валидаторы должны иметь async: true
- Кэширование результатов для производительности
- Debounce для избежания лишних запросов
- Retry для обработки временных ошибок
- Timeout для предотвращения зависаний

## 🔄 Прогресс

- [ ] unique валидатор
- [ ] exists валидатор
- [ ] asyncCustom валидатор
- [ ] checkDomain валидатор
- [ ] checkFileExists валидатор
- [ ] checkCaptcha валидатор
- [ ] checkUserStatus валидатор
- [ ] checkPromoCode валидатор
- [ ] withDebounce утилита
- [ ] withRetry утилита
- [ ] withTimeout утилита
- [ ] withOptions композит
- [ ] Написание тестов
- [ ] Достижение coverage > 90%
- [ ] TSDoc документация
- [ ] Финальная проверка
