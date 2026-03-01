/**
 * SnapshotRestorer - Restores state from snapshots
 */

import { Atom, Store, RestorationError } from "../../types";
import type { Snapshot, SnapshotStateEntry } from "../types";
import type {
  SnapshotRestorerConfig,
  RestorationResult,
  RestorationCheckpoint,
  RestorationConfig,
} from "./types";
import type {
  TransactionalRestorerConfig,
  TransactionalRestorationResult,
  RestorationOptions,
  RestorationProgress,
  CheckpointResult,
  RollbackResult,
} from "./types";
import { atomRegistry } from "../../atom-registry";

// Import disposal infrastructure
import { BaseDisposable, type DisposableConfig } from "../core/disposable";

export class SnapshotRestorer extends BaseDisposable {
  private store: Store;
  private restorerConfig: SnapshotRestorerConfig;
  private transactionalConfig: TransactionalRestorerConfig;
  private restorationConfig: RestorationConfig;
  private listeners: Set<(snapshot: Snapshot) => void> = new Set();
  private restoreInProgress: boolean = false;
  private checkpoints: Map<string, RestorationCheckpoint> = new Map();
  private activeCheckpointId: string | null = null;
  private activeRestoration: boolean = false;
  private transactionLog: any | null = null; // TransactionLog type not available

  constructor(
    store: Store,
    config?: Partial<SnapshotRestorerConfig> & Partial<TransactionalRestorerConfig> & Partial<RestorationConfig>,
    disposalConfig?: DisposableConfig,
  ) {
    super(disposalConfig);
    this.store = store;
    // Extract only SnapshotRestorerConfig properties, explicitly excluding DisposableConfig
    const restorerConfig = config as Partial<SnapshotRestorerConfig> | undefined;
    const transactionalConfigParam = config as Partial<TransactionalRestorerConfig> | undefined;
    const restorationConfigParam = config as Partial<RestorationConfig> | undefined;

    this.restorerConfig = {
      validateBeforeRestore: true,
      strictMode: false,
      onAtomNotFound: "skip",
      transform: null,
      batchRestore: true,
      skipErrors: true,
      ...(restorerConfig || {}),
    };
    // Extract only TransactionalRestorerConfig properties
    this.transactionalConfig = {
      enableTransactions: transactionalConfigParam?.enableTransactions ?? true,
      rollbackOnError: transactionalConfigParam?.rollbackOnError ?? true,
      validateBeforeRestore: transactionalConfigParam?.validateBeforeRestore ?? true,
      batchSize: transactionalConfigParam?.batchSize ?? 0,
      timeout: transactionalConfigParam?.timeout ?? 5000,
      onError: transactionalConfigParam?.onError ?? "rollback",
      maxCheckpoints: transactionalConfigParam?.maxCheckpoints ?? 10,
      checkpointTimeout: transactionalConfigParam?.checkpointTimeout ?? 300000, // 5 minutes
      ...(transactionalConfigParam || {}),
    };
    // Extract RestorationConfig properties
    this.restorationConfig = {
      validateBeforeRestore: restorationConfigParam?.validateBeforeRestore ?? true,
      strictMode: restorationConfigParam?.strictMode ?? false,
      onAtomNotFound: restorationConfigParam?.onAtomNotFound ?? "warn",
      batchRestore: restorationConfigParam?.batchRestore ?? true,
      batchSize: restorationConfigParam?.batchSize ?? 10,
      rollbackOnError: restorationConfigParam?.rollbackOnError ?? true,
      checkpointTimeout: restorationConfigParam?.checkpointTimeout ?? 5000,
      maxCheckpoints: restorationConfigParam?.maxCheckpoints ?? 50,
      ...(restorationConfigParam || {}),
    };
  }

