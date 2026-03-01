# Best Practices

Learn the best practices for using Nexus State effectively in your applications.

## General Guidelines

### 1. Use Descriptive Atom Names

Always give your atoms descriptive names for better debugging experience:

```typescript
// Bad
const a = atom(0);

// Good
const countAtom = atom(0, 'counter');
const userAtom = atom({ name: '' }, 'user-profile');
```

### 2. Keep Atoms Small and Focused

Break down complex state into multiple small atoms rather than using large objects:

```typescript
// Bad
const complexState = atom({
  user: { name: '', email: '' },
  settings: { theme: 'light', language: 'en' },
  preferences: { notifications: true }
});

// Good
const userAtom = atom({ name: '', email: '' }, 'user');
const settingsAtom = atom({ theme: 'light', language: 'en' }, 'settings');
const preferencesAtom = atom({ notifications: true }, 'preferences');
```

### 3. Use Computed Atoms for Derived State

Instead of recalculating derived values, use computed atoms:

```typescript
// Bad
const total = computed(() => items.reduce((sum, item) => sum + item.price, 0));

// Good
const totalAtom = atom((get) => {
  const items = get(itemsAtom);
  return items.reduce((sum, item) => sum + item.price, 0);
}, 'total');
```

## Framework-Specific Best Practices

### React

#### 1. Use Hooks Properly

```typescript
// Bad - Unnecessary re-renders
function Counter() {
  const count = useAtom(countAtom);
  return <div>{count}</div>;
}

// Good - Extract only needed values
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

#### 2. Use Selector Pattern for Performance

```typescript
// Bad - Component re-renders on any state change
function CounterDisplay() {
  const state = useAtom(stateAtom);
  return <div>{state.count}</div>;
}

// Good - Only re-renders when count changes
function CounterDisplay() {
  const count = useAtomState(stateAtom, (state) => state.count);
  return <div>{count}</div>;
}
```

### Vue

#### 1. Use Composition API

```typescript
// Bad - Options API
export default {
  setup() {
    const count = useAtom(countAtom);
    return { count };
  }
};

// Good - Composition API with reactive
import { computed } from 'vue';

export default {
  setup() {
    const count = useAtom(countAtom);
    const doubled = computed(() => count.value * 2);
    return { count, doubled };
  }
};
```

### Svelte

#### 1. Use Svelte's Reactive Declarations

```typescript
// Good - Leverage Svelte's reactivity
<script>
  import { useAtom } from '@nexus-state/svelte';
  import { countAtom } from './store';

  let count = useAtom(countAtom);
  $: doubled = count * 2;
</script>

<p>Count: {count}</p>
<p>Doubled: {doubled}</p>
```

## Time Travel Best Practices

### 1. Use Descriptive Snapshot Names

```typescript
// Good
store.captureSnapshot('Form Submission');
store.captureSnapshot('User Login');
store.captureSnapshot('Data Fetched');
```

### 2. Limit History Size

```typescript
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  maxHistory: 50 // Adjust based on your needs
});
```

### 3. Use Manual Snapshots for Important Actions

```typescript
// Bad - Every action creates a snapshot
const store = createEnhancedStore([], { autoCapture: true });

// Good - Control snapshots for meaningful history points
const store = createEnhancedStore([], {
  enableTimeTravel: true,
  autoCapture: false
});

store.set(countAtom, 5);
store.captureSnapshot('User Adjusted Count');
```

## Performance Optimization

### 1. Batch Updates

```typescript
// Bad - Multiple updates cause multiple re-renders
store.set(countAtom, 1);
store.set(nameAtom, 'John');
store.set(emailAtom, 'john@example.com');

// Good - Batch updates
store.batch(() => {
  store.set(countAtom, 1);
  store.set(nameAtom, 'John');
  store.set(emailAtom, 'john@example.com');
});
```

### 2. Use Selectors in Framework Integrations

```typescript
// React example
const count = useAtomState(countAtom, (state) => state.count);
```

### 3. Avoid Unnecessary Computations

```typescript
// Bad - Expensive computation in computed atom
const expensiveAtom = atom((get) => {
  const data = get(dataAtom);
  return expensiveFunction(data); // Runs on every access
});

// Good - Use derived state with caching
const derivedAtom = atom((get) => {
  const data = get(dataAtom);
  return processDerivedData(data); // Cached result
});
```

## Testing Best Practices

### 1. Test Atoms in Isolation

```typescript
// Example.test.ts
import { atom } from '@nexus-state/core';
import { createEnhancedStore } from '@nexus-state/core';

describe('Counter Atom', () => {
  it('should increment correctly', () => {
    const countAtom = atom(0, 'count');
    const store = createEnhancedStore();

    expect(store.get(countAtom)).toBe(0);
    store.set(countAtom, 1);
    expect(store.get(countAtom)).toBe(1);
  });
});
```

### 2. Test Time Travel Functionality

```typescript
it('should support undo/redo', () => {
  const countAtom = atom(0, 'count');
  const store = createEnhancedStore([], { enableTimeTravel: true });

  store.set(countAtom, 1);
  store.set(countAtom, 2);

  expect(store.get(countAtom)).toBe(2);

  store.undo();
  expect(store.get(countAtom)).toBe(1);

  store.redo();
  expect(store.get(countAtom)).toBe(2);
});
```

## Common Pitfalls

### 1. Overusing Global State

Don't put everything in global state. Consider local state for UI-only data.

### 2. Large Atoms

Avoid large, complex atoms. Break them down into smaller, focused atoms.

### 3. Ignoring Performance

Use selectors, batching, and computed atoms wisely to maintain performance.

### 4. Not Using Names

Always name your atoms for better debugging experience.

## Next Steps

- [Performance Guide](../performance/index.md)
- [Debugging Guide](../guides/debugging.md)
- [Examples](../examples/index.md)
