# Writable Atoms Guide

## Overview

Writable atoms in Nexus State allow custom write logic through the `atom(read, write)` API. However, the current implementation has **important limitations** that developers must understand.

## ⚠️ Current Limitations

### 1. No Self-Referential `set()` Calls

**Problem:** Calling `set(atom, value)` on the same atom within its write function causes a stack overflow.

```typescript
// ❌ DOES NOT WORK - Stack Overflow
const counterAtom = atom(
  () => count,
  (get, set, action) => {
    if (action === 'inc') {
      set(counterAtom, get(counterAtom) + 1); // ❌ Recursive call!
    }
  }
);
```

**Why:** The `createSetter` function is called recursively, creating infinite loop:
```
set() → createSetter() → write() → set() → createSetter() → ...
```

---

### 2. No Recursive Updates

**Problem:** Any pattern that causes the write function to call itself will fail.

```typescript
// ❌ DOES NOT WORK
const effectAtom = atom(
  () => value,
  (get, set, v) => {
    logEffect(v);
    set(effectAtom, v); // ❌ Recursive!
  }
);
```

---

### 3. No Mutual Atom Updates (without care)

**Problem:** Two atoms updating each other can cause infinite loops.

```typescript
// ⚠️ DANGEROUS - May cause infinite loop
const atom1 = atom(
  () => v1,
  (get, set, v) => { v1 = v; set(atom2, v * 2); }
);
const atom2 = atom(
  () => v2,
  (get, set, v) => { v2 = v; set(atom1, v / 2); } // ⚠️ Feedback loop!
);
```

---

## ✅ Workarounds

### Workaround 1: External State

Store state outside the atom and update it directly:

```typescript
// ✅ WORKS
let count = 0;
const counterAtom = atom(
  () => count,
  (get, set, action) => {
    if (action === 'inc') {
      count = count + 1; // ✅ Direct assignment
    }
  }
);
```

### Workaround 2: Closure Variables

Use closure to maintain private state:

```typescript
// ✅ WORKS
function createValidatedCounter(initial: number) {
  let value = initial;
  
  return atom(
    () => value,
    (get, set, newValue) => {
      if (newValue >= 0) {
        value = newValue; // ✅ Direct assignment
      }
      // Invalid values silently ignored
    }
  );
}
```

### Workaround 3: Computed + Writable Pair

Separate read (computed) and write (writable) concerns:

```typescript
// ✅ WORKS
const rawAtom = atom(0);
const validatedAtom = atom(
  (get) => validate(get(rawAtom)),  // Computed read
  (get, set, v) => {
    if (isValid(v)) {
      set(rawAtom, v);  // ✅ Write to different atom
    }
  }
);
```

### Workaround 4: External State Manager

Use a class or module to manage state:

```typescript
// ✅ WORKS
class StateManager {
  private state = new Map<string, any>();
  
  get(key: string) { return this.state.get(key); }
  set(key: string, value: any) { this.state.set(key, value); }
}

const manager = new StateManager();
const stateAtom = atom(
  () => manager.get('value'),
  (get, set, v) => manager.set('value', v)
);
```

---

## 📦 Helper Functions

Use the provided helper functions for common patterns:

### Counter

```typescript
import { createCounter } from './writable-helpers';

const counter = createCounter({ initial: 0, step: 1, min: 0, max: 100 });

store.set(counter, 'increment');  // +1
store.set(counter, 'decrement');  // -1
store.set(counter, 'reset');      // to initial
store.set(counter, { type: 'set', value: 50 });  // specific value
```

### Validated Value

```typescript
import { createValidatedAtom } from './writable-helpers';

const emailAtom = createValidatedAtom({
  initial: '',
  validator: (v) => {
    if (!v.includes('@')) {
      return { isValid: false, error: 'Invalid email', value: '' };
    }
    return { isValid: true, value: v };
  }
});

store.set(emailAtom, 'invalid');     // Silently ignored
store.set(emailAtom, 'test@a.com');  // Accepted
```

### Toggle

```typescript
import { createToggle } from './writable-helpers';

const toggle = createToggle({ initial: false });

store.set(toggle, true);     // Set to true
store.set(toggle, false);    // Set to false
store.set(toggle, 'toggle'); // Toggle current value
```

### History/Undo

```typescript
import { createHistoryAtom } from './writable-helpers';

const historyAtom = createHistoryAtom({
  initial: '',
  maxHistory: 10
});

store.set(historyAtom, { type: 'set', value: 'first' });
store.set(historyAtom, { type: 'set', value: 'second' });
store.set(historyAtom, { type: 'undo' });  // Back to 'first'
store.set(historyAtom, { type: 'redo' });  // Forward to 'second'
```

### Transformed (Bidirectional)

```typescript
import { createTransformedWritableAtom } from './writable-helpers';

const { source, transformed } = createTransformedWritableAtom({
  initial: 0,  // Celsius
  transform: (c) => c * 9/5 + 32,    // C → F
  inverse: (f) => (f - 32) * 5/9     // F → C
});

store.get(transformed);  // 32 (Fahrenheit)
store.set(transformed, 212);  // Sets source to 100 (Celsius)
```

### Synced Atoms

```typescript
import { createSyncedAtoms } from './writable-helpers';

const { master, slaves, setAll } = createSyncedAtoms({
  initial: 0,
  slaveCount: 3
});

setAll(store, 10);  // Sets master and all slaves to 10
```

---

## 📋 Best Practices

### DO ✅

1. **Use external state for self-updates**
   ```typescript
   let value = initial;
   const atom = atom(() => value, () => { value = newValue; });
   ```

2. **Use helpers for common patterns**
   ```typescript
   const counter = createCounter({ initial: 0 });
   ```

3. **Separate read and write concerns**
   ```typescript
   const raw = atom(0);
   const computed = atom((get) => transform(get(raw)));
   ```

4. **Use computed atoms for derived values**
   ```typescript
   const total = atom((get) => get(price) * get(quantity));
   ```

### DON'T ❌

1. **Don't call set() on the same atom**
   ```typescript
   // ❌ WRONG
   (get, set, v) => set(sameAtom, v)
   ```

2. **Don't create circular dependencies**
   ```typescript
   // ❌ WRONG
   atom1 → set(atom2) → set(atom1)
   ```

3. **Don't use writable for pure transformations**
   ```typescript
   // ❌ WRONG - use computed instead
   const doubled = atom(
     (get) => get(base) * 2,
     (get, set, v) => set(doubled, v)
   );
   
   // ✅ RIGHT
   const doubled = atom((get) => get(base) * 2);
   ```

---

## 🔧 Future Improvements

Potential enhancements for future versions:

1. **Internal setter** - Allow `set(self, value)` without recursion
2. **Batch updates** - Queue updates to avoid immediate recursion
3. **Warning system** - Detect and warn about potential infinite loops
4. **Transaction support** - Atomic updates across multiple atoms

---

## 📚 Related

- [`writable-helpers.ts`](./writable-helpers.ts) - Helper functions
- [`test-utils/index.ts`](../test-utils/index.ts) - Test utilities
- [Atom Types](../types.ts) - Type definitions
