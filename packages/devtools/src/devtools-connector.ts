/**
 * DevToolsConnector - Manages connection to Redux DevTools extension
 *
 * This class handles connecting, disconnecting, and sending messages
 * to the Redux DevTools extension. It provides a clean abstraction
 * for the DevTools communication layer.
 */

import type {
  DevToolsConnection,
  DevToolsConfig,
  DevToolsMessage,
  DevToolsMode,
} from "./types";
import { createFallbackConnection } from "./createFallbackConnection";
import { detectDevToolsFeatures } from "./detectDevToolsFeatures";

// Declare global types for Redux DevTools
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: {
      connect: (options: {
        name?: string;
        trace?: boolean;
        latency?: number;
        maxAge?: number;
      }) => DevToolsConnection;
    };
  }
}

/**
 * Connection options for DevTools
 */
export interface DevToolsConnectionOptions {
  name?: string;
  trace?: boolean;
  latency?: number;
  maxAge?: number;
}

/**
 * DevToolsConnector class for managing DevTools connections
 */
export class DevToolsConnector {
  private connection: DevToolsConnection | null = null;
  private mode: DevToolsMode = "disabled";
  private isConnected = false;
  private messageListeners: Array<(message: DevToolsMessage) => void> = [];
  private unsubscribeCallback: (() => void) | null = null;
  private testConnection: DevToolsConnection | null = null;

  /**
   * Connect to DevTools extension
   * @param config Configuration for the connection
   * @returns The DevTools connection or null if connection failed
   */
  connect(config: DevToolsConnectionOptions): DevToolsConnection | null {
    // Use test connection if set (for testing purposes)
    if (this.testConnection) {
      this.setupMessageListeners();
      this.isConnected = true;
      return this.testConnection;
    }
    
    // Detect DevTools features
    const features = detectDevToolsFeatures();
    this.mode = features.mode;

    // Handle SSR environment - no connection
    if (features.isSSR) {
      return null;
    }

    // Handle disabled mode - no connection
    if (features.mode === "disabled") {
      return null;
    }

    // Handle fallback mode - use no-op connection
    if (features.mode === "fallback") {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "Redux DevTools extension is not available, using fallback mode",
        );
      }
      this.connection = createFallbackConnection();
      this.isConnected = true;
      return this.connection;
    }

    // Active mode - connect to real DevTools extension
    if (!features.isAvailable || !window.__REDUX_DEVTOOLS_EXTENSION__) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("DevTools extension not available");
      }
      return null;
    }

    try {
      // Create a connection to DevTools
      this.connection = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
        name: config.name ?? "nexus-state",
        trace: config.trace ?? false,
        latency: config.latency ?? 100,
        maxAge: config.maxAge ?? 50,
      });

      this.isConnected = true;
      this.setupMessageListeners();
      return this.connection;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to connect to DevTools:", error);
      }
      return null;
    }
  }

  /**
   * Inject a test connection (for testing purposes)
   * @param connection The connection to use for testing
   */
  injectTestConnection(connection: DevToolsConnection): void {
    console.log('[DevToolsConnector.injectTestConnection] Injecting test connection');
    this.testConnection = connection;
    this.setupMessageListeners();
    this.isConnected = true;
  }

  /**
   * Disconnect from DevTools extension
   */
  disconnect(): void {
    if (this.unsubscribeCallback) {
      this.unsubscribeCallback();
      this.unsubscribeCallback = null;
    }

    if (this.connection) {
      this.connection.unsubscribe?.();
      this.connection = null;
    }

    this.testConnection = null;
    this.isConnected = false;
    this.messageListeners = [];
  }

  /**
   * Send action and state to DevTools
   * @param action The action name
   * @param state The state to send
   */
  send(action: string, state: unknown): void {
    if (!this.isConnected || !this.connection) {
      return;
    }

    try {
      this.connection.send(action, state);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to send to DevTools:", error);
      }
    }
  }

  /**
   * Send initial state to DevTools
   * @param state The initial state
   */
  init(state: unknown): void {
    if (!this.isConnected || !this.connection) {
      return;
    }

    try {
      this.connection.init(state);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to send initial state to DevTools:", error);
      }
    }
  }

  /**
   * Subscribe to messages from DevTools
   * @param listener Callback function for messages
   * @returns Unsubscribe function
   */
  subscribe(listener: (message: DevToolsMessage) => void): () => void {
    console.log('[DevToolsConnector.subscribe] Adding listener, total listeners:', this.messageListeners.length + 1);
    this.messageListeners.push(listener);

    return () => {
      const index = this.messageListeners.indexOf(listener);
      if (index > -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get the current connection mode
   * @returns The current DevTools mode
   */
  getMode(): DevToolsMode {
    return this.mode;
  }

  /**
   * Check if connected to DevTools
   * @returns True if connected
   */
  isConnectedToDevTools(): boolean {
    return this.isConnected;
  }

  /**
   * Get the current connection (for testing purposes)
   * @returns The current DevTools connection or null
   */
  getConnection(): DevToolsConnection | null {
    return this.connection || this.testConnection;
  }

  /**
   * Setup message listeners for DevTools commands
   */
  private setupMessageListeners(): void {
    const activeConnection = this.connection || this.testConnection;
    if (!activeConnection) {
      return;
    }

    this.unsubscribeCallback = activeConnection.subscribe?.(
      (message: DevToolsMessage) => {
        this.handleMessage(message);
      },
    );

    // Clean up on window unload
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("beforeunload", () => {
        this.disconnect();
      });
    }
  }

  /**
   * Handle messages from DevTools and forward to listeners
   * @param message The message from DevTools
   */
  private handleMessage(message: DevToolsMessage): void {
    console.log('[DevToolsConnector.handleMessage] Handling message:', message.type);
    // Forward message to all listeners
    for (const listener of this.messageListeners) {
      try {
        console.log('[DevToolsConnector.handleMessage] Forwarding to listener');
        listener(message);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Error in DevTools message listener:", error);
        }
      }
    }
  }
}

/**
 * Create a new DevToolsConnector instance
 * @returns New DevToolsConnector instance
 */
export function createDevToolsConnector(): DevToolsConnector {
  return new DevToolsConnector();
}
