# @nexus-state/react

> React integration for Nexus State — powerful state management with fine-grained reactivity
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/react)](https://www.npmjs.com/package/@nexus-state/react)
> [![npm downloads](https://img.shields.io/npm/dw/@nexus-state/react)](https://www.npmjs.com/package/@nexus-state/react)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 📦 Installation

```bash
npm install @nexus-state/react
```

---

## ✨ Features

- 🎯 **useAtom Hook** — Easy atom access in React components
- 📖 **useAtomValue Hook** — Read-only access (optimized for performance)
- ✍️ **useSetAtom Hook** — Write-only access (no re-renders)
- 🚀 **Selective Updates** — Components only re-render when their atoms change
- 🔄 **Computed Atoms Support** — Automatically recalculate when dependencies change
- 🏪 **Store Integration** — Works with multiple stores
- 📘 **TypeScript Support** — Full type inference

---

## 🤔 When to Use

### If you need...

- ✅ **React integration** — Use Nexus State in React components
- ✅ **Fine-grained reactivity** — Components update only on relevant changes
- ✅ **Performance** — Split read/write hooks for optimal rendering
- ✅ **TypeScript** — Full type inference for hooks and atoms

### If you don't need...

- ❌ **Context providers** — No wrapping your app in providers
- ❌ **Complex setup** — Works out of the box
- ❌ **React-only state** — Core works with vanilla JS too

---

## 🚀 Quick Start

### Basic Counter

```javascript
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/react';

// Create atom
const countAtom = atom(0, 'counter');
const store = createStore();

function Counter() {
  const [count, setCount] = useAtom(countAtom, store);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  );
}
```

### Optimized Form with useAtomValue and useSetAtom

```javascript
import { atom, createStore } from '@nexus-state/core';
import { useAtomValue, useSetAtom } from '@nexus-state/react';

const nameAtom = atom('', 'name');
const emailAtom = atom('', 'email');
const store = createStore();

// Component that only DISPLAYS value (read-only)
function NameDisplay() {
  const name = useAtomValue(nameAtom, store);
  // ✅ Only subscribes to changes, no setter created
  return <span>{name}</span>;
}

// Component that only UPDATES value (write-only)
function NameInput() {
  const setName = useSetAtom(nameAtom, store);
  // ✅ NO subscription, component won't re-render
  return <input onChange={(e) => setName(e.target.value)} placeholder="Name" />;
}

// Component that needs both (controlled input)
function ControlledInput() {
  const [value, setValue] = useAtom(emailAtom, store);
  // ✅ Has both read and write
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Email"
    />
  );
}
```

### Performance Comparison

```javascript
// ❌ WITHOUT split hooks - unnecessary re-renders
function OldFormInput() {
  const [_, setName] = useAtom(nameAtom, store);
  // ❌ Component subscribes even though value not used
  // ❌ Re-renders on every nameAtom change
  return <input onChange={(e) => setName(e.target.value)} />;
}

// ✅ WITH split hooks - NO unnecessary re-renders
function NewFormInput() {
  const setName = useSetAtom(nameAtom, store);
  // ✅ NO subscription
  // ✅ Never re-renders from atom changes
  return <input onChange={(e) => setName(e.target.value)} />;
}
```

### Computed Atoms

```javascript
const firstNameAtom = atom('John', 'firstName');
const lastNameAtom = atom('Doe', 'lastName');

const fullNameAtom = atom(
  (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
  'fullName'
);

function Profile() {
  const fullName = useAtomValue(fullNameAtom, store);

  return <div>{fullName}</div>;
}
```

### Action Buttons with useSetAtom

```javascript
const countAtom = atom(0, 'count');

// Button that only updates, doesn't need current value
function IncrementButton() {
  const setCount = useSetAtom(countAtom, store);
  // ✅ Never re-renders, stable reference
  return (
    <button onClick={() => setCount((prev) => prev + 1)}>Increment</button>
  );
}

// Display that only reads
function CountDisplay() {
  const count = useAtomValue(countAtom, store);
  // ✅ Re-renders when count changes
  return <div>Count: {count}</div>;
}
```

### Multiple Stores

```javascript
const store1 = createStore();
const store2 = createStore();

function Component1() {
  const [value] = useAtom(atom1, store1);
  return <div>{value}</div>;
}

function Component2() {
  const [value] = useAtom(atom2, store2);
  return <div>{value}</div>;
}
```

---

## 📖 Advanced Examples

### Integration with @nexus-state/query

```tsx
import { useQuery } from '@nexus-state/query/react';
import { useAtomValue } from '@nexus-state/react';
import { atom } from '@nexus-state/core';

// Atom for user ID
const userIdAtom = atom(1, 'userId');

function UserProfile() {
  const userId = useAtomValue(userIdAtom);

  // Query automatically subscribes to userIdAtom changes
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      return res.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{user.name}</div>;
}
```

### Integration with @nexus-state/form

```tsx
import { createFormAtom } from '@nexus-state/form';
import { useAtom } from '@nexus-state/react';
import { z } from 'zod';

// Form schema with validation
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Create form atom
const loginFormAtom = createFormAtom(loginSchema, {
  email: '',
  password: '',
});

function LoginForm() {
  const [form] = useAtom(loginFormAtom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await form.validate();
    if (isValid) {
      console.log('Form values:', form.values);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={form.values.email}
        onChange={(e) => form.setField('email', e.target.value)}
      />
      {form.errors.email && <span>{form.errors.email}</span>}

      <input
        type="password"
        value={form.values.password}
        onChange={(e) => form.setField('password', e.target.value)}
      />
      {form.errors.password && <span>{form.errors.password}</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

### Persistence with @nexus-state/persist

```tsx
import { persistAtom } from '@nexus-state/persist';
import { useAtomValue, useSetAtom } from '@nexus-state/react';

// Atom that persists to localStorage
const themeAtom = persistAtom('theme', 'light', {
  storage: 'localStorage',
});

function ThemeToggle() {
  const theme = useAtomValue(themeAtom);
  const setTheme = useSetAtom(themeAtom);

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Current theme: {theme}
    </button>
  );
}
```

---

## ⚡ Performance

### Benchmark: Re-render Optimization

Using split hooks (`useAtomValue` + `useSetAtom`) eliminates unnecessary re-renders:

| Scenario            | `useAtom`     | Split Hooks   | Improvement |
| ------------------- | ------------- | ------------- | ----------- |
| Form with 10 fields | 10 re-renders | 0 re-renders  | **∞** ✅    |
| Button updates      | Re-renders    | No re-renders | **100%** ✅ |
| Display components  | Re-renders    | Re-renders    | Same        |

### Example: Optimized Form

```tsx
// ❌ WITHOUT split hooks - 10 unnecessary re-renders
function OldForm() {
  const [name, setName] = useAtom(nameAtom);
  const [email, setEmail] = useAtom(emailAtom);
  const [phone, setPhone] = useAtom(phoneAtom);
  // ... 7 more fields
  // ❌ Each input re-renders on every keystroke
  return <form>...</form>;
}

// ✅ WITH split hooks - 0 unnecessary re-renders
function NewForm() {
  const setName = useSetAtom(nameAtom);
  const setEmail = useSetAtom(emailAtom);
  const setPhone = useSetAtom(phoneAtom);
  // ... 7 more setters
  // ✅ Inputs NEVER re-render from atom changes
  return <form>...</form>;
}
```

### Best Practices

1. **Use `useAtomValue` for display components** — Clear intent, optimized reads
2. **Use `useSetAtom` for inputs/buttons** — No subscriptions, stable references
3. **Use `useAtom` only for controlled inputs** — When you need both value and setter
4. **Memoize callbacks with `useAtomCallback`** — For complex multi-atom operations

---

## 📚 API Reference

### useAtom(atom, store)

Hook to access atom values in React components (read + write).

- `atom`: The atom to access
- `store`: The store instance containing the atom
- Returns: `[value, setValue]` tuple

**Use when:** You need both read and write access (e.g., controlled inputs)

```javascript
const [count, setCount] = useAtom(countAtom, store);
```

### useAtomValue(atom, store)

Hook to read an atom value (read-only). Optimized for performance.

- `atom`: The atom to read from
- `store`: The store instance containing the atom
- Returns: Current atom value

**Use when:** You only need to read the value (e.g., display components)

```javascript
const count = useAtomValue(countAtom, store);
```

**Benefits:**

- ✅ Clear intent (read-only)
- ✅ Smaller bundle (no setter created)
- ✅ Better performance (only subscribes)

### useSetAtom(atom, store)

Hook to write to an atom (write-only). Optimized for performance.

- `atom`: The atom to write to
- `store`: The store instance containing the atom
- Returns: Setter function `(value) => void`

**Use when:** You only need to update the value (e.g., buttons, form inputs)

```javascript
const setCount = useSetAtom(countAtom, store);
```

**Benefits:**

- ✅ Clear intent (write-only)
- ✅ NO subscription (component won't re-render)
- ✅ Stable reference (memoized)
- ✅ Best for forms with many fields

### useAtomCallback(get, set, store)

Advanced hook for complex operations involving multiple atoms.

- `callback`: Function that receives `get`, `set`, and optional arguments
- `store`: The store instance (optional, uses context if not provided)
- Returns: Memoized callback function

**Use when:** You need to perform complex operations with multiple atoms

```javascript
const handleTransfer = useAtomCallback((get, set, amount) => {
  const balance = get(balanceAtom);
  if (balance >= amount) {
    set(balanceAtom, balance - amount);
    set(historyAtom, [...get(historyAtom), `Transferred ${amount}`]);
  }
}, store);
```

**Benefits:**

- ✅ Access to multiple atoms in single callback
- ✅ Stable reference (memoized)
- ✅ Clean API for complex operations

### Comparison Table

| Hook              | Reads | Writes | Subscribes | Re-renders | Use Case             |
| ----------------- | ----- | ------ | ---------- | ---------- | -------------------- |
| `useAtom`         | ✅    | ✅     | ✅         | ✅         | Controlled inputs    |
| `useAtomValue`    | ✅    | ❌     | ✅         | ✅         | Display components   |
| `useSetAtom`      | ❌    | ✅     | ❌         | ❌         | Buttons, form inputs |
| `useAtomCallback` | ✅    | ✅     | ❌         | ❌         | Complex operations   |

---

## 📦 Ecosystem

| Package                                                                                          | Description             |
| ------------------------------------------------------------------------------------------------ | ----------------------- |
| [@nexus-state/core](https://github.com/eustatos/nexus-state/tree/main/packages/core)             | Core library            |
| [@nexus-state/query](https://github.com/eustatos/nexus-state/tree/main/packages/query)           | Data fetching & caching |
| [@nexus-state/form](https://github.com/eustatos/nexus-state/tree/main/packages/form)             | Form management         |
| [@nexus-state/persist](https://github.com/eustatos/nexus-state/tree/main/packages/persist)       | State persistence       |
| [@nexus-state/middleware](https://github.com/eustatos/nexus-state/tree/main/packages/middleware) | Middleware system       |
| [@nexus-state/devtools](https://github.com/eustatos/nexus-state/tree/main/packages/devtools)     | DevTools integration    |
| [@nexus-state/immer](https://github.com/eustatos/nexus-state/tree/main/packages/immer)           | Immer integration       |
| [@nexus-state/async](https://github.com/eustatos/nexus-state/tree/main/packages/async)           | Async state management  |
| [@nexus-state/family](https://github.com/eustatos/nexus-state/tree/main/packages/family)         | Atom families           |
| [@nexus-state/vue](https://github.com/eustatos/nexus-state/tree/main/packages/vue)               | Vue.js bindings         |
| [@nexus-state/svelte](https://github.com/eustatos/nexus-state/tree/main/packages/svelte)         | Svelte bindings         |
| [@nexus-state/web-worker](https://github.com/eustatos/nexus-state/tree/main/packages/web-worker) | Web Worker support      |

---

## 📄 License

MIT
