# TASK-005: Интеграция с createForm

## 📋 Описание

Интеграция системы реестра схем валидации с функцией `createForm`. Добавление поддержки выбора схемы через `schemaType` + `schemaConfig` вместо прямого указания `schema`.

## 🎯 Цель

Обеспечить обратную совместимость и новый способ указания схемы:
- **Старый способ**: `schema: SchemaValidator` (прямой инстанс)
- **Новый способ**: `schemaType: 'zod' | 'yup' | ...` + `schemaConfig: any`

## 📦 Требования к реализации

### Файлы для модификации

```
packages/form/src/
├── create-form.ts        # Обновление FormOptions и createForm
└── types.ts              # Обновление типов FormOptions
```

### Изменения в типах

#### 1. Обновление FormOptions

```typescript
// packages/form/src/types.ts

// Добавить в FormOptions:

export interface FormOptions<TValues extends FormValues = FormValues> {
  initialValues?: TValues;
  
  // === СУЩЕСТВУЮЩИЕ ПОЛЯ (обратная совместимость) ===
  
  /**
   * Прямой инстанс валидатора (обратная совместимость)
   * @deprecated Используйте schemaType + schemaConfig для автоматической регистрации
   */
  schema?: SchemaValidator<TValues>;
  
  // === НОВЫЕ ПОЛЯ (через реестр) ===
  
  /**
   * Тип схемы для использования через реестр
   * @example 'zod', 'yup', 'ajv', 'dsl'
   */
  schemaType?: string;
  
  /**
   * Конфигурация схемы для передачи в фабрику плагиина
   * Интерпретируется в зависимости от schemaType
   */
  schemaConfig?: any;
  
  // === ОСТАЛЬНЫЕ ПОЛЯ (без изменений) ===
  
  validate?: FormValidator<TValues>;
  onSubmit?: (values: TValues) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  defaultValidationMode?: ValidationMode;
  defaultRevalidateMode?: ReValidateMode;
  showErrorsOnTouched?: boolean;
  store?: Store;
}
```

### Изменения в createForm

#### 2. Логика получения схемы

```typescript
// packages/form/src/create-form.ts

import { defaultSchemaRegistry } from './schema';
import type { SchemaValidator } from './schema';

export function createForm<TValues extends FormValues>(
  store: Store,
  options: FormOptions<TValues>
): Form<TValues> {
  // === ПОЛУЧЕНИЕ СХЕМЫ ИЗ РЕЕСТРА ИЛИ OPTIONS ===
  
  let schema: SchemaValidator<TValues> | undefined;
  
  // Приоритет 1: schemaType + schemaConfig (новый способ)
  if (options.schemaType && options.schemaConfig !== undefined) {
    schema = defaultSchemaRegistry.create(
      options.schemaType,
      options.schemaConfig
    );
    
    if (!schema) {
      const availableTypes = defaultSchemaRegistry.getRegisteredTypes();
      throw new Error(
        `Schema type "${options.schemaType}" not registered. ` +
        `Available types: ${availableTypes.join(', ') || 'none'}`
      );
    }
  }
  // Приоритет 2: прямой schema (старый способ)
  else if (options.schema) {
    schema = options.schema;
  }
  
  // === СУЩЕСТВУЮЩАЯ ЛОГИКА С ИСПОЛЬЗОВАНИЕМ schema ===
  
  // Validate all fields
  const validateAll = async (): Promise<boolean> => {
    const values = getValues();

    // Schema validation takes precedence
    if (schema) {
      const errors = await schema.validate(values);

      // Apply schema errors to fields
      for (const key in errors.fieldErrors) {
        const meta = fieldMetas.get(key as keyof TValues);
        const error = errors.fieldErrors[key as keyof typeof errors.fieldErrors];
        if (meta && error) {
          setFieldError(store, meta, error.message);
        }
      }

      // Clear errors for fields without schema errors
      for (const [key, meta] of fieldMetas.entries()) {
        if (!errors.fieldErrors[key]) {
          setFieldError(store, meta, null);
        }
      }
    }
    // Fallback to form-level validation
    else if (options.validate) {
      const errors = options.validate(values);
      if (errors) {
        for (const key in errors) {
          const meta = fieldMetas.get(key as keyof TValues);
          if (meta && errors[key]) {
            setFieldError(store, meta, errors[key]!);
          }
        }
      }
    }

    const isValid = checkIsValid();
    // ... update form state
    return isValid;
  };
  
  // ... остальная существующая логика
}
```

