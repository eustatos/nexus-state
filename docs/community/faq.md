# Frequently Asked Questions

Common questions and answers about Nexus State.

## General

### What is Nexus State?

Nexus State is a modern, lightweight state management library for JavaScript applications. It provides a simple and intuitive API for managing application state with features like DevTools integration, Time Travel, and framework support.

### Why should I use Nexus State?

- **Simple API**: Easy to learn and use
- **Fast Performance**: Optimized for speed and efficiency
- **Framework Support**: Works with React, Vue, and Svelte
- **Developer Tools**: Built-in DevTools integration
- **Time Travel**: Debug and undo/redo state changes
- **Ecosystem**: Rich set of plugins and adapters

### Is Nexus State production-ready?

Yes! Nexus State v1.0 is fully production-ready with:

- Comprehensive documentation
- Comprehensive test coverage
- Performance optimizations
- Active community support

## Installation & Setup

### How do I install Nexus State?

Install the core package:

```bash
npm install @nexus-state/core
```

For framework-specific integrations:

```bash
npm install @nexus-state/react  # For React
npm install @nexus-state/vue    # For Vue
npm install @nexus-state/svelte # For Svelte
```

### Can I use Nexus State with other state management libraries?

Yes! Nexus State is designed to work alongside other state management solutions. You can use it for specific parts of your application while keeping other state management systems.

## Core Concepts

### What is an atom?

An atom is the basic unit of state in Nexus State. It holds a single value and can be updated and subscribed to.

### What is a store?

A store holds atoms and provides methods to interact with them. The enhanced store (recommended) provides additional features like DevTools integration and Time Travel.

### What is Time Travel?

Time Travel allows you to track state changes and move between different states. It's useful for debugging and providing undo/redo functionality.

### What are DevTools?

DevTools are browser extensions that allow you to inspect and debug your state in real-time. They provide a visual interface for exploring atoms, actions, and state changes.

## Usage

### How do I create an atom?

```javascript
import { atom } from '@nexus-state/core';

// Primitive atom
const countAtom = atom(0, 'count');

// Computed atom
const doubleCountAtom = atom((get) => get(countAtom) * 2, 'doubleCount');
```

### How do I update atom values?

```javascript
import { createEnhancedStore } from '@nexus-state/core';

const store = createEnhancedStore();
const countAtom = atom(0, 'count');

// Direct update
store.set(countAtom, 1);

// Functional update
store.set(countAtom, prev => prev + 1);

// Batch updates
store.batch(() => {
  store.set(countAtom, 1);
  store.set(nameAtom, 'John');
});
```

### How do I use Time Travel?

```javascript
import { createEnhancedStore } from '@nexus-state/core';

const store = createEnhancedStore([], {
  enableTimeTravel: true
});

// Undo to previous state
store.undo();

// Redo to next state
store.redo();

// Jump to specific snapshot
store.jumpTo(2);
```

## Framework Integration

### How do I use Nexus State with React?

```javascript
import { useAtom } from '@nexus-state/react';

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### How do I use Nexus State with Vue?

```javascript
import { useAtom } from '@nexus-state/vue';

export default {
  setup() {
    const count = useAtom(countAtom);
    
    return { count };
  }
};
```

### How do I use Nexus State with Svelte?

```javascript
import { useAtom } from '@nexus-state/svelte';

let count = useAtom(countAtom);
```

## Performance

### Is Nexus State performant?

Yes! Nexus State is optimized for performance with:

- Efficient subscription updates
- Lazy computed atom evaluation
- Optimized bundle size
- Minimal re-renders

### How can I improve performance?

- Use selectors to subscribe to specific state parts
- Batch updates when possible
- Limit Time Travel history size
- Disable DevTools in production
- Use Immer for complex state updates

## DevTools & Debugging

### How do I enable DevTools?

```javascript
import { createEnhancedStore, devTools } from '@nexus-state/devtools';

const store = createEnhancedStore([devTools({
  name: 'My App',
  trace: true
})], {
  enableDevTools: true,
  enableTimeTravel: true
});
```

### Why aren't my atoms showing in DevTools?

Make sure you:

1. Add the DevTools plugin to your store
2. Enable DevTools in store options
3. Give your atoms descriptive names

## Time Travel

### How do I use Time Travel?

Enable Time Travel when creating your store:

```javascript
const store = createEnhancedStore([], {
  enableTimeTravel: true
});
```

### How do I create custom snapshots?

```javascript
// Manually capture a snapshot
store.captureSnapshot('User Action');
```

## Migration

### How do I migrate from v0.x to v1.0?

See the [Migration Guide](../migration/v0-to-v1.md) for step-by-step instructions.

### What are the breaking changes?

See the [Breaking Changes](../migration/breaking-changes.md) document for a complete list.

## Development

### Is Nexus State open source?

Yes! Nexus State is open source and available on [GitHub](https://github.com/nexus-state/nexus-state).

### How can I contribute?

We welcome contributions! Check out our [Contributing Guide](https://github.com/nexus-state/nexus-state/blob/main/CONTRIBUTING.md) to get started.

### Where can I get help?

- Join our [Discord community](https://discord.gg/nexus-state)
- Check our [GitHub Discussions](https://github.com/nexus-state/nexus-state/discussions)
- Open an [issue](https://github.com/nexus-state/nexus-state/issues) if you found a bug

## License

Nexus State is licensed under the MIT License. See the [LICENSE](https://github.com/nexus-state/nexus-state/blob/main/LICENSE) file for details.
