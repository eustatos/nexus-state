# @nexus-state/family

Utilities for working with state "families" in Nexus State

## Description

The `@nexus-state/family` package provides tools for managing groups of related states in an application.

## Installation

```bash
npm install @nexus-state/family
```

## Key Features

- Creating and managing state "families"
- Synchronization of related states
- Support for hierarchical structure

## Usage Example

```javascript
import { createFamily } from '@nexus-state/family';

const family = createFamily({
  user: {
    name: '',
    age: 0
  },
  settings: {
    theme: 'light'
  }
});

// Working with state
family.setState({
  user: {
    name: 'John',
    age: 30
  }
});
```

## License

MIT