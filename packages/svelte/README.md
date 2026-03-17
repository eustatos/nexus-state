# @nexus-state/svelte

> Svelte integration for Nexus State — powerful state management with fine-grained reactivity
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/svelte)](https://www.npmjs.com/package/@nexus-state/svelte)
> [![Coverage for svelte package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=svelte)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
> [![npm downloads](https://img.shields.io/npm/dw/@nexus-state/svelte)](https://www.npmjs.com/package/@nexus-state/svelte)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 📦 Installation

```bash
npm install @nexus-state/core @nexus-state/svelte
```

---

## ✨ Features

- 🎯 **useAtom Function** — Access atoms in Svelte components
- 📖 **Fine-Grained Reactivity** — Components update only on relevant changes
- 🔄 **Computed Atoms Support** — Automatically recalculate when dependencies change
- 🏪 **Store Integration** — Works with multiple stores
- 📘 **TypeScript Support** — Full type inference

---

## 🚀 Quick Start

### Basic Counter

```svelte
<script>
  import { atom, createStore } from '@nexus-state/core';
  import { useAtom } from '@nexus-state/svelte';

  // Create atom
  const countAtom = atom(0, 'counter');
  const store = createStore();

  // useAtom returns a Readable (use $ prefix)
  const count = useAtom(countAtom, store);

  function increment() {
    count.set(count + 1);
  }

  function decrement() {
    count.set(count - 1);
  }
</script>

<div>
  <p>Count: {$count}</p>
  <button on:click={increment}>+</button>
  <button on:click={decrement}>-</button>
</div>
```

### Multiple Stores

```svelte
<script>
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

### SSR with Isolated Stores

```svelte
<script>
  import { atom, createStore } from '@nexus-state/core';
  import { useAtom } from '@nexus-state/svelte';

  export let initialState;

  // Create isolated store per request
  const store = createStore().setState(initialState);

  const user = useAtom(userAtom, store);
</script>

<div>{$user?.name}</div>
```

---

## 📖 API Reference

### useAtom(atom, store)

Function to access atom values in Svelte components.

- `atom`: The atom to access
- `store`: The store instance containing the atom
- Returns: `Readable<T>` — Svelte readable store with the atom's value

**Note:** Use `$` prefix to subscribe to the store in templates: `{$count}`

```svelte
<script>
  const count = useAtom(countAtom, store);
</script>

<p>{$count}</p> <!-- Subscribe with $ prefix -->
```

---

## 📦 Ecosystem

| Package | Description |
|---------|-------------|
| [@nexus-state/core](https://github.com/eustatos/nexus-state/tree/main/packages/core) | Core library |
| [@nexus-state/react](https://github.com/eustatos/nexus-state/tree/main/packages/react) | React bindings |
| [@nexus-state/vue](https://github.com/eustatos/nexus-state/tree/main/packages/vue) | Vue bindings |
| [@nexus-state/persist](https://github.com/eustatos/nexus-state/tree/main/packages/persist) | State persistence |
| [@nexus-state/middleware](https://github.com/eustatos/nexus-state/tree/main/packages/middleware) | Middleware system |
| [@nexus-state/devtools](https://github.com/eustatos/nexus-state/tree/main/packages/devtools) | DevTools integration |

---

## 📄 License

MIT