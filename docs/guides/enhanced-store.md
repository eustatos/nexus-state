# Enhanced Store Guide

The Enhanced Store provides advanced features like **Time Travel** (undo/redo) and enhanced DevTools integration.

## When to Use Enhanced Store

Use `createEnhancedStore` when you need:

- ⏪ **Time Travel** — undo/redo functionality
- 📊 **Enhanced DevTools** — advanced debugging features
- 📸 **Snapshot History** — track state changes over time
- 🔄 **Auto-capture** — automatic snapshot creation on state changes

For basic state management, use [`createStore()`](./core-concepts.md) instead.

---

## Quick Start

### Basic Enhanced Store

```javascript
import { createEnhancedStore } from '@nexus-state/core';

const store = createEnhancedStore();

// Now you have access to time travel methods
store.undo();
store.redo();
store.jumpTo(5);
```

### With Options

```javascript
import { createEnhancedStore } from '@nexus-state/core';

const store = createEnhancedStore([], {
  enableTimeTravel: true,    // Enable undo/redo
  enableDevTools: true,      // Enable DevTools integration
  maxHistory: 100,           // Keep last 100 snapshots
  autoCapture: true          // Auto-capture on state changes
});
```

### With Plugins

```javascript
import { createEnhancedStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';
import { middleware } from '@nexus-state/middleware';

const store = createEnhancedStore([
  devTools({ name: 'My App' }),
  middleware(userAtom, {
    beforeSet: (atom, value) => validateUser(value)
  })
], {
  enableTimeTravel: true
});
```

---

## Time Travel Features

### Undo/Redo

```javascript
import { atom, createEnhancedStore } from '@nexus-state/core';

const countAtom = atom(0, 'count');
const store = createEnhancedStore([], { enableTimeTravel: true });

store.set(countAtom, 1);
store.set(countAtom, 2);
store.set(countAtom, 3);

store.undo(); // count = 2
store.undo(); // count = 1
store.redo(); // count = 2
```

### Check Availability

```javascript
if (store.canUndo()) {
  store.undo();
}

if (store.canRedo()) {
  store.redo();
}
```

### Jump to Specific State

```javascript
// Jump to snapshot at index 5
store.jumpTo(5);

// Get current position in history
const currentIndex = store.getHistoryIndex();
```

### Clear History

```javascript
// Clear all history
store.clearHistory();
```

---

## Snapshot Management

### Manual Snapshots

```javascript
// Capture snapshot with custom action name
store.captureSnapshot('USER_LOGIN');

// Capture with metadata
store.captureSnapshot('FORM_SUBMIT', {
  formId: 'login-form',
  userId: 123
});
```

### Get History

```javascript
// Get all snapshots
const history = store.getHistory();

// Get specific snapshot
const snapshot = history[5];

// Get snapshot metadata
snapshot.metadata; // { action: 'USER_LOGIN', timestamp: 1234567890 }
```

---

## DevTools Integration

### Basic Setup

```javascript
import { createEnhancedStore } from '@nexus-state/core';

const store = createEnhancedStore([], {
  enableDevTools: true,
  devToolsName: 'My App'
});
```

### Advanced Configuration

```javascript
import { createEnhancedStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

const store = createEnhancedStore([
  devTools({
    name: 'My App',
    trace: true,           // Enable stack traces
    maxAge: 100,           // Max history depth
    showAtomNames: true,   // Show atom names
    latency: 50,           // Debounce delay (ms)
    actionNamingStrategy: 'auto' // Auto-name actions
  })
], {
  enableTimeTravel: true
});
```

### Stack Traces

```javascript
const store = createEnhancedStore([
  devTools({
    trace: true,
    traceLimit: 10  // Number of stack frames
  })
]);

// Now DevTools shows where state changes originated
store.set(countAtom, 5);
// Stack trace: Counter.tsx:15 → handleClick → setCount
```

---

## Performance Considerations

### Limit History Size

```javascript
const store = createEnhancedStore([], {
  maxHistory: 50  // Keep only last 50 snapshots
});
```

