# Time Travel API Reference

## SimpleTimeTravel

### `isTraveling(): boolean`

Check if a time-travel operation is currently in progress.

**Returns:** `boolean` - True if undo/redo/jumpTo is executing

**Example:**
```typescript
if (timeTravel.isTraveling()) {
  console.log('Time travel in progress...');
}
```

**Usage:**
```typescript
import { atom, createStore } from '@nexus-state/core';
import { SimpleTimeTravel } from '@nexus-state/time-travel';

const store = createStore();
const countAtom = atom(0, 'count');
const timeTravel = new SimpleTimeTravel(store);

store.set(countAtom, 5);
timeTravel.capture('step-1');

store.set(countAtom, 10);
timeTravel.capture('step-2');

// Check if traveling before undo
console.log(timeTravel.isTraveling()); // false

timeTravel.undo();
console.log(timeTravel.isTraveling()); // false (reset after operation)
```

---

## TimeTravelController

### `getIsTimeTraveling(): boolean`

Internal method to check time-travel state.

**Returns:** `boolean`

**Example:**
```typescript
import { TimeTravelController } from '@nexus-state/time-travel';

const controller = new TimeTravelController(store);

if (controller.getIsTimeTraveling()) {
  // Skip side effects
  return;
}
```

**Note:** This is primarily used internally. Prefer `SimpleTimeTravel.isTraveling()` for public API usage.

---

## Store (Extended)

### `setSilently(atom, update): void`

Set atom value without triggering notifications or effects.

**Parameters:**
- `atom` - The atom to update
- `update` - New value or updater function

**Example:**
```typescript
import { atom, createStore } from '@nexus-state/core';

const store = createStore();
const cartAtom = atom([], 'cart');

// Update without triggering subscribers
store.setSilently(cartAtom, [{ id: 1, name: 'Laptop' }]);

// Or with updater function
store.setSilently(cartAtom, (prev) => [...prev, { id: 2, name: 'Mouse' }]);
```

**Note:** This method is used internally by time-travel. Direct usage is not recommended unless you understand the implications.

**When to use:**
- ✅ Implementing custom time-travel functionality
- ✅ Batch updates without intermediate notifications
- ✅ Initializing state during hydration
- ❌ Regular state updates (use `set()` instead)

---

## DebugContext

### `isTraveling(): boolean`

Check if time-travel is currently in progress.

**Returns:** `boolean`

**Example:**
```typescript
import { debugContext } from '@nexus-state/core';

store.subscribe(cartAtom, (cart) => {
  if (debugContext.isTraveling()) {
    return; // Skip effect during time-travel
  }
  
  api.syncCart(cart);
});
```

---

## Type Definitions

```typescript
interface SimpleTimeTravel {
  isTraveling(): boolean;
  capture(action?: string): void;
  undo(): void;
  redo(): void;
  jumpTo(index: number): void;
  canUndo(): boolean;
  canRedo(): boolean;
  getHistory(): string[];
  getSnapshots(): Snapshot[];
  clearHistory(): void;
}

interface TimeTravelController {
  getIsTimeTraveling(): boolean;
  capture(action?: string): void;
  undo(): void;
  redo(): void;
  jumpTo(index: number): void;
  canUndo(): boolean;
  canRedo(): boolean;
  getHistory(): string[];
  getSnapshots(): Snapshot[];
  clearHistory(): void;
  subscribe(eventType: string, listener: Function): void;
  dispose(): void;
}

interface Store {
  setSilently<T>(atom: Atom<T>, update: T | ((prev: T) => T)): void;
}

interface DebugContext {
  isTraveling(): boolean;
}
```
