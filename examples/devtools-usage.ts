/**
 * Example usage of the DevTools plugin
 */

import { createStore, atom } from '@nexus-state/core';
import { devTools, DevToolsPlugin } from '../packages/devtools/src';

// Create some atoms
const countAtom = atom(0);
const nameAtom = atom('John Doe');
const todosAtom = atom([
  { id: 1, text: 'Learn nexus-state', completed: false },
  { id: 2, text: 'Implement DevTools plugin', completed: true },
]);

// Example 1: Using the factory function
const store1 = createStore([
  // Apply DevTools plugin with default configuration
  devTools(),
]);

// Example 2: Using the factory function with custom configuration
const store2 = createStore([
  // Apply DevTools plugin with custom configuration
  devTools({
    name: 'My App Store',
    trace: true,
    latency: 200,
    maxAge: 100,
    // Sanitize actions (optional)
    actionSanitizer: () => {
      // Filter out actions that contain sensitive data
      return !true; // Simplified for linting
    },
    // Sanitize state (optional)
    stateSanitizer: (state) => {
      // Remove sensitive data from state
      const sanitized = { ...(state as Record<string, unknown>) };
      if (sanitized.password) {
        sanitized.password = '[REDACTED]';
      }
      return sanitized;
    },
  }),
]);

// Example 3: Using the class directly
const devToolsPlugin = new DevToolsPlugin({
  name: 'Custom Store',
  trace: false,
  latency: 150,
  maxAge: 75,
});

const store3 = createStore([
  // Apply DevTools plugin directly
  (store) => devToolsPlugin.apply(store),
]);

// Example usage of the stores
console.log('Store 1 count:', store1.get(countAtom));
console.log('Store 2 name:', store2.get(nameAtom));
console.log('Store 3 todos:', store3.get(todosAtom));

// Update some values
store1.set(countAtom, 1);
store2.set(nameAtom, 'Jane Doe');
store3.set(todosAtom, [
  ...store3.get(todosAtom),
  { id: 3, text: 'Use DevTools plugin', completed: false },
]);

// With enhanced stores that support metadata
if (store1.setWithMetadata) {
  store1.setWithMetadata(
    countAtom,
    2,
    {
      type: 'INCREMENT',
      source: 'User Click',
      timestamp: Date.now(),
    }
  );
}

// Get serialized state for DevTools
const state1 = store1.serializeState?.() || store1.getState();
const state2 = store2.serializeState?.() || store2.getState();
const state3 = store3.serializeState?.() || store3.getState();

console.log('Store 1 state:', state1);
console.log('Store 2 state:', state2);
console.log('Store 3 state:', state3);

export { store1, store2, store3 };