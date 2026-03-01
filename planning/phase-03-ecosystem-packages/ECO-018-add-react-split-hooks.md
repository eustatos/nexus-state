# ECO-018: Add React Split Hooks (useAtomValue, useSetAtom)

## 📋 Task Overview

**Priority:** 🟡 High (Should Have for v1.0)  
**Estimated Time:** 3-4 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent

---

## 🎯 Objective

Add `useAtomValue` and `useSetAtom` hooks to @nexus-state/react for better performance and developer experience following industry best practices.

---

## 📦 Affected Components

**Package:** `@nexus-state/react`  
**Files:**
- `packages/react/index.ts` (modify)
- `packages/react/src/__tests__/hooks.test.tsx` (create)
- `packages/react/README.md` (update)
- `packages/react/CHANGELOG.md` (update)

---

## 🔍 Current State Analysis

**Current API:**
```typescript
// Only one hook available
export function useAtom<T>(atom: Atom<T>, store?: Store): [T, (value: T) => void]
```

**Problems:**
1. ❌ Components that only write still subscribe (unnecessary re-renders)
2. ❌ Unclear intent - is component reading, writing, or both?
3. ❌ Not following industry standards (Jotai, Recoil)
4. ❌ Poor performance in forms with many inputs

**What competitors have:**

| Library | useAtom | useAtomValue | useSetAtom |
|---------|---------|--------------|------------|
| Jotai | ✅ | ✅ | ✅ |
| Recoil | ✅ | ✅ | ✅ |
| Nexus State | ✅ | ❌ | ❌ |

---

## ✅ Acceptance Criteria

- [ ] `useAtomValue` hook implemented
- [ ] `useSetAtom` hook implemented
- [ ] Existing `useAtom` refactored to use both
- [ ] No breaking changes to existing API
- [ ] TypeScript types correct
- [ ] Tests passing (≥95% coverage)
- [ ] README updated with examples
- [ ] Bundle size increase < 1KB
- [ ] Performance benchmarks showing improvement

---

## 📝 Implementation Steps

### Step 1: Create useAtomValue

**File:** `packages/react/index.ts`

```typescript
import { Atom, Store } from "@nexus-state/core";
import { 
  useCallback, 
  useDebugValue, 
  useSyncExternalStore 
} from "react";

/**
 * Hook to read an atom value (read-only)
 * 
 * Use this when you only need to READ the atom value, not update it.
 * This hook subscribes to atom changes but does not provide a setter.
 * 
 * Benefits:
 * - Optimized for read-only scenarios
 * - Clear intent in code
 * - Follows React 18 best practices
 * 
 * @template T - The type of the atom's value
 * @param {Atom<T>} atom - The atom to read
 * @param {Store} store - The store instance
 * @returns {T} The current atom value
 * 
 * @example
 * function UserProfile() {
 *   const user = useAtomValue(userAtom, store);
 *   return <div>{user.name}</div>;
 * }
 */
export function useAtomValue<T>(
  atom: Atom<T>,
  store: Store
): T {
  // Use React 18's useSyncExternalStore for optimal performance
  const value = useSyncExternalStore(
    // Subscribe function
    useCallback(
      (onStoreChange) => {
        // Subscribe to atom changes and return unsubscribe function
        return store.subscribe(atom, onStoreChange);
      },
      [atom, store]
    ),
    // Get snapshot function (for client)
    useCallback(() => store.get(atom), [atom, store]),
    // Get server snapshot function (for SSR)
    useCallback(() => store.get(atom), [atom, store])
  );

  // Display value in React DevTools for debugging
  useDebugValue(value);

  return value;
}
```

---

### Step 2: Create useSetAtom

**File:** `packages/react/index.ts`

