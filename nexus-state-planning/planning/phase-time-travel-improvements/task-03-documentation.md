# Task 03: Обновление документации

## Описание

Обновить документацию проекта для описания нового поведения `capture()` и best practices по использованию уникальных имён атомов.

## Цели

1. Объяснить поведение авто-инициализации в `capture()`
2. Документировать best practices для именования атомов
3. Добавить примеры использования time-travel с новым поведением
4. Обновить migration guide (если нужно)

## Файлы для обновления

### 1. README.md (основной)

**Секция:** Time Travel

```markdown
## Time Travel Debugging

### Basic Usage

```typescript
import { atom, createStore } from '@nexus-state/core';
import { TimeTravelController } from '@nexus-state/time-travel';

const countAtom = atom(0, 'count');
const store = createStore();
const controller = new TimeTravelController(store);

// Capture initial state
controller.capture('init');
// ✅ Atoms are automatically initialized from their default values

store.set(countAtom, 5);
controller.capture('increment');

store.set(countAtom, 10);
controller.capture('increment again');

// Travel back
controller.undo();
console.log(store.get(countAtom)); // 5

controller.undo();
console.log(store.get(countAtom)); // 0
```

### How capture() Works

When you call `capture()`, the TimeTravelController:

1. **Auto-initializes all registered atoms** from `atomRegistry`
   - Primitive atoms use their `initialValue`
   - Computed atoms are evaluated based on their dependencies
2. **Creates a snapshot** of the current store state
3. **Stores the snapshot** in the history timeline

**Note:** You don't need to explicitly call `store.get()` or `store.set()` before the first `capture()`. All atoms are automatically initialized with their default values.

### Best Practices

#### Use Unique Atom Names

```typescript
// ✅ Good - unique, descriptive names
const userAtom = atom(null, 'user');
const userSettingsAtom = atom({}, 'userSettings');
const themeAtom = atom('light', 'theme');

// ❌ Bad - duplicate names
const atom1 = atom('value1', 'data');
const atom2 = atom('value2', 'data');  // ⚠️ Warning: duplicate name!
```

**Why unique names matter:**
- DevTools relies on names to display atoms
- Time-travel uses names for snapshot serialization
- Debugging is easier with descriptive, unique names
- Duplicate names trigger a console warning

**Naming conventions:**
- Use descriptive names: `userProfile`, `shoppingCart`, `authToken`
- Add prefixes for namespacing: `auth/user`, `ui/theme`, `api/cache`
- Avoid generic names: `data`, `state`, `value`

#### Performance Considerations

For large applications with many atoms, `capture()` may initialize all atoms at once. Consider:

```typescript
// Option 1: Explicit initialization for critical atoms only
store.get(criticalAtom1);
store.get(criticalAtom2);
controller.capture('critical-state');

// Option 2: Use selective snapshots (future feature)
// controller.capture('state', { atoms: [atom1, atom2] });
```
```

---

### 2. packages/time-travel/README.md

**Добавить секцию:** Advanced Usage

```markdown
## Advanced Usage

### Atom Initialization

The `TimeTravelController` automatically initializes all atoms registered in the global `atomRegistry` when you call `capture()`. This means:

```typescript
const atom1 = atom('initial', 'atom1');
const atom2 = atom(42, 'atom2');

const store = createStore();
const controller = new TimeTravelController(store);

// First capture - atoms are auto-initialized
controller.capture('init');

const snapshot = controller.getSnapshots()[0];
console.log(snapshot.state);
// { atom1: 'initial', atom2: 42 }
```

**How it works:**
1. `capture()` iterates through all atoms in `atomRegistry`
2. For each atom, it calls `store.get(atom)` to trigger initialization
3. Primitive atoms return their `initialValue`
4. Computed atoms are evaluated based on their dependencies
5. The resulting store state is captured as a snapshot

**Edge cases:**
- If a computed atom's dependencies are not initialized, it may throw an error
- Errors during initialization are caught and logged as warnings
- Atoms that fail to initialize are excluded from the snapshot

### Multiple Stores

Each store maintains its own state, independent of other stores:

```typescript
const atom1 = atom('initial', 'shared');

const store1 = createStore();
const controller1 = new TimeTravelController(store1);

const store2 = createStore();
const controller2 = new TimeTravelController(store2);

store1.set(atom1, 'store1-value');
controller1.capture('store1-snapshot');

