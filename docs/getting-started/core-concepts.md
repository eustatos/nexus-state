# Core Concepts

Nexus State is built around a few core concepts that make it powerful and flexible.

## Atoms

Atoms are the basic units of state in Nexus State. They hold a single value and can be updated and subscribed to.

### Creating Atoms

```javascript
import { atom } from '@nexus-state/core';

// Create a primitive atom
const countAtom = atom(0, 'count');

// Create a computed atom
const doubleCountAtom = atom((get) => get(countAtom) * 2, 'doubleCount');

// Create a writable atom with custom write logic
const writableCountAtom = atom(
  (get, set, update) => {
    set(countAtom, update);
  },
  'writableCount'
);
```

### Atom Types

- **Primitive Atom**: Holds a simple value (number, string, etc.)
- **Computed Atom**: Derives its value from other atoms
- **Writable Atom**: Has custom write logic in addition to read logic

## Store

A store holds atoms and provides methods to interact with them.

### Creating a Store

```javascript
import { createStore } from '@nexus-state/core';

// Create a basic store
const store = createStore();
```

### Store Methods

- `get(atom)`: Get the current value of an atom
- `set(atom, newValue | updater)`: Set the value of an atom
- `subscribe(atom, listener)`: Subscribe to changes in an atom
- `getState()`: Get the state of all atoms

### Store with Plugins

```javascript
import { createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';
import { middleware } from '@nexus-state/middleware';

const store = createStore([
  devTools({ name: 'My App' }),
  // other plugins...
]);
```

> 💡 **Need Time Travel?** For advanced features like undo/redo and time travel, see [Enhanced Store](../guides/enhanced-store.md).

## Basic Time Travel (via DevTools)

Time Travel is available through the DevTools plugin:

```javascript
import { atom, createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

const countAtom = atom(0, 'count');
const store = createStore([
  devTools({ 
    name: 'My App',
    maxAge: 50  // Keep last 50 states
  })
]);

store.set(countAtom, 1);
store.set(countAtom, 2);
store.set(countAtom, 3);

// Use Redux DevTools UI to jump between states
```

## DevTools

DevTools integration allows you to inspect and debug your state in Redux DevTools.

### Basic DevTools

```javascript
import { atom, createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

const countAtom = atom(0, 'count');
const store = createStore([
  devTools({ name: 'My App' })
]);
```

### DevTools Configuration

```javascript
import { devTools } from '@nexus-state/devtools';

const store = createStore([
  devTools({
    name: 'My App',
    trace: true,        // Enable stack traces
    maxAge: 50,         // Maximum history depth
    showAtomNames: true // Show atom names in DevTools
  })
]);
```

## Framework Integration

Nexus State provides adapters for different frameworks.

### React

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

### Vue

```javascript
import { useAtom } from '@nexus-state/vue';

export default {
  setup() {
    const [count, setCount] = useAtom(countAtom);
    return { count, setCount };
  }
};
```

### Svelte

```javascript
import { useAtom } from '@nexus-state/svelte';

const [count, setCount] = useAtom(countAtom);
```

## Next Steps

- Explore [Examples](../examples/index.md)
- Check out [API Reference](../api/)
- Learn about [Enhanced Store](../guides/enhanced-store.md) for time travel
- See [Recipes](../recipes/index.md)
