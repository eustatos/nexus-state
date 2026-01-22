// DevTools plugin for nexus-state
import { Store } from '@nexus-state/core';

/**
 * Configuration options for the devTools plugin.
 * @typedef {Object} DevToolsConfig
 * @property {string} [name] - The name to use for the DevTools instance (defaults to 'nexus-state')
 */
type DevToolsConfig = {
  name?: string;
};

/**
 * Plugin to integrate with Redux DevTools for debugging state changes.
 * @param {DevToolsConfig} [config] - Configuration options for the plugin
 * @returns {Function} A function that applies the plugin to a store
 * @example
 * const store = createStore([
 *   devTools({ name: 'My App' })
 * ]);
 */
export function devTools(config: DevToolsConfig = {}): (store: Store) => void {
  return (store: Store) => {
    // Check if Redux DevTools are available
    if (typeof window === 'undefined' || !window.__REDUX_DEVTOOLS_EXTENSION__) {
      console.warn('Redux DevTools are not available');
      return;
    }

    const { name = 'nexus-state' } = config;
    
    // Create a connection to DevTools
    const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({ name });
    
    // Subscribe to store changes
    store.subscribe(() => {
      const state = store.getState();
      devTools.send('STATE_CHANGE', state);
    });

    // Handle actions from DevTools (e.g., time travel)
    devTools.subscribe((message: any) => {
      if (message.type === 'DISPATCH' && message.payload?.type === 'JUMP_TO_ACTION') {
        // Logic for state restoration should be implemented here
        // Since we don't have direct access to the internal state of atoms,
        // we cannot fully implement time travel without core modifications
        console.warn('Time travel is not fully supported without core modifications');
      }
    });
  };
}