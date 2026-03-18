# @nexus-state/svelte

> Svelte integration for Nexus State — fine-grained reactivity with Svelte stores
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/svelte)](https://www.npmjs.com/package/@nexus-state/svelte)
> [![Coverage for svelte package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=svelte)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
> [![npm downloads](https://img.shields.io/npm/dw/@nexus-state/svelte)](https://www.npmjs.com/package/@nexus-state/svelte)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 🚀 Quick Start (60 seconds)

```svelte
<script lang="ts">
  import { atom, createStore } from '@nexus-state/core';
  import { useAtom } from '@nexus-state/svelte';

  // Create atom and store
  const countAtom = atom(0, 'count');
  const store = createStore();

  // useAtom returns a Readable store (use $ prefix)
  const count = useAtom(countAtom, store);

  function increment() {
    store.set(countAtom, $count + 1);
  }
</script>

<div>
  <p>Count: {$count}</p>
  <button on:click={increment}>+</button>
</div>
```

**Minimum required:** Svelte 3.0.0

---

## 🎯 Why Nexus State for Svelte?

### Comparison with Alternatives

| Feature | Nexus State | Svelte Store | Zustand |
|---------|-------------|--------------|---------|
| **Fine-grained updates** | ✅ Per-atom | ⚠️ Manual | ❌ |
| **Computed atoms** | ✅ Built-in | ⚠️ Derived | ❌ |
| **Multi-framework** | ✅ React/Vue/Svelte | ❌ Svelte-only | ✅ |
| **DevTools** | ✅ Redux DevTools | ❌ | ⚠️ Custom |
| **Bundle size** | 1.2KB | 0.5KB | 1KB |

### ✅ Choose Nexus State if you need:

- Fine-grained reactivity (per-atom updates)
- Computed atoms with automatic recalculation
- Multi-framework state sharing
- Isolated stores (SSR, testing)

### ❌ Use alternatives if:

- Simple local state → **Svelte `writable()`** (built-in)
- Svelte-only project → **Svelte stores** (native integration)
- Simple global state → **Zustand** (lighter)

---

## 📖 Store Integration

### useAtom(atom, store?)

Returns a Svelte `Readable` store. Use `$` prefix to subscribe.

```svelte
<script lang="ts">
  import { useAtom } from '@nexus-state/svelte';

  const count = useAtom(countAtom, store);
  // count is Readable<number>, use $count in template
</script>

<div>Count: {$count}</div>
```

---

### useAtomValue(atom, store?)

Read-only access. Returns `Readable`.

```svelte
<script lang="ts">
  import { useAtomValue } from '@nexus-state/svelte';

  const count = useAtomValue(countAtom, store);
</script>

<div>Count: {$count}</div>
```

---

### useSetAtom(atom, store?)

Returns setter function.

```svelte
<script lang="ts">
  import { useSetAtom } from '@nexus-state/svelte';

  const setCount = useSetAtom(countAtom, store);

  function increment() {
    setCount(c => c + 1);
  }
</script>

<button on:click={increment}>+</button>
```

---

### Computed Atoms

```svelte
<script lang="ts">
  import { atom } from '@nexus-state/core';
  import { useAtomValue } from '@nexus-state/svelte';

  const countAtom = atom(0);
  const doubleAtom = atom((get) => get(countAtom) * 2);

  const count = useAtomValue(countAtom, store);
  const double = useAtomValue(doubleAtom, store);
</script>

<p>{$count} × 2 = {$double}</p>
```

---

### Multiple Stores

```svelte
<script lang="ts">
  import { atom, createStore } from '@nexus-state/core';
  import { useAtom } from '@nexus-state/svelte';

  const store1 = createStore();
  const store2 = createStore();

  const value1 = useAtom(atom1, store1);
  const value2 = useAtom(atom2, store2);
</script>

<div>
  <p>Store 1: {$value1}</p>
  <p>Store 2: {$value2}</p>
</div>
```

---

### SSR with Isolated Stores

```svelte
<script lang="ts">
  import { atom, createStore } from '@nexus-state/core';
  import { useAtom } from '@nexus-state/svelte';

  export let initialState;

  // Create isolated store per request
  const store = createStore();
  if (initialState) {
    store.setState(initialState);
  }

  const user = useAtom(userAtom, store);
</script>

<div>{$user?.name}</div>
```

---

## 🔌 Integration with Ecosystem

### Data Fetching (@nexus-state/query)

```svelte
<script lang="ts">
  import { useQuery } from '@nexus-state/query/svelte';
  import { useAtomValue } from '@nexus-state/svelte';

  const userId = useAtomValue(userIdAtom, store);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: fetchUser,
  });
</script>

{#if $isLoading}
  <div>Loading...</div>
{:else}
  <div>{$user.name}</div>
{/if}
```

📖 **Full docs:** [npm](https://www.npmjs.com/package/@nexus-state/query)

---

### Persistence (@nexus-state/persist)

```svelte
<script lang="ts">
  import { persistAtom } from '@nexus-state/persist';
  import { useAtomValue } from '@nexus-state/svelte';

  // Persist atom to localStorage
  const settingsAtom = persistAtom(
    { theme: 'light' },
    'settings',
    { storage: 'localStorage' }
  );

  const settings = useAtomValue(settingsAtom, store);
</script>

<div>Theme: {$settings.theme}</div>
```

📖 **Full docs:** [npm](https://www.npmjs.com/package/@nexus-state/persist)

---

## 📚 API Reference

| Function | Signature | Description |
|----------|-----------|-------------|
| `useAtom` | `useAtom(atom, store?)` | Read + write (returns `Readable`) |
| `useAtomValue` | `useAtomValue(atom, store?)` | Read only (returns `Readable`) |
| `useSetAtom` | `useSetAtom(atom, store?)` | Write only (returns function) |

---

## 🔧 Troubleshooting

### 1. Store not updating in template

**Cause:** Not using `$` prefix to subscribe.

**Solution:**
```svelte
<script>
  const count = useAtom(countAtom, store);
</script>

<!-- ❌ Won't update -->
<div>{count}</div>

<!-- ✅ Will update -->
<div>{$count}</div>
```

---

### 2. "Cannot read properties of undefined" error

**Cause:** Store not provided.

**Solution:**
```svelte
<script>
  // Provide store explicitly
  const count = useAtom(countAtom, store);
</script>
```

---

### 3. Memory leak in SSR

**Cause:** Store not cleaned up between requests.

**Solution:** Create new store per request.

```svelte
<script>
  // ✅ Correct - new store per component instance
  const store = createStore();
  
  // ❌ Wrong - shared store
  // const store = createStore(); // at module level
</script>
```

---

## 📦 Related Packages

| Package | Description | npm |
|---------|-------------|-----|
| [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) | Core concepts (atoms, stores) | [Install](https://www.npmjs.com/package/@nexus-state/core) |
| [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react) | React integration | [Install](https://www.npmjs.com/package/@nexus-state/react) |
| [@nexus-state/vue](https://www.npmjs.com/package/@nexus-state/vue) | Vue integration | [Install](https://www.npmjs.com/package/@nexus-state/vue) |
| [@nexus-state/query](https://www.npmjs.com/package/@nexus-state/query) | Data fetching | [Install](https://www.npmjs.com/package/@nexus-state/query) |
| [@nexus-state/async](https://www.npmjs.com/package/@nexus-state/async) | Simple async state | [Install](https://www.npmjs.com/package/@nexus-state/async) |
| [@nexus-state/persist](https://www.npmjs.com/package/@nexus-state/persist) | LocalStorage persistence | [Install](https://www.npmjs.com/package/@nexus-state/persist) |

---

## 🔗 See Also

- **Core:** [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) — Atoms, stores, subscriptions
- **Data fetching:** [@nexus-state/query](https://www.npmjs.com/package/@nexus-state/query) — SSR prefetch, caching
- **Async:** [@nexus-state/async](https://www.npmjs.com/package/@nexus-state/async) — Simple loading states
- **Persistence:** [@nexus-state/persist](https://www.npmjs.com/package/@nexus-state/persist) — LocalStorage
- **Forms:** [@nexus-state/form](https://www.npmjs.com/package/@nexus-state/form) — Schema-based forms
- **DevTools:** [@nexus-state/devtools](https://www.npmjs.com/package/@nexus-state/devtools) — Debugging

**Full ecosystem:** [Nexus State Packages](https://www.npmjs.com/org/nexus-state)

---

## 📄 License

MIT
