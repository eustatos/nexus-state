/**
 * Production no-op entry for @nexus-state/devtools.
 * Resolved when package is consumed with "production" export condition.
 * Zero runtime overhead: no DevTools logic, no serialization, no batching.
 *
 * @see https://nodejs.org/api/packages.html#conditional-exports
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
  ActionMetadataBase,
  ActionGroupOptions,
  ActionGroupResult,
  BatchUpdateConfig,
  SnapshotMapperConfig,
  SnapshotMapperResult,
  SnapshotMapping,
  ActionToSnapshotMap,
  SnapshotToActionMap,
} from "./types";

// ---------------------------------------------------------------------------
// Feature detection (no-op / disabled in production)
// ---------------------------------------------------------------------------

/** @internal Production: always disabled */
export function detectDevToolsFeatures(): DevToolsFeatureDetectionResult {
  return {
    isAvailable: false,
    isSSR: typeof window === "undefined",
    mode: "disabled",
    error: null,
  };
}

/** @internal Production: no window */
export function isSSREnvironment(): boolean {
  return typeof window === "undefined";
}

/** @internal Production: never available */
export function isDevToolsAvailable(): boolean {
  return false;
}

/** @internal Production: always disabled */
export function getDevToolsMode(_forceDisable?: boolean): DevToolsMode {
  return "disabled";
}

// ---------------------------------------------------------------------------
// No-op SnapshotMapper (minimal interface for type compatibility)
// ---------------------------------------------------------------------------

export class SnapshotMapper {
  constructor(_config: SnapshotMapperConfig = {}) {}
  mapSnapshotToAction(
    _snapshotId: string,
    _actionId: string,
  ): SnapshotMapperResult {
    return { success: true };
  }
  getActionIdBySnapshotId(_snapshotId: string): string | undefined {
    return undefined;
  }
  getSnapshotIdByActionId(_actionId: string): string | undefined {
    return undefined;
  }
  cleanup(_actionIdsToKeep?: string[]): number {
    return 0;
  }
}

export function createSnapshotMapper(
  config?: SnapshotMapperConfig,
): SnapshotMapper {
  return new SnapshotMapper(config);
}

// ---------------------------------------------------------------------------
// No-op DevToolsPlugin
// ---------------------------------------------------------------------------

export class DevToolsPlugin {
  apply(_store: EnhancedStore): void {
    // No-op: production builds do not connect to DevTools
  }
  startBatch(_groupId: string): void {}
  endBatch(_groupId: string): void {}
  exportState(
    store: EnhancedStore,
    metadata?: Record<string, unknown>,
  ): Record<string, unknown> {
    const state = store.serializeState?.() ?? store.getState();
    return {
      state: state ?? {},
      timestamp: Date.now(),
      checksum: "",
      version: "1.0.0",
      metadata: metadata ?? {},
    };
  }
  getSnapshotMapper(): SnapshotMapper {
    return new SnapshotMapper();
  }
}

/**
 * Factory for production: returns a no-op plugin with zero overhead.
 * Tree-shakeable when unused.
 */
export function devTools(_config: DevToolsConfig = {}): DevToolsPlugin {
  return new DevToolsPlugin();
}

// ---------------------------------------------------------------------------
// No-op action metadata (minimal stubs for type-safe imports)
// ---------------------------------------------------------------------------

class NoOpActionMetadataBuilder<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  private typeValue: string = "";
  private atomNameValue: string = "";
  private timestampValue: number = 0;
  private sourceValue: string = "production";
  type(v: string): this {
    this.typeValue = v;
    return this;
  }
  timestamp(v: number): this {
    this.timestampValue = v;
    return this;
  }
  source(v: string): this {
    this.sourceValue = v;
    return this;
  }
  atomName(v: string): this {
    this.atomNameValue = v;
    return this;
  }
  stackTrace(_v: string): this {
    return this;
  }
  groupId(_v: string): this {
    return this;
  }
  set<K extends string, V>(
    _key: K,
    _value: V,
  ): NoOpActionMetadataBuilder<T & Record<K, V>> {
    return this as NoOpActionMetadataBuilder<T & Record<K, V>>;
  }
  merge(_custom: Record<string, unknown>): this {
    return this;
  }
  build(): ActionMetadata<T> {
    return {
      type: this.typeValue,
      timestamp: this.timestampValue,
      source: this.sourceValue,
      atomName: this.atomNameValue,
    } as ActionMetadata<T>;
  }
}

export { NoOpActionMetadataBuilder as ActionMetadataBuilder };

export function createActionMetadata<
  T extends Record<string, unknown> = Record<string, unknown>,
>(): NoOpActionMetadataBuilder<T> {
  return new NoOpActionMetadataBuilder<T>();
}

export function createMinimalActionMetadata(
  type: string,
  atomName: string,
  overrides?: Partial<ActionMetadataBase> & Record<string, unknown>,
): ActionMetadata {
  return {
    type,
    atomName,
    timestamp: overrides?.timestamp ?? 0,
    source: overrides?.source ?? "production",
    ...overrides,
  } as ActionMetadata;
}

// ---------------------------------------------------------------------------
// No-op action grouper
// ---------------------------------------------------------------------------

export type GroupLabelFormatter = (
  count: number,
  atomNames: string[],
) => string;

export interface ActionGrouper {
  add(metadata: ActionMetadata): void;
  startGroup(groupId: string): void;
  endGroup(groupId: string): ActionGroupResult | null;
}

const noOpGrouper: ActionGrouper = {
  add(): void {},
  startGroup(): void {},
  endGroup(): ActionGroupResult | null {
    return null;
  },
};

export function createActionGrouper(
  _options?: ActionGroupOptions,
  _formatter?: GroupLabelFormatter,
): ActionGrouper {
  return noOpGrouper;
}

// ---------------------------------------------------------------------------
// No-op batch updater
// ---------------------------------------------------------------------------

export interface BatchUpdaterConfig extends BatchUpdateConfig {
  onFlush: (store: unknown, action: string, count: number) => void;
}

export interface BatchUpdater {
  schedule(store: unknown, action: string): void;
}

const noOpBatchUpdater: BatchUpdater = {
  schedule(): void {},
};

export function createBatchUpdater(_config: BatchUpdaterConfig): BatchUpdater {
  return noOpBatchUpdater;
}

// ---------------------------------------------------------------------------
// Type re-exports (no runtime cost)
// ---------------------------------------------------------------------------

export type {
  DevToolsConfig,
  DevToolsConnection,
  DevToolsMessage,
  EnhancedStore,
  JumpToActionCommand,
  JumpToStateCommand,
  Command,
  CommandHandlerConfig,
  BasicAtom,
  DevToolsMode,
  DevToolsFeatureDetectionResult,
  SnapshotMapperConfig,
  SnapshotMapperResult,
  SnapshotMapping,
  ActionToSnapshotMap,
  SnapshotToActionMap,
  ActionMetadata,
  ActionMetadataBase,
  ActionGroupOptions,
  ActionGroupResult,
  BatchUpdateConfig,
} from "./types";
