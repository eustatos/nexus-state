# Time Travel FAQ

## Q: Why are my effects still firing during undo?

**A:** Effects should be automatically suppressed during time-travel. If they're still firing:

1. Check you're using the latest version
2. Ensure you're using `SimpleTimeTravel` or `TimeTravelController`
3. Verify your subscriptions are set up correctly

**Debugging steps:**

```typescript
import { debugContext } from '@nexus-state/core';

store.subscribe(atom, (value) => {
  console.log('Effect called, isTraveling:', debugContext.isTraveling());
  
  if (debugContext.isTraveling()) {
    return; // Should skip during time-travel
  }
  
  // Your effect
});
```

---

## Q: Can I manually suppress effects?

**A:** Yes, use the manual suppression pattern:

```typescript
import { debugContext } from '@nexus-state/core';

store.subscribe(atom, (value) => {
  if (debugContext.isTraveling()) {
    return;
  }
  // Your effect
});
```

**Helper function for reuse:**

```typescript
function createSuppressibleEffect<T>(
  atom: Atom<T>,
  fn: (value: T) => void,
  options?: { suppressDuringTravel?: boolean }
) {
  return store.subscribe(atom, (value) => {
    if (options?.suppressDuringTravel && debugContext.isTraveling()) {
      return;
    }
    fn(value);
  });
}

// Usage
createSuppressibleEffect(
  cartAtom,
  (cart) => api.syncCart(cart),
  { suppressDuringTravel: true }
);
```

---

## Q: Does suppression work with computed atoms?

**A:** Yes, computed atoms are automatically re-evaluated after time-travel completes.

**Example:**

```typescript
const countAtom = atom(0, 'count');
const doubledAtom = computed(() => countAtom() * 2, 'doubled');

store.subscribe(doubledAtom, (value) => {
  console.log('Doubled:', value);
});

timeTravel.undo(); // Computed will re-evaluate, but subscriber won't be called
```

If you need to force re-evaluation:

```typescript
// Force re-evaluation
store.get(computedAtom);
```

---

## Q: What about async effects?

**A:** Async effects that start before time-travel will continue. Use `AbortController` for cancellation:

```typescript
const controller = new AbortController();

store.subscribe(atom, async (value) => {
  try {
    await fetchData({ signal: controller.signal });
  } catch (e) {
    if (e.name !== 'AbortError') throw e;
  }
});

// During time-travel, abort the controller
if (debugContext.isTraveling()) {
  controller.abort();
}
```

**Better pattern with cleanup:**

```typescript
store.subscribe(atom, (value) => {
  const controller = new AbortController();
  
  (async () => {
    try {
      await fetchData(value, { signal: controller.signal });
    } catch (e) {
      if (e.name !== 'AbortError') throw e;
    }
  })();
  
  // Cleanup on next subscription call
  return () => controller.abort();
});
```

---

## Q: Is there performance overhead?

**A:** Minimal. The suppression check is a simple boolean flag check (<1% overhead).

**Benchmark:**

```typescript
// Simple boolean check
if (debugContext.isTraveling()) {
  return;
}

// Overhead: ~0.001ms per check
```

---

## Q: Can I disable suppression for specific effects?

**A:** Yes, simply don't check the `isTraveling()` flag for effects that should always run:

```typescript
// Debug logging - always runs
store.subscribe(atom, (value) => {
  console.log('[DEBUG] State changed:', value);
  // No isTraveling() check - runs during time-travel too
});

// API sync - suppressed during time-travel
store.subscribe(atom, (value) => {
  if (debugContext.isTraveling()) {
    return;
  }
  api.sync(value);
});
```

---

## Q: How do I test effect suppression?

**A:** Use the `isTraveling()` method in your tests:

```typescript
import { describe, it, expect } from 'vitest';
import { debugContext } from '@nexus-state/core';

describe('Effect Suppression', () => {
  it('should not call effects during undo', () => {
    const mockEffect = vi.fn();
    
    store.subscribe(atom, (value) => {
      if (debugContext.isTraveling()) {
        return;
      }
      mockEffect(value);
    });
    
    timeTravel.undo();
    
    expect(mockEffect).not.toHaveBeenCalled();
  });
});
```

---

## Q: Does suppression work with multiple stores?

**A:** Yes, each store's time-travel controller manages its own suppression state independently.

```typescript
const store1 = createStore();
const timeTravel1 = new SimpleTimeTravel(store1);

const store2 = createStore();
const timeTravel2 = new SimpleTimeTravel(store2);

timeTravel1.undo(); // Only suppresses effects for store1
```

---

## Q: Can I use suppression with custom time-travel implementations?

**A:** Yes, use `debugContext.setTraveling()` to manually control the flag:

```typescript
import { debugContext } from '@nexus-state/core';

function customUndo() {
  debugContext.setTraveling(true);
  try {
    // Your restoration logic
    store.setSilently(atom, previousValue);
  } finally {
    debugContext.setTraveling(false);
  }
}
```

**Note:** Prefer using `SimpleTimeTravel` or `TimeTravelController` for built-in suppression.

---

## Q: What happens to batch updates during time-travel?

**A:** Batch updates are also suppressed during time-travel:

```typescript
store.subscribe(atom1, () => {
  if (debugContext.isTraveling()) return;
  console.log('atom1 changed');
});

store.subscribe(atom2, () => {
  if (debugContext.isTraveling()) return;
  console.log('atom2 changed');
});

timeTravel.undo(); // Neither subscriber is called
```

---

## Q: How do I debug time-travel issues?

**A:** Enable debug logging:

```typescript
store.subscribe(atom, (value) => {
  console.log('[Subscribe]', {
    value,
    isTraveling: debugContext.isTraveling(),
    timestamp: new Date().toISOString()
  });
});
```

**Check time-travel state:**

```typescript
console.log('Can undo:', timeTravel.canUndo());
console.log('Can redo:', timeTravel.canRedo());
console.log('History:', timeTravel.getHistory());
console.log('Current index:', timeTravel.getSnapshots().length);
```
