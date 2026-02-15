# @nexus-state/react

Nexus State integration with React

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

## Installation

```bash
npm install @nexus-state/react
```

## Key Features

- **useAtom Hook**: Easy atom access in React components
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

### Computed Atoms

```javascript
const firstNameAtom = atom('John', 'firstName');
const lastNameAtom = atom('Doe', 'lastName');

const fullNameAtom = atom(
  (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
  'fullName'
);

function Profile() {
  const [fullName] = useAtom(fullNameAtom, store);
  
  return <div>{fullName}</div>;
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

Hook to access atom values in React components.

- `atom`: The atom to access
- `store`: The store instance containing the atom
- Returns: `[value, setValue]` tuple

### Example with Form

```javascript
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/react';

const firstNameAtom = atom('John', 'firstName');
const lastNameAtom = atom('Doe', 'lastName');
const ageAtom = atom(30, 'age');
const store = createStore();

function Form() {
  const [firstName, setFirstName] = useAtom(firstNameAtom, store);
  const [lastName, setLastName] = useAtom(lastNameAtom, store);
  const [age, setAge] = useAtom(ageAtom, store);
  
  return (
    <div>
      <input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      <input
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <input
        type="number"
        value={age}
        onChange={(e) => setAge(parseInt(e.target.value))}
      />
    </div>
  );
}
```

## License

MIT