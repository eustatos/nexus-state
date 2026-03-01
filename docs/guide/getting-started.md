# Getting Started

Welcome to Nexus State! This guide will help you get started with using Nexus State in your projects.

## Installation

To install Nexus State, run the following command:

```bash
npm install @nexus-state/core
```

For React integration:

```bash
npm install @nexus-state/react
```

For Vue integration:

```bash
npm install @nexus-state/vue
```

For Svelte integration:

```bash
npm install @nexus-state/svelte
```

### Additional Packages

For async operations:

```bash
npm install @nexus-state/async
```

For state families:

```bash
npm install @nexus-state/family
```

For Immer integration:

```bash
npm install @nexus-state/immer
```

For middleware:

```bash
npm install @nexus-state/middleware
```

For persistence:

```bash
npm install @nexus-state/persist
```

For CLI tools:

```bash
npm install -g @nexus-state/cli
```

For developer tools:

```bash
npm install @nexus-state/devtools
```

For Web Worker integration:

```bash
npm install @nexus-state/web-worker
```

## Basic Usage

Here's a simple example of how to use Nexus State:

```javascript
import { atom, createEnhancedStore } from '@nexus-state/core';

// Create an atom
const countAtom = atom(0, 'count');

// Create an enhanced store with time travel and DevTools
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  enableDevTools: true
});

// Get the value of the atom
console.log(store.get(countAtom)); // 0

// Update the value of the atom
store.set(countAtom, 1);

// Functional update
store.set(countAtom, (prev) => prev + 1);
console.log(store.get(countAtom)); // 2

// Time travel
store.undo();
console.log(store.get(countAtom)); // 1

// Subscribe to changes
const unsubscribe = store.subscribe(countAtom, (value) => {
  console.log('Count changed:', value);
});
```

## Package-Specific Usage

### Async Operations

```javascript
import { createAsyncOperation } from '@nexus-state/async';

const fetchData = createAsyncOperation(async () => {
  const response = await fetch('/api/data');
  return await response.json();
});

// Execute async operation
const data = await fetchData.execute();
```

### State Families

```javascript
import { createFamily } from '@nexus-state/family';

const userFamily = createFamily({
  profile: { name: '', email: '' },
  preferences: { theme: 'light' }
});

// Access nested state
const name = userFamily.get('profile.name');
```

### Immer Integration

```javascript
import { createImmerStore } from '@nexus-state/immer';

const store = createImmerStore({ users: [] });

// Update state with mutable API
store.setState((draft) => {
  draft.users.push({ id: 1, name: 'John' });
});
```

### Middleware

```javascript
import { createMiddleware } from '@nexus-state/middleware';

const logger = createMiddleware((action, next, store) => {
  console.log('Action:', action);
  return next(action);
});

store.use(logger);
```

### Persistence

```javascript
import { createPersist } from '@nexus-state/persist';

const persist = createPersist({
  key: 'app-state',
  storage: localStorage
});

store.use(persist);
```

## Next Steps

- Learn about [Core Concepts](/guide/core-concepts)
- Explore the [API reference](/api/)
- Check out [examples](/examples/)
- Try [recipes](/recipes/)
- See [package-specific examples](/recipes/package-examples)
- Migrating from v0.x? See the [Migration Guide](/migration/v0-to-v1)

## Quick Links

- [Installation](/getting-started/installation) - Detailed installation instructions
- [Core Concepts](/getting-started/core-concepts) - Understand the fundamental concepts
- [Time Travel](/examples/time-travel) - Learn about Time Travel functionality
- [DevTools](/guides/debugging) - Debug with DevTools
- [Best Practices](/guides/best-practices) - Follow best practices
- [Performance Guide](/performance/) - Optimize performance
