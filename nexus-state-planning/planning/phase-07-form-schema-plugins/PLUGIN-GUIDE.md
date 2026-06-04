# Plugin Developer Guide

## Введение

Это руководство по созданию плагинов для `@nexus-state/form`.

## Требования

- TypeScript 5.0+
- Знание TypeScript generics
- Понимание валидации форм

## Быстрый старт

### 1. Создание проекта

```bash
mkdir form-schema-my-validator
cd form-schema-my-validator
npm init -y
```

### 2. Установка зависимостей

```bash
npm install @nexus-state/form
npm install -D typescript vitest @types/node
```

### 3. Структура проекта

```
form-schema-my-validator/
├── src/
│   ├── __tests__/
│   │   └── index.test.ts
│   ├── index.ts
│   └── types.ts
├── package.json
└── tsconfig.json
```

### 4. Настройка tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "lib": ["ES2020"],
    "moduleResolution": "bundler"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "node_modules", "dist"]
}
```

## Создание плагина

### Базовый пример

```typescript
// src/index.ts
import { createSchemaPlugin } from '@nexus-state/form/schema';
import type { ValidationErrors, FieldError, ValidationContext } from '@nexus-state/form/schema';

export interface MySchema {
  [field: string]: MyRule[];
}

export interface MyRule {
  validate: (value: unknown) => string | null | Promise<string | null>;
  message?: string;
  code?: string;
}

export const myPlugin = createSchemaPlugin<MySchema, Record<string, unknown>>({
  type: 'my-validator',

  meta: {
    name: '@nexus-state/form-schema-my-validator',
    version: '1.0.0',
    description: 'My custom validator plugin',
    author: 'Your Name',
    repository: 'https://github.com/your/repo',
  },

  create(schema) {
    // Компиляция схемы
    const compiled = compileSchema(schema);

    return {
      async validate(values, context?: ValidationContext): Promise<ValidationErrors> {
        const errors: ValidationErrors = { fieldErrors: {} };

        for (const [field, rules] of Object.entries(compiled)) {
          for (const rule of rules) {
            const result = await rule.validate(values[field]);
            if (result) {
              errors.fieldErrors[field] = { 
                message: rule.message ?? result, 
                code: rule.code ?? 'my_error' 
              };
              break;
            }
          }
        }

        return errors;
      },

      async validateField<K extends keyof Record<string, unknown>>(
        fieldName: K,
        value: Record<string, unknown>[K],
        _context?: ValidationContext
      ): Promise<FieldError | null> {
        const rules = compiled[fieldName as string];
        if (!rules) return null;

        for (const rule of rules) {
          const result = await rule.validate(value);
          if (result) {
            return { message: rule.message ?? result, code: rule.code ?? 'my_error' };
          }
        }

        return null;
      },
    };
  },

  supports(schema) {
    // Проверка что схема подходит для плагина
    if (!schema || typeof schema !== 'object') return false;
    // Добавьте свою логику проверки
    return true;
  },
});

function compileSchema(schema: MySchema) {
  // Логика компиляции
  return schema;
}

// Авто-регистрация
if (typeof globalThis !== 'undefined') {
  import('@nexus-state/form/schema').then(({ defaultSchemaRegistry }) => {
    defaultSchemaRegistry.register('my-validator', myPlugin);
  });
}

export default myPlugin;
```

### Использование createSchemaPlugin builder

```typescript
import { createSchemaPlugin, createFieldError } from '@nexus-state/form/schema';

export const simplePlugin = createSchemaPlugin({
  type: 'simple',
  meta: {
    name: 'Simple Validator',
    version: '1.0.0',
  },
  create: (schema) => ({
    validate: async (values) => {
      const errors = { fieldErrors: {} as Record<string, FieldError> };
      
      for (const [key, value] of Object.entries(values)) {
        if (!value) {
          errors.fieldErrors[key] = createFieldError(
            'This field is required',
            'required'
          );
        }
      }
      
      return errors;
    },
  }),
  supports: (schema) => typeof schema === 'object',
});
```

## Интерфейсы

### SchemaPlugin

```typescript
interface SchemaPlugin<TSchema = any, TValues = any> {
  /** Уникальный тип плагина */
  readonly type: SchemaType;

  /** Версия плагина */
  readonly version?: string;

  /** Метаданные */
  meta?: SchemaPluginMeta;

  /** Создать валидатор из схемы */
  create(schema: TSchema): SchemaValidator<TValues>;

  /** Проверить что схема подходит */
  supports?(schema: unknown): schema is TSchema;
}
```

### SchemaPluginMeta

```typescript
interface SchemaPluginMeta {
  /** Название плагина */
  name: string;
  /** Описание */
  description?: string;
  /** Версия */
  version: string;
  /** Автор */
  author?: string;
  /** URL репозитория */
  repository?: string;
  /** Зависимости от других плагинов */
  dependencies?: SchemaType[];
}
```

### SchemaValidator

```typescript
interface SchemaValidator<TValues = any> {
  /** Валидация всех значений */
  validate(
    values: TValues,
    context?: ValidationContext<TValues>
  ): Promise<ValidationErrors<TValues>> | ValidationErrors<TValues>;

  /** Валидация одного поля */
  validateField?<K extends keyof TValues>(
    fieldName: K,
    value: TValues[K],
    context?: ValidationContext<TValues>
  ): Promise<FieldError | null> | FieldError | null;

  /** Парсинг и трансформация */
  parse?(values: unknown): Promise<TValues> | TValues;

