# @nexus-state/react

Nexus State integration with React

## Description

The `@nexus-state/react` package provides tools for integrating Nexus State with React applications.

## Installation

```bash
npm install @nexus-state/react
```

## Key Features

- Hooks for working with state in React components
- Higher-order components (HOC)
- React context support

## Usage Example

```javascript
import { useStore } from '@nexus-state/react';

function MyComponent() {
  const [state, setState] = useStore();

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => setState({ count: state.count + 1 })}>
        Increment
      </button>
    </div>
  );
}
```

## License

MIT