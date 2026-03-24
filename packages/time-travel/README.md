# @nexus-state/time-travel

> Time-travel debugging for Nexus State — undo/redo, snapshots, and state history
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/time-travel)](https://www.npmjs.com/package/@nexus-state/time-travel)
> [![Coverage for time-travel package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=time-travel)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 📦 Installation

```bash
npm install @nexus-state/time-travel
```

**Required:**
```bash
npm install @nexus-state/core
```

---

## 🔗 See Also

- **Core:** [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) — Foundation (atoms, stores)
- **Related:**
  - [@nexus-state/devtools](https://www.npmjs.com/package/@nexus-state/devtools) — Redux DevTools integration
  - [@nexus-state/undo-redo](https://www.npmjs.com/package/@nexus-state/undo-redo) — User-facing undo/redo
  - [@nexus-state/middleware](https://www.npmjs.com/package/@nexus-state/middleware) — Plugin system

**Full ecosystem:** [Nexus State Packages](https://www.npmjs.com/org/nexus-state)

---

## Usage

### Basic Usage

```typescript
import { atom, createStore } from '@nexus-state/core';
import { TimeTravelController } from '@nexus-state/time-travel';

// Create a store
const store = createStore();

// Create atoms
const countAtom = atom(0, 'count');
const nameAtom = atom('', 'name');

// Create time travel controller
const controller = new TimeTravelController(store, {
  maxHistory: 100,
  autoCapture: true,
});

// Capture snapshots
controller.capture('init');

store.set(countAtom, 5);
controller.capture('update-1');

store.set(countAtom, 10);
controller.capture('update-2');

// Navigate through history
controller.undo();
console.log(store.get(countAtom)); // 5

controller.undo();
console.log(store.get(countAtom)); // 0
```

### How capture() Works

When you call `capture()`, the `TimeTravelController` automatically initializes all atoms registered in the global `atomRegistry`:

1. **Primitive atoms** use their `initialValue`
2. **Computed atoms** are evaluated based on their dependencies
3. **Snapshot** is created with the current store state

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

**Note:** You don't need to explicitly call `store.get()` or `store.set()` before the first `capture()`. All atoms are automatically initialized with their default values.

### Using SimpleTimeTravel

```typescript
import { atom, createStore } from '@nexus-state/core';
import { SimpleTimeTravel } from '@nexus-state/time-travel';

const store = createStore();
const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 100,
  autoCapture: true,
});

timeTravel.capture('action');
timeTravel.undo();
timeTravel.redo();
```

### Compression

```typescript
import { Compression } from '@nexus-state/time-travel';

// Use compression strategies
const controller = new TimeTravelController(store, {
  compression: {
    strategy: 'time-based',
    maxAge: 3600000, // 1 hour
  },
});
```

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

## API

### TimeTravelController

- `capture(action?: string)`: Capture a snapshot
- `undo()`: Undo to previous snapshot
- `redo()`: Redo to next snapshot
- `jumpTo(index)`: Jump to specific snapshot
- `canUndo()`: Check if undo available
- `canRedo()`: Check if redo available
- `getHistory()`: Get history array
- `getSnapshots()`: Get all snapshots
- `clearHistory()`: Clear history
- `subscribe(eventType, listener)`: Subscribe to events
- `dispose()`: Clean up resources

### SimpleTimeTravel

Simplified wrapper with the same methods as TimeTravelController.

## Effect Suppression

Time-travel operations automatically suppress side effects during undo/redo:

```typescript
store.subscribe(cartAtom, (cart) => {
  api.syncCart(cart); // ✅ Only called on real user actions
});

timeTravel.undo(); // No side effects triggered
```

**How it works:**
1. Internal `isTimeTraveling` flag tracks undo/redo operations
2. `setSilently()` is used instead of `set()` during restoration
3. Subscribers are NOT called during time-travel
4. Computed atoms are re-evaluated after restore

**Manual suppression pattern:**

```typescript
import { debugContext } from '@nexus-state/core';

store.subscribe(atom, (value) => {
  if (debugContext.isTraveling()) {
    return; // Skip effect during time-travel
  }
  api.sync(value);
});
```

For more details, see the [Time Travel Suppression Guide](https://nexus-state.website.yandexcloud.net/guides/time-travel-suppression).

---

## License

MIT