  /**
   * Restore from snapshot
   * @param snapshot Snapshot to restore
   * @returns True if restoration was successful
   */
  restore(snapshot: Snapshot): boolean {
    if (this.restoreInProgress) {
      throw new Error("Restore already in progress");
    }

    this.restoreInProgress = true;

    try {
      // Validate if configured
      if (
        this.restorerConfig.validateBeforeRestore &&
        !this.validateSnapshot(snapshot)
      ) {
        return false;
      }

      // Apply transforms
      const snapshotToRestore = this.restorerConfig.transform
        ? this.restorerConfig.transform(snapshot)
        : snapshot;

      // Restore state
      if (this.restorerConfig.batchRestore) {
        this.restoreBatch(snapshotToRestore.state);
      } else {
        this.restoreSequential(snapshotToRestore.state);
      }

      this.emit("restore", snapshotToRestore);
      return true;
    } catch (error) {
      console.error("Failed to restore snapshot:", error);
      return false;
    } finally {
      this.restoreInProgress = false;
    }
  }

  /**
   * Restore with result info
   * @param snapshot Snapshot to restore
   * @returns Restoration result with metadata
   */
  restoreWithResult(snapshot: Snapshot): RestorationResult {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let restoredCount = 0;

    if (this.restoreInProgress) {
      return {
        success: false,
        restoredCount: 0,
        totalAtoms: 0,
        errors: ["Restore already in progress"],
        warnings: [],
        duration: Date.now() - startTime,
        timestamp: startTime,
      };
    }

    this.restoreInProgress = true;

    try {
      // Validate
      if (this.restorerConfig.validateBeforeRestore) {
        const validation = this.validateSnapshotWithDetails(snapshot);
        if (!validation.valid) {
          errors.push(...validation.errors);
          if (this.restorerConfig.strictMode) {
            return {
              success: false,
              restoredCount: 0,
              totalAtoms: Object.keys(snapshot.state).length,
              errors,
              warnings: validation.warnings,
              duration: Date.now() - startTime,
              timestamp: startTime,
            };
          }
          warnings.push(...validation.warnings);
        }
      }

      // Restore each atom
      Object.entries(snapshot.state).forEach(([key, entry]) => {
        try {
          const success = this.restoreAtom(key, entry);
          if (success) restoredCount++;
        } catch (error) {
          errors.push(`Failed to restore atom ${key}: ${error}`);
        }
      });

      const success = errors.length === 0 || !this.restorerConfig.strictMode;

      if (success) {
        this.emit("restore", snapshot);
      }

      return {
        success,
        restoredCount,
        totalAtoms: Object.keys(snapshot.state).length,
        errors,
        warnings,
        duration: Date.now() - startTime,
        timestamp: startTime,
      };
    } catch (error) {
      return {
        success: false,
        restoredCount,
        totalAtoms: Object.keys(snapshot.state).length,
        errors: [
          ...errors,
          error instanceof Error ? error.message : String(error),
        ],
        warnings,
        duration: Date.now() - startTime,
        timestamp: startTime,
      };
    } finally {
      this.restoreInProgress = false;
    }
  }

  /**
   * Restore multiple snapshots in sequence
   * @param snapshots Snapshots to restore
   * @returns Array of restoration results
   */
  restoreSequence(snapshots: Snapshot[]): RestorationResult[] {
    return snapshots.map((snapshot) => this.restoreWithResult(snapshot));
  }