  /** Очистка ресурсов */
  dispose?(): void;
}
```

### FieldError

```typescript
interface FieldError {
  /** Сообщение об ошибке */
  message: string;
  /** Код ошибки для i18n */
  code?: string;
  /** Параметры для подстановки */
  params?: Record<string, unknown>;
}
```

## Тестирование

### Пример теста

```typescript
// src/__tests__/index.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { myPlugin } from '../index';
import { defaultSchemaRegistry } from '@nexus-state/form/schema';

describe('myPlugin', () => {
  beforeEach(() => {
    defaultSchemaRegistry.clear();
  });

  it('should have correct type', () => {
    expect(myPlugin.type).toBe('my-validator');
  });

  it('should have correct metadata', () => {
    expect(myPlugin.meta?.name).toBe('@nexus-state/form-schema-my-validator');
    expect(myPlugin.meta?.version).toBe('1.0.0');
  });

  it('should create validator', () => {
    const validator = myPlugin.create({});
    expect(validator.validate).toBeDefined();
  });

  it('should validate correctly', async () => {
    const validator = myPlugin.create({
      name: [{ validate: (v) => (v ? null : 'Required') }],
    });

    const errors = await validator.validate({ name: 'Test' });
    expect(errors.fieldErrors).toEqual({});
  });

  it('should return errors for invalid data', async () => {
    const validator = myPlugin.create({
      name: [{ validate: (v) => (v ? null : 'Required') }],
    });

    const errors = await validator.validate({ name: '' });
    expect(errors.fieldErrors.name).toBeDefined();
  });

  it('should be creatable from registry', () => {
    defaultSchemaRegistry.register('my-validator', myPlugin);
    const validator = defaultSchemaRegistry.create('my-validator', {});
    expect(validator).toBeDefined();
  });
});
```

### Coverage

Требуемое покрытие:
- Statements: > 90%
- Branches: > 85%
- Functions: > 90%
- Lines: > 90%

### Запуск тестов

```bash
npm run test:coverage
```

## Публикация

### package.json

```json
{
  "name": "@nexus-state/form-schema-my-validator",
  "version": "1.0.0",
  "description": "My custom validator plugin",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "prepublishOnly": "npm run build && npm test"
  },
  "peerDependencies": {
    "@nexus-state/form": ">=0.1.0"
  },
  "devDependencies": {
    "@nexus-state/form": "workspace:*",
    "typescript": "^5.0.0",
    "vitest": "^3.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your/repo"
  },
  "license": "MIT",
  "author": "Your Name"
}
```

### README.md

```markdown
# @nexus-state/form-schema-my-validator

My custom validator plugin for Nexus State forms.

## Installation

```bash
npm install @nexus-state/form-schema-my-validator
```

## Usage

```typescript
import { createForm } from '@nexus-state/form';
import { myPlugin } from '@nexus-state/form-schema-my-validator';

const form = createForm(store, {
  schemaType: 'my-validator',
  schemaConfig: { /* ... */ },
  initialValues: { /* ... */ },
});
```

## API

### myPlugin

The main plugin export.

## License

MIT
```

## Best Practices

### 1. Типизация

Используйте строгую типизацию TypeScript:

```typescript
// ✅ Хорошо
export interface MySchema {
  [field: string]: MyRule[];
}

// ❌ Избегайте
export type MySchema = any;
```

### 2. Ошибки

Возвращайте понятные сообщения об ошибках:

```typescript
// ✅ Хорошо
return { message: 'Email must be valid', code: 'invalid_email' };

// ❌ Избегайте
return { message: 'Error' };
```

### 3. Производительность

Кэшируйте результаты при возможности:

```typescript
const cache = new Map<string, { result: unknown; timestamp: number }>();

const validate = async (values) => {
  const key = JSON.stringify(values);
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < 5000) {
    return cached.result;
  }
  
  const result = await performValidation(values);
  cache.set(key, { result, timestamp: Date.now() });
  return result;
};
```

### 4. Документация

Документируйте публичный API через TSDoc:

```typescript
/**
 * My custom validator plugin
 *
 * @example
 * ```typescript
 * const form = createForm(store, {
 *   schemaType: 'my-validator',
 *   schemaConfig: { /* ... *\/ },
 * });
 * ```
 */
export const myPlugin = createSchemaPlugin({ /* ... */ });
```

### 5. Тесты

Пишите тесты для всех сценариев:

- ✅ Валидные данные
- ✅ Невалидные данные
- ✅ Пустые значения
- ✅ Граничные случаи
- ✅ Ошибки валидации

## Примеры плагинов

- [Zod Plugin](../../../packages/form-schema-zod/src/index.ts)
- [Yup Plugin](../../../packages/form-schema-yup/src/index.ts)
- [AJV Plugin](../../../packages/form-schema-ajv/src/index.ts)
- [DSL Plugin](../../../packages/form-schema-dsl/src/index.ts)

## Утилиты

### normalizeFieldPath

Нормализация путей полей:

```typescript
import { normalizeFieldPath } from '@nexus-state/form/schema';

normalizeFieldPath('/users/0/name');  // 'users.0.name'
normalizeFieldPath('foo[0].bar');     // 'foo.0.bar'
```

### createFieldError

Создание FieldError:

```typescript
import { createFieldError } from '@nexus-state/form/schema';

const error = createFieldError(
  'Must be at least {min} characters',
  'min_length',
  { min: 3 }
);
```

### mergeValidationErrors

Слияние ошибок:

```typescript
import { mergeValidationErrors } from '@nexus-state/form/schema';

const merged = mergeValidationErrors(errors1, errors2, errors3);
```

## Поддержка

- GitHub Issues: https://github.com/eustatos/nexus-state/issues
- Discussions: https://github.com/eustatos/nexus-state/discussions
