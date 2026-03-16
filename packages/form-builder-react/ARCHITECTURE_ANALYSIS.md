# Анализ архитектуры и план рефакторинга @nexus-state/form-builder

## Текущее состояние

### Структура пакетов

```
@nexus-state/
├── form-builder/          # Ядро: schema, state, registry, code generator
├── form-builder-ui/       # React UI компоненты (DnD, Canvas, Palette)
├── form/                  # Управление формами (validation, field-level state)
├── form-schema-zod/       # Zod валидатор
├── form-schema-yup/       # Yup валидатор
├── form-schema-dsl/       # Custom DSL
├── form-schema-ajv/       # JSON Schema (AJV)
├── react/                 # React bindings
├── vue/                   # Vue bindings
└── svelte/                # Svelte bindings
```

### Текущие зависимости

#### @nexus-state/form-builder
- **Production**: `@nexus-state/core`, `@nexus-state/form`, `@nexus-state/form-schema-dsl`
- **Peer**: `react` (optional)
- **Dev**: `@nexus-state/react`, `@types/react`

#### @nexus-state/form-builder-ui
- **Production**: `@nexus-state/form-builder`, `@dnd-kit/*`, `@nexus-state/react`
- **Peer**: `react`, `react-dom`

## Проблемы текущей архитектуры

### 1. Смешение ответственности

**Проблема**: `form-builder` содержит React-специфичный код (`React.ReactNode` в `ComponentDefinition`), но объявляет React как peer dependency.

**Влияние**:
- Невозможно использовать ядро без React
- Невозможно создать Vue/Svelte версии без дублирования ядра
- Нарушение принципа разделения ответственности

### 2. Дублирование кода

**Проблема**: `form-builder` и `form-builder-ui` тесно связаны, но разделены как пакеты.

**Влияние**:
- Сложность поддержки общих типов
- Потенциальные проблемы с версионированием

### 3. Отсутствие framework-agnostic ядра

**Проблема**: Нет отдельного пакета для framework-независимой логики.

**Влияние**:
- Невозможно использовать логику форм-билдера в React, Vue, Svelte без React
- Дублирование кода при добавлении новых framework-адаптеров

## Рекомендуемая архитектура

### Вариант 1: Выделение ядра (РЕКОМЕНДУЕМЫЙ)

```
@nexus-state/form-builder-core/    # Framework-agnostic ядро
├── schema/                        # Типы схемы
├── registry/                      # ComponentRegistry (без React)
├── state/                         # BuilderState
├── export/                        # Code generator
└── utils/

@nexus-state/form-builder-react/   # React адаптер
├── components/                    # UI компоненты
├── hooks/                         # React хуки
└── index.ts                       # Экспорт + React-специфичные типы

@nexus-state/form-builder-vue/     # Vue адаптер (новый)
@nexus-state/form-builder-svelte/  # Svelte адаптер (новый)
```

**Преимущества**:
- ✅ Чистое разделение ответственности
- ✅ Возможность использования ядра без React
- ✅ Легкое добавление новых framework-адаптеров
- ✅ Меньше дублирования кода
- ✅ Чистые зависимости (ядро не зависит от React)

**Недостатки**:
- ⚠️ Требует рефакторинга (средняя сложность)
- ⚠️ Нужно обновить документацию
- ⚠️ Breaking changes в API

### Вариант 2: Generic-подход (альтернативный)

Оставить `form-builder` как есть, но использовать generic типы:

```typescript
export interface ComponentDefinition<T = unknown> {
  type: string;
  label: string;
  // ...
  renderPreview: (props: Partial<FieldSchema>) => T;
  renderField: (props: FieldSchema) => T;
}

// Использование
type ReactComponentDefinition = ComponentDefinition<React.ReactNode>;
```

**Преимущества**:
- ✅ Меньше изменений в коде
- ✅ Обратная совместимость

**Недостатки**:
- ⚠️ Сложность для пользователей (нужно понимать generics)
- ⚠️ Меньшая типобезопасность

### Вариант 3: Оставить как есть (НЕ РЕКОМЕНДУЕТСЯ)

**Преимущества**:
- ✅ Никаких изменений

