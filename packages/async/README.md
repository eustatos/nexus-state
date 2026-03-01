# @nexus-state/async

Asynchronous utilities for Nexus State

## Description

The `@nexus-state/async` package provides tools for working with asynchronous operations in the context of application state management.

## Installation

```bash
npm install @nexus-state/async
```

## Key Features

- Asynchronous operation management
- Integration with the core Nexus State
- Operation cancellation support

## Usage Example

```javascript
import { createAsyncOperation } from '@nexus-state/async';

const asyncOp = createAsyncOperation(async () => {
  // Your asynchronous code here
  return await fetchData();
});

// Usage in your application
```

## License

MIT