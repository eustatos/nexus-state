# @nexus-state/core

The core package of the Nexus State ecosystem - a powerful state management solution for modern JavaScript applications.

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

## Installation

```bash
npm install @nexus-state/core
```

## Overview

Nexus State is a modern state management library designed for simplicity, performance, and scalability. The `@nexus-state/core` package provides the fundamental building blocks for creating reactive state containers in your applications.

## Features

- **Lightweight**: Minimal overhead for maximum performance
- **Reactive**: Automatic updates when state changes
- **TypeScript Support**: First-class TypeScript integration with full type inference
- **Framework Agnostic**: Works with any JavaScript framework or vanilla JavaScript
- **Extensible**: Easily extend functionality with middleware and plugins
- **DevTools Integration**: Automatic atom registration for debugging

## Core Concepts

### Atoms

Atoms are the fundamental units of state in Nexus State. Each atom represents a single piece of state that can be observed and updated reactively.

```javascript
import { atom } from '@nexus-state/core';

// Create an atom with initial value
const countAtom = atom(0);

// Create an atom with a name for better debugging
const namedCountAtom = atom(0, 'count');

// Create a computed atom
const doubleCountAtom = atom((get) => get(countAtom) * 2);

// Create a writable atom
const writableCountAtom = atom(0, (get, set, value) => {
  set(countAtom, value);
});
```

All atoms are automatically registered in a global registry for DevTools integration and time travel support. You can provide an optional name parameter to atoms for better debugging experience in DevTools.

### Global Atom Registry

Nexus State automatically maintains a global registry of all created atoms to support DevTools integration and time travel features.

```javascript
import { atom, atomRegistry } from '@nexus-state/core';

// Create atoms (automatically registered)
const countAtom = atom(0, 'count');
const nameAtom = atom('John', 'name');

// Access the registry
const allAtoms = atomRegistry.getAll();
const atomName = atomRegistry.getName(countAtom);
const retrievedAtom = atomRegistry.get(countAtom.id);
```

### Stores

Stores are containers that hold multiple atoms and provide methods for managing state.

```javascript
import { atom, createStore } from '@nexus-state/core';

const countAtom = atom(0);
const nameAtom = atom('John');

const myStore = createStore();

// Set initial values
myStore.set(countAtom, 5);
myStore.set(nameAtom, 'Jane');

// Get current values
console.log(myStore.get(countAtom)); // 5
console.log(myStore.get(nameAtom)); // "Jane"

// Subscribe to changes
const unsubscribe = myStore.subscribe(countAtom, (value) => {
  console.log('Count changed to:', value);
});
```

## Ecosystem

Nexus State provides additional packages for enhanced functionality:

- [@nexus-state/react](../react) - React bindings for Nexus State
- [@nexus-state/immer](../immer) - Immer integration for immutable state updates
- [@nexus-state/persist](../persist) - State persistence utilities
- [@nexus-state/middleware](../middleware) - Middleware for advanced state management
- [@nexus-state/devtools](../devtools) - Developer tools integration
- [@nexus-state/vue](../vue) - Vue.js bindings
- [@nexus-state/svelte](../svelte) - Svelte bindings
- [@nexus-state/async](../async) - Async state management utilities
- [@nexus-state/web-worker](../web-worker) - Web Worker integration
- [@nexus-state/family](../family) - Atom family utilities
- [@nexus-state/cli](../cli) - Command-line interface tools

## License

MIT