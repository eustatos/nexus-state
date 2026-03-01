# Enhanced Store

## Overview

The Enhanced Store is the recommended way to use Nexus State. It provides additional capabilities beyond the basic store, including DevTools integration and Time Travel functionality.

## Creating an Enhanced Store

```javascript
import { createEnhancedStore } from '@nexus-state/core';

// Basic usage
const store = createEnhancedStore();

// With plugins
const store = createEnhancedStore([plugin1, plugin2]);

// With options
const store = createEnhancedStore([], {
  enableDevTools: true,
  enableTimeTravel: true,
  devToolsName: 'My App',
  maxHistory: 50,
  autoCapture: true,
  registryMode: 'global'
});
```

## Store Options

### `enableDevTools`

Enable DevTools integration. When enabled, you can inspect and debug your state using the Nexus State DevTools browser extension.

```javascript
const store = createEnhancedStore([], {
  enableDevTools: true
});
```

### `devToolsName`

Custom name to display in DevTools for easier identification.

```javascript
const store = createEnhancedStore([], {
  enableDevTools: true,
  devToolsName: 'My Application'
});
```

### `enableTimeTravel`

Enable Time Travel functionality for undo/redo capabilities.

```javascript
const store = createEnhancedStore([], {
  enableTimeTravel: true
});
```

### `maxHistory`

Maximum number of snapshots to keep in history (default: 50).

```javascript
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  maxHistory: 100
});
```

### `autoCapture`

Automatically capture snapshots on store changes (default: true). Set to false if you want to manually control snapshot creation.

```javascript
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  autoCapture: false
});

// Manually capture snapshots
store.captureSnapshot('USER_ACTION');
```

### `registryMode`

Registry mode for atom registration. Options are 'global' (default) or 'isolated'.

```javascript
const store = createEnhancedStore([], {
  registryMode: 'isolated'
});
```

## Enhanced Store API

### Standard Store Methods

The enhanced store includes all standard store methods:

- `get(atom)`: Get the current value of an atom
- `set(atom, newValue | updater)`: Set the value of an atom
- `subscribe(atom, listener)`: Subscribe to changes in an atom
- `getState()`: Get the state of all atoms

### Time Travel Methods

These methods are available when `enableTimeTravel` is true:

#### `captureSnapshot(action?)`

Manually capture a snapshot with an optional action name.

```javascript
store.captureSnapshot('USER_CLICK');
```

#### `undo()`

Undo to the previous state.

```javascript
if (store.undo()) {
  console.log('Undo successful');
} else {
  console.log('No history to undo');
}
```

#### `redo()`

Redo to the next state.

```javascript
if (store.redo()) {
  console.log('Redo successful');
} else {
  console.log('No history to redo');
}
```

#### `canUndo()`

Check if undo is available.

```javascript
if (store.canUndo()) {
  console.log('Can undo');
}
```

#### `canRedo()`

Check if redo is available.

```javascript
if (store.canRedo()) {
  console.log('Can redo');
}
```

#### `jumpTo(index)`

Jump to a specific snapshot in history.

```javascript
// Jump to the third snapshot
store.jumpTo(2);
```

#### `clearHistory()`

Clear all history.

```javascript
store.clearHistory();
```

#### `getHistory()`

Get all snapshots in history.

```javascript
const history = store.getHistory();
console.log(`History length: ${history.length}`);
```

### DevTools Methods

#### `connectDevTools()`

Connect to DevTools for debugging.

```javascript
store.connectDevTools();
```

## Examples

### Complete Time Travel Example

```javascript
import { atom, createEnhancedStore } from '@nexus-state/core';

const countAtom = atom(0, 'count');
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  enableDevTools: true
});

// Initial state
console.log('Initial:', store.get(countAtom)); // 0

// State changes
store.set(countAtom, 1);
store.set(countAtom, 2);
store.set(countAtom, 3);

console.log('After updates:', store.get(countAtom)); // 3

// Time travel
store.undo();
console.log('After undo:', store.get(countAtom)); // 2

store.undo();
console.log('After another undo:', store.get(countAtom)); // 1

store.redo();
console.log('After redo:', store.get(countAtom)); // 2
```

### Manual Snapshot Control

```javascript
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  autoCapture: false
});

// Manual snapshots with custom names
store.captureSnapshot('Form Submission');
store.set(countAtom, 1);
store.captureSnapshot('State Saved');
store.set(countAtom, 2);
store.captureSnapshot('User Action');

const history = store.getHistory();
console.log(history.length); // 3
```

### Integration with DevTools

```javascript
import { devTools } from '@nexus-state/devtools';

const store = createEnhancedStore([devTools({
  name: 'My Application',
  trace: true,
  maxAge: 100
})], {
  enableTimeTravel: true,
  enableDevTools: true
});
```

## Best Practices

1. **Enable Time Travel in Development**: Always enable time travel during development for better debugging.
2. **Use Descriptive Atom Names**: Give your atoms descriptive names for better DevTools experience.
3. **Control History Size**: Set appropriate `maxHistory` to balance functionality and memory usage.
4. **Manual Snapshots**: Use manual snapshots for important user actions to create meaningful history points.
5. **Production Considerations**: In production, you might want to disable DevTools or time travel for performance.

## Migration from Basic Store

To migrate from the basic `createStore` to `createEnhancedStore`:

```javascript
// Old way
const store = createStore([plugin1, plugin2]);

// New way
const store = createEnhancedStore([plugin1, plugin2], {
  enableTimeTravel: true,
  enableDevTools: true
});
```

The enhanced store maintains compatibility with the basic store API while adding new capabilities.
