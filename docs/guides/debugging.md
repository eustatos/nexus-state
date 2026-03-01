# Debugging with DevTools

Learn how to debug your Nexus State applications using the built-in DevTools.

## Enabling DevTools

First, enable DevTools when creating your store:

```typescript
import { createEnhancedStore, devTools } from '@nexus-state/devtools';

const store = createEnhancedStore([devTools({
  name: 'My App',
  trace: true,
  maxAge: 50
})], {
  enableDevTools: true,
  enableTimeTravel: true
});
```

## Using the DevTools Extension

### Installation

Install the Nexus State DevTools browser extension:

- [Chrome Web Store](https://chrome.google.com/webstore/detail/nexus-state-devtools)
- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/nexus-state-devtools/)

### Connecting to DevTools

DevTools should connect automatically when enabled. If not, you can manually connect:

```typescript
store.connectDevTools();
```

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
- See which actions are undoable/redoable

### 4. Performance Monitor

Monitor performance metrics:

- Track update frequency
- Monitor memory usage
- Identify slow updates

## Debugging Common Issues

### Issue: State Not Updating

**Symptoms:** UI doesn't reflect state changes

**Solutions:**
1. Check if the atom is registered (should appear in DevTools)
2. Verify that the store is created with DevTools enabled
3. Check for subscription issues in your framework integration

### Issue: DevTools Not Connecting

**Symptoms:** DevTools extension shows no state

**Solutions:**
1. Ensure DevTools plugin is added to the store
2. Check browser console for errors
3. Verify that DevTools is enabled in store options
4. Make sure you're using the correct DevTools extension

### Issue: Too Many Snapshots

**Symptoms:** DevTools slows down with many snapshots

**Solutions:**
1. Limit `maxHistory` in store options
2. Use manual snapshots for important actions
3. Clear history periodically

## Advanced Debugging Techniques

### 1. Custom Action Names

Give your actions descriptive names for better debugging:

```typescript
store.set(countAtom, 1); // Action: "set countAtom to 1"

// Better
store.captureSnapshot('User Incremented Count');
store.set(countAtom, 1);
```

### 2. Trace Mode

Enable trace mode to see exactly where state changes originate:

```typescript
const store = createEnhancedStore([devTools({
  trace: true
})], {
  enableDevTools: true
});
```

### 3. Action Groups

Group related actions for better organization:

```typescript
import { createActionGrouper } from '@nexus-state/devtools';

const group = createActionGrouper({
  label: 'User Actions',
  match: (action) => action.type?.startsWith('user_')
});

store.addGroup(group);
```

### 4. Custom Snapshots

Create meaningful snapshots at important points:

```typescript
// After important user actions
store.captureSnapshot('Form Submitted');
store.captureSnapshot('User Login');
store.captureSnapshot('Data Fetched');
```

## Framework-Specific Debugging

### React

Use React DevTools alongside Nexus State DevTools:

1. Install React DevTools extension
2. Use React Profiler to identify slow components
3. Check component props for expected state values

### Vue

Use Vue Devtools alongside Nexus State DevTools:

1. Install Vue Devtools extension
2. Check component state in the Vue Devtools inspector
3. Use the performance monitor to identify bottlenecks

### Svelte

Use Svelte Devtools alongside Nexus State DevTools:

1. Install Svelte Devtools extension
2. Check component store bindings
3. Monitor re-render behavior

## Best Practices

### 1. Use Descriptive Names

Give your atoms and actions descriptive names for easier debugging:

```typescript
// Good
const userAtom = atom({ name: '' }, 'user-profile');
store.captureSnapshot('User Updated Profile');
```

### 2. Monitor Performance

Regularly check the performance monitor in DevTools to identify issues early.

### 3. Test Time Travel

Use Time Travel to verify your application's state management:

1. Perform several actions
2. Use undo/redo to verify state changes
3. Check that all state transitions are correct

### 4. Keep History Manageable

Limit history size and use manual snapshots for important actions:

```typescript
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  maxHistory: 50,
  autoCapture: false
});
```

## Troubleshooting

### DevTools Not Showing Any State

1. Check if DevTools plugin is properly configured
2. Verify that DevTools is enabled in store options
3. Check browser console for errors
4. Ensure atoms are being created with the `atom()` function

### DevTools Causes Performance Issues

1. Reduce `maxHistory` size
2. Disable trace mode
3. Use production builds for performance testing
4. Limit the number of atoms in your store

### Time Travel Not Working

1. Ensure `enableTimeTravel` is set to `true`
2. Check that the store is created with DevTools plugin
3. Verify that atoms are registered properly
4. Check for errors in browser console

## Next Steps

- [Best Practices Guide](../guides/best-practices.md)
- [Performance Guide](../performance/index.md)
- [API Reference](../api/)
