/**
 * MessageHandler - Handles messages from DevTools
 * 
 * This class handles various types of messages from DevTools,
 * including time travel commands, import/export state, and
 * other DevTools operations.
 */

import type {
  DevToolsMessage,
  EnhancedStore,
  DevToolsConfig,
} from "./types";
import { CommandHandler } from "./command-handler";
import { StateSerializer, createStateSerializer } from "./state-serializer";
import type { SnapshotMapper } from "./snapshot-mapper";

/**
 * Message handler options
 */
export interface MessageHandlerOptions {
  /** Whether to enable time travel support (default: true) */
  enableTimeTravel?: boolean;
  /** Whether to enable state import/export (default: true) */
  enableImportExport?: boolean;
  /** Whether to log message handling (default: false) */
  debug?: boolean;
  /** Custom handlers for specific message types */
  customHandlers?: Record<string, (message: DevToolsMessage, store: EnhancedStore) => void>;
  /** Callback when state is updated after time-travel command */
  onStateUpdate?: (state: Record<string, unknown>) => void;
}

/**
 * Message handling result
 */
export interface MessageHandlerResult {
  /** Whether message was handled successfully */
  success: boolean;
  /** Message type */
  type: string;
  /** Error message if failed */
  error?: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

/**
 * MessageHandler class for handling DevTools messages
 */
export class MessageHandler {
  private options: Required<MessageHandlerOptions>;
  private commandHandler: CommandHandler | null = null;
  private stateSerializer: StateSerializer;
  private snapshotMapper: SnapshotMapper | null = null;
  private store: EnhancedStore | null = null;
  private isTracking = true;

  constructor(options: MessageHandlerOptions = {}) {
    this.options = {
      enableTimeTravel: options.enableTimeTravel ?? true,
      enableImportExport: options.enableImportExport ?? true,
      debug: options.debug ?? false,
      customHandlers: options.customHandlers ?? {},
      onStateUpdate: options.onStateUpdate ?? (() => {}),
    };

    this.stateSerializer = createStateSerializer();

    if (this.options.enableTimeTravel) {
      this.commandHandler = new CommandHandler({
        onStateUpdate: (state) => this.onStateUpdate(state),
      });
    }
  }

  /**
   * Set the store instance
   * @param store The store to handle messages for
   */
  setStore(store: EnhancedStore): void {
    console.log('[MessageHandler.setStore] Store received:', {
      hasTimeTravel: 'timeTravel' in store,
      timeTravelType: typeof (store as any).timeTravel,
      storeKeys: Object.keys(store).filter(k => !k.startsWith('get') && k !== 'set' && k !== 'subscribe'),
      storeType: store.constructor?.name || 'unknown'
    });
    
    this.store = store;
    
    if (this.commandHandler) {
      // Check if store has time travel capabilities
      const storeWithTimeTravel = store as any;
      if (storeWithTimeTravel.timeTravel && typeof storeWithTimeTravel.timeTravel === "object") {
        console.log('[MessageHandler] Setting timeTravel on CommandHandler:', !!storeWithTimeTravel.timeTravel);
        console.log('[MessageHandler] timeTravel object:', {
          type: typeof storeWithTimeTravel.timeTravel,
          constructor: storeWithTimeTravel.timeTravel.constructor?.name,
          hasJumpTo: typeof storeWithTimeTravel.timeTravel.jumpTo === 'function',
          hasGetHistory: typeof storeWithTimeTravel.timeTravel.getHistory === 'function',
          hasCapture: typeof storeWithTimeTravel.timeTravel.capture === 'function',
        });
        this.commandHandler.setTimeTravel(storeWithTimeTravel.timeTravel);
      } else {
        console.log('[MessageHandler] Store does not have timeTravel:', {
          hasTimeTravel: !!storeWithTimeTravel.timeTravel,
          type: typeof storeWithTimeTravel.timeTravel,
          storeKeys: Object.keys(storeWithTimeTravel).filter(k => k !== 'get' && k !== 'set' && k !== 'subscribe')
        });
      }
    }
  }

  /**
   * Set the snapshot mapper
   * @param mapper The snapshot mapper instance
   */
  setSnapshotMapper(mapper: SnapshotMapper): void {
    this.snapshotMapper = mapper;
    
    if (this.commandHandler) {
      this.commandHandler.setSnapshotMapper(mapper);
    }
  }

  /**
   * Set the SimpleTimeTravel instance for time travel debugging
   * @param timeTravel The SimpleTimeTravel instance
   */
  setTimeTravel(timeTravel: any): void {
    console.log('[MessageHandler] setTimeTravel called:', {
      hasJumpTo: typeof timeTravel.jumpTo === 'function',
      hasGetHistory: typeof timeTravel.getHistory === 'function',
    });
    
    if (this.commandHandler) {
      this.commandHandler.setTimeTravel(timeTravel);
    }
  }

