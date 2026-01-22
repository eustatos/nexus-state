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

## Basic Usage

Here's a simple example of how to use Nexus State:

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

## Next Steps

- Learn about [core concepts](/guide/core-concepts)
- Explore the [API reference](/api/)
- Check out [examples](/examples/)
- Try [recipes](/recipes/)