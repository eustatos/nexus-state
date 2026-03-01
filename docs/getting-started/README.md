# Getting Started Guide

This section provides comprehensive guides for getting started with Nexus State.

## Quick Start

### Installation

Install the core package:

```bash
npm install @nexus-state/core
```

### Basic Usage

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
