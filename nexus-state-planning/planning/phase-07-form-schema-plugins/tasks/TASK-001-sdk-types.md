# TASK-001: SDK — Типы и интерфейсы

## 📋 Описание

Разработка системы типов и интерфейсов для SDK плагинов схем валидации. Определение контракта, который должны реализовывать все плагины.

## 🎯 Цель

Создать типизированный фундамент для системы плагинов, обеспечивающий:
- Единый интерфейс для всех схем валидации
- Типобезопасность при использовании плагинов
- Возможность замены плагинов без изменения кода form

## 📦 Требования к реализации

### Файлы для создания

```
packages/form/src/schema/
├── types.ts              # Основные интерфейсы
└── index.ts              # Публичный экспорт
```

### Интерфейсы для реализации

#### 1. Базовые типы

```typescript
// packages/form/src/schema/types.ts

/**
 * Уникальный идентификатор типа схемы
 * @example 'zod', 'yup', 'ajv', 'dsl'
 */
export type SchemaType = string;

/**
 * Ошибка валидации одного поля
 */
export interface FieldError {
  /** Сообщение об ошибке */
  message: string;
  /** Код ошибки для интернационализации */
  code?: string;
  /** Параметры для подстановки в сообщение */
  params?: Record<string, any>;
}

/**
 * Результат валидации формы
 */
export interface ValidationErrors<TValues extends Record<string, any> = any> {
  /** Ошибки по полям */
  fieldErrors: Partial<Record<keyof TValues, FieldError | null>>;
  /** Общие ошибки формы */
  formErrors?: FieldError[];
}

/**
 * Контекст валидации
 */
export interface ValidationContext<TValues extends Record<string, any> = any> {
  /** Все значения формы */
  values: TValues;
  /** Имя поля для полевой валидации */
  fieldName?: keyof TValues;
  /** Ссылка на форму для продвинутых сценариев */
  form?: any;
  /** Signal для отмены асинхронной валидации */
  signal?: AbortSignal;
}
```

#### 2. Интерфейс плагина

```typescript
/**
 * Базовый интерфейс плагина схемы валидации
 * Каждый плагин должен реализовать этот интерфейс
 */
export interface SchemaPlugin<TSchema = any, TValues extends Record<string, any> = any> {
  /**
   * Тип схемы (уникальный идентификатор)
   */
  readonly type: SchemaType;

  /**
   * Версия плагина для совместимости
   */
  readonly version?: string;

  /**
   * Создание экземпляра валидатора из схемы
   * @param schema - Исходная схема от пользователя
   * @returns Валидатор
   */
  create(schema: TSchema): SchemaValidator<TValues>;

  /**
   * Проверка поддержки схемы (type guard)
   * @param schema - Схема для проверки
   * @returns true если плагин может обработать схему
   */
  supports?(schema: any): schema is TSchema;
}

/**
 * Метаданные плагина
 */
export interface SchemaPluginMeta {
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

/**
 * Плагин с метаданными
 */
export interface SchemaPluginWithMeta<TSchema = any, TValues = any> 
  extends SchemaPlugin<TSchema, TValues> {
  meta: SchemaPluginMeta;
}
```

#### 3. Интерфейс валидатора

```typescript
/**
 * Экземпляр валидатора схемы
 */
export interface SchemaValidator<TValues extends Record<string, any> = any> {
  /**
   * Валидация всех значений формы
   */
  validate(
    values: TValues,
    context?: ValidationContext<TValues>
  ): Promise<ValidationErrors<TValues>> | ValidationErrors<TValues>;

  /**
   * Валидация одного поля
   */
  validateField?<K extends keyof TValues>(
    fieldName: K,
    value: TValues[K],
    context?: ValidationContext<TValues>
  ): Promise<FieldError | null> | FieldError | null;

  /**
   * Парсинг и трансформация значений
   */
  parse?(values: unknown): Promise<TValues> | TValues;

  /**
   * Очистка ресурсов
   */
  dispose?(): void;
}
```

### Публичный API

