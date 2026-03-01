# Migration Guide - @nexus-state/middleware v1.0

This guide helps you migrate from `@nexus-state/middleware` v0.x to v1.0.

## What's New in v1.0

Version 1.0 introduces a completely refactored middleware system based on the new plugin hooks API from `@nexus-state/core`. This provides:

- **Better integration** with the core plugin system
- **Cleaner architecture** without store method wrapping
- **Plugin disposal** support for cleanup
- **Predictable execution order** for multiple middleware

## Breaking Changes

### 1. New Primary API: `createMiddlewarePlugin`

The main way to create middleware has changed from `middleware()` to `createMiddlewarePlugin()`.

### 2. Plugin Return Type

- **v0.x:** Returns `(store: Store) => void`
- **v1.x:** Returns `Plugin` which provides hooks

### 3. Execution Order

When multiple middleware are applied:
- **v0.x:** Last applied wraps first (reverse order)
- **v1.x:** Execute in application order

## Migration Steps

### Step 1: Update Import

```diff
- import { middleware } from '@nexus-state/middleware';
+ import { createMiddlewarePlugin } from '@nexus-state/middleware';
```

### Step 2: Update Function Call

```diff
- const plugin = middleware(atom, config);
+ const plugin = createMiddlewarePlugin(atom, config);
```

### Step 3: Update Store Application

```diff
- const store = createStore([middleware(atom, config)]);
+ const store = createStore();
+ store.applyPlugin(createMiddlewarePlugin(atom, config));
```

## Code Examples

### Basic Logger

#### Before (v0.x)

```typescript
import { createStore, atom } from '@nexus-state/core';
import { middleware } from '@nexus-state/middleware';

const countAtom = atom(0);

const store = createStore([
  middleware(countAtom, {
    beforeSet: (atom, value) => {
      console.log('Setting:', value);
      return value;
    },
    afterSet: (atom, value) => {
      console.log('Set to:', value);
    }
  })
]);
```

#### After (v1.x)

```typescript
import { createStore, atom } from '@nexus-state/core';
import { createMiddlewarePlugin } from '@nexus-state/middleware';

const countAtom = atom(0);

const store = createStore();
store.applyPlugin(
  createMiddlewarePlugin(countAtom, {
    beforeSet: (atom, value) => {
      console.log('Setting:', value);
      return value;
    },
    afterSet: (atom, value) => {
      console.log('Set to:', value);
    }
  })
);
```

### Value Validation

#### Before (v0.x)

```typescript
const store = createStore([
  middleware(ageAtom, {
    beforeSet: (atom, value) => {
      if (value < 0 || value > 150) {
        throw new Error('Invalid age');
      }
      return value;
    }
  })
]);
```

#### After (v1.x)

```typescript
const store = createStore();
store.applyPlugin(
  createMiddlewarePlugin(ageAtom, {
    beforeSet: (atom, value) => {
      if (value < 0 || value > 150) {
        throw new Error('Invalid age');
      }
      return value;
    }
  })
);
```

### Multiple Middleware

#### Before (v0.x)

```typescript
// Note: Reverse execution order!
const store = createStore([
  middleware(atom, {
    beforeSet: (a, v) => v + 1  // Applied second, executes first
  }),
  middleware(atom, {
    beforeSet: (a, v) => v * 2  // Applied first, executes second
  })
]);

store.set(atom, 5);  // Result: (5 * 2) + 1 = 11
```

#### After (v1.x)

```typescript
// Note: Application order = execution order!
const store = createStore();
store.applyPlugin(
  createMiddlewarePlugin(atom, {
    beforeSet: (a, v) => v + 1  // Applied first, executes first
  })
);
store.applyPlugin(
  createMiddlewarePlugin(atom, {
    beforeSet: (a, v) => v * 2  // Applied second, executes second
  })
);

store.set(atom, 5);  // Result: (5 + 1) * 2 = 12
```

## New Features

### Plugin Disposal

You can now dispose middleware when it's no longer needed:

```typescript
const plugin = createMiddlewarePlugin(atom, {
  beforeSet: (a, v) => v
});

store.applyPlugin(plugin);

// ... later
if ('dispose' in plugin && typeof plugin.dispose === 'function') {
  plugin.dispose();
}
```

### Better Type Safety

The new API has improved type inference:

```typescript
// Type is inferred from atom
const countAtom = atom(0);
const plugin = createMiddlewarePlugin(countAtom, {
  beforeSet: (atom, value) => {
    // value is inferred as number
    return Math.max(0, value);
  }
});
```

## Deprecated APIs

The following APIs are deprecated and will be removed in v2.0:

| Deprecated | Replacement |
|------------|-------------|
| `middleware()` | `createMiddlewarePlugin()` |
| `middlewarePlugin()` (alias) | `createMiddlewarePlugin()` |

## Troubleshooting

### Issue: Middleware executes in wrong order

**Solution:** In v1.x, middleware execute in application order. If you relied on reverse order in v0.x, reverse the order you apply plugins.

### Issue: Types don't match

**Solution:** The `beforeSet` and `afterSet` hooks now receive `atom: any` instead of `atom: Atom<T>` due to TypeScript variance constraints. This is intentional and doesn't affect functionality.

### Issue: Store wrapping conflicts

**Solution:** If you have custom plugins that wrap `store.set`, they may conflict. The new hook-based approach should be preferred over store wrapping.

## Backward Compatibility

The legacy `middleware()` function is still available in v1.0 for backward compatibility. However:

- It is marked as `@deprecated`
- It will be removed in v2.0
- New features may not be available for legacy API
- Performance may be slightly worse than new API

## Timeline

- **v1.0 (Current):** New API introduced, legacy API deprecated
- **v1.x:** Legacy API maintained with bug fixes
- **v2.0 (Future):** Legacy API removed

## Need Help?

If you encounter issues during migration:

1. Check the [README.md](./README.md) for usage examples
2. Review the [test suite](./src/index.test.ts) for comprehensive examples
3. Open an issue on GitHub

---

**Last Updated:** 2026-03-01  
**Version:** 1.0.0
