# TASK-006: Плагин Zod

## 📋 Описание

Реализация плагина для схемы валидации Zod. Плагин позволяет использовать Zod схемы в @nexus-state/form через единый интерфейс реестра.

## 🎯 Цель

Создать референсную реализацию плагина, которая:
- Интегрируется с Zod (популярная библиотека валидации)
- Демонстрирует最佳шие практики разработки плагинов
- Поддерживает синхронную и асинхронную валидацию
- Корректно маппит ошибки Zod в формат FormErrors

## 📦 Требования к реализации

### Структура пакета

```
packages/form-schema-zod/
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
  "name": "@nexus-state/form-schema-zod",
  "version": "0.1.0",
  "description": "Zod schema validator plugin for Nexus State forms",
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
    "zod",
    "validation",
    "schema",
    "nexus-state",
    "forms"
  ],
  "peerDependencies": {
    "zod": "^3.0.0"
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
    "zod": "^3.23.8"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/eustatos/nexus-state",
    "directory": "packages/form-schema-zod"
  },
  "license": "MIT",
  "author": "Nexus State Contributors"
}
```

### Реализация плагина

```typescript
// packages/form-schema-zod/src/index.ts

import { z } from 'zod';
import {
  createSchemaPlugin,
  SchemaRegistry,
  normalizeFieldPath,
  createFieldError,
  type ValidationErrors,
  type FieldError,
} from '@nexus-state/form/schema';

/**
 * Zod плагин для Nexus State forms
 * 
 * @example
 * ```typescript
 * import { createForm } from '@nexus-state/form';
 * import { z } from 'zod';
 * 
 * const form = createForm(store, {
 *   schemaType: 'zod',
 *   schemaConfig: z.object({
 *     username: z.string().min(3),
 *     email: z.string().email(),
 *     password: z.string().min(8),
 *   }),
 *   initialValues: {
 *     username: '',
 *     email: '',
 *     password: '',
 *   }
 * });
 * ```
 */
export const zodPlugin = createSchemaPlugin<z.ZodType, any>({
  type: 'zod',
  meta: {
    description: 'Zod schema validator for Nexus State forms',
    version: '0.1.0',
    author: 'Nexus State Contributors',
    repository: 'https://github.com/eustatos/nexus-state',
    dependencies: [],
  },
  create: (schema) => {
    /**
     * Преобразовать Zod ошибку в FieldError
     */
    const zodIssueToFieldError = (issue: z.ZodIssue): FieldError => {
      return createFieldError(
        issue.message,
        issue.code,
        {
          received: issue.received,
          expected: issue.expected,
          path: issue.path.join('.'),
        }
      );
    };

    /**
     * Преобразовать Zod ошибки в ValidationErrors
     */
    const zodErrorsToValidationErrors = (
      error: z.ZodError
    ): ValidationErrors => {
      const fieldErrors: Record<string, FieldError | null> = {};

      for (const issue of error.issues) {
        const path = issue.path.join('.');
        if (path) {
          fieldErrors[path] = zodIssueToFieldError(issue);
        }
      }

      return { fieldErrors };
    };

    return {
      /**
       * Валидация всех значений формы
       */
      validate: async (values, context) => {
        try {
          const result = await schema.safeParseAsync(values, {
            abortSignal: context?.signal,
          });

          if (result.success) {
            return { fieldErrors: {} };
          }

          return zodErrorsToValidationErrors(result.error);
        } catch (error) {
          // Handle unexpected errors
          if (error instanceof z.ZodError) {
            return zodErrorsToValidationErrors(error);
          }
          throw error;
        }
      },

      /**
       * Валидация одного поля
       * 
       * Примечание: Zod валидирует всю схему, но мы возвращаем
       * ошибку только для конкретного поля
       */
      validateField: async <K extends keyof any>(
        fieldName: K,
        _value: any,
        allValues: any
      ): Promise<FieldError | null> => {
        try {
          const result = await schema.safeParseAsync(allValues, {
            abortSignal: context?.signal,
          });

          if (result.success) {
            return null;
          }

          // Найти ошибку для конкретного поля
          const fieldIssue = result.error.issues.find(
            (issue) => issue.path.join('.') === String(fieldName)
          );

          return fieldIssue ? zodIssueToFieldError(fieldIssue) : null;
        } catch (error) {
          if (error instanceof z.ZodError) {
            const fieldIssue = error.issues.find(
              (issue) => issue.path.join('.') === String(fieldName)
            );
            return fieldIssue ? zodIssueToFieldError(fieldIssue) : null;
          }
          throw error;
        }
      },

      /**
       * Парсинг и трансформация значений
       * Zod может трансформировать значения через .transform()
       */
      parse: async (values: unknown) => {
        return schema.parseAsync(values);
      },
    };
  },

  /**
   * Проверка что схема является Zod схемой
   */
  supports: (schema: any): schema is z.ZodType => {
    return (
      schema !== null &&
      typeof schema === 'object' &&
      'safeParseAsync' in schema &&
      'safeParse' in schema &&
      'parse' in schema
    );
  },
});

/**
 * Авто-регистрация в глобальном реестре
 * 
 * При импорте плагина он автоматически регистрируется
 */
if (typeof globalThis !== 'undefined') {
  try {
    // Динамический импорт для избежания circular dependency
    import('@nexus-state/form/schema').then(({ defaultSchemaRegistry }) => {
      defaultSchemaRegistry.register('zod', zodPlugin);
    });
  } catch {
    // Игнорируем если реестр недоступен (например, в SSR)
  }
}

export { zodPlugin };
export default zodPlugin;

/**
 * Type helper для инференса типа схемы
 * 
 * @example
 * ```typescript
 * const schema = z.object({ name: z.string() });
 * type SchemaType = InferZodType<typeof schema>;  // { name: string }
 * ```
 */
export type InferZodType<T extends z.ZodType> = z.infer<T>;
```