```typescript
// packages/form/src/schema/index.ts

/**
 * SDK для разработки плагинов схем валидации
 * @packageDocumentation
 */

// Типы
export type {
  SchemaType,
  FieldError,
  ValidationErrors,
  ValidationContext,
  SchemaPlugin,
  SchemaValidator,
  SchemaPluginMeta,
  SchemaPluginWithMeta,
} from './types';

// Реестр (будет реализован в TASK-002)
// export { SchemaRegistry, defaultSchemaRegistry } from './registry';

// Builder (будет реализован в TASK-003)
// export { createSchemaPlugin } from './builder';
```

## 🧪 Тестирование

### Требования
- **Coverage**: > 90% (branches > 85%)
- **Фреймворк**: Vitest
- **Типизация тестов**: strict mode

### Файлы тестов

```
packages/form/src/schema/__tests__/
└── types.test.ts
```

### Сценарии для тестирования

```typescript
// 1. Типы должны компилироваться без ошибок
import type { 
  SchemaPlugin, 
  SchemaValidator, 
  ValidationErrors 
} from '../types';

// 2. Проверка совместимости типов
describe('SchemaPlugin types', () => {
  it('should accept valid plugin implementation', () => {
    const mockPlugin: SchemaPlugin<any, any> = {
      type: 'mock',
      create: (schema) => ({
        validate: () => ({ fieldErrors: {} })
      })
    };
    expect(mockPlugin).toBeDefined();
  });

  it('should accept validator with all optional methods', () => {
    const mockValidator: SchemaValidator<any> = {
      validate: (values) => ({ fieldErrors: {} }),
      validateField: (name, value) => null,
      parse: (values) => values as any,
      dispose: () => {}
    };
    expect(mockValidator).toBeDefined();
  });

  it('should accept validator with only required methods', () => {
    const minimalValidator: SchemaValidator<any> = {
      validate: (values) => ({ fieldErrors: {} })
    };
    expect(minimalValidator).toBeDefined();
  });
});

// 3. Проверка ValidationErrors структуры
describe('ValidationErrors', () => {
  it('should accept empty errors', () => {
    const errors: ValidationErrors = { fieldErrors: {} };
    expect(errors.fieldErrors).toEqual({});
  });

  it('should accept field errors with all properties', () => {
    const errors: ValidationErrors = {
      fieldErrors: {
        username: {
          message: 'Required',
          code: 'required',
          params: {}
        }
      },
      formErrors: [{ message: 'Form invalid', code: 'invalid' }]
    };
    expect(errors.fieldErrors.username).toBeDefined();
  });
});
```

## 📁 Зависимости

- Нет (базовая задача)

## 🔗 Связанные задачи

- [[TASK-002]](./TASK-002-sdk-registry.md) — SDK: Реестр плагинов (использует типы)
- [[TASK-003]](./TASK-003-sdk-builder.md) — SDK: Builder (использует типы)
- [[TASK-006]](./TASK-006-zod-plugin.md) — Плагин Zod (реализует интерфейс)

## 📚 Ресурсы

- [TypeScript Handbook: Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- [TypeScript Handbook: Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [packages/form/src/types.ts](../../../packages/form/src/types.ts) — Существующие типы form

## ✅ Критерии приемки

- [ ] Файл `types.ts` создан со всеми интерфейсами
- [ ] Все типы экспортированы из `index.ts`
- [ ] TypeScript компилируется без ошибок (strict mode)
- [ ] Тесты покрывают > 90% кода
- [ ] TSDoc комментарии для всех публичных интерфейсов
- [ ] ESLint без ошибок
- [ ] Прогресс отмечен в [tasks/README.md](./README.md)

## 📝 Заметки

- Использовать только TypeScript (без runtime зависимостей)
- Избегать `any` — использовать дженерики
- Все интерфейсы должны быть документированы через TSDoc
- Экспортировать только публичные API (скрыть внутренние типы)

## 🔄 Прогресс

- [ ] Создание файла `types.ts`
- [ ] Реализация базовых типов (SchemaType, FieldError, ValidationErrors)
- [ ] Реализация интерфейсов (SchemaPlugin, SchemaValidator)
- [ ] Создание `index.ts` с экспортом
- [ ] Написание тестов
- [ ] Достижение coverage > 90%
- [ ] TSDoc документация
- [ ] Финальная проверка ESLint