### Disable Auto-Capture

```javascript
const store = createEnhancedStore([], {
  autoCapture: false  // Manual snapshots only
});

// Capture manually when needed
store.captureSnapshot('IMPORTANT_CHANGE');
```

### Conditional Time Travel

```javascript
// Enable time travel only in development
const store = createEnhancedStore([], {
  enableTimeTravel: process.env.NODE_ENV === 'development'
});
```

---

## Common Patterns

### Form with Undo

```javascript
import { atom, createEnhancedStore } from '@nexus-state/core';

const formAtom = atom({ name: '', email: '' }, 'form');
const store = createEnhancedStore([], { enableTimeTravel: true });

function Form() {
  const handleUndo = () => {
    if (store.canUndo()) {
      store.undo();
    }
  };

  return (
    <form>
      <input value={store.get(formAtom).name} />
      <button type="button" onClick={handleUndo}>Undo</button>
    </form>
  );
}
```

### Drawing App with History

```javascript
import { atom, createEnhancedStore } from '@nexus-state/core';

const strokesAtom = atom([], 'strokes');
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  maxHistory: 100
});

function DrawingApp() {
  const handleUndo = () => store.undo();
  const handleRedo = () => store.redo();
  const handleClear = () => {
    store.set(strokesAtom, []);
    store.clearHistory(); // Clear history on clear
  };

  return (
    <div>
      <canvas />
      <button onClick={handleUndo}>Undo</button>
      <button onClick={handleRedo}>Redo</button>
      <button onClick={handleClear}>Clear All</button>
    </div>
  );
}
```

### Text Editor with Snapshots

```javascript
import { atom, createEnhancedStore } from '@nexus-state/core';

const contentAtom = atom('', 'content');
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  autoCapture: false // Manual snapshots
});

// Auto-save every 30 seconds
setInterval(() => {
  store.captureSnapshot('AUTO_SAVE');
}, 30000);

// Capture on user action
function saveDocument() {
  store.captureSnapshot('USER_SAVE');
}
```

---

## API Reference

### `createEnhancedStore(plugins, options)`

Creates an enhanced store with time travel and DevTools support.

| Parameter | Type | Description |
|-----------|------|-------------|
| `plugins` | `Plugin[]` | Array of plugins |
| `options.enableTimeTravel` | `boolean` | Enable undo/redo (default: `false`) |
| `options.enableDevTools` | `boolean` | Enable DevTools (default: `true`) |
| `options.devToolsName` | `string` | Name in DevTools |
| `options.maxHistory` | `number` | Max snapshots to keep (default: `50`) |
| `options.autoCapture` | `boolean` | Auto-capture on changes (default: `true`) |

### Store Methods

| Method | Description |
|--------|-------------|
| `undo()` | Undo to previous state |
| `redo()` | Redo to next state |
| `canUndo()` | Check if undo available |
| `canRedo()` | Check if redo available |
| `jumpTo(index)` | Jump to specific snapshot |
| `captureSnapshot(action)` | Create manual snapshot |
| `getHistory()` | Get all snapshots |
| `getHistoryIndex()` | Get current position |
| `clearHistory()` | Clear all history |

---

## Troubleshooting

### Problem: `undo()` doesn't work

**Solution:** Enable time travel:

```javascript
const store = createEnhancedStore([], {
  enableTimeTravel: true  // Required!
});
```

### Problem: Too much memory usage

**Solution:** Limit history size:

```javascript
const store = createEnhancedStore([], {
  maxHistory: 20  // Reduce from default 50
});
```

### Problem: DevTools not showing

**Solution:** Check DevTools configuration:

```javascript
const store = createEnhancedStore([
  devTools({
    name: 'My App',
    showAtomNames: true
  })
], {
  enableDevTools: true  // Required!
});
```

---

## Next Steps

- [DevTools Guide](./devtools.md) — Advanced DevTools features
- [Time Travel Debugging](../guides/time-travel.md) — Debug with time travel
- [Performance Tips](../performance/index.md) — Optimize your store
