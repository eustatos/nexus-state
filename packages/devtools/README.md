# @nexus-state/devtools

Developer tools for Nexus State

## Description

The `@nexus-state/devtools` package provides tools for debugging and developing applications based on Nexus State. It offers integration with Redux DevTools for state inspection, action tracking, and time-travel debugging.

## Installation

```bash
npm install @nexus-state/devtools
```

## Key Features

- Redux DevTools integration
- Action metadata tracking
- State serialization with circular reference handling
- Performance optimized updates
- Stack trace capture for debugging
- Time-travel debugging support
- Enhanced store API integration
- SSR environment compatibility

## Usage Example

### Basic Usage

```javascript
import { createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

// Create a store with DevTools plugin
const store = createStore([
  devTools({ name: 'My App' })
]);

// Your atoms and store usage
const countAtom = atom(0);
store.set(countAtom, 1);
```

### Advanced Configuration

```javascript
import { createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

// Create a store with advanced DevTools configuration
const store = createStore([
  devTools({ 
    name: 'My App',
    trace: true,  // Capture stack traces for actions
    latency: 50   // Debounce state updates for performance
  })
]);
```

### Using Enhanced Store Features

```javascript
import { createEnhancedStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

// Create an enhanced store with DevTools
const store = createEnhancedStore([
  devTools({ name: 'My App' })
], {
  enableDevTools: true,
  enableTimeTravel: true
});

// Set value with metadata
store.setWithMetadata(countAtom, 5, {
  type: 'USER_INCREMENT',
  source: 'CounterComponent',
  timestamp: Date.now()
});

// Serialize state for debugging
const serializedState = store.serializeState();
console.log(serializedState);
```

## API Reference

### `devTools(config)`

Creates a DevTools plugin for Nexus State stores.

#### Parameters

- `config` (Object, optional): Configuration options
  - `name` (string): Name to use for the DevTools instance (defaults to 'nexus-state')
  - `trace` (boolean): Whether to capture stack traces for actions (defaults to false)
  - `latency` (number): Delay in ms for debouncing state updates (defaults to 100)
  - `maxAge` (number): Maximum number of actions to keep in DevTools history (defaults to 50)
  - `actionSanitizer` (function): Function to determine if an action should be sent to DevTools
  - `stateSanitizer` (function): Function to sanitize state before sending to DevTools

#### Returns

- (Function): A function that applies the plugin to a store

### Enhanced Store Methods

When using `createEnhancedStore`, additional methods are available:

- `applyPlugin(plugin)`: Apply a plugin to the store
- `setWithMetadata(atom, update, metadata)`: Set atom value with action metadata
- `serializeState()`: Serialize the entire store state safely
- `getIntercepted(atom)`: Get atom value with interception
- `setIntercepted(atom, update)`: Set atom value with interception
- `getPlugins()`: Get list of applied plugins

### Types

The package exports several TypeScript types for enhanced type safety:

- `DevToolsConfig`: Configuration options for the DevTools plugin
- `DevToolsConnection`: Connection interface for DevTools integration
- `DevToolsMessage`: Message interface from DevTools
- `EnhancedStore`: Extended store interface with enhanced DevTools support

## Performance Considerations

- DevTools integration adds minimal overhead (<5ms per update) when properly configured
- Stack trace capture has performance impact and should be disabled in production
- State updates are debounced by default to reduce DevTools communication overhead
- Serialization is optimized to handle large state trees efficiently

## SSR Compatibility

The DevTools plugin automatically detects SSR environments and disables DevTools integration when `window` is not available, ensuring compatibility with server-side rendering. The plugin gracefully handles server environments without throwing errors or attempting to access browser APIs.

## License

MIT