```typescript
/**
 * Hook to write to an atom (write-only)
 * 
 * Use this when you only need to UPDATE the atom value, not read it.
 * This hook does NOT subscribe to atom changes, preventing unnecessary re-renders.
 * 
 * Benefits:
 * - No subscription = no re-renders
 * - Perfect for form inputs, action buttons
 * - Stable setter reference (won't change)
 * - Better performance in lists
 * 
 * @template T - The type of the atom's value
 * @param {Atom<T>} atom - The atom to write to
 * @param {Store} store - The store instance
 * @returns {(value: T | ((prev: T) => T)) => void} Setter function
 * 
 * @example
 * // Form input that only writes
 * function NameInput() {
 *   const setName = useSetAtom(nameAtom, store);
 *   return (
 *     <input 
 *       onChange={e => setName(e.target.value)}
 *       placeholder="Name"
 *     />
 *   );
 * }
 * 
 * @example
 * // Action button with updater function
 * function IncrementButton() {
 *   const setCount = useSetAtom(countAtom, store);
 *   return (
 *     <button onClick={() => setCount(prev => prev + 1)}>
 *       Increment
 *     </button>
 *   );
 * }
 */
export function useSetAtom<T>(
  atom: Atom<T>,
  store: Store
): (value: T | ((prev: T) => T)) => void {
  // Create stable setter function that never changes
  const setAtom = useCallback(
    (update: T | ((prev: T) => T)) => {
      store.set(atom, update);
    },
    [atom, store]
  );

  return setAtom;
}
```

---

### Step 3: Refactor useAtom

**File:** `packages/react/index.ts`

```typescript
/**
 * Hook to read and write an atom value
 * 
 * Use this when you need BOTH read and write access to the atom.
 * For read-only or write-only scenarios, prefer useAtomValue or useSetAtom
 * for better performance.
 * 
 * This hook combines useAtomValue and useSetAtom.
 * 
 * @template T - The type of the atom's value
 * @param {Atom<T>} atom - The atom to use
 * @param {Store} store - The store instance
 * @returns {[T, (value: T | ((prev: T) => T)) => void]} Tuple of [value, setter]
 * 
 * @example
 * // Controlled input (needs both read and write)
 * function ControlledInput() {
 *   const [value, setValue] = useAtom(inputAtom, store);
 *   return (
 *     <input 
 *       value={value}
 *       onChange={e => setValue(e.target.value)} 
 *     />
 *   );
 * }
 * 
 * @see useAtomValue - For read-only access
 * @see useSetAtom - For write-only access
 */
export function useAtom<T>(
  atom: Atom<T>,
  store: Store
): [T, (value: T | ((prev: T) => T)) => void] {
  // Compose from useAtomValue and useSetAtom
  const value = useAtomValue(atom, store);
  const setValue = useSetAtom(atom, store);
  
  return [value, setValue];
}
```

---

### Step 4: Add Bonus Hook - useAtomCallback

**File:** `packages/react/index.ts`

```typescript
import type { Getter, Setter } from "@nexus-state/core";

/**
 * Hook to create a callback that can read and write atoms
 * 
 * Useful for complex operations that need to interact with multiple atoms.
 * The callback has access to get and set functions.
 * 
 * @template Args - Argument types for the callback
 * @template Result - Return type of the callback
 * @param {Function} callback - Function that receives get and set
 * @param {Store} store - The store instance
 * @returns {(...args: Args) => Result} Memoized callback function
 * 
 * @example
 * function TransferButton() {
 *   const handleTransfer = useAtomCallback(
 *     (get, set, amount: number) => {
 *       const balance = get(balanceAtom);
 *       if (balance >= amount) {
 *         set(balanceAtom, balance - amount);
 *         set(logAtom, [...get(logAtom), `Transferred ${amount}`]);
 *       }
 *     },
 *     store
 *   );
 *   
 *   return <button onClick={() => handleTransfer(100)}>Transfer</button>;
 * }
 */
export function useAtomCallback<Args extends unknown[], Result>(
  callback: (get: Getter, set: Setter, ...args: Args) => Result,
  store: Store
): (...args: Args) => Result {
  return useCallback(
    (...args: Args) => {
      const get: Getter = <T>(atom: Atom<T>) => store.get(atom);
      const set: Setter = <T>(atom: Atom<T>, value: T | ((prev: T) => T)) => 
        store.set(atom, value);
      
      return callback(get, set, ...args);
    },
    [store, callback]
  );
}
```

---

### Step 5: Update TypeScript Types

**File:** `packages/react/index.ts`

```typescript
// Export types for better TypeScript experience
export type { Atom, Store } from "@nexus-state/core";

// Type for setter function
export type SetAtom<T> = (value: T | ((prev: T) => T)) => void;

// Type for atom callback
export type AtomCallback<Args extends unknown[], Result> = (
  get: Getter,
  set: Setter,
  ...args: Args
) => Result;
```

---

### Step 6: Create Comprehensive Tests

