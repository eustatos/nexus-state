# STAB-007-FIX: Fix Time Travel Undo/Redo Logic

## 📋 Task Overview

**Priority:** 🔴 CRITICAL  
**Estimated Time:** 2-3 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  
**Created:** 2026-02-24

---

## 🎯 Objective

Fix the critical logic errors in `HistoryManager` and/or `SnapshotRestorer` that cause undo/redo operations to fail in certain scenarios.

---

## 🚨 Problem Statement

**3 critical tests failing in `simple-time-travel.undo-redo.test.ts`:**

1. **should handle multiple undos**
   - Expected: After 3 undos, counter should be 2
   - Actual: counter is 3
   - **Root Cause:** `undo()` not correctly restoring previous state

2. **should redo after undo**
   - Expected: After undo, counter should be 0
   - Actual: counter is 5
   - **Root Cause:** `undo()` not restoring the snapshot properly

3. **should handle multiple redos**
   - Expected: After 2 undos and 1 redo, counter should be 1
   - Actual: counter is 3
   - **Root Cause:** `redo()` not restoring the correct future state

---

## 🔍 Root Cause Analysis

### Current Behavior

**Scenario:** Set counter to 1, 2, 3, then undo

```
Initial state: counter = 0
After set(1): counter = 1  → Capture snap1
After set(2): counter = 2  → Capture snap2
After set(3): counter = 3  → Capture snap3

History structure:
  past:    [snap1, snap2]
  current: snap3
  future:  []

After undo():
  past:    [snap1]
  current: snap2  ← This should restore counter to 2
  future:  [snap3]

Actual: counter = 3 (NOT RESTORED!)
Expected: counter = 2
```

### Hypothesis

**Problem 1:** `SnapshotRestorer.restore()` не вызывается правильно, или
**Problem 2:** `SnapshotRestorer.restore()` вызывается, но не находит атом для восстановления, или
**Problem 3:** `SnapshotRestorer.restore()` восстанавливает неправильное значение

### Debugging Steps

1. **Check if `restore()` is called:**
   - Add console.log in `HistoryNavigator.undo()`
   - Verify that `snapshot` is not null
   - Verify that `restore(snapshot)` is called

2. **Check if `restoreAtom()` finds the atom:**
   - Add console.log in `SnapshotRestorer.restoreAtom()`
   - Verify that `findAtomByName()` returns the correct atom
   - Verify that `store.set(atom, value)` is called

3. **Check if `store.set()` is wrapped:**
   - Verify that `wrappedSet` doesn't interfere during time travel
   - Check that `isTimeTraveling` flag prevents auto-capture during restore

---

## 🛠️ Proposed Solutions

### Solution A: Add Debug Logging

Add temporary debug logging to trace the issue:

**File:** `packages/core/src/time-travel/core/HistoryNavigator.ts`

```typescript
undo(): boolean {
  if (!this.historyManager.canUndo()) return false;

  const snapshot = this.historyManager.undo();
  console.log('[UNDO] Snapshot to restore:', snapshot?.id, 'action:', snapshot?.metadata.action);
  
  if (snapshot) {
    console.log('[UNDO] Snapshot state:', JSON.stringify(snapshot.state, null, 2));
    this.snapshotRestorer.restore(snapshot);
    console.log('[UNDO] Restore completed');
    return true;
  }
  return false;
}
```

**File:** `packages/core/src/time-travel/snapshot/SnapshotRestorer.ts`

```typescript
private restoreAtom(key: string, entry: SnapshotStateEntry): boolean {
  console.log('[RESTORE] Restoring atom:', key, 'value:', entry.value);
  
  // Try to find atom by ID first
  let atom = entry.atomId ? this.findAtomById(entry.atomId) : null;
  console.log('[RESTORE] Found by ID:', !!atom);

  // Then try by name
  if (!atom) {
    atom = this.findAtomByName(entry.name || key);
    console.log('[RESTORE] Found by name:', !!atom, 'name:', entry.name || key);
  }

  if (!atom) {
    if (this.config.onAtomNotFound === "throw") {
      throw new Error(`Atom not found: ${key}`);
    }
    if (this.config.onAtomNotFound === "warn") {
      console.warn(`Atom not found: ${key}`);
    }
    return false;
  }

  // Deserialize value if needed
  const value = this.deserializeValue(entry.value, entry.type);
  console.log('[RESTORE] Setting atom to:', value);

  // Set the value
  this.store.set(atom, value);
  console.log('[RESTORE] Atom set complete');
  return true;
}
```

