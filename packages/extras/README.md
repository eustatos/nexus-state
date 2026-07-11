# @nexus-state/extras

Collection of optional plugins and utilities for `@nexus-state/core`.

## Installation

```bash
npm install @nexus-state/extras
# or
pnpm add @nexus-state/extras
# or
yarn add @nexus-state/extras
```

## Features

This package consolidates several small utility packages into one with subpath exports for optimal tree-shaking:

- **async** - Async atoms with loading/error states
- **family** - Parameterized atom factories
- **immer** - Immutable updates with Immer
- **persist** - Persist atom values to storage
- **middleware** - Intercept and transform atom operations
- **web-worker** - Sync atoms across Web Workers

## Usage

### Async Atoms

Create atoms with built-in loading, error, and data states:

```typescript
import { asyncAtom } from '@nexus-state/extras/async';
import { createStore } from '@nexus-state/core';

const store = createStore();

const [userAtom, fetchUser] = asyncAtom({
  initialValue: null,
  fetchFn: async (store) => {
    const response = await fetch('/api/user');
    return response.json();
  }
});

// Fetch data
await fetchUser(store);

// Access state
const state = store.get(userAtom);
console.log(state.loading); // true/false
console.log(state.error);   // Error | null
console.log(state.data);    // User | null
```

### Atom Family

Create parameterized atoms with shared logic:

```typescript
import { atomFamily } from '@nexus-state/extras/family';
import { atom, createStore } from '@nexus-state/core';

const store = createStore();

const todoAtomFamily = atomFamily((id: number) => {
  return atom({ id, text: '', completed: false });
});

// Create atoms for different IDs
const todo1 = todoAtomFamily(1);
const todo2 = todoAtomFamily(2);

// Each ID gets its own atom instance
store.set(todo1, { id: 1, text: 'Buy milk', completed: false });
```

### Immer Integration

Update complex state immutably:

```typescript
import { immerAtom } from '@nexus-state/extras/immer';
import { createStore } from '@nexus-state/core';

const store = createStore();

const [userAtom, setUser] = immerAtom(
  { name: 'John', age: 30, address: { city: 'NYC' } },
  store
);

// Mutate draft directly (Immer handles immutability)
setUser(draft => {
  draft.age += 1;
  draft.address.city = 'LA';
});
```

### Persistence

Persist atom values to localStorage/sessionStorage:

```typescript
import { persist, localStorageStorage } from '@nexus-state/extras/persist';
import { atom, createStore } from '@nexus-state/core';

const store = createStore();
const themeAtom = atom('light');

// Apply persist plugin
store.applyPlugin(
  persist(themeAtom, {
    key: 'theme',
    storage: localStorageStorage
  })
);

// Value is automatically saved to localStorage
store.set(themeAtom, 'dark');

// Value is restored on page reload
```

### Middleware

Intercept and transform atom operations:

```typescript
import { middleware } from '@nexus-state/extras/middleware';
import { atom, createStore } from '@nexus-state/core';

const store = createStore();
const countAtom = atom(0);

// Add logging middleware
store.applyPlugin(
  middleware({
    beforeSet: (atom, newValue) => {
      console.log(`Setting ${atom.name} to`, newValue);
      return newValue;
    },
    afterSet: (atom, newValue) => {
      console.log(`Set ${atom.name} to`, newValue);
    }
  })
);

store.set(countAtom, 42);
// Logs: "Setting count to 42"
// Logs: "Set count to 42"
```

### Web Worker

Sync atoms across Web Workers:

```typescript
import { workerAtom } from '@nexus-state/extras/web-worker';
import { createStore } from '@nexus-state/core';

const store = createStore();
const worker = new Worker('./worker.js');

const sharedAtom = workerAtom({
  worker,
  initialValue: 0
});

// Changes are automatically synced with worker
store.set(sharedAtom, 42);
```

## Migration from Individual Packages

If you're currently using individual packages, migrate to `@nexus-state/extras`:

| Old Package | New Import |
|-------------|------------|
| `@nexus-state/async` | `@nexus-state/extras/async` |
| `@nexus-state/family` | `@nexus-state/extras/family` |
| `@nexus-state/immer` | `@nexus-state/extras/immer` |
| `@nexus-state/persist` | `@nexus-state/extras/persist` |
| `@nexus-state/middleware` | `@nexus-state/extras/middleware` |
| `@nexus-state/web-worker` | `@nexus-state/extras/web-worker` |

**Example migration:**

```typescript
// Before
import { asyncAtom } from '@nexus-state/async';
import { persist } from '@nexus-state/persist';

// After
import { asyncAtom } from '@nexus-state/extras/async';
import { persist } from '@nexus-state/extras/persist';
```

The old packages will continue to work (with deprecation warnings) until v1.1.0.

## Tree-Shaking

This package is designed for optimal tree-shaking. Only the modules you import are included in your bundle:

```typescript
// Only async module is included
import { asyncAtom } from '@nexus-state/extras/async';

// Only persist module is included
import { persist } from '@nexus-state/extras/persist';
```

## Peer Dependencies

- **immer** (optional) - Required only if you use `@nexus-state/extras/immer`

## License

MIT

## Related

- [`@nexus-state/core`](../core/) - Core state management library
- [`@nexus-state/react`](../react/) - React bindings
- [`@nexus-state/devtools`](../devtools/) - DevTools integration
