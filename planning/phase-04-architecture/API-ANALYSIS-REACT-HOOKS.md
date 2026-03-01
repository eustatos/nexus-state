# React Hooks API Analysis: useAtomValue, useSetAtom

**Date:** 2026-03-01
**Question:** Are separate `useAtomValue` and `useSetAtom` hooks needed?
**Answer:** ✅ **YES, ABSOLUTELY!** Critical for performance

---

## 🎯 TL;DR

**Recommendation:** Add `useAtomValue` and `useSetAtom` in addition to `useAtom`

**Reason:** Re-render optimization and following best practices

**Priority:** 🟡 High (for v1.0)

---

## 📊 Comparison with Competitors

### What market leaders do:

| Library | useAtom | useAtomValue | useSetAtom | Downloads/wk |
|---------|---------|--------------|------------|--------------|
| **Jotai** | ✅ | ✅ | ✅ | 500K+ |
| **Recoil** | ✅ | ✅ | ✅ | 300K+ |
| **Zustand** | ❌ | ✅ `useStore` | ❌ | 4M+ |
| **Valtio** | ❌ | ✅ `useSnapshot` | ❌ | 100K+ |
| **Nexus State** | ✅ | ❌ | ❌ | <100 |

**Conclusion:** The industry has reached a consensus - split hooks are good practice

---

## 🚀 Problem with Current API

### Current API:

```typescript
export function useAtom<T>(atom: Atom<T>, store?: Store): [T, (value: T) => void]
```

### Problem 1: Unnecessary Re-renders

```typescript
// Component that only SETS value (e.g., form input)
function FormInput() {
  const [_, setName] = useAtom(nameAtom, store);
  //      ↑ unused, but component still subscribes!

  return (
    <input onChange={e => setName(e.target.value)} />
  );
}
```

**What happens:**
- ❌ Component subscribes to `nameAtom`
- ❌ Every `nameAtom` change triggers re-render
- ❌ Re-render is not needed - component doesn't read the value!

**Impact:**
- Unnecessary re-renders
- Poor performance in forms
- Wasted CPU cycles

---

### Problem 2: Unclear Intent

```typescript
// What does this component do?
function MyComponent() {
  const [value, setValue] = useAtom(someAtom, store);
  // Reads? Writes? Both?
  // Unclear without reading the code!
}
```

**vs**

```typescript
// Clear intent!
function DisplayComponent() {
  const value = useAtomValue(someAtom, store);
  // ✅ Only reads, never writes
}

function UpdateComponent() {
  const setValue = useSetAtom(someAtom, store);
  // ✅ Only writes, never reads
}
```

**Benefits:**
- ✅ Self-documenting code
- ✅ Clear separation of concerns
- ✅ Easier to understand and maintain

---

## 💡 Solution: Split Hooks

### Proposed API:

```typescript
// 1. Read + Write (existing)
export function useAtom<T>(
  atom: Atom<T>,
  store: Store
): [T, (value: T | ((prev: T) => T)) => void]

// 2. Read Only (NEW)
export function useAtomValue<T>(
  atom: Atom<T>,
  store: Store
): T

// 3. Write Only (NEW)
export function useSetAtom<T>(
  atom: Atom<T>,
  store: Store
): (value: T | ((prev: T) => T)) => void
```

---

## 📝 Implementation

### File: `packages/react/index.ts`

```typescript
import { Atom, Store } from "@nexus-state/core";
import { useCallback, useDebugValue, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Hook to read and write an atom value
 * Use when you need both value and setter
 */
export function useAtom<T>(
  atom: Atom<T>,
  store: Store
): [T, (value: T | ((prev: T) => T)) => void] {
  const value = useAtomValue(atom, store);
  const setValue = useSetAtom(atom, store);
  return [value, setValue];
}

/**
 * Hook to read an atom value (read-only)
 * Use when you only need to read, not write
 * Optimized: only subscribes to changes
 */
export function useAtomValue<T>(
  atom: Atom<T>,
  store: Store
): T {
  // Use React 18's useSyncExternalStore for better performance
  const value = useSyncExternalStore(
    useCallback(
      (onStoreChange) => {
        // Subscribe to atom changes
        return store.subscribe(atom, onStoreChange);
      },
      [atom, store]
    ),
    // Get current snapshot
    useCallback(() => store.get(atom), [atom, store]),
    // Get server snapshot (SSR)
    useCallback(() => store.get(atom), [atom, store])
  );

  // Display in React DevTools
  useDebugValue(value);

  return value;
}

/**
 * Hook to write to an atom (write-only)
 * Use when you only need to update, not read
 * Optimized: does NOT subscribe to changes
 */
export function useSetAtom<T>(
  atom: Atom<T>,
  store: Store
): (value: T | ((prev: T) => T)) => void {
  // Create stable setter that never changes
  const setAtom = useCallback(
    (update: T | ((prev: T) => T)) => {
      store.set(atom, update);
    },
    [atom, store]
  );

  return setAtom;
}

/**
 * Hook to reset atom to its initial value
 */
export function useResetAtom(
  atom: Atom<any>,
  store: Store
): () => void {
  return useCallback(() => {
    // Reset logic - requires storing initial value
    // This would need core support
  }, [atom, store]);
}

// Legacy export for backward compatibility
export { useAtom as default };
```