  /**
   * Handle state updates after time-travel commands
   */
  private onStateUpdate(state: Record<string, unknown>): void {
    console.log('[MessageHandler.onStateUpdate] State updated after time-travel:', {
      hasState: !!state,
      stateKeys: Object.keys(state),
    });
    
    // Call the configured callback if available
    this.options.onStateUpdate(state);
  }

  /**
   * Handle a message from DevTools
   * @param message The message to handle
   * @param store The store to apply commands to
   * @returns Message handling result
   */
  handle(message: DevToolsMessage, store?: EnhancedStore): MessageHandlerResult {
    console.log('[MessageHandler.handle] Handling message:', message.type);
    const targetStore = store || this.store;
    
    if (!targetStore) {
      return {
        success: false,
        type: message.type,
        error: "Store not set. Call setStore() first or provide store parameter.",
      };
    }

    try {
      // Handle different message types
      switch (message.type) {
        case "DISPATCH":
          console.log('[MessageHandler.handle] Dispatch message detected, calling handleDispatch');
          return this.handleDispatch(message, targetStore);

        case "ACTION":
          return this.handleAction(message, targetStore);

        case "START":
          return this.handleStart(message, targetStore);

        case "STOP":
          return this.handleStop(message, targetStore);

        default:
          // Check for custom handlers
          if (this.options.customHandlers[message.type]) {
            return this.handleCustom(message, targetStore);
          }
          
          return {
            success: false,
            type: message.type,
            error: `Unknown message type: ${message.type}`,
          };
      }
    } catch (error) {
      if (this.options.debug) {
        console.error("MessageHandler: Error handling message:", error);
      }

      return {
        success: false,
        type: message.type,
        error: (error as Error).message || "Unknown error",
      };
    }
  }

  /**
   * Handle DISPATCH messages (time travel commands)
   */
  private handleDispatch(message: DevToolsMessage, store: EnhancedStore): MessageHandlerResult {
    const payload = message.payload as { type: string; [key: string]: unknown };
    
    if (!payload || typeof payload !== "object") {
      return {
        success: false,
        type: "DISPATCH",
        error: "Invalid dispatch payload",
      };
    }

    switch (payload.type) {
      case "JUMP_TO_ACTION":
      case "JUMP_TO_STATE":
        return this.handleTimeTravel(payload, store);

      case "START":
        this.isTracking = true;
        return {
          success: true,
          type: "DISPATCH",
          data: { command: "START" },
        };

      case "STOP":
        this.isTracking = false;
        return {
          success: true,
          type: "DISPATCH",
          data: { command: "STOP" },
        };

      case "COMMIT":
        // Commit current state
        return {
          success: true,
          type: "DISPATCH",
          data: { command: "COMMIT" },
        };

      case "RESET":
        return this.handleReset(payload, store);

      case "IMPORT_STATE":
        return this.handleImportState(payload, store);

      default:
        return {
          success: false,
          type: "DISPATCH",
          error: `Unknown dispatch type: ${payload.type}`,
        };
    }
  }

  /**
   * Handle time travel commands
   */
  private handleTimeTravel(
    _payload: { type: string; [key: string]: unknown },
    _store: EnhancedStore,
  ): MessageHandlerResult {
    if (!this.options.enableTimeTravel || !this.commandHandler) {
      return {
        success: false,
        type: _payload.type,
        error: "Time travel is not enabled",
      };
    }

    // Convert to Command format expected by CommandHandler
    const command = {
      type: _payload.type,
      payload: _payload,
    };

    const success = this.commandHandler.handleCommand(command);

    return {
      success,
      type: _payload.type,
      data: { command: _payload.type },
    };
  }

  /**
   * Handle reset command
   */
  private handleReset(
    _payload: { type: string; [key: string]: unknown },
    _store: EnhancedStore,
  ): MessageHandlerResult {
    // Reset to initial state would require storing the initial state
    if (this.options.debug) {
      console.warn("Reset is not fully supported without storing initial state");
    }

    return {
      success: false,
      type: "RESET",
      error: "Reset is not fully supported without storing initial state",
    };
  }

  /**
   * Handle import state command
   */
  private handleImportState(
    payload: { type: string; [key: string]: unknown },
    store: EnhancedStore,
  ): MessageHandlerResult {
    if (!this.options.enableImportExport) {
      return {
        success: false,
        type: "IMPORT_STATE",
        error: "Import/export is not enabled",
      };
    }

    try {
      // Extract import data from payload
      const importData = payload.state || payload.payload;

      if (!importData) {
        return {
          success: false,
          type: "IMPORT_STATE",
          error: "No state data provided",
        };
      }

      // Use StateSerializer to deserialize and validate
      const result = this.stateSerializer.importState(importData);

      if (!result.success) {
        return {
          success: false,
          type: "IMPORT_STATE",
          error: `Failed to import state: ${result.error}`,
        };
      }

      // Import state into store
      this.importStateIntoStore(result.state!, store);

      if (this.options.debug) {
        console.log("IMPORT_STATE: State imported successfully");
      }

      return {
        success: true,
        type: "IMPORT_STATE",
        data: { imported: true },
      };
    } catch (error) {
      return {
        success: false,
        type: "IMPORT_STATE",
        error: (error as Error).message || "Failed to import state",
      };
    }
  }

