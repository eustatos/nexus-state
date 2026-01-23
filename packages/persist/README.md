# @nexus-state/persist

Persistence for Nexus State

## Description

The `@nexus-state/persist` package provides tools for saving application state between sessions.

## Installation

```bash
npm install @nexus-state/persist
```

## Key Features

- State persistence in localStorage/sessionStorage
- Support for different persistence strategies
- Ability to selectively persist parts of the state

## Usage Example

```javascript
import { createPersist } from '@nexus-state/persist';

const persist = createPersist({
  key: 'my-app-state',
  storage: localStorage
});

// Connecting to the store
store.use(persist);
```

## License

MIT