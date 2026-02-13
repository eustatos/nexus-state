import type {
  DevToolsConfig,
  DevToolsConnection,
  DevToolsMessage,
  EnhancedStore,
  BasicAtom,
  DevToolsMode,
  DevToolsFeatureDetectionResult,
} from "./types";
import type { SnapshotMapper } from "./snapshot-mapper";
import { atomRegistry } from "@nexus-state/core";
import { createSnapshotMapper } from "./snapshot-mapper";
import { StateSerializer, createStateSerializer } from "./state-serializer";

/**
 * Feature detection for DevTools extension
 * @returns Object containing feature detection results
 */
export function detectDevToolsFeatures(): DevToolsFeatureDetectionResult {
  try {
    // Check for SSR environment (no window object)
    if (typeof window === "undefined") {
      return {
        isAvailable: false,
        isSSR: true,
        mode: "disabled",
        error: null,
      };
    }

    // Check for DevTools extension
    const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__;
    const isAvailable = !!devToolsExtension;

    return {
      isAvailable,
      isSSR: false,
      mode: isAvailable ? "active" : "fallback",
      error: isAvailable
        ? null
        : new Error("Redux DevTools extension not found"),
    };
  } catch (error) {
    return {
      isAvailable: false,
      isSSR: false,
      mode: "disabled",
      error:
        error instanceof Error
          ? error
          : new Error("Unknown error during feature detection"),
    };
  }
}

/**
 * Check if current environment is SSR
 * @returns True if SSR environment
 */
export function isSSREnvironment(): boolean {
  return typeof window === "undefined";
}
/**
 * Check if DevTools extension is available
 * @returns True if DevTools is available
 */
export function isDevToolsAvailable(): boolean {
  if (isSSREnvironment()) {
    return false;
  }
  return !!window.__REDUX_DEVTOOLS_EXTENSION__;
}

/**
 * Create a fallback connection that does nothing (no-op)
 * @returns DevToolsConnection implementation with no-op behavior
 */
function createFallbackConnection(): DevToolsConnection {
  return {
    send: (): void => {
      // No-op: silently ignore send attempts
    },
    subscribe: (): (() => void) => {
      // No-op: return no-op unsubscribe function
      return (): void => {};
    },
    init: (): void => {
      // No-op: silently ignore init attempts
    },
    unsubscribe: (): void => {
      // No-op: silently ignore unsubscribe attempts
    },
  };
}

/**
 * Determine the appropriate DevTools mode based on environment and availability
 * @param forceDisable - Optional flag to force disabled mode
 * @returns DevToolsMode enum value
 */
