# @nexus-state/react - Roadmap

> **React integration package roadmap - hooks and utilities**

---

## 📦 Package Overview

**Current Version:** 0.1.5  
**Status:** Pre-release (unstable API)  
**Maintainer:** Nexus State Team  
**Last Updated:** 2026-02-26

### Purpose
React bindings for @nexus-state/core - hooks, context providers, and React-specific utilities.

### Dependencies
- `@nexus-state/core`: workspace:*
- `react`: ^18.2.0 (peer dependency)

---

## 🎯 Current State (v0.1.5)

### ✅ What Works
- `useAtom(atom)` - Read and write atom values
- `useAtomValue(atom)` - Read-only hook
- `useSetAtom(atom)` - Write-only hook
- Automatic re-renders on atom changes
- Store context provider
- Basic TypeScript support

### ⚠️ Known Issues
- No React 18 concurrent mode support (tearing possible)
- No Suspense integration
- SSR hydration warnings in some cases
- Missing React DevTools integration
- No error boundaries for async atoms

### 📊 Metrics
| Metric | Current | Target v1.0 |
|--------|---------|-------------|
| Bundle Size | ~2KB | <1.5KB |
| Re-render Overhead | ~0.2ms | <0.1ms |
| Hook Tests | 15 tests | 50+ tests |
| TypeScript Coverage | 90% | 100% |

---

## 🗓️ Roadmap by Version

---

## v0.2.0 - React 18 Support

**Target:** March 31, 2026  
**Focus:** Modern React features

### Goals
- Full React 18 compatibility
- Concurrent mode support (no tearing)
- Better SSR/hydration

### Features

#### 🔄 Concurrent Mode Support
```typescript
// Use useSyncExternalStore under the hood
export function useAtom<Value>(atom: Atom<Value>) {
  return useSyncExternalStore(
    (callback) => store.subscribe(atom, callback),
    () => store.get(atom),
    () => store.get(atom) // Server snapshot
  );
}
```

#### 🌊 Suspense Integration (Basic)
```typescript
// Throw promise for async atoms
function useAtomValue<Value>(atom: Atom<Value>) {
  const value = store.get(atom);
  
  if (value instanceof Promise) {
    throw value; // Suspense boundary catches this
  }
  
  return value;
}

// Usage
function UserProfile() {
  return (
    <Suspense fallback={<Spinner />}>
      <UserData />
    </Suspense>
  );
}

function UserData() {
  const user = useAtomValue(asyncUserAtom); // Suspends if loading
  return <div>{user.name}</div>;
}
```

#### 🔧 SSR Improvements
```typescript
// Server-side store provider
export function ServerStoreProvider({ 
  children, 
  initialValues 
}: {
  children: React.ReactNode;
  initialValues?: Map<Atom, any>;
}) {
  const store = useMemo(() => {
    const s = createStore();
    initialValues?.forEach((value, atom) => {
      s.set(atom, value);
    });
    return s;
  }, []);
  
  return <StoreProvider store={store}>{children}</StoreProvider>;
}
```

### Breaking Changes
- Minimum React version: 18.0.0
- `useAtom` signature slightly changed for SSR

---

## v1.0.0 - Production Ready

**Target:** June 30, 2026  
**Focus:** Enterprise-grade React integration

### Goals
- API stability (frozen for 12+ months)
- Full React ecosystem support
- Production battle-tested

### Features

#### 🎯 Hook Variants
```typescript
// Read-only (prevents accidental writes)
const count = useAtomValue(countAtom);

// Write-only (optimization for setters)
const setCount = useSetAtom(countAtom);

// Read + Write (original)
const [count, setCount] = useAtom(countAtom);

// With custom equality
const user = useAtomValue(userAtom, {
  equals: (prev, next) => prev.id === next.id
});

// With selector (prevent unnecessary re-renders)
const userName = useAtomValue(userAtom, {
  select: (user) => user.name
});
```

#### 🔥 Performance Hooks
```typescript
// Batch multiple atom updates
const updateProfile = useBatchAtomUpdates(() => {
  setFirstName('John');
  setLastName('Doe');
  setAge(30);
  // Component re-renders once
});

// Debounced atom writes
const setSearchQuery = useDebounceSetAtom(searchAtom, 300);

// Throttled atom writes
const setScrollPosition = useThrottleSetAtom(scrollAtom, 100);
```

#### 🧩 Atom Families Hooks
```typescript
// Use atom from family
const todo = useAtomValue(todoFamily(todoId));

// Use multiple atoms from family
const todos = useAtomFamily(todoFamily, [1, 2, 3]);
// Returns: [todo1, todo2, todo3]

// Create atom on mount, cleanup on unmount
const tempAtom = useTemporaryAtom(() => atom(0));
```

