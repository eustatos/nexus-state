// DevTools plugin for nexus-state
import { Store } from "@nexus-state/core";

// Declare global types for Redux DevTools
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: {
      connect: (options: { name: string }) => {
        send: (action: string, state: unknown) => void;
        subscribe: (listener: (message: unknown) => void) => void;
      };
    };
  }
}

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
    if (typeof window === "undefined" || !window.__REDUX_DEVTOOLS_EXTENSION__) {
      console.warn("Redux DevTools are not available");
      return;
    }

    const { name = "nexus-state" } = config;

    // Create a connection to DevTools
    const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({ name });

    // Create a dummy atom for subscription
    // This is a workaround since we can't subscribe to the entire store
    let lastState: unknown = null;

    // We need to find a way to track state changes
    // Since we can't directly subscribe to all atoms, we'll use a polling approach
    const interval = setInterval(() => {
      try {
        const currentState = store.getState();
        if (JSON.stringify(currentState) !== JSON.stringify(lastState)) {
          lastState = currentState;
          devTools.send("STATE_UPDATE", currentState);
        }
      } catch (error) {
        console.warn("Failed to send state update to DevTools:", error);
      }
    }, 100);

    // Clean up interval when window is unloaded
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        clearInterval(interval);
      });
    }

    // Send initial state
    setTimeout(() => {
      try {
        const state = store.getState();
        lastState = state;
        devTools.send("INITIAL_STATE", state);
      } catch (error) {
        console.warn("Failed to send initial state to DevTools:", error);
      }
    }, 0);

    // Handle actions from DevTools (e.g., time travel)
    devTools.subscribe((message: unknown) => {
      if (
        typeof message === "object" &&
        message !== null &&
        (message as { type?: string }).type === "DISPATCH" &&
        (message as { payload?: { type?: string } }).payload?.type === "JUMP_TO_ACTION"
      ) {
        // Logic for state restoration should be implemented here
        // Since we don't have direct access to the internal state of atoms,
        // we cannot fully implement time travel without core modifications
        console.warn(
          "Time travel is not fully supported without core modifications",
        );
      }
    });
  };
}