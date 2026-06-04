# TASK-008: Плагин AJV (JSON Schema)

## 📋 Описание

Реализация плагина для валидации через JSON Schema с использованием библиотеки AJV (Another JSON Schema Validator). Плагин позволяет использовать JSON Schema для валидации форм в @nexus-state/form.

## 🎯 Цель

Создать плагин для AJV, который:
- Интегрируется с AJV библиотекой
- Поддерживает JSON Schema Draft-07/2019/2020
- Корректно маппит ошибки AJV в формат FormErrors
- Поддерживает кастомные форматы и ключевые слова

## 📦 Требования к реализации

### Структура пакета

```
packages/form-schema-ajv/
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
  "name": "@nexus-state/form-schema-ajv",
  "version": "0.1.0",
  "description": "AJV (JSON Schema) validator plugin for Nexus State forms",
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
    "ajv",
    "json-schema",
    "validation",
    "schema",
    "nexus-state",
    "forms"
  ],
  "peerDependencies": {
    "ajv": "^8.0.0"
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
    "ajv": "^8.12.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/eustatos/nexus-state",
    "directory": "packages/form-schema-ajv"
  },
  "license": "MIT",
  "author": "Nexus State Contributors"
}
```

### Реализация плагина

```typescript
// packages/form-schema-ajv/src/index.ts

import Ajv, {
  type ValidateFunction,
  type ErrorObject,
  type Options as AjvOptions,
  type AddedKeywordDefinition,
} from 'ajv';
import {
  createSchemaPlugin,
  normalizeFieldPath,
  createFieldError,
  type ValidationErrors,
  type FieldError,
} from '@nexus-state/form/schema';

/**
 * Конфигурация AJV схемы
 */
export interface AjvSchemaConfig {
  /** JSON Schema объект */
  schema: object;
  /** Опции AJV */
  ajvOptions?: AjvOptions;
  /** Кастомные ключевые слова */
  keywords?: AddedKeywordDefinition[];
  /** Кастомные форматы */
  formats?: Record<string, string | RegExp | ((value: string) => boolean)>;
}

/**
 * AJV плагин для Nexus State forms
 * 
 * @example
 * ```typescript
 * import { createForm } from '@nexus-state/form';
 * 
 * const form = createForm(store, {
 *   schemaType: 'ajv',
 *   schemaConfig: {
 *     schema: {
 *       type: 'object',
 *       properties: {
 *         username: { type: 'string', minLength: 3 },
 *         email: { type: 'string', format: 'email' },
 *         password: { type: 'string', minLength: 8 },
 *       },
 *       required: ['username', 'email', 'password'],
 *     },
 *   },
 *   initialValues: {
 *     username: '',
 *     email: '',
 *     password: '',
 *   }
 * });
 * ```
 */
export const ajvPlugin = createSchemaPlugin<AjvSchemaConfig, any>({
  type: 'ajv',
  meta: {
    description: 'AJV (JSON Schema) validator for Nexus State forms',
    version: '0.1.0',
    author: 'Nexus State Contributors',
    repository: 'https://github.com/eustatos/nexus-state',
    dependencies: [],
  },
  create: (config) => {
    /**
     * Инициализация AJV instance
     */
    const ajv = new Ajv({
      allErrors: true,        // Собирать все ошибки
      strict: false,          // Не бросать на строгие режимы
      unicodeRegExp: false,   // Лучшая совместимость
      ...config.ajvOptions,
    });

    /**
     * Регистрация кастомных форматов
     */
    if (config.formats) {
      for (const [name, format] of Object.entries(config.formats)) {
        ajv.addFormat(name, format);
      }
    }

    /**
     * Регистрация кастомных ключевых слов
     */
    if (config.keywords) {
      for (const keyword of config.keywords) {
        ajv.addKeyword(keyword);
      }
    }

    /**
     * Компиляция схемы
     */
    const validate: ValidateFunction = ajv.compile(config.schema);

    /**
     * Преобразовать ошибку AJV в FieldError
     */
    const ajvErrorToFieldError = (error: ErrorObject): FieldError => {
      const path = normalizeFieldPath(error.instancePath);
      
      return createFieldError(
        error.message ?? 'Validation failed',
        error.keyword,
        {
          schemaPath: error.schemaPath,
          path,
          params: error.params as Record<string, any>,
        }
      );
    };

    /**
     * Преобразовать ошибки AJV в ValidationErrors
     */
    const ajvErrorsToValidationErrors = (
      errors: ErrorObject[]
    ): ValidationErrors => {
      const fieldErrors: Record<string, FieldError | null> = {};

      for (const error of errors) {
        const path = normalizeFieldPath(error.instancePath);
        if (path) {
          fieldErrors[path] = ajvErrorToFieldError(error);
        }
      }

      return { fieldErrors };
    };

    return {
      /**
       * Валидация всех значений формы
       */
      validate: (values) => {
        const valid = validate(values);

        if (valid) {
          return { fieldErrors: {} };
        }

        if (validate.errors) {
          return ajvErrorsToValidationErrors(validate.errors);
        }

        return { fieldErrors: {} };
      },

      /**
       * Валидация одного поля
       * 
       * AJV валидирует всю схему, но мы возвращаем
       * ошибку только для конкретного поля
       */
      validateField: <K extends keyof any>(
        fieldName: K,
        _value: any,
        allValues: any
      ): FieldError | null => {
        const valid = validate(allValues);

        if (valid) return null;

        const fieldPath = String(fieldName);
        
        // Найти ошибку для конкретного поля
        const fieldError = validate.errors?.find(
          (e) => normalizeFieldPath(e.instancePath) === fieldPath
        );

        return fieldError ? ajvErrorToFieldError(fieldError) : null;
      },

      /**
       * Парсинг и валидация
       * JSON Schema не поддерживает трансформацию, только валидацию
       */
      parse: (values: unknown) => {
        const valid = validate(values);
        
        if (!valid) {
          throw new Error(
            `Validation failed: ${validate.errors?.[0]?.message ?? 'Unknown error'}`
          );
        }

        return values as any;
      },

      /**
       * Очистка ресурсов
       */
      dispose: () => {
        ajv.removeSchema(config.schema);
      },
    };
  },

  /**
   * Проверка что конфигурация является валидной AJV схемой
   */
  supports: (config: any): config is AjvSchemaConfig => {
    return (
      config !== null &&
      typeof config === 'object' &&
      'schema' in config &&
      typeof config.schema === 'object'
    );
  },
});

/**
 * Авто-регистрация в глобальном реестре
 */
if (typeof globalThis !== 'undefined') {
  try {
    import('@nexus-state/form/schema').then(({ defaultSchemaRegistry }) => {
      defaultSchemaRegistry.register('ajv', ajvPlugin);
    });
  } catch {
    // Игнорируем если реестр недоступен
  }
}

export { ajvPlugin };
export default ajvPlugin;
export type { AjvSchemaConfig };

/**
 * Встроенные форматы для удобства
 */
export const builtInFormats = {
  /** Email формат */
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  /** URL формат */
  uri: /^https?:\/\/.+\..+/,
  
  /** UUID формат */
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  
  /** Date формат (YYYY-MM-DD) */
  date: /^\d{4}-\d{2}-\d{2}$/,
  
  /** DateTime формат (ISO 8601) */
  'date-time': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
  
  /** Time формат (HH:MM:SS) */
  time: /^\d{2}:\d{2}:\d{2}(\.\d+)?$/,
  
  /** IPv4 формат */
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  
  /** IPv6 формат */
  ipv6: /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
} as const;

/**
 * Helper для создания кастомного ключевого слова
 * 
 * @example
 * ```typescript
 * const adultKeyword = createCustomKeyword({
 *   keyword: 'adult',
 *   type: 'number',
 *   validate: (schema, age) => age >= schema,
 * });
 * ```
 */
export function createCustomKeyword(keyword: AddedKeywordDefinition): AddedKeywordDefinition {
  return keyword;
}
```

