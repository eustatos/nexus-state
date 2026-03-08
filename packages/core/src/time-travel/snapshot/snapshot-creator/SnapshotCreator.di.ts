/**
 * SnapshotCreator - Creates snapshots from store state
 * Refactored version with dependency injection
 */

import type { Snapshot, SnapshotStateEntry } from '../types';
import type { Atom, Store } from '../../types';
import type { SnapshotCreatorConfig, CreationResult } from './types';
import type {
  IStateCapture,
  ISnapshotValidator,
  ISnapshotTransformer,
  ISnapshotSerializer,
  ISnapshotIdGenerator,
  IStateComparator,
  ISnapshotEventEmitter,
  SnapshotCreatorDeps,
} from './types.interfaces';
import { BaseDisposable, type DisposableConfig } from '../../core/disposable';
import { StateCaptureService } from './StateCaptureService';
import { SnapshotValidator } from './SnapshotValidator';
import { StateComparator } from './StateComparator';
import { SnapshotEventEmitter } from './SnapshotEventEmitter';
import { SnapshotIdGenerator } from './SnapshotIdGenerator';
import { AtomRegistryAdapter } from './AtomRegistryAdapter';
import { AdvancedSerializer, SerializationOptions } from '../../../utils/snapshot-serialization/advanced';

// Re-export SnapshotCreatorDeps for backward compatibility
export type { SnapshotCreatorDeps } from './types.interfaces';

/**
 * SnapshotCreator with dependency injection
 */
export class SnapshotCreator extends BaseDisposable {
  private store: Store;
  private stateCapture: IStateCapture;
  private validator: ISnapshotValidator;
  private transformer: ISnapshotTransformer | null;
  private idGenerator: ISnapshotIdGenerator;
  private comparator: IStateComparator;
  private eventEmitter: ISnapshotEventEmitter;
  private creatorConfig: SnapshotCreatorConfig;
  private lastSnapshotState: Record<string, SnapshotStateEntry> | null = null;

  constructor(deps: SnapshotCreatorDeps, disposalConfig?: DisposableConfig) {
    super(disposalConfig);

    this.store = deps.store;

    // Initialize serializer
    const serializer = deps.serializer ?? this.createDefaultSerializer();

    // Initialize registry adapter
    const registry = new AtomRegistryAdapter();

    // Extract config
    const config = deps.config as Partial<SnapshotCreatorConfig> | undefined;
    this.creatorConfig = {
      includeTypes: ['primitive', 'computed', 'writable'],
      excludeAtoms: [],
      transform: null,
      validate: true,
      generateId: () => Math.random().toString(36).substring(2, 9),
      includeMetadata: true,
      skipStateCheck: false,
      autoCapture: true,
      ...(config || {}),
    };

    // Ensure includeTypes is string array
    if (this.creatorConfig.includeTypes) {
      this.creatorConfig.includeTypes = this.creatorConfig.includeTypes.map(
        (t) => String(t)
      );
    }

    // Initialize components with DI
    this.stateCapture =
      deps.stateCapture ??
      new StateCaptureService(this.store, registry, serializer, this.creatorConfig);
    this.validator = deps.validator ?? new SnapshotValidator();
    this.transformer = deps.transformer ?? null;
    this.idGenerator = deps.idGenerator ?? new SnapshotIdGenerator();
    this.comparator = deps.comparator ?? new StateComparator();
    this.eventEmitter = deps.eventEmitter ?? new SnapshotEventEmitter();
  }

  /**
   * Create default serializer
   */
  private createDefaultSerializer(): AdvancedSerializer {
    const options: SerializationOptions = {
      detectCircular: true,
      maxDepth: 100,
      includeGetters: false,
      includeNonEnumerable: false,
      includeSymbols: false,
      functionHandling: 'source',
      errorHandling: 'replace',
      circularHandling: 'reference',
    };
    return new AdvancedSerializer(options);
  }

  /**
   * Create a snapshot
   */
  create(action?: string, atomIds?: Set<symbol>): Snapshot | null {
    try {
      const state = this.stateCapture.captureState(atomIds);

      if (Object.keys(state).length === 0) {
        return null;
      }

      // Check if state has changed since last snapshot
      if (
        !this.creatorConfig.skipStateCheck &&
        this.creatorConfig.autoCapture === false &&
        !action &&
        this.lastSnapshotState
      ) {
        if (this.comparator.statesEqual(state, this.lastSnapshotState)) {
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
      const transformed = this.applyTransform(snapshot);

      // Validate if configured
      if (this.creatorConfig.validate && !this.validator.validate(transformed)) {
        return null;
      }

      // Store for next comparison
      this.lastSnapshotState = { ...state };

      this.eventEmitter.emit('create', transformed);
      return transformed;
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      this.eventEmitter.emit('error');
      return null;
    }
  }

  /**
   * Apply transform to snapshot
   */
  private applyTransform(snapshot: Snapshot): Snapshot {
    if (this.transformer) {
      return this.transformer.transform(snapshot);
    }
    if (this.creatorConfig.transform) {
      return this.creatorConfig.transform(snapshot);
    }
    return snapshot;
  }

  /**
   * Create multiple snapshots
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
        error: snapshot ? undefined : 'Failed to create snapshot',
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
   * Subscribe to creation events
   */
  subscribe(listener: (snapshot: Snapshot) => void): () => void {
    return this.eventEmitter.subscribe('create', listener);
  }

  /**
   * Update configuration
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
   * Set custom transformer
   */
  setTransformer(transformer: ISnapshotTransformer): void {
    this.transformer = transformer;
  }

  /**
   * Get listener count
   */
  getListenerCount(): number {
    return this.eventEmitter.getListenerCount('create');
  }

  /**
   * Clear listeners
   */
  clearListeners(): void {
    this.eventEmitter.clearListeners();
  }

  /**
   * Dispose the snapshot creator
   */
  async dispose(): Promise<void> {
    if (this.isDisposed()) {
      return;
    }

    this.clearListeners();
    this.lastSnapshotState = null;

    await this.disposeChildren();
    await this.runDisposeCallbacks();

    this.disposed = true;
  }
}
