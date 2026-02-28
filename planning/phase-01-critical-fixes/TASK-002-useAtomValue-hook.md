# TASK-002: Add useAtomValue Hook (Read-Only)

**Priority:** High  
**Effort:** 3 hours  
**Dependencies:** None

---

## Context

- **Current:** Users must destructure `useAtom` even for read-only access
- **Problem:** Unnecessary re-renders when setter reference changes
- **Expected:** Dedicated read-only hook like Jotai's `useAtomValue`

---

## Requirements

- ✅ TypeScript strict mode (no `any`, no `unknown` unless necessary)
- ✅ Single Responsibility Principle
- ✅ Test coverage ≥ 95%
- ✅ JSDoc with @example
- ✅ Performance: Zero unnecessary re-renders

---

## Implementation Steps

### 1. Create useAtomValue.ts

**File:** `packages/react/src/useAtomValue.ts`

```typescript
import type { Atom, Store } from '@nexus-state/core';
import { useAtom } from './useAtom';

/**
 * Hook to read an atom's value without a setter function.
 * Use this when you only need to read the value and don't need to update it.
 *
 * @template T - The type of the atom's value
 * @param atom - The atom to read
 * @param store - Optional store instance (defaults to auto-created store)
 * @returns The current value of the atom
 *
 * @example
 * ```tsx
 * const count = useAtomValue(countAtom, store);
 * return <div>Count: {count}</div>;
 * ```
 */
export function useAtomValue<T>(atom: Atom<T>, store?: Store): T {
  const [value] = useAtom(atom, store);
  return value;
}
```

### 2. Update exports

**File:** `packages/react/index.ts`

```typescript
export { useAtom } from './useAtom';
export { useAtomValue } from './useAtomValue';
```

### 3. Split index.ts

**File:** `packages/react/src/useAtom.ts` (move existing implementation here)

---

## Acceptance Criteria

- [ ] `useAtomValue` exported from `@nexus-state/react`
- [ ] TypeScript inference works correctly
- [ ] No unnecessary re-renders (verify with React DevTools Profiler)
- [ ] All existing tests pass
- [ ] New tests for `useAtomValue` (6+ test cases)

---

## Testing Strategy

**File:** `packages/react/src/__tests__/useAtomValue.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { atom, createStore } from '@nexus-state/core';
import { useAtomValue } from '../useAtomValue';

describe('useAtomValue', () => {
  it('should return the initial value', () => {
    const countAtom = atom(0);
    const store = createStore();
    const { result } = renderHook(() => useAtomValue(countAtom, store));
    expect(result.current).toBe(0);
  });

  it('should update when atom value changes externally', () => {
    const countAtom = atom(0);
    const store = createStore();
    const { result } = renderHook(() => useAtomValue(countAtom, store));
    act(() => { store.set(countAtom, 5); });
    expect(result.current).toBe(5);
  });

  it('should work with computed atoms', () => {
    const baseAtom = atom(10);
    const doubleAtom = atom((get) => get(baseAtom) * 2);
    const store = createStore();
    const { result } = renderHook(() => useAtomValue(doubleAtom, store));
    expect(result.current).toBe(20);
    act(() => { store.set(baseAtom, 15); });
    expect(result.current).toBe(30);
  });

  it('should handle multiple atoms independently', () => {
    const atom1 = atom(1);
    const atom2 = atom(2);
    const store = createStore();
    const { result: result1 } = renderHook(() => useAtomValue(atom1, store));
    const { result: result2 } = renderHook(() => useAtomValue(atom2, store));
    act(() => { store.set(atom1, 10); });
    expect(result1.current).toBe(10);
    expect(result2.current).toBe(2);
  });
});
```

---

## Files to Modify

- `packages/react/src/useAtomValue.ts` (NEW)
- `packages/react/src/useAtom.ts` (MOVE from index.ts)
- `packages/react/index.ts` (UPDATE exports)
- `packages/react/index.test.ts` (UPDATE imports)
- `packages/react/src/__tests__/useAtomValue.test.ts` (NEW)

---

## Performance Budget

- Bundle size increase: < 200 bytes (gzipped)
- Re-render count: Same as `useAtom` for read operations

---

## Progress

- [ ] Create useAtomValue.ts
- [ ] Move useAtom to separate file
- [ ] Update exports
- [ ] Add tests
- [ ] Verify no unnecessary re-renders
