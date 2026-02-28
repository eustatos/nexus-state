# TASK-003: Add useSetAtom Hook (Write-Only)

**Priority:** High  
**Effort:** 3 hours  
**Dependencies:** TASK-002

---

## Context

- **Current:** Components that only update atoms still re-render on value changes
- **Problem:** Unnecessary re-renders for "setter-only" components
- **Expected:** Write-only hook that doesn't subscribe to value changes

---

## Requirements

- ✅ TypeScript strict mode
- ✅ Single Responsibility Principle
- ✅ Test coverage ≥ 95%
- ✅ JSDoc with @example
- ✅ Performance: No re-renders when atom value changes

---

## Implementation Steps

### 1. Create useSetAtom.ts

**File:** `packages/react/src/useSetAtom.ts`

```typescript
import type { Atom, Store } from '@nexus-state/core';
import { createStore } from '@nexus-state/core';
import { useMemo } from 'react';

/**
 * Hook to get only the setter function for an atom.
 * Use this when you only need to update the atom and don't need its value.
 * This component will NOT re-render when the atom's value changes.
 *
 * @template T - The type of the atom's value
 * @param atom - The atom to get the setter for
 * @param store - Optional store instance
 * @returns A setter function to update the atom
 *
 * @example
 * ```tsx
 * function IncrementButton() {
 *   const setCount = useSetAtom(countAtom, store);
 *   return (
 *     <button onClick={() => setCount(c => c + 1)}>
 *       Increment
 *     </button>
 *   );
 * }
 * ```
 */
export function useSetAtom<T>(
  atom: Atom<T>,
  store?: Store
): (value: T | ((prev: T) => T)) => void {
  const resolvedStore = useMemo(() => store || createStore(), [store]);

  const setter = useMemo(() => {
    return (update: T | ((prev: T) => T)) => {
      resolvedStore.set(atom, update);
    };
  }, [resolvedStore, atom]);

  return setter;
}
```

### 2. Update exports

**File:** `packages/react/index.ts`

```typescript
export { useAtom } from './useAtom';
export { useAtomValue } from './useAtomValue';
export { useSetAtom } from './useSetAtom';
```

---

## Acceptance Criteria

- [ ] `useSetAtom` exported from `@nexus-state/react`
- [ ] Component using `useSetAtom` does NOT re-render when atom value changes
- [ ] Setter function reference is stable (doesn't change on re-renders)
- [ ] TypeScript inference works correctly
- [ ] All existing tests pass
- [ ] New tests for `useSetAtom` (7+ test cases)

---

## Testing Strategy

**File:** `packages/react/src/__tests__/useSetAtom.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { atom, createStore } from '@nexus-state/core';
import { useSetAtom } from '../useSetAtom';

describe('useSetAtom', () => {
  it('should return a setter function', () => {
    const countAtom = atom(0);
    const store = createStore();
    const { result } = renderHook(() => useSetAtom(countAtom, store));
    expect(typeof result.current).toBe('function');
  });

  it('should update atom value when called', () => {
    const countAtom = atom(0);
    const store = createStore();
    const { result } = renderHook(() => useSetAtom(countAtom, store));
    act(() => { result.current(5); });
    expect(store.get(countAtom)).toBe(5);
  });

  it('should NOT re-render when atom value changes', () => {
    const countAtom = atom(0);
    const store = createStore();
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount++;
      return useSetAtom(countAtom, store);
    });
    const initialRenderCount = renderCount;
    act(() => { store.set(countAtom, 10); });
    expect(renderCount).toBe(initialRenderCount);
  });

  it('should support functional updates', () => {
    const countAtom = atom(10);
    const store = createStore();
    const { result } = renderHook(() => useSetAtom(countAtom, store));
    act(() => { result.current(prev => prev + 5); });
    expect(store.get(countAtom)).toBe(15);
  });

  it('should return stable setter reference', () => {
    const countAtom = atom(0);
    const store = createStore();
    const { result, rerender } = renderHook(() => useSetAtom(countAtom, store));
    const setter1 = result.current;
    rerender();
    const setter2 = result.current;
    expect(setter1).toBe(setter2);
  });

  it('should work with different stores', () => {
    const countAtom = atom(0);
    const store1 = createStore();
    const store2 = createStore();
    const { result: result1 } = renderHook(() => useSetAtom(countAtom, store1));
    const { result: result2 } = renderHook(() => useSetAtom(countAtom, store2));
    act(() => { result1.current(5); });
    expect(store1.get(countAtom)).toBe(5);
    expect(store2.get(countAtom)).toBe(0);
  });
});
```

---

## Files to Modify

- `packages/react/src/useSetAtom.ts` (NEW)
- `packages/react/index.ts` (UPDATE exports)
- `packages/react/src/__tests__/useSetAtom.test.ts` (NEW)

---

## Performance Budget

- Bundle size increase: < 150 bytes (gzipped)
- Re-render count: 0 (when atom value changes)

---

## Progress

- [ ] Create useSetAtom.ts
- [ ] Update exports
- [ ] Add tests
- [ ] Verify no re-renders on value change