#### 🎨 Computed Atom Hooks
```typescript
// Create computed atom inline
const fullName = useComputedAtom(
  () => `${firstName} ${lastName}`,
  [firstName, lastName]
);

// With custom equality
const sortedItems = useComputedAtom(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items],
  { equals: shallowEqual }
);
```

#### 🔌 Context & Providers
```typescript
// Nested store providers (for isolation)
function App() {
  return (
    <StoreProvider>
      <Dashboard />
      <StoreProvider> {/* Isolated store for modal */}
        <Modal />
      </StoreProvider>
    </StoreProvider>
  );
}

// Access parent store
const parentStore = useParentStore();

// Access current store
const store = useStore();
```

### API Additions
- `useAtomCallback` - Access atoms in callbacks without re-renders
- `useAtomSnapshot` - Get snapshot of multiple atoms
- `useHydrateAtoms` - Hydrate atoms on mount (SSR)
- `useResetAtom` - Reset atom to initial value

---

## v1.1.0 - Advanced Features

**Target:** September 30, 2026  
**Focus:** Developer experience and advanced patterns

### Features

#### ⚛️ React DevTools Integration
```typescript
// Atoms visible in React DevTools
<StoreProvider devtools={true}>
  <App />
</StoreProvider>

// In React DevTools:
// Components > MyComponent > Hooks
//   ⚛︎ Atom(countAtom): 5
//   ⚛︎ Atom(userAtom): { name: "John" }
```

#### 🚨 Error Boundaries for Atoms
```typescript
// Catch errors in atom getters
function ErrorBoundary({ children }) {
  return (
    <AtomErrorBoundary
      fallback={(error, reset) => (
        <div>
          Error: {error.message}
          <button onClick={reset}>Retry</button>
        </div>
      )}
    >
      {children}
    </AtomErrorBoundary>
  );
}

// Usage with async atom
function UserProfile() {
  const user = useAtomValue(asyncUserAtom); // Errors caught by boundary
  return <div>{user.name}</div>;
}
```

#### 🎭 Suspense + Error Boundaries Combined
```typescript
// Single component for loading + error states
<AtomBoundary
  fallback={<Loading />}
  errorFallback={<Error />}
>
  <UserProfile />
</AtomBoundary>
```

#### 🧪 Testing Utilities
```typescript
import { renderWithStore, waitForAtom } from '@nexus-state/react/testing';

test('user profile', async () => {
  const { getByText } = renderWithStore(
    <UserProfile />,
    {
      initialValues: new Map([[userAtom, mockUser]])
    }
  );
  
  await waitForAtom(asyncUserAtom);
  
  expect(getByText('John Doe')).toBeInTheDocument();
});
```

#### 🎯 Scope Atoms to Components
```typescript
// Atom only exists while component is mounted
function Counter() {
  const [count, setCount] = useScopedAtom(
    () => atom(0),
    [] // Dependencies
  );
  
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Performance Optimizations
- Micro-task batching for updates
- Automatic subscription cleanup
- Memoization of atom selectors
- Lazy hook evaluation

---

## v1.2.0 - React Server Components

**Target:** December 31, 2026  
**Focus:** Next.js App Router and RSC

### Features

#### 🌐 Server Components Support
```typescript
// app/page.tsx (Server Component)
import { getServerAtomValue } from '@nexus-state/react/server';

export default async function Page() {
  const user = await getServerAtomValue(userAtom);
  
  return <UserProfile user={user} />;
}

// Client component can subscribe to changes
'use client';
export function UserProfile({ user: initialUser }) {
  const user = useAtomValue(userAtom, { initialValue: initialUser });
  return <div>{user.name}</div>;
}
```

#### 🔄 Server Actions Integration
```typescript
'use server';
export async function updateUser(formData: FormData) {
  const store = await getServerStore();
  store.set(userAtom, {
    name: formData.get('name'),
    email: formData.get('email')
  });
  revalidatePath('/profile');
}
```

#### 🎨 Streaming SSR
```typescript
// Stream atom updates to client
export function StreamingProvider({ children }) {
  return (
    <StoreProvider streaming={true}>
      {children}
    </StoreProvider>
  );
}
```

---

## v2.0.0 - Next Generation

**Target:** Q2 2027  
**Status:** Vision / Exploration

### Potential Features

#### 🤖 AI-Powered Hooks
```typescript
// Auto-suggest optimizations
const [count, setCount] = useAtom(countAtom);
// Warning: This hook causes 47 unnecessary re-renders.
// Suggestion: Use useAtomValue + useSetAtom separately.