## 🧪 Тестирование

### Требования
- **Coverage**: > 90% (branches > 85%)
- **Фреймворк**: Vitest
- **Mocking**: изолировать Zod

### Файлы тестов

```
packages/form-schema-zod/src/__tests__/
└── index.test.ts
```

### Сценарии для тестирования

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { zodPlugin } from '../index';
import { defaultSchemaRegistry } from '@nexus-state/form/schema';

describe('zodPlugin', () => {
  beforeEach(() => {
    defaultSchemaRegistry.clear();
  });

  describe('plugin metadata', () => {
    it('should have correct metadata', () => {
      expect(zodPlugin.meta.name).toBe('@nexus-state/form-schema-zod');
      expect(zodPlugin.type).toBe('zod');
      expect(zodPlugin.meta.version).toBe('0.1.0');
    });
  });

  describe('supports()', () => {
    it('should recognize Zod schemas', () => {
      const schema = z.object({ name: z.string() });
      expect(zodPlugin.supports(schema)).toBe(true);
    });

    it('should reject non-Zod schemas', () => {
      expect(zodPlugin.supports({})).toBe(false);
      expect(zodPlugin.supports(null)).toBe(false);
    });
  });

  describe('validate()', () => {
    it('should pass valid data', async () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        name: 'John',
        email: 'john@example.com',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should return errors for invalid data', async () => {
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        name: 'Jo',
        email: 'invalid',
      });

      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
    });

    it('should handle nested schemas', async () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1),
        }),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        user: { name: '' },
      });

      expect(result.fieldErrors['user.name']).toBeDefined();
    });

    it('should handle array schemas', async () => {
      const schema = z.object({
        tags: z.array(z.string().min(1)),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        tags: ['valid', ''],
      });

      expect(result.fieldErrors['tags.1']).toBeDefined();
    });

    it('should handle async validation', async () => {
      const schema = z.object({
        email: z.string().email(),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        email: 'test@example.com',
      });

      expect(result.fieldErrors.email).toBeUndefined();
    });

    it('should handle Zod transforms', async () => {
      const schema = z.object({
        name: z.string().transform((val) => val.trim()),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.validate({
        name: '  John  ',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });
  });

  describe('validateField()', () => {
    it('should validate single field', async () => {
      const schema = z.object({
        email: z.string().email(),
      });
      const validator = zodPlugin.create(schema);

      const error = await validator.validateField(
        'email',
        'invalid',
        { email: 'invalid' }
      );

      expect(error).toBeDefined();
      expect(error?.message).toContain('email');
    });

    it('should return null for valid field', async () => {
      const schema = z.object({
        email: z.string().email(),
      });
      const validator = zodPlugin.create(schema);

      const error = await validator.validateField(
        'email',
        'valid@example.com',
        { email: 'valid@example.com' }
      );

      expect(error).toBeNull();
    });

    it('should only return error for specified field', async () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });
      const validator = zodPlugin.create(schema);

      const error = await validator.validateField(
        'email',
        'invalid',
        { email: 'invalid', password: 'short' }
      );

      expect(error).toBeDefined();

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
      const schema = z.object({
        name: z.string().transform((val) => val.trim().toUpperCase()),
      });
      const validator = zodPlugin.create(schema);

      const result = await validator.parse({
        name: '  john  ',
      });

      expect(result.name).toBe('JOHN');
    });

    it('should throw on invalid data', async () => {
      const schema = z.object({
        name: z.string(),
      });
      const validator = zodPlugin.create(schema);

      await expect(validator.parse(null)).rejects.toThrow();
    });
  });

  describe('integration with registry', () => {
    it('should be creatable from registry', async () => {
      defaultSchemaRegistry.register('zod', zodPlugin);

      const schema = z.object({
        name: z.string().min(1),
      });

      const validator = defaultSchemaRegistry.create('zod', schema);
      expect.validator).toBeDefined();

      const result = await validator!.validate({ name: 'Test' });
      expect(result.fieldErrors).toEqual({});
    });
  });
});

