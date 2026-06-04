# TASK-007: Плагин Yup

## 📋 Описание

Реализация плагина для схемы валидации Yup. Плагин позволяет использовать Yup схемы в @nexus-state/form через единый интерфейс реестра.

## 🎯 Цель

Создать плагин для Yup, который:
- Интегрируется с Yup библиотекой
- Поддерживает синхронную и асинхронную валидацию
- Корректно маппит ошибки Yup в формат FormErrors
- Обрабатывает nested схемы и массивы

## 📦 Требования к реализации

### Структура пакета

```
packages/form-schema-yup/
├── src/
│   ├── __tests__/
│   │   └── index.test.ts    # Тесты плагина
│   └── index.ts             # Реализация плагина
├── package.json
├── tsconfig.json
└── README.md
```

### package.json

```json
{
  "name": "@nexus-state/form-schema-yup",
  "version": "0.1.0",
  "description": "Yup schema validator plugin for Nexus State forms",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc -w",
    "test": "vitest run",
    "lint": "eslint . --ext .ts"
  },
  "keywords": [
    "yup",
    "validation",
    "schema",
    "nexus-state",
    "forms"
  ],
  "peerDependencies": {
    "yup": "^1.0.0"
  },
  "dependencies": {
    "@nexus-state/form": "workspace:*"
  },
  "devDependencies": {
    "@nexus-state/core": "workspace:*",
    "@nexus-state/form": "workspace:*",
    "@types/node": "^20.0.0",
    "typescript": "^5.9.3",
    "vitest": "^3.0.7",
    "yup": "^1.4.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/eustatos/nexus-state",
    "directory": "packages/form-schema-yup"
  },
  "license": "MIT",
  "author": "Nexus State Contributors"
}
```

### Реализация плагина

```typescript
// packages/form-schema-yup/src/index.ts

import type {
  AnySchema,
  ValidationError,
  ValidateOptions,
} from 'yup';
import {
  createSchemaPlugin,
  type ValidationErrors,
  type FieldError,
  createFieldError,
} from '@nexus-state/form/schema';

/**
 * Yup плагин для Nexus State forms
 * 
 * @example
 * ```typescript
 * import { createForm } from '@nexus-state/form';
 * import * as yup from 'yup';
 * 
 * const form = createForm(store, {
 *   schemaType: 'yup',
 *   schemaConfig: yup.object({
 *     username: yup.string().min(3).required(),
 *     email: yup.string().email().required(),
 *     password: yup.string().min(8).required(),
 *   }),
 *   initialValues: {
 *     username: '',
 *     email: '',
 *     password: '',
 *   }
 * });
 * ```
 */
export const yupPlugin = createSchemaPlugin<AnySchema, any>({
  type: 'yup',
  meta: {
    description: 'Yup schema validator for Nexus State forms',
    version: '0.1.0',
    author: 'Nexus State Contributors',
    repository: 'https://github.com/eustatos/nexus-state',
    dependencies: [],
  },
  create: (schema) => {
    /**
     * Преобразовать Yup ошибку в FieldError
     */
    const yupErrorToFieldError = (error: ValidationError): FieldError => {
      return createFieldError(
        error.message,
        error.type ?? 'validation_error',
        {
          path: error.path,
          value: error.value,
          type: error.type,
        }
      );
    };

    /**
     * Преобразовать Yup ошибки в ValidationErrors
     */
    const yupErrorsToValidationErrors = (
      error: ValidationError
    ): ValidationErrors => {
      const fieldErrors: Record<string, FieldError | null> = {};

      // Yup может содержать несколько ошибок во inner
      if (error.inner && error.inner.length > 0) {
        for (const innerError of error.inner) {
          if (innerError.path) {
            fieldErrors[innerError.path] = yupErrorToFieldError(innerError);
          }
        }
      } else if (error.path) {
        // Одиночная ошибка
        fieldErrors[error.path] = yupErrorToFieldError(error);
      }

      return { fieldErrors };
    };

    /**
     * Опции валидации
     */
    const validateOptions: ValidateOptions = {
      abortEarly: false,  // Собирать все ошибки, а не останавливаться на первой
      stripUnknown: true, // Удалить неизвестные поля
    };

    return {
      /**
       * Валидация всех значений формы
       */
      validate: async (values, context) => {
        try {
          await schema.validate(values, {
            ...validateOptions,
            abortSignal: context?.signal,
          });

          return { fieldErrors: {} };
        } catch (error) {
          if (error instanceof ValidationError) {
            return yupErrorsToValidationErrors(error);
          }
          throw error;
        }
      },

      /**
       * Валидация одного поля
       * 
       * Yup поддерживает validateAt для валидации конкретного поля
       */
      validateField: async <K extends keyof any>(
        fieldName: K,
        _value: any,
        allValues: any
      ): Promise<FieldError | null> => {
        try {
          const fieldPath = String(fieldName);
          
          // Использовать validateAt для конкретного поля
          await (schema as any).validateAt(fieldPath, allValues, {
            ...validateOptions,
            abortSignal: context?.signal,
          });

          return null;
        } catch (error) {
          if (error instanceof ValidationError) {
            return yupErrorToFieldError(error);
          }
          throw error;
        }
      },

      /**
       * Парсинг и трансформация значений
       * Yup может трансформировать значения через .transform()
       */
      parse: async (values: unknown) => {
        return schema.validate(values, {
          ...validateOptions,
          stripUnknown: true,
        });
      },
    };
  },

  /**
   * Проверка что схема является Yup схемой
   */
  supports: (schema: any): schema is AnySchema => {
    return (
      schema !== null &&
      typeof schema === 'object' &&
      'validate' in schema &&
      'validateSync' in schema &&
      'validateAt' in schema
    );
  },
});

/**
 * Авто-регистрация в глобальном реестре
 */
if (typeof globalThis !== 'undefined') {
  try {
    import('@nexus-state/form/schema').then(({ defaultSchemaRegistry }) => {
      defaultSchemaRegistry.register('yup', yupPlugin);
    });
  } catch {
    // Игнорируем если реестр недоступен
  }
}

export { yupPlugin };
export default yupPlugin;

/**
 * Type helper для инференса типа схемы
 * 
 * @example
 * ```typescript
 * const schema = yup.object({ name: yup.string() });
 * type SchemaType = InferYupType<typeof schema>;  // { name: string }
 * ```
 */
export type InferYupType<T extends AnySchema> = T extends AnySchema<infer U> ? U : never;
```

