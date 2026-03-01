/**
 * Mock Redux DevTools extension for testing purposes.
 */

export type MockDevToolsMessage = {
  type: string;
  payload?: unknown;
  state?: string;
};

export class MockDevToolsConnection {
  private listeners: Array<(message: MockDevToolsMessage) => void> = [];
  private sentActions: Array<{ action: string | { type: string }; state: unknown }> = [];
  private initialState: unknown = null;

  /**
   * Send an action and state to the DevTools.
   * @param action The action name or object
   * @param state The state
   */
  send(action: string | { type: string }, state: unknown): void {
    this.sentActions.push({ action, state });
  }

  /**
   * Subscribe to messages from the DevTools.
   * @param listener The listener function
   * @returns A function to unsubscribe
   */
  subscribe(listener: (message: MockDevToolsMessage) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Initialize with initial state.
   * @param state The initial state
   */
  init(state: unknown): void {
    this.initialState = state;
  }

  /**
   * Unsubscribe all listeners.
   */
  unsubscribe(): void {
    this.listeners = [];
  }

  /**
   * Simulate sending a message from DevTools.
   * @param message The message to send
   */
  simulateMessage(message: MockDevToolsMessage): void {
    this.listeners.forEach(listener => listener(message));
  }

  /**
   * Get the list of sent actions.
   * @returns Array of sent actions
   */
  getSentActions(): Array<{ action: string | { type: string }; state: unknown }> {
    return [...this.sentActions];
  }

  /**
   * Get the initial state.
   * @returns The initial state
   */
  getInitialState(): unknown {
    return this.initialState;
  }

  /**
   * Reset the connection state.
   */
  reset(): void {
    this.sentActions = [];
    this.initialState = null;
  }
}

export class MockDevToolsExtension {
  private connections: Map<string, MockDevToolsConnection> = new Map();

  /**
   * Connect to DevTools.
   * @param options Connection options
   * @returns A DevTools connection
   */
  connect(options: { name?: string } = {}): MockDevToolsConnection {
    const name = options.name || 'nexus-state';
    const connection = new MockDevToolsConnection();
    this.connections.set(name, connection);
    return connection;
  }

  /**
   * Get a connection by name.
   * @param name The connection name
   * @returns The connection or undefined
   */
  getConnection(name: string): MockDevToolsConnection | undefined {
    return this.connections.get(name);
  }

  /**
   * Get all connection names.
   * @returns Array of connection names
   */
  getConnectionNames(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Reset all connections.
   */
  reset(): void {
    this.connections.forEach(connection => connection.reset());
    this.connections.clear();
  }
}

// Global mock extension instance
export const mockDevToolsExtension = new MockDevToolsExtension();

// Type declaration for global window object
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: MockDevToolsExtension;
  }
}

/**
 * Install the mock DevTools extension globally.
 */
export function installMockDevTools(): void {
  if (typeof window !== 'undefined') {
    window.__REDUX_DEVTOOLS_EXTENSION__ = mockDevToolsExtension;
  }
}

/**
 * Uninstall the mock DevTools extension globally.
 */
export function uninstallMockDevTools(): void {
  if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__ === mockDevToolsExtension) {
    delete (window as Record<string, unknown>).__REDUX_DEVTOOLS_EXTENSION__;
  }
}

/**
 * Create a mock store for testing.
 * @returns A mock store object
 */
export function createMockStore() {
  const state: Record<string, unknown> = {};
  const listeners: Array<() => void> = [];

  return {
    get: jest.fn(),
    set: jest.fn(),
    subscribe: jest.fn((atom: unknown, listener: () => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      };
    }),
    getState: jest.fn(() => ({ ...state })),
    serializeState: jest.fn(() => ({ ...state })),
  };
}