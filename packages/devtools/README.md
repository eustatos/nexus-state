# @nexus-state/devtools

> Developer tools for Nexus State — Redux DevTools integration with time-travel debugging
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/devtools)](https://www.npmjs.com/package/@nexus-state/devtools)
> [![Coverage for devtools package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=devtools)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 📦 Installation

```bash
npm install @nexus-state/devtools @nexus-state/time-travel
```

---

## 🔗 See Also

- **Core:** [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) — Foundation (atoms, stores)
- **Framework integration:**
  - [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react) — React hooks
  - [@nexus-state/vue](https://www.npmjs.com/package/@nexus-state/vue) — Vue composables
  - [@nexus-state/svelte](https://www.npmjs.com/package/@nexus-state/svelte) — Svelte stores
- **Related:**
  - [@nexus-state/time-travel](https://www.npmjs.com/package/@nexus-state/time-travel) — Time-travel debugging
  - [@nexus-state/middleware](https://www.npmjs.com/package/@nexus-state/middleware) — Plugin system

**Full ecosystem:** [Nexus State Packages](https://www.npmjs.com/org/nexus-state)

---

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
import { SimpleTimeTravel } from '@nexus-state/time-travel';

// Create atom
const countAtom = atom(0, 'counter');

// Create store
const store = createStore();

// Create time travel instance
const timeTravel = new SimpleTimeTravel(store);

// Apply devtools plugin
const devtoolsPlugin = devTools();
devtoolsPlugin.apply(store);
devtoolsPlugin.setTimeTravel(timeTravel);
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
>
> [![Coverage for devtools package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=devtools)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
});

devtoolsPlugin.apply(store);
```

## Usage Examples

### React Integration

```javascript
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/react';
import { devTools } from '@nexus-state/devtools';
import { SimpleTimeTravel } from '@nexus-state/time-travel';

const countAtom = atom(0, 'counter');
const firstNameAtom = atom('John', 'firstName');
const lastNameAtom = atom('Doe', 'lastName');

const store = createStore();
const timeTravel = new SimpleTimeTravel(store);
const devtoolsPlugin = devTools();
devtoolsPlugin.apply(store);
devtoolsPlugin.setTimeTravel(timeTravel);

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

The DevTools plugin now uses @nexus-state/time-travel for state navigation. To enable time travel:

```javascript
import { SimpleTimeTravel } from '@nexus-state/time-travel';

const timeTravel = new SimpleTimeTravel(store);
devtoolsPlugin.setTimeTravel(timeTravel);
```

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
