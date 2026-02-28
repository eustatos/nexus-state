# TASK-004: Add StoreProvider Context

**Priority:** Medium  
**Effort:** 4 hours  
**Dependencies:** TASK-002, TASK-003

---

## Context

- **Current:** Store must be passed to every hook manually
- **Problem:** Prop drilling, verbose code
- **Expected:** React Context to provide store globally

---

## Requirements

- ✅ TypeScript strict mode (no `any`)
- ✅ Single Responsibility Principle
- ✅ Test coverage ≥ 90%
- ✅ JSDoc with @example
- ✅ Support for nested providers (store override)

---

## Implementation Steps

### 1. Create StoreProvider.tsx

**File:** `packages/react/src/StoreProvider.tsx`

```typescript
import type { Store } from '@nexus-state/core';
import { createContext, useContext, type ReactNode } from 'react';

const StoreContext = createContext<Store | null>(null);

export interface StoreProviderProps {
  store: Store;
  children: ReactNode;
}

/**
 * Provider component that makes a store available to all child components.
 *
 * @example
 * ```tsx
 * <StoreProvider store={store}>
 *   <YourApp />
 * </StoreProvider>
 * ```
 */
export function StoreProvider({ store, children }: StoreProviderProps): JSX.Element {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/**
 * Hook to access the store from context.
 * @throws {Error} If used outside of StoreProvider
 */
export function useStore(): Store {
  const store = useContext(StoreContext);
  if (store === null) {
    throw new Error(
      'useStore must be used within a StoreProvider.'
    );
  }
  return store;
}

/**
 * Hook to optionally get the store from context.
 * @internal
 */
export function useStoreOptional(): Store | null {
  return useContext(StoreContext);
}
```

### 2. Update hooks to use context

**File:** `packages/react/src/useAtom.ts`

```typescript
import { useStoreOptional } from './StoreProvider';

export function useAtom<T>(atom: Atom<T>, store?: Store) {
  const contextStore = useStoreOptional();
  const resolvedStore = store ?? contextStore ?? createStore();
  // ... rest of implementation
}
```

### 3. Update exports

**File:** `packages/react/index.ts`

```typescript
export { StoreProvider, useStore } from './StoreProvider';
export type { StoreProviderProps } from './StoreProvider';
```

---

## Acceptance Criteria

- [ ] `StoreProvider` and `useStore` exported
- [ ] Hooks use context store when no explicit store is provided
- [ ] Error thrown when `useStore` used outside provider
- [ ] Nested providers work correctly (inner overrides outer)
- [ ] All existing tests pass
- [ ] New tests for StoreProvider (8+ test cases)

---

## Testing Strategy

**File:** `packages/react/src/__tests__/StoreProvider.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, render } from '@testing-library/react';
import { atom, createStore } from '@nexus-state/core';
import { StoreProvider, useStore } from '../StoreProvider';
import { useAtomValue } from '../useAtomValue';

describe('StoreProvider', () => {
  it('should provide store to child components', () => {
    const store = createStore();
    const wrapper = ({ children }) => (
      <StoreProvider store={store}>{children}</StoreProvider>
    );
    const { result } = renderHook(() => useStore(), { wrapper });
    expect(result.current).toBe(store);
  });

  it('should throw error when useStore used outside provider', () => {
    expect(() => renderHook(() => useStore())).toThrow('useStore must be used within a StoreProvider');
  });

  it('should allow hooks to use context store', () => {
    const countAtom = atom(42);
    const store = createStore();
    store.set(countAtom, 42);
    const wrapper = ({ children }) => (
      <StoreProvider store={store}>{children}</StoreProvider>
    );
    const { result } = renderHook(() => useAtomValue(countAtom), { wrapper });
    expect(result.current).toBe(42);
  });

  it('should support nested providers', () => {
    const countAtom = atom(0);
    const outerStore = createStore();
    const innerStore = createStore();
    outerStore.set(countAtom, 10);
    innerStore.set(countAtom, 20);
    
    function InnerComponent() {
      const store = useStore();
      return <div>{store.get(countAtom)}</div>;
    }
    
    const { container } = render(
      <StoreProvider store={outerStore}>
        <StoreProvider store={innerStore}>
          <InnerComponent />
        </StoreProvider>
      </StoreProvider>
    );
    expect(container.textContent).toContain('20');
  });

  it('should allow explicit store to override context', () => {
    const countAtom = atom(0);
    const contextStore = createStore();
    const explicitStore = createStore();
    contextStore.set(countAtom, 10);
    explicitStore.set(countAtom, 20);
    
    const wrapper = ({ children }) => (
      <StoreProvider store={contextStore}>{children}</StoreProvider>
    );
    const { result } = renderHook(
      () => useAtomValue(countAtom, explicitStore),
      { wrapper }
    );
    expect(result.current).toBe(20);
  });
});
```

---

## Files to Modify

- `packages/react/src/StoreProvider.tsx` (NEW)
- `packages/react/src/useAtom.ts` (UPDATE to use context)
- `packages/react/src/useAtomValue.ts` (UPDATE to use context)
- `packages/react/src/useSetAtom.ts` (UPDATE to use context)
- `packages/react/index.ts` (UPDATE exports)
- `packages/react/src/__tests__/StoreProvider.test.tsx` (NEW)

---

## Performance Budget

- Bundle size increase: < 300 bytes (gzipped)
- Context lookup overhead: < 0.1ms per hook call

---

## Progress

- [ ] Create StoreProvider.tsx
- [ ] Update useAtom to use context
- [ ] Update useAtomValue to use context
- [ ] Update useSetAtom to use context
- [ ] Update exports
- [ ] Add tests