## 🧪 Тестирование

### Требования
- **Coverage**: > 90% (branches > 85%)
- **Фреймворк**: Vitest

### Файлы тестов

```
packages/form-schema-ajv/src/__tests__/
└── index.test.ts
```

### Сценарии для тестирования

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ajvPlugin, builtInFormats, createCustomKeyword } from '../index';
import { defaultSchemaRegistry } from '@nexus-state/form/schema';

describe('ajvPlugin', () => {
  beforeEach(() => {
    defaultSchemaRegistry.clear();
  });

  describe('plugin metadata', () => {
    it('should have correct metadata', () => {
      expect(ajvPlugin.meta.name).toBe('@nexus-state/form-schema-ajv');
      expect(ajvPlugin.type).toBe('ajv');
      expect(ajvPlugin.meta.version).toBe('0.1.0');
    });
  });

  describe('supports()', () => {
    it('should recognize valid AJV config', () => {
      const config = { schema: { type: 'string' } };
      expect(ajvPlugin.supports(config)).toBe(true);
    });

    it('should reject invalid config', () => {
      expect(ajvPlugin.supports({})).toBe(false);
      expect(ajvPlugin.supports(null)).toBe(false);
    });
  });

  describe('validate()', () => {
    it('should pass valid data', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            email: { type: 'string', format: 'email' },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({
        name: 'John',
        email: 'john@example.com',
      });

      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should return errors for invalid data', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 3 },
            email: { type: 'string', format: 'email' },
          },
          required: ['name', 'email'],
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({
        name: 'Jo',
        email: 'invalid',
      });

      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
    });

    it('should handle required fields', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({});

      expect(result.fieldErrors.name).toBeDefined();
    });

    it('should handle nested schemas', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
              required: ['name'],
            },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({
        user: {},
      });

      expect(result.fieldErrors['user.name']).toBeDefined();
    });

    it('should handle array schemas', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: { type: 'string', minLength: 1 },
            },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({
        tags: ['valid', ''],
      });

      expect(result.fieldErrors['tags.1']).toBeDefined();
    });

    it('should handle custom formats', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            website: { type: 'string', format: 'uri' },
          },
        },
        formats: { uri: builtInFormats.uri },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({
        website: 'not-a-url',
      });

      expect(result.fieldErrors.website).toBeDefined();
    });

    it('should collect all errors', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 3 },
            email: { type: 'string', format: 'email' },
            age: { type: 'number', minimum: 18 },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.validate({
        name: 'Jo',
        email: 'invalid',
        age: 10,
      });

      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.fieldErrors.age).toBeDefined();
    });
  });

  describe('validateField()', () => {
    it('should validate single field', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const error = await validator.validateField(
        'email',
        'invalid',
        { email: 'invalid' }
      );

      expect(error).toBeDefined();
    });

    it('should return null for valid field', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const error = await validator.validateField(
        'email',
        'valid@example.com',
        { email: 'valid@example.com' }
      );

      expect(error).toBeNull();
    });
  });

  describe('parse()', () => {
    it('should return valid values', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };
      const validator = ajvPlugin.create(config);

      const result = await validator.parse({ name: 'Test' });
      expect(result).toEqual({ name: 'Test' });
    });

    it('should throw on invalid data', async () => {
      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
      };
      const validator = ajvPlugin.create(config);

      await expect(validator.parse({})).rejects.toThrow();
    });
  });

  describe('dispose()', () => {
    it('should clean up resources', () => {
      const config = {
        schema: { type: 'string' },
      };
      const validator = ajvPlugin.create(config);

      expect(() => validator.dispose()).not.toThrow();
    });
  });

  describe('builtInFormats', () => {
    it('should have email format', () => {
      expect(builtInFormats.email.test('test@example.com')).toBe(true);
      expect(builtInFormats.email.test('invalid')).toBe(false);
    });

    it('should have uri format', () => {
      expect(builtInFormats.uri.test('https://example.com')).toBe(true);
      expect(builtInFormats.uri.test('not-a-url')).toBe(false);
    });

    it('should have uuid format', () => {
      expect(builtInFormats.uuid.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(builtInFormats.uuid.test('invalid-uuid')).toBe(false);
    });
  });

  describe('integration with registry', () => {
    it('should be creatable from registry', async () => {
      defaultSchemaRegistry.register('ajv', ajvPlugin);

      const config = {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      };

      const validator = defaultSchemaRegistry.create('ajv', config);
      expect(validator).toBeDefined();

      const result = await validator!.validate({ name: 'Test' });
      expect(result.fieldErrors).toEqual({});
    });
  });
});

