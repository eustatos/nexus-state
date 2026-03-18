# @nexus-state/vue

> Vue integration for Nexus State — fine-grained reactivity with Vue composables
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/vue)](https://www.npmjs.com/package/@nexus-state/vue)
> [![Coverage for vue package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=vue)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
> [![npm downloads](https://img.shields.io/npm/dw/@nexus-state/vue)](https://www.npmjs.com/package/@nexus-state/vue)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 🚀 Quick Start (60 seconds)

```vue
<script setup>
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/vue';

// Create atom and store
const countAtom = atom(0, 'count');
const store = createStore();

// useAtom returns a Ref (auto-unpacks in template)
const [count, setCount] = useAtom(countAtom, store);
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="setCount(c => c + 1)">+</button>
  </div>
</template>
```

**Minimum required:** Vue 3.0.0

---

## 🎯 Why Nexus State for Vue?

### Comparison with Native Solutions

| Feature | Nexus State | Pinia | Vuex |
|---------|-------------|-------|------|
| **Fine-grained updates** | ✅ Per-atom | ⚠️ Store-level | ❌ Store-wide |
| **No setup boilerplate** | ✅ Direct atom usage | ⚠️ Store definition | ❌ Actions/mutations |
| **Multi-framework** | ✅ React/Vue/Svelte | ❌ Vue-only | ❌ Vue-only |
| **DevTools** | ✅ Redux DevTools | ✅ Vue Devtools | ✅ Vue Devtools |
| **Bundle size** | 1.5KB | 9KB | 15KB |

### ✅ Choose Nexus State if you need:

- Fine-grained reactivity (per-atom updates)
- No store definition boilerplate
- Multi-framework state sharing
- Isolated stores (SSR, testing)

### ❌ Use alternatives if:

- Vue-only project → **Pinia** (better Vue integration)
- Legacy Vuex codebase → **Vuex** (migration path)
- Simple global state → **Vue `reactive()`** (built-in)

---

## 📖 Core Composables

### useAtom(atom, store?)

Read + write access to an atom. Returns `[Ref, Setter]`.

```vue
<script setup>
import { useAtom } from '@nexus-state/vue';

const [count, setCount] = useAtom(countAtom, store);
</script>

<template>
  <div>
    <p>{{ count }}</p>
    <button @click="setCount(c => c + 1)">+</button>
  </div>
</template>
```

---

### useAtomValue(atom, store?)

Read-only access. Returns `Ref` (auto-unpacks in template).

```vue
<script setup>
import { useAtomValue } from '@nexus-state/vue';

const count = useAtomValue(countAtom, store);
// count is a Ref<number>
</script>

<template>
  <p>Count: {{ count }}</p>
</template>
```

---

### useSetAtom(atom, store?)

Write-only access. Returns setter function.

```vue
<script setup>
import { useSetAtom } from '@nexus-state/vue';

const setCount = useSetAtom(countAtom, store);
// Component won't re-render from atom changes
</script>

<template>
  <button @click="setCount(c => c + 1)">+</button>
</template>
```

---

### Vue Reactivity Integration

```vue
<script setup>
import { ref, computed } from 'vue';
import { atom } from '@nexus-state/core';
import { useAtomValue } from '@nexus-state/vue';

// Atoms work with Vue reactivity
const countAtom = atom(0);
const doubleAtom = atom((get) => get(countAtom) * 2);

// Returns Ref<number>
const count = useAtomValue(countAtom);

// Returns ComputedRef<number>
const double = useAtomValue(doubleAtom);

// Can use with Vue's ref
const localRef = ref(0);
</script>

<template>
  <div>
    <p>{{ count }} × 2 = {{ double }}</p>
    <p>Local: {{ localRef }}</p>
  </div>
</template>
```

---

### Multiple Stores

```vue
<script setup>
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/vue';

const store1 = createStore();
const store2 = createStore();

const value1 = useAtom(atom1, store1);
const value2 = useAtom(atom2, store2);
</script>

<template>
  <div>
    <p>Store 1: {{ value1 }}</p>
    <p>Store 2: {{ value2 }}</p>
  </div>
</template>
```

---

### SSR with Isolated Stores

```vue
<script setup>
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/vue';

const props = defineProps({ initialState: Object });

// Create isolated store per request
const store = createStore();
if (props.initialState) {
  store.setState(props.initialState);
}

const user = useAtom(userAtom, store);
</script>

<template>
  <div>{{ user?.name }}</div>
</template>
```

---

## 🔌 Integration with Ecosystem

### Data Fetching (@nexus-state/query)

```vue
<script setup>
import { useQuery } from '@nexus-state/query/vue';
import { useAtomValue } from '@nexus-state/vue';

const userId = useAtomValue(userIdAtom, store);

const { data: user, isLoading } = useQuery({
  queryKey: ['user', userId],
  queryFn: fetchUser,
});
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else>{{ user.name }}</div>
</template>
```

📖 **Full docs:** [npm](https://www.npmjs.com/package/@nexus-state/query)

---

### Persistence (@nexus-state/persist)

```vue
<script setup>
import { persistAtom } from '@nexus-state/persist';
import { useAtomValue } from '@nexus-state/vue';

// Persist atom to localStorage
const settingsAtom = persistAtom(
  { theme: 'light' },
  'settings',
  { storage: 'localStorage' }
);

const settings = useAtomValue(settingsAtom, store);
</script>

<template>
  <div>Theme: {{ settings.theme }}</div>
</template>
```

📖 **Full docs:** [npm](https://www.npmjs.com/package/@nexus-state/persist)

---

## 📚 API Reference

| Composable | Signature | Description |
|------------|-----------|-------------|
| `useAtom` | `useAtom(atom, store?)` | Read + write (returns `[Ref, Setter]`) |
| `useAtomValue` | `useAtomValue(atom, store?)` | Read only (returns `Ref`) |
| `useSetAtom` | `useSetAtom(atom, store?)` | Write only (returns function) |

---

## 🔧 Troubleshooting

### 1. "useAtom requires a store" error

**Cause:** Store not provided.

**Solution:**
```vue
<script setup>
// Option 1: Provide store explicitly
const [count] = useAtom(countAtom, store);
</script>
```

---

### 2. Ref not updating in template

**Cause:** Using `useSetAtom` (by design — no subscription).

**Solution:** Use `useAtom` or `useAtomValue` for read access.

```vue
<script setup>
// ❌ Won't update
const setCount = useSetAtom(countAtom);

// ✅ Will update
const [count, setCount] = useAtom(countAtom, store);
</script>
```

---

### 3. SSR hydration mismatch

**Cause:** Server and client have different initial state.

**Solution:** Use `setState()` to hydrate on client.

```vue
<script setup>
const props = defineProps({ initialState: Object });
const store = createStore();

// Hydrate on mount
onMounted(() => {
  if (props.initialState) {
    store.setState(props.initialState);
  }
});
</script>
```

---

## 📦 Related Packages

| Package | Description | npm |
|---------|-------------|-----|
| [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) | Core concepts (atoms, stores) | [Install](https://www.npmjs.com/package/@nexus-state/core) |
| [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react) | React integration | [Install](https://www.npmjs.com/package/@nexus-state/react) |
| [@nexus-state/svelte](https://www.npmjs.com/package/@nexus-state/svelte) | Svelte integration | [Install](https://www.npmjs.com/package/@nexus-state/svelte) |
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
