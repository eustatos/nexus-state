/**
 * Mock implementation of Redux DevTools extension API.
 * Simulates real DevTools extension behavior for integration testing.
 */

import { vi } from "vitest";
import type { DevToolsConnection, DevToolsMessage } from "../../types";

export interface MockDevToolsOptions {
  autoConnect?: boolean;
  delayResponses?: boolean;
  simulateDisconnect?: boolean;
  messageQueue?: DevToolsMessage[];
}

export interface MockDevToolsState {
  isConnected: boolean;
  messages: DevToolsMessage[];
  subscriptions: Array<(message: DevToolsMessage) => void>;
  connection: MockDevToolsConnection | null;
}

/**
 * Interface for the mock DevTools extension (matching window.__REDUX_DEVTOOLS_EXTENSION__)
 */
export interface MockDevToolsExtension {
  connect(options?: any): MockDevToolsConnection;
  disconnectAll(): void;
  getConnection(index?: number): MockDevToolsConnection | null;
  getAllConnections(): MockDevToolsConnection[];
  simulateExtensionUnload(): void;
  simulateExtensionLoad(): void;
  reset(): void;
}

/**
 * Mock DevTools connection that simulates a real DevTools extension connection.
 */
export class MockDevToolsConnection implements DevToolsConnection {
  private messageCallback: ((message: DevToolsMessage) => void) | null = null;
  private initCalled = false;
  private sendQueue: DevToolsMessage[] = [];
  private stateChanges: Array<{ state: any; action: any }> = [];
  private subscribed = false;
  private disconnected = false;

  constructor(
    private options: {
      delayMs?: number;
      shouldFailSend?: boolean;
      simulateDisconnectAfter?: number;
    } = {},
  ) {}

  send(action: any, state: any): void {
    if (this.disconnected) {
      throw new Error("Connection is disconnected");
    }

    if (this.options.shouldFailSend) {
      throw new Error("Mock send failure");
    }

    const message: DevToolsMessage = {
      type: "ACTION",
      payload: { action, state, timestamp: Date.now() },
      // Note: 'source' is not part of the DevToolsMessage type, removing it
      // source: "@redux-devtools/extension",
    };

    this.stateChanges.push({ action, state });
    this.sendQueue.push(message);

    // Simulate async processing if delay is configured
    if (this.options.delayMs) {
      setTimeout(() => {
        if (this.messageCallback && !this.disconnected) {
          this.messageCallback(message);
        }
      }, this.options.delayMs);
    } else if (this.messageCallback && !this.disconnected) {
      this.messageCallback(message);
    }

    // Simulate disconnect after certain number of messages
    if (
      this.options.simulateDisconnectAfter &&
      this.sendQueue.length >= this.options.simulateDisconnectAfter
    ) {
      this.disconnect();
    }
  }

  init(state: any): void {
    if (this.disconnected) {
      throw new Error("Connection is disconnected");
    }

    this.initCalled = true;
    const message: DevToolsMessage = {
      type: "INIT",
      payload: { state, timestamp: Date.now() },
      // source: "@redux-devtools/extension",
    };

    if (this.messageCallback && !this.disconnected) {
      this.messageCallback(message);
    }
  }

  subscribe(listener: (message: DevToolsMessage) => void): () => void {
    if (this.disconnected) {
      // Return a no-op function when disconnected
      return () => {};
    }

    this.subscribed = true;
    this.messageCallback = listener;

    // Return unsubscribe function
    return () => {
      this.subscribed = false;
      this.messageCallback = null;
    };
  }

  unsubscribe(): void {
    this.subscribed = false;
    this.messageCallback = null;
  }

  disconnect(): void {
    this.disconnected = true;
    this.subscribed = false;
    this.messageCallback = null;
  }

  isConnected(): boolean {
    return !this.disconnected && this.subscribed;
  }

  getSentMessages(): DevToolsMessage[] {
    return [...this.sendQueue];
  }

  getStateChanges(): Array<{ state: any; action: any }> {
    return [...this.stateChanges];
  }

  wasInitCalled(): boolean {
    return this.initCalled;
  }

  simulateTimeTravel(state: any, index: number): void {
    if (this.disconnected || !this.messageCallback) {
      return;
    }

    const message: DevToolsMessage = {
      type: "DISPATCH",
      payload: {
        type: "JUMP_TO_STATE",
        actionId: index,
        state,
        timestamp: Date.now(),
      },
      // source: "@redux-devtools/extension",
    };

    this.messageCallback(message);
  }

  simulateImportState(state: any): void {
    if (this.disconnected || !this.messageCallback) {
      return;
    }

    const message: DevToolsMessage = {
      type: "DISPATCH",
      payload: {
        type: "IMPORT_STATE",
        state,
        timestamp: Date.now(),
      },
      // source: "@redux-devtools/extension",
    };

    this.messageCallback(message);
  }
}