  /**
   * Restore a single atom
   * @param key Atom key
   * @param entry Snapshot state entry
   * @returns True if restored successfully
   */
  private restoreAtom(key: string, entry: SnapshotStateEntry): boolean {
    console.log(`[RESTORE] Restoring atom: ${key}, entry.name=${entry.name}, value=${entry.value}`);
    
    // Try to find atom by name first
    let atom = this.findAtomByName(entry.name || key);
    console.log(`[RESTORE] Found by name? ${!!atom}, atom.id=${atom?.id?.toString()}, atom.name=${atom?.name}`);

    // If not found, try to find by ID string (though this is unreliable for symbols)
    if (!atom && entry.atomId) {
      console.log(`[RESTORE] Trying to find by atomId: ${entry.atomId}`);
      atom = this.findAtomById(entry.atomId);
      console.log(`[RESTORE] Found by ID? ${!!atom}`);
    }

    if (!atom) {
      // If still not found, try to find any atom with the same name (for unnamed atoms)
      if (entry.name) {
        const allAtoms = atomRegistry.getAll();
        for (const [_id, storedAtom] of allAtoms) {
          const storedName = storedAtom.name || storedAtom.id?.description || "atom";
          if (storedName === entry.name) {
            atom = storedAtom as Atom<unknown>;
            console.log(`[RESTORE] Found by name (fallback): ${entry.name}, id: ${atom.id?.toString()}`);
            break;
          }
        }
      }
    }

    if (!atom) {
      if (this.restorerConfig.onAtomNotFound === "throw") {
        throw new Error(`Atom not found: ${key}`);
      }
      if (this.restorerConfig.onAtomNotFound === "warn") {
        console.warn(`Atom not found: ${key}`);
      }
      console.log(`[RESTORE] Atom NOT FOUND: ${key}`);
      return false;
    }

    // Deserialize value if needed
    const value = this.deserializeValue(entry.value, entry.type);
    console.log(`[RESTORE] Restoring ${entry.name}: ${value}, calling this.store.set(atom, ${value})`);
    console.log(`[RESTORE] Current value in store before set: ${this.store.get(atom)}`);

    // Set the value
    this.store.set(atom, value);
    console.log(`[RESTORE] Set complete for ${entry.name}, new value: ${this.store.get(atom)}`);
    return true;
  }

  /**
   * Restore in batch mode
   * @param state State object
   */
  private restoreBatch(state: Record<string, SnapshotStateEntry>): void {
    // Batch restoration can be optimized by store
    Object.entries(state).forEach(([key, entry]) => {
      this.restoreAtom(key, entry);
    });
  }

  /**
   * Restore sequentially
   * @param state State object
   */
  private restoreSequential(state: Record<string, SnapshotStateEntry>): void {
    // Sequential restoration for dependencies
    const entries = Object.entries(state);

    // First pass: restore primitives
    entries.forEach(([key, entry]) => {
      if (entry.type === "primitive") {
        this.restoreAtom(key, entry);
      }
    });

    // Second pass: restore computed/writable
    entries.forEach(([key, entry]) => {
      if (entry.type !== "primitive") {
        this.restoreAtom(key, entry);
      }
    });
  }



  /**
   * Find atom by name
   * @param name Atom name
   * @returns Atom or undefined
   */
  private findAtomByName(name: string): Atom<unknown> | null {
    return atomRegistry.getByName(name) as Atom<unknown> | null;
  }

  /**
   * Deserialize value
   * @param value Serialized value
   * @param type Atom type
   * @returns Deserialized value
   */
  private deserializeValue(value: unknown, type: string): unknown {
    // Handle special cases based on type
    if (type === "date" && typeof value === "string") {
      return new Date(value);
    }
    if (type === "regexp" && typeof value === "string") {
      return new RegExp(value);
    }
    if (type === "map" && Array.isArray(value)) {
      return new Map(value);
    }
    if (type === "set" && Array.isArray(value)) {
      return new Set(value);
    }
    return value;
  }

  /**
   * Validate snapshot
   * @param snapshot Snapshot to validate
   * @returns True if valid
   */
  private validateSnapshot(snapshot: Snapshot): boolean {
    return !!(
      snapshot &&
      snapshot.id &&
      snapshot.state &&
      typeof snapshot.state === "object" &&
      snapshot.metadata &&
      typeof snapshot.metadata.timestamp === "number"
    );
  }