// Auto-detect memory leaks
useEffect(() => {
  const unsub = store.subscribe(atom, callback);
  // Missing: return unsub;
  // AI Warning: Subscription leak detected!
}, []);
```

#### 🎯 Smart Selectors
```typescript
// Auto-memoized based on usage patterns
const userName = useSmartSelector(
  userAtom,
  (user) => user.name
  // Auto-detects if user.name changes frequently
  // and adjusts memoization strategy
);
```

#### 🔥 Hot Module Replacement
```typescript
// Preserve atom state during HMR
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    // Atom values preserved across reloads
  });
}
```

---

## 🚫 Non-Goals

### Will NOT Support
- ❌ React < 18.0 (use v0.1.x for older React)
- ❌ Class components (hooks only)
- ❌ Redux compatibility layer
- ❌ Built-in form handling (use dedicated form library)

### Design Principles
1. **Hooks-first** - Modern React patterns
2. **Performance** - Minimal re-renders
3. **Type-safe** - Full TypeScript inference
4. **React-native** - All features work in RN
5. **Tree-shakeable** - Only import what you use

---

## 📊 Success Metrics

### Quality Gates (must pass for each release)

#### v1.0.0
- [ ] 100% hook tests passing
- [ ] <1.5KB bundle size
- [ ] Zero re-render overhead
- [ ] Full TypeScript coverage
- [ ] React 18 concurrent mode tested
- [ ] SSR hydration tested

#### v1.5.0
- [ ] <1KB bundle size
- [ ] React DevTools integration
- [ ] Server Components support
- [ ] 50+ tests

#### v2.0.0
- [ ] AI-powered warnings
- [ ] Auto-optimization
- [ ] 100+ tests

---

## 🔬 Framework-Specific Optimizations

### Next.js
```typescript
// app/providers.tsx
'use client';
export function Providers({ children }) {
  return (
    <StoreProvider
      ssr={true}
      streaming={true}
      devtools={process.env.NODE_ENV === 'development'}
    >
      {children}
    </StoreProvider>
  );
}
```

### Remix
```typescript
// app/root.tsx
export function Root() {
  const loaderData = useLoaderData();
  
  return (
    <StoreProvider
      initialValues={new Map([
        [userAtom, loaderData.user],
        [settingsAtom, loaderData.settings]
      ])}
    >
      <Outlet />
    </StoreProvider>
  );
}
```

### React Native
```typescript
// All hooks work in React Native
function TodoApp() {
  const [todos, setTodos] = useAtom(todosAtom);
  
  return (
    <FlatList
      data={todos}
      renderItem={({ item }) => <TodoItem todo={item} />}
    />
  );
}
```

---

## 🐛 Bug Triage Priority

### P0 - Critical
- Concurrent mode tearing
- Memory leaks
- SSR hydration mismatches
- TypeScript errors

### P1 - High
- Unnecessary re-renders
- Suspense edge cases
- DevTools integration bugs
- Error boundary issues

### P2 - Medium
- Hook optimization opportunities
- Better error messages
- Documentation gaps
- Testing utility improvements

### P3 - Low
- Nice-to-have hooks
- Additional utilities
- Performance micro-optimizations

---

## 📞 Contributing to React Package

### How to Propose Features
1. Check this roadmap
2. Open GitHub Discussion with "React: " prefix
3. Provide React-specific use case
4. Wait for maintainer feedback

### Testing Requirements
- All hooks must have tests
- SSR scenarios must be tested
- React 18 concurrent mode must be tested
- TypeScript types must be validated

---

## 🔗 Related Packages

### Dependencies
- `@nexus-state/core` - Core state management

### Complementary Packages
- `@nexus-state/devtools` - Redux DevTools integration
- `@nexus-state/async` - Async atom utilities
- `@nexus-state/persist` - State persistence

### Framework Alternatives
- `@nexus-state/vue` - Vue integration
- `@nexus-state/svelte` - Svelte integration

---

## 📚 Resources

### Documentation
- [React Guide](../../docs/api/react.md)
- [Examples](../../docs/examples/)
- [Migration from Redux](../../docs/migration/)

### Community
- [GitHub Discussions](https://github.com/eustatos/nexus-state/discussions)
- [Discord #react Channel](https://discord.gg/nexus-state)

---

**Roadmap Owner:** React Team  
**Review Cadence:** Monthly  
**Next Review:** 2026-03-26

---

> 💡 **Feedback Welcome:** Using Nexus State with React? Share your experience in [GitHub Discussions](https://github.com/eustatos/nexus-state/discussions)!