store2.set(atom1, 'store2-value');
controller2.capture('store2-snapshot');

// Independent timelines
controller1.undo(); // store1: 'initial'
controller2.undo(); // store2: 'initial'
```

### Troubleshooting

#### Warning: Duplicate atom names

```
[nexus-state] Atom with name "data" already exists.
Using duplicate names may cause issues with DevTools and time-travel.
Consider using unique names for all atoms.
```

**Solution:** Rename atoms to use unique, descriptive names:

```typescript
// Before
const atom1 = atom('value1', 'data');
const atom2 = atom('value2', 'data');

// After
const userData = atom('value1', 'userData');
const settingsData = atom('value2', 'settingsData');
```

#### Computed atom initialization errors

If you see warnings about atoms failing to initialize during `capture()`:

```
[TimeTravelController] Failed to initialize atom during capture: Error: ...
```

**Possible causes:**
- Computed atom depends on atoms that don't exist yet
- Circular dependencies between atoms
- Runtime errors in computed atom's read function

**Solution:** Ensure all dependencies are properly defined before calling `capture()`.
```

---

### 3. MIGRATION.md (если есть breaking changes)

```markdown
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
```

---

### 4. API Documentation (если есть отдельный файл)

```markdown
## TimeTravelController

### Methods

#### `capture(action?: string): void`

Creates a snapshot of the current store state.

**Parameters:**
- `action` (optional): Description of the action that triggered this snapshot

**Behavior:**
1. Auto-initializes all atoms from `atomRegistry` if not already initialized
2. Captures the current state of all atoms in the store
3. Adds the snapshot to the history timeline

**Example:**
```typescript
controller.capture('user-login');
```

**Notes:**
- Atoms are automatically initialized with their `initialValue` on first capture
- Computed atoms are evaluated based on their dependencies
- Initialization errors are caught and logged as warnings
- Failed atoms are excluded from the snapshot

**Performance:**
For applications with many atoms (>100), consider explicit initialization of critical atoms before calling `capture()` to improve performance.
```

---

## Примеры для документации

### Пример 1: Базовое использование

```typescript
import { atom, createStore } from '@nexus-state/core';
import { TimeTravelController } from '@nexus-state/time-travel';

// Define atoms
const countAtom = atom(0, 'count');
const nameAtom = atom('', 'name');

// Create store and controller
const store = createStore();
const controller = new TimeTravelController(store);

// Capture initial state (auto-initialized)
controller.capture('init');

// Make changes
store.set(countAtom, 5);
store.set(nameAtom, 'Alice');
controller.capture('update-1');

store.set(countAtom, 10);
controller.capture('update-2');

// Time travel
controller.undo(); // Back to update-1
console.log(store.get(countAtom)); // 5

controller.undo(); // Back to init
console.log(store.get(countAtom)); // 0
console.log(store.get(nameAtom)); // ''
```

### Пример 2: Computed atoms

```typescript
const baseAtom = atom(10, 'base');
const doubleAtom = atom((get) => get(baseAtom) * 2, 'double');

const store = createStore();
const controller = new TimeTravelController(store);

// Both atoms are auto-initialized
controller.capture('init');

const snapshot = controller.getSnapshots()[0];
console.log(snapshot.state);
// { base: 10, double: 20 }
```

### Пример 3: Best practices

```typescript
// ✅ Good naming
const userProfileAtom = atom(null, 'user/profile');
const userSettingsAtom = atom({}, 'user/settings');
const uiThemeAtom = atom('light', 'ui/theme');
const apiCacheAtom = atom({}, 'api/cache');

// ❌ Bad naming
const atom1 = atom(null, 'data');
const atom2 = atom({}, 'data');  // ⚠️ Warning!
const atom3 = atom('light', 'state');
```

---

## Критерии приёмки

- ✅ README.md обновлён с описанием нового поведения `capture()`
- ✅ Добавлена секция "Best Practices" с рекомендациями по именованию
- ✅ Примеры кода демонстрируют авто-инициализацию
- ✅ Документация объясняет warning при дубликатах
- ✅ packages/time-travel/README.md содержит детальное описание
- ✅ MIGRATION.md обновлён (если нужно)
- ✅ API документация актуальна

## Связанные задачи

- `task-01-capture-auto-init.md` - Реализация авто-инициализации
- `task-02-duplicate-warning.md` - Реализация warning
- `task-04-tests.md` - Тесты для проверки документированного поведения