  /**
   * Validate snapshot with details
   * @param snapshot Snapshot to validate
   * @returns Validation details
   */
  private validateSnapshotWithDetails(snapshot: Snapshot): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!snapshot) {
      errors.push("Snapshot is null or undefined");
      return { valid: false, errors, warnings };
    }

    if (!snapshot.id) {
      errors.push("Snapshot missing ID");
    }

    if (!snapshot.state || typeof snapshot.state !== "object") {
      errors.push("Snapshot state is invalid");
    }

    if (!snapshot.metadata) {
      errors.push("Snapshot missing metadata");
    } else {
      if (typeof snapshot.metadata.timestamp !== "number") {
        errors.push("Snapshot timestamp is invalid");
      }
    }

    // Check atom entries
    if (snapshot.state) {
      Object.entries(snapshot.state).forEach(([key, entry]) => {
        if (!entry.value && entry.value !== 0 && entry.value !== false) {
          warnings.push(`Atom ${key} has no value`);
        }
        if (!entry.type) {
          warnings.push(`Atom ${key} missing type`);
        }
        if (!entry.name) {
          warnings.push(`Atom ${key} missing name`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Subscribe to restoration events
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
  private emit(event: "restore" | "error", snapshot?: Snapshot): void {
    if (event === "restore" && snapshot) {
      this.listeners.forEach((listener) => listener(snapshot));
    }
  }

  /**
   * Check if restore is in progress
   */
  isRestoring(): boolean {
    return this.activeRestoration || this.restoreInProgress;
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<SnapshotRestorerConfig> & Partial<TransactionalRestorerConfig> & Partial<RestorationConfig>): void {
    this.restorerConfig = { ...this.restorerConfig, ...config };
    this.transactionalConfig = { ...this.transactionalConfig, ...config };
    this.restorationConfig = { ...this.restorationConfig, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): SnapshotRestorerConfig {
    return { ...this.restorerConfig };
  }

  /**
   * Get transactional configuration
   */
  getTransactionalConfig(): TransactionalRestorerConfig {
    return { ...this.transactionalConfig };
  }

  /**
   * Get restoration configuration
   */
  getRestorationConfig(): RestorationConfig {
    return { ...this.restorationConfig };
  }

  /**
   * Get all checkpoints
   */
  getCheckpoints(): RestorationCheckpoint[] {
    return Array.from(this.checkpoints.values());
  }

  /**
   * Get last checkpoint
   */
  getLastCheckpoint(): RestorationCheckpoint | null {
    if (this.checkpoints.size === 0) {
      return null;
    }
    // Get the most recent checkpoint
    let lastCheckpoint: RestorationCheckpoint | null = null;
    for (const checkpoint of this.checkpoints.values()) {
      if (!lastCheckpoint || checkpoint.timestamp > lastCheckpoint.timestamp) {
        lastCheckpoint = checkpoint;
      }
    }
    return lastCheckpoint;
  }

  /**
   * Get checkpoint by ID
   */
  getCheckpoint(checkpointId: string): RestorationCheckpoint | undefined {
    return this.checkpoints.get(checkpointId);
  }

  /**
   * Clear all checkpoints
   */
  clearCheckpoints(): void {
    this.checkpoints.clear();
    this.activeCheckpointId = null;
  }

  /**
   * Create a checkpoint for transactional restoration
   * @param snapshotId The snapshot ID being restored
   * @returns Checkpoint result
   */
  private createCheckpoint(snapshotId: string): CheckpointResult {
    const checkpointId = this.generateCheckpointId();
    const timestamp = Date.now();

    // Create checkpoint with empty previousValues (will be filled during restoration)
    const checkpoint: RestorationCheckpoint = {
      id: checkpointId,
      timestamp,
      snapshotId,
      previousValues: new Map<symbol, unknown>(),
      metadata: {
        atomCount: 0,
        duration: 0,
        inProgress: true,
        committed: false,
      },
    };

    this.checkpoints.set(checkpointId, checkpoint);
    this.activeCheckpointId = checkpointId;

    // Clean up old checkpoints if needed
    this.cleanupOldCheckpoints();

    return {
      checkpointId,
      success: true,
      atomCount: 0,
      timestamp,
    };
  }

  /**
   * Generate unique checkpoint ID
   */
  private generateCheckpointId(): string {
    return `checkpoint-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Cleanup old checkpoints based on maxCheckpoints and timeout
   */
  private cleanupOldCheckpoints(): void {
    const now = Date.now();
    const checkpoints = Array.from(this.checkpoints.entries());

    // Sort by timestamp (newest first)
    checkpoints.sort((a, b) => b[1].timestamp - a[1].timestamp);

    // Remove old checkpoints
    for (let i = this.restorationConfig.maxCheckpoints; i < checkpoints.length; i++) {
      const [id, checkpoint] = checkpoints[i];
      // Check if checkpoint has expired
      if (now - checkpoint.timestamp > this.restorationConfig.checkpointTimeout) {
        this.checkpoints.delete(id);
      }
    }

    // Remove checkpoints beyond max
    while (this.checkpoints.size > this.restorationConfig.maxCheckpoints) {
      const oldestId = checkpoints[checkpoints.length - 1][0];
      this.checkpoints.delete(oldestId);
    }
  }

  /**
   * Mark checkpoint as committed (successful restoration)
   * @param checkpointId Checkpoint ID
   */
  private commitCheckpoint(checkpointId: string): void {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (checkpoint) {
      checkpoint.metadata.committed = true;
      checkpoint.metadata.inProgress = false;
    }
  }

  /**
   * Create a checkpoint by capturing current atom values before restoration
   * @param checkpointId Checkpoint ID
   * @param atomsToRestore List of atoms to restore with their keys
   * @returns Map of atom IDs to their current values
   */
  private capturePreviousValues(
    checkpointId: string,
    atomsToRestore: Array<{ key: string; entry: SnapshotStateEntry; atom: Atom<unknown> }>,
  ): Map<symbol, unknown> {
    const previousValues = new Map<symbol, unknown>();

    for (const { atom } of atomsToRestore) {
      try {
        const currentValue = this.store.get(atom);
        previousValues.set(atom.id, currentValue);
      } catch (error) {
        console.error(`Failed to capture previous value for atom ${atom.name}:`, error);
      }
    }

    // Update checkpoint with previous values
    const checkpoint = this.checkpoints.get(checkpointId);
    if (checkpoint) {
      checkpoint.previousValues = previousValues;
      checkpoint.metadata.atomCount = atomsToRestore.length;
    }

    return previousValues;
  }

  /**
   * Apply restoration with progress tracking
   * @param snapshot Snapshot to restore
   * @param options Restoration options
   * @returns Transactional restoration result
   */
  async restoreWithTransaction(
    snapshot: Snapshot,
    options?: RestorationOptions,
  ): Promise<TransactionalRestorationResult> {
    const checkpointResult = this.createCheckpoint(snapshot.id);
    const checkpointId = checkpointResult.checkpointId;
    const startTime = Date.now();

    try {
      this.restoreInProgress = true;

      // Phase 1: Validate
      if (this.transactionalConfig.validateBeforeRestore) {
        const validation = this.validateSnapshotWithDetails(snapshot);
        if (!validation.valid) {
          const error = new RestorationError("Validation failed", {
            errors: validation.errors,
          });
          
          if (this.transactionalConfig.onError === "throw") {
            throw error;
          }

          await this.rollback(checkpointId);

          return {
            success: false,
            restoredCount: 0,
            totalAtoms: Object.keys(snapshot.state).length,
            errors: validation.errors,
            warnings: validation.warnings,
            duration: Date.now() - startTime,
            timestamp: startTime,
            checkpointId,
            rollbackPerformed: true,
          };
        }
      }

      // Phase 2: Capture previous values and prepare for restoration
      const atomsToRestore: Array<{ key: string; entry: SnapshotStateEntry; atom: Atom<unknown> }> = [];

      // First, find all atoms that will be restored
      for (const [key, entry] of Object.entries(snapshot.state)) {
        let atom = this.findAtomByName(entry.name || key);

        if (!atom && entry.name) {
          const allAtoms = atomRegistry.getAll();
          for (const [_id, storedAtom] of allAtoms) {
            const storedName = storedAtom.name || storedAtom.id?.description || "atom";
            if (storedName === entry.name) {
              atom = storedAtom as Atom<unknown>;
              break;
            }
          }
        }

        if (atom) {
          atomsToRestore.push({ key, entry, atom });
        }
      }

      // Capture previous values
      this.capturePreviousValues(checkpointId, atomsToRestore);

      // Phase 3: Apply changes transactionally
      const restoreResult = await this.applyChangesWithTransaction(
        snapshot,
        atomsToRestore,
        checkpointId,
        options,
      );

      // Commit checkpoint if successful
      if (restoreResult.success) {
        this.commitCheckpoint(checkpointId);
      }

      return {
        success: restoreResult.success,
        restoredCount: restoreResult.restoredCount,
        totalAtoms: restoreResult.totalAtoms,
        errors: restoreResult.errors,
        warnings: restoreResult.warnings,
        duration: Date.now() - startTime,
        timestamp: startTime,
        checkpointId,
        rollbackPerformed: false,
        successAtoms: restoreResult.successAtoms,
        failedAtomDetails: restoreResult.failedAtomDetails,
        failedAtoms: restoreResult.failedAtoms,
        rolledBackCount: restoreResult.rolledBackCount,
        interrupted: restoreResult.interrupted,
      };
    } catch (error) {
      // Automatic rollback on error
      await this.rollback(checkpointId);

      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        restoredCount: 0,
        totalAtoms: Object.keys(snapshot.state).length,
        errors: [errorMessage],
        warnings: [],
        duration: Date.now() - startTime,
        timestamp: startTime,
        checkpointId,
        rollbackPerformed: true,
        failedAtoms: [],
      };
    } finally {
      this.restoreInProgress = false;
    }
  }

  /**
   * Apply changes with transaction support
   * @param _snapshot Snapshot to restore
   * @param atomsToRestore List of atoms to restore
   * @param checkpointId Checkpoint ID
   * @param options Restoration options
   * @returns Restoration result with transaction details
   */
  private async applyChangesWithTransaction(
    _snapshot: Snapshot,
    atomsToRestore: Array<{ key: string; entry: SnapshotStateEntry; atom: Atom<unknown> }>,
    checkpointId: string,
    options?: RestorationOptions,
  ): Promise<TransactionalRestorationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const successAtoms: Array<{ name: string; atomId: symbol }> = [];
    const failedAtomDetails: Array<{ name: string; atomId: symbol; error: string; action: string }> = [];
    let restoredCount = 0;
    let interrupted = false;

    const batchSize = options?.transactionConfig?.enabled
      ? this.transactionalConfig.batchSize!
      : 0;

    // Process atoms in batches if batch size is specified
    if (batchSize > 0) {
      for (let i = 0; i < atomsToRestore.length; i += batchSize) {
        if (interrupted) break;

        const batch = atomsToRestore.slice(i, i + batchSize);
        const batchResult = await this.restoreBatchAtoms(
          batch,
          checkpointId,
          options?.onProgress,
        );

        successAtoms.push(...batchResult.successAtoms);
        failedAtomDetails.push(...batchResult.failedAtomDetails);
        restoredCount += batchResult.restoredCount;
        errors.push(...batchResult.errors);
        warnings.push(...batchResult.warnings);

        if (batchResult.interrupted) {
          interrupted = true;
        }

        // Check timeout
        if (
          this.transactionalConfig.timeout! > 0 &&
          Date.now() - startTime > this.transactionalConfig.timeout!
        ) {
          warnings.push("Restoration timed out");
          interrupted = true;
          break;
        }
      }
    } else {
      // Restore all atoms at once
      const result = await this.restoreBatchAtoms(
        atomsToRestore,
        checkpointId,
        options?.onProgress,
      );
      successAtoms.push(...result.successAtoms);
      failedAtomDetails.push(...result.failedAtomDetails);
      restoredCount = result.restoredCount;
      errors.push(...result.errors);
      warnings.push(...result.warnings);
      interrupted = result.interrupted;
    }

    return {
      success: errors.length === 0,
      restoredCount,
      totalAtoms: atomsToRestore.length,
      errors,
      warnings,
      duration: Date.now() - startTime,
      timestamp: startTime,
      checkpointId,
      rollbackPerformed: false,
      successAtoms,
      failedAtomDetails,
      failedAtoms: failedAtomDetails.map((item) => ({
        name: item.name,
        error: item.error,
      })),
      rolledBackCount: 0,
      interrupted,
    };
  }

  /**
   * Restore a batch of atoms
   * @param atomsToRestore List of atoms to restore
   * @param _checkpointId Checkpoint ID
   * @param onProgress Progress callback
   * @returns Batch restoration result
   */
  private async restoreBatchAtoms(
    atomsToRestore: Array<{ key: string; entry: SnapshotStateEntry; atom: Atom<unknown> }>,
    _checkpointId: string,
    onProgress?: (progress: RestorationProgress) => void,
  ): Promise<{
    restoredCount: number;
    successAtoms: Array<{ name: string; atomId: symbol }>;
    failedAtomDetails: Array<{ name: string; atomId: symbol; error: string; action: string }>;
    errors: string[];
    warnings: string[];
    interrupted: boolean;
  }> {
    let restoredCount = 0;
    const successAtoms: Array<{ name: string; atomId: symbol }> = [];
    const failedAtomDetails: Array<{
      name: string;
      atomId: symbol;
      error: string;
      action: string;
    }> = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let interrupted = false;

    for (let i = 0; i < atomsToRestore.length; i++) {
      if (interrupted) break;

      const { key, entry, atom } = atomsToRestore[i];

      // Report progress
      if (onProgress) {
        onProgress({
          currentIndex: i,
          totalAtoms: atomsToRestore.length,
          currentAtomName: entry.name || key,
          currentAtomId: atom.id,
          isRollback: false,
          timestamp: Date.now(),
        });
      }

      try {
        // Deserialize value if needed
        const value = this.deserializeValue(entry.value, entry.type);

        // Set the value
        this.store.set(atom, value);

        restoredCount++;
        successAtoms.push({
          name: entry.name || key,
          atomId: atom.id,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to restore atom ${key}: ${errorMsg}`);
        failedAtomDetails.push({
          name: entry.name || key,
          atomId: atom.id,
          error: errorMsg,
          action: "restore",
        });

        if (this.transactionalConfig.onError === "throw") {
          interrupted = true;
          break;
        }
      }
    }

    return { restoredCount, successAtoms, failedAtomDetails, errors, warnings, interrupted };
  }

  /**
   * Rollback to a checkpoint
   * @param checkpointId Checkpoint ID
   * @returns Rollback result
   */
  async rollback(checkpointId: string): Promise<RollbackResult> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      return {
        success: false,
        checkpointId,
        rolledBackCount: 0,
        failedCount: 0,
        timestamp: Date.now(),
        error: `Checkpoint ${checkpointId} not found`,
      };
    }

    const _startTime = Date.now();
    void _startTime;
    const failedAtoms: Array<{
      name: string;
      atomId: symbol;
      error: string;
    }> = [];
    let rolledBackCount = 0;
    let failedCount = 0;

    // Restore previous values in reverse order
    const reversedAtoms = Array.from(checkpoint.previousValues.entries()).reverse();

    for (const [atomId, previousValue] of reversedAtoms) {
      try {
        // Use findAtomByName since we store atom references in checkpoint
        // We need to look up the atom from the registry
        const allAtoms = atomRegistry.getAll();
        let atomFound: Atom<unknown> | null = null;
        
        // Try to find atom by ID first
        for (const [id, atom] of allAtoms) {
          if (id === atomId) {
            atomFound = atom as Atom<unknown>;
            break;
          }
        }
        
        // If not found by ID, try by description
        if (!atomFound) {
          for (const [id, atom] of allAtoms) {
            if (id.description === atomId.description) {
              atomFound = atom as Atom<unknown>;
              break;
            }
          }
        }

        if (atomFound) {
          this.store.set(atomFound, previousValue);
          rolledBackCount++;
        } else {
          failedCount++;
          failedAtoms.push({
            name: `atom-${atomId.description}`,
            atomId,
            error: "Atom not found in registry",
          });
        }
      } catch (error) {
        failedCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        failedAtoms.push({
          name: `atom-${atomId.description}`,
          atomId,
          error: errorMsg,
        });
        console.error(`Failed to rollback atom ${atomId.toString()}:`, error);
        // Continue with other rollbacks
      }
    }

    // Clean up checkpoint
    this.checkpoints.delete(checkpointId);
    if (this.activeCheckpointId === checkpointId) {
      this.activeCheckpointId = null;
    }

    return {
      success: failedCount === 0,
      checkpointId,
      rolledBackCount,
      failedCount,
      failedAtoms,
      timestamp: Date.now(),
      error: failedCount > 0 ? `Failed to rollback ${failedCount} atoms` : undefined,
    };
  }

  /**
   * Find atom by ID string
   * @param atomIdString Atom ID string
   * @returns Atom or null
   */
  private findAtomById(atomIdString: string): Atom<unknown> | null {
    // Try to parse the symbol from string
    try {
      // Symbol.toString() returns "Symbol(description)" or "Symbol()"
      // We need to extract the description
      const match = atomIdString.match(/Symbol\((.*)\)$/);
      if (match) {
        const description = match[1] || undefined;
        const allAtoms = atomRegistry.getAll();
        for (const [id, atom] of allAtoms) {
          if (id.description === description) {
            return atom as Atom<unknown>;
          }
        }
      }
    } catch (error) {
      console.error("Failed to parse atom ID:", error);
    }
    return null;
  }

  /**
   * Abort any active restoration
   */
  private async abortActiveRestoration(): Promise<void> {
    this.activeRestoration = false;
    // Rollback any pending changes
    await this.rollbackAll();
  }

  /**
   * Rollback all pending changes
   */
  private async rollbackAll(): Promise<void> {
    // Clean up all checkpoints
    for (const checkpointId of this.checkpoints.keys()) {
      await this.rollback(checkpointId);
    }
  }

  /**
   * Dispose the snapshot restorer and clean up all resources
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    this.log("Disposing SnapshotRestorer");

    // Abort any active restoration
    if (this.activeRestoration) {
      await this.abortActiveRestoration();
    }

    // Clear checkpoints
    this.checkpoints.clear();
    this.activeCheckpointId = null;

    // Clear listeners
    this.listeners.clear();

    // Dispose transaction log if exists
    if (this.transactionLog) {
      if (typeof this.transactionLog.dispose === "function") {
        await this.transactionLog.dispose();
      }
      this.transactionLog = null;
    }

    // Clear references
    // @ts-expect-error - Clean up references
    this.store = null;

    // Dispose children
    await this.disposeChildren();

    // Run callbacks
    await this.runDisposeCallbacks();

    this.disposed = true;
    this.log("SnapshotRestorer disposed");
  }
}
