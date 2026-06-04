# Creating a Custom Plugin

## Введение

Это руководство по созданию собственного плагина валидации для `@nexus-state/form`.

## Пример: Простой плагин

### Базовая структура

```typescript
// my-validator-plugin.ts
import { createSchemaPlugin } from '@nexus-state/form/schema';
import type { ValidationErrors, FieldError, ValidationContext } from '@nexus-state/form/schema';

export interface SimpleRule {
  validate: (value: unknown) => string | null;
  message?: string;
  code?: string;
}

export interface SimpleSchema {
  [field: string]: SimpleRule | SimpleRule[];
}

export const simplePlugin = createSchemaPlugin<SimpleSchema, Record<string, unknown>>({
  type: 'simple',

  meta: {
    name: 'my-simple-validator',
    version: '1.0.0',
    description: 'A simple validation plugin',
  },

  create(schema) {
    return {
      async validate(values): Promise<ValidationErrors> {
        const errors: ValidationErrors = { fieldErrors: {} };

        for (const [field, rules] of Object.entries(schema)) {
          const rulesArray = Array.isArray(rules) ? rules : [rules];
          const value = values[field];

          for (const rule of rulesArray) {
            const result = rule.validate(value);
            if (result) {
              errors.fieldErrors[field] = {
                message: rule.message ?? result,
                code: rule.code ?? 'simple_error',
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
        const rules = schema[fieldName as string];
        if (!rules) return null;

        const rulesArray = Array.isArray(rules) ? rules : [rules];

        for (const rule of rulesArray) {
          const result = rule.validate(value);
          if (result) {
            return {
              message: rule.message ?? result,
              code: rule.code ?? 'simple_error',
            };
          }
        }

        return null;
      },
    };
  },

  supports(schema) {
    if (!schema || typeof schema !== 'object') return false;
    
    for (const value of Object.values(schema)) {
      if (Array.isArray(value)) {
        if (!value.every((r) => r && typeof r === 'object' && 'validate' in r)) {
          return false;
        }
      } else if (!value || typeof value !== 'object' || !('validate' in value)) {
        return false;
      }
    }
    
    return true;
  },
});

// Авто-регистрация
if (typeof globalThis !== 'undefined') {
  import('@nexus-state/form/schema').then(({ defaultSchemaRegistry }) => {
    defaultSchemaRegistry.register('simple', simplePlugin);
  });
}

export default simplePlugin;
```

### Использование

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import { simplePlugin } from './my-validator-plugin';

const store = createStore();

const form = createForm(store, {
  schemaType: 'simple',
  schemaConfig: {
    username: {
      validate: (value) => {
        if (!value) return 'Username is required';
        if (typeof value !== 'string') return 'Username must be a string';
        if (value.length < 3) return 'Username must be at least 3 characters';
        return null;
      },
      message: 'Invalid username',
      code: 'invalid_username',
    },
    email: {
      validate: (value) => {
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email';
        return null;
      },
    },
  },
  initialValues: {
    username: '',
    email: '',
  },
});
```

## Пример: Плагин с Async валидацией

```typescript
import { createSchemaPlugin } from '@nexus-state/form/schema';
import type { ValidationErrors, FieldError, ValidationContext } from '@nexus-state/form/schema';

export interface AsyncRule {
  validate: (value: unknown, allValues?: Record<string, unknown>) => Promise<string | null>;
  message?: string;
  code?: string;
  async?: boolean;
}

export interface AsyncSchema {
  [field: string]: AsyncRule | AsyncRule[];
}

