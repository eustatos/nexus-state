# TT-009: Update Documentation

## 🎯 Task Overview

**Priority:** 🟢 MEDIUM (P2)  
**Estimated Time:** 2-3 hours  
**Status:** ⬜ Not Started  
**Assignee:** Unassigned

---

## 📋 Description

Обновить документацию проекта, включив новую effect suppression функциональность, API reference, usage examples, и migration guide для существующих пользователей.

---

## 🎯 Acceptance Criteria

- [ ] API reference для time-travel suppression
- [ ] Guide для time-travel suppression
- [ ] FAQ section для common issues
- [ ] Обновлённый README с новой функциональностью
- [ ] TypeScript типы задокументированы

---

## 📝 Documentation Structure

### 1. User Guide

**File:** `docs/guides/time-travel-suppression.md`

```markdown
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
```

---

### 2. API Reference

**File:** `docs/api/time-travel.md` (update existing)

```markdown
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

## TimeTravelController

### `getIsTimeTraveling(): boolean`

Internal method to check time-travel state.

**Returns:** `boolean`

## Store (Extended)

### `setSilently(atom, update): void`

Set atom value without triggering notifications or effects.

**Parameters:**
- `atom` - The atom to update
- `update` - New value or updater function

**Example:**
```typescript
store.setSilently(cartAtom, []);
```

**Note:** This method is used internally by time-travel. Direct usage is not recommended unless you understand the implications.
```

---

### 3. FAQ

**File:** `docs/faq/time-travel.md` (update existing)

```markdown
# Time Travel FAQ

## Q: Why are my effects still firing during undo?

**A:** Effects should be automatically suppressed during time-travel. If they're still firing:

1. Check you're using the latest version
2. Ensure you're using `SimpleTimeTravel` or `TimeTravelController`
3. Verify your subscriptions are set up correctly

## Q: Can I manually suppress effects?

**A:** Yes, use the manual suppression pattern:

```typescript
store.subscribe(atom, (value) => {
  if (debugContext.isTraveling()) {
    return;
  }
  // Your effect
});
```

## Q: Does suppression work with computed atoms?

**A:** Yes, computed atoms are automatically re-evaluated after time-travel completes.

## Q: What about async effects?

**A:** Async effects that start before time-travel will continue. Use AbortController for cancellation:

```typescript
const controller = new AbortController();
store.subscribe(atom, async (value) => {
  try {
    await fetchData({ signal: controller.signal });
  } catch (e) {
    if (e.name !== 'AbortError') throw e;
  }
});
```

## Q: Is there performance overhead?

**A:** Minimal. The suppression check is a simple boolean flag check (<1% overhead).
```

---

## 🔗 Dependencies

- **Зависит от:**
  - TT-001 (isTimeTraveling flag)
  - TT-005 (restoreSnapshot with setSilently)
  - TT-007 (test suite for accurate docs)

---

## 📚 Files to Create/Update

1. `docs/guides/time-travel-suppression.md` - User guide
2. `docs/api/time-travel.md` - Update API reference
3. `docs/faq/time-travel.md` - Update FAQ
4. `packages/time-travel/README.md` - Update package README
5. `planning/phase-10-time-travel-suppression/README.md` - Update phase docs

---

## ✅ Verification Checklist

- [ ] Все документ файлы созданы/обновлены
- [ ] Код примеры точные и протестированы
- [ ] Ссылки между документами работают
- [ ] README файлы обновлены
- [ ] TypeScript типы задокументированы
- [ ] FAQ покрывает common issues

---

## 📝 Notes

- Использовать существующую документацию как основу
- Добавить ссылки на Phase 11 для setSilently()
- Включить troubleshooting section
- Рассмотреть возможность добавления video demo

---

**Created:** 2026-03-24  
**Last Updated:** 2026-03-24 (Revised v2)  
**Task Owner:** Unassigned  
**Related Issue:** Time Travel Suppression Analysis
