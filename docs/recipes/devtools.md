# DevTools Integration

Using the Nexus State DevTools for debugging and time-travel.

## Overview

Nexus State DevTools provides powerful debugging capabilities including:

- **State Inspection**: View all atoms and their current values
- **Action Tracking**: See all state changes with full history
- **Time-Travel Debugging**: Navigate between different states
- **Stack Traces**: Understand where state changes originate
- **Batch Updates**: Group related state changes for better organization

## Installation

```bash
npm install @nexus-state/devtools
```

## Basic Setup

### React with DevTools

```javascript
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/react';
import { devTools } from '@nexus-state/devtools';

// Create atoms
const countAtom = atom(0, 'counter');
const firstNameAtom = atom('John', 'firstName');
const lastNameAtom = atom('Doe', 'lastName');

// Create store
const store = createStore();

// Apply devtools plugin
const devtoolsPlugin = devTools();
devtoolsPlugin.apply(store);

// In your React component
function App() {
  const [count, setCount] = useAtom(countAtom, store);
  const [firstName] = useAtom(firstNameAtom, store);
  const [lastName] = useAtom(lastNameAtom, store);
  
  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <p>Name: {firstName} {lastName}</p>
    </div>
  );
}
```

## Configuration Options

```javascript
import { devTools } from '@nexus-state/devtools';

const devtoolsPlugin = devTools({
  name: 'My Application',           // App name displayed in DevTools
  trace: true,                      // Enable stack trace capture
  traceLimit: 10,                   // Maximum stack trace depth
  maxAge: 100,                      // Maximum history depth
  showAtomNames: true,              // Display atom names
  latency: 50,                      // Delay before sending updates (ms)
  actionNamingStrategy: 'auto',     // or 'manual'
  stateSanitizer: (state) => state, // Custom state sanitization
});

devtoolsPlugin.apply(store);
```

### Configuration Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | `'Nexus State'` | App name for DevTools identification |
| `trace` | `boolean` | `false` | Enable stack trace capture |
| `traceLimit` | `number` | `5` | Maximum depth of stack traces |
| `maxAge` | `number` | `50` | Maximum number of history entries |
| `showAtomNames` | `boolean` | `true` | Show atom names in DevTools |
| `latency` | `number` | `50` | Delay in ms before sending updates |
| `actionNamingStrategy` | `'auto' \| 'manual'` | `'auto'` | How actions are named |
| `stateSanitizer` | `(state) => state` | Identity | Function to sanitize state before sending |

## Using DevTools

### Opening DevTools

1. Install the [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) browser extension (Chrome/Firefox)
2. Open DevTools in your browser (usually F12 or right-click → Inspect)
3. Navigate to the "Nexus State" tab

### Time-Travel Debugging

In the DevTools interface:

1. **Jump to State**: Click on any state in the history to revert to it
2. **Undo/Redo**: Use the buttons to navigate through states
3. **State Inspector**: View the complete state tree at any point
4. **Action List**: See all actions with timestamps and payloads

### Action Naming Strategies

#### Auto Naming (Default)

With auto-naming, actions are automatically named based on atom names:

```javascript
const countAtom = atom(0, 'counter');

store.set(countAtom, 5); // Action: counter SET
```

#### Manual Naming

With manual naming, you control action names:

```javascript
const devtoolsPlugin = devTools({
  actionNamingStrategy: 'manual'
});

devtoolsPlugin.apply(store);

// Manual naming
store.set(countAtom, 5, 'INCREMENT_COUNTER');
store.set(firstNameAtom, 'Jane', 'UPDATE_FIRST_NAME');
```

### Batch Updates

Group related state changes into a single DevTools action:

```javascript
// Group multiple updates
store.startBatch('user-update');
store.set(firstNameAtom, 'Jane');
store.set(lastNameAtom, 'Smith');
store.set(ageAtom, 25);
store.endBatch('user-update');
```

### Stack Traces

Capture stack traces to see where state changes originate:

```javascript
const devtoolsPlugin = devTools({
  trace: true,
  traceLimit: 10
});

devtoolsPlugin.apply(store);

// Now in DevTools, you'll see stack traces for each action
store.set(countAtom, 5);
```

### State Sanitization

Remove sensitive data from DevTools:

```javascript
const devtoolsPlugin = devTools({
  stateSanitizer: (state) => {
    // Create a copy of state
    const sanitized = { ...state };
    
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secretKey;
    
    return sanitized;
  }
});

devtoolsPlugin.apply(store);
```