export const asyncPlugin = createSchemaPlugin<AsyncSchema, Record<string, unknown>>({
  type: 'async-validator',

  meta: {
    name: 'my-async-validator',
    version: '1.0.0',
    description: 'An async validation plugin',
  },

  create(schema) {
    return {
      async validate(values, context?: ValidationContext): Promise<ValidationErrors> {
        const errors: ValidationErrors = { fieldErrors: {} };

        for (const [field, rules] of Object.entries(schema)) {
          const rulesArray = Array.isArray(rules) ? rules : [rules];
          const value = values[field];

          for (const rule of rulesArray) {
            const result = await rule.validate(value, values);
            if (result) {
              errors.fieldErrors[field] = {
                message: rule.message ?? result,
                code: rule.code ?? 'async_error',
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
        allValues: Record<string, unknown>,
        _context?: ValidationContext
      ): Promise<FieldError | null> {
        const rules = schema[fieldName as string];
        if (!rules) return null;

        const rulesArray = Array.isArray(rules) ? rules : [rules];

        for (const rule of rulesArray) {
          const result = await rule.validate(value, allValues);
          if (result) {
            return {
              message: rule.message ?? result,
              code: rule.code ?? 'async_error',
            };
          }
        }

        return null;
      },

      dispose() {
        // Cleanup resources if needed
        console.log('Validator disposed');
      },
    };
  },

  supports(schema) {
    if (!schema || typeof schema !== 'object') return false;
    
    for (const value of Object.values(schema)) {
      if (Array.isArray(value)) {
        if (!value.every((r) => r && typeof r === 'object' && 'validate' in r)) {
          return false;
        }
      } else if (!value || typeof value !== 'object' || !('validate' in value)) {
        return false;
      }
    }
    
    return true;
  },
});

export default asyncPlugin;
```

### Использование async плагина

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import { asyncPlugin } from './my-async-validator';

const store = createStore();

const form = createForm(store, {
  schemaType: 'async-validator',
  schemaConfig: {
    username: {
      validate: async (value) => {
        if (!value) return 'Username is required';
        
        // Async check
        const response = await fetch(`/api/check-username?username=${value}`);
        const data = await response.json();
        
        return data.available ? null : 'Username is already taken';
      },
      async: true,
    },
    email: {
      validate: async (value) => {
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email';
        
        // Async check
        const response = await fetch(`/api/check-email?email=${value}`);
        const data = await response.json();
        
        return data.available ? null : 'Email is already registered';
      },
      async: true,
    },
  },
  initialValues: {
    username: '',
    email: '',
  },
});
```

## Пример: Плагин с кэшированием

```typescript
import { createSchemaPlugin } from '@nexus-state/form/schema';
import type { ValidationErrors, FieldError } from '@nexus-state/form/schema';

interface CacheEntry {
  result: ValidationErrors;
  timestamp: number;
  ttl: number;
}

export const cachedPlugin = createSchemaPlugin({
  type: 'cached-validator',

  meta: {
    name: 'my-cached-validator',
    version: '1.0.0',
  },

  create(schema) {
    const cache = new Map<string, CacheEntry>();

    return {
      async validate(values): Promise<ValidationErrors> {
        const key = JSON.stringify({ schema, values });
        const cached = cache.get(key);

        if (cached && Date.now() - cached.timestamp < cached.ttl) {
          return cached.result;
        }

        // Perform validation
        const errors: ValidationErrors = { fieldErrors: {} };
        
        // ... validation logic ...

        // Cache result
        cache.set(key, {
          result: errors,
          timestamp: Date.now(),
          ttl: 5000, // 5 seconds
        });

        return errors;
      },

      validateField(fieldName, value, allValues): Promise<FieldError | null> {
        // Field-level validation without caching
        return Promise.resolve(null);
      },

      dispose() {
        cache.clear();
      },
    };
  },

  supports(schema) {
    return schema !== null && typeof schema === 'object';
  },
});

export default cachedPlugin;
```

## Пример: Плагин с трансформацией

```typescript
import { createSchemaPlugin } from '@nexus-state/form/schema';
import type { ValidationErrors } from '@nexus-state/form/schema';

export interface TransformRule {
  transform: (value: unknown) => unknown;
  validate?: (value: unknown) => string | null;
}

export interface TransformSchema {
  [field: string]: TransformRule | TransformRule[];
}

export const transformPlugin = createSchemaPlugin<TransformSchema, Record<string, unknown>>({
  type: 'transform-validator',

  meta: {
    name: 'my-transform-validator',
    version: '1.0.0',
  },

  create(schema) {
    return {
      async validate(values): Promise<ValidationErrors> {
        const errors: ValidationErrors = { fieldErrors: {} };
        const transformedValues: Record<string, unknown> = {};

        for (const [field, rules] of Object.entries(schema)) {
          const rulesArray = Array.isArray(rules) ? rules : [rules];
          let value = values[field];

          // Apply transforms
          for (const rule of rulesArray) {
            if ('transform' in rule) {
              value = rule.transform(value);
            }
          }

          transformedValues[field] = value;

          // Validate transformed value
          for (const rule of rulesArray) {
            if ('validate' in rule && rule.validate) {
              const result = rule.validate(value);
              if (result) {
                errors.fieldErrors[field] = { message: result, code: 'transform_error' };
                break;
              }
            }
          }
        }

        return errors;
      },

      parse(values: unknown): Promise<Record<string, unknown>> {
        if (!values || typeof values !== 'object') {
          throw new Error('Invalid input');
        }

        const transformed: Record<string, unknown> = {};

        for (const [field, rules] of Object.entries(schema)) {
          const rulesArray = Array.isArray(rules) ? rules : [rules];
          let value = (values as Record<string, unknown>)[field];

          // Apply transforms
          for (const rule of rulesArray) {
            if ('transform' in rule) {
              value = rule.transform(value);
            }
          }

          transformed[field] = value;
        }

        return Promise.resolve(transformed);
      },

      validateField() {
        return Promise.resolve(null);
      },
    };
  },

  supports(schema) {
    return schema !== null && typeof schema === 'object';
  },
});

export default transformPlugin;
```

### Использование transform плагина

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import { transformPlugin } from './my-transform-validator';

const store = createStore();

const form = createForm(store, {
  schemaType: 'transform-validator',
  schemaConfig: {
    email: {
      transform: (value: string) => value?.toLowerCase().trim(),
      validate: (value) => {
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email';
        return null;
      },
    },
    name: {
      transform: (value: string) => value?.trim(),
      validate: (value) => {
        if (!value) return 'Name is required';
        return null;
      },
    },
    age: {
      transform: (value: string | number) => {
        if (typeof value === 'string') return parseInt(value, 10);
        return value;
      },
      validate: (value) => {
        if (typeof value !== 'number' || isNaN(value)) return 'Age must be a number';
        if (value < 18) return 'Must be at least 18';
        return null;
      },
    },
  },
  initialValues: {
    email: '  TEST@EXAMPLE.COM  ',
    name: '  John Doe  ',
    age: '25',
  },
});

// After validation, values will be transformed
```

## Публикация плагина

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

### tsconfig.json

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

## Тестирование плагина

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
    expect(myPlugin.meta?.name).toBe('my-validator-plugin');
    expect(myPlugin.meta?.version).toBe('1.0.0');
  });

  it('should create validator', () => {
    const validator = myPlugin.create({});
    expect(validator.validate).toBeDefined();
  });

  it('should validate correctly', async () => {
    const validator = myPlugin.create({
      name: { validate: (v) => (v ? null : 'Required') },
    });

    const errors = await validator.validate({ name: 'Test' });
    expect(errors.fieldErrors).toEqual({});
  });

  it('should return errors for invalid data', async () => {
    const validator = myPlugin.create({
      name: { validate: (v) => (v ? null : 'Required') },
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

## См. также

- [PLUGIN-GUIDE.md](../PLUGIN-GUIDE.md) — Руководство по созданию плагинов
- [ARCHITECTURE.md](../ARCHITECTURE.md) — Архитектура системы