## 🧪 Тестирование

### Требования
- **Coverage**: > 90% (branches > 85%)
- **Фреймворк**: Vitest

### Файлы тестов

```
packages/form-schema-yup/src/__tests__/
└── index.test.ts
```

### Сценарии для тестирования

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import * as yup from 'yup';
import { yupPlugin } from '../index';
import { defaultSchemaRegistry } from '@nexus-state/form/schema';

describe('yupPlugin', () => {
  beforeEach(() => {
    defaultSchemaRegistry.clear();
  });

  describe('plugin metadata', () => {
    it('should have correct metadata', () => {
      expect(yupPlugin.meta.name).toBe('@nexus-state/form-schema-yup');
      expect(yupPlugin.type).toBe('yup');
      expect(yupPlugin.meta.version).toBe('0.1.0');
    });
  });

  describe('supports()', () => {
    it('should recognize Yup schemas', () => {
      const schema = yup.object({ name: yup.string() });
      expect(yupPlugin.supports(schema)).toBe(true);
    });

    it('should reject non-Yup schemas', () => {
      expect(yupPlugin.supports({})).toBe(false);
      expect(yupPlugin.supports(null)).toBe(false);
    });
  });

  describe('validate()', () => {
    it('should pass valid data', async () => {
      const schema = yup.object({
        name: yup.string().min(1),
        email: yup.string().email(),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        name: 'John',
        email: 'john@example.com',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should return errors for invalid data', async () => {
      const schema = yup.object({
        name: yup.string().min(3),
        email: yup.string().email(),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        name: 'Jo',
        email: 'invalid',
      });

      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
    });

    it('should collect all errors (not stop at first)', async () => {
      const schema = yup.object({
        name: yup.string().min(3),
        email: yup.string().email(),
        age: yup.number().min(18),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        name: 'Jo',
        email: 'invalid',
        age: 10,
      });

      // Все три поля должны иметь ошибки
      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.fieldErrors.age).toBeDefined();
    });

    it('should handle nested schemas', async () => {
      const schema = yup.object({
        user: yup.object({
          name: yup.string().required(),
        }),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        user: { name: '' },
      });

      expect(result.fieldErrors['user.name']).toBeDefined();
    });

    it('should handle array schemas', async () => {
      const schema = yup.object({
        tags: yup.array().of(yup.string().min(1)),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        tags: ['valid', ''],
      });

      expect(result.fieldErrors['tags.1']).toBeDefined();
    });

    it('should handle Yup transforms', async () => {
      const schema = yup.object({
        name: yup.string().transform((val) => val?.trim().toUpperCase()),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        name: '  john  ',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should strip unknown fields', async () => {
      const schema = yup.object({
        name: yup.string(),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.validate({
        name: 'John',
        unknownField: 'should be stripped',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });
  });

  describe('validateField()', () => {
    it('should validate single field', async () => {
      const schema = yup.object({
        email: yup.string().email(),
      });
      const validator = yupPlugin.create(schema);

      const error = await validator.validateField(
        'email',
        'invalid',
        { email: 'invalid' }
      );

      expect(error).toBeDefined();
      expect(error?.message).toContain('email');
    });

    it('should return null for valid field', async () => {
      const schema = yup.object({
        email: yup.string().email(),
      });
      const validator = yupPlugin.create(schema);

      const error = await validator.validateField(
        'email',
        'valid@example.com',
        { email: 'valid@example.com' }
      );

      expect(error).toBeNull();
    });

    it('should only return error for specified field', async () => {
      const schema = yup.object({
        email: yup.string().email(),
        password: yup.string().min(8),
      });
      const validator = yupPlugin.create(schema);

      const emailError = await validator.validateField(
        'email',
        'invalid',
        { email: 'invalid', password: 'short' }
      );

      expect(emailError).toBeDefined();

      const passwordError = await validator.validateField(
        'password',
        'short',
        { email: 'invalid', password: 'short' }
      );

      expect(passwordError).toBeDefined();
    });
  });

  describe('parse()', () => {
    it('should parse and transform values', async () => {
      const schema = yup.object({
        name: yup.string().transform((val) => val?.trim().toUpperCase()),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.parse({
        name: '  john  ',
      });

      expect(result.name).toBe('JOHN');
    });

    it('should strip unknown fields on parse', async () => {
      const schema = yup.object({
        name: yup.string(),
      });
      const validator = yupPlugin.create(schema);

      const result = await validator.parse({
        name: 'John',
        unknownField: 'should be stripped',
      });

      expect(result).toEqual({ name: 'John' });
      expect((result as any).unknownField).toBeUndefined();
    });

    it('should throw on invalid data', async () => {
      const schema = yup.object({
        name: yup.string().required(),
      });
      const validator = yupPlugin.create(schema);

      await expect(validator.parse({ name: '' })).rejects.toThrow();
    });
  });

  describe('integration with registry', () => {
    it('should be creatable from registry', async () => {
      defaultSchemaRegistry.register('yup', yupPlugin);

      const schema = yup.object({
        name: yup.string().min(1),
      });

      const validator = defaultSchemaRegistry.create('yup', schema);
      expect(validator).toBeDefined();

      const result = await validator!.validate({ name: 'Test' });
      expect(result.fieldErrors).toEqual({});
    });
  });
});

describe('InferYupType', () => {
  it('should infer type correctly (compile-time check)', () => {
    // Type-level test - should compile without errors
    type TestSchema = yup.InferType<typeof yup.object({ name: yup.string() })>;
    const _test: TestSchema = { name: 'test' };
    expect(_test).toBeDefined();
  });
});
```

## 📁 Зависимости

- [[TASK-001]](./TASK-001-sdk-types.md) — SDK: Типы и интерфейсы
- [[TASK-002]](./TASK-002-sdk-registry.md) — SDK: Реестр плагинов
- [[TASK-003]](./TASK-003-sdk-builder.md) — SDK: Builder
- [[TASK-005]](./TASK-005-form-integration.md) — Интеграция с createForm

## 🔗 Связанные задачи

- [[TASK-006]](./TASK-006-zod-plugin.md) — Плагин Zod (предыдущий)
- [[TASK-008]](./TASK-008-ajv-plugin.md) — Плагин AJV (следующий)
- [[TASK-013]](./TASK-013-examples-demo.md) — Примеры (использует Yup плагин)

## 📚 Ресурсы

- [Yup Documentation](https://github.com/jquense/yup)
- [packages/form/src/schema/builder.ts](../../../packages/form/src/schema/builder.ts) — createSchemaPlugin

## ✅ Критерии приемки

- [ ] Пакет `form-schema-yup` создан
- [ ] Плагин реализует все методы (validate, validateField, parse)
- [ ] Авто-регистрация работает
- [ ] Ошибки Yup корректно маппятся
- [ ] Поддержка nested schemas
- [ ] Поддержка array schemas
- [ ] abortEarly: false для сбора всех ошибок
- [ ] TypeScript компилируется без ошибок
- [ ] Тесты покрывают > 90% кода
- [ ] TSDoc комментарии
- [ ] README с примерами
- [ ] ESLint без ошибок
- [ ] Прогресс отмечен в [tasks/README.md](./README.md)

## 📝 Заметки

- Использовать createSchemaPlugin builder
- abortEarly: false для сбора всех ошибок
- Использовать validateAt для полевой валидации
- Поддержать stripUnknown для очистки данных

## 🔄 Прогресс

- [ ] Создание структуры пакета
- [ ] package.json с зависимостями
- [ ] Реализация yupPlugin
- [ ] Маппинг Yup ошибок
- [ ] Поддержка validateAt
- [ ] Поддержка parse/transform
- [ ] Авто-регистрация
- [ ] Написание тестов
- [ ] Достижение coverage > 90%
- [ ] TSDoc документация
- [ ] README с примерами
- [ ] Финальная проверка ESLint
