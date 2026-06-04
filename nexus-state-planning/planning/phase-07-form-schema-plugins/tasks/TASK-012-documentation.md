# TASK-012: Документация

## 📋 Описание

Создание полной документации для плагинной системы схем валидации. Документация включает руководство по архитектуре, руководство разработчика плагинов, и документацию по API.

## 🎯 Цель

Предоставить разработчикам исчерпывающую документацию для:
- Понимания архитектуры системы
- Создания собственных плагинов
- Использования встроенных плагинов
- Интеграции с @nexus-state/form

## 📦 Требования к реализации

### Структура документов

```
planning/phase-07-form-schema-plugins/
├── ARCHITECTURE.md              # Архитектура системы
├── PLUGIN-GUIDE.md              # Руководство по созданию плагинов
└── examples/
    ├── README.md                # Индекс примеров
    ├── example-zod.md           # Пример с Zod
    ├── example-yup.md           # Пример с Yup
    ├── example-ajv.md           # Пример с AJV
    └── example-dsl.md           # Пример с DSL
```

### ARCHITECTURE.md

```markdown
# Architecture — Form Schema Plugin System

## Обзор

Плагинная система для @nexus-state/form позволяет подключать различные схемы валидации через единый интерфейс.

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

Реестр плагинов, управляющий регистрацией и созданием экземпляров.

**Файлы:**
- `packages/form/src/schema/registry.ts`

**API:**
```typescript
interface SchemaRegistry {
  register(type: string, plugin: SchemaPlugin): void;
  get(type: string): SchemaPlugin | undefined;
  create(type: string, schema: any): SchemaValidator | undefined;
  clear(): void;
}
```

### 2. Schema Plugin Interface

Интерфейс, который должен реализовать каждый плагин.

**Файлы:**
- `packages/form/src/schema/types.ts`

**Интерфейс:**
```typescript
interface SchemaPlugin<TSchema = any, TMeta = any> {
  type: string;
  meta: TMeta;
  create(schema: TSchema): SchemaValidator;
  supports(schema: any): schema is TSchema;
}
```

### 3. Schema Validator

Интерфейс валидатора, создаваемого плагином.

```typescript
interface SchemaValidator {
  validate(values: any, context?: ValidationContext): Promise<ValidationErrors>;
  validateField<K extends keyof any>(
    fieldName: K,
    value: any,
    allValues: any,
    context?: ValidationContext
  ): Promise<FieldError | null>;
}
```

### 4. Builder

Утилита для упрощения создания плагинов.

**Файлы:**
- `packages/form/src/schema/builder.ts`

**API:**
```typescript
function createSchemaPlugin<TSchema, TMeta>(
  definition: SchemaPluginDefinition<TSchema, TMeta>
): SchemaPlugin<TSchema, TMeta>;
```

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
  meta: { name: 'My Validator', version: '1.0.0' },
  create: (schema) => ({
    validate: async (values) => { /* ... */ },
    validateField: async (field, value, all) => { /* ... */ },
  }),
  supports: (schema) => { /* ... */ },
});
```

## Безопасность

- Валидация выполняется на клиенте
- Для критичных данных дублируйте на сервере
- Избегайте XSS в сообщениях об ошибках

## Производительность

### Кэширование

Плагины могут кэшировать результаты валидации.

### Debounce

Используйте debounce для async валидации.

### Tree Shaking

Подключайте только нужные плагины.

## Миграция

### Версии

| Версия | Изменения |
|--------|-----------|
| 0.1.0 | Initial release |

## См. также

- [PLUGIN-GUIDE.md](./PLUGIN-GUIDE.md) — Руководство по созданию плагинов
- [examples/](./examples/) — Примеры использования
```

### PLUGIN-GUIDE.md

```markdown
# Plugin Developer Guide

## Введение

Это руководство по созданию плагинов для @nexus-state/form.

## Требования

- TypeScript 5.0+
- Знание TypeScript
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

## Создание плагина

### Базовый пример

```typescript
// src/index.ts
import { createSchemaPlugin } from '@nexus-state/form/schema';
import type { ValidationErrors, FieldError } from '@nexus-state/form/schema';

export interface MySchema {
  [field: string]: MyRule[];
}

export interface MyRule {
  validate: (value: any) => string | null | Promise<string | null>;
  message?: string;
}

export const myPlugin = createSchemaPlugin<MySchema>({
  type: 'my-validator',

  meta: {
    name: '@nexus-state/form-schema-my-validator',
    version: '1.0.0',
    description: 'My custom validator plugin',
  },

  create(schema) {
    // Компиляция схемы
    const compiled = compileSchema(schema);

    return {
      async validate(values): Promise<ValidationErrors> {
        const errors: ValidationErrors = { fieldErrors: {} };

        for (const [field, rules] of Object.entries(compiled)) {
          for (const rule of rules) {
            const result = await rule.validate(values[field]);
            if (result) {
              errors.fieldErrors[field] = { message: result, code: 'my_error' };
              break;
            }
          }
        }

        return errors;
      },

      async validateField(field, value, allValues): Promise<FieldError | null> {
        const rules = compiled[field];
        if (!rules) return null;

        for (const rule of rules) {
          const result = await rule.validate(value);
          if (result) {
            return { message: result, code: 'my_error' };
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
```

### Авто-регистрация

```typescript
// В конце файла index.ts
if (typeof globalThis !== 'undefined') {
  import('@nexus-state/form/schema').then(({ defaultSchemaRegistry }) => {
    defaultSchemaRegistry.register('my-validator', myPlugin);
  });
}
```