export function getDevToolsMode(forceDisable?: boolean): DevToolsMode {
  // Check for forced disabled mode
  if (forceDisable) {
    return "disabled";
  }

  // Check for SSR environment
  if (isSSREnvironment()) {
    return "disabled";
  }

  // Check for DevTools extension
  if (isDevToolsAvailable()) {
    return "active";
  }

  // Fall back to fallback mode
  return "fallback";
}

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
  private mode: DevToolsMode = "disabled";
  private isTracking = true;
  private lastState: unknown = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private snapshotMapper: SnapshotMapper;
  private stateSerializer: StateSerializer;

  constructor(config: DevToolsConfig = {}) {
    this.config = {
      name: config.name ?? "nexus-state",
      trace: config.trace ?? false,
      latency: config.latency ?? 100,
      maxAge: config.maxAge ?? 50,
      actionSanitizer: config.actionSanitizer ?? (() => true),
      stateSanitizer: config.stateSanitizer ?? ((state) => state),
      showAtomNames: config.showAtomNames ?? true,
      atomNameFormatter:
        config.atomNameFormatter ??
        ((atom: BasicAtom, defaultName: string) => defaultName),
    };
    this.snapshotMapper = createSnapshotMapper({
      maxMappings: config.maxAge ?? 50,
      autoCleanup: true,
    });
    this.stateSerializer = createStateSerializer();
  }

  /**
   * Apply the plugin to a store.
   * @param store The store to apply the plugin to
   */
  apply(store: EnhancedStore): void {
    // Detect DevTools features
    const features = detectDevToolsFeatures();
    this.mode = features.mode;

    // Handle SSR environment - no-op
    if (features.isSSR) {
      return;
    }

    // Handle disabled mode - no-op (e.g., forced disabled)
    if (features.mode === "disabled") {
      return;
    }

    // Handle fallback mode - use no-op connection
    if (features.mode === "fallback") {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "Redux DevTools extension is not available, using fallback mode",
        );
      }
      this.connection = createFallbackConnection();
      this.sendInitialState(store);
      return;
    }

    // Active mode - connect to real DevTools extension
    if (!features.isAvailable || !window.__REDUX_DEVTOOLS_EXTENSION__) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("DevTools extension not available");
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
   * Get display name for an atom
   * @param atom The atom to get name for
   * @returns Display name for the atom
   */
  private getAtomName(atom: BasicAtom): string {
    try {
      // If showAtomNames is disabled, use atom's toString method
      if (!this.config.showAtomNames) {
        return atom.toString();
      }

      // Use custom formatter if provided
      if (this.config.atomNameFormatter) {
        const defaultName = atomRegistry.getName(atom);
        return this.config.atomNameFormatter(atom, defaultName);
      }

      // Use registry name if available
      const registryName = atomRegistry.getName(atom);
      if (registryName) {
        return registryName;
      }

      // Fallback to atom's toString method
      return atom.toString();
    } catch (error) {
      // Fallback for any errors
      return `atom-${atom.id?.toString() || "unknown"}`;
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
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to send initial state to DevTools:", error);
      }
    }
  }

  /**
   * Setup message listeners for DevTools commands.
   * @param store The store to handle commands for
   */
  private setupMessageListeners(store: EnhancedStore): void {
    const unsubscribe = this.connection?.subscribe(
      (message: DevToolsMessage) => {
        try {
          this.handleDevToolsMessage(message, store);
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Error handling DevTools message:", error);
          }
        }
      },
    );

    // Clean up on window unload
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("beforeunload", () => {
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
  private handleDevToolsMessage(
    message: DevToolsMessage,
    store: EnhancedStore,
  ): void {
    if (message.type === "DISPATCH") {
      const payload = message.payload as
        | { type: string; [key: string]: unknown }
        | undefined;

      switch (payload?.type) {
        case "JUMP_TO_ACTION":
        case "JUMP_TO_STATE":
          // Time travel is not fully supported without core modifications
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "Time travel is not fully supported without core modifications",
            );
          }
          break;

        case "START":
          this.isTracking = true;
          break;

        case "STOP":
          this.isTracking = false;
          break;

        case "COMMIT":
          this.sendInitialState(store);
          break;

        case "RESET":
          // Reset to initial state would require storing the initial state
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "Reset is not fully supported without storing initial state",
            );
          }
          break;

        case "IMPORT_STATE":
          this.handleImportState(payload, store);
          break;

        default:
          if (process.env.NODE_ENV !== "production") {
            console.warn("Unknown DevTools dispatch type:", payload?.type);
          }
      }
    }
  }

  /**
   * Handle IMPORT_STATE command from DevTools
   * @param payload The IMPORT_STATE payload
   * @param store The store to import state into
   */
  private handleImportState(
    payload: { type: string; [key: string]: unknown },
    store: EnhancedStore,
  ): void {
    try {
      // Extract import data from payload
      const importData = payload.state || payload.payload;

      if (!importData) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("IMPORT_STATE: No state data provided");
        }
        return;
      }

      // Use StateSerializer to deserialize and validate
      const result = this.stateSerializer.importState(importData);

      if (!result.success) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("IMPORT_STATE: Failed to import state:", result.error);
        }
        return;
      }

      // Import state into store
      this.importStateIntoStore(result.state!, store);

      // Send updated state to DevTools
      this.sendInitialState(store);

      if (process.env.NODE_ENV !== "production") {
        console.log("IMPORT_STATE: State imported successfully");
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("IMPORT_STATE: Error importing state:", error);
      }
    }
  }

  /**
   * Import state into store
   * @param state The state to import
   * @param store The store to import into
   */
  private importStateIntoStore(
    state: Record<string, unknown>,
    store: EnhancedStore,
  ): void {
    // Check if store has importState method (from SimpleTimeTravel)
    if (typeof (store as any).importState === "function") {
      (store as any).importState(state);
      return;
    }

    // Fallback: manually set each atom value
    for (const [atomIdStr, value] of Object.entries(state)) {
      try {
        // Convert string atom ID to symbol
        const atomId = Symbol.for(atomIdStr);
        const atom = atomRegistry.get(atomId);

        if (atom) {
          store.set(atom, value);
        } else if (process.env.NODE_ENV !== "production") {
          console.warn(`IMPORT_STATE: Atom ${atomIdStr} not found in registry`);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`IMPORT_STATE: Failed to set atom ${atomIdStr}:`, error);
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

    // Override set method to capture metadata
    store.set = ((atom: BasicAtom, update: unknown) => {
      // Create action metadata with atom name
      const atomName = this.getAtomName(atom);
      const metadata: {
        type: string;
        timestamp: number;
        source: string;
        atomName: string;
        stackTrace?: string;
      } = {
        type: `SET ${atomName}`,
        timestamp: Date.now(),
        source: "DevToolsPlugin",
        atomName: atomName,
      };

      // Capture stack trace if enabled
      if (this.config.trace) {
        try {
          throw new Error("Stack trace capture");
        } catch (error) {
          metadata.stackTrace = (error as Error).stack;
        }
      }

      // Use setWithMetadata if available
      store.setWithMetadata?.(atom, update, metadata);

      // Send state update to DevTools
      this.sendStateUpdate(store, metadata.type);
    }) as unknown as typeof store.set;
  }

  /**
   * Setup polling for state updates (fallback for basic stores).
   * @param store The store to poll
   */
  private setupPolling(store: EnhancedStore): void {
    const interval = setInterval(() => {
      if (this.isTracking) {
        this.sendStateUpdate(store, "STATE_UPDATE");
      }
    }, this.config.latency);

    // Clean up interval on window unload
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("beforeunload", () => {
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
            // Map action to snapshot for time travel support
            this.snapshotMapper.mapSnapshotToAction(
              `snap-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
              action,
            );
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Failed to send state update to DevTools:", error);
        }
      }
    }, this.config.latency);
  }

  /**
   * Export current state in DevTools-compatible format
   * @param store The store to export state from
   * @param metadata Optional metadata to include
   * @returns Serialized state with checksum
   */
  exportState(
    store: EnhancedStore,
    metadata?: Record<string, unknown>,
  ): Record<string, unknown> {
    try {
      const state = store.serializeState?.() || store.getState();

      // Use StateSerializer to export with checksum
      const exported = this.stateSerializer.exportState(state, metadata);

      return exported;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to export state:", error);
      }

      // Fallback: return basic state without checksum
      const state = store.serializeState?.() || store.getState();
      return {
        state,
        timestamp: Date.now(),
        checksum: "",
        version: "1.0.0",
        metadata: metadata || {},
      };
    }
  }

  /**
   * Get the snapshot mapper for time travel lookups
   * @returns The SnapshotMapper instance
   */
  getSnapshotMapper(): SnapshotMapper {
    return this.snapshotMapper;
  }
}
