# @nexus-state/react

Nexus State integration with React

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

## Installation

```bash
npm install @nexus-state/react
```

## Key Features

- **useAtom Hook**: Easy atom access in React components
- **useAtomValue Hook**: Read-only access (optimized for performance)
- **useSetAtom Hook**: Write-only access (no re-renders)
- **Selective Updates**: Components only re-render when their atoms change
- **Computed Atoms Support**: Automatically recalculate when dependencies change
- **Store Integration**: Works with multiple stores
- **TypeScript Support**: Full type inference

## Quick Start

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
  return (
    <input
      onChange={(e) => setName(e.target.value)}
      placeholder="Name"
    />
  );
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
  return (
    <input onChange={(e) => setName(e.target.value)} />
  );
}

// ✅ WITH split hooks - NO unnecessary re-renders
function NewFormInput() {
  const setName = useSetAtom(nameAtom, store);
  // ✅ NO subscription
  // ✅ Never re-renders from atom changes
  return (
    <input onChange={(e) => setName(e.target.value)} />
  );
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
    <button onClick={() => setCount(prev => prev + 1)}>
      Increment
    </button>
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

## API Reference

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
const handleTransfer = useAtomCallback(
  (get, set, amount) => {
    const balance = get(balanceAtom);
    if (balance >= amount) {
      set(balanceAtom, balance - amount);
      set(historyAtom, [...get(historyAtom), `Transferred ${amount}`]);
    }
  },
  store
);
```

**Benefits:**
- ✅ Access to multiple atoms in single callback
- ✅ Stable reference (memoized)
- ✅ Clean API for complex operations

### Comparison Table

| Hook | Reads | Writes | Subscribes | Re-renders | Use Case |
|------|-------|--------|------------|------------|----------|
| `useAtom` | ✅ | ✅ | ✅ | ✅ | Controlled inputs |
| `useAtomValue` | ✅ | ❌ | ✅ | ✅ | Display components |
| `useSetAtom` | ❌ | ✅ | ❌ | ❌ | Buttons, form inputs |
| `useAtomCallback` | ✅ | ✅ | ❌ | ❌ | Complex operations |

## License

MIT