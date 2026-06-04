# TASK-009: DSL плагин (ядро)

## 📋 Описание

Реализация кастомной DSL (Domain Specific Language) для схем валидации форм. DSL позволяет описывать правила валидации декларативно без использования внешних библиотек.

## 🎯 Цель

Создать легковесную систему валидации, которая:
- Не требует внешних зависимостей (Zod, Yup, AJV)
- Поддерживает декларативное описание правил
- Позволяет создавать кастомные валидаторы
- Поддерживает синхронную и асинхронную валидацию

## 📦 Требования к реализации

### Структура пакета

```
packages/form-schema-dsl/
├── src/
│   ├── __tests__/
│   │   └── index.test.ts    # Тесты ядра DSL
│   ├── index.ts             # Ядро DSL
│   ├── types.ts             # Типы DSL
│   └── validator.ts         # DSL валидатор
├── package.json
├── tsconfig.json
└── README.md
```

### package.json

```json
{
  "name": "@nexus-state/form-schema-dsl",
  "version": "0.1.0",
  "description": "Custom DSL schema validator for Nexus State forms",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    },
    "./validators": {
      "types": "./dist/validators.d.ts",
      "import": "./dist/validators.js",
      "require": "./dist/validators.js"
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
    "dsl",
    "validation",
    "schema",
    "nexus-state",
    "forms",
    "custom"
  ],
  "dependencies": {
    "@nexus-state/form": "workspace:*"
  },
  "devDependencies": {
    "@nexus-state/core": "workspace:*",
    "@nexus-state/form": "workspace:*",
    "@types/node": "^20.0.0",
    "typescript": "^5.9.3",
    "vitest": "^3.0.7"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/eustatos/nexus-state",
    "directory": "packages/form-schema-dsl"
  },
  "license": "MIT",
  "author": "Nexus State Contributors"
}
```

### Типы DSL

```typescript
// packages/form-schema-dsl/src/types.ts

import type { FieldError, ValidationContext } from '@nexus-state/form/schema';

/**
 * Функция валидации
 */
export type ValidatorFn<TValue = any> = (
  value: TValue,
  allValues?: any,
  context?: ValidationContext
) => string | null | Promise<string | null>;

/**
 * DSL правило валидации
 */
export interface DSLRule<TValue = any> {
  /** Функция валидации */
  validate: ValidatorFn<TValue>;
  
  /** Сообщение об ошибке (переопределяет возвращаемое) */
  message?: string;
  
  /** Код ошибки для i18n */
  code?: string;
  
  /** Асинхронный валидатор */
  async?: boolean;
  
  /** Опции */
  options?: {
    /** Debounce delay в мс */
    debounce?: number;
    /** Кэшировать результаты */
    cache?: boolean;
    /** Retry attempts */
    retry?: number;
    /** Timeout в мс */
    timeout?: number;
  };
}

/**
 * DSL схема
 * 
 * @example
 * ```typescript
 * const schema: DSLSchema = {
 *   username: [required, minLength(3)],
 *   email: [required, email],
 *   password: [required, minLength(8)],
 * };
 * ```
 */
export interface DSLSchema<TValues extends Record<string, any> = any> {
  [K in keyof TValues]?: DSLRule<TValues[K]> | DSLRule<TValues[K]>[];
}

/**
 * Результат компиляции DSL схемы
 */
export interface CompiledDSLRule<TValue = any> {
  validate: (value: TValue, allValues?: any, context?: ValidationContext) => Promise<FieldError | null>;
  originalRule: DSLRule<TValue>;
}

/**
 * Скомпилированная DSL схема
 */
export interface CompiledDSLSchema<TValues extends Record<string, any> = any> {
  [K in keyof TValues]: CompiledDSLRule<TValues[K]>[];
}
```

### Ядро DSL

