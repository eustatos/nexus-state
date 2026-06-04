# Quick Start: Phase 10 - Time Travel Suppression

## 🚀 Getting Started

This phase implements critical effect suppression for time-travel debugging. Follow these steps to contribute:

---

## Step 1: Understand the Problem

**Without suppression:**
```typescript
// User clicks "undo" in DevTools
store.set(cartAtom, []);  // ← Triggers effects:
// ❌ POST /api/cart/clear
// ❌ analytics.track('cart_cleared')
// ❌ showNotification('Корзина пуста')
// ❌ localStorage.setItem('cart', '[]')
```

**With suppression:**
```typescript
// effect with suppression option
effect(() => {
  api.syncCart(cartAtom());
}, { 
  suppressDuringTravel: true,  // ← Won't execute during undo/redo
  type: 'side-effect'
});
```

---

## Step 2: Pick a Task

### For First-Time Contributors
Start with **TT-008 (Demo Example)** or **TT-009 (Documentation)**:
- Lower risk
- Clear acceptance criteria
- Good way to understand the architecture

### For Core Developers
Tackle **TT-001 through TT-005** (Critical P0 tasks):
- Direct impact on core functionality
- Requires understanding of store internals
- Highest priority

---

## Step 3: Run Tests

```bash
# Navigate to project root
cd /path/to/nexus-state

# Run time-travel tests
pnpm test --filter @nexus-state/time-travel

# Run core tests
pnpm test --filter @nexus-state/core

# Check for failing tests (expected before implementation)
pnpm test --filter @nexus-state/time-travel -- time-travel-suppression
```

---

## Step 4: Implementation Order

### Recommended Sequence

1. **TT-001** - Add `isTimeTraveling` flag (foundation)
2. **TT-002** - Implement `setSilently()` (core mechanism)
3. **TT-003** - Create `effect()` function (new API)
4. **TT-004** - Add suppression check (integration)
5. **TT-005** - Update `restoreSnapshot()` (end-to-end)
6. **TT-006** - Async cancellation (advanced)
7. **TT-007** - Write tests (validation)
8. **TT-008** - Create demo (showcase)
9. **TT-009** - Update docs (documentation)

---

## Step 5: Testing Your Changes

### Manual Test Checklist

```typescript
import { atom, createStore, effect } from '@nexus-state/core';
import { SimpleTimeTravel } from '@nexus-state/time-travel';

const store = createStore();
const cartAtom = atom([], 'cart');
let apiCallCount = 0;

// Effect that should be suppressed
effect(() => {
  apiCallCount++;
  console.log('API call:', cartAtom());
}, { 
  suppressDuringTravel: true,
  id: 'cart-sync'
});

const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
timeTravel.capture('initial');

store.set(cartAtom, [1, 2, 3]);
timeTravel.capture('add-items');

// Before fix: apiCallCount would increment
// After fix: apiCallCount stays the same
timeTravel.undo();

console.log('API calls during travel:', apiCallCount);
// Expected: 1 (only from initial set, not from undo)
```

---

## Step 6: Submit Your Work

1. **Run all tests** - Ensure no regressions
2. **Update task file** - Mark as completed with date
3. **Add test coverage** - Minimum 90% for new code
4. **Update INDEX.md** - Change status to ✅ Completed
5. **Create PR** - Link to task file in description

---

## 🆘 Need Help?

- **Task Template:** See [TASK-TEMPLATE.md](../TASK-TEMPLATE.md) for format
- **Examples:** Check [TT-001](./TT-001-isTimeTraveling-flag.md) for reference implementation
- **Questions:** Add comments to the task file or ping phase owner

---

## 📊 Current Status

| Task | Assignee | Status | ETA |
|------|----------|--------|-----|
| TT-001 | - | ⬜ Not Started | - |
| TT-002 | - | ⬜ Not Started | - |
| TT-003 | - | ⬜ Not Started | - |
| TT-004 | - | ⬜ Not Started | - |
| TT-005 | - | ⬜ Not Started | - |
| TT-006 | - | ⬜ Not Started | - |
| TT-007 | - | ⬜ Not Started | - |
| TT-008 | - | ⬜ Not Started | - |
| TT-009 | - | ⬜ Not Started | - |

---

**Last Updated:** 2026-03-24
**Phase Owner:** Open for assignment
