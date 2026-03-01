# @nexus-state/vue

Nexus State integration with Vue

## Description

The `@nexus-state/vue` package provides tools for integrating Nexus State with Vue applications.

## Installation

```bash
npm install @nexus-state/vue
```

## Key Features

- Plugins for Vue integration
- Reactive bindings to state
- Support for Composition API and Options API

## Usage Example

```javascript
import { createStore } from '@nexus-state/vue';

const store = createStore({
  count: 0
});

// In Vue components
export default {
  data() {
    return {
      count: store.state.count
    };
  },
  methods: {
    increment() {
      store.setState({ count: this.count + 1 });
    }
  }
};
```

## License

MIT