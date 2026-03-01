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
const userAtom = atom(
  { name: '', age: 0 },
  (get, set, update) => {
    set(userAtom, { ...get(userAtom), ...update });
  },
  'user'
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
import { createEnhancedStore } from '@nexus-state/core';

// Create a basic store
const store = createEnhancedStore();

// Create a store with options
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  enableDevTools: true,
  maxHistory: 50
});
```

### Store Methods

- `get(atom)`: Get the current value of an atom
- `set(atom, newValue | updater)`: Set the value of an atom
- `subscribe(atom, listener)`: Subscribe to changes in an atom
- `getState()`: Get the state of all atoms
- `captureSnapshot(action)`: Capture a new snapshot (if time travel enabled)
- `undo()`: Undo to the previous state (if time travel enabled)
- `redo()`: Redo to the next state (if time travel enabled)

## Time Travel

Time Travel allows you to track state changes and move between different states.

### Basic Time Travel

```javascript
import { atom, createEnhancedStore } from '@nexus-state/core';

const countAtom = atom(0, 'count');
const store = createEnhancedStore([], { enableTimeTravel: true });

store.set(countAtom, 1); // Snapshot 1
store.set(countAtom, 2); // Snapshot 2
store.set(countAtom, 3); // Snapshot 3

store.undo(); // Back to 2
store.undo(); // Back to 1
store.redo(); // Forward to 2
```

### Manual Snapshots

```javascript
// Capture a snapshot with a custom action name
store.captureSnapshot('USER_ACTION');

// Get all history
const history = store.getHistory();

// Jump to a specific snapshot
store.jumpTo(2);
```

## DevTools

DevTools integration allows you to inspect and debug your state.

### Basic DevTools

```javascript
import { atom, createEnhancedStore } from '@nexus-state/core';

const countAtom = atom(0, 'count');
const store = createEnhancedStore([], { enableDevTools: true });

// Connect to DevTools
store.connectDevTools();
```

### Custom DevTools Configuration

```javascript
import { devTools } from '@nexus-state/devtools';

const store = createEnhancedStore([devTools({
  name: 'My App',
  trace: true,
  maxAge: 50
})], { enableTimeTravel: true });
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
    const count = useAtom(countAtom);
    
    return { count };
  }
};
```

### Svelte

```javascript
import { useAtom } from '@nexus-state/svelte';

let count = useAtom(countAtom);
```

## Next Steps

- Explore [Examples](../examples/index.md)
- Check out [API Reference](../api/)
- See [Recipes](../recipes/index.md)