**File:** `packages/react/src/__tests__/hooks.test.tsx` (create)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, renderHook, screen, fireEvent } from '@testing-library/react';
import { atom, createStore } from '@nexus-state/core';
import { useAtom, useAtomValue, useSetAtom, useAtomCallback } from '../index';
import React from 'react';

describe('React Hooks', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('useAtomValue', () => {
    it('should read atom value', () => {
      const countAtom = atom(0);
      
      const { result } = renderHook(() => useAtomValue(countAtom, store));
      
      expect(result.current).toBe(0);
    });

    it('should subscribe to atom changes', () => {
      const countAtom = atom(0);
      
      const { result, rerender } = renderHook(() => 
        useAtomValue(countAtom, store)
      );
      
      expect(result.current).toBe(0);
      
      // Update atom
      store.set(countAtom, 5);
      rerender();
      
      expect(result.current).toBe(5);
    });

    it('should not provide setter', () => {
      const countAtom = atom(0);
      
      const { result } = renderHook(() => useAtomValue(countAtom, store));
      
      // Result is just the value, not a tuple
      expect(typeof result.current).toBe('number');
      expect(Array.isArray(result.current)).toBe(false);
    });
  });

  describe('useSetAtom', () => {
    it('should return setter function', () => {
      const countAtom = atom(0);
      
      const { result } = renderHook(() => useSetAtom(countAtom, store));
      
      expect(typeof result.current).toBe('function');
    });

    it('should update atom value', () => {
      const countAtom = atom(0);
      
      const { result } = renderHook(() => useSetAtom(countAtom, store));
      
      // Call setter
      result.current(5);
      
      // Verify atom was updated
      expect(store.get(countAtom)).toBe(5);
    });

    it('should support updater function', () => {
      const countAtom = atom(10);
      
      const { result } = renderHook(() => useSetAtom(countAtom, store));
      
      // Update with function
      result.current(prev => prev + 5);
      
      expect(store.get(countAtom)).toBe(15);
    });

    it('should NOT cause re-renders on atom change', () => {
      const countAtom = atom(0);
      let renderCount = 0;
      
      function TestComponent() {
        renderCount++;
        const setCount = useSetAtom(countAtom, store);
        return <button onClick={() => setCount(1)}>Set</button>;
      }
      
      render(<TestComponent />);
      expect(renderCount).toBe(1);
      
      // Update atom externally
      store.set(countAtom, 5);
      
      // Component should NOT re-render
      expect(renderCount).toBe(1);
    });

    it('should have stable reference', () => {
      const countAtom = atom(0);
      
      const { result, rerender } = renderHook(() => 
        useSetAtom(countAtom, store)
      );
      
      const firstSetter = result.current;
      
      rerender();
      
      const secondSetter = result.current;
      
      // Same reference
      expect(firstSetter).toBe(secondSetter);
    });
  });

  describe('useAtom', () => {
    it('should return value and setter', () => {
      const countAtom = atom(0);
      
      const { result } = renderHook(() => useAtom(countAtom, store));
      
      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(2);
      expect(typeof result.current[0]).toBe('number');
      expect(typeof result.current[1]).toBe('function');
    });

    it('should combine useAtomValue and useSetAtom behavior', () => {
      const countAtom = atom(0);
      
      const { result } = renderHook(() => useAtom(countAtom, store));
      
      const [value, setValue] = result.current;
      
      expect(value).toBe(0);
      
      setValue(5);
      
      expect(store.get(countAtom)).toBe(5);
    });
  });

  describe('useAtomCallback', () => {
    it('should create callback with get and set', () => {
      const atom1 = atom(1);
      const atom2 = atom(2);
      
      const { result } = renderHook(() =>
        useAtomCallback((get, set, multiplier: number) => {
          const val1 = get(atom1);
          const val2 = get(atom2);
          set(atom1, val1 * multiplier);
          set(atom2, val2 * multiplier);
          return val1 + val2;
        }, store)
      );
      
      const returnValue = result.current(10);
      
      expect(returnValue).toBe(3); // 1 + 2
      expect(store.get(atom1)).toBe(10);
      expect(store.get(atom2)).toBe(20);
    });

    it('should have stable reference', () => {
      const countAtom = atom(0);
      
      const { result, rerender } = renderHook(() =>
        useAtomCallback((get, set) => {
          set(countAtom, get(countAtom) + 1);
        }, store)
      );
      
      const firstCallback = result.current;
      rerender();
      const secondCallback = result.current;
      
      expect(firstCallback).toBe(secondCallback);
    });
  });

  describe('Performance', () => {
    it('useSetAtom should not cause re-renders', () => {
      const countAtom = atom(0);
      let renderCount = 0;
      
      function WriteOnlyComponent() {
        renderCount++;
        const setCount = useSetAtom(countAtom, store);
        return <button onClick={() => setCount(1)}>Update</button>;
      }
      
      render(<WriteOnlyComponent />);
      
      const initialRenders = renderCount;
      
      // Update atom multiple times
      store.set(countAtom, 1);
      store.set(countAtom, 2);
      store.set(countAtom, 3);
      
      // No additional re-renders
      expect(renderCount).toBe(initialRenders);
    });

    it('useAtomValue should only re-render on changes', () => {
      const countAtom = atom(0);
      let renderCount = 0;
      
      function ReadOnlyComponent() {
        renderCount++;
        const count = useAtomValue(countAtom, store);
        return <div>{count}</div>;
      }
      
      render(<ReadOnlyComponent />);
      expect(renderCount).toBe(1);
      
      // Update atom
      store.set(countAtom, 1);
      expect(renderCount).toBe(2);
      
      // Set same value - should not re-render
      store.set(countAtom, 1);
      expect(renderCount).toBe(2);
    });
  });

  describe('Integration', () => {
    it('should work in realistic form scenario', () => {
      const nameAtom = atom('');
      const emailAtom = atom('');
      
      function FormComponent() {
        const [name, setName] = useAtom(nameAtom, store);
        const setEmail = useSetAtom(emailAtom, store);
        
        return (
          <div>
            <input 
              data-testid="name-input"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input 
              data-testid="email-input"
              onChange={e => setEmail(e.target.value)}
            />
          </div>
        );
      }
      
      render(<FormComponent />);
      
      const nameInput = screen.getByTestId('name-input') as HTMLInputElement;
      const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
      
      fireEvent.change(nameInput, { target: { value: 'John' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      
      expect(store.get(nameAtom)).toBe('John');
      expect(store.get(emailAtom)).toBe('john@example.com');
    });
  });
});
```

---

### Step 7: Update README

**File:** `packages/react/README.md`

```markdown
# @nexus-state/react

React bindings for Nexus State with optimized hooks.

## Hooks

### useAtom (Read + Write)

Use when you need both read and write access.

\`\`\`typescript
import { useAtom } from '@nexus-state/react';

function Counter() {
  const [count, setCount] = useAtom(countAtom, store);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
\`\`\`

### useAtomValue (Read Only)

Use when you only need to read the value. **Optimized: subscribes to changes.**

\`\`\`typescript
import { useAtomValue } from '@nexus-state/react';

function Display() {
  const count = useAtomValue(countAtom, store);
  return <p>Count: {count}</p>;
}
\`\`\`

### useSetAtom (Write Only)

Use when you only need to update the value. **Optimized: no subscription, no re-renders.**

\`\`\`typescript
import { useSetAtom } from '@nexus-state/react';

function IncrementButton() {
  const setCount = useSetAtom(countAtom, store);
  
  return (
    <button onClick={() => setCount(prev => prev + 1)}>
      Increment
    </button>
  );
}
\`\`\`

### useAtomCallback (Advanced)

Use for complex operations involving multiple atoms.

\`\`\`typescript
import { useAtomCallback } from '@nexus-state/react';

function TransferButton() {
  const handleTransfer = useAtomCallback(
    (get, set, amount: number) => {
      const balance = get(balanceAtom);
      if (balance >= amount) {
        set(balanceAtom, balance - amount);
        set(historyAtom, [...get(historyAtom), `Transferred ${amount}`]);
      }
    },
    store
  );
  
  return <button onClick={() => handleTransfer(100)}>Transfer $100</button>;
}
\`\`\`

## Performance Tips

**✅ DO:** Use split hooks for better performance

\`\`\`typescript
// Read only - use useAtomValue
function UserName() {
  const name = useAtomValue(nameAtom, store);
  return <span>{name}</span>;
}

// Write only - use useSetAtom
function NameInput() {
  const setName = useSetAtom(nameAtom, store);
  return <input onChange={e => setName(e.target.value)} />;
}
\`\`\`

**❌ DON'T:** Use useAtom when you only need read or write

\`\`\`typescript
// Bad - unnecessary subscription
function NameInput() {
  const [_, setName] = useAtom(nameAtom, store);
  // Component re-renders on every nameAtom change even though value not used!
  return <input onChange={e => setName(e.target.value)} />;
}
\`\`\`

## License

MIT
\`\`\`

---

### Step 8: Update CHANGELOG

**File:** `packages/react/CHANGELOG.md`

```markdown
# Changelog

## [0.2.0] - 2026-03-XX

### Added
- ✨ `useAtomValue` hook for read-only atom access
- ✨ `useSetAtom` hook for write-only atom access (no re-renders)
- ✨ `useAtomCallback` hook for complex multi-atom operations
- 📝 Comprehensive documentation with performance tips
- ✅ 95%+ test coverage for all hooks

### Changed
- ♻️ `useAtom` now internally uses `useAtomValue` + `useSetAtom`
- ⚡ Performance improvements for write-only scenarios

### Performance
- 🚀 Write-only components no longer re-render unnecessarily
- 📦 Bundle size increase: +0.5KB (worth it for perf gains)

## [0.1.5] - Previous release
...
\`\`\`

---

## 🧪 Validation Commands

```bash
cd packages/react

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Expected coverage: ≥95%

# Build
pnpm build

# Check bundle size
ls -lh dist/
# Should be ~1.5KB (was ~1KB, +0.5KB acceptable)

# Lint
pnpm lint

# Type check
tsc --noEmit
```

---

## 📚 Context & Background

### Why Split Hooks?

**Industry Standard:**
- Jotai: useAtomValue, useSetAtom ✅
- Recoil: useRecoilValue, useSetRecoilState ✅
- Zustand: Different pattern but same concept ✅

**Performance:**
```typescript
// Without split hooks - 20 form inputs
// Each input does useAtom but only uses setter
// Result: 20 unnecessary subscriptions, 20 re-renders per change

// With split hooks - 20 form inputs
// Each input does useSetAtom (no subscription)
// Result: 0 subscriptions, 0 re-renders per change
// 100% performance improvement! 🚀
```

**Developer Experience:**
- Clear intent: Read, write, or both?
- Self-documenting code
- Easier to optimize
- Follows best practices

---

## 🔗 Related Tasks

- **Depends On:** Phase 00 complete
- **Blocks:** Production-ready React package
- **Related:** PERF-001 (Performance improvements)

---

## 📊 Definition of Done

- [ ] `useAtomValue` implemented and tested
- [ ] `useSetAtom` implemented and tested
- [ ] `useAtomCallback` implemented and tested
- [ ] Existing `useAtom` refactored (no breaking changes)
- [ ] All tests passing (≥95% coverage)
- [ ] README updated with examples
- [ ] Performance benchmarks show improvement
- [ ] Bundle size acceptable (<2KB total)
- [ ] TypeScript types correct
- [ ] CHANGELOG updated

---

## 🚀 Implementation Checklist

```bash
# 1. Create branch
git checkout -b feat/react-split-hooks

# 2. Implement hooks in index.ts
# (Follow steps 1-5 above)

# 3. Create tests
# (Create __tests__/hooks.test.tsx)

# 4. Run tests
cd packages/react
pnpm test

# 5. Update README
# (Add examples and performance tips)

# 6. Update CHANGELOG
# (Document new features)

# 7. Build
pnpm build

# 8. Verify bundle size
ls -lh dist/

# 9. Commit
git add .
git commit -m "feat(react): add useAtomValue, useSetAtom, useAtomCallback hooks

- Add useAtomValue for read-only atom access
- Add useSetAtom for write-only access (no re-renders)
- Add useAtomCallback for complex multi-atom operations
- Refactor useAtom to use split hooks internally
- Add comprehensive tests (95%+ coverage)
- Update README with performance tips
- Update CHANGELOG

Benefits:
- Write-only components don't re-render unnecessarily
- Clear separation of read/write intent
- Follows industry best practices (Jotai, Recoil)
- Better performance in forms and lists

Bundle size: +0.5KB (acceptable for perf gains)

Resolves: ECO-018

Generated with [Continue](https://continue.dev)
Co-Authored-By: Continue <noreply@continue.dev>"

# 10. Push
git push origin feat/react-split-hooks
```

---

**Created:** 2026-03-01  
**Estimated Completion:** 2026-03-04  
**Impact:** 🟡 High (better DX and performance)
