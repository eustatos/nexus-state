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
  StoreRegistry,
} from '../types';
import type { AtomContext } from '../reactive';
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
  private registry: StoreRegistry;

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

    // Auto-attach to registry and get store registry reference
    if (typeof atomRegistry.attachStore === 'function') {
      atomRegistry.attachStore(this as unknown as Store, 'global');
    }
    // Get the registry for this store
    const storesMap = atomRegistry.getStoresMap();
    this.registry = storesMap.get(this as unknown as Store)!;

    // Apply plugins
    plugins.forEach((plugin) => {
      this.pluginSystem.applyPlugin(plugin, this as unknown as Store);
    });

    logger.log('[StoreImpl] Created with', plugins.length, 'plugins');
  }

  /**
   * Ensure atom is registered on first access
   * @param atom The atom to register
   */
  private ensureAtomRegistered<Value>(atom: Atom<Value>): void {
    const lazyMeta = atom._lazyRegistration;

    if (lazyMeta && !lazyMeta.registered) {
      // Mark as registered BEFORE calling register to prevent re-entrancy
      lazyMeta.registered = true;
      lazyMeta.registeredAt = Date.now();
      lazyMeta.accessCount = 1;

      // Register with the global registry
      atomRegistry.register(atom, atom.name);

      // Also register in current store's local registry
      if (!this.registry.atoms.has(atom.id)) {
        this.registry.atoms.add(atom.id);
      }

      logger.log(
        '[StoreImpl] Lazy registered atom:',
        atom.name || 'unnamed',
        'id:',
        atom.id.toString()
      );
    } else if (lazyMeta) {
      // Increment access count for debugging/monitoring
      lazyMeta.accessCount++;
    }
  }

  /**
   * Create getter function
   */
  private createGetter(): Getter {
    return <Value>(atom: Atom<Value>): Value => {
      // Trigger lazy registration on first access
      this.ensureAtomRegistered(atom);

      // Register atom in current store's local registry for tracking
      if (!this.registry.atoms.has(atom.id)) {
        this.registry.atoms.add(atom.id);
      }

      const previousAtom = this.stateManager.getCurrentAtom();
      this.stateManager.setCurrentAtom(atom);

      try {
        const atomState = this.stateManager.getOrCreateState(atom, () => {
          return this.evaluator.evaluate(atom, this.createGetter());
        });

        // Track dependency
        // Use previousAtom (the dependent) instead of getCurrentAtom() (which is the current atom being evaluated)
        if (previousAtom && previousAtom !== atom) {
          this.dependencyTracker.addDependency(
            atomState,
            previousAtom
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
      update: Value | ((prev: Value) => Value),
      context?: AtomContext
    ): void => {
      // Trigger lazy registration on first access
      this.ensureAtomRegistered(atom);

      logger.log(
        '[StoreImpl] Setting atom:',
        atom.name || 'unnamed',
        'to:',
        update,
        'context:',
        context
      );

      // Register atom only in current store (O(1))
      if (!this.registry.atoms.has(atom.id)) {
        this.registry.atoms.add(atom.id);
      }

      // For writable atoms with write function, call write directly
      if (isWritableAtom(atom) && atom.write) {
        const write = atom.write;
        const storeSetter: Setter = (a, u, ctx?: AtomContext) => {
          // Merge contexts (child context takes precedence)
          const mergedContext = ctx ? { ...context, ...ctx } : context;
          this.createSetter(get)(a, u, mergedContext);
        };
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

      // Apply onSet hooks with context (even in silent mode)
      const processedValue = this.pluginSystem.executeOnSetHooks(
        atom,
        newValue,
        context
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

      // Silent mode - skip notifications but still execute hooks
      if (context?.silent) {
        logger.log(
          '[StoreImpl] Silent update:',
          atom.name || 'unnamed',
          'from:',
          previousValue,
          'to:',
          processedValue
        );
        return;
      }

      // Normal update with side effects
      // Notify subscribers
      this.notificationManager.notify(atom, atomState, processedValue);

      // Notify dependents
      this.dependencyTracker.notifyDependents(
        atom,
        (a) => this.stateManager.getState(a)!,
        (a) => this.stateManager.getValue(a),
        (a) => this.evaluator.recompute(a, get)
      );

      // Execute afterSet hooks with context (only in normal mode)
      if (!context?.silent) {
        this.pluginSystem.executeAfterSetHooks(atom, processedValue, context);
      }

      // Track for DevTools (only in normal mode)
      if (!context?.silent) {
        if (context?.source) {
          this.devTools.trackStateChange(atom, {
            value: processedValue,
            source: context.source,
            timestamp: Date.now(),
          });
        } else {
          this.devTools.trackStateChange(atom, processedValue);
        }
      }
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
  set<Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
    context?: AtomContext
  ): void {
    this.createSetter(this.createGetter())(atom, update, context);
  }

  /**
   * Set atom value silently (without notifications)
   * @param atom Atom to update
   * @param update New value or updater function
   */
  setSilently<Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value)
  ): void {
    this.set(atom, update, { silent: true });
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

    // Trigger lazy registration on subscribe
    this.ensureAtomRegistered(atom);

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

  /**
   * Set multiple atoms at once by atom names (for SSR hydration)
   * @param state Record of atom names to values
   * @returns The store instance for chaining
   */
  setState(state: Record<string, unknown>): Store {
    Object.entries(state).forEach(([key, value]) => {
      const atom = Array.from(this.stateManager.getAllStates().keys())
        .find(a => atomRegistry.getName(a) === key);
      if (atom) {
        this.set(atom as any, value);
      }
    });
    return this as unknown as Store;
  }

  /**
   * Reset an atom to its default value from atom.read()
   * @param atom The atom to reset
   */
  reset<Value>(atom: Atom<Value>): void {
    const defaultValue = (atom as any).read();
    this.set(atom, defaultValue);
  }

  /**
   * Clear all atoms to their default values
   */
  clear(): void {
    const states = this.stateManager.getAllStates();
    states.forEach((_, atom) => {
      const defaultValue = (atom as any).read();
      this.stateManager.setValue(atom, defaultValue);
    });
    // Notify all subscribers
    states.forEach((state, atom) => {
      this.notificationManager.notify(atom, state, state.value);
    });
  }
}