## Advanced Examples

### Complete Form with Validation

```javascript
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/react';
import { devTools } from '@nexus-state/devtools';

// Form atoms
const firstNameAtom = atom('John', 'firstName');
const lastNameAtom = atom('Doe', 'lastName');
const ageAtom = atom(30, 'age');
const emailAtom = atom('john@example.com', 'email');

// Computed atoms
const fullNameAtom = atom(
  (get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`,
  'fullName'
);

const isValidAtom = atom(
  (get) => {
    const email = get(emailAtom);
    const age = get(ageAtom);
    
    return (
      /\S+@\S+\.\S+/.test(email) &&
      age >= 0 &&
      age <= 150
    );
  },
  'isValid'
);

// Store with DevTools
const store = createStore();
const devtoolsPlugin = devTools();
devtoolsPlugin.apply(store);

function Form() {
  const [firstName, setFirstName] = useAtom(firstNameAtom, store);
  const [lastName, setLastName] = useAtom(lastNameAtom, store);
  const [age, setAge] = useAtom(ageAtom, store);
  const [email, setEmail] = useAtom(emailAtom, store);
  const [fullName] = useAtom(fullNameAtom, store);
  const [isValid] = useAtom(isValidAtom, store);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Submit with batched updates
    store.startBatch('form-submission');
    store.set(firstNameAtom, '');
    store.set(lastNameAtom, '');
    store.set(ageAtom, 0);
    store.set(emailAtom, '');
    store.endBatch('form-submission');
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>First Name:</label>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      
      <div>
        <label>Last Name:</label>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      
      <div>
        <label>Age:</label>
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(parseInt(e.target.value) || 0)}
        />
      </div>
      
      <div>
        <label>Email:</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      
      <p>Full Name: {fullName}</p>
      <p>Form Valid: {isValid ? 'Yes' : 'No'}</p>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Time Travel in Development

Enable time travel only in development:

```javascript
import { atom, createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

const store = createStore();

if (process.env.NODE_ENV === 'development') {
  const devtoolsPlugin = devTools({
    name: 'My App (Dev)',
    trace: true,
    maxAge: 100
  });
  
  devtoolsPlugin.apply(store);
}
```

## Best Practices

### 1. Use Descriptive Atom Names

```javascript
// Bad
const a = atom(0);
const b = atom('');

// Good
const userCountAtom = atom(0, 'userCount');
const userNameAtom = atom('', 'userName');
```

### 2. Batch Related Updates

```javascript
// Group related changes
store.startBatch('user-profile-update');
store.set(firstNameAtom, newData.firstName);
store.set(lastNameAtom, newData.lastName);
store.set(emailAtom, newData.email);
store.endBatch('user-profile-update');
```

### 3. Sanitize Sensitive Data

Always sanitize state before sending to DevTools:

```javascript
const devtoolsPlugin = devTools({
  stateSanitizer: (state) => {
    const sanitized = { ...state };
    
    // Remove sensitive data
    Object.keys(sanitized).forEach(key => {
      if (key.includes('password') || key.includes('token')) {
        delete sanitized[key];
      }
    });
    
    return sanitized;
  }
});
```

### 4. Limit History in Production

```javascript
const devtoolsPlugin = devTools({
  maxAge: process.env.NODE_ENV === 'production' ? 10 : 100
});

devtoolsPlugin.apply(store);
```

### 5. Use Stack Traces in Development

```javascript
const devtoolsPlugin = devTools({
  trace: process.env.NODE_ENV === 'development',
  traceLimit: 10
});

devtoolsPlugin.apply(store);
```

## Troubleshooting

### DevTools Not Connecting

1. Ensure Redux DevTools extension is installed
2. Check that `devTools()` plugin is applied before store usage
3. Verify no errors in browser console

### Performance Issues

1. Reduce `maxAge` to limit history size
2. Increase `latency` to reduce update frequency
3. Enable `stateSanitizer` to reduce payload size

### Missing Atom Names

1. Ensure atoms have names: `atom(0, 'myAtom')`
2. Check `showAtomNames` option is `true`
3. Verify atoms are created after DevTools plugin is applied

## Examples

- [Basic Counter](/examples/counter) - Simple counter with DevTools
- [Form with Validation](/recipes/forms) - Complex form with computed atoms
- [Async Data](/recipes/async-atoms) - Handling async state
- [DevTools Demo App](/examples/devtools-demo) - Complete demo application