**Недостатки**:
- ❌ Нарушение принципов архитектуры
- ❌ Невозможность поддержки других framework'ов
- ❌ Потенциальные проблемы в будущем

## План реализации (Вариант 1)

### Этап 1: Создание `form-builder-core`

```bash
mkdir packages/form-builder-core
```

**Структура**:
```
packages/form-builder-core/
├── src/
│   ├── schema/           # Перенести из form-builder
│   ├── registry/         # Перенести (без React)
│   ├── state/            # Перенести
│   ├── export/           # Перенести
│   └── utils/            # Перенести
├── package.json
└── tsconfig.json
```

**Зависимости**:
```json
{
  "name": "@nexus-state/form-builder-core",
  "dependencies": {
    "@nexus-state/core": "workspace:*",
    "@nexus-state/form": "workspace:*"
  },
  "peerDependencies": {}
}
```

### Этап 2: Обновление `form-builder`

```bash
# Переименовать в form-builder-react
mv packages/form-builder packages/form-builder-react
```

**Новая структура**:
```
packages/form-builder-react/
├── src/
│   ├── components/       # UI компоненты (остаются)
│   ├── hooks/            # React хуки (новые)
│   └── index.ts          # Экспорт + React-специфичные типы
├── package.json
└── tsconfig.json
```

**Зависимости**:
```json
{
  "name": "@nexus-state/form-builder-react",
  "dependencies": {
    "@nexus-state/form-builder-core": "workspace:*",
    "@nexus-state/react": "workspace:*",
    "@dnd-kit/*": "^6.0.0"
  },
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0 || ^19.0.0"
  }
}
```

### Этап 3: Создание `form-builder-vue` и `form-builder-svelte`

Аналогично `form-builder-react`, но с Vue/Svelte зависимостями.

### Этап 4: Обновление зависимостей

```bash
# form-builder-ui зависит от form-builder-react
pnpm add @nexus-state/form-builder-react@workspace:* @nexus-state/form-builder-ui

# form-builder-ui зависит от form-builder-core
pnpm add @nexus-state/form-builder-core@workspace:* @nexus-state/form-builder-ui
```

## Именование пакетов

### Текущее:
- `@nexus-state/form-builder` → `@nexus-state/form-builder-react`
- `@nexus-state/form-builder-ui` → остается как есть (или `@nexus-state/form-builder-ui-react`)

### Альтернативное:
- `@nexus-state/form-builder` → остается как мета-пакет
- `@nexus-state/form-builder-core` → новое ядро
- `@nexus-state/form-builder-ui` → остается как есть

**Рекомендация**: Использовать `form-builder-react` для явности.

## Миграция

### Для пользователей

**Текущий импорт**:
```typescript
import { builderAtom, builderActions, defaultRegistry } from '@nexus-state/form-builder';
```

**Новый импорт**:
```typescript
// Ядро (без React)
import { builderAtom, builderActions } from '@nexus-state/form-builder-core';

// React адаптер
import { defaultRegistry, builtInComponents } from '@nexus-state/form-builder-react';
```

### Breaking changes

1. `@nexus-state/form-builder` → `@nexus-state/form-builder-react`
2. `defaultRegistry` теперь в `form-builder-react`
3. `builtInComponents` теперь в `form-builder-react`

## Приоритеты

### High (критично для продакшена):
1. ✅ Исправить ESLint ошибки
2. ✅ Добавить React в зависимости
3. ⏳ Добавить e2e тесты
4. ⏳ Создать CHANGELOG.md

### Medium (важно для будущего):
5. ⏳ Завершить code generator (Vue/Svelte, Yup)
6. ⏳ Добавить примеры использования
7. ⏳ Покрыть документацию API

### Low (стратегическое):
8. ⏳ Рефакторинг: выделить framework-agnostic ядро
9. ⏳ Переименование пакетов

## Заключение

**Рекомендация**: Выполнить Вариант 1 (выделение ядра) в ближайшее время, так как это:
- Обеспечивает масштабируемость
- Позволяет поддерживать несколько framework'ов
- Соответствует best practices
- Уменьшает технический долг

**Сроки**: 2-3 недели на полный рефакторинг с тестированием.
