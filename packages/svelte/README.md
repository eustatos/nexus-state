# @nexus-state/svelte

Nexus State integration with Svelte

## Description

The `@nexus-state/svelte` package provides tools for integrating Nexus State with Svelte applications.

## Installation

```bash
npm install @nexus-state/svelte
```

## Key Features

- Stores compatible with Svelte
- Reactive bindings to state
- Support for Svelte-specific patterns

## Usage Example

```javascript
import { createStore } from '@nexus-state/svelte';

const store = createStore({
  count: 0
});

// Usage in Svelte components
$: count = store.state.count;

function increment() {
  store.setState({ count: count + 1 });
}
```

## License

MIT