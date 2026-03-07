/**
 * StoreImpl - Store implementation (Facade pattern)
 *
 * This class is a facade that coordinates all store components:
 * - AtomStateManager: State storage
 * - DependencyTracker: Dependency management
 * - NotificationManager: Subscription management
 * - PluginSystem: Plugin management
 * - ComputedEvaluator: Atom evaluation
 * - DevToolsIntegration: DevTools support
 * - BatchProcessor: Batch processing
 */

import type {
  Atom,
  Store,
  Subscriber,
  Getter,
  Setter,
  Plugin,
  ActionMetadata,
} from '../types';
import { isWritableAtom } from '../types';
import { atomRegistry } from '../atom-registry';
import { storeLogger as logger } from '../debug';

import { AtomStateManager } from './AtomStateManager';
import { DependencyTracker } from './DependencyTracker';
import { NotificationManager } from './NotificationManager';
import { PluginSystem } from './PluginSystem';
import { ComputedEvaluator } from './ComputedEvaluator';
import { DevToolsIntegration } from './DevToolsIntegration';
import { BatchProcessor } from './BatchProcessor';

/**
 * StoreImpl provides the store implementation
 */
export class StoreImpl implements Store {
  private stateManager: AtomStateManager;
  private dependencyTracker: DependencyTracker;
  private notificationManager: NotificationManager;
  private pluginSystem: PluginSystem;
  private evaluator: ComputedEvaluator;
  private devTools: DevToolsIntegration;
  private batchProcessor: BatchProcessor;

  constructor(plugins: Plugin[] = []) {
    // Initialize components
    this.stateManager = new AtomStateManager();
    this.dependencyTracker = new DependencyTracker();
    this.notificationManager = new NotificationManager();
    this.pluginSystem = new PluginSystem();
    this.evaluator = new ComputedEvaluator();
    this.devTools = new DevToolsIntegration();
    this.batchProcessor = new BatchProcessor();

    // Create getter and setter
    const get = this.createGetter();
    const set = this.createSetter(get);

    // Apply plugins
    plugins.forEach((plugin) => {
      this.pluginSystem.applyPlugin(plugin, this as unknown as Store);
    });

    // Auto-attach to registry
    if (typeof atomRegistry.attachStore === 'function') {
      atomRegistry.attachStore(this as unknown as Store, 'global');
    }

    logger.log('[StoreImpl] Created with', plugins.length, 'plugins');
  }

  /**
   * Create getter function
   */
  private createGetter(): Getter {
    return <Value>(atom: Atom<Value>): Value => {
      const previousAtom = this.stateManager.getCurrentAtom();
      this.stateManager.setCurrentAtom(atom);

      try {
        const atomState = this.stateManager.getOrCreateState(atom, () => {
          return this.evaluator.evaluate(atom, this.createGetter());
        });

        // Track dependency
        if (
          this.stateManager.getCurrentAtom() &&
          this.stateManager.getCurrentAtom() !== atom
        ) {
          this.dependencyTracker.addDependency(
            atomState,
            this.stateManager.getCurrentAtom()!
          );
        }

        // Apply onGet hooks
        const value = this.pluginSystem.executeOnGetHooks(atom, atomState.value);
        return value;
      } finally {
        this.stateManager.setCurrentAtom(previousAtom);
      }
    };
  }