---

## 📈 Performance Comparison

### Scenario: Large Form with 20 Fields

**Without split hooks:**
```typescript
// Each input subscribes to its own atom
function NameInput() {
  const [_, setName] = useAtom(nameAtom, store);
  // ❌ Subscribes even though value not used
  return <input onChange={e => setName(e.target.value)} />;
}

// Result: 20 inputs × unnecessary subscriptions = BAD
```

**With split hooks:**
```typescript
// Each input only gets setter
function NameInput() {
  const setName = useSetAtom(nameAtom, store);
  // ✅ NO subscription, NO re-renders
  return <input onChange={e => setName(e.target.value)} />;
}

// Result: 20 inputs × 0 re-renders = GOOD
```

**Performance Impact:**

| Metric | Without Split | With Split | Improvement |
|--------|---------------|------------|-------------|
| Subscriptions | 20 | 0 | -100% |
| Re-renders | 20 per change | 0 | -100% |
| Memory | Higher | Lower | Better |

---

## 🎯 Use Cases

### 1. Display Components (Read Only)

```typescript
function UserProfile() {
  const user = useAtomValue(userAtom, store);
  // ✅ Only reads, subscribes to changes
  // ✅ Re-renders when user changes

  return <div>{user.name}</div>;
}
```

### 2. Form Inputs (Write Only)

```typescript
function NameInput() {
  const setName = useSetAtom(nameAtom, store);
  // ✅ Only writes, NO subscription
  // ✅ Never re-renders from atom changes

  return (
    <input
      onChange={e => setName(e.target.value)}
      placeholder="Name"
    />
  );
}
```

### 3. Controlled Inputs (Read + Write)

```typescript
function ControlledInput() {
  const [value, setValue] = useAtom(inputAtom, store);
  // ✅ Needs both read and write
  // ✅ Re-renders when value changes (expected)

  return (
    <input
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  );
}
```

### 4. Action Buttons (Write Only)

```typescript
function IncrementButton() {
  const setCount = useSetAtom(countAtom, store);
  // ✅ Only updates, doesn't need current value
  // ✅ Never re-renders

  return (
    <button onClick={() => setCount(prev => prev + 1)}>
      Increment
    </button>
  );
}
```

---

## 🏆 Best Practices from Industry

### Jotai Pattern (Most Similar)

```typescript
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

// Read + Write
const [count, setCount] = useAtom(countAtom);

// Read Only
const count = useAtomValue(countAtom);

// Write Only
const setCount = useSetAtom(countAtom);
```

### Recoil Pattern

```typescript
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

// Read + Write
const [count, setCount] = useRecoilState(countState);

// Read Only
const count = useRecoilValue(countState);

// Write Only
const setCount = useSetRecoilState(countState);
```

### Proposed Nexus State Pattern

```typescript
import { atom, useAtom, useAtomValue, useSetAtom } from '@nexus-state/react';

// Read + Write
const [count, setCount] = useAtom(countAtom, store);

// Read Only
const count = useAtomValue(countAtom, store);

// Write Only
const setCount = useSetAtom(countAtom, store);
```

**Consistency:** ✅ Follows industry standards

---

## 📊 Bundle Size Impact

### Current API:
```typescript
// Only useAtom
export function useAtom() { ... }
// Size: ~1KB
```

### With Split Hooks:
```typescript
// useAtom, useAtomValue, useSetAtom
export function useAtom() { ... }
export function useAtomValue() { ... }
export function useSetAtom() { ... }
// Size: ~1.5KB (+0.5KB)
```

**Trade-off:**
- ❌ +0.5KB bundle size
- ✅ Much better performance
- ✅ Follows best practices
- ✅ Better DX

**Verdict:** Worth it! 500 bytes for better perf is good trade-off

