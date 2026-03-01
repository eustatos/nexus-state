# React API

## useAtom(atom, store)

Hook to use an atom in a React component.

### Basic Usage

```javascript
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/react';

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

## Complete Example: Form with Validation

```javascript
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/react';
import { devTools } from '@nexus-state/devtools';

// User form atoms
const firstNameAtom = atom('John', 'firstName');
const lastNameAtom = atom('Doe', 'lastName');
const ageAtom = atom(30, 'age');
const emailAtom = atom('john.doe@example.com', 'email');

// Computed atoms
const fullNameAtom = atom(
  (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
  'fullName'
);

const isAdultAtom = atom(
  (get) => get(ageAtom) >= 18,
  'isAdult'
);

const emailValidAtom = atom(
  (get) => /\S+@\S+\.\S+/.test(get(emailAtom)),
  'emailValid'
);

const isValidAtom = atom(
  (get) => {
    const age = get(ageAtom);
    const firstName = get(firstNameAtom).trim().length > 0;
    const lastName = get(lastNameAtom).trim().length > 0;
    const emailValid = get(emailValidAtom);
    
    return age >= 0 && age <= 150 && firstName && lastName && emailValid;
  },
  'isValid'
);

// Create store with DevTools
const store = createStore();
const devtoolsPlugin = devTools();
devtoolsPlugin.apply(store);

function UserForm() {
  const [firstName, setFirstName] = useAtom(firstNameAtom, store);
  const [lastName, setLastName] = useAtom(lastNameAtom, store);
  const [age, setAge] = useAtom(ageAtom, store);
  const [email, setEmail] = useAtom(emailAtom, store);
  const [fullName] = useAtom(fullNameAtom, store);
  const [isAdult] = useAtom(isAdultAtom, store);
  const [isValid] = useAtom(isValidAtom, store);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      console.log('Form submitted:', {
        firstName,
        lastName,
        age,
        email,
        fullName
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
      <h2>User Information</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          First Name:
        </label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Last Name:
        </label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Age:
        </label>
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(parseInt(e.target.value) || 0)}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Email:
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <h3>Computed Values</h3>
        <p><strong>Full Name:</strong> {fullName}</p>
        <p><strong>Is Adult:</strong> {isAdult ? 'Yes' : 'No'}</p>
        <p><strong>Form Valid:</strong> {isValid ? 'Yes' : 'No'}</p>
      </div>
      
      <button type="submit" disabled={!isValid}>
        Submit Form
      </button>
    </form>
  );
}
```

## Selective Updates

React components only re-render when their specific atoms change:

```javascript
// Only this component updates when firstNameAtom changes
function FirstNameDisplay() {
  const [firstName] = useAtom(firstNameAtom, store);
  return <div>{firstName}</div>;
}

// Only this component updates when lastNameAtom changes
function LastNameDisplay() {
  const [lastName] = useAtom(lastNameAtom, store);
  return <div>{lastName}</div>;
}

// This component updates when EITHER atom changes
function FullNameDisplay() {
  const [fullName] = useAtom(fullNameAtom, store);
  return <div>{fullName}</div>;
}
```