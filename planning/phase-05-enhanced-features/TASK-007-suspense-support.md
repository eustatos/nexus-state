# TASK-007: Add Suspense Support for Async Atoms

**Priority:** Medium
**Effort:** 6 hours
**Dependencies:** TASK-002, TASK-004
**Phase:** Phase 05 - Enhanced Features

---

## Context

- **Current:** No built-in async atom support
- **Problem:** Users must manually handle loading states
- **Expected:** React 18 Suspense integration for async atoms

---

## Requirements

- ✅ TypeScript strict mode
- ✅ Single Responsibility Principle
- ✅ Test coverage ≥ 95%
- ✅ React 18+ Suspense compatibility
- ✅ Error boundaries integration

---

## Implementation Steps

### 1. Create useAtomSuspense.ts

**File:** `packages/react/src/useAtomSuspense.ts`

```typescript
import type { Atom, Store } from '@nexus-state/core';
import { useAtomValue } from './useAtomValue';

/**
 * Hook to read an atom's value with React Suspense support.
 * If the atom's value is a Promise, this hook will suspend.
 *
 * @example
 * ```tsx
 * const userAtom = atom(async () => {
 *   const response = await fetch('/api/user');
 *   return response.json();
 * });
 *
 * function UserProfile() {
 *   const user = useAtomSuspense(userAtom);
 *   return <div>{user.name}</div>;
 * }
 *
 * // Parent
 * <Suspense fallback={<div>Loading...</div>}>
 *   <UserProfile />
 * </Suspense>
 * ```
 */
export function useAtomSuspense<T>(atom: Atom<T>, store?: Store): T {
  const value = useAtomValue(atom, store);

  if (value instanceof Promise) {
    throw value;
  }

  if (value instanceof Error) {
    throw value;
  }

  return value;
}

/**
 * Async atom status.
 */
export type AsyncAtomStatus = 'loading' | 'success' | 'error';

/**
 * Result of an async atom with status.
 */
export interface AsyncAtomResult<T> {
  status: AsyncAtomStatus;
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Hook to read an async atom's value with loading/error states.
 * Alternative to useAtomSuspense for manual state handling.
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError } = useAtomAsync(userAtom);
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (isError) return <div>Error!</div>;
 * return <div>{data?.name}</div>;
 * ```
 */
export function useAtomAsync<T>(
  atom: Atom<T | Promise<T>>,
  store?: Store
): AsyncAtomResult<T> {
  const value = useAtomValue(atom, store);

  if (value instanceof Promise) {
    return {
      status: 'loading',
      data: undefined,
      error: undefined,
      isLoading: true,
      isSuccess: false,
      isError: false
    };
  }

  if (value instanceof Error) {
    return {
      status: 'error',
      data: undefined,
      error: value,
      isLoading: false,
      isSuccess: false,
      isError: true
    };
  }

  return {
    status: 'success',
    data: value,
    error: undefined,
    isLoading: false,
    isSuccess: true,
    isError: false
  };
}
```

### 2. Update exports

**File:** `packages/react/index.ts`

```typescript
export { useAtomSuspense, useAtomAsync } from './useAtomSuspense';
export type { AsyncAtomResult, AsyncAtomStatus } from './useAtomSuspense';
```

---

## Acceptance Criteria

- [ ] `useAtomSuspense` suspends component when value is Promise
- [ ] `useAtomAsync` returns loading/error states
- [ ] Error boundaries catch errors correctly
- [ ] TypeScript inference works for async atoms
- [ ] All tests pass with React 18 Suspense
- [ ] New tests for async atoms (10+ test cases)

---

## Testing Strategy

**File:** `packages/react/src/__tests__/useAtomSuspense.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { atom, createStore } from '@nexus-state/core';
import { StoreProvider } from '../StoreProvider';
import { useAtomSuspense } from '../useAtomSuspense';

describe('useAtomSuspense', () => {
  it('should suspend when atom value is a Promise', async () => {
    const asyncAtom = atom(Promise.resolve('async value'));
    const store = createStore();

    function AsyncComponent() {
      const value = useAtomSuspense(asyncAtom, store);
      return <div>{value}</div>;
    }

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncComponent />
      </Suspense>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('async value')).toBeInTheDocument();
    });
  });

  it('should throw errors for ErrorBoundary', async () => {
    const errorAtom = atom(Promise.reject(new Error('Test error')));
    const store = createStore();

    function AsyncComponent() {
      const value = useAtomSuspense(errorAtom, store);
      return <div>{value}</div>;
    }

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncComponent />
      </Suspense>
    );

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});
```

---

## Files to Modify

- `packages/react/src/useAtomSuspense.ts` (NEW)
- `packages/react/index.ts` (UPDATE exports)
- `packages/react/src/__tests__/useAtomSuspense.test.tsx` (NEW)

---

## Performance Budget

- Bundle size increase: < 500 bytes (gzipped)
- No performance impact on sync atoms

---

## Progress

- [ ] Create useAtomSuspense.ts
- [ ] Add useAtomAsync hook
- [ ] Update exports
- [ ] Add tests
- [ ] Verify Suspense integration
