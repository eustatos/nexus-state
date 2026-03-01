/**
 * SnapshotCreator - Creates snapshots from store state
 */

import { Atom, Store } from "../../types";
import type { Snapshot, SnapshotStateEntry } from "../types";
import type { SnapshotCreatorConfig, CreationResult } from "./types";
import { atomRegistry } from "../../atom-registry";
import { AdvancedSerializer, SerializationOptions } from "../../utils/snapshot-serialization/advanced";

// Import disposal infrastructure
import { BaseDisposable, type DisposableConfig } from "../core/disposable";

export class SnapshotCreator extends BaseDisposable {
  private store: Store;
  private creatorConfig: SnapshotCreatorConfig;
  private listeners: Set<(snapshot: Snapshot) => void> = new Set();
  private lastSnapshotState: Record<string, SnapshotStateEntry> | null = null;
  private serializer: AdvancedSerializer;
  private workerPool: any | null = null; // WorkerPool type not available

  constructor(
    store: Store,
    config?: Partial<SnapshotCreatorConfig>,
    disposalConfig?: DisposableConfig,
  ) {
    super(disposalConfig);
    this.store = store;
    // Extract only SnapshotCreatorConfig properties, explicitly excluding DisposableConfig
    const snapshotConfig = config as Partial<SnapshotCreatorConfig> | undefined;
    this.creatorConfig = {
      includeTypes: ["primitive", "computed", "writable"],
      excludeAtoms: [],
      transform: null,
      validate: true,
      generateId: () => Math.random().toString(36).substring(2, 9),
      includeMetadata: true,
      skipStateCheck: false,
      autoCapture: true,
      ...(snapshotConfig || {}),
    };
    // Ensure includeTypes is string array (for backward compatibility)
    if (this.creatorConfig.includeTypes) {
      this.creatorConfig.includeTypes = this.creatorConfig.includeTypes.map((t) => String(t));
    }

    // Initialize AdvancedSerializer with default options
    const serializationOptions: SerializationOptions = {
      detectCircular: true,
      maxDepth: 100,
      includeGetters: false,
      includeNonEnumerable: false,
      includeSymbols: false,
      functionHandling: "source",
      errorHandling: "replace",
      circularHandling: "reference",
    };
    this.serializer = new AdvancedSerializer(serializationOptions);
  }

  /**
   * Create a snapshot
   * @param action Optional action name
   * @param atomIds Set of atom IDs to include
   * @returns Created snapshot or null if creation failed or state unchanged
   */
  create(action?: string, atomIds?: Set<symbol>): Snapshot | null {
    try {
      const state = this.captureState(atomIds);

      if (Object.keys(state).length === 0) {
        return null;
      }

      // Check if state has changed since last snapshot
      // Only check for state changes when auto-capturing (action is not provided)
      if (!this.creatorConfig.skipStateCheck && this.creatorConfig.autoCapture === false && !action && this.lastSnapshotState) {
        if (this.statesEqual(state, this.lastSnapshotState)) {
          return null; // State hasn't changed
        }
      }

      const snapshot: Snapshot = {
        id: this.creatorConfig.generateId(),
        state,
        metadata: {
          timestamp: Date.now(),
          action,
          atomCount: Object.keys(state).length,
        },
      };

      // Apply transforms
      const transformed = this.creatorConfig.transform
        ? this.creatorConfig.transform(snapshot)
        : snapshot;

      // Validate if configured
      if (this.creatorConfig.validate && !this.validateSnapshot(transformed)) {
        return null;
      }

      // Store for next comparison
      this.lastSnapshotState = { ...state };

      this.emit("create", transformed);
      return transformed;
    } catch (error) {
      console.error("Failed to create snapshot:", error);
      return null;
    }
  }

  /**
   * Create multiple snapshots
   * @param count Number of snapshots to create
   * @param actionPattern Action name pattern
   * @returns Array of created snapshots
   */
  createBatch(count: number, actionPattern?: string): Snapshot[] {
    const snapshots: Snapshot[] = [];

    for (let i = 0; i < count; i++) {
      const action = actionPattern ? `${actionPattern}-${i + 1}` : undefined;
      const snapshot = this.create(action);
      if (snapshot) {
        snapshots.push(snapshot);
      }
    }

    return snapshots;
  }

  /**
   * Create snapshot with result info
   * @param action Optional action name
   * @param atomIds Set of atom IDs to include
   * @returns Creation result with metadata
   */
  createWithResult(action?: string, atomIds?: Set<symbol>): CreationResult {
    const startTime = Date.now();

    try {
      const snapshot = this.create(action, atomIds);

      return {
        success: !!snapshot,
        snapshot,
        duration: Date.now() - startTime,
        timestamp: startTime,
        error: snapshot ? undefined : "Failed to create snapshot",
        atomCount: snapshot ? Object.keys(snapshot.state).length : 0,
      };
    } catch (error) {
      return {
        success: false,
        snapshot: null,
        duration: Date.now() - startTime,
        timestamp: startTime,
        error: error instanceof Error ? error.message : String(error),
        atomCount: 0,
      };
    }
  }