describe('InferZodType', () => {
  it('should infer type correctly (compile-time check)', () => {
    // This is a type-level test - should compile without errors
    type TestSchema = z.infer<z.ZodObject<{ name: z.ZodString }>>;
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

- [[TASK-007]](./TASK-007-yup-plugin.md) — Плагин Yup (следующий плагин)
- [[TASK-013]](./TASK-013-examples-demo.md) — Примеры (использует Zod плагин)

## 📚 Ресурсы

- [Zod Documentation](https://zod.dev/)
- [packages/form/src/schema/builder.ts](../../../packages/form/src/schema/builder.ts) — createSchemaPlugin
- [packages/form/src/schema/registry.ts](../../../packages/form/src/schema/registry.ts) — SchemaRegistry

## ✅ Критерии приемки

- [ ] Пакет `form-schema-zod` создан
- [ ] Плагин реализует все методы (validate, validateField, parse)
- [ ] Авто-регистрация работает
- [ ] Ошибки Zod корректно маппятся
- [ ] Поддержка nested schemas
- [ ] Поддержка array schemas
- [ ] TypeScript компилируется без ошибок
- [ ] Тесты покрывают > 90% кода
- [ ] TSDoc комментарии
- [ ] README с примерами
- [ ] ESLint без ошибок
- [ ] Прогресс отмечен в [tasks/README.md](./README.md)

## 📝 Заметки

- Использовать createSchemaPlugin builder
- Поддержать abortSignal для отмены
- Маппить Zod error codes в FieldError codes
- Предусмотреть type helper для инференса

## 🔄 Прогресс

- [ ] Создание структуры пакета
- [ ] package.json с зависимостями
- [ ] Реализация zodPlugin
- [ ] Маппинг Zod ошибок
- [ ] Поддержка validateField
- [ ] Поддержка parse/transform
- [ ] Авто-регистрация
- [ ] Написание тестов
- [ ] Достижение coverage > 90%
- [ ] TSDoc документация
- [ ] README с примерами
- [ ] Финальная проверка ESLint
