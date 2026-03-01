# Getting Started

Welcome to Nexus State! This section will help you get started with using Nexus State in your projects.

## What is Nexus State?

Nexus State is a modern, lightweight state management library for JavaScript applications. It provides a simple and intuitive API for managing application state with features like:

- 🎯 **Simple API**: Easy to learn and use
- ⚡ **Fast Performance**: Optimized for speed and efficiency
- 🔌 **Framework Support**: Works with React, Vue, and Svelte
- 🛠️ **Developer Tools**: Built-in DevTools integration
- 🕒 **Time Travel**: Debug and undo/redo state changes
- 📦 **Ecosystem**: Rich set of plugins and adapters

## Quick Start

Install the core package:

```bash
npm install @nexus-state/core
```

Create your first state:

```javascript
import { atom, createEnhancedStore } from '@nexus-state/core';

// Create an atom
const countAtom = atom(0, 'count');

// Create a store with time travel and DevTools
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  enableDevTools: true
});

// Get current value
console.log(store.get(countAtom)); // 0

// Update value
store.set(countAtom, 1);
console.log(store.get(countAtom)); // 1

// Functional update
store.set(countAtom, prev => prev + 1);
console.log(store.get(countAtom)); // 2
```

## Next Steps

- Learn about [Core Concepts](./core-concepts.md)
- Explore [Examples](../examples/index.md)
- Check out [Recipes](../recipes/index.md)
- See [Package-Specific Examples](../recipes/package-examples.md)