#### 3. Обновление validateField в field API

```typescript
// В функции field() внутри createForm:

const field = <K extends keyof TValues>(name: K): Field<TValues[K]> => {
  // ... существующий код
  
  return {
    // ... существующие поля
    
    setValue: (value: TValues[K]) => {
      setFieldValue(store, meta as FieldMeta<TValues[K]>, value);

      if (options.validateOnChange && schema?.validateField) {
        const values = { ...getValues(), [name]: value };
        
        const validationPromise = schema.validateField(name, value, values);
        Promise.resolve(validationPromise).then((error) => {
          if (error) {
            setFieldError(store, meta, error.message);
          } else {
            setFieldError(store, meta, null);
          }
        });
      }
    },
    
    setTouched: (touched: boolean) => {
      setFieldTouched(store, meta, touched);

      if (touched && options.validateOnBlur && schema?.validateField) {
        const values = getValues();
        const fieldState = store.get(meta.atom);
        
        const validationPromise = schema.validateField(name, fieldState.value, values);
        Promise.resolve(validationPromise).then((error) => {
          if (error) {
            setFieldError(store, meta, error.message);
          } else {
            setFieldError(store, meta, null);
          }
        });
      }
    },
    
    // ... остальной код
  };
};
```

## 🧪 Тестирование

### Требования
- **Coverage**: > 90% (branches > 85%)
- **Фреймворк**: Vitest
- **Mocking**: mock schema registry

### Файлы тестов

```
packages/form/src/__tests__/
└── create-form-schema-integration.test.ts
```

### Сценарии для тестирования

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { defaultSchemaRegistry } from '../schema';
import type { SchemaPlugin, SchemaValidator } from '../schema';

