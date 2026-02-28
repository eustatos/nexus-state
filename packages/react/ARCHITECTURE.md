# @nexus-state/react - Architecture

> **Technical architecture for React integration package**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Hook Architecture](#hook-architecture)
4. [React Integration Strategy](#react-integration-strategy)
5. [Performance Optimizations](#performance-optimizations)
6. [SSR & Hydration](#ssr--hydration)
7. [Concurrent Mode Support](#concurrent-mode-support)
8. [Testing Strategy](#testing-strategy)

---

## Overview

### Purpose
Provide seamless integration between @nexus-state/core and React's rendering system.

### Core Challenge
**Problem:** React components need to re-render when atom values change, but React doesn't know about our custom state system.

**Solution:** Use React's subscription mechanism to connect atom changes to component re-renders.

### Architecture Diagram

```
┌─────────────────────────────────────────────┐
│         React Component Tree                │
└────────────────┬────────────────────────────┘
                 │
         ┌───────▼────────┐
         │   useAtom()    │
         │   (Hook)       │
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │  useSyncStore  │  ← React 18 hook
         │  (Subscription)│
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │  Nexus Store   │
         └────────────────┘
```

---

## Design Principles

### 1. Minimal Re-renders
**Principle:** Components should only re-render when their specific atoms change.

```typescript
// Bad: Re-renders on any state change
function BadComponent() {
  const allState = useAllState(); // ❌
  return <div>{allState.user.name}</div>;
}

// Good: Only re-renders when userAtom changes
function GoodComponent() {
  const user = useAtomValue(userAtom); // ✅
  return <div>{user.name}</div>;
}
```

### 2. Hooks-First
**Principle:** All APIs should be hooks (no HOCs, no render props).

```typescript
// ✅ Modern hooks API
function Component() {
  const [count, setCount] = useAtom(countAtom);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// ❌ Old-school HOC (not provided)
const Component = withAtom(countAtom)(({ count, setCount }) => {
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
});
```

### 3. Type Safety
**Principle:** Full TypeScript inference without manual type annotations.

```typescript
const countAtom = atom(0);

function Component() {
  const [count, setCount] = useAtom(countAtom);
  //      ^?      ^?
  //    number   Dispatch<SetStateAction<number>>
  //
  // Types inferred automatically!
}
```

### 4. React Conventions
**Principle:** Follow React's conventions and best practices.

```typescript
// Follow useState API
const [value, setValue] = useAtom(atom);

// Follow useReducer API for complex updates
const [state, dispatch] = useAtomReducer(atom, reducer);

// Follow useEffect for subscriptions
useAtomEffect(atom, (value) => {
  // Side effect when atom changes
});
```

---

## Hook Architecture

### Core Hook: `useAtom()`

**Implementation Strategy:**

```typescript
// High-level implementation
export function useAtom<Value>(
  atom: Atom<Value>
): [Value, SetAtom<Value>] {
  // 1. Get current value
  const value = useAtomValue(atom);
  
  // 2. Get setter function
  const setValue = useSetAtom(atom);
  
  // 3. Return tuple (like useState)
  return [value, setValue];
}
```

### Read Hook: `useAtomValue()`

**Implementation:**

```typescript
export function useAtomValue<Value>(atom: Atom<Value>): Value {
  const store = useStore();
  
  // React 18: useSyncExternalStore
  return useSyncExternalStore(
    // Subscribe function
    (callback) => {
      return store.subscribe(atom, callback);
    },
    
    // Get snapshot (client)
    () => {
      return store.get(atom);
    },
    
    // Get server snapshot (SSR)
    () => {
      return store.get(atom);
    }
  );
}
```

**Why `useSyncExternalStore`?**
- ✅ Prevents tearing in React 18 concurrent mode
- ✅ Handles SSR/hydration automatically
- ✅ Official React hook for external stores
- ✅ Optimized by React team

### Write Hook: `useSetAtom()`

**Implementation:**

```typescript
export function useSetAtom<Value>(
  atom: Atom<Value>
): SetAtom<Value> {
  const store = useStore();
  
  // Memoize setter (stable reference)
  return useCallback(
    (update: Value | ((prev: Value) => Value)) => {
      store.set(atom, update);
    },
    [store, atom]
  );
}
```

**Key Design Decision:** Return stable function reference
- Prevents unnecessary re-renders in child components
- Safe to use in dependency arrays

---

## React Integration Strategy

### Store Context Provider

**Purpose:** Provide store instance to component tree

```typescript
// Internal implementation
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ 
  children, 
  store 
}: {
  children: ReactNode;
  store?: Store;
}) {
  // Create store if not provided
  const value = useMemo(
    () => store ?? createStore(),
    [store]
  );
  
  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

// Hook to access store
export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return store;
}
```

### Multiple Stores (Isolation)

**Use Case:** Modals, tests, micro-frontends

```typescript
function App() {
  return (
    <StoreProvider> {/* Main app store */}
      <Dashboard />
      
      <Modal>
        <StoreProvider> {/* Isolated modal store */}
          <ModalContent />
        </StoreProvider>
      </Modal>
    </StoreProvider>
  );
}
```

---

## Performance Optimizations

### 1. Selector-Based Subscriptions

**Problem:** Component re-renders even when only irrelevant part of atom changed

**Solution:** Subscribe to derived value

```typescript
// Implementation
export function useAtomValue<Value, Selected>(
  atom: Atom<Value>,
  options?: {
    select?: (value: Value) => Selected;
    equals?: (a: Selected, b: Selected) => boolean;
  }
): Selected {
  const store = useStore();
  const selectFn = options?.select;
  const equalsFn = options?.equals ?? Object.is;
  
  // Memoize selector
  const selector = useCallback(
    () => {
      const value = store.get(atom);
      return selectFn ? selectFn(value) : value;
    },
    [store, atom, selectFn]
  );
  
  // Previous selected value
  const prevSelectedRef = useRef<Selected>();
  
  return useSyncExternalStore(
    (callback) => {
      return store.subscribe(atom, () => {
        // Only call callback if selected value changed
        const selected = selector();
        if (!equalsFn(selected, prevSelectedRef.current!)) {
          prevSelectedRef.current = selected;
          callback();
        }
      });
    },
    selector,
    selector
  );
}

// Usage
const userName = useAtomValue(userAtom, {
  select: (user) => user.name,
  equals: (a, b) => a === b
});
// Only re-renders when user.name changes
```

### 2. Batching Updates

**Problem:** Multiple atom updates cause multiple re-renders

**Solution:** Batch updates using React's batching

```typescript
// React 18 auto-batches, but we can force it
export function useBatchAtomUpdates() {
  const store = useStore();
  
  return useCallback((fn: () => void) => {
    // React 18: automatic batching
    startTransition(() => {
      fn();
    });
    
    // Or use store.batch if available
    store.batch?.(fn);
  }, [store]);
}

// Usage
const updateProfile = useBatchAtomUpdates();

function saveProfile() {
  updateProfile(() => {
    setFirstName('John');
    setLastName('Doe');
    setAge(30);
    // Only one re-render!
  });
}
```

### 3. Lazy Subscription

**Problem:** Subscribing to atoms on every render is expensive

**Solution:** Subscribe only once per atom

```typescript
// Internal optimization
const subscriptionCache = new WeakMap<Store, Map<Atom, Set<Callback>>>();

function subscribe(store: Store, atom: Atom, callback: Callback) {
  let storeCache = subscriptionCache.get(store);
  if (!storeCache) {
    storeCache = new Map();
    subscriptionCache.set(store, storeCache);
  }
  
  let atomSubscribers = storeCache.get(atom);
  if (!atomSubscribers) {
    atomSubscribers = new Set();
    storeCache.set(atom, atomSubscribers);
    
    // Subscribe to store only once
    store.subscribe(atom, () => {
      atomSubscribers!.forEach(cb => cb());
    });
  }
  
  atomSubscribers.add(callback);
  
  return () => {
    atomSubscribers!.delete(callback);
  };
}
```

---

## SSR & Hydration

### Server-Side Rendering

**Challenge:** Store must exist on server and client

**Solution:** Create store per request on server, hydrate on client

```typescript
// Server (Next.js example)
export async function getServerSideProps() {
  const store = createStore();
  
  // Pre-populate atoms
  store.set(userAtom, await fetchUser());
  
  return {
    props: {
      initialState: store.getState()
    }
  };
}

// Component
export default function Page({ initialState }) {
  return (
    <StoreProvider initialState={initialState}>
      <App />
    </StoreProvider>
  );
}
```

### Hydration Strategy

```typescript
export function StoreProvider({ 
  children, 
  initialState 
}: {
  children: ReactNode;
  initialState?: StateSnapshot;
}) {
  const store = useMemo(() => {
    const s = createStore();
    
    // Hydrate state from server
    if (initialState) {
      s.setState(initialState);
    }
    
    return s;
  }, []);
  
  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
}
```

### SSR Snapshot Function

```typescript
export function useAtomValue<Value>(atom: Atom<Value>): Value {
  const store = useStore();
  
  return useSyncExternalStore(
    (callback) => store.subscribe(atom, callback),
    
    // Client snapshot
    () => store.get(atom),
    
    // Server snapshot (same for now)
    () => store.get(atom)
  );
}
```

---

## Concurrent Mode Support

### The Tearing Problem

**What is Tearing?**
```
Time: ─────────────────────────────────→
      
State:  ┌─ 0 ─┬─ 1 ─┐
        │      │      │
Render1 │  0   │      │  Component A sees value=0
Render2 │      │  1   │  Component B sees value=1
        │      │      │
Result: └──────┴──────┘  Inconsistent UI! (tearing)
```

**Solution:** `useSyncExternalStore` prevents tearing
- Ensures all components see same snapshot during render
- React re-renders components if store changes mid-render

### Transition Support

```typescript
// Low-priority updates (don't block UI)
export function useAtomTransition<Value>(
  atom: Atom<Value>
): [Value, (update: Value) => void, boolean] {
  const [isPending, startTransition] = useTransition();
  const value = useAtomValue(atom);
  const setValue = useSetAtom(atom);
  
  const setValueTransition = useCallback(
    (update: Value) => {
      startTransition(() => {
        setValue(update);
      });
    },
    [setValue]
  );
  
  return [value, setValueTransition, isPending];
}

// Usage
const [searchQuery, setSearchQuery, isSearching] = useAtomTransition(searchAtom);
```

---

## Testing Strategy

### Unit Tests

**Test each hook independently:**

```typescript
import { renderHook, act } from '@testing-library/react';

describe('useAtom', () => {
  it('should return current value', () => {
    const countAtom = atom(0);
    const { result } = renderHook(() => useAtom(countAtom), {
      wrapper: ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
    });
    
    expect(result.current[0]).toBe(0);
  });
  
  it('should update value', () => {
    const countAtom = atom(0);
    const { result } = renderHook(() => useAtom(countAtom), {
      wrapper: ({ children }) => (
        <StoreProvider>{children}</StoreProvider>
      )
    });
    
    act(() => {
      result.current[1](1);
    });
    
    expect(result.current[0]).toBe(1);
  });
});
```

### Integration Tests

**Test with actual components:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}

test('counter increments', () => {
  render(
    <StoreProvider>
      <Counter />
    </StoreProvider>
  );
  
  const button = screen.getByText('Count: 0');
  fireEvent.click(button);
  
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### SSR Tests

**Test server rendering:**

```typescript
import { renderToString } from 'react-dom/server';

test('SSR renders correctly', () => {
  const store = createStore();
  store.set(userAtom, { name: 'John' });
  
  const html = renderToString(
    <StoreProvider store={store}>
      <UserProfile />
    </StoreProvider>
  );
  
  expect(html).toContain('John');
});
```

---

## Appendix

### A. Hook Comparison with React APIs

| Nexus Hook | React Equivalent | Notes |
|------------|------------------|-------|
| `useAtom()` | `useState()` | Same API signature |
| `useAtomValue()` | Read from `useState()` | Read-only |
| `useSetAtom()` | Write from `useState()` | Write-only |
| `useAtomCallback()` | `useCallback()` | Access atoms without re-render |
| `useAtomEffect()` | `useEffect()` | React to atom changes |

### B. Performance Benchmarks

**Target metrics:**
- Hook call overhead: <0.1ms
- Subscription setup: <0.2ms
- Re-render trigger: <0.1ms

**Actual performance (as of v0.1.5):**
- Hook call overhead: ~0.15ms ⚠️
- Subscription setup: ~0.25ms ⚠️
- Re-render trigger: ~0.2ms ⚠️

**Optimization priorities:**
1. Reduce subscription overhead
2. Optimize `useAtomValue` with selectors
3. Cache hook instances

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-26  
**Maintained By:** React Team  
**Review Schedule:** Quarterly

---

> 📚 **Related Documentation:**
> - [Roadmap](./ROADMAP.md) - Future plans
> - [Core Architecture](../core/ARCHITECTURE.md) - Core package details
> - [React Guide](../../docs/api/react.md) - Public API
