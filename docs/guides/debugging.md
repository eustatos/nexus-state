# Debugging with DevTools

Learn how to debug your Nexus State applications using the built-in DevTools.

## Quick Start

### Basic DevTools Setup

```javascript
import { createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

const store = createStore([
  devTools({
    name: 'My App',
    trace: true,
    maxAge: 50
  })
]);
```

### With Time Travel

For undo/redo functionality, use `createEnhancedStore`:

```javascript
import { createEnhancedStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

const store = createEnhancedStore([
  devTools({
    name: 'My App',
    trace: true,
    maxAge: 50
  })
], {
  enableDevTools: true,
  enableTimeTravel: true
});
```

> 📚 **Learn more:** See [Enhanced Store Guide](./enhanced-store.md) for time travel features.

## Using Redux DevTools Extension

### Installation

Install the Redux DevTools browser extension:

- [Chrome Web Store](https://chrome.google.com/webstore/detail/redux-devtools/)
- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/)

### Connection

DevTools connects automatically when the plugin is enabled. No manual connection needed!

## DevTools Features

### 1. State Inspector

The State Inspector shows all atoms and their current values:

- Click on atoms to see their values
- Expand/collapse atoms to see nested state
- Search atoms by name

### 2. Action History

The Action History shows all state changes over time:

- Click on actions to see the state before and after
- Filter actions by name
- Jump to specific actions

### 3. Time Travel

Use the slider to move between different states:

- Drag the slider to see state at any point in history
- Click on specific actions to jump to that state
- Use Undo/Redo buttons to navigate history

### 4. Stack Traces

When `trace: true` is enabled, see exactly where state changes originate:

```
set countAtom
  at Counter.tsx:15 (handleClick)
  at onClick (react-dom.production.min.js)
```

## Debugging Common Issues

### Issue: State Not Updating

**Symptoms:** UI doesn't reflect state changes

**Solutions:**
1. Check if the atom is registered (should appear in DevTools)
2. Verify that the devTools plugin is added to the store
3. Check for subscription issues in your framework integration

### Issue: DevTools Not Connecting

**Symptoms:** DevTools extension shows no state

**Solutions:**
1. Ensure devTools plugin is added to the store
2. Check browser console for errors
3. Verify Redux DevTools extension is installed

### Issue: Too Many Snapshots

**Symptoms:** DevTools slows down with many snapshots

**Solutions:**
1. Limit `maxAge` in devTools options
2. Use batch updates for related changes
3. Clear history periodically

## Advanced Debugging Techniques

### 1. Custom Action Names

Give your actions descriptive names:

```javascript
import { atom, createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

const store = createStore([devTools()]);

// Set with custom action name
store.set(countAtom, 1, 'USER_INCREMENTED_COUNT');
```

### 2. Trace Mode

Enable trace mode to see where state changes originate:

```javascript
const store = createStore([
  devTools({
    trace: true,
    traceLimit: 10  // Number of stack frames
  })
]);
```

### 3. Stack Trace Inspection

When an error occurs, check the stack trace in DevTools:

```javascript
// In Redux DevTools:
// 1. Find the action that caused the error
// 2. Click on "Stack Trace" tab
// 3. See exact file and line number
```

### 4. State Sanitization

Remove sensitive data before sending to DevTools:

```javascript
const store = createStore([
  devTools({
    stateSanitizer: (state) => {
      const { password, token, ...safe } = state;
      return safe;
    }
  })
]);
```

### 5. Batch Updates

Group related state changes:

```javascript
store.startBatch('user-update');
store.set(firstNameAtom, 'Jane');
store.set(lastNameAtom, 'Smith');
store.set(emailAtom, 'jane@example.com');
store.endBatch('user-update');

// DevTools shows single action instead of three
```

## Framework-Specific Debugging

### React

```javascript
import { useAtom } from '@nexus-state/react';

function MyComponent() {
  const [count, setCount] = useAtom(countAtom);
  
  // In DevTools, you'll see:
  // - Component name in stack trace
  // - Action: "set countAtom"
  
  return <button onClick={() => setCount(count + 1)}>+</button>;
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

// DevTools shows Svelte component context
```

## Performance Tips

### Limit History

```javascript
const store = createStore([
  devTools({
    maxAge: 20  // Keep only last 20 states
  })
]);
```

### Disable in Production

```javascript
const store = createStore([
  ...(process.env.NODE_ENV === 'development' 
    ? [devTools({ name: 'My App' })] 
    : [])
]);
```

### Lazy Serialization

For large state trees:

```javascript
const store = createStore([
  devTools({
    latency: 100,  // Debounce updates by 100ms
    stateSanitizer: (state) => {
      // Serialize only changed parts
      return JSON.stringify(state);
    }
  })
]);
```

## Next Steps

- [Enhanced Store Guide](./enhanced-store.md) — Time travel features
- [Performance Guide](../performance/index.md) — Optimize debugging
- [API Reference](../api/devtools.md) — Complete DevTools API