### Solution B: Fix `findAtomById` Symbol Conversion

The problem might be in how `atomId` is stored and retrieved:

**Current code in `SnapshotCreator`:**
```typescript
atomId: atom.id.toString(),  // ← Symbol.toString() = "Symbol(atom)"
```

**Current code in `SnapshotRestorer`:**
```typescript
private findAtomById(atomId: string): Atom<unknown> | null {
  const id = Symbol(atomId);  // ← Symbol("Symbol(atom)") ≠ original Symbol
  return atomRegistry.get(id) as Atom<unknown> | null;
}
```

**Problem:** `Symbol(atomId)` creates a NEW symbol, not the original one!

**Fix:** Don't rely on `atomId`, use `name` instead:

```typescript
private findAtomById(atomId: string): Atom<unknown> | null {
  // Symbol conversion doesn't work - symbols are unique
  // We need to use the name instead
  return null; // Force fallback to findAtomByName
}
```

Or better: **Don't store `atomId` at all**, only store `name`:

```typescript
// In SnapshotCreator.addAtomToState
state[atomName] = {
  value: this.serializeValue(value),
  type: atomType,
  name: atomName,
  // Remove: atomId: atom.id.toString(),
};
```

### Solution C: Check `isTimeTraveling` Flag

Verify that `wrappedSet` properly checks `isTimeTraveling`:

**Current code:**
```typescript
private wrappedSet<Value>(
  atom: Atom<Value>,
  update: Value | ((prev: Value) => Value),
): void {
  // ... tracking code ...

  // Call original set
  this.originalSet(atom, update);  // ← This calls the REAL store.set

  // ... change tracking ...

  // Auto-capture if enabled and not during time travel
  if (this.autoCapture && !this.isTimeTraveling) {  // ← Check flag
    this.capture(`set ${atom.name || atom.id?.description || "atom"}`);
  }
}
```

**Problem:** When `restore()` calls `this.store.set()`, it might call `wrappedSet` instead of `originalSet`!

**Check:** In `SnapshotRestorer`, does `this.store.set` call the wrapped version or original?

```typescript
// In SnapshotRestorer.restoreAtom
this.store.set(atom, value);  // ← This calls WRAPPED set!
```

**But** `SimpleTimeTravel.undo()` sets `isTimeTraveling = true`, so `wrappedSet` should NOT capture.

Let's verify the flow:
1. User calls `timeTravel.undo()`
2. `SimpleTimeTravel.undo()` sets `isTimeTraveling = true`
3. `historyNavigator.undo()` is called
4. `historyManager.undo()` returns previous snapshot
5. `snapshotRestorer.restore(snapshot)` is called
6. `restoreAtom()` calls `this.store.set(atom, value)`
7. `store.set` → `wrappedSet` is called
8. `wrappedSet` checks `isTimeTraveling` → `true`, so no capture
9. `wrappedSet` calls `this.originalSet(atom, update)`
10. State is updated

This SHOULD work! But the test shows it doesn't.

### Solution D: Use Original Set in Restorer

**Problem:** `SnapshotRestorer` uses `this.store.set()`, which might be wrapped.

**Fix:** Pass `originalSet` to `SnapshotRestorer`:

```typescript
// In SimpleTimeTravel constructor
this.snapshotRestorer = new SnapshotRestorer(store, {
  validateBeforeRestore: true,
  strictMode: false,
  onAtomNotFound: "warn",
  batchRestore: true,
  setFunction: this.originalSet,  // ← Pass original set
  ...options.restoreConfig,
} as SnapshotRestorerConfig);
```

