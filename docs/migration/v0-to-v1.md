# Migrating to Nexus State v1.0

This guide helps you migrate your existing Nexus State code to v1.0.

## Overview

v1.0 introduces a **simplified API** with better separation between basic and advanced features:

- ✅ **`createStore()`** — for basic state management (recommended for most cases)
- ✅ **`createEnhancedStore()`** — for advanced features (time travel, undo/redo)
- ✅ **Plugin-based architecture** — DevTools, middleware as plugins

## Migration Path

### For New Projects

Use `createStore()` with plugins:

```javascript
import { createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

const store = createStore([
  devTools({ name: 'My App' })
]);
```

### For Existing Projects

#### If you're using `createEnhancedStore`:

**Keep using it** — it's still supported! But consider if you need the advanced features:

```javascript
// Still works in v1.0
import { createEnhancedStore } from '@nexus-state/core';

const store = createEnhancedStore([], {
  enableTimeTravel: true,
  enableDevTools: true
});
```

#### If you're using old plugin API:

```diff
// Old (v0.x)
- import { createStore, devTools } from 'nexus-state';
- const store = createStore([devTools()]);

// New (v1.0)
+ import { createStore } from '@nexus-state/core';
+ import { devTools } from '@nexus-state/devtools';
+ const store = createStore([devTools({ name: 'My App' })]);
```

## Breaking Changes

### Package Imports

All packages are now scoped under `@nexus-state/`:

| Old Import | New Import |
|------------|------------|
| `nexus-state` | `@nexus-state/core` |
| `nexus-state/devtools` | `@nexus-state/devtools` |
| `nexus-state/react` | `@nexus-state/react` |
| `nexus-state/immer` | `@nexus-state/immer` |

### Store Creation

**Basic store (recommended):**

```javascript
import { createStore } from '@nexus-state/core';
const store = createStore();
```

**Enhanced store (for time travel):**

```javascript
import { createEnhancedStore } from '@nexus-state/core';
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  maxHistory: 50
});
```

### Atom Names

All atoms should have names for better DevTools support:

```javascript
// v0.x
const count = atom(0);

// v1.0 (recommended)
const count = atom(0, 'count');
```

### DevTools Configuration

```javascript
// v0.x
const store = createStore([devTools()]);

// v1.0
import { createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

const store = createStore([
  devTools({
    name: 'My App',
    trace: true,
    maxAge: 50
  })
]);
```

## Migration Checklist

- [ ] Update package imports to `@nexus-state/*`
- [ ] Decide: `createStore()` or `createEnhancedStore()`?
- [ ] Add names to all atoms
- [ ] Update DevTools configuration
- [ ] Test all functionality
- [ ] Update documentation

## Common Issues & Solutions

### Issue: "createEnhancedStore is not defined"

**Solution:** Import it:

```javascript
import { createEnhancedStore } from '@nexus-state/core';
```

### Issue: "store.undo is not a function"

**Solution:** Enable time travel:

```javascript
const store = createEnhancedStore([], { 
  enableTimeTravel: true 
});
```

Or use basic store without time travel:

```javascript
const store = createStore([devTools()]);
// Use DevTools UI for time travel instead
```

### Issue: Atoms not showing in DevTools

**Solution:** Add names to atoms:

```javascript
const counter = atom(0, 'counter');
const user = atom({ name: '' }, 'user');
```

### Issue: "devTools is not defined"

**Solution:** Import from correct package:

```javascript
import { devTools } from '@nexus-state/devtools';
```

## Code Examples

### Basic Counter App

```javascript
import { atom, createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';
import { useAtom } from '@nexus-state/react';

const store = createStore([
  devTools({ name: 'Counter App' })
]);

const countAtom = atom(0, 'count');

function Counter() {
  const [count, setCount] = useAtom(countAtom, store);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

### App with Time Travel

```javascript
import { atom, createEnhancedStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';
import { useAtom } from '@nexus-state/react';

const store = createEnhancedStore([
  devTools({ name: 'Drawing App' })
], {
  enableTimeTravel: true,
  maxHistory: 100
});

const strokesAtom = atom([], 'strokes');

function DrawingApp() {
  const [strokes, setStrokes] = useAtom(strokesAtom, store);
  
  return (
    <div>
      <canvas />
      <button onClick={() => store.undo()}>Undo</button>
      <button onClick={() => store.redo()}>Redo</button>
    </div>
  );
}
```

### Form with Validation

```javascript
import { atom, createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';
import { middleware, createValidator } from '@nexus-state/middleware';
import { useAtom } from '@nexus-state/react';

const store = createStore([
  devTools({ name: 'Form App' }),
  middleware(userAtom, {
    beforeSet: (atom, value) => {
      if (!value.email.includes('@')) {
        throw new Error('Invalid email');
      }
      return value;
    }
  })
]);

const userAtom = atom({ email: '' }, 'user');
```

## Performance Improvements

v1.0 includes several performance improvements:

- **Smaller bundle size** — tree-shaking improvements
- **Faster store creation** — optimized initialization
- **Better memory management** — improved garbage collection
- **Optimized subscriptions** — fewer unnecessary rerenders

## Need Help?

- 📚 [Documentation](../index.md)
- 💬 [Discord Community](https://discord.gg/nexus-state)
- 🐛 [Report Issues](https://github.com/eustatos/nexus-state/issues)
- 📖 [Examples](../examples/index.md)