```typescript
// packages/form-schema-dsl/src/index.ts

import {
  createSchemaPlugin,
  type ValidationErrors,
  type FieldError,
  createFieldError,
  type ValidationContext,
} from '@nexus-state/form/schema';
import type { DSLSchema, DSLRule, CompiledDSLRule, CompiledDSLSchema } from './types';

/**
 * Компилировать DSL правило
 */
function compileRule<TValue>(rule: DSLRule<TValue>): CompiledDSLRule<TValue> {
  const { validate, message, code, options } = rule;

  return {
    originalRule: rule,
    validate: async (value, allValues, context): Promise<FieldError | null> => {
      // Apply debounce if specified
      let result: string | null;
      
      if (options?.debounce) {
        // Debounce logic would be applied at higher level
        result = await validate(value, allValues, context);
      } else {
        result = await validate(value, allValues, context);
      }

      // Apply retry if specified
      if (options?.retry && result) {
        for (let i = 0; i < options.retry; i++) {
          result = await validate(value, allValues, context);
          if (!result) break;
        }
      }

      // Return error with overridden message/code if specified
      if (result) {
        return createFieldError(
          message ?? result,
          code ?? 'custom_validation',
          options
        );
      }

      return null;
    },
  };
}

/**
 * Компилировать DSL схему
 */
function compileSchema<TValues extends Record<string, any>>(
  schema: DSLSchema<TValues>
): CompiledDSLSchema<TValues> {
  const compiled: any = {};

  for (const [fieldName, rules] of Object.entries(schema)) {
    const rulesArray = Array.isArray(rules) ? rules : [rules];
    compiled[fieldName] = rulesArray.map(compileRule);
  }

  return compiled;
}

/**
 * DSL плагин для Nexus State forms
 * 
 * @example
 * ```typescript
 * import { createForm } from '@nexus-state/form';
 * import { dslValidator, required, minLength, email } from '@nexus-state/form-schema-dsl';
 * 
 * const form = createForm(store, {
 *   schemaType: 'dsl',
 *   schemaConfig: {
 *     username: [required, minLength(3)],
 *     email: [required, email],
 *     password: [required, minLength(8)],
 *   },
 *   initialValues: {
 *     username: '',
 *     email: '',
 *     password: '',
 *   }
 * });
 * ```
 */
export const dslPlugin = createSchemaPlugin<DSLSchema, any>({
  type: 'dsl',
  meta: {
    description: 'Custom DSL schema validator for Nexus State forms',
    version: '0.1.0',
    author: 'Nexus State Contributors',
    repository: 'https://github.com/eustatos/nexus-state',
    dependencies: [],
  },
  create: (schema) => {
    // Компиляция схемы
    const compiledSchema = compileSchema(schema);

    return {
      /**
       * Валидация всех значений формы
       */
      validate: async (values, context) => {
        const errors: ValidationErrors = { fieldErrors: {} };

        for (const [fieldName, rules] of Object.entries(compiledSchema)) {
          const value = values[fieldName];
          
          for (const compiledRule of rules) {
            const error = await compiledRule.validate(value, values, context);
            
            if (error) {
              errors.fieldErrors[fieldName] = error;
              break; // Первая ошибка останавливает валидацию поля
            }
          }
        }

        return errors;
      },

      /**
       * Валидация одного поля
       */
      validateField: async <K extends keyof any>(
        fieldName: K,
        value: any,
        allValues: any,
        context?: ValidationContext
      ): Promise<FieldError | null> => {
        const rules = compiledSchema[fieldName as string];
        
        if (!rules) {
          return null; // Нет правил для поля
        }

        for (const compiledRule of rules) {
          const error = await compiledRule.validate(value, allValues, context);
          
          if (error) {
            return error;
          }
        }

        return null;
      },
    };
  },

  /**
   * Проверка что схема является DSL схемой
   */
  supports: (schema: any): schema is DSLSchema => {
    if (!schema || typeof schema !== 'object') {
      return false;
    }

    // Проверка что все значения - правила или массивы правил
    for (const value of Object.values(schema)) {
      if (Array.isArray(value)) {
        // Массив правил
        if (!value.every((r) => r && typeof r === 'object' && 'validate' in r)) {
          return false;
        }
      } else if (value && typeof value === 'object') {
        // Одиночное правило
        if (!('validate' in value)) {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  },
});

/**
 * Авто-регистрация в глобальном реестре
 */
if (typeof globalThis !== 'undefined') {
  try {
    import('@nexus-state/form/schema').then(({ defaultSchemaRegistry }) => {
      defaultSchemaRegistry.register('dsl', dslPlugin);
    });
  } catch {
    // Игнорируем если реестр недоступен
  }
}

export { dslPlugin };
export default dslPlugin;
export type { DSLSchema, DSLRule, CompiledDSLRule, CompiledDSLSchema };
export { compileRule, compileSchema };
```

