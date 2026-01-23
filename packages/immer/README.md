# @nexus-state/immer

Immer integration with Nexus State

## Description

The `@nexus-state/immer` package provides integration of the Immer library with Nexus State to simplify working with immutable data structures.

## Installation

```bash
npm install @nexus-state/immer
```

## Key Features

- Immer integration with Nexus State store
- Simplified work with immutable structures
- Draft support for state modification

## Usage Example

```javascript
import { createImmerStore } from '@nexus-state/immer';

const store = createImmerStore({
  users: []
});

// Using a draft to modify state
store.setState((draft) => {
  draft.users.push({ id: 1, name: 'John' });
});
```

## License

MIT