Then use it in `restoreAtom`:
```typescript
private restoreAtom(key: string, entry: SnapshotStateEntry): boolean {
  // ... find atom ...
  
  // Use original set to avoid wrapping
  if (this.config.setFunction) {
    this.config.setFunction(atom, value);
  } else {
    this.store.set(atom, value);
  }
  return true;
}
```

---

## 📝 Implementation Steps

### Step 1: Add Debug Logging

Add temporary logging to understand the flow:

```bash
# Edit HistoryNavigator.ts
# Edit SnapshotRestorer.ts
# Add console.log statements as shown above
```

### Step 2: Run Tests and Analyze Output

```bash
cd packages/core
npm run test -- src/time-travel/__tests__/simple-time-travel.undo-redo.test.ts

# Look for:
# - Is restore() called?
# - Is atom found?
# - Is store.set() called?
# - What value is being set?
```

### Step 3: Identify Root Cause

Based on debug output, identify which hypothesis is correct:
- A: restore() not called
- B: atom not found
- C: wrong value restored
- D: wrapped set interfering

### Step 4: Apply Fix

Based on root cause, apply appropriate fix:
- If atom not found → Fix `findAtomByName` or symbol handling
- If wrapped set interfering → Pass `originalSet` to restorer
- If wrong value → Check snapshot creation logic

### Step 5: Remove Debug Logging

Clean up console.log statements after fix is confirmed.

### Step 6: Verify All Tests Pass

```bash
cd packages/core
npm run test
```

---

## 🧪 Test Verification

After fix, these tests should pass:

```bash
# Should pass after fix:
✓ should handle multiple undos
✓ should redo after undo  
✓ should handle multiple redos

# Should still pass:
✓ should undo to previous state
✓ should return false when no undo available
✓ should move current snapshot to future after undo
✓ should return false when no redo available
```

---

## 📊 Expected Behavior

### Multiple Undos Flow

```
Setup:
  Initial: counter = 0, capture "initial"
  Set to 1, capture "set counter" (snap1)
  Set to 2, capture "set counter" (snap2)  
  Set to 3, capture "set counter" (snap3)

History after setup:
  past:    [initial, snap1, snap2]
  current: snap3
  future:  []

After 1st undo:
  past:    [initial, snap1]
  current: snap2
  future:  [snap3]
  counter: 2 ✓

After 2nd undo:
  past:    [initial]
  current: snap1
  future:  [snap2, snap3]
  counter: 1 ✓

After 3rd undo:
  past:    []
  current: initial
  future:  [snap1, snap2, snap3]
  counter: 0 ✓
```

### Redo After Undo Flow

```
Setup:
  Initial: counter = 0, capture "initial"
  Set to 5, capture "set counter"

History after setup:
  past:    [initial]
  current: snap(5)
  future:  []

After undo:
  past:    []
  current: initial
  future:  [snap(5)]
  counter: 0 ✓

After redo:
  past:    [initial]
  current: snap(5)
  future:  []
  counter: 5 ✓
```

---

## 🔗 Related Issues

- Tests migrated from `setTimeout` to `waitForAutoCapture()` ✅
- `clearHistory()` behavior changed to not auto-capture ✅
- Constructor tests updated ✅

---

## ✅ Acceptance Criteria

- [ ] All 7 tests in `simple-time-travel.undo-redo.test.ts` pass
- [ ] No debug logging left in production code
- [ ] Time travel logic is correct and deterministic
- [ ] Documentation updated if behavior changed

---

## 📝 Implementation Checklist

