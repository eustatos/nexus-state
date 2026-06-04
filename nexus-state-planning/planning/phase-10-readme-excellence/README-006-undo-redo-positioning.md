# README-006: Undo-Redo vs Time-Travel Positioning

**Status:** ⬜ Not Started  
**Priority:** 🟡 High  
**Estimated Time:** 1.5 hours  
**Packages:** `@nexus-state/undo-redo`, `@nexus-state/time-travel`, `@nexus-state/core`

---

## 📋 Objective

1. **Clarify positioning** between `@nexus-state/undo-redo` and `@nexus-state/time-travel`
2. **Update core README** with clear comparison table
3. **Optimize undo-redo README** for user-facing use cases
4. **Reduce confusion** about which package to choose

---

## 🔍 Problem Analysis

### Current State

| Issue | Location | Impact |
|-------|----------|--------|
| **Unclear differentiation** | Both READMEs | Users don't know which to choose |
| **undo-redo not mentioned in core** | core README line 333-351 | Missed lightweight alternative |
| **Outdated API in examples** | undo-redo README | Shows old `UndoRedo` class |
| **No comparison table** | Neither README | Hard to make informed decision |

### Package Comparison

| Metric | `@nexus-state/undo-redo` | `@nexus-state/time-travel` |
|--------|-------------------------|---------------------------|
| **Source lines** | ~350 | ~1,234 |
| **Bundle size** | ~3.2KB (min+gzip) | ~8KB (min+gzip) |
| **Primary use case** | User-facing undo/redo | Debugging & DevTools |
| **API complexity** | Low (3 methods) | Medium (6+ methods) |
| **React hook** | ✅ `useUndoRedo()` | ❌ |
| **Keyboard shortcuts** | ✅ Built-in | ❌ |
| **Debounce** | ✅ Built-in | ❌ |
| **DevTools** | ❌ | ✅ Redux DevTools |
| **Per-scope** | ❌ Single stack | ✅ Independent timelines |
| **Compression** | ❌ | ✅ Strategies |

---

## ✅ Acceptance Criteria

- [ ] Core README has comparison table (undo-redo vs time-travel)
- [ ] undo-redo README clearly positioned as "user-facing"
- [ ] time-travel README clearly positioned as "debugging"
- [ ] All examples use current API (`createUndoRedo`, not `new UndoRedo`)
- [ ] Decision tree added: "Which package should I use?"
- [ ] undo-redo README length ≤400 lines (from ~600)
- [ ] Cross-links between both packages working
- [ ] React hook example prominent in undo-redo README

---

## 📝 Implementation Steps

### Step 1: Update Core README (30 min)

**File:** `packages/core/README.md`  
**Lines:** 306-360 (Undo/Redo section)

**Replace current text with:**

```markdown
### Undo/Redo & Time Travel

For undo/redo functionality, choose based on your use case:

| Package | Use Case | API | Bundle | React Hook |
|---------|----------|-----|--------|------------|
| **@nexus-state/undo-redo** | User-facing (forms, editors) | `push()`, `undo()`, `redo()` | ~3KB | ✅ `useUndoRedo()` |
| **@nexus-state/time-travel** | Debugging, DevTools | `capture()`, `undo()`, `redo()` | ~8KB | ❌ |

---

#### User-Facing Undo/Redo (@nexus-state/undo-redo)

**Best for:** Forms, text editors, any UI where users need undo/redo buttons.

```bash
npm install @nexus-state/undo-redo
```

```typescript
import { atom, createStore } from '@nexus-state/core';
import { withUndoRedo } from '@nexus-state/undo-redo';

const textAtom = atom('');
const store = createStore();

// Add undo/redo with debounce for rapid changes
const undoRedo = withUndoRedo(store, { 
  debounce: 500,    // Batch changes within 500ms
  maxLength: 50,    // Keep last 50 states
});

// Enable Ctrl+Z out of the box
undoRedo.enableKeyboardShortcuts();

// User types
store.set(textAtom, 'Hello');

// Undo
undoRedo.undo(); // 'Hello' → ''

// React hook for toolbar
import { useUndoRedo } from '@nexus-state/undo-redo/react';

