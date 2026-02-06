# Nexus State

A simple and powerful state management library for JavaScript applications.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://sourcecraft.dev/astashkin-a/nexus-state)
[![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/astashkin-a/nexus-state/blob/main/LICENSE)
[![npm version](https://img.shields.io/badge/npm-v0.0.0-orange)](https://www.npmjs.com/package/@nexus-state/core)

## Installation

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

## Quick Start

```javascript
import { atom, createStore } from '@nexus-state/core';

// Create an atom
const countAtom = atom(0);

// Create a store
const store = createStore();

// Get the value of the atom
console.log(store.get(countAtom)); // 0

// Update the value of the atom
store.set(countAtom, 1);

// Subscribe to changes
const unsubscribe = store.subscribe(countAtom, (value) => {
  console.log('Count changed:', value);
});
```

## Time Travel

Nexus State now includes powerful Time Travel functionality that allows you to track state changes and move between different states for debugging and historical state restoration.

```javascript
import { 
  StateSnapshotManager, 
  StateRestorer 
} from '@nexus-state/core';
import { atomRegistry } from '@nexus-state/core';

// Create time travel components
const snapshotManager = new StateSnapshotManager(atomRegistry);
const stateRestorer = new StateRestorer(atomRegistry);

// Create a snapshot of the current state
const snapshot = snapshotManager.createSnapshot('USER_ACTION');

// Restore state from a snapshot
const success = stateRestorer.restoreFromSnapshot(snapshot);
```

## Demo Applications

This repository contains several demo applications showcasing different aspects of the Nexus State library:

- [demo-react](apps/demo-react) - Basic React integration
- [demo-svelte](apps/demo-svelte) - Basic Svelte integration
- [demo-vanilla](apps/demo-vanilla) - Vanilla JavaScript usage
- [demo-vue](apps/demo-vue) - Basic Vue integration
- [demo-async](apps/demo-async) - Async operations with atoms
- [demo-family](apps/demo-family) - Working with atom families
- [demo-immer](apps/demo-immer) - Immer integration for complex state
- [demo-middleware](apps/demo-middleware) - Middleware usage
- [demo-persist](apps/demo-persist) - State persistence
- [demo-forms-granularity](apps/demo-forms-granularity) - Form state management with granularity comparison

To run any demo application, use the corresponding script from the root package.json:

```bash
npm run dev:async
npm run dev:family
npm run dev:immer
npm run dev:middleware
npm run dev:persist
npm run dev:forms
```

## Packages

- [@nexus-state/core](packages/core) - Core library
- [@nexus-state/react](packages/react) - React integration
- [@nexus-state/vue](packages/vue) - Vue integration
- [@nexus-state/svelte](packages/svelte) - Svelte integration
- [@nexus-state/persist](packages/persist) - Persistence plugin
- [@nexus-state/devtools](packages/devtools) - DevTools plugin
- [@nexus-state/middleware](packages/middleware) - Middleware plugin
- [@nexus-state/immer](packages/immer) - Immer integration
- [@nexus-state/web-worker](packages/web-worker) - Web Worker integration

## Documentation

Visit our [documentation](docs/) for detailed guides and API references.

## Linting

For information on setting up and using linting in this project, see [Linting Setup](docs/linting-setup.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.