## 🧪 Тестирование

### Требования
- **Coverage**: > 90% (branches > 85%)
- **Фреймворк**: Vitest

### Файлы тестов

```
packages/form-schema-dsl/src/__tests__/
└── index.test.ts
```

### Сценарии для тестирования

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { dslPlugin, compileRule, compileSchema } from '../index';
import type { DSLRule, DSLSchema } from '../types';
import { defaultSchemaRegistry } from '@nexus-state/form/schema';

describe('dslPlugin', () => {
  beforeEach(() => {
    defaultSchemaRegistry.clear();
  });

  describe('plugin metadata', () => {
    it('should have correct metadata', () => {
      expect(dslPlugin.meta.name).toBe('@nexus-state/form-schema-dsl');
      expect(dslPlugin.type).toBe('dsl');
      expect(dslPlugin.meta.version).toBe('0.1.0');
    });
  });

  describe('supports()', () => {
    it('should recognize valid DSL schema', () => {
      const schema: DSLSchema = {
        name: { validate: (v) => v ? null : 'Required' },
      };
      expect(dslPlugin.supports(schema)).toBe(true);
    });

    it('should recognize DSL schema with array rules', () => {
      const schema: DSLSchema = {
        name: [
          { validate: (v) => v ? null : 'Required' },
          { validate: (v) => v.length >= 3 ? null : 'Too short' },
        ],
      };
      expect(dslPlugin.supports(schema)).toBe(true);
    });

    it('should reject invalid schema', () => {
      expect(dslPlugin.supports({})).toBe(false);
      expect(dslPlugin.supports(null)).toBe(false);
      expect(dslPlugin.supports({ name: 'invalid' })).toBe(false);
    });
  });

  describe('compileRule', () => {
    it('should compile a simple rule', async () => {
      const rule: DSLRule = {
        validate: (v) => (v ? null : 'Required'),
      };
      const compiled = compileRule(rule);

      const error = await compiled.validate('test');
      expect(error).toBeNull();

      const error2 = await compiled.validate('');
      expect(error2?.message).toBe('Required');
    });

    it('should override message', async () => {
      const rule: DSLRule = {
        validate: (v) => (v ? null : 'Original'),
        message: 'Overridden',
      };
      const compiled = compileRule(rule);

      const error = await compiled.validate('');
      expect(error?.message).toBe('Overridden');
    });

    it('should override code', async () => {
      const rule: DSLRule = {
        validate: (v) => (v ? null : 'Error'),
        code: 'custom_code',
      };
      const compiled = compileRule(rule);

      const error = await compiled.validate('');
      expect(error?.code).toBe('custom_code');
    });
  });

  describe('compileSchema', () => {
    it('should compile schema with single rules', () => {
      const schema: DSLSchema = {
        name: { validate: (v) => (v ? null : 'Required') },
      };
      const compiled = compileSchema(schema);

      expect(compiled.name).toHaveLength(1);
    });

    it('should compile schema with array rules', () => {
      const schema: DSLSchema = {
        name: [
          { validate: (v) => (v ? null : 'Required') },
          { validate: (v) => (v.length >= 3 ? null : 'Short') },
        ],
      };
      const compiled = compileSchema(schema);

      expect(compiled.name).toHaveLength(2);
    });
  });

  describe('validate()', () => {
    it('should pass valid data', async () => {
      const validator = dslPlugin.create({
        name: { validate: (v) => (v ? null : 'Required') },
      });

      const result = await validator.validate({ name: 'Test' });
      expect(result).toEqual({ fieldErrors: {} });
    });

    it('should return errors for invalid data', async () => {
      const validator = dslPlugin.create({
        name: { validate: (v) => (v ? null : 'Required') },
      });

      const result = await validator.validate({ name: '' });
      expect(result.fieldErrors.name).toBeDefined();
    });

    it('should stop on first error (not validate further rules)', async () => {
      const validator = dslPlugin.create({
        name: [
          { validate: (v) => (v ? null : 'Required') },
          { validate: (v) => (v.length >= 3 ? null : 'Short') },
        ],
      });

      const result = await validator.validate({ name: '' });
      
      // Только первая ошибка
      expect(result.fieldErrors.name?.message).toBe('Required');
    });

    it('should handle multiple field errors', async () => {
      const validator = dslPlugin.create({
        name: { validate: (v) => (v ? null : 'Required') },
        email: { validate: (v) => (v?.includes('@') ? null : 'Invalid email') },
      });

      const result = await validator.validate({ name: '', email: 'invalid' });
      
      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.email).toBeDefined();
    });

    it('should handle async validation', async () => {
      const validator = dslPlugin.create({
        username: {
          validate: async (v) => {
            await new Promise(r => setTimeout(r, 10));
            return v === 'taken' ? 'Username taken' : null;
          },
          async: true,
        },
      });

      const result = await validator.validate({ username: 'taken' });
      expect(result.fieldErrors.username).toBeDefined();
    });
  });

  describe('validateField()', () => {
    it('should validate single field', async () => {
      const validator = dslPlugin.create({
        email: { validate: (v) => (v?.includes('@') ? null : 'Invalid') },
      });

      const error = await validator.validateField('email', 'invalid', { email: 'invalid' });
      expect(error).toBeDefined();
    });

    it('should return null for valid field', async () => {
      const validator = dslPlugin.create({
        email: { validate: (v) => (v?.includes('@') ? null : 'Invalid') },
      });

      const error = await validator.validateField('email', 'valid@example.com', { email: 'valid@example.com' });
      expect(error).toBeNull();
    });

    it('should return null for unknown field', async () => {
      const validator = dslPlugin.create({
        email: { validate: (v) => (v?.includes('@') ? null : 'Invalid') },
      });

      const error = await validator.validateField('unknown', 'value', {});
      expect(error).toBeNull();
    });
  });

  describe('integration with registry', () => {
    it('should be creatable from registry', async () => {
      defaultSchemaRegistry.register('dsl', dslPlugin);

      const validator = defaultSchemaRegistry.create('dsl', {
        name: { validate: (v) => (v ? null : 'Required') },
      });
      
      expect(validator).toBeDefined();

      const result = await validator!.validate({ name: 'Test' });
      expect(result.fieldErrors).toEqual({});
    });
  });
});
```

## 📁 Зависимости

- [[TASK-001]](./TASK-001-sdk-types.md) — SDK: Типы и интерфейсы
- [[TASK-002]](./TASK-002-sdk-registry.md) — SDK: Реестр плагинов
- [[TASK-003]](./TASK-003-sdk-builder.md) — SDK: Builder

## 🔗 Связанные задачи

- [[TASK-008]](./TASK-008-ajv-plugin.md) — Плагин AJV (предыдущий)
- [[TASK-010]](./TASK-010-dsl-built-in-validators.md) — DSL валидаторы (sync)
- [[TASK-011]](./TASK-011-dsl-async-validators.md) — DSL валидаторы (async)

## 📚 Ресурсы

- [packages/form/src/schema/builder.ts](../../../packages/form/src/schema/builder.ts) — createSchemaPlugin

## ✅ Критерии приемки

- [ ] Пакет `form-schema-dsl` создан
- [ ] Типы DSL определены (DSLRule, DSLSchema)
- [ ] Ядро DSL реализовано
- [ ] Компиляция схем работает
- [ ] Авто-регистрация работает
- [ ] TypeScript компилируется без ошибок
- [ ] Тесты покрывают > 90% кода
- [ ] TSDoc комментарии
- [ ] README с примерами
- [ ] ESLint без ошибок
- [ ] Прогресс отмечен в [tasks/README.md](./README.md)

## 📝 Заметки

- DSL должен быть простым и понятным
- Поддержать массивы правил
- Первая ошибка останавливает валидацию поля
- Поддержать async валидацию

## 🔄 Прогресс

- [ ] Создание структуры пакета
- [ ] package.json с зависимостями
- [ ] types.ts с DSL типами
- [ ] compileRule функция
- [ ] compileSchema функция
- [ ] dslPlugin реализация
- [ ] Авто-регистрация
- [ ] Написание тестов
- [ ] Достижение coverage > 90%
- [ ] TSDoc документация
- [ ] README с примерами
- [ ] Финальная проверка ESLint