describe('createCustomKeyword', () => {
  it('should create custom keyword', () => {
    const keyword = createCustomKeyword({
      keyword: 'adult',
      type: 'number',
      validate: (schema, age) => age >= schema,
    });

    expect(keyword.keyword).toBe('adult');
  });
});
```

## 📁 Зависимости

- [[TASK-001]](./TASK-001-sdk-types.md) — SDK: Типы и интерфейсы
- [[TASK-002]](./TASK-002-sdk-registry.md) — SDK: Реестр плагинов
- [[TASK-003]](./TASK-003-sdk-builder.md) — SDK: Builder
- [[TASK-004]](./TASK-004-sdk-utils.md) — SDK: Утилиты (normalizeFieldPath)
- [[TASK-005]](./TASK-005-form-integration.md) — Интеграция с createForm

## 🔗 Связанные задачи

- [[TASK-007]](./TASK-007-yup-plugin.md) — Плагин Yup (предыдущий)
- [[TASK-009]](./TASK-009-dsl-plugin-core.md) — DSL плагин (следующий)

## 📚 Ресурсы

- [AJV Documentation](https://ajv.js.org/)
- [JSON Schema Specification](https://json-schema.org/)
- [packages/form/src/schema/utils.ts](../../../packages/form/src/schema/utils.ts) — normalizeFieldPath

## ✅ Критерии приемки

- [ ] Пакет `form-schema-ajv` создан
- [ ] Плагин реализует все методы (validate, validateField, parse, dispose)
- [ ] Авто-регистрация работает
- [ ] Ошибки AJV корректно маппятся
- [ ] Поддержка nested schemas
- [ ] Поддержка array schemas
- [ ] Кастомные форматы работают
- [ ] TypeScript компилируется без ошибок
- [ ] Тесты покрывают > 90% кода
- [ ] TSDoc комментарии
- [ ] README с примерами JSON Schema
- [ ] ESLint без ошибок
- [ ] Прогресс отмечен в [tasks/README.md](./README.md)

## 📝 Заметки

- Использовать AJV v8+
- allErrors: true для сбора всех ошибок
- normalizeFieldPath для AJV paths
- Поддержать кастомные форматы и keywords
- Реализовать dispose для очистки

## 🔄 Прогресс

- [ ] Создание структуры пакета
- [ ] package.json с зависимостями
- [ ] Реализация ajvPlugin
- [ ] Маппинг AJV ошибок
- [ ] Поддержка custom formats
- [ ] Поддержка custom keywords
- [ ] Функция dispose
- [ ] builtInFormats константы
- [ ] Написание тестов
- [ ] Достижение coverage > 90%
- [ ] TSDoc документация
- [ ] README с примерами
- [ ] Финальная проверка ESLint
