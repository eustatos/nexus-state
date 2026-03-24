# Time Travel Suppression Guide

## Problem

Without suppression, time-travel operations trigger all side effects:

```typescript
store.subscribe(cartAtom, (cart) => {
  api.syncCart(cart); // ❌ Called during undo/redo!
  sendNotification('Cart changed'); // ❌ Spam!
});

timeTravel.undo(); // Triggers unwanted effects
```

**Consequences:**
- 📊 Fake analytics events
- 💾 Database pollution with test data
- 📧 Spam notifications to users
- 💰 Financial losses from paid APIs

## Solution: Silent Updates

Nexus State automatically suppresses notifications during time-travel operations using `setSilently()` internally.

```typescript
// Your existing code - works automatically!
store.subscribe(cartAtom, (cart) => {
  api.syncCart(cart); // ✅ Only called on real user actions
});

timeTravel.undo(); // No side effects triggered
```

## How It Works

1. **isTimeTraveling Flag**: Internal flag tracks when undo/redo is in progress
2. **Silent Updates**: `restoreSnapshot()` uses `setSilently()` instead of `set()`
3. **No Notifications**: Subscribers are NOT called during time-travel
4. **Computed Re-evaluation**: Computed atoms are properly re-evaluated after restore

## Manual Suppression Pattern

For custom effect handling, use the manual suppression pattern:

```typescript
import { debugContext } from '@nexus-state/core';

store.subscribe(atom, (value) => {
  // Check if time-traveling
  if (debugContext.isTraveling()) {
    return; // Skip effect
  }

  // Your effect logic
  api.sync(value);
});
```

## Helper Function

Create a reusable wrapper for suppressible effects:

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

## Best Practices

### Always Suppress

- ✅ API calls
- ✅ Database writes
- ✅ Notifications
- ✅ Analytics events
- ✅ localStorage updates

### Never Suppress

- ✅ Debug logging (useful for inspection)
- ✅ UI updates (usually safe)
- ✅ Computed derivations

## Example: E-commerce Cart

```typescript
import { atom, createStore } from '@nexus-state/core';
import { SimpleTimeTravel } from '@nexus-state/time-travel';

const store = createStore();
const cartAtom = atom<any[]>([], 'cart');
const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

// Effect with automatic suppression
store.subscribe(cartAtom, (cart) => {
  // This won't be called during undo/redo
  if (cart.length > 0) {
    console.log(`Syncing ${cart.length} items`);
  }
});

// Capture states
timeTravel.capture('initial');
store.set(cartAtom, [{ id: 1, name: 'Laptop' }]);
timeTravel.capture('add-item');

// Undo - no side effects!
timeTravel.undo();
```

## Troubleshooting

### Effects still firing during undo

**Problem:** Your effects are still being called during time-travel.

**Solution:** Ensure you're using the latest version and check:

1. `setSilently()` is available in your Store
2. TimeTravelController is properly initialized
3. You're not bypassing the time-travel system

### Computed atoms showing stale values

**Problem:** Computed atoms don't update after undo/redo.

**Solution:** This should be handled automatically by `flushComputed()`. If not:

```typescript
// Force re-evaluation
store.get(computedAtom);
```

## Future: Effect API

A dedicated `effect()` API with built-in suppression is planned for a future release.

```typescript
// Future API (not yet available)
effect(() => {
  api.syncCart(cartAtom());
}, {
  suppressDuringTravel: true
});
```
