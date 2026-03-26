# Performance Best Practices

Learn how to optimize your Nexus State applications for maximum performance.

## Table of Contents

- [Core Optimization Strategies](#core-optimization-strategies)
- [Batching Updates](#batching-updates)
- [Efficient Subscriptions](#efficient-subscriptions)
- [Computed Atoms Optimization](#computed-atoms-optimization)
- [Memory Management](#memory-management)
- [Time Travel Performance](#time-travel-performance)
- [Common Pitfalls](#common-pitfalls)

---

## Core Optimization Strategies

### 1. Use Selective Subscriptions

Subscribe only to the state you actually need, not the entire store.

```typescript
// ❌ Bad - Component re-renders on any store change
const Component = () => {
  const store = useStore();
  return <div>{store.get(userAtom).name}</div>;
};

// ✅ Good - Component only re-renders when userAtom changes
const Component = () => {
  const [user] = useAtom(userAtom);
  return <div>{user.name}</div>;
};
```

**Why it matters:** Selective subscriptions reduce unnecessary re-renders and improve UI responsiveness.

---

### 2. Minimize Store Creation Overhead

Create stores at the appropriate scope - avoid creating new stores unnecessarily.

```typescript
// ❌ Bad - New store on every render
function Component() {
  const store = createStore();
  return <div>{store.get(countAtom)}</div>;
}

// ✅ Good - Store created once, reused across renders
const store = createStore();
function Component() {
  return <div>{store.get(countAtom)}</div>;
}
```

**Exception:** For SSR, create isolated stores per request (this is the correct pattern):

```typescript
// ✅ SSR - Isolated store per request (correct!)
export async function getServerSideProps(context) {
  const store = createStore();
  store.set(userAtom, await fetchUser(context.params.id));
  return { props: { initialState: store.getState() } };
}
```

---

## Batching Updates

### When to Use Batching

Batch multiple state updates to trigger only a single notification cycle.

```typescript
// ❌ Bad - 3 separate notifications
store.set(a, 1);
store.set(b, 2);
store.set(c, 3);

// ✅ Good - Single notification
batch(() => {
  store.set(a, 1);
  store.set(b, 2);
  store.set(c, 3);
});
```

### Batching in React Components

```typescript
// ❌ Bad - Multiple re-renders
function Form() {
  const [name, setName] = useAtom(nameAtom);
  const [email, setEmail] = useAtom(emailAtom);
  const [age, setAge] = useAtom(ageAtom);

  const handleSubmit = () => {
    setName('John');
    setEmail('john@example.com');
    setAge(30);
  };

  return <button onClick={handleSubmit}>Submit</button>;
}

// ✅ Good - Single re-render
function Form() {
  const store = useStore();

  const handleSubmit = () => {
    batch(() => {
      store.set(nameAtom, 'John');
      store.set(emailAtom, 'john@example.com');
      store.set(ageAtom, 30);
    });
  };

  return <button onClick={handleSubmit}>Submit</button>;
}
```

### Batching Performance Impact

| Scenario | ops/sec | mean (ms) | Improvement |
|----------|---------|-----------|-------------|
| 100 sets without batch | 809 | 1.24 | baseline |
| 100 sets with batch | 755 | 1.32 | single notification |

**Note:** Batching shows minimal improvement for simple sets, but provides significant benefits when subscribers trigger expensive operations (e.g., DOM updates, API calls).

---

## Computed Atoms Optimization

### Limit Dependencies

Keep the number of dependencies per computed atom low.

```typescript
// ❌ Bad - Too many dependencies (39ms latency)
const allDataAtom = atom((get) => {
  const a = get(atomA);
  const b = get(atomB);
  const c = get(atomC);
  const d = get(atomD);
  const e = get(atomE);
  const f = get(atomF);
  const g = get(atomG);
  const h = get(atomH);
  const i = get(atomI);
  const j = get(atomJ);
  return { a, b, c, d, e, f, g, h, i, j };
});

// ✅ Good - Split into smaller computed atoms
const firstHalfAtom = atom((get) => {
  const a = get(atomA);
  const b = get(atomB);
  const c = get(atomC);
  const d = get(atomD);
  const e = get(atomE);
  return { a, b, c, d, e };
});

const secondHalfAtom = atom((get) => {
  const f = get(atomF);
  const g = get(atomG);
  const h = get(atomH);
  const i = get(atomI);
  const j = get(atomJ);
  return { f, g, h, i, j };
});

const allDataAtom = atom((get) => ({
  ...get(firstHalfAtom),
  ...get(secondHalfAtom),
}));
```

**Performance Impact:**

| Dependencies | mean (ms) | p99 (ms) |
|--------------|-----------|----------|
| 1 | 1.75 | 4.63 |
| 5 | 10.17 | 18.88 |
| 10 | 39.42 | 57.28 ⚠️ |

---

### Avoid Deep Computed Chains

While Nexus State handles chains efficiently, very deep chains can accumulate latency.

```typescript
// ⚠️ Acceptable - Chain of 5 (3.94ms)
const a = atom(0);
const b = atom((get) => get(a) + 1);
const c = atom((get) => get(b) + 1);
const d = atom((get) => get(c) + 1);
const e = atom((get) => get(d) + 1);

// ❌ Avoid - Chain of 20+ (78ms+)
// Consider restructuring with fewer intermediate steps
```

---

### Memoize Expensive Calculations

For expensive computations, use manual memoization.

```typescript
// ❌ Bad - Recalculates on every access
const expensiveAtom = atom((get) => {
  const data = get(dataAtom);
  return data.map(item => expensiveCalculation(item));
});

// ✅ Good - Memoized calculation
const expensiveAtom = atom((get) => {
  const data = get(dataAtom);
  const cache = get(expensiveCacheAtom);
  
  const key = JSON.stringify(data);
  if (cache[key]) return cache[key];
  
  const result = data.map(item => expensiveCalculation(item));
  return result;
});
```

---

## Memory Management

### Clean Up Subscriptions

Always unsubscribe when components unmount.

```typescript
// ❌ Bad - Memory leak
useEffect(() => {
  store.subscribe(countAtom, (value) => {
    console.log(value);
  });
}, []);

// ✅ Good - Proper cleanup
useEffect(() => {
  const unsubscribe = store.subscribe(countAtom, (value) => {
    console.log(value);
  });
  return unsubscribe;
}, []);
```

### Limit Time Travel History

Reduce memory usage by limiting history size.

```typescript
// ❌ Bad - Unlimited history (memory leak risk)
const store = createStore({
  enableTimeTravel: true,
});

// ✅ Good - Limited history
const store = createStore({
  enableTimeTravel: true,
  maxHistory: 50, // Adjust based on needs
});
```

### Use Computed Atoms Instead of Derived State

Avoid storing derived state - compute it on demand.

```typescript
// ❌ Bad - Redundant state storage
const itemsAtom = atom([]);
const totalAtom = atom(0); // Manually updated

store.set(itemsAtom, [...items, newItem]);
store.set(totalAtom, total + 1); // Easy to forget!

// ✅ Good - Computed on demand
const itemsAtom = atom([]);
const totalAtom = atom((get) => get(itemsAtom).length);

store.set(itemsAtom, [...items, newItem]);
// totalAtom automatically updates
```

---

## Time Travel Performance

### Capture Strategically

Don't capture state too frequently.

```typescript
// ❌ Bad - Captures on every change
store.subscribe(countAtom, () => {
  controller.capture('count-change');
});

// ✅ Good - Capture at meaningful points
function increment() {
  batch(() => {
    store.set(countAtom, c => c + 1);
    store.set(historyAtom, h => [...h, 'increment']);
  });
  controller.capture('user-action');
}
```

### Use Descriptive Labels

Labels help with debugging and don't impact performance.

```typescript
// ✅ Good - Descriptive labels
controller.capture('user-login');
controller.capture('cart-add-item');
controller.capture('form-submit');
```

---

## Common Pitfalls

### Pitfall 1: Over-Subscription

**Problem:** Subscribing to more state than needed.

```typescript
// ❌ Bad
const Component = () => {
  const [state] = useAtom(largeStateAtom);
  return <div>{state.user.name}</div>; // Only needs user.name
};

// ✅ Good
const Component = () => {
  const [user] = useAtom(userAtom);
  return <div>{user.name}</div>;
};
```

**Solution:** Split large atoms into smaller, focused atoms.

---

### Pitfall 2: Unnecessary Re-renders

**Problem:** State updates trigger re-renders when nothing visible changes.

```typescript
// ❌ Bad - Updates even when value is the same
store.set(countAtom, 5);
store.set(countAtom, 5); // Unnecessary re-render

// ✅ Good - Check before updating
const currentValue = store.get(countAtom);
if (currentValue !== 5) {
  store.set(countAtom, 5);
}
```

**Solution:** Use conditional updates or implement equality checks.

---

### Pitfall 3: Circular Dependencies

**Problem:** Computed atoms that depend on each other.

```typescript
// ❌ Bad - Circular dependency (runtime error)
const atomA = atom((get) => get(atomB));
const atomB = atom((get) => get(atomA));

// ✅ Good - Clear dependency direction
const atomA = atom(0);
const atomB = atom((get) => get(atomA) * 2);
```

**Solution:** Design clear dependency graphs.

---

### Pitfall 4: Missing Batch in Loops

**Problem:** Updating atoms in loops without batching.

```typescript
// ❌ Bad - 1000 separate notifications
for (let i = 0; i < 1000; i++) {
  store.set(itemsAtom, (items) => [...items, i]);
}

// ✅ Good - Single notification
batch(() => {
  for (let i = 0; i < 1000; i++) {
    store.set(itemsAtom, (items) => [...items, i]);
  }
});

// ✅ Even better - Single update
store.set(itemsAtom, (items) => [...items, ...Array.from({ length: 1000 }, (_, i) => i)]);
```

---

### Pitfall 5: Stale Closures in Subscriptions

**Problem:** Subscriptions capture stale values.

```typescript
// ❌ Bad - Stale closure
let count = 0;
store.subscribe(countAtom, () => {
  console.log(count); // Always logs 0
});
store.set(countAtom, 5);

// ✅ Good - Use current value from store
store.subscribe(countAtom, () => {
  const currentCount = store.get(countAtom);
  console.log(currentCount); // Logs current value
});
```

---

### Pitfall 6: Creating Atoms Inside Components

**Problem:** Atoms should be defined once, outside components.

```typescript
// ❌ Bad - New atom on every render
function Component() {
  const countAtom = atom(0); // ⚠️ Creates new atom each render!
  const [count] = useAtom(countAtom);
  return <div>{count}</div>;
}

// ✅ Good - Atom defined once
const countAtom = atom(0);
function Component() {
  const [count] = useAtom(countAtom);
  return <div>{count}</div>;
}
```

---

## Performance Checklist

Before deploying your application:

- [ ] Used selective subscriptions (not entire store)
- [ ] Batched multiple updates in event handlers
- [ ] Limited computed atom dependencies (<5 ideal)
- [ ] Cleaned up subscriptions in useEffect cleanup
- [ ] Limited Time Travel history size
- [ ] Avoided storing derived state (use computed atoms)
- [ ] No atoms created inside components
- [ ] No circular dependencies
- [ ] Used batching in loops
- [ ] Checked for stale closures in subscriptions

---

## Next Steps

- [View detailed benchmarks](./benchmarks.md)
- [Debugging Guide](../guides/debugging.md)
- [API Reference](../api/index.md)
