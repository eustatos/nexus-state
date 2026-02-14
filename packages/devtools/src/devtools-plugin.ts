/**
 * Full DevTools plugin implementation.
 * For production builds with zero overhead, use package conditional exports
 * ("production" condition resolves to ./devtools-noop.ts). This file is
 * tree-shakeable when the production entry is used.
 */

import type {
  DevToolsConfig,
  DevToolsConnection,
  DevToolsMessage,
  EnhancedStore,
  BasicAtom,
  DevToolsMode,
  DevToolsFeatureDetectionResult,
  ActionMetadata,
} from "./types";
import type { SnapshotMapper } from "./snapshot-mapper";
import {
  captureStackTrace,
  formatStackTraceForDevTools,
} from "./utils/stack-tracer";
import { atomRegistry } from "@nexus-state/core";
import { createSnapshotMapper } from "./snapshot-mapper";
import {
  StateSerializer,
  createStateSerializer,
  type LazySerializationOptions,
} from "./state-serializer";
import {
  ActionNamingSystem,
  createActionNamingSystem,
  defaultActionNamingSystem,
  type ActionNamingStrategy,
  type ActionNamingStrategyType,
  type PatternNamingConfig,
} from "./action-naming";
import { createActionMetadata } from "./action-metadata";
import {
  createActionGrouper,
  type ActionGrouper,
} from "./action-grouper";
import { createBatchUpdater, type BatchUpdater } from "./batch-updater";

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
  private snapshotMapper: SnapshotMapper;
  private stateSerializer: StateSerializer;
  private actionNamingSystem: ActionNamingSystem;
  private actionGrouper: ActionGrouper;
  private batchUpdater: BatchUpdater;
  private currentBatchId: string | null = null;
  private currentStore: EnhancedStore | null = null;
  /** Last lazy-serialized state (when serialization.lazy is enabled) for incremental updates */
  private lastLazyState: Record<string, unknown> | null = null;

  constructor(config: DevToolsConfig = {}) {
    // Extract action naming config with defaults
    const {
      actionNamingStrategy = "auto",
      actionNamingPattern,
      actionNamingFunction,
      defaultNamingStrategy = "auto",
    } = config;

    this.config = {
      name: config.name ?? "nexus-state",
      trace: config.trace ?? false,
      traceLimit: config.traceLimit ?? 10,
      latency: config.latency ?? 100,
      maxAge: config.maxAge ?? 50,
      actionSanitizer: config.actionSanitizer ?? (() => true),
      stateSanitizer: config.stateSanitizer ?? ((state) => state),
      showAtomNames: config.showAtomNames ?? true,
      atomNameFormatter:
        config.atomNameFormatter ??
        ((atom: BasicAtom, defaultName: string) => defaultName),
      actionNamingStrategy,
      actionNamingPattern,
      actionNamingFunction,
      defaultNamingStrategy,
    };
    this.snapshotMapper = createSnapshotMapper({
      maxMappings: config.maxAge ?? 50,
      autoCleanup: true,
    });
    this.stateSerializer = createStateSerializer();
    this.actionNamingSystem = this.createActionNamingSystem();
    this.actionGrouper = createActionGrouper(config.actionGroupOptions);
    const latency = config.latency ?? 100;
    const batchOpts = config.batchUpdate ?? {};
    this.batchUpdater = createBatchUpdater({
      batchLatencyMs: batchOpts.batchLatencyMs ?? latency,
      maxQueueSize: batchOpts.maxQueueSize ?? 100,
      throttleByFrame: batchOpts.throttleByFrame ?? true,
      maxUpdatesPerSecond: batchOpts.maxUpdatesPerSecond ?? 0,
      onFlush: (store, action) => {
        const targetStore = (store ?? this.currentStore) as EnhancedStore | null;
        if (targetStore) {
          this.doSendStateUpdate(targetStore, action);
        }
      },
    });
  }

  /**
   * Create action naming system based on config
   */
  private createActionNamingSystem(): ActionNamingSystem {
    const {
      actionNamingStrategy,
      actionNamingPattern,
      actionNamingFunction,
      defaultNamingStrategy,
    } = this.config;

    // If strategy is already an instance, use it directly
    if (
      typeof actionNamingStrategy === "object" &&
      "getName" in actionNamingStrategy
    ) {
      const system = new ActionNamingSystem();
      system
        .getRegistry()
        .register(actionNamingStrategy as ActionNamingStrategy, true);
      return system;
    }

    // Handle string strategy types
    const strategyType = actionNamingStrategy as ActionNamingStrategyType;

    // Build options based on config
    const options: any = {
      defaultStrategy: defaultNamingStrategy,
    };

    if (strategyType === "pattern" && actionNamingPattern) {
      options.strategy = "pattern";
      options.patternConfig = {
        pattern: actionNamingPattern,
        placeholders: {
          atomName: true,
          operation: true,
          timestamp: true,
          date: false,
          time: false,
        },
      };
    } else if (strategyType === "custom" && actionNamingFunction) {
      options.strategy = "custom";
      options.customConfig = {
        namingFunction: actionNamingFunction,
      };
    } else {
      options.strategy = strategyType;
    }

    return createActionNamingSystem(options);
  }

  /**
   * Apply the plugin to a store.
   * @param store The store to apply the plugin to
   */
  apply(store: EnhancedStore): void {
    this.currentStore = store;
    // Runtime production guard: no-op when NODE_ENV is production (e.g. bundler did not use conditional exports)
    if (process.env.NODE_ENV === "production") {
      return;
    }
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
   * Build lazy serialization options from plugin config.
   */
  private getLazySerializationOptions(): LazySerializationOptions | null {
    const ser = this.config.serialization;
    if (!ser?.lazy) return null;
    return {
      maxDepth: ser.maxDepth,
      maxSerializedSize: ser.maxSerializedSize,
      circularRefHandling: ser.circularRefHandling,
      placeholder: ser.placeholder,
    };
  }

  /**
   * Send initial state to DevTools (with optional lazy serialization).
   * @param store The store to get initial state from
   */
  private sendInitialState(store: EnhancedStore): void {
    try {
      const state = store.serializeState?.() || store.getState();
      const sanitized = this.config.stateSanitizer(state) as Record<string, unknown>;
      this.lastState = sanitized;

      const lazyOpts = this.getLazySerializationOptions();
      let stateToSend: unknown = sanitized;
      if (lazyOpts) {
        const result = this.stateSerializer.serializeLazy(sanitized, lazyOpts);
        this.lastLazyState = result.state as Record<string, unknown>;
        stateToSend = result.state;
      } else {
        this.lastLazyState = null;
      }

      this.connection?.init(stateToSend);
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
      const atomName = this.getAtomName(atom);
      const actionName = this.getActionName(atom, atomName, "SET");

      const builder = createActionMetadata()
        .type(actionName)
        .timestamp(Date.now())
        .source("DevToolsPlugin")
        .atomName(atomName);

      if (this.currentBatchId) {
        builder.groupId(this.currentBatchId);
      }

      if (this.config.trace) {
        const captured = captureStackTrace(this.config.traceLimit);
        if (captured) {
          builder.stackTrace(formatStackTraceForDevTools(captured));
        }
      }

      const metadata = builder.build() as ActionMetadata;

      store.setWithMetadata?.(atom, update, metadata);

      if (this.currentBatchId) {
        this.actionGrouper.add(metadata);
      } else {
        this.sendStateUpdate(store, metadata.type);
      }
    }) as unknown as typeof store.set;
  }

  /**
   * Start a batch so that subsequent set() calls are grouped into one DevTools action.
   * Call endBatch with the same id to flush and send.
   * @param groupId Unique id for this batch
   */
  startBatch(groupId: string): void {
    this.currentBatchId = groupId;
    this.actionGrouper.startGroup(groupId);
  }

  /**
   * End a batch and send a single grouped action to DevTools.
   * @param groupId Must match the id passed to startBatch
   */
  endBatch(groupId: string): void {
    if (this.currentBatchId === groupId) {
      this.currentBatchId = null;
    }
    const result = this.actionGrouper.endGroup(groupId);
    if (result && this.currentStore) {
      this.sendStateUpdate(this.currentStore, result.type);
    }
  }

  /**
   * Get action name using naming system
   */
  private getActionName(
    atom: BasicAtom,
    atomName: string,
    operation: string,
  ): string {
    return this.actionNamingSystem.getName({
      atom,
      atomName,
      operation,
    });
  }

  /**
   * Setup polling for state updates (fallback for basic stores).
   * @param store The store to poll
   */
  private setupPolling(store: EnhancedStore): void {
    const interval = setInterval(() => {
      if (this.isTracking) {
        // Generate action name for polling updates
        const actionName = this.getActionName(
          { id: { toString: () => "polling" } } as BasicAtom,
          "polling",
          "STATE_UPDATE",
        );
        this.sendStateUpdate(store, actionName);
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
   * Send state update to DevTools (called by BatchUpdater on flush).
   * Uses lazy serialization and incremental updates when config.serialization.lazy is set.
   * @param store The store to get state from
   * @param action The action name
   */
  private doSendStateUpdate(store: EnhancedStore, action: string): void {
    if (!this.isTracking || !this.connection) return;
    try {
      const currentState = store.serializeState?.() || store.getState();
      const sanitizedState = this.config.stateSanitizer(currentState) as Record<string, unknown>;

      const lazyOpts = this.getLazySerializationOptions();
      let stateToSend: unknown = sanitizedState;
      let stateChanged: boolean;

      if (lazyOpts) {
        const prevState = this.lastState as Record<string, unknown> | null;
        const changedKeys = this.stateSerializer.getChangedKeys(prevState, sanitizedState);
        const result = this.stateSerializer.serializeLazy(
          sanitizedState,
          lazyOpts,
          this.lastLazyState ?? undefined,
          changedKeys.size > 0 ? changedKeys : undefined,
        );
        stateToSend = result.state;
        const prevLazy = this.lastLazyState;
        this.lastLazyState = result.state as Record<string, unknown>;
        this.lastState = sanitizedState;
        stateChanged =
          prevLazy === null ||
          JSON.stringify(result.state) !== JSON.stringify(prevLazy);
      } else {
        stateChanged =
          JSON.stringify(sanitizedState) !== JSON.stringify(this.lastState);
        if (stateChanged) {
          this.lastState = sanitizedState;
        }
      }

      if (stateChanged && this.config.actionSanitizer(action, stateToSend)) {
        this.connection.send(action, stateToSend);
        this.snapshotMapper.mapSnapshotToAction(
          `snap-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          action,
        );
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to send state update to DevTools:", error);
      }
    }
  }

  /**
   * Schedule a state update to be sent to DevTools (batched and throttled).
   * @param store The store to get state from
   * @param action The action name
   */
  private sendStateUpdate(store: EnhancedStore, action: string): void {
    this.batchUpdater.schedule(store, action);
  }

  /**
   * Export current state in DevTools-compatible format.
   * Uses lazy serialization when config.serialization.lazy is set.
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
      const lazyOpts = this.getLazySerializationOptions();

      const exported = lazyOpts
        ? this.stateSerializer.exportStateLazy(
            state as Record<string, unknown>,
            lazyOpts,
            metadata,
          )
        : this.stateSerializer.exportState(
            state as Record<string, unknown>,
            metadata,
          );

      return {
        state: exported.state,
        timestamp: exported.timestamp,
        checksum: exported.checksum,
        version: exported.version,
        metadata: exported.metadata,
      };
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to export state:", error);
      }

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