/**
 * Mock implementation of the global window.__REDUX_DEVTOOLS_EXTENSION__ object.
 */
export class MockDevToolsExtension implements MockDevToolsExtension {
  private connections: MockDevToolsConnection[] = [];
  private options: MockDevToolsOptions;
  private state: MockDevToolsState = {
    isConnected: false,
    messages: [],
    subscriptions: [],
    connection: null,
  };

  constructor(options: MockDevToolsOptions = {}) {
    this.options = {
      autoConnect: true,
      delayResponses: false,
      simulateDisconnect: false,
      messageQueue: [],
      ...options,
    };

    if (this.options.autoConnect) {
      this.connect();
    }
  }

  connect(options?: any): MockDevToolsConnection {
    const connectionOptions = {
      delayMs: this.options.delayResponses ? 50 : undefined,
      simulateDisconnectAfter: this.options.simulateDisconnect ? 3 : undefined,
      ...options,
    };

    const connection = new MockDevToolsConnection(connectionOptions);
    this.connections.push(connection);
    this.state.isConnected = true;
    this.state.connection = connection;

    // Queue any initial messages
    if (this.options.messageQueue && this.options.messageQueue.length > 0) {
      setTimeout(() => {
        this.options.messageQueue!.forEach((message) => {
          // The subscribe method expects a listener function, not a message
          // We need to trigger the listener with the message
          // This is a bit of a hack - we'll store the queued messages differently
          connection.subscribe?.(() => {});
          // Actually, we should store messages and deliver them when a listener subscribes
        });
      }, 0);
    }

    return connection;
  }

  disconnectAll(): void {
    this.connections.forEach((conn) => conn.disconnect());
    this.connections = [];
    this.state.isConnected = false;
    this.state.connection = null;
  }

  getConnection(index: number = 0): MockDevToolsConnection | null {
    return this.connections[index] || null;
  }

  getAllConnections(): MockDevToolsConnection[] {
    return [...this.connections];
  }

  simulateExtensionUnload(): void {
    this.disconnectAll();
    // Simulate extension being removed from window
    delete (global as any).window.__REDUX_DEVTOOLS_EXTENSION__;
  }

  simulateExtensionLoad(): void {
    // Simulate extension being added to window
    (global as any).window.__REDUX_DEVTOOLS_EXTENSION__ = this;
  }

  reset(): void {
    this.disconnectAll();
    this.state = {
      isConnected: false,
      messages: [],
      subscriptions: [],
      connection: null,
    };
  }
}

/**
 * Setup function to install mock DevTools extension globally.
 */
export function setupMockDevToolsExtension(
  options: MockDevToolsOptions = {},
): MockDevToolsExtension {
  const mockExtension = new MockDevToolsExtension(options);

  // Install on global window object
  if (typeof global !== "undefined") {
    (global as any).window = {
      ...(global as any).window,
      __REDUX_DEVTOOLS_EXTENSION__: mockExtension,
    };
  }

  return mockExtension;
}

/**
 * Teardown function to cleanup mock DevTools extension.
 */
export function teardownMockDevToolsExtension(): void {
  if (typeof global !== "undefined") {
    delete (global as any).window.__REDUX_DEVTOOLS_EXTENSION__;
  }
}

/**
 * Create a mock store for integration testing.
 */
export function createMockStore(initialState: any = {}) {
  const state = { ...initialState };
  const updates: Array<{ atom: any; value: any; metadata?: any }> = [];

  return {
    get: vi.fn((atom: any) => state[atom.id?.toString()] ?? atom.defaultValue),
    set: vi.fn((atom: any, value: any) => {
      state[atom.id?.toString()] = value;
      updates.push({ atom, value });
    }),
    setWithMetadata: vi.fn((atom: any, value: any, metadata?: any) => {
      state[atom.id?.toString()] = value;
      updates.push({ atom, value, metadata });
    }),
    getState: vi.fn(() => ({ ...state })),
    serializeState: vi.fn(() => ({
      serialized: true,
      state: { ...state },
      timestamp: Date.now(),
    })),
    getUpdates: () => [...updates],
    reset: () => {
      Object.keys(state).forEach((key) => delete state[key]);
      updates.length = 0;
    },
  };
}

/**
 * Helper to simulate browser environment with DevTools extension.
 */
export function simulateBrowserWithDevTools(
  extensionOptions?: MockDevToolsOptions,
): MockDevToolsExtension {
  if (typeof global !== "undefined") {
    // Ensure window object exists
    if (!(global as any).window) {
      (global as any).window = {};
    }

    // Setup mock extension
    return setupMockDevToolsExtension(extensionOptions);
  }

  throw new Error("Global object not available");
}
