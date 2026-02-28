# @nexus-state/vue

[![npm version](https://img.shields.io/npm/v/@nexus-state/vue.svg)](https://www.npmjs.com/package/@nexus-state/vue)
[![Bundle Size](https://img.shields.io/bundlephobia/min/@nexus-state/vue)](https://bundlephobia.com/package/@nexus-state/vue)
[![License](https://img.shields.io/npm/l/@nexus-state/vue.svg)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

> 🎯 Reactive state for Vue 3 with Composition API and Options API support

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state) • [Examples](https://github.com/eustatos/nexus-state/tree/main/examples)

---

## ✨ Why It's Cool

- 🚀 **Composition API-first** — modern Vue 3 style hooks
- ⚡ **Reactivity out of the box** — automatic subscription to changes
- 🎯 **Selective rerenders** — components update only when their atoms change
- 🧩 **Works with Options API** — backward compatibility
- 📦 **Lightweight** — ~1 KB gzipped
- 🛠 **TypeScript** — full type inference

---

## 📦 Installation

```bash
npm install @nexus-state/core @nexus-state/vue
```

---

## 🚀 Quick Start

### Composition API (Recommended)

```vue
<script setup>
import { atom } from '@nexus-state/core'
import { useAtom } from '@nexus-state/vue'

// Create an atom
const countAtom = atom(0, 'counter')

// Use in component
const [count, setCount] = useAtom(countAtom)

const increment = () => setCount(count.value + 1)
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">+</button>
  </div>
</template>
```

### Options API

```vue
<script>
import { atom } from '@nexus-state/core'
import { useAtom } from '@nexus-state/vue'

const countAtom = atom(0, 'counter')

export default {
  setup() {
    const [count, setCount] = useAtom(countAtom)
    return { count, setCount }
  },
  methods: {
    increment() {
      this.setCount(this.count + 1)
    }
  }
}
</script>
```

---

## 📖 API

### `useAtom(atom, [store])`

Hook to access atoms in Vue components.

| Parameter | Type | Description |
|-----------|------|-------------|
| `atom` | `Atom<T>` | Atom to access |
| `store` | `Store` (optional) | Store instance (defaults to global) |

**Returns:** `[value, setValue]` — reactive ref and update function

---

## 💡 Usage Examples

### Computed Atoms

```vue
<script setup>
import { atom } from '@nexus-state/core'
import { useAtom } from '@nexus-state/vue'

const firstNameAtom = atom('John', 'firstName')
const lastNameAtom = atom('Doe', 'lastName')

const fullNameAtom = atom(
  (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
  'fullName'
)

const [fullName] = useAtom(fullNameAtom)
</script>

<template>
  <div>Hello, {{ fullName }}!</div>
</template>
```

### Form with Multiple Fields

```vue
<script setup>
import { atom, createStore } from '@nexus-state/core'
import { useAtom } from '@nexus-state/vue'

const store = createStore()

const formAtom = atom({
  email: '',
  password: '',
  remember: false
}, 'loginForm')

const [form, setForm] = useAtom(formAtom, store)

const updateField = (field, value) => {
  setForm({ ...form, [field]: value })
}
</script>

<template>
  <form>
    <input v-model="form.email" @input="updateField('email', $event.target.value)" />
    <input v-model="form.password" type="password" @input="updateField('password', $event.target.value)" />
    <label>
      <input type="checkbox" v-model="form.remember" @change="updateField('remember', $event.target.checked)" />
      Remember me
    </label>
  </form>
</template>
```

### Todo List

```vue
<script setup>
import { atom } from '@nexus-state/core'
import { useAtom } from '@nexus-state/vue'

const todosAtom = atom([
  { id: 1, text: 'Learn Vue', completed: true },
  { id: 2, text: 'Learn Nexus State', completed: false }
], 'todos')

const [todos, setTodos] = useAtom(todosAtom)

const addTodo = (text) => {
  setTodos([...todos, { id: Date.now(), text, completed: false }])
}

const toggleTodo = (id) => {
  setTodos(todos.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  ))
}
</script>

<template>
  <div>
    <ul>
      <li v-for="todo in todos" :key="todo.id">
        <input type="checkbox" :checked="todo.completed" @change="toggleTodo(todo.id)" />
        <span :class="{ completed: todo.completed }">{{ todo.text }}</span>
      </li>
    </ul>
    <button @click="addTodo('New task')">Add Todo</button>
  </div>
</template>
```

### Multiple Stores

```vue
<script setup>
import { atom, createStore } from '@nexus-state/core'
import { useAtom } from '@nexus-state/vue'

const store1 = createStore()
const store2 = createStore()

const atom1 = atom('Store 1', 'store1')
const atom2 = atom('Store 2', 'store2')

const [value1] = useAtom(atom1, store1)
const [value2] = useAtom(atom2, store2)
</script>

<template>
  <div>
    <p>Store 1: {{ value1 }}</p>
    <p>Store 2: {{ value2 }}</p>
  </div>
</template>
```

---

## ⚙️ Configuration

### Global Store

```js
// store.js
import { createStore } from '@nexus-state/core'
export const store = createStore()
```

```vue
<script setup>
import { useAtom } from '@nexus-state/vue'
import { store } from './store'

const [count] = useAtom(countAtom, store)
</script>
```

---

## ⚠️ Troubleshooting

### Problem: Component doesn't update

**Solution:** Make sure you're using `.value` to access ref outside template:

```js
const [count] = useAtom(countAtom)
console.log(count.value) // ✅ Correct
console.log(count)       // ❌ Ref object
```

### Problem: Lost reactivity on destructuring

**Solution:** Don't destructure ref directly:

```js
// ❌ Wrong
const [count] = useAtom(countAtom)
const { value } = count  // Lost reactivity

// ✅ Correct
const [count] = useAtom(countAtom)
const countValue = count.value
```

---

## 📚 Documentation

- [Getting Started](https://nexus-state.website.yandexcloud.net/guide/getting-started)
- [Vue Integration](https://nexus-state.website.yandexcloud.net/guide/vue)
- [API Reference](https://nexus-state.website.yandexcloud.net/api/vue)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/eustatos/nexus-state/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT © [Nexus State](https://github.com/eustatos/nexus-state)