  /**
   * Capture current state
   * @param atomIds Set of atom IDs to include. If undefined, captures all atoms.
   * @returns Captured state
   */
  private captureState(
    atomIds?: Set<symbol>,
  ): Record<string, SnapshotStateEntry> {
    const state: Record<string, SnapshotStateEntry> = {};

    if (!atomIds) {
      // Capture all registered atoms
      const allAtoms = atomRegistry.getAll();
      allAtoms.forEach((atom) => {
        this.addAtomToState(atom, state);
      });
    } else {
      // Capture only specified atoms
      atomIds.forEach((atomId) => {
        try {
          const atom = this.getAtomById(atomId);
          if (atom) {
            this.addAtomToState(atom, state);
          }
        } catch (error) {
          // Skip atoms that can't be accessed
        }
      });
    }

    return state;
  }

  /**
   * Add atom to state object
   */
  private addAtomToState(atom: Atom<unknown>, state: Record<string, SnapshotStateEntry>): void {
    try {
      const atomType = this.getAtomType(atom);

      // Filter by type
      if (!this.creatorConfig.includeTypes.includes(atomType)) return;

      // Filter by exclude list
      const atomName = atom.name || atom.id.description || String(atom.id);
      if (this.creatorConfig.excludeAtoms.includes(atomName)) return;

      const value = this.store.get(atom);

      // Cast atomType to the expected union type
      const stateType: "primitive" | "computed" | "writable" =
        atomType === "primitive" || atomType === "computed" || atomType === "writable"
          ? atomType
          : "primitive";

      state[atomName] = {
        value: this.serializeValue(value),
        type: stateType,
        name: atomName,
        atomId: atom.id.toString(),
      };
    } catch (error) {
      // Skip atoms that can't be accessed
    }
  }

  /**
   * Get atom by ID
   * @param atomId Atom ID
   * @returns Atom or undefined
   */
  private getAtomById(atomId: symbol): Atom<unknown> | undefined {
    return atomRegistry.get(atomId);
  }

  /**
   * Get atom type
   * @param atom Atom
   * @returns Atom type
   */
  private getAtomType(atom: Atom<unknown>): "primitive" | "computed" | "writable" | string {
    if (atom && typeof atom === "object" && "type" in atom) {
      return (atom as { type: string }).type;
    }
    return "primitive";
  }

  /**
   * Serialize value for storage using AdvancedSerializer
   * @param value Value to serialize
   * @returns Serialized value
   */
  private serializeValue(value: unknown): unknown {
    return this.serializer.serialize(value);
  }

  /**
   * Validate snapshot
   * @param snapshot Snapshot to validate
   * @returns True if valid
   */
  private validateSnapshot(snapshot: Snapshot): boolean {
    if (!snapshot.id) return false;
    if (!snapshot.metadata || !snapshot.metadata.timestamp) return false;
    if (typeof snapshot.state !== "object") return false;

    return true;
  }

  /**
   * Subscribe to creation events
   * @param listener Event listener
   * @returns Unsubscribe function
   */
  subscribe(listener: (snapshot: Snapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit event
   * @param event Event type
   * @param snapshot Snapshot
   */
  private emit(event: "create" | "error", snapshot?: Snapshot): void {
    if (event === "create" && snapshot) {
      this.listeners.forEach((listener) => listener(snapshot));
    }
  }

  /**
   * Compare two states for equality
   */
  private statesEqual(a: Record<string, SnapshotStateEntry>, b: Record<string, SnapshotStateEntry>): boolean {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (a[key].value !== b[key].value) return false;
      if (a[key].type !== b[key].type) return false;
    }

    return true;
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<SnapshotCreatorConfig>): void {
    this.creatorConfig = { ...this.creatorConfig, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): SnapshotCreatorConfig {
    return { ...this.creatorConfig };
  }

  /**
   * Dispose the snapshot creator and clean up all resources
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    this.log("Disposing SnapshotCreator");

    // Clear listeners
    this.listeners.clear();

    // Dispose worker pool if exists
    if (this.workerPool) {
      if (typeof this.workerPool.dispose === "function") {
        await this.workerPool.dispose();
      }
      this.workerPool = null;
    }

    // Dispose serializer if it has dispose method
    if (this.serializer && typeof (this.serializer as any).dispose === "function") {
      await (this.serializer as any).dispose();
    }

    // Clear references
    this.lastSnapshotState = null;
    // @ts-expect-error - Clean up references
    this.store = null;

    // Dispose children
    await this.disposeChildren();

    // Run callbacks
    await this.runDisposeCallbacks();

    this.disposed = true;
    this.log("SnapshotCreator disposed");
  }
}