function Toolbar() {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </div>
  );
}
```

**Key features:**
- ✅ Debounce for rapid changes (forms, typing)
- ✅ Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- ✅ React hook (`useUndoRedo`)
- ✅ Ignore specific fields (`ignoreFields`)
- ✅ Batch operations (`batch()`)

📖 **Full docs:** [@nexus-state/undo-redo README](../undo-redo/README.md)

---

#### Debugging & Time Travel (@nexus-state/time-travel)

**Best for:** Debugging, DevTools integration, per-component timelines.

```bash
npm install @nexus-state/time-travel
```

```typescript
import { TimeTravelController } from '@nexus-state/time-travel';

const controller = new TimeTravelController(store, {
  maxHistory: 100,
  autoCapture: true,
});

// Capture snapshots for debugging
controller.capture('before-fetch');
store.set(dataAtom, await fetchData());
controller.capture('after-fetch');

// Navigate in DevTools
controller.undo(); // Go back to 'before-fetch'
controller.redo(); // Go forward to 'after-fetch'

// Per-scope time travel (debug Component A without affecting B)
const controllerA = new TimeTravelController(storeA);
const controllerB = new TimeTravelController(storeB);

controllerA.undo(); // Only affects store A
controllerB.undo(); // Only affects store B
```

**Key features:**
- ✅ Redux DevTools integration
- ✅ Per-scope independent timelines
- ✅ Snapshot compression strategies
- ✅ Auto-capture mode
- ✅ Travel to specific point (`travelTo(index)`)

📖 **Full docs:** [@nexus-state/time-travel README](../time-travel/README.md)

---

#### Quick Decision Guide

```
Need undo/redo for...
│
├─ Users in UI (forms, editors)?
│  └─> @nexus-state/undo-redo
│      - Debounce for typing
│      - Keyboard shortcuts
│      - React hook
│
└─ Debugging / DevTools?
   └─> @nexus-state/time-travel
       - Per-scope timelines
       - DevTools integration
       - Compression
```
```

---

### Step 2: Rewrite undo-redo README (45 min)

**File:** `packages/undo-redo/README.md`

**New Structure:**

```markdown
# @nexus-state/undo-redo

> Lightweight undo/redo for **user-facing** features

[![npm](badge)]()
[![Coverage](badge)]()

**Bundle size:** ~3KB (min+gzip) | **Lines:** ~350

---

## 🚀 Quick Start (60 seconds)

```typescript
import { atom, createStore } from '@nexus-state/core';
import { withUndoRedo } from '@nexus-state/undo-redo';

const textAtom = atom('');
const store = createStore();
const undoRedo = withUndoRedo(store, { debounce: 500 });

// User types
store.set(textAtom, 'Hello');

// Undo/Redo
undoRedo.undo(); // 'Hello' → ''
undoRedo.redo(); // '' → 'Hello'

// React component
import { useUndoRedo } from '@nexus-state/undo-redo/react';

function Toolbar() {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </div>
  );
}
```

---

## 🤔 undo-redo vs time-travel

| Feature | undo-redo | time-travel |
|---------|-----------|-------------|
| **Purpose** | User undo/redo | Debugging |
| **Bundle** | ~3KB | ~8KB |
| **API** | `push/undo/redo` | `capture/undo/redo` |
| **Debounce** | ✅ Built-in | ❌ |
| **Hotkeys** | ✅ Ctrl+Z/Ctrl+Y | ❌ |
| **React hook** | ✅ `useUndoRedo()` | ❌ |
| **DevTools** | ❌ | ✅ Redux DevTools |
| **Per-scope** | ❌ | ✅ Independent timelines |
| **Compression** | ❌ | ✅ Strategies |

**Choose undo-redo when:**
- ✅ Building forms with undo buttons
- ✅ Text editor with Ctrl+Z
- ✅ Need debouncing for rapid changes
- ✅ Want React hook

**Choose time-travel when:**
- ✅ Debugging application state
- ✅ Need DevTools integration
- ✅ Per-component timelines
- ✅ Snapshot compression needed

📖 **Time travel docs:** [@nexus-state/time-travel](../time-travel/README.md)

---

## 📖 Examples

### Form with Debounce

```typescript
const formAtom = atom({ name: '', email: '' });
const store = createStore();

const undoRedo = withUndoRedo(store, {
  debounce: 500,      // Batch changes within 500ms
  maxLength: 20,      // Keep last 20 states
  ignoreFields: ['timestamp'], // Ignore these fields
});

// User types rapidly - only saves after 500ms pause
store.set(formAtom, { name: 'J', email: '' });
store.set(formAtom, { name: 'Jo', email: '' });
store.set(formAtom, { name: 'John', email: '' });
// After 500ms: single state saved

