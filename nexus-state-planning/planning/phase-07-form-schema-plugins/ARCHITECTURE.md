# Architecture — Form Schema Plugin System

## Обзор

Плагинная система для `@nexus-state/form` позволяет подключать различные схемы валидации через единый интерфейс реестра.

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                   @nexus-state/form                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Schema Registry                      │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │  │
│  │  │   Zod   │ │   Yup   │ │   AJV   │ │   DSL   │  │  │
│  │  │ Plugin  │ │ Plugin  │ │ Plugin  │ │ Plugin  │  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Компоненты

### 1. Schema Registry

Реестр плагинов, управляющий регистрацией и созданием экземпляров валидаторов.

**Файлы:**
- [`packages/form/src/schema/registry.ts`](../../../packages/form/src/schema/registry.ts)

**API:**
```typescript
interface SchemaRegistry {
  register(type: string, plugin: SchemaPlugin): void;
  get(type: string): SchemaPlugin | null;
  create(type: string, schema: any): SchemaValidator | null;
  getRegisteredTypes(): string[];
  clear(): void;
}
```

**Пример использования:**
```typescript
import { defaultSchemaRegistry } from '@nexus-state/form/schema';

// Регистрация плагина
defaultSchemaRegistry.register('zod', zodPlugin);

// Создание валидатора
const validator = defaultSchemaRegistry.create('zod', myZodSchema);

// Проверка доступных типов
const types = defaultSchemaRegistry.getRegisteredTypes();
```

### 2. Schema Plugin Interface

Интерфейс, который должен реализовать каждый плагин.

**Файлы:**
- [`packages/form/src/schema/types.ts`](../../../packages/form/src/schema/types.ts)
- [`packages/form/src/schema/builder.ts`](../../../packages/form/src/schema/builder.ts)

**Интерфейс:**
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

  /** Проверить что схема подходит для этого плагина */
  supports?(schema: any): schema is TSchema;
}
```

**Meta интерфейс:**
```typescript
interface SchemaPluginMeta {
  name: string;
  description?: string;
  version: string;
  author?: string;
  repository?: string;
  dependencies?: SchemaType[];
}
```

### 3. Schema Validator

Интерфейс валидатора, создаваемого плагином.

```typescript
interface SchemaValidator<TValues = any> {
  /** Валидация всех значений формы */
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

  /** Парсинг и трансформация значений */
  parse?(values: unknown): Promise<TValues> | TValues;

  /** Очистка ресурсов */
  dispose?(): void;
}
```

### 4. Builder

Утилита для упрощения создания плагинов.

**Файлы:**
- [`packages/form/src/schema/builder.ts`](../../../packages/form/src/schema/builder.ts)

**API:**
```typescript
function createSchemaPlugin<TSchema, TValues>(
  config: PluginBuilderConfig<TSchema, TValues>
): SchemaPluginWithMeta<TSchema, TValues>;
```

**Пример:**
```typescript
import { createSchemaPlugin } from '@nexus-state/form/schema';

export const myPlugin = createSchemaPlugin({
  type: 'my-validator',
  meta: {
    name: '@nexus-state/form-schema-my-validator',
    version: '1.0.0',
    description: 'My custom validator',
  },
  create: (schema) => ({
    validate: async (values) => { /* ... */ },
  }),
  supports: (schema) => { /* ... */ },
});
```

### 5. Utils

Утилитные функции для разработки плагинов.

**Файлы:**
- [`packages/form/src/schema/utils.ts`](../../../packages/form/src/schema/utils.ts)

**Функции:**
- `normalizeFieldPath()` — нормализация путей полей
- `mergeValidationErrors()` — слияние ошибок валидации
- `createFieldError()` — создание FieldError
- `isEmpty()` / `isNotEmpty()` — проверка на пустоту
- `deepEqual()` — глубокое сравнение
- `debounce()` — debounce для функций
- `cache()` — кэширование результатов

## Поток данных

```
1. Пользователь создаёт форму с schemaType
   ↓
2. createForm запрашивает плагин из реестра
   ↓
3. Registry возвращает плагин по типу
   ↓
4. Плагин создаёт валидатор из схемы
   ↓
5. Валидатор выполняет валидацию
   ↓
6. Ошибки возвращаются в форму
```

**Диаграмма последовательности:**

```
User          createForm        Registry        Plugin        Validator
 │               │                │               │               │
 │──createForm──▶│                │               │               │
 │               │──get plugin───▶│               │               │
 │               │◀─plugin────────│               │               │
 │               │──create()──────▶│               │               │
 │               │◀─validator─────│               │               │
 │               │                │               │               │
 │──validate────▶│──validate()────▶│──validate()──▶│               │
 │               │                │               │               │
 │◀─errors───────│◀─errors────────│◀─errors───────│               │
```

## Расширение

### Создание плагина

1. Импортируйте `createSchemaPlugin`
2. Определите тип схемы
3. Реализуйте интерфейс валидатора
4. Зарегистрируйте плагин

**Пример:**
```typescript
import { createSchemaPlugin } from '@nexus-state/form/schema';

export const myPlugin = createSchemaPlugin({
  type: 'my-validator',
  meta: {
    name: '@nexus-state/form-schema-my-validator',
    version: '1.0.0',
  },
  create: (schema) => ({
    validate: async (values) => { /* ... */ },
    validateField: async (field, value) => { /* ... */ },
  }),
  supports: (schema) => { /* ... */ },
});
```

### Авто-регистрация

```typescript
// В конце файла index.ts плагина
if (typeof globalThis !== 'undefined') {
  import('@nexus-state/form/schema').then(({ defaultSchemaRegistry }) => {
    defaultSchemaRegistry.register('my-validator', myPlugin);
  });
}
```

## Интеграция с createForm

```typescript
import { createForm } from '@nexus-state/form';
import { z } from 'zod';
import '@nexus-state/form-schema-zod'; // Авто-регистрация

const form = createForm(store, {
  schemaType: 'zod',
  schemaConfig: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
  initialValues: {
    email: '',
    password: '',
  },
});
```

## Безопасность

- ⚠️ Валидация выполняется на клиенте
- ⚠️ Для критичных данных дублируйте валидацию на сервере
- ⚠️ Избегайте XSS в сообщениях об ошибках
- ✅ Экранируйте пользовательские данные в сообщениях

## Производительность

### Кэширование

Плагины могут кэшировать результаты валидации:

```typescript
const cache = new Map<string, { result: any; timestamp: number }>();

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

### Debounce

Используйте debounce для async валидации:

```typescript
import { debounce } from '@nexus-state/form/schema';

const debouncedValidate = debounce(async (values) => {
  return await api.validate(values);
}, 300);
```

### Tree Shaking

Подключайте только нужные плагины:

```typescript
// ✅ Хорошо
import { zodPlugin } from '@nexus-state/form-schema-zod';

// ❌ Избегайте
import * as plugins from '@nexus-state/form-schema-all';
```

## Миграция

### Версии

| Версия | Изменения |
|--------|-----------|
| 0.1.0 | Initial release |

### Совместимость

- Все плагины совместимы с `@nexus-state/form >= 0.1.0`
- Обратная совместимость с прямым `schema` параметром

## См. также

- [PLUGIN-GUIDE.md](./PLUGIN-GUIDE.md) — Руководство по созданию плагинов
- [examples/](./examples/) — Примеры использования
- [packages/form/src/schema/](../../../packages/form/src/schema/) — Исходный код SDK
