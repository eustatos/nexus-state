# @nexus-state/middleware

Middleware for Nexus State

## Description

The `@nexus-state/middleware` package provides tools for creating and using middleware in Nexus State.

## Installation

```bash
npm install @nexus-state/middleware
```

## Key Features

- Creating middleware to intercept and modify actions
- Support for asynchronous middleware
- Integration with the core Nexus State

## Usage Example

```javascript
import { createMiddleware } from '@nexus-state/middleware';

const loggerMiddleware = createMiddleware((action, next) => {
  console.log('Action:', action);
  return next(action);
});

// Connecting to the store
store.use(loggerMiddleware);
```

## License

MIT