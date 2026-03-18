# @nexus-state/react

> React integration for Nexus State — fine-grained reactivity with split read/write hooks
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/react)](https://www.npmjs.com/package/@nexus-state/react)
> [![Coverage for react package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=react)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
> [![npm downloads](https://img.shields.io/npm/dw/@nexus-state/react)](https://www.npmjs.com/package/@nexus-state/react)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 🚀 Quick Start (60 seconds)

```tsx
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/react';

// Create atom and store
const countAtom = atom(0, 'count');
const store = createStore();

function Counter() {
  const [count, setCount] = useAtom(countAtom, store);
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count}
    </button>
  );
}
```

**Minimum required:** React 17.0.0

---

## 🎯 Why Nexus State for React?

### Comparison with Native Solutions

| Feature | Nexus State | Jotai | Zustand | Redux Toolkit |
|---------|-------------|-------|---------|---------------|
| **Split hooks** | ✅ useAtomValue + useSetAtom | ⚠️ Limited | ❌ | ❌ |
| **No Provider required** | ✅ Optional | ❌ Required | ❌ Required | ❌ Required |
| **Fine-grained updates** | ✅ Per-atom | ✅ | ❌ Store-wide | ❌ Store-wide |
| **Multi-framework** | ✅ React/Vue/Svelte | ❌ React-only | ✅ | ✅ |
| **Bundle size** | 2.1KB | 3.2KB | 1KB | 13KB |
| **DevTools** | ✅ Redux DevTools | ✅ | ✅ Custom | ✅ |

### ✅ Choose Nexus State if you need:

- Fine-grained reactivity (per-atom updates)
- Split read/write hooks for optimization
- Multi-framework state sharing
- Isolated stores (SSR, testing)

### ❌ Use alternatives if:

- Simple global state → **Zustand** (lighter)
- React-only project → **Jotai** (simpler API)
- Redux ecosystem → **Redux Toolkit** (more plugins)

---

## 📖 Core Hooks

### useAtom(atom, store?)

Read + write access to an atom.

```tsx
import { useAtom } from '@nexus-state/react';

function Counter() {
  const [count, setCount] = useAtom(countAtom, store);
  
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

---

### useAtomValue(atom, store?)

Read-only access (optimized — no setter created).

```tsx
import { useAtomValue } from '@nexus-state/react';

function Display() {
  const count = useAtomValue(countAtom, store);
  // Component won't re-render from setter changes
  return <p>{count}</p>;
}
```

---

### useSetAtom(atom, store?)

Write-only access (optimized — no subscription).

```tsx
import { useSetAtom } from '@nexus-state/react';

function IncrementButton() {
  const setCount = useSetAtom(countAtom, store);
  // Component never re-renders from atom changes!
  return <button onClick={() => setCount(c => c + 1)}>+</button>;
}
```

---

### Split Hooks Pattern (Optimized Forms)

```tsx
import { atom, createStore } from '@nexus-state/core';
import { useAtomValue, useSetAtom } from '@nexus-state/react';

const nameAtom = atom('', 'name');
const emailAtom = atom('', 'email');
const store = createStore();

// Input component — write-only (no re-renders)
function NameInput() {
  const setName = useSetAtom(nameAtom, store);
  return <input onChange={e => setName(e.target.value)} />;
}

// Display component — read-only
function NameDisplay() {
  const name = useAtomValue(nameAtom, store);
  return <p>Name: {name}</p>;
}

// Components update independently!
function Form() {
  return (
    <form>
      <NameInput />
      <NameDisplay />
    </form>
  );
}
```

---

### useAtomCallback(get, set, store?)

Complex operations with multiple atoms.

```tsx
import { useAtomCallback } from '@nexus-state/react';

function TransferButton() {
  const handleTransfer = useAtomCallback(
    (get, set, amount: number) => {
      const balance = get(balanceAtom);
      if (balance >= amount) {
        set(balanceAtom, balance - amount);
        set(logAtom, [...get(logAtom), `Transferred ${amount}`]);
      }
    },
    store
  );

  return <button onClick={() => handleTransfer(100)}>Transfer</button>;
}
```

---

### StoreProvider (Optional)

```tsx
import { StoreProvider } from '@nexus-state/react';

const store = createStore();

function App() {
  return (
    <StoreProvider store={store}>
      <Counter /> {/* Can use hooks without explicit store */}
    </StoreProvider>
  );
}

// In component
function Counter() {
  const [count, setCount] = useAtom(countAtom); // store from context
}
```

---

## 🔌 Integration with Ecosystem

### Data Fetching (@nexus-state/query)

```tsx
import { useQuery } from '@nexus-state/query/react';
import { useAtomValue } from '@nexus-state/react';

function UserProfile() {
  const userId = useAtomValue(userIdAtom, store);
  
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: fetchUser,
  });
  
  if (isLoading) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}
```

📖 **Full docs:** [npm](https://www.npmjs.com/package/@nexus-state/query)

---

### Persistence (@nexus-state/persist)

```tsx
import { persistAtom } from '@nexus-state/persist';
import { useAtomValue } from '@nexus-state/react';

// Persist atom to localStorage
const settingsAtom = persistAtom(
  { theme: 'light' },
  'settings',
  { storage: 'localStorage' }
);

function Settings() {
  const settings = useAtomValue(settingsAtom, store);
  return <div>Theme: {settings.theme}</div>;
}
```

📖 **Full docs:** [npm](https://www.npmjs.com/package/@nexus-state/persist)

---

### Async Atoms (@nexus-state/async)

```tsx
import { asyncAtom } from '@nexus-state/async';
import { useAtomValue } from '@nexus-state/react';

const [userAtom, fetchUser] = asyncAtom({
  fetchFn: async (id: number) => fetch(`/api/users/${id}`).then(r => r.json()),
  initialValue: null,
});

function UserProfile({ userId }) {
  const { data: user, isLoading } = useAtomValue(userAtom, store);
  
  if (isLoading) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}
```

📖 **Full docs:** [npm](https://www.npmjs.com/package/@nexus-state/async)

---

## 📚 API Reference

| Hook | Signature | Description |
|------|-----------|-------------|
| `useAtom` | `useAtom(atom, store?)` | Read + write |
| `useAtomValue` | `useAtomValue(atom, store?)` | Read only (optimized) |
| `useSetAtom` | `useSetAtom(atom, store?)` | Write only (no re-render) |
| `useAtomCallback` | `useAtomCallback(fn, store?)` | Complex operations |
| `StoreProvider` | `<StoreProvider store>` | Context provider |
| `useStore` | `useStore()` | Get store from context |

---

## 🔧 Troubleshooting

### 1. "useAtom requires a store" error

**Cause:** Store not provided and no StoreProvider.

**Solution:**
```tsx
// Option 1: Provide store explicitly
const [count] = useAtom(countAtom, store);

// Option 2: Use StoreProvider
<StoreProvider store={store}>
  <Component />
</StoreProvider>
```

---

### 2. Component not re-rendering on atom changes

**Cause:** Using `useSetAtom` (by design — no subscription).

**Solution:** Use `useAtom` or `useAtomValue` for read access.

```tsx
// ❌ Won't re-render
const setCount = useSetAtom(countAtom);

// ✅ Will re-render
const [count, setCount] = useAtom(countAtom);
```

---

### 3. Stale closure in callbacks

**Cause:** Callback captures old atom values.

**Solution:** Use `useAtomCallback` with get/set.

```tsx
// ❌ Stale closure
const handleClick = () => {
  setCount(count + 1); // May be stale
};

// ✅ Fresh values
const handleClick = useAtomCallback((get, set) => {
  set(countAtom, get(countAtom) + 1);
});
```

---

## 📦 Related Packages

| Package | Description | npm |
|---------|-------------|-----|
| [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) | Core concepts (atoms, stores) | [Install](https://www.npmjs.com/package/@nexus-state/core) |
| [@nexus-state/query](https://www.npmjs.com/package/@nexus-state/query) | Data fetching & caching | [Install](https://www.npmjs.com/package/@nexus-state/query) |
| [@nexus-state/async](https://www.npmjs.com/package/@nexus-state/async) | Simple async state | [Install](https://www.npmjs.com/package/@nexus-state/async) |
| [@nexus-state/persist](https://www.npmjs.com/package/@nexus-state/persist) | LocalStorage persistence | [Install](https://www.npmjs.com/package/@nexus-state/persist) |
| [@nexus-state/form](https://www.npmjs.com/package/@nexus-state/form) | Form management | [Install](https://www.npmjs.com/package/@nexus-state/form) |
| [@nexus-state/devtools](https://www.npmjs.com/package/@nexus-state/devtools) | Redux DevTools integration | [Install](https://www.npmjs.com/package/@nexus-state/devtools) |

---

## 🔗 See Also

- **Core:** [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) — Atoms, stores, subscriptions
- **Data fetching:** [@nexus-state/query](https://www.npmjs.com/package/@nexus-state/query) — SSR prefetch, caching
- **Async:** [@nexus-state/async](https://www.npmjs.com/package/@nexus-state/async) — Simple loading states
- **Persistence:** [@nexus-state/persist](https://www.npmjs.com/package/@nexus-state/persist) — LocalStorage
- **Forms:** [@nexus-state/form](https://www.npmjs.com/package/@nexus-state/form) — Schema-based forms
- **DevTools:** [@nexus-state/devtools](https://www.npmjs.com/package/@nexus-state/devtools) — Debugging
- **Time-travel:** [@nexus-state/time-travel](https://www.npmjs.com/package/@nexus-state/time-travel) — Undo/redo debugging
- **Middleware:** [@nexus-state/middleware](https://www.npmjs.com/package/@nexus-state/middleware) — Plugin system

**Full ecosystem:** [Nexus State Packages](https://www.npmjs.com/org/nexus-state)

---

## 📄 License

MIT
