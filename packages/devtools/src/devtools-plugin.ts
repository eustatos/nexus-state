import type { DevToolsConfig, DevToolsConnection, DevToolsMessage, EnhancedStore } from './types';

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
 * DevToolsPlugin class implementing integration with enhanced store API.
 */
export class DevToolsPlugin {
  private config: Required<DevToolsConfig>;
  private connection: DevToolsConnection | null = null;
  private isTracking = true;
  private lastState: unknown = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(config: DevToolsConfig = {}) {
    this.config = {
      name: config.name ?? 'nexus-state',
      trace: config.trace ?? false,
      latency: config.latency ?? 100,
      maxAge: config.maxAge ?? 50,
      actionSanitizer: config.actionSanitizer ?? (() => true),
      stateSanitizer: config.stateSanitizer ?? ((state) => state),
    };
  }

  /**
   * Apply the plugin to a store.
   * @param store The store to apply the plugin to
   */
  apply(store: EnhancedStore): void {
    // Check if Redux DevTools are available
    if (typeof window === 'undefined' || !window.__REDUX_DEVTOOLS_EXTENSION__) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Redux DevTools extension is not available');
      }
      return;
    }

    // Create a connection to DevTools
    this.connection = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
      name: this.config.name,
      trace: this.config.trace,
      latency: this.config.latency,
      maxAge: this.config.maxAge,
    });

    // Send initial state
    this.sendInitialState(store);

    // Setup message listeners
    this.setupMessageListeners(store);

    // Enhance store methods if available
    if (store.setWithMetadata) {
      this.enhanceStoreWithMetadata(store);
    } else {
      // Fallback to polling for basic stores
      this.setupPolling(store);
    }
  }

  /**
   * Send initial state to DevTools.
   * @param store The store to get initial state from
   */
  private sendInitialState(store: EnhancedStore): void {
    try {
      const state = store.serializeState?.() || store.getState();
      this.lastState = state;
      this.connection?.init(this.config.stateSanitizer(state));
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to send initial state to DevTools:', error);
      }
    }
  }

  /**
   * Setup message listeners for DevTools commands.
   * @param store The store to handle commands for
   */
  private setupMessageListeners(store: EnhancedStore): void {
    const unsubscribe = this.connection?.subscribe((message: DevToolsMessage) => {
      try {
        this.handleDevToolsMessage(message, store);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Error handling DevTools message:', error);
        }
      }
    });

    // Clean up on window unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        unsubscribe?.();
        this.connection?.unsubscribe();
      });
    }
  }

  /**
   * Handle messages from DevTools.
   * @param message The message from DevTools
   * @param store The store to apply commands to
   */
  private handleDevToolsMessage(message: DevToolsMessage, store: EnhancedStore): void {
    if (message.type === 'DISPATCH') {
      const payload = message.payload as { type: string; [key: string]: unknown } | undefined;
      
      switch (payload?.type) {
        case 'JUMP_TO_ACTION':
        case 'JUMP_TO_STATE':
          // Time travel is not fully supported without core modifications
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Time travel is not fully supported without core modifications');
          }
          break;
          
        case 'START':
          this.isTracking = true;
          break;
          
        case 'STOP':
          this.isTracking = false;
          break;
          
        case 'COMMIT':
          this.sendInitialState(store);
          break;
          
        case 'RESET':
          // Reset to initial state would require storing the initial state
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Reset is not fully supported without storing initial state');
          }
          break;
          
        case 'IMPORT_STATE':
          // Import state would require parsing the state and applying it
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Import state is not fully supported without core modifications');
          }
          break;
          
        default:
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Unknown DevTools dispatch type:', payload?.type);
          }
      }
    }
  }

  /**
   * Enhance store with metadata support.
   * @param store The store to enhance
   */
  private enhanceStoreWithMetadata(store: EnhancedStore): void {
    if (!store.setWithMetadata) return;
    
    // Store reference to original set method
    const originalSet = store.set;
    
    // Override set method to capture metadata
    store.set = ((atom: any, update: any) => {
      // Create action metadata
      const metadata = {
        type: `SET ${atom.toString()}`,
        timestamp: Date.now(),
        source: 'DevToolsPlugin',
      };
      
      // Capture stack trace if enabled
      if (this.config.trace) {
        try {
          throw new Error('Stack trace capture');
        } catch (error) {
          metadata.stackTrace = error.stack;
        }
      }
      
      // Use setWithMetadata if available
      store.setWithMetadata(atom, update, metadata);
      
      // Send state update to DevTools
      this.sendStateUpdate(store, metadata.type);
    }) as any;
  }

  /**
   * Setup polling for state updates (fallback for basic stores).
   * @param store The store to poll
   */
  private setupPolling(store: EnhancedStore): void {
    const interval = setInterval(() => {
      if (this.isTracking) {
        this.sendStateUpdate(store, 'STATE_UPDATE');
      }
    }, this.config.latency);

    // Clean up interval on window unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        clearInterval(interval);
      });
    }
  }

  /**
   * Send state update to DevTools.
   * @param store The store to get state from
   * @param action The action name
   */
  private sendStateUpdate(store: EnhancedStore, action: string): void {
    // Debounce updates to prevent performance issues
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      if (!this.isTracking || !this.connection) return;
      
      try {
        const currentState = store.serializeState?.() || store.getState();
        const sanitizedState = this.config.stateSanitizer(currentState);
        
        // Only send if state has changed
        if (JSON.stringify(sanitizedState) !== JSON.stringify(this.lastState)) {
          this.lastState = sanitizedState;
          
          // Check if action should be sent
          if (this.config.actionSanitizer(action, sanitizedState)) {
            this.connection.send(action, sanitizedState);
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to send state update to DevTools:', error);
        }
      }
    }, this.config.latency);
  }
}