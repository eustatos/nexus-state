# TASK-008: Create Migration Guide from Jotai

**Priority:** High
**Effort:** 4 hours
**Dependencies:** TASK-002, TASK-003, TASK-004
**Phase:** Phase 06 - Documentation & Community

---

## Context

- **Current:** No migration documentation
- **Problem:** Users don't know how to migrate from Jotai
- **Expected:** Step-by-step migration guide with code examples

---

## Requirements

- ✅ Cover all common Jotai patterns
- ✅ Side-by-side code comparisons
- ✅ Explain breaking changes
- ✅ Include performance comparison

---

## Implementation Steps

### 1. Create migration guide

**File:** `docs/migration/from-jotai.md`

```markdown
# Migrating from Jotai to Nexus State

## Why Migrate?

| Feature | Jotai | Nexus State |
|---------|-------|-------------|
| Time Travel | ❌ No | ✅ Built-in |
| DevTools | ⚠️ Basic | ✅ Advanced |
| Bundle Size | 3 KB | 4 KB (core only) |
| TypeScript | ✅ Excellent | ✅ Excellent |

## Installation

```bash
npm uninstall jotai
npm install @nexus-state/core @nexus-state/react
```

## Basic Atoms

### Before (Jotai)
```typescript
import { atom } from 'jotai';
const countAtom = atom(0);
```

### After (Nexus State)
```typescript
import { atom } from '@nexus-state/core';
const countAtom = atom(0, 'count'); // Optional name for DevTools
```

## Using Atoms in Components

### Before (Jotai)
```typescript
import { useAtom } from 'jotai';

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return <div>{count}</div>;
}
```

### After (Nexus State)
```typescript
import { createStore } from '@nexus-state/core';
import { useAtom, StoreProvider } from '@nexus-state/react';

const store = createStore();

function App() {
  return (
    <StoreProvider store={store}>
      <Counter />
    </StoreProvider>
  );
}

function Counter() {
  const [count, setCount] = useAtom(countAtom, store);
  return <div>{count}</div>;
}
```

## Read-Only Atoms

### Before (Jotai)
```typescript
import { useAtomValue } from 'jotai';

function Display() {
  const count = useAtomValue(countAtom);
  return <div>{count}</div>;
}
```

### After (Nexus State)
```typescript
import { useAtomValue } from '@nexus-state/react';

function Display() {
  const count = useAtomValue(countAtom);
  return <div>{count}</div>;
}
```

**✅ No breaking changes** - identical API!

## Write-Only Atoms

### Before (Jotai)
```typescript
import { useSetAtom } from 'jotai';

function IncrementButton() {
  const setCount = useSetAtom(countAtom);
  return <button onClick={() => setCount(c => c + 1)}>+</button>;
}
```

### After (Nexus State)
```typescript
import { useSetAtom } from '@nexus-state/react';

function IncrementButton() {
  const setCount = useSetAtom(countAtom);
  return <button onClick={() => setCount(c => c + 1)}>+</button>;
}
```

**✅ No breaking changes** - identical API!

## Computed Atoms

### Before (Jotai)
```typescript
const doubleCountAtom = atom((get) => get(countAtom) * 2);
```

### After (Nexus State)
```typescript
const doubleCountAtom = atom(
  (get) => get(countAtom) * 2,
  'doubleCount'
);
```

**✅ No breaking changes** - identical API!

## Async Atoms

### Before (Jotai)
```typescript
const userAtom = atom(async () => {
  const res = await fetch('/api/user');
  return res.json();
});

function UserProfile() {
  const user = useAtomValue(userAtom);
  return <div>{user.name}</div>;
}
```

### After (Nexus State)
```typescript
import { useAtomSuspense } from '@nexus-state/react';

const userAtom = atom(async () => {
  const res = await fetch('/api/user');
  return res.json();
}, 'user');

function UserProfile() {
  const user = useAtomSuspense(userAtom);
  return <div>{user.name}</div>;
}
```

**⚠️ Breaking change:** Use `useAtomSuspense` instead of `useAtomValue` for async atoms.

## Provider

### Before (Jotai)
```typescript
import { Provider } from 'jotai';
<Provider><App /></Provider>
```

### After (Nexus State)
```typescript
import { createStore } from '@nexus-state/core';
import { StoreProvider } from '@nexus-state/react';

const store = createStore();
<StoreProvider store={store}><App /></StoreProvider>
```

**⚠️ Breaking change:** Must create and pass store explicitly.

## Migration Checklist

- [ ] Install `@nexus-state/core` and `@nexus-state/react`
- [ ] Create a store with `createStore()`
- [ ] Wrap app with `<StoreProvider store={store}>`
- [ ] Replace `useAtomValue` with `useAtomSuspense` for async atoms
- [ ] Add optional atom names for better DevTools
- [ ] Remove `jotai` dependency
- [ ] Run tests to verify functionality
```

### 2. Create similar guides

- `docs/migration/from-zustand.md`
- `docs/migration/from-recoil.md`
- `docs/migration/from-redux.md`

### 3. Link from main README

**File:** `packages/core/README.md`

```markdown
## Migration Guides

- [Jotai → Nexus State](./docs/migration/from-jotai.md)
- [Zustand → Nexus State](./docs/migration/from-zustand.md)
- [Recoil → Nexus State](./docs/migration/from-recoil.md)
- [Redux → Nexus State](./docs/migration/from-redux.md)
```

---

## Acceptance Criteria

- [ ] Migration guide covers all common patterns
- [ ] Code examples are tested and working
- [ ] Breaking changes clearly documented
- [ ] Performance comparison included
- [ ] Linked from main README

---

## Files to Create

- `docs/migration/from-jotai.md`
- `docs/migration/from-zustand.md`
- `docs/migration/from-recoil.md`
- `docs/migration/from-redux.md`

---

## Files to Modify

- `packages/core/README.md` (ADD migration links)
- `packages/react/README.md` (ADD migration links)

---

## Progress

- [ ] Create from-jotai.md
- [ ] Create from-zustand.md
- [ ] Create from-recoil.md
- [ ] Create from-redux.md
- [ ] Add links to READMEs
