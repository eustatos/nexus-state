# @nexus-state/svelte

[![npm version](https://img.shields.io/npm/v/@nexus-state/svelte.svg)](https://www.npmjs.com/package/@nexus-state/svelte)
[![Bundle Size](https://img.shields.io/bundlephobia/min/@nexus-state/svelte)](https://bundlephobia.com/package/@nexus-state/svelte)
[![License](https://img.shields.io/npm/l/@nexus-state/svelte.svg)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

> 🎯 Reactive state for Svelte with full reactivity support

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state) • [Examples](https://github.com/eustatos/nexus-state/tree/main/examples)

---

## ✨ Why It's Cool

- 🚀 **Svelte-native** — works with `$:` and stores
- ⚡ **Zero overhead** — uses Svelte's built-in reactivity
- 🎯 **Selective updates** — only affected components rerender
- 🧩 **TypeScript** — full type inference
- 📦 **Lightweight** — ~0.5 KB gzipped
- 🔥 **Hot reload friendly** — works with Vite and HMR

---

## 📦 Installation

```bash
npm install @nexus-state/core @nexus-state/svelte
```

---

## 🚀 Quick Start

### Basic Usage

```svelte
<script>
  import { atom } from '@nexus-state/core'
  import { createSvelteAtom } from '@nexus-state/svelte'

  // Create an atom
  const countAtom = atom(0, 'counter')
  
  // Convert to Svelte store
  const count = createSvelteAtom(countAtom)
  
  function increment() {
    count.update(n => n + 1)
  }
</script>

<button on:click={increment}>
  Count: {$count}
</button>
```

### Using useAtom Hook

```svelte
<script>
  import { atom } from '@nexus-state/core'
  import { useAtom } from '@nexus-state/svelte'

  const countAtom = atom(0, 'counter')
  const [count, setCount] = useAtom(countAtom)
  
  function increment() {
    setCount($count + 1)
  }
</script>

<button on:click={increment}>
  Count: {$count}
</button>
```

---

## 📖 API

### `createSvelteAtom(atom)`

Converts a Nexus State atom to a Svelte store.

| Parameter | Type | Description |
|-----------|------|-------------|
| `atom` | `Atom<T>` | Atom to convert |

**Returns:** `Readable<T> & Writable<T>` — Svelte store

### `useAtom(atom, [store])`

Hook to work with atoms in Svelte components.

| Parameter | Type | Description |
|-----------|------|-------------|
| `atom` | `Atom<T>` | Atom to access |
| `store` | `Store` (optional) | Store instance |

**Returns:** `[store, setValue]` — Svelte store and update function

---

## 💡 Usage Examples

### Computed Values

```svelte
<script>
  import { atom } from '@nexus-state/core'
  import { useAtom } from '@nexus-state/svelte'

  const firstNameAtom = atom('John', 'firstName')
  const lastNameAtom = atom('Doe', 'lastName')
  
  const fullNameAtom = atom(
    (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
    'fullName'
  )

  const [fullName] = useAtom(fullNameAtom)
  const [firstName, setFirstName] = useAtom(firstNameAtom)
</script>

<input bind:value={$firstName} placeholder="First name" />
<p>Hello, {$fullName}!</p>
```

### Todo List

```svelte
<script>
  import { atom } from '@nexus-state/core'
  import { useAtom } from '@nexus-state/svelte'

  const todosAtom = atom([
    { id: 1, text: 'Learn Svelte', completed: true },
    { id: 2, text: 'Learn Nexus State', completed: false }
  ], 'todos')

  const [todos, setTodos] = useAtom(todosAtom)

  function addTodo(text) {
    setTodos([...$todos, { id: Date.now(), text, completed: false }])
  }

  function toggleTodo(id) {
    setTodos($todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }
</script>

<ul>
  {#each $todos as todo (todo.id)}
    <li>
      <input 
        type="checkbox" 
        checked={todo.completed} 
        on:change={() => toggleTodo(todo.id)} 
      />
      <span class:completed={todo.completed}>{todo.text}</span>
    </li>
  {/each}
</ul>

<button on:click={() => addTodo('New task')}>Add Todo</button>
```

### Form with Validation

```svelte
<script>
  import { atom } from '@nexus-state/core'
  import { useAtom } from '@nexus-state/svelte'

  const formAtom = atom({
    email: '',
    password: '',
    errors: {}
  }, 'loginForm')

  const [form, setForm] = useAtom(formAtom)

  function validate() {
    const errors = {}
    if (!$form.email.includes('@')) errors.email = 'Invalid email'
    if ($form.password.length < 6) errors.password = 'Min 6 characters'
    setForm({ ...$form, errors })
    return Object.keys(errors).length === 0
  }

  function submit() {
    if (validate()) {
      console.log('Submitting:', $form)
    }
  }
</script>

<form on:submit|preventDefault={submit}>
  <input 
    bind:value={$form.email} 
    placeholder="Email"
    class:error={$form.errors.email}
  />
  {#if $form.errors.email}
    <span class="error">{$form.errors.email}</span>
  {/if}
  
  <input 
    bind:value={$form.password} 
    type="password"
    placeholder="Password"
    class:error={$form.errors.password}
  />
  {#if $form.errors.password}
    <span class="error">{$form.errors.password}</span>
  {/if}
  
  <button type="submit">Login</button>
</form>
```

### Multiple Stores

```svelte
<script>
  import { atom, createStore } from '@nexus-state/core'
  import { useAtom } from '@nexus-state/svelte'

  const store1 = createStore()
  const store2 = createStore()

  const atom1 = atom('Store 1', 'store1')
  const atom2 = atom('Store 2', 'store2')

  const [value1] = useAtom(atom1, store1)
  const [value2] = useAtom(atom2, store2)
</script>

<p>Store 1: {$value1}</p>
<p>Store 2: {$value2}</p>
```

---

## ⚙️ Configuration

### Global Store

```js
// store.js
import { createStore } from '@nexus-state/core'
export const store = createStore()
```

```svelte
<script>
  import { useAtom } from '@nexus-state/svelte'
  import { store } from './store'

  const [count] = useAtom(countAtom, store)
</script>
```

---

## ⚠️ Troubleshooting

### Problem: Store doesn't update in template

**Solution:** Make sure you're using `$` to subscribe to store:

```svelte
<script>
  const [count] = useAtom(countAtom)
</script>

<!-- ✅ Correct -->
<p>{$count}</p>

<!-- ❌ Wrong -->
<p>{count}</p>
```

### Problem: Unnecessary rerenders

**Solution:** Use selectors to subscribe to specific fields:

```js
// Instead of subscribing to entire object
const [user] = useAtom(userAtom)

// Subscribe to specific field
const userNameAtom = atom((get) => get(userAtom).name, 'userName')
const [userName] = useAtom(userNameAtom)
```

---

## 📚 Documentation

- [Getting Started](https://nexus-state.website.yandexcloud.net/guide/getting-started)
- [Svelte Integration](https://nexus-state.website.yandexcloud.net/guide/svelte)
- [API Reference](https://nexus-state.website.yandexcloud.net/api/svelte)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/eustatos/nexus-state/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT © [Nexus State](https://github.com/eustatos/nexus-state)
