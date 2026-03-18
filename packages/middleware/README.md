# @nexus-state/middleware

> Middleware plugin for Nexus State with plugin hooks support
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/middleware)](https://www.npmjs.com/package/@nexus-state/middleware)
> [![Coverage for middleware package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=middleware)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 📦 Installation

```bash
npm install @nexus-state/middleware
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
  - [@nexus-state/time-travel](https://www.npmjs.com/package/@nexus-state/time-travel) — Time-travel debugging
  - [@nexus-state/immer](https://www.npmjs.com/package/@nexus-state/immer) — Immutable updates

**Full ecosystem:** [Nexus State Packages](https://www.npmjs.com/org/nexus-state)

---

## Description

The `@nexus-state/middleware` package provides a plugin-based approach to intercept and modify store operations in Nexus State. It uses the core plugin hooks system (`onSet`, `afterSet`) to provide middleware functionality.

## Installation

```bash
npm install @nexus-state/middleware
```

## Key Features

- **Plugin-based architecture** - Uses core plugin hooks system
- **Intercept store operations** - `beforeSet` and `afterSet` hooks
- **Value transformation** - Modify values before they're set
- **Atom-specific middleware** - Apply middleware to specific atoms only
- **Multiple middleware support** - Chain multiple middleware on the same atom
- **Backward compatible** - Legacy API still supported
- **Disposable** - Clean up middleware when no longer needed

## Usage

### New API (Recommended)

```typescript
import { createStore, atom } from '@nexus-state/core';
import { createMiddlewarePlugin } from '@nexus-state/middleware';

const store = createStore();
const countAtom = atom(0);

// Create and apply middleware plugin
const plugin = createMiddlewarePlugin(countAtom, {
  beforeSet: (atom, value) => {
>
> [![Coverage for middleware package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=middleware)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
    console.log('Before set:', value);
    // Ensure non-negative values
    return Math.max(0, value);
  },
  afterSet: (atom, value) => {
    console.log('After set:', value);
    // Side effects only (logging, analytics, etc.)
  }
});

store.applyPlugin(plugin);

// Use the store
store.set(countAtom, 5);  // Logs: "Before set: 5", "After set: 5"
store.set(countAtom, -3); // Value becomes 0 (non-negative)
```

### Middleware Chain

Multiple middleware can be applied to the same atom. They execute in order:

```typescript
const plugin1 = createMiddlewarePlugin(countAtom, {
  beforeSet: (atom, value) => value + 1,
});

const plugin2 = createMiddlewarePlugin(countAtom, {
  beforeSet: (atom, value) => value * 2,
});

store.applyPlugin(plugin1);
store.applyPlugin(plugin2);

store.set(countAtom, 5); 
// Execution: 5 → +1 = 6 → *2 = 12
// Result: 12
```

### Different Middleware for Different Atoms

```typescript
const countAtom = atom(0);
const nameAtom = atom('');

// Count middleware - ensure non-negative
store.applyPlugin(
  createMiddlewarePlugin(countAtom, {
    beforeSet: (atom, value) => Math.max(0, value),
  })
);

// Name middleware - trim and validate
store.applyPlugin(
  createMiddlewarePlugin(nameAtom, {
    beforeSet: (atom, value) => value.trim().slice(0, 50),
  })
);
```

### Disposing Middleware

```typescript
const plugin = createMiddlewarePlugin(countAtom, {
  beforeSet: (atom, value) => value,
});

store.applyPlugin(plugin);

// ... later, when middleware is no longer needed
if (plugin.dispose) {
  plugin.dispose();
}
```

## Legacy API (Deprecated)

The old API is still supported but will be removed in the next major version:

```typescript
import { createStore, atom } from '@nexus-state/core';
import { middleware } from '@nexus-state/middleware';

const store = createStore();
const countAtom = atom(0);

// Legacy approach - wraps store.set method
store.applyPlugin(
  middleware(countAtom, {
    beforeSet: (atom, value) => value,
    afterSet: (atom, value) => {},
  })
);
```

## API Reference

### `createMiddlewarePlugin<T>(atom: Atom<T>, config: MiddlewareConfig<T>): Plugin`

Creates a middleware plugin for a specific atom.

**Parameters:**
- `atom` - The target atom to intercept
- `config` - Configuration object with hooks

**Returns:** Plugin function that can be applied to a store

### `MiddlewareConfig<T>`

```typescript
interface MiddlewareConfig<T> {
  /**
   * Hook called before setting a new value.
   * Can modify the value by returning a new value.
   * Return undefined to keep the original value.
   */
  beforeSet?: (atom: any, newValue: T) => T | void;
  
  /**
   * Hook called after setting a new value.
   * Side effects only - cannot modify the value.
   */
  afterSet?: (atom: any, newValue: T) => void;
}
```

### `middleware<T>(atom: Atom<T>, config: MiddlewareConfig<T>): (store: Store) => void`

**@deprecated** Use `createMiddlewarePlugin` instead.

Legacy middleware function that wraps `store.set` method.

## Hook Execution Order

```
store.set(atom, value)
  ↓
[onSet hooks] - beforeSet (can modify value)
  ↓
originalSet(atom, modifiedValue)
  ↓
notify subscribers & dependents
  ↓
[afterSet hooks] - afterSet (side effects only)
```

## Examples

### Logger Middleware

```typescript
const loggerPlugin = createMiddlewarePlugin(countAtom, {
  beforeSet: (atom, value) => {
    console.log(`[${atom.name || 'atom'}] Setting value:`, value);
    return value;
  },
  afterSet: (atom, value) => {
    console.log(`[${atom.name || 'atom'}] Value set to:`, value);
  },
});
```

### Validation Middleware

```typescript
const validationPlugin = createMiddlewarePlugin(ageAtom, {
  beforeSet: (atom, value) => {
    if (typeof value !== 'number' || value < 0 || value > 150) {
      throw new Error('Age must be between 0 and 150');
    }
    return value;
  },
});
```

### Analytics Middleware

```typescript
const analyticsPlugin = createMiddlewarePlugin(purchaseAtom, {
  afterSet: (atom, value) => {
    // Send analytics event
    analytics.track('purchase', {
      amount: value.amount,
      timestamp: Date.now(),
    });
  },
});
```

## License

MIT

---

## Migration Guide

### Migrating from v0.x to v1.x

#### What Changed

In version 1.0.0, the middleware package has been refactored to use the new plugin hooks system from `@nexus-state/core`. This provides better integration and cleaner architecture.

#### Before (v0.x)

```typescript
import { createStore, atom } from '@nexus-state/core';
import { middleware } from '@nexus-state/middleware';

const store = createStore();
const countAtom = atom(0);

// Old approach - wraps store.set method
store.applyPlugin(
  middleware(countAtom, {
    beforeSet: (atom, value) => {
      console.log('Before:', value);
      return Math.max(0, value);
    },
    afterSet: (atom, value) => {
      console.log('After:', value);
    }
  })
);
```

#### After (v1.x)

```typescript
import { createStore, atom } from '@nexus-state/core';
import { createMiddlewarePlugin } from '@nexus-state/middleware';

const store = createStore();
const countAtom = atom(0);

// New approach - uses plugin hooks
const plugin = createMiddlewarePlugin(countAtom, {
  beforeSet: (atom, value) => {
    console.log('Before:', value);
    return Math.max(0, value);
  },
  afterSet: (atom, value) => {
    console.log('After:', value);
  }
});

store.applyPlugin(plugin);
```

#### Key Differences

| Aspect | v0.x (Legacy) | v1.x (New) |
|--------|---------------|------------|
| Function | `middleware()` | `createMiddlewarePlugin()` |
| Return type | `(store) => void` | `Plugin` (with hooks) |
| Architecture | Wraps `store.set` | Uses core hooks |
| Disposal | Not supported | `plugin.dispose()` |
| Multiple middleware | Reverse order | Application order |

#### Migration Steps

1. **Replace import:**
   ```diff
   - import { middleware } from '@nexus-state/middleware';
   + import { createMiddlewarePlugin } from '@nexus-state/middleware';
   ```

2. **Update function call:**
   ```diff
   - store.applyPlugin(middleware(atom, config));
   + store.applyPlugin(createMiddlewarePlugin(atom, config));
   ```

3. **Remove store creation wrapper:**
   ```diff
   - const store = createStore([middleware(...)]);
   + const store = createStore();
   + store.applyPlugin(createMiddlewarePlugin(...));
   ```

#### Backward Compatibility

The legacy `middleware()` function is still available but marked as deprecated. It will be removed in version 2.0.0.

---
