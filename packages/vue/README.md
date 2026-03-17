# @nexus-state/vue

> Vue integration for Nexus State — powerful state management with fine-grained reactivity
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/vue)](https://www.npmjs.com/package/@nexus-state/vue)
> [![Coverage for vue package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=vue)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
> [![npm downloads](https://img.shields.io/npm/dw/@nexus-state/vue)](https://www.npmjs.com/package/@nexus-state/vue)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 📦 Installation

```bash
npm install @nexus-state/core @nexus-state/vue
```

---

## ✨ Features

- 🎯 **useAtom Composable** — Access atoms in Vue components
- 📖 **Fine-Grained Reactivity** — Components update only on relevant changes
- 🔄 **Computed Atoms Support** — Automatically recalculate when dependencies change
- 🏪 **Store Integration** — Works with multiple stores
- 📘 **TypeScript Support** — Full type inference

---

## 🚀 Quick Start

### Basic Counter

```vue
<script setup>
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/vue';

// Create atom
const countAtom = atom(0, 'counter');
const store = createStore();

// useAtom returns a Ref (auto-unpacks in template)
const count = useAtom(countAtom, store);
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="setCount(count + 1)">+</button>
    <button @click="setCount(count - 1)">-</button>
  </div>
</template>
```

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

### SSR with Isolated Stores

```vue
<script setup>
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/vue';

const props = defineProps({ initialState: Object });

// Create isolated store per request
const store = createStore().setState(props.initialState);

const user = useAtom(userAtom, store);
</script>

<template>
  <div>{{ user?.name }}</div>
</template>
```

---

## 📖 API Reference

### useAtom(atom, store)

Composable to access atom values in Vue components.

- `atom`: The atom to access
- `store`: The store instance containing the atom
- Returns: `Ref<T>` — Vue ref with the atom's value

**Note:** Refs auto-unpack in templates, so you can use `{{ count }}` instead of `{{ count.value }}`.

```vue
<script setup>
const count = useAtom(countAtom, store);
</script>

<template>
  <p>{{ count }}</p> <!-- Auto-unpacks -->
</template>
```

---

## 📦 Ecosystem

| Package | Description |
|---------|-------------|
| [@nexus-state/core](https://github.com/eustatos/nexus-state/tree/main/packages/core) | Core library |
| [@nexus-state/react](https://github.com/eustatos/nexus-state/tree/main/packages/react) | React bindings |
| [@nexus-state/svelte](https://github.com/eustatos/nexus-state/tree/main/packages/svelte) | Svelte bindings |
| [@nexus-state/persist](https://github.com/eustatos/nexus-state/tree/main/packages/persist) | State persistence |
| [@nexus-state/middleware](https://github.com/eustatos/nexus-state/tree/main/packages/middleware) | Middleware system |
| [@nexus-state/devtools](https://github.com/eustatos/nexus-state/tree/main/packages/devtools) | DevTools integration |

---

## 📄 License

MIT