# @nexus-state/core

The core package of the Nexus State ecosystem - a powerful state management solution for modern JavaScript applications.

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

## Core Concepts

### Atoms

Atoms are the fundamental units of state in Nexus State. Each atom represents a single piece of state that can be observed and updated reactively.

```javascript
import { atom } from '@nexus-state/core';

// Create an atom with initial value
const countAtom = atom(0);

// Read the current value
console.log(countAtom.get()); // 0

// Update the value
countAtom.set(5);
console.log(countAtom.get()); // 5
```

### Stores

Stores are containers that hold multiple atoms and provide methods for managing state.

```javascript
import { atom, store } from '@nexus-state/core';

const countAtom = atom(0);
const nameAtom = atom('John');

const myStore = store({
  count: countAtom,
  name: nameAtom
});

// Access atoms through the store
console.log(myStore.get('count')); // 0
myStore.set('name', 'Jane');
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