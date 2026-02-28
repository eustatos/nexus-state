# @nexus-state/react

[![npm version](https://img.shields.io/npm/v/@nexus-state/react.svg)](https://www.npmjs.com/package/@nexus-state/react)
[![Bundle Size](https://img.shields.io/bundlephobia/min/@nexus-state/react)](https://bundlephobia.com/package/@nexus-state/react)
[![License](https://img.shields.io/npm/l/@nexus-state/react.svg)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)
[![Tests](https://img.shields.io/github/actions/workflow/status/eustatos/nexus-state/test.yml?branch=main)](https://github.com/eustatos/nexus-state/actions)
[![Coverage](https://img.shields.io/codecov/c/github/eustatos/nexus-state/main)](https://codecov.io/gh/eustatos/nexus-state)

> ⚛️ Reactive state for React with hooks and full TypeScript support

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state) • [Examples](https://github.com/eustatos/nexus-state/tree/main/examples)

---

## ✨ Why It's Cool

- 🎣 **useAtom Hook** — simple atom access in components
- ⚡ **Selective Rerenders** — components update only when their atoms change
- 🧮 **Computed Atoms** — automatic dependency recalculation
- 🗄️ **Multiple Stores** — work with multiple stores
- 🛠 **TypeScript** — full type inference
- 📦 **Lightweight** — ~1 KB gzipped

---

## 📦 Installation

```bash
npm install @nexus-state/core @nexus-state/react
```

---

## 🚀 Quick Start

### Basic Counter

```jsx
import { atom, createStore } from '@nexus-state/core'
import { useAtom } from '@nexus-state/react'

// Create an atom
const countAtom = atom(0, 'counter')
const store = createStore()

function Counter() {
  const [count, setCount] = useAtom(countAtom, store)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  )
}
```

---

## 📖 API

### `useAtom(atom, [store])`

Hook to access atoms in React components.

| Parameter | Type | Description |
|-----------|------|-------------|
| `atom` | `Atom<T>` | Atom to access |
| `store` | `Store` (optional) | Store instance (defaults to global) |

**Returns:** `[value, setValue]` — value and update function

### `useAtomValue(atom, [store])`

Read-only value access (no update function).

**Returns:** `value` — atom value

### `useSetAtom(atom, [store])`

Update function only (no value).

**Returns:** `setValue` — update function

---

## 💡 Usage Examples

### Computed Atoms

```jsx
import { atom } from '@nexus-state/core'
import { useAtom } from '@nexus-state/react'

const firstNameAtom = atom('John', 'firstName')
const lastNameAtom = atom('Doe', 'lastName')

const fullNameAtom = atom(
  (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
  'fullName'
)

function Profile() {
  const [fullName] = useAtom(fullNameAtom)
  return <div>Hello, {fullName}!</div>
}
```

### Form with Multiple Fields

```jsx
import { atom, createStore } from '@nexus-state/core'
import { useAtom } from '@nexus-state/react'

const store = createStore()

const formAtom = atom({
  email: '',
  password: '',
  remember: false
}, 'loginForm')

function LoginForm() {
  const [form, setForm] = useAtom(formAtom, store)

  const updateField = (field, value) => {
    setForm({ ...form, [field]: value })
  }

  return (
    <form>
      <input
        type="email"
        value={form.email}
        onChange={(e) => updateField('email', e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={form.password}
        onChange={(e) => updateField('password', e.target.value)}
        placeholder="Password"
      />
      <label>
        <input
          type="checkbox"
          checked={form.remember}
          onChange={(e) => updateField('remember', e.target.checked)}
        />
        Remember me
      </label>
      <button type="submit">Login</button>
    </form>
  )
}
```

### Todo List

```jsx
import { atom, createStore } from '@nexus-state/core'
import { useAtom } from '@nexus-state/react'

const store = createStore()

const todosAtom = atom([
  { id: 1, text: 'Learn React', completed: true },
  { id: 2, text: 'Learn Nexus State', completed: false }
], 'todos')

function TodoList() {
  const [todos, setTodos] = useAtom(todosAtom, store)

  const addTodo = (text) => {
    setTodos([...todos, { id: Date.now(), text, completed: false }])
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  return (
    <div>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>×</button>
          </li>
        ))}
      </ul>
      <button onClick={() => addTodo('New task')}>Add Todo</button>
    </div>
  )
}
```

### Async Data

```jsx
import { atom, createStore } from '@nexus-state/core'
import { useAtom } from '@nexus-state/react'

const store = createStore()

const userAtom = atom(null, 'user')
const loadingAtom = atom(false, 'loading')
const errorAtom = atom(null, 'error')

async function fetchUser(userId) {
  store.set(loadingAtom, true)
  try {
    const response = await fetch(`/api/users/${userId}`)
    const user = await response.json()
    store.set(userAtom, user)
    store.set(errorAtom, null)
  } catch (err) {
    store.set(errorAtom, err.message)
  } finally {
    store.set(loadingAtom, false)
  }
}

function UserProfile() {
  const [user] = useAtom(userAtom, store)
  const [loading] = useAtom(loadingAtom, store)
  const [error] = useAtom(errorAtom, store)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!user) return <div>No user</div>

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  )
}
```

### Multiple Stores

```jsx
import { atom, createStore } from '@nexus-state/core'
import { useAtom } from '@nexus-state/react'

const store1 = createStore()
const store2 = createStore()

const atom1 = atom('Store 1', 'store1')
const atom2 = atom('Store 2', 'store2')

function Component1() {
  const [value] = useAtom(atom1, store1)
  return <div>{value}</div>
}

function Component2() {
  const [value] = useAtom(atom2, store2)
  return <div>{value}</div>
}
```

### Optimization with Selectors

```jsx
import { atom, createStore } from '@nexus-state/core'
import { useAtom } from '@nexus-state/react'

const store = createStore()

// Large state object
const userAtom = atom({
  name: 'John',
  email: 'john@example.com',
  age: 30,
  settings: { theme: 'dark', notifications: true }
}, 'user')

// Selector for specific field
const userNameAtom = atom((get) => get(userAtom).name, 'userName')

function UserName() {
  // Component only rerenders when name changes
  const [name] = useAtom(userNameAtom, store)
  return <div>{name}</div>
}

function UserEmail() {
  const [email] = useAtom(
    atom((get) => get(userAtom).email, 'userEmail'),
    store
  )
  return <div>{email}</div>
}
```

---

## ⚙️ Configuration

### Global Store

```jsx
// store.js
import { createStore } from '@nexus-state/core'
export const store = createStore()
```

```jsx
// App.js
import { useAtom } from '@nexus-state/react'
import { store } from './store'

function MyComponent() {
  const [count] = useAtom(countAtom, store)
  return <div>{count}</div>
}
```

### Context for Store

```jsx
import { createContext, useContext } from 'react'
import { useAtom } from '@nexus-state/react'

const StoreContext = createContext()

function StoreProvider({ children, store }) {
  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  )
}

function useAtomWithContext(atom) {
  const store = useContext(StoreContext)
  return useAtom(atom, store)
}
```

---

## ⚠️ Troubleshooting

### Problem: Component doesn't update

**Solution:** Make sure you're using the correct store:

```jsx
// ❌ Wrong
const [count] = useAtom(countAtom, wrongStore)

// ✅ Correct
const [count] = useAtom(countAtom, store)
```

### Problem: Unnecessary rerenders

**Solution:** Use selectors:

```jsx
// ❌ Subscribe to entire object
const [user] = useAtom(userAtom, store)

// ✅ Subscribe to specific field
const userNameAtom = atom((get) => get(userAtom).name, 'userName')
const [name] = useAtom(userNameAtom, store)
```

### Problem: Memory leaks

**Solution:** Clean up subscriptions on unmount:

```jsx
import { useEffect } from 'react'

function MyComponent() {
  const [count] = useAtom(countAtom, store)

  useEffect(() => {
    return () => {
      // Cleanup on unmount
    }
  }, [])

  return <div>{count}</div>
}
```

---

## 📚 Documentation

- [Getting Started](https://nexus-state.website.yandexcloud.net/guide/getting-started)
- [React Integration](https://nexus-state.website.yandexcloud.net/guide/react)
- [API Reference](https://nexus-state.website.yandexcloud.net/api/react)
- [Migration from Redux](https://nexus-state.website.yandexcloud.net/migration/from-redux)
- [Migration from Zustand](https://nexus-state.website.yandexcloud.net/migration/from-zustand)

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/eustatos/nexus-state/blob/main/CONTRIBUTING.md)

---

## 📄 License

MIT © [Nexus State](https://github.com/eustatos/nexus-state)
