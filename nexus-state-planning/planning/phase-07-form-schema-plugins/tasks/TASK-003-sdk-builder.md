# TASK-003: SDK — Builder для плагинов

## 📋 Описание

Реализация builder-функции для упрощения создания плагинов схем валидации. Builder предоставляет удобный API для разработки плагинов без необходимости вручную реализовывать все интерфейсы.

## 🎯 Цель

Упростить разработку плагинов через:
- Автоматическое заполнение метаданных
- Типизированный конструктор плагинов
- Helper-функции для распространённых сценариев
- Уменьшение boilerplate кода

## 📦 Требования к реализации

### Файлы для создания

```
packages/form/src/schema/
├── builder.ts            # Builder функции
├── __tests__/
│   └── builder.test.ts   # Тесты builder
```

### Реализуемые интерфейсы

#### 1. Конфигурация builder

```typescript
// packages/form/src/schema/builder.ts

import {
  SchemaPlugin,
  SchemaValidator,
  ValidationErrors,
  FieldError,
  ValidationContext,
  SchemaPluginMeta,
  SchemaPluginWithMeta,
  SchemaType,
} from './types';

/**
 * Конфигурация для создания плагина
 */
export interface PluginBuilderConfig<TSchema, TValues extends Record<string, any>> {
  /** Тип схемы (уникальный идентификатор) */
  type: SchemaType;
  
  /** Метаданные плагина (без name/version — заполняются автоматически) */
  meta: Omit<SchemaPluginMeta, 'name' | 'version'>;
  
  /** Функция создания валидатора из схемы */
  create: (schema: TSchema) => {
    /** Валидация всех значений */
    validate?: (
      values: TValues,
      context?: ValidationContext<TValues>
    ) => Promise<ValidationErrors<TValues>> | ValidationErrors<TValues>;
    
    /** Валидация одного поля */
    validateField?: <K extends keyof TValues>(
      fieldName: K,
      value: TValues[K],
      context?: ValidationContext<TValues>
    ) => Promise<FieldError | null> | FieldError | null;
    
    /** Парсинг и трансформация */
    parse?: (values: unknown) => Promise<TValues> | TValues;
    
    /** Очистка ресурсов */
    dispose?: () => void;
  };
  
  /** Проверка поддержки схемы (type guard) */
  supports?: (schema: any) => boolean;
}
```

#### 2. Builder функция

```typescript
/**
 * Создать плагин схемы валидации
 * 
 * Автоматически заполняет метаданные:
 * - name: @nexus-state/form-schema-{type}
 * - version: 1.0.0 (переопределяется в meta)
 * 
 * @param config - Конфигурация плагина
 * @returns Плагин с метаданными
 * 
 * @example
 * ```typescript
 * const zodPlugin = createSchemaPlugin({
 *   type: 'zod',
 *   meta: {
 *     description: 'Zod schema validator',
 *     author: 'Your Name',
 *   },
 *   create: (schema) => ({
 *     validate: async (values) => {
 *       const result = await schema.safeParseAsync(values);
 *       if (result.success) return { fieldErrors: {} };
 *       // Map errors...
 *     },
 *   }),
 * });
 * ```
 */
export function createSchemaPlugin<TSchema, TValues extends Record<string, any>>(
  config: PluginBuilderConfig<TSchema, TValues>
): SchemaPluginWithMeta<TSchema, TValues> {
  const plugin: SchemaPluginWithMeta<TSchema, TValues> = {
    meta: {
      name: `@nexus-state/form-schema-${config.type}`,
      version: config.meta.version ?? '1.0.0',
      ...config.meta,
    },
    type: config.type,
    version: config.meta.version,
    create: config.create,
  };

  if (config.supports) {
    plugin.supports = config.supports;
  }

  return plugin;
}
```

#### 3. Helper-функции

