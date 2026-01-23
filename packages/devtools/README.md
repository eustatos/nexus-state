# @nexus-state/devtools

Developer tools for Nexus State

## Description

The `@nexus-state/devtools` package provides tools for debugging and developing applications based on Nexus State.

## Installation

```bash
npm install @nexus-state/devtools
```

## Key Features

- State introspection
- Change logging
- Integration with browser developer tools

## Usage Example

```javascript
import { createDevtools } from '@nexus-state/devtools';

const devtools = createDevtools();

// Connecting to your store
store.use(devtools);
```

## License

MIT