# Performance Guide

Learn how to optimize your Nexus State applications for maximum performance.

## Metrics and Benchmarks

### Store Creation Time

| Atoms | v0.9.0 | v1.0.0 | Improvement |
| ----- | ------ | ------ | ----------- |
| 10    | 2.1ms  | 1.8ms  | 14% faster  |
| 100   | 12.4ms | 8.7ms  | 30% faster  |
| 1000  | 98.2ms | 65.3ms | 33% faster  |

### Memory Usage

| Scenario            | v0.9.0 | v1.0.0 | Reduction |
| ------------------- | ------ | ------ | --------- |
| 100 atoms + history | 4.2MB  | 2.8MB  | 33% less  |
| DevTools enabled    | +3.1MB | +1.2MB | 61% less  |

### Bundle Size

| Package  | v0.9.0 | v1.0.0 | Change |
| -------- | ------ | ------ | ------ |
| Core     | 4.8KB  | 3.2KB  | -33%   |
| DevTools | 7.2KB  | 4.9KB  | -32%   |
| React    | 2.1KB  | 1.8KB  | -14%   |

*All sizes gzipped, measured with latest optimization features enabled*

## Optimization Techniques

### 1. Batch Updates

Batching multiple state updates into a single transaction can significantly improve performance:

```typescript
// Without batching - Multiple re-renders
store.set(countAtom, 1);
store.set(nameAtom, 'John');
store.set(emailAtom, 'john@example.com');

// With batching - Single re-render
store.batch(() => {
  store.set(countAtom, 1);
  store.set(nameAtom, 'John');
  store.set(emailAtom, 'john@example.com');
});
```

### 2. Use Selectors

Selectors allow you to subscribe to specific parts of state, reducing unnecessary re-renders:

```typescript
// React example
import { useAtomState } from '@nexus-state/react';

// Bad - Component re-renders when any state changes
const Counter = () => {
  const state = useAtom(stateAtom);
  return <div>{state.count}</div>;
};

// Good - Only re-renders when count changes
const Counter = () => {
  const count = useAtomState(stateAtom, (state) => state.count);
  return <div>{count}</div>;
};
```

### 3. Lazy Computed Atoms

Computed atoms are lazily evaluated, so only compute when needed:

```typescript
// Computed atom is only calculated when accessed
const expensiveComputedAtom = atom((get) => {
  const data = get(dataAtom);
  // Expensive calculation
  return data.map(item => expensiveFunction(item));
});
```

### 4. Limit History Size

When using Time Travel, limit the history size to reduce memory usage:

```typescript
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  maxHistory: 50 // Default is 50, adjust based on needs
});
```

### 5. Disable DevTools in Production

DevTools can have a performance impact, so disable it in production:

```typescript
// Development
const store = createEnhancedStore([], {
  enableDevTools: true,
  enableTimeTravel: true
});

// Production
const store = createEnhancedStore([], {
  enableDevTools: false,
  enableTimeTravel: false
});
```

### 6. Use Immer for Complex Updates

For complex state updates, use Immer to avoid expensive object cloning:

```typescript
import { createImmerStore } from '@nexus-state/immer';

const store = createImmerStore({
  users: [],
  settings: { theme: 'light' }
});

// Immer allows mutable-style updates
store.setState((draft) => {
  draft.users.push({ id: 1, name: 'John' });
});
```

## Advanced Optimization

### 1. Memoization

Memoize expensive computations:

```typescript
import { useMemo } from 'react';

const expensiveResult = useMemo(() => {
  return expensiveFunction(expensiveAtom);
}, [expensiveAtom]);
```

### 2. Debouncing Updates

Debounce rapid state updates:

```typescript
import { debounce } from 'lodash';

const debouncedSet = debounce((store, atom, value) => {
  store.set(atom, value);
}, 300);

// Use debounced function
debouncedSet(store, searchAtom, searchValue);
```

### 3. Virtualization for Large Lists

For large lists, use virtualization libraries like `react-window`:

```typescript
import { FixedSizeList } from 'react-window';

const Item = ({ index, style }) => {
  const item = useAtomState(itemsAtom, (items) => items[index]);
  return <div style={style}>{item}</div>;
};

<FixedSizeList
  height={600}
  itemCount={itemCount}
  itemSize={35}
  width={300}
>
  {Item}
</FixedSizeList>
```

## Performance Monitoring

### 1. Track State Updates

Use the action tracker to monitor state updates:

```typescript
import { globalActionTracker } from '@nexus-state/core';

globalActionTracker.enable();
globalActionTracker.on('update', (action) => {
  console.log('State updated:', action);
});
```

### 2. Profile Components

Use React DevTools Profiler to identify performance bottlenecks:

```typescript
import { Profiler } from 'react';

<Profiler id="Counter" onRender={onRenderCallback}>
  <Counter />
</Profiler>
```

### 3. Memory Profiling

Use browser developer tools to profile memory usage:

1. Open Chrome DevTools
2. Go to the Memory tab
3. Take heap snapshots before and after state operations
4. Compare snapshots to identify memory leaks

## Common Performance Issues

### Issue: Too Many Re-renders

**Symptoms:** UI feels sluggish, animations stutter

**Solutions:**
- Use selectors to subscribe to specific state parts
- Batch updates when possible
- Use `React.memo` for components
- Implement proper memoization

### Issue: High Memory Usage

**Symptoms:** Application consumes too much memory, performance degrades over time

**Solutions:**
- Limit Time Travel history size
- Use computed atoms instead of storing derived state
- Clean up unused atoms
- Implement proper garbage collection

### Issue: Slow Initial Load

**Symptoms:** Application takes too long to start

**Solutions:**
- Code-split large stores
- Lazy-load not-essential atoms
- Optimize bundle size
- Use production builds

## Best Practices Summary

1. **Batch Updates**: Use `store.batch()` for multiple state changes
2. **Use Selectors**: Subscribe to specific state parts
3. **Limit History**: Set appropriate `maxHistory` for Time Travel
4. **Disable DevTools in Production**: Turn off DevTools in production builds
5. **Use Immer for Complex State**: Avoid expensive object cloning
6. **Optimize Atoms**: Keep atoms small and focused
7. **Memoize Expensive Computations**: Use computed atoms and useMemo
8. **Monitor Performance**: Use profiling tools to identify bottlenecks

## Next Steps

- [Best Practices Guide](../guides/best-practices.md)
- [Debugging Guide](../guides/debugging.md)
- [Examples](../examples/index.md)