```typescript
/**
 * Helper для создания простых синхронных валидаторов
 * 
 * @example
 * ```typescript
 * const syncValidator = createSyncValidator((values) => {
 *   const errors: ValidationErrors = { fieldErrors: {} };
 *   if (!values.email) {
 *     errors.fieldErrors.email = { message: 'Required', code: 'required' };
 *   }
 *   return errors;
 * });
 * ```
 */
export function createSyncValidator<TValues extends Record<string, any>>(
  validateFn: (
    values: TValues,
    context?: ValidationContext<TValues>
  ) => ValidationErrors<TValues>
): SchemaValidator<TValues> {
  return {
    validate: (values, context) => validateFn(values, context),
  };
}

/**
 * Helper для создания асинхронных валидаторов
 * 
 * @example
 * ```typescript
 * const asyncValidator = createAsyncValidator(async (values) => {
 *   const errors: ValidationErrors = { fieldErrors: {} };
 *   const response = await fetch('/api/validate');
 *   const result = await response.json();
 *   if (!result.valid) {
 *     errors.fieldErrors.username = { message: 'Taken', code: 'unique' };
 *   }
 *   return errors;
 * });
 * ```
 */
export function createAsyncValidator<TValues extends Record<string, any>>(
  validateFn: (
    values: TValues,
    context?: ValidationContext<TValues>
  ) => Promise<ValidationErrors<TValues>>
): SchemaValidator<TValues> {
  return {
    validate: (values, context) => validateFn(values, context),
  };
}

/**
 * Helper для создания полевого валидатора
 * 
 * @example
 * ```typescript
 * const fieldValidator = createFieldValidator((fieldName, value) => {
 *   if (fieldName === 'email' && !value.includes('@')) {
 *     return { message: 'Invalid email', code: 'email' };
 *   }
 *   return null;
 * });
 * ```
 */
export function createFieldValidator<TValues extends Record<string, any>>(
  validateFieldFn: <K extends keyof TValues>(
    fieldName: K,
    value: TValues[K],
    context?: ValidationContext<TValues>
  ) => FieldError | null
): Pick<SchemaValidator<TValues>, 'validateField'> {
  return {
    validateField: validateFieldFn,
  };
}

/**
 * Helper для создания композитного валидатора
 * 
 * @example
 * ```typescript
 * const composedValidator = composeValidators(
 *   createSyncValidator(syncValidate),
 *   createAsyncValidator(asyncValidate)
 * );
 * ```
 */
export function composeValidators<TValues extends Record<string, any>>(
  ...validators: Array<Partial<SchemaValidator<TValues>>>
): SchemaValidator<TValues> {
  return {
    validate: async (values, context) => {
      const allErrors: ValidationErrors<TValues> = { fieldErrors: {} };
      
      for (const validator of validators) {
        if (validator.validate) {
          const errors = await validator.validate(values, context);
          Object.assign(allErrors.fieldErrors, errors.fieldErrors);
          if (errors.formErrors) {
            allErrors.formErrors = [
              ...(allErrors.formErrors ?? []),
              ...errors.formErrors
            ];
          }
        }
      }
      
      return allErrors;
    },
    
    validateField: async (fieldName, value, context) => {
      for (const validator of validators) {
        if (validator.validateField) {
          const error = await validator.validateField(fieldName, value, context);
          if (error) return error;
        }
      }
      return null;
    },
  };
}
```

## 🧪 Тестирование

### Требования
- **Coverage**: > 90% (branches > 85%)
- **Фреймворк**: Vitest
- **Типизация тестов**: strict mode

### Файлы тестов

```
packages/form/src/schema/__tests__/
└── builder.test.ts
```

### Сценарии для тестирования

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSchemaPlugin,
  createSyncValidator,
  createAsyncValidator,
  createFieldValidator,
  composeValidators,
} from '../builder';
import type { SchemaPluginWithMeta, SchemaValidator } from '../types';

describe('createSchemaPlugin', () => {
  it('should create plugin with auto-generated name', () => {
    const plugin = createSchemaPlugin({
      type: 'test',
      meta: { description: 'Test plugin' },
      create: (schema) => ({ validate: () => ({ fieldErrors: {} }) }),
    });

    expect(plugin.meta.name).toBe('@nexus-state/form-schema-test');
  });

  it('should use provided version from meta', () => {
    const plugin = createSchemaPlugin({
      type: 'test',
      meta: { description: 'Test', version: '2.0.0' },
      create: (schema) => ({ validate: () => ({ fieldErrors: {} }) }),
    });

    expect(plugin.meta.version).toBe('2.0.0');
  });

  it('should default version to 1.0.0', () => {
    const plugin = createSchemaPlugin({
      type: 'test',
      meta: { description: 'Test' },
      create: (schema) => ({ validate: () => ({ fieldErrors: {} }) }),
    });

    expect(plugin.meta.version).toBe('1.0.0');
  });

  it('should include supports method if provided', () => {
    const supportsFn = (schema: any) => typeof schema === 'object';
    const plugin = createSchemaPlugin({
      type: 'test',
      meta: { description: 'Test' },
      create: (schema) => ({ validate: () => ({ fieldErrors: {} }) }),
      supports: supportsFn,
    });

    expect(plugin.supports).toBe(supportsFn);
  });

  it('should create validator from schema', async () => {
    const mockValidator: SchemaValidator = {
      validate: () => ({ fieldErrors: {} }),
    };
    
    const plugin = createSchemaPlugin({
      type: 'test',
      meta: { description: 'Test' },
      create: (schema) => mockValidator,
    });

    const validator = plugin.create({ some: 'schema' });
    expect(validator).toBe(mockValidator);
  });
});

describe('createSyncValidator', () => {
  it('should create sync validator', () => {
    const validateFn = (values: any) => ({ fieldErrors: {} });
    const validator = createSyncValidator(validateFn);

    expect(validator.validate).toBe(validateFn);
    expect(validator.validateField).toBeUndefined();
  });

  it('should pass context to validate function', () => {
    const contextSpy = vi.fn();
    const validator = createSyncValidator((values, context) => {
      contextSpy(values, context);
      return { fieldErrors: {} };
    });

    const mockContext = { values: { test: 1 } };
    validator.validate({ test: 1 }, mockContext);

    expect(contextSpy).toHaveBeenCalledWith({ test: 1 }, mockContext);
  });
});