---

## 🚨 Breaking Changes?

**Good News:** NO BREAKING CHANGES!

```typescript
// Existing code continues to work:
const [value, setValue] = useAtom(atom, store); // ✅ Still works

// New code can use optimized hooks:
const value = useAtomValue(atom, store);        // ✅ New, better
const setValue = useSetAtom(atom, store);       // ✅ New, better
```

**Migration:** Optional, not required

---

## 📋 Implementation Checklist

- [ ] Create `useAtomValue` hook
- [ ] Create `useSetAtom` hook
- [ ] Refactor `useAtom` to use both
- [ ] Add TypeScript types
- [ ] Add tests for all hooks
- [ ] Add examples to README
- [ ] Update documentation
- [ ] Add performance benchmarks
- [ ] Update demo apps

**Estimated Time:** 3-4 hours

---

## 🎯 Additional Hooks to Consider

### 1. `useAtomCallback` (Advanced)

```typescript
export function useAtomCallback<Args extends unknown[], Result>(
  callback: (get: Getter, set: Setter, ...args: Args) => Result,
  store: Store
): (...args: Args) => Result {
  return useCallback(
    (...args: Args) => {
      return callback(
        (atom) => store.get(atom),
        (atom, value) => store.set(atom, value),
        ...args
      );
    },
    [store, callback]
  );
}

// Usage:
const handleClick = useAtomCallback((get, set) => {
  const count = get(countAtom);
  set(countAtom, count + 1);
  set(logAtom, [...get(logAtom), 'incremented']);
}, store);
```

**Use Case:** Complex updates involving multiple atoms

---

### 2. `useHydrateAtoms` (SSR)

```typescript
export function useHydrateAtoms(
  values: Map<Atom<unknown>, unknown>,
  store: Store
): void {
  useEffect(() => {
    values.forEach((value, atom) => {
      store.set(atom, value);
    });
  }, []);
}

// Usage:
function App({ initialData }) {
  useHydrateAtoms(
    new Map([
      [userAtom, initialData.user],
      [settingsAtom, initialData.settings]
    ]),
    store
  );
}
```

**Use Case:** SSR/SSG hydration

---

### 3. `useAtomSelector` (Optimization)

```typescript
export function useAtomSelector<T, Selected>(
  atom: Atom<T>,
  selector: (value: T) => Selected,
  store: Store
): Selected {
  const [selected, setSelected] = useState(() =>
    selector(store.get(atom))
  );

  useEffect(() => {
    return store.subscribe(atom, (value) => {
      const newSelected = selector(value);
      if (!Object.is(selected, newSelected)) {
        setSelected(newSelected);
      }
    });
  }, [atom, store, selector]);

  return selected;
}

// Usage: Subscribe to part of atom
const userName = useAtomSelector(
  userAtom,
  user => user.name,
  store
);
```

**Use Case:** Large objects, subscribe to specific fields only

---

## 🏁 Recommendation

### Summary:

| Hook | Priority | Reason |
|------|----------|--------|
| `useAtomValue` | 🔴 **Must Have** | Performance optimization |
| `useSetAtom` | 🔴 **Must Have** | Performance optimization |
| `useAtomCallback` | 🟡 Should Have | Complex updates |
| `useHydrateAtoms` | 🟡 Should Have | SSR support |
| `useAtomSelector` | 🟢 Nice to Have | Advanced optimization |

### Action Plan:

**Phase 1 (Must Do for v1.0):**
1. Add `useAtomValue`
2. Add `useSetAtom`
3. Update docs

**Phase 2 (Should Have for v1.0):**
4. Add `useAtomCallback`
5. Add `useHydrateAtoms`

**Phase 3 (v1.1+):**
6. Add `useAtomSelector`
7. Advanced hooks

---

## 📚 Related Documents

- [PERF-001: Performance Improvements](phase-02-architecture/PERF-001-performance-analysis-and-improvements.md)
- [Phase 03: Ecosystem Packages](phase-03-ecosystem-packages/INDEX.md)
- [Master Roadmap](MASTER-ROADMAP.md)

---

**Created:** 2026-03-01
**Question:** Are `useAtomValue`, `useSetAtom` hooks appropriate?
**Answer:** ✅ Absolutely needed for v1.0
**Priority:** 🟡 High
**Time:** 3-4 hours

---

> 💡 **Bottom Line:** Split hooks (`useAtomValue`, `useSetAtom`) are industry standard and provide significant performance benefits. Must add for v1.0 to be competitive with Jotai/Recoil.
