# Time Travel Example

This example demonstrates Time Travel functionality in Nexus State.

## Basic Time Travel

```interactive
const { atom, createEnhancedStore } = NexusState;

// Create store with time travel enabled
const store = createEnhancedStore([], {
  enableTimeTravel: true
});

// Create counter atom
const counterAtom = atom(0, 'counter');

// Initial value
console.log('Initial value:', store.get(counterAtom)); // 0

// Update value
store.set(counterAtom, 5);
console.log('After set:', store.get(counterAtom)); // 5

// Functional update
store.set(counterAtom, prev => prev + 1);
console.log('After increment:', store.get(counterAtom)); // 6

// Try undo/redo
if (store.undo) {
  store.undo();
  console.log('After undo:', store.get(counterAtom)); // 5
}
```

_Try editing the code above and see the results in the preview!_

## Manual Snapshots

```interactive
const { atom, createEnhancedStore } = NexusState;

// Create store with manual snapshot control
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  autoCapture: false
});

// Create atoms
const countAtom = atom(0, 'count');
const nameAtom = atom('John', 'name');

// Capture snapshots at important points
store.captureSnapshot('Initial State');
store.set(countAtom, 1);
store.set(nameAtom, 'Jane');
store.captureSnapshot('User Updated');

// View history
console.log('History length:', store.getHistory()?.length); // 2

// Try undo
if (store.undo) {
  store.undo();
  console.log('After undo:', store.get(countAtom)); // 1
}
```

## Time Travel with DevTools

```interactive
const { atom, createEnhancedStore } = NexusState;

// Create store with both DevTools and time travel
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  enableDevTools: true
});

// Create multiple atoms
const countAtom = atom(0, 'count');
const nameAtom = atom('John', 'name');
const itemsAtom = atom([], 'items');

// Perform actions
store.set(countAtom, 1);
store.set(nameAtom, 'Jane');
store.set(itemsAtom, ['Item 1', 'Item 2']);
store.captureSnapshot('Form Submitted');

console.log('State at snapshot:', store.getHistory()?.[2]?.state);
```

## Time Travel History Navigation

```interactive
const { atom, createEnhancedStore } = NexusState;

// Create store
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  maxHistory: 5
});

const countAtom = atom(0, 'count');

// Create history
for (let i = 1; i <= 7; i++) {
  store.set(countAtom, i);
  if (i % 2 === 0) {
    store.captureSnapshot(`Even number: ${i}`);
  }
}

// View history
const history = store.getHistory();
console.log('Total snapshots:', history.length); // 4
console.log('Current value:', store.get(countAtom)); // 7

// Navigate history
store.jumpTo(2);
console.log('Jumped to snapshot 2, value:', store.get(countAtom));

// Check navigation availability
console.log('Can undo:', store.canUndo?.()); // true
console.log('Can redo:', store.canRedo?.()); // true
```

## Best Practices

1. **Use Descriptive Snapshot Names**: Name snapshots for important user actions
2. **Limit History Size**: Set appropriate `maxHistory` to balance functionality and memory
3. **Manual Snapshots**: Use manual snapshots for meaningful history points
4. **Production Considerations**: Disable time travel in production for better performance

## Related Documentation

- [Enhanced Store API](../api/enhanced-store.md)
- [Time Travel API Reference](../api/core.md)
- [Debugging with DevTools](../guides/debugging.md)
- [Performance Guide](../performance/index.md)