## Интерфейсы

### SchemaPlugin

```typescript
interface SchemaPlugin<TSchema = any, TMeta = any> {
  /** Уникальный тип плагина */
  type: string;

  /** Метаданные */
  meta: TMeta & {
    name?: string;
    version?: string;
    description?: string;
    author?: string;
    repository?: string;
    dependencies?: string[];
  };

  /** Создать валидатор из схемы */
  create(schema: TSchema): SchemaValidator;

  /** Проверить что схема подходит */
  supports(schema: any): schema is TSchema;
}
```

### SchemaValidator

```typescript
interface SchemaValidator {
  /** Валидация всех значений */
  validate(
    values: any,
    context?: ValidationContext
  ): Promise<ValidationErrors>;

  /** Валидация одного поля */
  validateField<K extends keyof any>(
    fieldName: K,
    value: any,
    allValues: any,
    context?: ValidationContext
  ): Promise<FieldError | null>;
}
```

## Тестирование

### Пример теста

```typescript
// src/__tests__/index.test.ts
import { describe, it, expect } from 'vitest';
import { myPlugin } from '../index';

describe('myPlugin', () => {
  it('should have correct type', () => {
    expect(myPlugin.type).toBe('my-validator');
  });

  it('should create validator', () => {
    const validator = myPlugin.create({});
    expect(validator.validate).toBeDefined();
    expect(validator.validateField).toBeDefined();
  });

  it('should validate correctly', async () => {
    const validator = myPlugin.create({
      name: [{ validate: (v) => v ? null : 'Required' }],
    });

    const errors = await validator.validate({ name: 'Test' });
    expect(errors.fieldErrors).toEqual({});
  });
});
```

### Coverage

Требуемое покрытие:
- Statements: > 90%
- Branches: > 85%
- Functions: > 90%
- Lines: > 90%

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
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "peerDependencies": {
    "@nexus-state/form": ">=0.1.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your/repo"
  },
  "license": "MIT"
}
```

### Build script

```json
{
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "prepublishOnly": "npm run build && npm test"
  }
}
```

## Best Practices

### 1. Типизация

Используйте строгую типизацию TypeScript.

### 2. Ошибки

Возвращайте понятные сообщения об ошибках.

### 3. Производительность

Кэшируйте результаты при возможности.

### 4. Документация

Документируйте публичный API.

### 5. Тесты

Пишите тесты для всех сценариев.

## Примеры плагинов

- [Zod Plugin](../../../packages/form-schema-zod/src/index.ts)
- [Yup Plugin](../../../packages/form-schema-yup/src/index.ts)
- [AJV Plugin](../../../packages/form-schema-ajv/src/index.ts)
- [DSL Plugin](../../../packages/form-schema-dsl/src/index.ts)

## Поддержка

- GitHub Issues: https://github.com/eustatos/nexus-state/issues
- Discussions: https://github.com/eustatos/nexus-state/discussions
```

### examples/README.md

```markdown
# Examples Index

## Примеры использования

- [Zod Plugin](./example-zod.md) — Валидация с Zod
- [Yup Plugin](./example-yup.md) — Валидация с Yup
- [AJV Plugin](./example-ajv.md) — Валидация с JSON Schema
- [DSL Plugin](./example-dsl.md) — Валидация с DSL

## Быстрый старт

```typescript
import { createForm } from '@nexus-state/form';
import { zodPlugin } from '@nexus-state/form-schema-zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = createForm(store, {
  schemaType: 'zod',
  schemaConfig: schema,
  initialValues: { email: '', password: '' },
});
```
```

## 🧪 Тестирование

Для документации тесты не требуются, но необходимо проверить:

- [ ] Все ссылки работают
- [ ] Код компилируется
- [ ] Примеры актуальны
- [ ] Нет опечаток

## 📁 Зависимости

- [[TASK-001]](./TASK-001-sdk-types.md) — SDK: Типы и интерфейсы
- [[TASK-002]](./TASK-002-sdk-registry.md) — SDK: Реестр плагинов
- [[TASK-003]](./TASK-003-sdk-builder.md) — SDK: Builder
- [[TASK-006]](./TASK-006-zod-plugin.md) — Плагин Zod
- [[TASK-007]](./TASK-007-yup-plugin.md) — Плагин Yup
- [[TASK-008]](./TASK-008-ajv-plugin.md) — Плагин AJV
- [[TASK-009]](./TASK-009-dsl-plugin-core.md) — DSL плагин (ядро)
- [[TASK-010]](./TASK-010-dsl-built-in-validators.md) — DSL валидаторы (sync)
- [[TASK-011]](./TASK-011-dsl-async-validators.md) — DSL валидаторы (async)

## 🔗 Связанные задачи

- [[TASK-013]](./TASK-013-examples-demo.md) — Примеры и демо

## ✅ Критерии приемки

- [ ] ARCHITECTURE.md создан
- [ ] PLUGIN-GUIDE.md создан
- [ ] examples/README.md создан
- [ ] Все диаграммы отображаются
- [ ] Все ссылки работают
- [ ] Код в примерах рабочий
- [ ] TSDoc в исходниках
- [ ] Прогресс отмечен в [tasks/README.md](./README.md)

## 📝 Заметки

- Документация должна быть полной и актуальной
- Примеры кода должны компилироваться
- Диаграммы помогают пониманию

## 🔄 Прогресс

- [ ] ARCHITECTURE.md написан
- [ ] PLUGIN-GUIDE.md написан
- [ ] examples/README.md создан
- [ ] Проверка ссылок
- [ ] Финальная вычитка