describe('createForm with schema registry', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    // Clear registry before each test
    defaultSchemaRegistry.clear();
  });

  describe('schemaType + schemaConfig (new way)', () => {
    it('should create form with schema from registry', async () => {
      // Register mock plugin
      const mockPlugin: SchemaPlugin<any, any> = {
        type: 'mock',
        create: (schema) => ({
          validate: (values) => ({
            fieldErrors: {
              name: schema.required && !values.name 
                ? { message: 'Required', code: 'required' } 
                : null
            }
          })
        })
      };
      defaultSchemaRegistry.register('mock', mockPlugin);

      const form = createForm(store, {
        schemaType: 'mock',
        schemaConfig: { required: true },
        initialValues: { name: '' }
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.name).toBe('Required');
    });

    it('should throw error for unregistered schema type', () => {
      expect(() => 
        createForm(store, {
          schemaType: 'unknown',
          schemaConfig: {},
        })
      ).toThrow('Schema type "unknown" not registered');
    });

    it('should pass schemaConfig to plugin create function', async () => {
      const createSpy = vi.fn(() => ({ validate: () => ({ fieldErrors: {} }) }));
      const mockPlugin: SchemaPlugin = {
        type: 'test',
        create: createSpy
      };
      defaultSchemaRegistry.register('test', mockPlugin);

      const config = { custom: 'config' };
      createForm(store, {
        schemaType: 'test',
        schemaConfig: config,
        initialValues: {}
      });

      expect(createSpy).toHaveBeenCalledWith(config);
    });
  });

  describe('schema (old way - backward compatibility)', () => {
    it('should work with direct schema instance', async () => {
      const directSchema: SchemaValidator = {
        validate: (values) => ({
          fieldErrors: {
            email: !values.email ? { message: 'Required' } : null
          }
        })
      };

      const form = createForm(store, {
        schema: directSchema,
        initialValues: { email: '' }
      });

      const isValid = await form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.email).toBe('Required');
    });

    it('should prefer schemaType over direct schema', async () => {
      const mockPlugin: SchemaPlugin = {
        type: 'mock',
        create: () => ({
          validate: () => ({ fieldErrors: { test: { message: 'From registry' } } })
        })
      };
      defaultSchemaRegistry.register('mock', mockPlugin);

      const directSchema: SchemaValidator = {
        validate: () => ({ fieldErrors: { test: { message: 'Direct' } } })
      };

      const form = createForm(store, {
        schemaType: 'mock',
        schemaConfig: {},
        schema: directSchema,  // Should be ignored
        initialValues: {}
      });

      const isValid = await form.validate();
      expect(form.errors.test).toBe('From registry');
    });
  });

  describe('validateField integration', () => {
    it('should call schema.validateField on change', async () => {
      const validateFieldSpy = vi.fn(() => null);
      const mockPlugin: SchemaPlugin = {
        type: 'mock',
        create: () => ({
          validate: () => ({ fieldErrors: {} }),
          validateField: validateFieldSpy
        })
      };
      defaultSchemaRegistry.register('mock', mockPlugin);

      const form = createForm(store, {
        schemaType: 'mock',
        schemaConfig: {},
        initialValues: { name: '' },
        validateOnChange: true
      });

      const field = form.field('name');
      field.setValue('test');

      // Wait for async validation
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(validateFieldSpy).toHaveBeenCalled();
    });

    it('should call schema.validateField on blur', async () => {
      const validateFieldSpy = vi.fn(() => null);
      const mockPlugin: SchemaPlugin = {
        type: 'mock',
        create: () => ({
          validate: () => ({ fieldErrors: {} }),
          validateField: validateFieldSpy
        })
      };
      defaultSchemaRegistry.register('mock', mockPlugin);

      const form = createForm(store, {
        schemaType: 'mock',
        schemaConfig: {},
        initialValues: { name: '' },
        validateOnBlur: true
      });

      const field = form.field('name');
      field.setTouched(true);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(validateFieldSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle schema validation errors gracefully', async () => {
      const mockPlugin: SchemaPlugin = {
        type: 'error',
        create: () => ({
          validate: () => { throw new Error('Validation error'); }
        })
      };
      defaultSchemaRegistry.register('error', mockPlugin);

      const form = createForm(store, {
        schemaType: 'error',
        schemaConfig: {},
        initialValues: {}
      });

      // Should not throw, but mark as invalid
      await expect(form.validate()).rejects.toThrow('Validation error');
    });

    it('should list available types in error message', () => {
      defaultSchemaRegistry.register('zod', { type: 'zod', create: () => ({}) });
      defaultSchemaRegistry.register('yup', { type: 'yup', create: () => ({}) });

      try {
        createForm(store, {
          schemaType: 'unknown',
          schemaConfig: {},
        });
      } catch (error: any) {
        expect(error.message).toContain('zod');
        expect(error.message).toContain('yup');
      }
    });
  });
});
```

## 📁 Зависимости

- [[TASK-001]](./TASK-001-sdk-types.md) — SDK: Типы и интерфейсы
- [[TASK-002]](./TASK-002-sdk-registry.md) — SDK: Реестр плагинов

## 🔗 Связанные задачи

- [[TASK-006]](./TASK-006-zod-plugin.md) — Плагин Zod (первый пользователь интеграции)
- [[TASK-009]](./TASK-009-dsl-plugin-core.md) — DSL плагин (использует интеграцию)

## 📚 Ресурсы

- [packages/form/src/create-form.ts](../../../packages/form/src/create-form.ts) — Текущая реализация
- [packages/form/src/types.ts](../../../packages/form/src/types.ts) — Текущие типы

## ✅ Критерии приемки

- [ ] `FormOptions` обновлён с `schemaType` и `schemaConfig`
- [ ] `createForm` поддерживает оба способа указания схемы
- [ ] Обратная совместимость сохранена
- [ ] Ошибки реестра отображаются корректно
- [ ] `validateField` интегрирован с схемой
- [ ] TypeScript компилируется без ошибок
- [ ] Тесты покрывают > 90% кода
- [ ] TSDoc комментарии обновлены
- [ ] ESLint без ошибок
- [ ] Прогресс отмечен в [tasks/README.md](./README.md)

## 📝 Заметки

- Сохранить полную обратную совместимость
- `schemaType` имеет приоритет над `schema`
- Предусмотреть понятные ошибки при отсутствии плагина
- Обновить документацию createForm

## 🔄 Прогресс

- [ ] Обновление `types.ts` с новыми полями
- [ ] Импорт `defaultSchemaRegistry` в `create-form.ts`
- [ ] Логика получения схемы из реестра
- [ ] Обработка ошибок при отсутствии плагина
- [ ] Интеграция с `validateAll()`
- [ ] Интеграция с `validateField` в `field()`
- [ ] Написание тестов
- [ ] Достижение coverage > 90%
- [ ] Обновление TSDoc
- [ ] Финальная проверка ESLint