describe('createAsyncValidator', () => {
  it('should create async validator', async () => {
    const validateFn = async (values: any) => ({ fieldErrors: {} });
    const validator = createAsyncValidator(validateFn);

    const result = await validator.validate({});
    expect(result).toEqual({ fieldErrors: {} });
  });

  it('should handle async errors', async () => {
    const validator = createAsyncValidator(async (values) => {
      throw new Error('Validation failed');
    });

    await expect(validator.validate({})).rejects.toThrow('Validation failed');
  });
});

describe('createFieldValidator', () => {
  it('should create field validator', () => {
    const validateFieldFn = (fieldName: any, value: any) => null;
    const validator = createFieldValidator(validateFieldFn);

    expect(validator.validateField).toBe(validateFieldFn);
    expect(validator.validate).toBeUndefined();
  });

  it('should return error for specific field', () => {
    const validator = createFieldValidator((fieldName, value) => {
      if (fieldName === 'email' && !value.includes('@')) {
        return { message: 'Invalid email', code: 'email' };
      }
      return null;
    });

    const error = validator.validateField('email', 'invalid');
    expect(error).toEqual({ message: 'Invalid email', code: 'email' });
  });
});

describe('composeValidators', () => {
  it('should compose multiple validators', async () => {
    const validator1: Partial<SchemaValidator> = {
      validate: (values) => ({ fieldErrors: {} }),
    };
    const validator2: Partial<SchemaValidator> = {
      validate: (values) => ({ fieldErrors: { name: { message: 'Required' } } }),
    };

    const composed = composeValidators(validator1, validator2);
    const result = await composed.validate({});

    expect(result.fieldErrors.name).toEqual({ message: 'Required' });
  });

  it('should merge errors from all validators', async () => {
    const validator1: Partial<SchemaValidator> = {
      validate: (values) => ({ 
        fieldErrors: { name: { message: 'Required' } },
        formErrors: [{ message: 'Form invalid' }]
      }),
    };
    const validator2: Partial<SchemaValidator> = {
      validate: (values) => ({ 
        fieldErrors: { email: { message: 'Invalid' } } 
      }),
    };

    const composed = composeValidators(validator1, validator2);
    const result = await composed.validate({});

    expect(result.fieldErrors.name).toBeDefined();
    expect(result.fieldErrors.email).toBeDefined();
    expect(result.formErrors).toHaveLength(1);
  });

  it('should stop on first field error in validateField', async () => {
    const validator1: Partial<SchemaValidator> = {
      validateField: (fieldName, value) => ({ message: 'Error 1', code: 'e1' }),
    };
    const validator2: Partial<SchemaValidator> = {
      validateField: (fieldName, value) => ({ message: 'Error 2', code: 'e2' }),
    };

    const composed = composeValidators(validator1, validator2);
    const result = await composed.validateField('test', 'value');

    expect(result).toEqual({ message: 'Error 1', code: 'e1' });
  });
});
```

## 📁 Зависимости

- [[TASK-001]](./TASK-001-sdk-types.md) — SDK: Типы и интерфейсы

## 🔗 Связанные задачи

- [[TASK-002]](./TASK-002-sdk-registry.md) — SDK: Реестр плагинов
- [[TASK-006]](./TASK-006-zod-plugin.md) — Плагин Zod (использует builder)
- [[TASK-009]](./TASK-009-dsl-plugin-core.md) — DSL плагин (использует builder)

## 📚 Ресурсы

- [TypeScript Handbook: Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [Builder Pattern](https://refactoring.guru/design-patterns/builder)
- [packages/form/src/schema/types.ts](../../../packages/form/src/schema/types.ts) — Типы из TASK-001

## ✅ Критерии приемки

- [ ] Файл `builder.ts` создан со всеми builder функциями
- [ ] `createSchemaPlugin` автоматически заполняет метаданные
- [ ] Helper-функции работают корректно
- [ ] TypeScript компилируется без ошибок (strict mode)
- [ ] Тесты покрывают > 90% кода
- [ ] TSDoc комментарии для всех публичных функций
- [ ] ESLint без ошибок
- [ ] Прогресс отмечен в [tasks/README.md](./README.md)

## 📝 Заметки

- Builder должен упрощать, а не усложнять
- Автоматические значения должны быть разумными по умолчанию
- Поддержать переопределение любых значений
- Helper-функции для типичных сценариев

## 🔄 Прогресс

- [ ] Создание файла `builder.ts`
- [ ] Интерфейс PluginBuilderConfig
- [ ] Функция createSchemaPlugin
- [ ] Helper createSyncValidator
- [ ] Helper createAsyncValidator
- [ ] Helper createFieldValidator
- [ ] Helper composeValidators
- [ ] Написание тестов
- [ ] Достижение coverage > 90%
- [ ] TSDoc документация
- [ ] Финальная проверка ESLint
