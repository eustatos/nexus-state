# Migration Guides

## Available Guides

- [Form Framework-Agnostic (v0.3.0)](#migration-guide-form-framework-agnostic)
- [Package Consolidation (v1.1.0)](#migration-guide-package-consolidation)
- [Global Singletons Removal (v1.0.0)](#migration-guide-global-singletons-removal)
- [DevTools Plugin Migration (v1.0.0)](#migration-guide-devtools-plugin)
- [Time-Travel Refactoring (v0.2.0)](#migration-guide-time-travel-refactoring)
- [Schema Validation API (v1.0)](#migration-guide-schema-validation-api)

---

# Migration Guide: Package Consolidation

## Overview

In v1.1.0, several small utility packages were consolidated into `@nexus-state/extras` to reduce package management overhead and improve discoverability.

**What Changed:**
- ❌ Deprecated: `@nexus-state/async` → use `@nexus-state/extras/async`
- ❌ Deprecated: `@nexus-state/family` → use `@nexus-state/extras/family`
- ❌ Deprecated: `@nexus-state/immer` → use `@nexus-state/extras/immer`
- ❌ Deprecated: `@nexus-state/persist` → use `@nexus-state/extras/persist`
- ❌ Deprecated: `@nexus-state/middleware` → use `@nexus-state/extras/middleware`
- ❌ Deprecated: `@nexus-state/web-worker` → use `@nexus-state/extras/web-worker`

**Why:** These packages were 20-180 lines each, creating unnecessary package management overhead. Consolidation reduces the number of packages from 23 to 18 while maintaining tree-shaking via subpath exports.

## Quick Migration

### Installation

```bash
# Install the consolidated package
npm install @nexus-state/extras
# or
pnpm add @nexus-state/extras

# Remove deprecated packages (optional, they still work with warnings)
npm uninstall @nexus-state/async @nexus-state/family @nexus-state/immer \
              @nexus-state/persist @nexus-state/middleware @nexus-state/web-worker
```

### Import Changes

```typescript
// Before (deprecated)
import { asyncAtom } from '@nexus-state/async';
import { atomFamily } from '@nexus-state/family';
import { immerAtom } from '@nexus-state/immer';
import { persist } from '@nexus-state/persist';
import { middleware } from '@nexus-state/middleware';
import { workerAtom } from '@nexus-state/web-worker';

// After (recommended)
import { asyncAtom } from '@nexus-state/extras/async';
import { atomFamily } from '@nexus-state/extras/family';
import { immerAtom } from '@nexus-state/extras/immer';
import { persist } from '@nexus-state/extras/persist';
import { middleware } from '@nexus-state/extras/middleware';
import { workerAtom } from '@nexus-state/extras/web-worker';
```

## Migration Table

| Old Package | New Import | Breaking Change |
|-------------|------------|-----------------|
| `@nexus-state/async` | `@nexus-state/extras/async` | No |
| `@nexus-state/family` | `@nexus-state/extras/family` | No |
| `@nexus-state/immer` | `@nexus-state/extras/immer` | No |
| `@nexus-state/persist` | `@nexus-state/extras/persist` | No |
| `@nexus-state/middleware` | `@nexus-state/extras/middleware` | No |
| `@nexus-state/web-worker` | `@nexus-state/extras/web-worker` | No |

## Backward Compatibility

The deprecated packages continue to work with deprecation warnings. They re-export from `@nexus-state/extras`:

```typescript
// This still works, but shows a deprecation warning
import { asyncAtom } from '@nexus-state/async';

// Under the hood, this is:
// export * from '@nexus-state/extras/async';
```

**Timeline:**
- **v0.3.0** (current): Deprecated packages available with warnings
- **v1.1.0**: Deprecated packages will be removed

## Tree-Shaking

The consolidated package maintains optimal tree-shaking. Only the modules you import are included in your bundle:

```typescript
// Only async module is included (~80 lines)
import { asyncAtom } from '@nexus-state/extras/async';

// Only persist module is included (~70 lines)
import { persist } from '@nexus-state/extras/persist';
```

## Benefits

| Metric | Before | After |
|--------|--------|-------|
| Number of packages | 23 | 18 |
| Package management overhead | High | Low |
| Tree-shaking | ✅ | ✅ |
| Bundle size | Same | Same |
| Discoverability | Low (many small packages) | High (one package with subpaths) |

---

# Migration Guide: Global Singletons Removal

## Overview

In v1.0.0, global singletons `batcher` and `globalActionTracker` were removed. Use per-instance alternatives instead.

**What Changed:**
- ❌ Removed: `batcher` global singleton from `@nexus-state/core/batching`
- ❌ Removed: `globalActionTracker` global singleton from `@nexus-state/core/utils`
- ✅ Use: `batch()` function from `@nexus-state/core/batching`
- ✅ Use: Per-instance `ActionTracker` from `@nexus-state/core/utils`

## Quick Migration

### Before (Deprecated)

```typescript
import { batcher } from '@nexus-state/core/batching';
import { globalActionTracker } from '@nexus-state/core/utils';

batcher.batch(() => {
  store.set(atom1, 1);
  store.set(atom2, 2);
});

globalActionTracker.trackAction({ type: 'SET', timestamp: Date.now() });
```

### After (Recommended)

```typescript
import { batch } from '@nexus-state/core/batching';
import { ActionTracker } from '@nexus-state/core/utils';

batch(() => {
  store.set(atom1, 1);
  store.set(atom2, 2);
});

const tracker = new ActionTracker();
tracker.trackAction({ type: 'SET', timestamp: Date.now() });
```

## Full Migration Guide

### 1. `batcher` → `batch()` function

```diff
- import { batcher } from '@nexus-state/core/batching';
+ import { batch } from '@nexus-state/core/batching';

- batcher.batch(() => {
+ batch(() => {
    store.set(atom1, 1);
    store.set(atom2, 2);
  });
```

**Why:** Global `batcher` was SSR-unsafe and caused test pollution. Use `batch()` function instead.

### 2. `globalActionTracker` → per-instance `ActionTracker`

```diff
- import { globalActionTracker } from '@nexus-state/core/utils';
+ import { ActionTracker } from '@nexus-state/core/utils';

- globalActionTracker.trackAction({ type: 'SET', timestamp: Date.now() });
+ const tracker = new ActionTracker();
+ tracker.trackAction({ type: 'SET', timestamp: Date.now() });
```

**Why:** Global `globalActionTracker` was SSR-unsafe. Use per-instance `ActionTracker` instead.

## Backward Compatibility

No backward compatibility. These exports were removed (not deprecated). Update your code before upgrading to v1.0.0.

## Benefits

| Metric | Before | After |
|--------|--------|-------|
| Global singletons | 2 | 0 |
| SSR-safe | No | Yes |
| Test pollution | Yes | No |

---

# Migration Guide: DevTools Plugin

## Overview

In v1.0.0, built-in `DevToolsIntegration` was removed from `StoreImpl`. DevTools is now an **optional plugin** that must be explicitly imported and applied.

**What Changed:**
- ❌ Removed: Built-in `DevToolsIntegration` from `StoreImpl`
- ❌ Deprecated: `options.devtools` and `options.devtoolsConfig`
- ❌ Deprecated: `store.getDevTools()` (returns `null`)
- ✅ New: `devtools()` plugin from `@nexus-state/core/devtools`

## Quick Migration

### Before (Deprecated)

```typescript
import { createStore } from '@nexus-state/core';

const store = createStore({ devtools: true });
// or
const store = createStore({
  devtools: true,
  devtoolsConfig: { enableStackTrace: true }
});
```

### After (Recommended)

```typescript
import { createStore } from '@nexus-state/core';
import { devtools } from '@nexus-state/core/devtools';

const store = createStore({ plugins: [devtools()] });
// or with options
const store = createStore({
  plugins: [devtools({ name: 'MyApp', maxHistory: 100 })]
});
```

## Full Migration Guide

### 1. `options.devtools` → `devtools()` plugin

```diff
  import { createStore } from '@nexus-state/core';
+ import { devtools } from '@nexus-state/core/devtools';

- const store = createStore({ devtools: true });
+ const store = createStore({ plugins: [devtools()] });
```

### 2. `options.devtoolsConfig` → `devtools(options)`

```diff
  import { createStore } from '@nexus-state/core';
+ import { devtools } from '@nexus-state/core/devtools';

  const store = createStore({
-   devtools: true,
-   devtoolsConfig: { enableStackTrace: true, debounceDelay: 200 }
+   plugins: [devtools({ name: 'MyApp' })]
  });
```

### 3. `store.getDevTools()` → removed

```diff
- const devTools = store.getDevTools();
- devTools.trackStateChange(atom, value);
+ // Use devtools() plugin instead — tracking is automatic
```

### 4. `createEnhancedStore()` → `createStore()` with plugin

```diff
  import { createStore } from '@nexus-state/core';
+ import { devtools } from '@nexus-state/core/devtools';

- const store = createEnhancedStore();
+ const store = createStore({ plugins: [devtools()] });
```

## Backward Compatibility

`options.devtools` is still accepted but shows a deprecation warning. It has **no effect** — DevTools code is no longer in the core path. Use the `devtools()` plugin for actual DevTools functionality.

## Benefits

| Metric | Before | After |
|--------|--------|-------|
| Minimal bundle (atom + store) | 5.35 KB | < 5 KB |
| DevTools in minimal bundle | Yes (0.35 KB) | No |
| Tree-shakeable DevTools | No | Yes |
| SSR-safe | Partially | Fully |

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

---

# Migration Guide: Form Framework-Agnostic

## Overview

In v0.3.0, `@nexus-state/form` was made framework-agnostic by removing the hard dependency on React and `@nexus-state/react`.

**What Changed:**
- ❌ `@nexus-state/react` removed from `dependencies`
- ✅ `react` is now an **optional** peer dependency
- ✅ Core API (`createForm`) works without React
- ✅ React hooks moved to `@nexus-state/form/react` subpath (already in v0.2.x)
- ✅ `ChangeEvent` replaced with framework-agnostic `GenericChangeEvent`

**Why:** Vue/Svelte users were forced to install React just to use the form core. Now the form package is truly framework-agnostic.

## Quick Migration

### Installation (React Users)

```bash
# Install React peer dependencies explicitly
npm install @nexus-state/form @nexus-state/core @nexus-state/react react
```

### Installation (Non-React Users)

```bash
# Only core dependencies needed
npm install @nexus-state/form @nexus-state/core
```

### Import Changes (Already Applied in v0.2.x)

```typescript
// Before (v0.2.0, deprecated)
import { useForm } from '@nexus-state/form';

// After (v0.2.1+, required)
import { useForm } from '@nexus-state/form/react';
```

**Note:** React hooks were already moved to the `./react` subpath in v0.2.1. This migration guide covers the v0.3.0 change that removes the hard React dependency.

## What's New

### Framework-Agnostic Core

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';

const store = createStore();

const form = createForm(store, {
  initialValues: { name: '', email: '' },
  validate: (values) => ({
    name: values.name ? undefined : 'Required',
  }),
});

// Use with any framework
store.sub(form.valuesAtom, (values) => {
  console.log('Form values:', values);
});

form.setFieldValue('name', 'Alice');
```

### Generic Event Types

The `Field` interface now uses `GenericChangeEvent` instead of React's `ChangeEvent`:

```typescript
// Before (v0.2.x)
import type { ChangeEvent } from 'react';

interface Field {
  checkboxProps: {
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  };
}

// After (v0.3.0)
import type { GenericChangeEvent } from '@nexus-state/form';

interface Field {
  checkboxProps: {
    onChange: (e: GenericChangeEvent<HTMLInputElement>) => void;
  };
}
```

`GenericChangeEvent` is compatible with React's `ChangeEvent`, Vue events, and other frameworks.

## Breaking Changes

### 1. `@nexus-state/react` Not Auto-Installed

**Before:** Installing `@nexus-state/form` automatically installed `@nexus-state/react`.

**After:** You must install `@nexus-state/react` explicitly if using React hooks.

```bash
npm install @nexus-state/react react
```

### 2. Event Type Change

**Before:** `Field.checkboxProps.onChange` accepted React's `ChangeEvent`.

**After:** `Field.checkboxProps.onChange` accepts `GenericChangeEvent`.

**Impact:** Minimal — `GenericChangeEvent` is structurally compatible with React's `ChangeEvent`. Existing code should work without changes.

## Non-Breaking Changes

- Core API (`createForm`, validators, field arrays) unchanged
- React hooks (`useForm`, `useField`, `useFieldArray`) unchanged
- Subpath exports (`./react`, `./schema`, `./core`, etc.) unchanged
- Validation API unchanged

## Benefits

| Feature | Before (v0.2.x) | After (v0.3.0) |
|---------|----------------|----------------|
| **React required** | ✅ Yes | ❌ No (optional) |
| **Vue/Svelte support** | ❌ No | ✅ Yes |
| **Bundle size (core only)** | Includes React types | Framework-agnostic |
| **Tree-shaking** | ⚠️ Partial | ✅ Full |
| **React hooks** | ✅ Yes | ✅ Yes (subpath) |

## Troubleshooting

### "Cannot find module '@nexus-state/react'"

If you're using React hooks from `@nexus-state/form/react`, install the peer dependency:

```bash
npm install @nexus-state/react react
```

### "Type 'ChangeEvent' is not assignable to 'GenericChangeEvent'"

This should not happen — the types are structurally compatible. If it does, update your imports:

```typescript
// Remove React import
// import type { ChangeEvent } from 'react';

// Use generic type
import type { GenericChangeEvent } from '@nexus-state/form';
```

## Questions?

See [packages/form/README.md](./packages/form/README.md) for full documentation.

