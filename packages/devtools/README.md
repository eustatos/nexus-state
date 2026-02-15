# @nexus-state/devtools

Developer tools for Nexus State

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

## Installation

```bash
npm install @nexus-state/devtools
```

## Features

- **State Inspection**: View all atoms and their values
- **Action Tracking**: Track all state changes with full history
- **Time-Travel Debugging**: Move between different states
- **Atom Naming**: Display meaningful atom names
- **Stack Traces**: See where state changes originate
- **Batch Updates**: Group related state changes
- **Performance**: Lazy state serialization for large state trees

## Quick Start

### Basic Setup

```javascript
import { atom, createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

// Create atom
const countAtom = atom(0, 'counter');

// Create store
const store = createStore();

// Apply devtools plugin
const devtoolsPlugin = devTools();
devtoolsPlugin.apply(store);
```

### With Configuration

```javascript
import { devTools } from '@nexus-state/devtools';

const devtoolsPlugin = devTools({
  name: 'My App',           // App name for DevTools
  trace: true,              // Enable stack trace capture
  traceLimit: 5,            // Limit stack trace depth
  maxAge: 100,              // Maximum history depth
  showAtomNames: true,      // Show atom names
  latency: 50,              // Delay before sending updates (ms)
  actionNamingStrategy: 'auto', // or 'manual'
  stateSanitizer: (state) => state, // Custom state sanitization
});

devtoolsPlugin.apply(store);
```

## Usage Examples

### React Integration

```javascript
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/react';
import { devTools } from '@nexus-state/devtools';

const countAtom = atom(0, 'counter');
const firstNameAtom = atom('John', 'firstName');
const lastNameAtom = atom('Doe', 'lastName');

const store = createStore();
const devtoolsPlugin = devTools();
devtoolsPlugin.apply(store);

function Counter() {
  const [count, setCount] = useAtom(countAtom, store);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}

function Profile() {
  const [firstName] = useAtom(firstNameAtom, store);
  const [lastName] = useAtom(lastNameAtom, store);
  
  return (
    <div>
      <p>Name: {firstName} {lastName}</p>
    </div>
  );
}
```

### Time Travel

Use the DevTools interface to:
- Click "Jump to State" to revert to any previous state
- Use "Undo" and "Redo" buttons to navigate history
- Inspect the state at any point in time

### Action Naming Strategies

```javascript
// Auto-naming (default)
const devtoolsPlugin = devTools({
  actionNamingStrategy: 'auto'
});

// Manual naming
store.set(countAtom, 5, 'INCREMENT_COUNT');

// Custom action naming
const devtoolsPlugin = devTools({
  actionNamingStrategy: 'manual'
});
```

### Stack Trace Capture

```javascript
const devtoolsPlugin = devTools({
  trace: true,        // Enable stack trace capture
  traceLimit: 10      // Limit to 10 frames
});

devtoolsPlugin.apply(store);
```

### State Sanitization

```javascript
const devtoolsPlugin = devTools({
  stateSanitizer: (state) => {
    // Remove sensitive data
    return {
      ...state,
      password: '[REDACTED]',
      token: '[REDACTED]'
    };
  }
});

devtoolsPlugin.apply(store);
```

### Batch Updates

```javascript
// Group multiple updates into single DevTools action
store.startBatch('user-update');
store.set(firstNameAtom, 'Jane');
store.set(lastNameAtom, 'Smith');
store.set(ageAtom, 25);
store.endBatch('user-update');
```

## Testing

```bash
npm test
npm run test:e2e
```

## License

MIT