  /**
   * Import state into store
   */
  private importStateIntoStore(
    state: Record<string, unknown>,
    store: EnhancedStore,
  ): void {
    // Check if store has importState method
    if (typeof (store as any).importState === "function") {
      (store as any).importState(state);
      return;
    }

    // Fallback: manually set each atom value
    // Note: This requires atom registry integration
    for (const [atomIdStr, value] of Object.entries(state)) {
      try {
        // This is a simplified implementation - real implementation would need
        // to convert string atom IDs back to actual atoms
        if (this.options.debug) {
          console.warn(`IMPORT_STATE: Cannot set atom ${atomIdStr} - registry integration needed`);
        }
      } catch (error) {
        if (this.options.debug) {
          console.warn(`IMPORT_STATE: Failed to set atom ${atomIdStr}:`, error);
        }
      }
    }
  }

  /**
   * Handle ACTION messages
   */
  private handleAction(_message: DevToolsMessage, _store: EnhancedStore): MessageHandlerResult {
    // ACTION messages are typically sent from DevTools to dispatch actions
    // This would require integration with the store's action system

    if (this.options.debug) {
      console.warn("ACTION messages are not fully supported");
    }

    return {
      success: false,
      type: "ACTION",
      error: "ACTION messages are not fully supported",
    };
  }

  /**
   * Handle START messages
   */
  private handleStart(_message: DevToolsMessage, _store: EnhancedStore): MessageHandlerResult {
    this.isTracking = true;
    return {
      success: true,
      type: "START",
      data: { tracking: true },
    };
  }

  /**
   * Handle STOP messages
   */
  private handleStop(_message: DevToolsMessage, _store: EnhancedStore): MessageHandlerResult {
    this.isTracking = false;
    return {
      success: true,
      type: "STOP",
      data: { tracking: false },
    };
  }

  /**
   * Handle custom messages
   */
  private handleCustom(message: DevToolsMessage, store: EnhancedStore): MessageHandlerResult {
    const handler = this.options.customHandlers[message.type];

    try {
      handler(message, store);
      return {
        success: true,
        type: message.type,
        data: { handled: true },
      };
    } catch (error) {
      return {
        success: false,
        type: message.type,
        error: (error as Error).message || "Custom handler error",
      };
    }
  }

  /**
   * Jump to a specific state index
   * @param index State index to jump to
   * @returns True if successful
   */
  jumpToState(index: number): boolean {
    if (!this.options.enableTimeTravel || !this.commandHandler) {
      return false;
    }

    const command = {
      type: "JUMP_TO_STATE",
      payload: { index },
    };

    return this.commandHandler.handleCommand(command);
  }

  /**
   * Import state from external source
   * @param stateData State data to import
   * @returns True if successful
   */
  importState(stateData: unknown): boolean {
    if (!this.options.enableImportExport || !this.store) {
      return false;
    }

    const message: DevToolsMessage = {
      type: "DISPATCH",
      payload: {
        type: "IMPORT_STATE",
        state: stateData,
      },
    };

    const result = this.handle(message, this.store);
    return result.success;
  }

  /**
   * Check if tracking is enabled
   * @returns True if tracking
   */
  isTrackingEnabled(): boolean {
    return this.isTracking;
  }

  /**
   * Get the command handler (if time travel is enabled)
   * @returns CommandHandler instance or null
   */
  getCommandHandler(): CommandHandler | null {
    return this.commandHandler;
  }

  /**
   * Update handler options
   * @param newOptions New options
   */
  updateOptions(newOptions: MessageHandlerOptions): void {
    this.options = {
      ...this.options,
      ...newOptions,
    };

    // Handle time travel enable/disable
    if (newOptions.enableTimeTravel === false && this.commandHandler) {
      this.commandHandler = null;
    } else if (newOptions.enableTimeTravel === true && !this.commandHandler) {
      this.commandHandler = new CommandHandler({
        onStateUpdate: (state) => this.onStateUpdate(state),
      });
      
      // Re-set time travel if store has it
      if (this.store && (this.store as any).timeTravel) {
        this.commandHandler.setTimeTravel((this.store as any).timeTravel);
      }
      
      // Re-set snapshot mapper if available
      if (this.snapshotMapper) {
        this.commandHandler.setSnapshotMapper(this.snapshotMapper);
      }
    }
  }

  /**
   * Get current options
   * @returns Current options
   */
  getOptions(): Required<MessageHandlerOptions> {
    return { ...this.options };
  }
}

/**
 * Create a new MessageHandler instance
 * @param options Message handler options
 * @returns New MessageHandler instance
 */
export function createMessageHandler(options: MessageHandlerOptions = {}): MessageHandler {
  return new MessageHandler(options);
}

/**
 * Default message handler instance for convenience
 */
export const defaultMessageHandler = createMessageHandler();