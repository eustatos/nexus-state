# Migration Guides

## Available Guides

- [Time-Travel Refactoring (v0.2.0)](#migration-guide-time-travel-refactoring)
- [Schema Validation API (v1.0)](#migration-guide-schema-validation-api)

---

# Migration Guide: Time-Travel Refactoring

## Обзор

В версии 0.2.0 архитектура time-travel debugging была значительно изменена. Time-travel функциональность выделена из `@nexus-state/core` в отдельные пакеты:

- `@nexus-state/time-travel` - расширенные возможности time-travel debugging
- `@nexus-state/undo-redo` - простой undo/redo для пользовательских интерфейсов

**Дата вступления в силу**: Март 2026  
**Критичность**: Breaking changes для пользователей time-travel API

---

## Breaking Changes

### 1. Удаление SimpleTimeTravel из core

**До**:
```typescript
import { SimpleTimeTravel } from '@nexus-state/core';

const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 100,
  autoCapture: true
});
```

**После**:
```typescript
import { SimpleTimeTravel } from '@nexus-state/time-travel';

const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 100,
  autoCapture: true
});
```

**Что нужно сделать**:
1. Обновите импорты во всех файлах
2. Добавьте зависимость `@nexus-state/time-travel` в package.json
3. Запустите тесты для проверки корректности

---

### 2. Изменение API DevTools

**До**:
```typescript
import { devTools, SimpleTimeTravel } from '@nexus-state/core';

const timeTravel = new SimpleTimeTravel(store);
const plugin = devTools();
plugin.apply(store);
plugin.setTimeTravel(timeTravel);
```

**После**:
```typescript
import { devTools } from '@nexus-state/devtools';
import { SimpleTimeTravel } from '@nexus-state/time-travel';

const timeTravel = new SimpleTimeTravel(store);
const plugin = devTools();
plugin.apply(store);
// timeTravel автоматически обнаруживается
```

**Что нужно сделать**:
- Обновите импорты
- Проверьте, что DevTools корректно отображают историю

---

### 3. Undo/Redo выделен в отдельный пакет

**До**:
```typescript
// Undo/Redo через SimpleTimeTravel
timeTravel.undo();
timeTravel.redo();
```

**После**:
```typescript
import { UndoRedo } from '@nexus-state/undo-redo';

const undoRedo = new UndoRedo(store, {
  maxHistory: 50
});

undoRedo.undo();
undoRedo.redo();
```

**Что нужно сделать**:
- Для простых UI используйте `@nexus-state/undo-redo`
- Для сложного debugging используйте `@nexus-state/time-travel`

---

## Пошаговая миграция

### Шаг 1: Обновление зависимостей

Добавьте новые пакеты в ваш `package.json`:

```json
{
  "dependencies": {
    "@nexus-state/core": "^0.2.0",
    "@nexus-state/time-travel": "^0.1.0",
    "@nexus-state/undo-redo": "^0.1.0",
    "@nexus-state/devtools": "^0.2.0"
  }
}
```

Затем выполните:
```bash
pnpm install
# или
npm install
# или
yarn install
```

---

### Шаг 2: Обновление импортов

#### Вариант A: Автоматическая миграция с codemod

```bash
npx @nexus-state/codemod time-travel-migration ./src
```

#### Вариант B: Ручное обновление

Найдите все импорты:
```bash
grep -r "SimpleTimeTravel" ./src --include="*.ts" --include="*.tsx"
grep -r "from '@nexus-state/core'" ./src --include="*.ts" --include="*.tsx"
```

Замените:
```typescript
// Было
import { SimpleTimeTravel, atom, createStore } from '@nexus-state/core';

// Стало
import { atom, createStore } from '@nexus-state/core';
import { SimpleTimeTravel } from '@nexus-state/time-travel';
```

---

### Шаг 3: Обновление конфигурации

#### Для текстовых редакторов

**До**:
```typescript
const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 100,
  autoCapture: true,
  deltaSnapshots: true
});
```

**После**:
```typescript
import { SimpleTimeTravel } from '@nexus-state/time-travel';

const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 100,
  autoCapture: true,
  deltaSnapshots: {
    enabled: true,
    fullSnapshotInterval: 10,
    maxDeltaChainLength: 20
  }
});
```

---

#### Для форм с undo/redo

**До**:
```typescript
const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 20
});

function undo() {
  timeTravel.undo();
}

function redo() {
  timeTravel.redo();
}
```

**После**:
```typescript
import { UndoRedo } from '@nexus-state/undo-redo';

const undoRedo = new UndoRedo(store, {
  maxHistory: 20
});

function undo() {
  undoRedo.undo();
}

function redo() {
  undoRedo.redo();
}
```

---

### Шаг 4: Обновление DevTools

**До**:
```typescript
import { devTools, SimpleTimeTravel } from '@nexus-state/core';

const timeTravel = new SimpleTimeTravel(store);
const plugin = devTools({ name: 'My App' });
plugin.apply(store);
plugin.setTimeTravel(timeTravel);
```

**После**:
```typescript
import { devTools } from '@nexus-state/devtools';
import { SimpleTimeTravel } from '@nexus-state/time-travel';

const timeTravel = new SimpleTimeTravel(store);
const plugin = devTools({ name: 'My App' });
plugin.apply(store);
// timeTravel автоматически обнаруживается через store.timeTravel
```

---

## Use Cases

### Use Case 1: Простой store без time-travel

Если вы не используете time-travel, никаких изменений не требуется:

```typescript
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/react';

const countAtom = atom(0, 'count');
const store = createStore();

function Counter() {
  const [count, setCount] = useAtom(countAtom, store);
  return <div>{count}</div>;
}
```

---

### Use Case 2: Текстовый редактор с undo/redo

**До**:
```typescript
import { SimpleTimeTravel } from '@nexus-state/core';

const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 100,
  autoCapture: false
});

function capture() {
  timeTravel.capture('user-action');
}

function undo() {
  timeTravel.undo();
}
```

**После**:
```typescript
import { UndoRedo } from '@nexus-state/undo-redo';

const undoRedo = new UndoRedo(store, {
  maxHistory: 100,
  autoCapture: false
});

function capture() {
  undoRedo.capture('user-action');
}

function undo() {
  undoRedo.undo();
}
```

---

### Use Case 3: DevTools с time-travel debugging

**До**:
```typescript
import { 
  createStore, 
  SimpleTimeTravel,
  devTools 
} from '@nexus-state/core';

const store = createStore();
const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 50,
  autoCapture: true
});

const plugin = devTools();
plugin.apply(store);
plugin.setTimeTravel(timeTravel);
```

**После**:
```typescript
import { createStore } from '@nexus-state/core';
import { SimpleTimeTravel } from '@nexus-state/time-travel';
import { devTools } from '@nexus-state/devtools';

const store = createStore();
const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 50,
  autoCapture: true,
  deltaSnapshots: {
    enabled: true,
    fullSnapshotInterval: 10
  }
});

const plugin = devTools();
plugin.apply(store);
```

---

### Use Case 4: React приложение с undo/redo кнопками

**До**:
```typescript
import { SimpleTimeTravel } from '@nexus-state/core';
import { useAtom } from '@nexus-state/react';

const timeTravel = new SimpleTimeTravel(store);

function Toolbar() {
  const canUndo = timeTravel.canUndo();
  const canRedo = timeTravel.canRedo();
  
  return (
    <div>
      <button disabled={!canUndo} onClick={() => timeTravel.undo()}>
        Undo
      </button>
      <button disabled={!canRedo} onClick={() => timeTravel.redo()}>
        Redo
      </button>
    </div>
  );
}
```

**После**:
```typescript
import { UndoRedo } from '@nexus-state/undo-redo';
import { useAtom } from '@nexus-state/react';

const undoRedo = new UndoRedo(store);

function Toolbar() {
  const canUndo = undoRedo.canUndo();
  const canRedo = undoRedo.canRedo();
  
  return (
    <div>
      <button disabled={!canUndo} onClick={() => undoRedo.undo()}>
        Undo
      </button>
      <button disabled={!canRedo} onClick={() => undoRedo.redo()}>
        Redo
      </button>
    </div>
  );
}
```

---

## Backward Compatibility

### Временное решение

Для обеспечения обратной совместимости в `@nexus-state/core` сохранён deprecated экспорт:

```typescript
// Временно работает, но будет удалено в v1.0.0
import { __deprecatedTimeTravel } from '@nexus-state/core';

const { SimpleTimeTravel } = __deprecatedTimeTravel;
```

**Важно**: Это временное решение! Обновите импорты до релиза v1.0.0.

---

## FAQ

### Q: Нужно ли обновлять все пакеты сразу?

**A**: Нет, но рекомендуется обновить:
1. `@nexus-state/core` → обязательно
2. `@nexus-state/time-travel` → если используете time-travel
3. `@nexus-state/devtools` → рекомендуется для совместимости

### Q: Что делать, если тесты падают после миграции?

**A**: Проверьте:
1. Все импорты `SimpleTimeTravel` обновлены
2. Конфигурация time-travel соответствует новому API
3. DevTools правильно инициализированы

### Q: Можно ли использовать оба подхода одновременно?

**A**: Да, временно:
```typescript
// Старый код
import { SimpleTimeTravel } from '@nexus-state/core';

// Новый код
import { SimpleTimeTravel } from '@nexus-state/time-travel';
```

Но это не рекомендуется для production.

### Q: Как проверить, что миграция прошла успешно?

**A**: Запустите:
```bash
pnpm build
pnpm test
```

Все тесты должны проходить, сборка без ошибок.

### Q: Что делать с примерами кода в документации?

**A**: Примеры в этой папке обновлены. Если у вас есть собственные примеры, обновите их по аналогии.

---

## Проверка после миграции

### Чеклист

- [ ] Все импорты `SimpleTimeTravel` обновлены
- [ ] Зависимости в package.json обновлены
- [ ] `pnpm install` выполнен без ошибок
- [ ] `pnpm build` проходит успешно
- [ ] `pnpm test` проходит успешно
- [ ] DevTools отображают историю
- [ ] Undo/Redo работают корректно
- [ ] Размеры bundles не увеличились критично

### Команды для проверки

```bash
# Сборка всех пакетов
pnpm build

# Запуск всех тестов
pnpm test

# Проверка размеров bundles
pnpm analyze-bundles

# Поиск старых импортов
grep -r "SimpleTimeTravel.*from.*core" ./src
```

---

## Поддержка

Если вы столкнулись с проблемами при миграции:

1. **GitHub Issues**: https://github.com/eustatos/nexus-state/issues
2. **Discussions**: https://github.com/eustatos/nexus-state/discussions
3. **Documentation**: https://nexus-state.website.yandexcloud.net/

---

## История изменений

### v0.2.0 (Март 2026)
- Выделение `@nexus-state/time-travel`
- Выделение `@nexus-state/undo-redo`
- Удаление time-travel из core
- Обновление DevTools для работы с новыми пакетами

### v2.x (Март 2026)
- Авто-инициализация атомов в `capture()`
- Предупреждение при дублировании имён атомов
- Обновление документации с best practices

### v0.1.x (До рефакторинга)
- Time-travel встроен в `@nexus-state/core`
- DevTools используют SimpleTimeTravel из core
- Undo/Redo через SimpleTimeTravel

---

## Дополнительные ресурсы

- [API Reference: @nexus-state/time-travel](./packages/time-travel/README.md)
- [API Reference: @nexus-state/undo-redo](./packages/undo-redo/README.md)
- [Time-Travel Debugging Guide](./docs/guides/time-travel.md)
- [DevTools Integration](./docs/recipes/devtools.md)

---

## Time-Travel Improvements (v2.x)

### Auto-initialization in capture()

**Before:**
```typescript
const atom1 = atom('initial', 'atom1');
const controller = new TimeTravelController(store);

// Required explicit initialization
store.set(atom1, 'initial');
controller.capture('init');
```

**After:**
```typescript
const atom1 = atom('initial', 'atom1');
const controller = new TimeTravelController(store);

// Auto-initialization - no explicit set() needed
controller.capture('init');
// ✅ atom1 is automatically initialized with 'initial'
```

**Impact:** No breaking changes. Existing code continues to work.

### Duplicate atom name warnings

**New behavior:**
```typescript
const atom1 = atom('value1', 'shared');
const atom2 = atom('value2', 'shared');
// ⚠️ Console warning: "Atom with name 'shared' already exists..."
```

**Impact:** No breaking changes. Only adds console warnings.

**Recommendation:** Update atom names to be unique to avoid warnings.

### Best Practices for Atom Naming

**Use unique, descriptive names:**
```typescript
// ✅ Good
const userAtom = atom(null, 'user');
const settingsAtom = atom({}, 'settings');

// ❌ Bad - duplicate names
const atom1 = atom('value1', 'data');
const atom2 = atom('value2', 'data');  // ⚠️ Warning!
```

**Why unique names matter:**
- DevTools relies on names to display atoms
- Time-travel uses names for snapshot serialization
- Debugging is easier with descriptive, unique names

**Naming conventions:**
- Use descriptive names: `userProfile`, `shoppingCart`, `authToken`
- Add prefixes for namespacing: `auth/user`, `ui/theme`, `api/cache`
- Avoid generic names: `data`, `state`, `value`

---

# Migration Guide: Schema Validation API (v1.0)

## Overview

The schema validation API has been refactored to use **explicit plugin imports** instead of global registry or direct validators.

**What Changed:**
- ❌ Removed: `zodValidator`, `yupValidator` from `@nexus-state/form`
- ❌ Deprecated: `schemaType` + `schemaConfig` (registry-based)
- ✅ New: `schemaPlugin` + `schemaConfig` (explicit imports)

## Quick Migration

### Before (Deprecated)

```typescript
// Option 1: Direct validator (REMOVED)
import { zodValidator } from '@nexus-state/form';

const form = createForm({
  schema: zodValidator(schema), // ❌ Removed
});

// Option 2: Registry-based (deprecated)
import { defaultSchemaRegistry } from '@nexus-state/form/schema';
defaultSchemaRegistry.register('zod', zodPlugin);

const form = createForm({
  schemaType: 'zod', // ⚠️ Deprecated
  schemaConfig: schema,
});
```

### After (Recommended)

```typescript
import { zodPlugin } from '@nexus-state/form-schema-zod';

const form = createForm({
  schemaPlugin: zodPlugin, // ✅ New API
  schemaConfig: schema,
});
```

## Full Migration Guide

See [packages/form/MIGRATION_SCHEMA.md](./packages/form/MIGRATION_SCHEMA.md) for detailed migration instructions.

## Installation

```bash
# For Zod
npm install @nexus-state/form-schema-zod zod

# For Yup
npm install @nexus-state/form-schema-yup yup

# For JSON Schema
npm install @nexus-state/form-schema-ajv ajv

# For DSL
npm install @nexus-state/form-schema-dsl
```

## Benefits

| Feature | Old API | New API |
|---------|---------|---------|
| **Global state** | ✅ Yes (registry) | ❌ No |
| **Tree-shaking** | ⚠️ Partial | ✅ Full |
| **SSR-safe** | ⚠️ No | ✅ Yes |
| **Type inference** | ⚠️ Manual | ✅ Automatic |