undoRedo.undo(); // Undoes all 3 changes at once
```

### Text Editor with Keyboard Shortcuts

```typescript
const contentAtom = atom('');
const store = createStore();
const undoRedo = withUndoRedo(store, { maxLength: 100 });

// Enable Ctrl+Z / Ctrl+Y
undoRedo.enableKeyboardShortcuts({
  undo: ['ctrl+z', 'meta+z'],
  redo: ['ctrl+y', 'meta+shift+z'],
});

// User types...
// Press Ctrl+Z to undo
```

### React Toolbar with useUndoRedo

```typescript
import { useUndoRedo } from '@nexus-state/undo-redo/react';

function UndoRedoToolbar() {
  const { undo, redo, canUndo, canRedo, history } = useUndoRedo();
  
  return (
    <div className="toolbar">
      <button onClick={undo} disabled={!canUndo}>
        ↶ Undo
      </button>
      <button onClick={redo} disabled={!canRedo}>
        ↷ Redo
      </button>
      <span className="history">
        Step {history.position} / {history.length}
      </span>
    </div>
  );
}
```

### Batch Operations

```typescript
// Multiple changes = single undo step
undoRedo.batch(() => {
  store.set(nameAtom, 'John');
  store.set(emailAtom, 'john@example.com');
  store.set(ageAtom, 30);
});

undoRedo.undo(); // Undoes all 3 changes at once
```

---

## 📚 API Reference

### Core Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| **createUndoRedo** | `createUndoRedo<T>(options?)` | Create standalone manager |
| **withUndoRedo** | `withUndoRedo(store, options?)` | Add to store |

### Options

```typescript
interface UndoRedoOptions {
  maxLength?: number;      // Max history length (default: 50)
  debounce?: number;       // Debounce delay in ms (default: 0)
  ignoreFields?: string[]; // Fields to ignore in comparison
  areEqual?: (a: T, b: T) => boolean; // Custom equality check
}
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `push(state, metadata?)` | `void` | Add state to history |
| `undo()` | `T \| undefined` | Go back one step |
| `redo()` | `T \| undefined` | Go forward one step |
| `canUndo()` | `boolean` | Check if undo available |
| `canRedo()` | `boolean` | Check if redo available |
| `batch(fn)` | `void` | Group changes as one |
| `clear()` | `void` | Clear history |
| `enableKeyboardShortcuts(options?)` | `void` | Enable Ctrl+Z |
| `disableKeyboardShortcuts()` | `void` | Disable hotkeys |

### React Hook

```typescript
function useUndoRedo(): {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  history: {
    position: number;
    length: number;
  };
}
```

---

## 🔗 See Also

- [@nexus-state/core](../core/README.md) — Foundation
- [@nexus-state/time-travel](../time-travel/README.md) — Debugging
- [@nexus-state/react](../react/README.md) — React integration

---

## 📄 License

MIT
```

---

### Step 3: Update time-travel README (15 min)

**File:** `packages/time-travel/README.md`

**Add to top (after installation):**

```markdown
## 🤔 time-travel vs undo-redo

**This package:** Debugging, DevTools, per-scope timelines.

**For user-facing undo/redo:** Use [`@nexus-state/undo-redo`](../undo-redo/README.md)

| Feature | time-travel | undo-redo |
|---------|-------------|-----------|
| **Purpose** | Debugging | User undo/redo |
| **DevTools** | ✅ | ❌ |
| **Per-scope** | ✅ | ❌ |
| **Keyboard shortcuts** | ❌ | ✅ |
| **Debounce** | ❌ | ✅ |
| **React hook** | ❌ | ✅ |

📖 **undo-redo docs:** [README](../undo-redo/README.md)
```

---

### Step 4: Update Phase 10 Overview (10 min)

**File:** `phase-10-readme-excellence/README.md`

Add README-006 to tasks table.

---

## 🔗 Dependencies

- [ ] README-001 (Core README) — Should be done first for consistency
- [ ] README-004 (Cross-links) — Can be parallel

---

## 📊 Metrics

| Metric | Before | Target |
|--------|--------|--------|
| **core README clarity** | ~60% | ≥90% |
| **undo-redo README lines** | ~600 | ≤400 |
| **Examples with current API** | ~50% | 100% |
| **Cross-package links** | 0 | 4+ |

---

**Parent:** [Phase 10 README Excellence](./README.md)  
**Related:** [README-001](./README-001-core-rewrite.md), [README-004](./README-004-ecosystem-cross-links.md)
