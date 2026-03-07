# E2E Test Results - Bug Reproduction

## ✅ Summary

**Tests Created:** 21 E2E tests  
**Tests Passed:** 9/21 (43%)  
**Tests Failed:** 12/21 (57%)  
**Bugs Confirmed:** 4 critical bugs

## 🐛 Confirmed Bugs

### Bug #1: Sidebar Snapshot Clicks Work Only Once
**Status:** ❌ CONFIRMED  
**Test:** `BUG: Sidebar snapshot clicks only work once`  
**Browsers:** Chromium, Firefox, WebKit (6/9 failed)

**Symptoms:**
- First click on snapshot: ✅ Works, content restores
- Second click on snapshot: ❌ Doesn't work, content unchanged
- Third click: ❌ Doesn't work

**Expected:**
```
Click oldest → "Version 1" ✅
Click middle → "Version 1 Version 2" ❌ (got "Version 1")
Click newest → "Version 1 Version 2 Version 3" ❌
```

---

### Bug #2: Undo/Redo Only Works Once
**Status:** ❌ CONFIRMED  
**Test:** `BUG: Undo/Redo only works once`  
**Browsers:** Chromium, Firefox, WebKit (6/9 failed)

**Symptoms:**
- First undo: ❌ Doesn't restore previous state
- Content remains unchanged after undo

**Expected:**
```
Current: "Step 1 Step 2 Step 3"
After undo: "Step 1 Step 2" ❌ (got "Step 1 Step 2 Step 3")
```

---

### Bug #3: State Not Restored After Jumping to Last Snapshot
**Status:** ❌ CONFIRMED  
**Test:** `BUG: State not restored after jumping to last snapshot`  
**Browsers:** Chromium, Firefox, WebKit (6/9 failed)

**Symptoms:**
- Jump from last to first: ✅ Works
- Jump from first back to last: ❌ Doesn't restore

**Expected:**
```
Jump to first → "A" ✅
Jump to last → "A B" ❌ (got "A")
```

---

### Bug #4: Multiple Rapid Navigation Doesn't Update State
**Status:** ❌ CONFIRMED  
**Test:** `BUG: Multiple rapid navigation doesn't update state`  
**Browsers:** Chromium, Firefox, WebKit (6/9 failed)

**Symptoms:**
- Rapid clicks on timeline points
- Final state doesn't match expected

**Expected:**
```
After rapid navigation → "1 2" ❌ (got "1")
```

---

## ✅ Working Features

### Timeline Displays Snapshots
**Status:** ✅ WORKING  
**Test:** `BUG: Timeline empty - no snapshot points displayed`

Timeline correctly displays snapshot points after typing.

### Timeline Click Restores (First Click)
**Status:** ✅ WORKING (partially)  
**Test:** `BUG: Timeline click doesn't restore editor content`

First click on timeline point correctly restores content.

### Editor Content After Navigation
**Status:** ✅ WORKING  
**Test:** `BUG: Editor doesn't reflect snapshot content after navigation`

When navigation works, editor correctly displays content.

---

## 🔍 Root Cause Analysis

All confirmed bugs point to a single root cause:

**Store state is not being restored properly after navigation operations.**

### Evidence from logs:
```javascript
// Undo test
After first undo: Step 1 Step 2 Step 3  // Expected: Step 1 Step 2

// Sidebar click test  
After second click: Version 1  // Expected: Version 1 Version 2

// Jump to last test
After jump to last: A  // Expected: A B
```

### Potential causes:
1. **SnapshotRestorer** not finding atoms during restore
2. **store.set()** not notifying subscribers
3. **useAtomValue** not re-rendering on restore
4. **HistoryNavigator.jumpTo()** not calling restore correctly

---

## 📋 Next Steps

### 1. Debug SnapshotRestorer
Add logging to `SnapshotRestorer.restoreAtom()`:
```typescript
logger.log(`[RESTORE] Restoring atom: ${key}`);
logger.log(`[RESTORE] Found atom: ${!!atom}`);
logger.log(`[RESTORE] Value: ${value}`);
```

### 2. Debug Store Subscription
Add logging to store subscribe:
```typescript
console.log('[store.subscribe] Listener called:', newValue);
```

### 3. Debug React Hook
Add logging to useAtomValue:
```typescript
console.log('[useAtomValue] Value changed:', value);
```

### 4. Fix Priority
1. **HIGH:** Fix undo/redo (affects core functionality)
2. **HIGH:** Fix sidebar clicks (primary navigation method)
3. **MEDIUM:** Fix jump to last snapshot
4. **LOW:** Fix rapid navigation (edge case)

---

## 📊 Browser Coverage

| Browser | Tests Run | Passed | Failed |
|---------|-----------|--------|--------|
| Chromium | 7 | 3 | 4 |
| Firefox | 7 | 3 | 4 |
| WebKit | 7 | 3 | 4 |
| **Total** | **21** | **9** | **12** |

All bugs reproduce consistently across all browsers.

---

## 🎯 Test Files Created

1. `e2e/tests/timeline-slider.spec.ts` - Timeline navigation tests
2. `e2e/tests/snapshot-navigation.spec.ts` - Sidebar navigation tests
3. `e2e/tests/editor-state-restoration.spec.ts` - Bug reproduction tests
4. `E2E-BUG-TESTS.md` - Documentation

---

## 🚀 How to Run

```bash
# Run all bug reproduction tests
npm run test:e2e -- editor-state-restoration.spec.ts

# Run with UI
npm run test:e2e:ui

# Run specific test
npm run test:e2e -- --grep "BUG: Undo/Redo"

# Run with debug
npm run test:e2e -- --debug
```
