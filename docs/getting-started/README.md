# Getting Started Guide

This section provides comprehensive guides for getting started with Nexus State.

## What makes Nexus State unique?

### Framework-Agnostic + Fine-Grained Reactivity

Write state logic once, use in React, Vue, and Svelte — with atom-level reactivity.

### Isolated State + Time-Travel Per-Scope

Create independent stores per request (SSR), per test, or per component — with independent time-travel timelines.

## Quick Start

### Installation

Install the core package:

```bash
npm install @nexus-state/core
```

### Basic Usage

```javascript
import { atom, createStore } from '@nexus-state/core';

// Create an atom
const countAtom = atom(0, 'count');

// Create a store
const store = createStore();

// Get current value
console.log(store.get(countAtom)); // 0

// Update value
store.set(countAtom, 1);
console.log(store.get(countAtom)); // 1

// Subscribe to changes
const unsubscribe = store.subscribe(countAtom, (value) => {
  console.log('Count changed:', value);
});
```

### SSR with Isolated Stores (Next.js)

```javascript
// pages/[id].tsx
import { atom, createStore } from '@nexus-state/core';

const userAtom = atom(null, 'user');

export async function getServerSideProps(context) {
  // Create isolated store per request - no memory leaks!
  const store = createStore();
  store.set(userAtom, await fetchUser(context.params.id));
  return { props: { initialState: store.getState() } };
}

function Page({ initialState }) {
  const store = useMemo(() => createStore().setState(initialState), [initialState]);
  const [user] = useAtom(userAtom);
  return <div>{user?.name}</div>;
}
```

### Time-Travel Debugging

```javascript
import { atom, createStore } from '@nexus-state/core';
import { TimeTravelController } from '@nexus-state/time-travel';

const countAtom = atom(0, 'count');
const store = createStore();
const controller = new TimeTravelController(store);

controller.capture('init');
store.set(countAtom, 5);
controller.capture('increment');

controller.undo(); // count = 0
controller.redo(); // count = 5
```

## What's Next?

- [Installation](./installation.md) - Detailed installation instructions
- [Core Concepts](./core-concepts.md) - Understand the fundamental concepts
- [Examples](../examples/index.md) - See real-world examples
- [API Reference](../api/) - Complete API documentation

## Need Help?

- [Join our Discord](https://discord.gg/nexus-state)
- [Check the FAQs](../community/faq.md)
- [Open an issue](https://github.com/nexus-state/nexus-state/issues)