  /**
   * Create setter function
   */
  private createSetter(get: Getter): Setter {
    return <Value>(
      atom: Atom<Value>,
      update: Value | ((prev: Value) => Value)
    ): void => {
      logger.log(
        '[StoreImpl] Setting atom:',
        atom.name || 'unnamed',
        'to:',
        update
      );

      // Register atom with registry
      const storesMap = atomRegistry.getStoresMap();
      for (const registry of storesMap.values()) {
        if (!registry.atoms.has(atom.id)) {
          registry.atoms.add(atom.id);
        }
      }

      // For writable atoms with write function, call write directly
      if (isWritableAtom(atom) && atom.write) {
        const write = atom.write;
        const storeSetter: Setter = (a, u) => this.createSetter(get)(a, u);
        write(get, storeSetter, update as Value);
        return;
      }

      // Get or create state
      const atomState = this.stateManager.getOrCreateState(atom, () => {
        return this.evaluator.evaluate(atom, get);
      });

      // Calculate new value
      const newValue =
        typeof update === 'function'
          ? (update as (prev: Value) => Value)(atomState.value)
          : update;

      // Apply onSet hooks
      const processedValue = this.pluginSystem.executeOnSetHooks(
        atom,
        newValue
      );

      // Update value
      const previousValue = atomState.value;
      this.stateManager.setValue(atom, processedValue);

      logger.log(
        '[StoreImpl] Updated atom:',
        atom.name || 'unnamed',
        'from:',
        previousValue,
        'to:',
        processedValue
      );

      // Notify subscribers
      this.notificationManager.notify(atom, atomState, processedValue);

      // Notify dependents
      this.dependencyTracker.notifyDependents(
        atom,
        (a) => this.stateManager.getState(a)!,
        (a) => this.stateManager.getValue(a),
        (a) => this.evaluator.recompute(a, get)
      );

      // Execute afterSet hooks
      this.pluginSystem.executeAfterSetHooks(atom, processedValue);

      // Track for DevTools
      this.devTools.trackStateChange(atom, processedValue);
    };
  }

  /**
   * Get atom value
   */
  get<Value>(atom: Atom<Value>): Value {
    return this.createGetter()(atom);
  }

  /**
   * Set atom value
   */
  set<Value>(atom: Atom<Value>, update: Value | ((prev: Value) => Value)): void {
    this.createSetter(this.createGetter())(atom, update);
  }

  /**
   * Subscribe to atom changes
   */
  subscribe<Value>(
    atom: Atom<Value>,
    subscriber: Subscriber<Value>
  ): () => void {
    logger.log(
      '[StoreImpl] Subscribing to atom:',
      atom.name || 'unnamed'
    );

    // Register atom with registry
    const storesMap = atomRegistry.getStoresMap();
    for (const registry of storesMap.values()) {
      if (!registry.atoms.has(atom.id)) {
        registry.atoms.add(atom.id);
      }
    }

    // Get or create state
    const atomState = this.stateManager.getOrCreateState(atom, () => {
      return this.evaluator.evaluate(atom, this.createGetter());
    });

    // Subscribe
    return this.notificationManager.subscribe(atom, atomState, subscriber);
  }

  /**
   * Get state of all atoms
   */
  getState(): Record<string, unknown> {
    return this.stateManager.getStateAsRecord();
  }

  /**
   * Apply plugin
   */
  applyPlugin(plugin: Plugin): void {
    this.pluginSystem.applyPlugin(plugin, this as unknown as Store);
  }

  /**
   * Set value with metadata
   */
  setWithMetadata<Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
    metadata?: ActionMetadata
  ): void {
    this.devTools.setWithMetadata(
      atom,
      update,
      metadata,
      this.createSetter(this.createGetter())
    );
  }

  /**
   * Serialize state
   */
  serializeState(): Record<string, unknown> {
    return this.devTools.serializeState(this as unknown as Store);
  }

  /**
   * Get intercepted getter
   */
  getIntercepted<Value>(atom: Atom<Value>): Value {
    return this.devTools.createInterceptedGetter(this.createGetter())(atom);
  }

  /**
   * Get intercepted setter
   */
  setIntercepted<Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value)
  ): void {
    this.devTools.createInterceptedSetter(
      this.createSetter(this.createGetter())
    )(atom, update);
  }

  /**
   * Get applied plugins
   */
  getPlugins(): Plugin[] {
    return this.pluginSystem.getPlugins();
  }

  /**
   * Get state manager
   */
  getStateManager(): AtomStateManager {
    return this.stateManager;
  }

  /**
   * Get dependency tracker
   */
  getDependencyTracker(): DependencyTracker {
    return this.dependencyTracker;
  }

  /**
   * Get notification manager
   */
  getNotificationManager(): NotificationManager {
    return this.notificationManager;
  }

  /**
   * Get plugin system
   */
  getPluginSystem(): PluginSystem {
    return this.pluginSystem;
  }

  /**
   * Get evaluator
   */
  getEvaluator(): ComputedEvaluator {
    return this.evaluator;
  }

  /**
   * Get DevTools integration
   */
  getDevTools(): DevToolsIntegration {
    return this.devTools;
  }

  /**
   * Get batch processor
   */
  getBatchProcessor(): BatchProcessor {
    return this.batchProcessor;
  }
}
