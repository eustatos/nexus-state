# Breaking Changes in v1.0

This document details all breaking changes introduced in Nexus State v1.0.

## Summary

**v1.0 simplifies the API** by separating basic and advanced features:

| Feature | v0.x | v1.0 |
|---------|------|------|
| Basic store | `createStore()` | `createStore()` ✅ |
| DevTools | Built-in | Plugin (`devTools()`) ✅ |
| Time Travel | Built-in | `createEnhancedStore()` ✅ |
| Package names | `nexus-state` | `@nexus-state/*` ✅ |

## API Changes

### Package Imports

**Before:**
```typescript
import { createStore, atom } from 'nexus-state';
```

**After:**
```typescript
import { createStore, atom } from '@nexus-state/core';
```

### Store Creation

**Basic Store (Recommended for most cases):**

```typescript
// v0.x
const store = createStore();

// v1.0 - Same API!
import { createStore } from '@nexus-state/core';
const store = createStore();
```

**Enhanced Store (For time travel):**

```typescript
// v0.x
const store = createStore([], { enableTimeTravel: true });

// v1.0
import { createEnhancedStore } from '@nexus-state/core';
const store = createEnhancedStore([], { 
  enableTimeTravel: true,
  enableDevTools: true 
});
```

### DevTools Integration

**Before:**
```typescript
// Built-in DevTools
const store = createStore();
store.connectDevTools();
```

**After:**
```typescript
// DevTools as plugin
import { createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

const store = createStore([
  devTools({ name: 'My App' })
]);
```

### Time Travel API

**Before:**
```typescript
const store = createStore({ enableTimeTravel: true });
store.timeTravel.undo();
store.timeTravel.redo();
```

**After:**
```typescript
import { createEnhancedStore } from '@nexus-state/core';

const store = createEnhancedStore([], { enableTimeTravel: true });
store.undo();  // Direct methods
store.redo();
```

### Atom Names

**Before:**
```typescript
const count = atom(0);
```

**After (Recommended):**
```typescript
const count = atom(0, 'count');  // Add name for DevTools
```

## Configuration Changes

### Store Options

**`createEnhancedStore` options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableTimeTravel` | `boolean` | `false` | Enable undo/redo |
| `enableDevTools` | `boolean` | `true` | Enable DevTools |
| `maxHistory` | `number` | `50` | Max snapshots |
| `autoCapture` | `boolean` | `true` | Auto-capture changes |

### Plugin Configuration

**DevTools plugin options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | `'Nexus State'` | App name |
| `trace` | `boolean` | `false` | Enable stack traces |
| `maxAge` | `number` | `100` | History depth |
| `latency` | `number` | `0` | Debounce delay (ms) |

## Behavioral Changes

### Atom Registration

All atoms created with `atom()` are automatically registered in the global atom registry for DevTools integration.

### Computed Atom Caching

Computed atoms now cache results more aggressively for better performance. Dependencies are tracked automatically.

### Subscription Batching

Subscriptions now batch updates for better performance. Multiple rapid updates trigger a single notification.

## Migration Path

1. ✅ Update imports: `nexus-state` → `@nexus-state/core`
2. ✅ Decide: `createStore()` or `createEnhancedStore()`?
3. ✅ Add DevTools plugin if needed
4. ✅ Add names to atoms for better debugging
5. ✅ Update time travel API calls (if used)

## What's NOT Breaking

- ✅ `createStore()` still works the same way
- ✅ `atom()` API unchanged (names are optional)
- ✅ `store.get()`, `store.set()`, `store.subscribe()` unchanged
- ✅ Framework adapters (`useAtom`) unchanged

## Deprecation Schedule

| Version | Status |
|---------|--------|
| **v0.x** | Legacy, security fixes only |
| **v1.0** | Current stable |
| **v2.0** | Future (no deprecations planned) |

## Migration Tools

```bash
# Codemod for automatic migration
npx @nexus-state/codemod@latest

# Will update:
# - Import paths
# - Store creation
# - DevTools configuration
```

## Need More Help?

- 📚 [Migration Guide](./v0-to-v1.md) — Step-by-step instructions
- 💬 [Discord](https://discord.gg/nexus-state) — Community support
- 🐛 [Issues](https://github.com/eustatos/nexus-state/issues) — Report problems
