# Time-Travel Debugging with DevTools

Quick guide to enable and use time-travel debugging with Nexus State DevTools.

## Overview

Time-travel debugging allows you to:
- Navigate through your application's state history
- Revert to previous states
- Inspect how state changed over time
- Debug complex state interactions

## Quick Setup

### Step 1: Import Required Modules

```typescript
import { atom, createStore, SimpleTimeTravel } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';
```

### Step 2: Create Store and TimeTravel Instance

```typescript
const store = createStore();

// Create SimpleTimeTravel instance
const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 50,      // Maximum number of states to keep
  autoCapture: true,   // Automatically capture state changes
});
```

### Step 3: Apply DevTools Plugin

```typescript
const devtoolsPlugin = devTools();
devtoolsPlugin.apply(store);
// DevTools will automatically find and use timeTravel from store
```

### Step 4: Use in Your App

```typescript
function App() {
  const [count, setCount] = useAtom(countAtom, store);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

## How to Use Time-Travel

### 1. Open Redux DevTools Extension

1. Install [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) (Chrome/Firefox)
2. Open DevTools in your browser (F12 or Right-click → Inspect)
3. Navigate to the "Nexus State" tab

### 2. Navigate Through History

In the DevTools interface:

- **Timeline**: Click on any state in the timeline to jump to it
- **Jump to State**: Use the slider or input to jump to a specific state
- **Undo/Redo**: Use the buttons to navigate through recent states
- **State Inspector**: View the complete state tree at any point

### 3. Advanced Usage

#### Manual Time Travel

```typescript
// Jump to specific state by index
timeTravel.jumpTo(5);

// Check if undo is available
if (timeTravel.canUndo()) {
  timeTravel.undo();
}

// Check if redo is available
if (timeTravel.canRedo()) {
  timeTravel.redo();
}

// Get current history
const history = timeTravel.getHistory();
console.log(`History length: ${history.length}`);

// Clear history
timeTravel.clearHistory();
```

#### Custom Action Names

```typescript
const countAtom = atom(0, 'counter');

// Actions will be named automatically: "counter SET"
store.set(countAtom, 5);

// Or use batch for grouped actions
store.startBatch('user-update');
store.set(firstNameAtom, 'Jane');
store.set(lastNameAtom, 'Smith');
store.endBatch('user-update');
// This creates one action: "user-update"
```

#### Enable Only in Development

```typescript
const store = createStore();
const timeTravel = new SimpleTimeTravel(store);

if (process.env.NODE_ENV === 'development') {
  const devtoolsPlugin = devTools({
    name: 'My App',
    maxAge: 100,  // Keep more history in development
    trace: true,  // Capture stack traces
  });
  
  devtoolsPlugin.apply(store);
}
```

## Example: Counter with Time-Travel

```typescript
import React from 'react';
import { useAtom } from '@nexus-state/react';
import { atom, createStore, SimpleTimeTravel } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

const countAtom = atom(0, 'counter');

const store = createStore();
const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 50,
  autoCapture: true,
});

const devtoolsPlugin = devTools();
devtoolsPlugin.apply(store);
devtoolsPlugin.setTimeTravel(timeTravel); // Optional, auto-detected

function Counter() {
  const [count, setCount] = useAtom(countAtom, store);
  
  const historyLength = timeTravel.getHistory().length;
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <p>History: {historyLength} states</p>
      
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(c => c - 1)}>Decrement</button>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Time-Travel Controls:</h3>
        <button onClick={() => timeTravel.undo()} disabled={!timeTravel.canUndo()}>
          Undo
        </button>
        <button onClick={() => timeTravel.redo()} disabled={!timeTravel.canRedo()}>
          Redo
        </button>
      </div>
    </div>
  );
}
```

## Troubleshooting

### Time-Travel Not Working

1. Ensure `SimpleTimeTravel` is created with the store
2. Check that DevTools plugin is applied after creating timeTravel
3. Verify Redux DevTools extension is installed
4. Check browser console for error messages

### Performance Issues

1. Reduce `maxHistory` option
2. Disable `autoCapture` and manually call `capture()` only when needed
3. Use state sanitization to reduce payload size

```typescript
const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 20,        // Keep less history
  autoCapture: false,    // Manual capture
});

// Manually capture at key points
timeTravel.capture('user-login');
```

### Missing States

If you don't see expected states in DevTools:

1. Check that atoms are created **after** DevTools plugin is applied
2. Verify atoms have names: `atom(0, 'myAtom')`
3. Ensure `autoCapture` is `true` or manually call `capture()`

## Best Practices

1. **Always name your atoms** for better DevTools experience
2. **Use batch updates** for related changes
3. **Enable time-travel only in development** for production builds
4. **Sanitize sensitive data** before sending to DevTools

```typescript
const devtoolsPlugin = devTools({
  stateSanitizer: (state) => {
    const sanitized = { ...state };
    delete sanitized.token;
    delete sanitized.password;
    return sanitized;
  },
});
```