```bash
# 1. Add debug logging
# Edit HistoryNavigator.ts and SnapshotRestorer.ts

# 2. Run failing test with debug output
cd packages/core
npm run test -- src/time-travel/__tests__/simple-time-travel.undo-redo.test.ts

# 3. Analyze debug output and identify root cause

# 4. Apply fix based on root cause

# 5. Verify tests pass
npm run test -- src/time-travel/__tests__/simple-time-travel.undo-redo.test.ts

# 6. Remove debug logging

# 7. Run full test suite
npm run test

# 8. Commit changes
git add packages/core/src/time-travel/
git commit -m "fix(time-travel): correct undo/redo logic in HistoryManager

- Fix undo() to properly restore previous state
- Fix redo() to restore correct future state
- Add proper atom lookup in SnapshotRestorer
- Ensure wrappedSet respects isTimeTraveling flag

Fixes 3 failing tests in simple-time-travel.undo-redo.test.ts

Generated with [Continue](https://continue.dev)
Co-Authored-By: Continue <noreply@continue.dev>"
```

---

## 📚 Context & Background

### History Manager State Machine

```
States: [past] ← current → [future]

add(snapshot):
  past.push(current)
  current = snapshot
  future.clear()

undo():
  future.unshift(current)
  current = past.pop()
  
redo():
  past.push(current)
  current = future.shift()
```

### Snapshot Restorer Flow

```
restore(snapshot) →
  for each (key, entry) in snapshot.state:
    atom = findAtomByName(entry.name || key)
    value = deserializeValue(entry.value)
    store.set(atom, value)
```

### Critical Points to Check

1. **Atom Registration:**
   - Are atoms registered with correct names?
   - Does `atomRegistry.getByName(name)` find the atom?

2. **Symbol Handling:**
   - `atom.id.toString()` → "Symbol(atom)"
   - `Symbol("Symbol(atom)")` ≠ original symbol
   - Solution: Use name-based lookup ONLY

3. **Wrapped Set:**
   - Does `isTimeTraveling` flag work correctly?
   - Is `originalSet` used during restore?

4. **Snapshot State Keys:**
   - What keys are used in `snapshot.state`?
   - Are they matching `atomRegistry` names?

---

## 🔬 Diagnostic Commands

```bash
# Run single failing test with verbose output
cd packages/core
npm run test -- src/time-travel/__tests__/simple-time-travel.undo-redo.test.ts --reporter=verbose

# Run with grep to filter output
npm run test -- src/time-travel/__tests__/simple-time-travel.undo-redo.test.ts 2>&1 | grep -E "(UNDO|RESTORE|Setting atom)"

# Check if atoms are registered
npm run test -- src/atom-registry.test.ts
```

---

## 💡 Quick Debug Test

Create a minimal test case to isolate the issue:

**File:** `packages/core/src/time-travel/__tests__/debug-undo-minimal.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { createStore, atom } from "../../";
import { SimpleTimeTravel } from "../";

describe("Debug Minimal Undo", () => {
  it("should restore previous value after undo", () => {
    const store = createStore();
    const counter = atom(0, "counter");
    
    // Initialize
    store.set(counter, 0);
    
    const timeTravel = new SimpleTimeTravel(store, {
      autoCapture: false,
      atoms: [counter]
    });
    
    // Capture initial state
    timeTravel.capture("initial");
    console.log("After initial capture:", timeTravel.getHistory().length);
    
    // Update value
    store.set(counter, 5);
    timeTravel.capture("after set");
    console.log("After set capture:", timeTravel.getHistory().length);
    console.log("Current value:", store.get(counter));
    
    // Undo
    const undoResult = timeTravel.undo();
    console.log("Undo result:", undoResult);
    console.log("Value after undo:", store.get(counter));
    
    expect(undoResult).toBe(true);
    expect(store.get(counter)).toBe(0);
  });
});
```

Run this minimal test:
```bash
npm run test -- src/time-travel/__tests__/debug-undo-minimal.test.ts
```

If this fails, the problem is fundamental. If it passes, the problem is in the `waitForAutoCapture` logic.

---

## 🎯 Success Criteria

- [ ] Minimal debug test passes
- [ ] All 7 undo/redo tests pass
- [ ] No console warnings about missing atoms
- [ ] Time travel operations are deterministic
- [ ] Documentation explains the fix

---

**Created:** 2026-02-24  
**Estimated Completion:** 2026-02-24  
**Blocker For:** STAB-008, STAB-009, STAB-010, Phase 01
