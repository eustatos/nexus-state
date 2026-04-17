/**
 * StoreImpl - Store implementation (Facade pattern)
 *
 * This class is a facade that coordinates all store components:
 * - ScopedRegistry: Unified per-store atom registry (atoms + state + metadata)
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
import { storeLogger as logger } from '../debug';

import { AtomStateManager } from './AtomStateManager';
import { DependencyTracker } from './DependencyTracker';
import { NotificationManager } from './NotificationManager';
import { PluginSystem } from './PluginSystem';
import { ComputedEvaluator } from './ComputedEvaluator';
import { DevToolsIntegration } from './DevToolsIntegration';
import { BatchProcessor } from './BatchProcessor';
import { ScopedRegistry } from './ScopedRegistry';
import type { AtomEntry, AtomState } from './types';

/**
 * StoreImpl provides the store implementation
 */
export class StoreImpl implements Store {
  private registry: ScopedRegistry;
  private stateManager: AtomStateManager;
  private dependencyTracker: DependencyTracker;
  private notificationManager: NotificationManager;
  private pluginSystem: PluginSystem;
  private evaluator: ComputedEvaluator;
  private devTools: DevToolsIntegration;
  private batchProcessor: BatchProcessor;
  private storeRegistry: StoreRegistry;

  constructor(plugins: Plugin[] = []) {
    // Initialize unified registry
    this.registry = new ScopedRegistry(this as unknown as Store);

    // Initialize state manager (pure state storage, no registration)
    this.stateManager = new AtomStateManager();

    // Initialize other components
    this.dependencyTracker = new DependencyTracker();
    this.notificationManager = new NotificationManager();
    this.pluginSystem = new PluginSystem();
    this.evaluator = new ComputedEvaluator();
    this.devTools = new DevToolsIntegration();
    this.batchProcessor = new BatchProcessor();

    // Create StoreRegistry adapter for backward compatibility
    this.storeRegistry = {
      store: this as unknown as Store,
      atoms: new Set<symbol>(),
      getMetadata: (id: symbol) => this.registry.getMetadata(id),
      getByName: (name: string) => {
        const entry = this.registry.getByName(name);
        return entry ? (entry.atom as Atom<unknown>) : undefined;
      },
    };

    // Apply plugins
    plugins.forEach((plugin) => {
      this.pluginSystem.applyPlugin(plugin, this as unknown as Store);
    });

    logger.log('[StoreImpl] Created with', plugins.length, 'plugins');
  }

  /**
   * Get or create atom entry via ScopedRegistry.
   * Single entry point for atom registration — replaces duplicated logic.
   */
  private getOrCreateEntry<Value>(
    atom: Atom<Value>,
    getter: Getter
  ): AtomEntry<Value> {
    return this.registry.ensure(atom, () => {
      // Track in backward-compatible registry
      this.storeRegistry.atoms.add(atom.id);

      // Create initial state via evaluation
      const value = this.evaluator.evaluate(atom, getter);
      const state: AtomState<Value> = {
        value: value,
        subscribers: new Set(),
        dependents: new Set(),
      };
      return state;
    });
  }

  /**
   * Create getter function
   */
  private createGetter(): Getter {
    return <Value>(atom: Atom<Value>): Value => {
      const previousAtom = this.stateManager.getCurrentAtom();
      this.stateManager.setCurrentAtom(atom);

      try {
        const entry = this.getOrCreateEntry(atom, this.createGetter());

        // Track dependency
        if (previousAtom && previousAtom !== atom) {
          this.dependencyTracker.addDependency(entry.state, previousAtom);
        }

        // Apply onGet hooks
        const value = this.pluginSystem.executeOnGetHooks(atom, entry.state.value);
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
      // Track current atom for dependency tracking during registration
      const prevAtom = this.stateManager.getCurrentAtom();
      this.stateManager.setCurrentAtom(atom);

      try {
        const entry = this.getOrCreateEntry(atom, get);

      logger.log(
        '[StoreImpl] Setting atom:',
        atom.name || 'unnamed',
        'to:',
        update,
        'context:',
        context
      );

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

      // Calculate new value
      const newValue =
        typeof update === 'function'
          ? (update as (prev: Value) => Value)(entry.state.value)
          : update;

      // Apply onSet hooks with context (even in silent mode)
      const processedValue = this.pluginSystem.executeOnSetHooks(
        atom,
        newValue,
        context
      );

      // Update value
      const previousValue = entry.state.value;
      entry.state.value = processedValue;

      // Also update state manager for compatibility
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
      this.notificationManager.notify(atom, entry.state, processedValue);

      // Notify dependents
      this.dependencyTracker.notifyDependents(
        atom,
        (a) => this.getAtomState(a),
        (a) => this.getAtomValue(a),
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
      } finally {
        this.stateManager.setCurrentAtom(prevAtom);
      }
    };
  }

  /**
   * Get atom state from registry
   */
  private getAtomState<Value>(atom: Atom<Value>): AtomState<Value> {
    const entry = this.registry.get<Value>(atom.id);
    return entry ? entry.state : undefined as unknown as AtomState<Value>;
  }

  /**
   * Get atom value from registry
   */
  private getAtomValue<Value>(atom: Atom<Value>): Value | undefined {
    const entry = this.registry.get<Value>(atom.id);
    return entry ? entry.state.value : undefined;
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
    update: Value | ((prev: Value) => Value),
    context?: AtomContext
  ): void {
    this.set(atom, update, { silent: true, ...context });
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

    const prevAtom = this.stateManager.getCurrentAtom();
    this.stateManager.setCurrentAtom(atom);

    try {
      const entry = this.getOrCreateEntry(atom, this.createGetter());
      return this.notificationManager.subscribe(atom, entry.state, subscriber);
    } finally {
      this.stateManager.setCurrentAtom(prevAtom);
    }
  }

  /**
   * Get state of all atoms
   */
  getState(): Record<string, unknown> {
    return this.registry.getStateAsRecord();
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
    const entries = this.registry.getAll();
    for (const [key, value] of Object.entries(state)) {
      const entry = this.registry.getByName(key);
      if (entry !== undefined) {
        this.set(entry.atom, value);
      }
    }
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
    const entries = this.registry.getAll();
    const states: Array<{ atom: Atom<any>; state: AtomState<any> }> = [];

    entries.forEach((entry) => {
      const defaultValue = (entry.atom as any).read();
      entry.state.value = defaultValue;
      states.push({ atom: entry.atom, state: entry.state });
    });

    // Notify all subscribers
    states.forEach(({ atom, state }) => {
      this.notificationManager.notify(atom, state, state.value);
    });
  }

  /**
   * Get all atom IDs associated with this store
   * @returns Array of atom IDs associated with the store
   */
  getRegistryAtoms(): symbol[] {
    return this.registry.getAllIds();
  }

  /**
   * Get the store registry for internal use
   * @returns The store registry
   */
  getRegistry(): StoreRegistry {
    return this.storeRegistry;
  }

  /**
   * Set atom value by name (for SSR hydration and time-travel)
   */
  setByName(name: string, value: unknown, context?: unknown): boolean {
    const entry = this.registry.getByName(name);
    if (entry === undefined) return false;
    this.set(entry.atom, value as never, context as never);
    return true;
  }

  /**
   * Get atom by name from the store's registry
   */
  getByName(name: string): Atom<unknown> | undefined {
    const entry = this.registry.getByName(name);
    return entry?.atom;
  }

  /**
   * Get metadata for a registered atom by its ID
   */
  getAtomMetadata(id: symbol): import('../types').AtomMetadata | undefined {
    return this.registry.getMetadata(id);
  }
}
