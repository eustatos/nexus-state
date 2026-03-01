// Implementation of createStore function

import type {
  Atom,
  Store,
  Subscriber,
  Getter,
  Setter,
  Plugin,
  ActionMetadata,
  PrimitiveAtom,
  ComputedAtom,
  WritableAtom,
  PluginHooks,
} from './types';
import { isPrimitiveAtom, isComputedAtom, isWritableAtom } from './types';
import { serializeState as serializeStoreState } from './utils/serialization';
import { atomRegistry } from './atom-registry';
import { storeLogger as logger } from './debug';
import { batcher } from './batching';

/**
 * Internal state for an atom
 * @template Value The type of value the atom holds
 */
type AtomState<Value> = {
  /** The current value of the atom */
  value: Value;
  /** Set of subscribers to notify when the value changes */
  subscribers: Set<Subscriber<Value>>;
  /** Set of dependent atoms that depend on this atom */
  dependents: Set<Atom<any>>;
};

/**
 * Options for enhancing a store
 */
type StoreEnhancementOptions = {
  /** Enable DevTools integration */
  enableDevTools?: boolean;
  /** Enable stack trace tracking */
  enableStackTrace?: boolean;
  /** Debounce delay for state updates */
  debounceDelay?: number;
};

/**
 * Create a new store to hold atoms
 * @param plugins Array of plugins to apply to the store
 * @returns A new store instance
 * @example
 * const store = createStore();
 * const storeWithPlugins = createStore([loggerPlugin, devToolsPlugin]);
 */
export function createStore(plugins: Plugin[] = []): Store {
  const atomStates = new Map<Atom<any>, AtomState<any>>();

  // Track the current atom being evaluated for dependency tracking
  let currentAtom: Atom<any> | null = null;

  // Store enhancement state
  const appliedPlugins: Plugin[] = [];
  const pluginHooks: PluginHooks[] = [];
  let isDevToolsEnabled = false;
  let isStackTraceEnabled = false;
  let pendingStateUpdates: Array<{ atom: Atom<any>; value: any }> = [];
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const debounceDelay = 100;

  /**
   * Execute onSet hooks from all plugins
   * @param atom - The atom being set
   * @param value - The value to set
   * @returns The processed value after all hooks
   */
  const executeOnSetHooks = <T>(atom: Atom<any>, value: T): T => {
    let processedValue = value;
    for (const hooks of pluginHooks) {
      if (hooks.onSet) {
        const result = (hooks.onSet as (a: Atom<any>, v: any) => any)(
          atom,
          processedValue
        );
        if (result !== undefined) {
          processedValue = result;
        }
      }
    }
    return processedValue;
  };

  /**
   * Execute afterSet hooks from all plugins
   * @param atom - The atom that was set
   * @param value - The final value that was set
   */
  const executeAfterSetHooks = <T>(atom: Atom<any>, value: T): void => {
    for (const hooks of pluginHooks) {
      if (hooks.afterSet) {
        (hooks.afterSet as (a: Atom<any>, v: any) => void)(atom, value);
      }
    }
  };

  /**
   * Execute onGet hooks from all plugins
   * @param atom - The atom being read
   * @param value - The current value
   * @returns The processed value after all hooks
   */
  const executeOnGetHooks = <T>(atom: Atom<any>, value: T): T => {
    let processedValue = value;
    for (const hooks of pluginHooks) {
      if (hooks.onGet) {
        processedValue = (hooks.onGet as (a: Atom<any>, v: any) => any)(
          atom,
          processedValue
        );
      }
    }
    return processedValue;
  };

  const get: Getter = <Value>(atom: Atom<Value>): Value => {
    // Get or create atom state
    let atomState = atomStates.get(atom) as AtomState<Value> | undefined;
    if (!atomState) {
      logger.log(
        '[GET] Creating state for atom:',
        (atom as Atom<Value & { name?: string }>).name || 'unnamed',
        'type:',
        atom.type
      );
      // Register atom with the global registry (if not already registered)
      // and add it to this store's atom set
      const storesMap = atomRegistry.getStoresMap();
      const registry = storesMap.get(store);
      if (registry && !registry.atoms.has(atom.id)) {
        registry.atoms.add(atom.id);
      }

      // Determine atom type and get initial value
      let initialValue: Value;
      if (isPrimitiveAtom(atom)) {
        // This is a primitive atom - read() takes no parameters
        initialValue = (atom as PrimitiveAtom<Value>).read();
      } else if (isComputedAtom(atom)) {
        // This is a computed atom - read() takes get parameter
        const previousAtom = currentAtom;
        currentAtom = atom;
        try {
          logger.log(
            '[GET] Evaluating computed atom:',
            (atom as Atom<Value & { name?: string }>).name,
            'currentAtom:',
            currentAtom
              ? (currentAtom as Atom<unknown & { name?: string }>).name
              : 'null'
          );
          initialValue = (atom as ComputedAtom<Value>).read(get);
          logger.log(
            '[GET] Computed atom:',
            (atom as Atom<Value & { name?: string }>).name,
            'value:',
            initialValue
          );
        } finally {
          currentAtom = previousAtom;
        }
      } else if (isWritableAtom(atom)) {
        // This is a writable atom - read() takes get parameter
        const previousAtom = currentAtom;
        currentAtom = atom;
        try {
          initialValue = (atom as WritableAtom<Value>).read(get);
        } finally {
          currentAtom = previousAtom;
        }
      } else {
        throw new Error('Unknown atom type');
      }

      atomState = {
        value: initialValue,
        subscribers: new Set(),
        dependents: new Set(),
      };
      atomStates.set(atom, atomState as AtomState<Value>);
    }

    // Track dependency if we're currently evaluating another atom
    if (currentAtom && currentAtom !== atom) {
      // Add currentAtom as a dependent of atom
      logger.log(
        '[GET] Adding dependency:',
        (atom as Atom<Value & { name?: string }>).name,
        '->',
        (currentAtom as Atom<unknown & { name?: string }>).name
      );
      const added = atomState.dependents.add(currentAtom);
      logger.log(
        '[GET] Added dependency:',
        (atom as Atom<Value & { name?: string }>).name,
        '->',
        (currentAtom as Atom<unknown & { name?: string }>).name,
        'size now:',
        atomState.dependents.size,
        'was new?',
        added
      );
    }

    // Apply onGet hooks
    const value = atomState.value as Value;
    return executeOnGetHooks(atom, value);
  };

  const set: Setter = <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value)
  ): void => {
    logger.log(
      '[SET] Setting atom:',
      (atom as Atom<Value & { name?: string }>).name,
      'to:',
      update
    );
    // Register atom with the global registry (if not already registered)
    // and add it to this store's atom set
    const storesMap = atomRegistry.getStoresMap();
    const registry = storesMap.get(store);
    if (registry && !registry.atoms.has(atom.id)) {
      registry.atoms.add(atom.id);
    }

    // Check if this atom can be set
    if (isComputedAtom(atom)) {
      throw new Error('Cannot set value of computed atom');
    }

    // For writable atoms, call the write function
    if (isWritableAtom(atom)) {
      const write = atom.write;
      if (write) {
        // Create a setter function that updates the store
        const storeSetter: Setter = (a, u) => set(a, u);
        write(get, storeSetter, update as Value);
        return; // Write function handles the update
      }
    }

    // For primitive atoms, we create state if it doesn't exist
    let atomState = atomStates.get(atom) as AtomState<Value> | undefined;
    if (!atomState) {
      // This must be a primitive atom since it doesn't have state yet
      // Create initial state
      let initialValue: Value;
      if (isPrimitiveAtom(atom)) {
        // This is a primitive atom - read() takes no parameters
        initialValue = (atom as PrimitiveAtom<Value>).read();
      } else if (isWritableAtom(atom)) {
        // This is a writable atom - we can set it
        initialValue = (atom as WritableAtom<Value>).read(get);
      } else {
        throw new Error('Unknown atom type');
      }

      atomState = {
        value: initialValue,
        subscribers: new Set(),
        dependents: new Set(),
      };
      atomStates.set(atom, atomState as AtomState<Value>);
    }

    // Calculate new value
    const newValue =
      typeof update === 'function'
        ? (update as (prev: Value) => Value)(atomState.value)
        : update;

    // Apply onSet hooks to potentially modify the value
    const processedValue = executeOnSetHooks(atom, newValue);

    // Update value
    const previousValue = atomState.value;
    atomState.value = processedValue;
    logger.log(
      '[SET] Updated atom:',
      (atom as Atom<Value & { name?: string }>).name,
      'from:',
      previousValue,
      'to:',
      processedValue
    );

    // Schedule subscriber notifications for batching
    batcher.schedule(() => {
      atomState.subscribers.forEach((subscriber) => {
        subscriber(processedValue);
      });
    });

    // Notify dependents using BFS to handle nested computed atoms
    logger.log(
      '[SET] Notifying dependents of:',
      (atom as Atom<Value & { name?: string }>).name,
      'count:',
      atomState.dependents.size
    );
    const toNotify = new Set<Atom<unknown>>(atomState.dependents);
    const notified = new Set<Atom<unknown>>();

    while (toNotify.size > 0) {
      const current = toNotify.values().next().value as Atom<any>;
      toNotify.delete(current);

      if (notified.has(current)) continue;
      notified.add(current);

      logger.log(
        '[SET] Notifying dependent:',
        (current as Atom<unknown & { name?: string }>).name,
        'dependents size:',
        (atomStates.get(current) as AtomState<unknown>)?.dependents?.size
      );

      // For computed atoms, we need to recompute their values
      const currentState = atomStates.get(current);
      if (
        currentState &&
        (isComputedAtom(current) || isWritableAtom(current))
      ) {
        logger.log('[SET] Dependent found, type:', current.type);
        // Track which atom is being evaluated
        const previousAtom = currentAtom;
        currentAtom = current;
        try {
          // Recompute the value
          let newValue: any;
          if (isComputedAtom(current)) {
            logger.log(
              '[SET] Recomputing:',
              (current as Atom<unknown & { name?: string }>).name
            );
            newValue = (current as ComputedAtom<unknown>).read(get);
            logger.log(
              '[SET] Recomputed:',
              (current as Atom<unknown & { name?: string }>).name,
              'value:',
              newValue
            );
          } else if (isWritableAtom(current)) {
            newValue = (current as WritableAtom<any>).read(get);
          }

          if (currentState.value !== newValue) {
            logger.log(
              '[SET] Value changed, updating dependent:',
              (current as Atom<unknown & { name?: string }>).name
            );
            currentState.value = newValue;

            // Schedule subscriber notifications for batching
            batcher.schedule(() => {
              currentState.subscribers.forEach((subscriber) => {
                subscriber(newValue);
              });
            });

            // Add dependents to queue
            currentState.dependents.forEach((dep) => {
              if (!notified.has(dep)) {
                toNotify.add(dep);
              }
            });
          } else {
            logger.log(
              '[SET] Value not changed, skipping update for:',
              (current as Atom<unknown & { name?: string }>).name
            );
          }
        } finally {
          currentAtom = previousAtom;
        }
      } else {
        logger.log(
          '[SET] Dependent state not found or not computed/writable:',
          (current as Atom<unknown & { name?: string }>).name,
          'found:',
          !!currentState,
          'isComputedOrWritable:',
          currentState
            ? isComputedAtom(current) || isWritableAtom(current)
            : 'N/A'
        );
      }
    }

    // Execute afterSet hooks after value is set and dependents are notified
    executeAfterSetHooks(atom, processedValue);

    // Track state change for DevTools
    if (isDevToolsEnabled) {
      pendingStateUpdates.push({ atom, value: processedValue });
      scheduleStateUpdate();
    }
  };

  // Schedule state update for DevTools with debounce
  const scheduleStateUpdate = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      flushStateUpdates();
    }, debounceDelay);
  };

  // Flush pending state updates to DevTools
  const flushStateUpdates = () => {
    if (pendingStateUpdates.length > 0) {
      // In a real implementation, this would send updates to DevTools
      pendingStateUpdates = [];
    }
  };

  const subscribe = <Value>(
    atom: Atom<Value>,
    subscriber: Subscriber<Value>
  ): (() => void) => {
    // Register atom with the global registry (if not already registered)
    // and add it to this store's atom set
    const storesMap = atomRegistry.getStoresMap();
    const registry = storesMap.get(store);
    if (registry && !registry.atoms.has(atom.id)) {
      registry.atoms.add(atom.id);
    }

    // Get or create atom state
    let atomState = atomStates.get(atom) as AtomState<Value> | undefined;
    if (!atomState) {
      // Determine atom type and get initial value
      let initialValue: Value;
      if (isPrimitiveAtom(atom)) {
        // This is a primitive atom - read() takes no parameters
        initialValue = (atom as PrimitiveAtom<Value>).read();
      } else if (isComputedAtom(atom)) {
        // This is a computed atom - read() takes get parameter
        const previousAtom = currentAtom;
        currentAtom = atom;
        try {
          initialValue = (atom as ComputedAtom<Value>).read(get);
        } finally {
          currentAtom = previousAtom;
        }
      } else if (isWritableAtom(atom)) {
        // This is a writable atom - read() takes get parameter
        const previousAtom = currentAtom;
        currentAtom = atom;
        try {
          initialValue = (atom as WritableAtom<Value>).read(get);
        } finally {
          currentAtom = previousAtom;
        }
      } else {
        throw new Error('Unknown atom type');
      }

      atomState = {
        value: initialValue,
        subscribers: new Set(),
        dependents: new Set(),
      };
      atomStates.set(atom, atomState as AtomState<Value>);
    }

    // Add subscriber
    atomState.subscribers.add(subscriber);

    // Return unsubscribe function
    return () => {
      atomState!.subscribers.delete(subscriber);
    };
  };

  // Add method to get state of all atoms (for devtools)

  const getState = (): Record<string, unknown> => {
    const state: Record<string, unknown> = {};
    atomStates.forEach((atomState, atom) => {
      // Use atom name from registry if available, otherwise fall back to toString
      const atomName = atomRegistry.getName(atom);
      const key = atomName || atom.toString();
      state[key] = atomState.value;
    });
    return state;
  };

  // Enhanced methods for DevTools integration
  const applyPlugin = (plugin: Plugin) => {
    appliedPlugins.push(plugin);
    const hooks = plugin(store);
    // If plugin returns hooks, register them
    if (hooks && typeof hooks === 'object') {
      pluginHooks.push(hooks);
    }
  };

  const setWithMetadata = <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
    metadata?: ActionMetadata
  ): void => {
    // Add stack trace if enabled
    if (isStackTraceEnabled && metadata) {
      const stack = new Error().stack;
      if (stack) {
        metadata.stackTrace = stack;
      }
    }

    // Set the value
    set(atom, update);

    // In a real implementation, this would track the action metadata
    // for DevTools integration
  };

  // Serialize state for DevTools
  const serializeState = (): Record<string, unknown> => {
    return serializeStoreState(store);
  };

  // Intercepted getter for DevTools tracking
  const getIntercepted = <Value>(atom: Atom<Value>): Value => {
    // In a real implementation, this would track the get operation
    return get(atom);
  };

  // Intercepted setter for DevTools tracking
  const setIntercepted = <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value)
  ): void => {
    // Track the action for DevTools
    const metadata: ActionMetadata = {
      type: 'SET',
      timestamp: Date.now(),
    };

    setWithMetadata(atom, update, metadata);
  };

  // Get applied plugins
  const getPlugins = (): Plugin[] => {
    return [...appliedPlugins];
  };

  // Enable DevTools integration (currently no-op, reserved for future use)
  const _enableDevTools = (_options: StoreEnhancementOptions = {}) => {
    isDevToolsEnabled = true;
    isStackTraceEnabled = false;
    // Set other options as needed
  };
  void _enableDevTools;

  const store: Store = {
    get,
    set,
    subscribe,
    getState,
    // Enhanced methods (optional for backward compatibility)
    applyPlugin,
    setWithMetadata,
    serializeState,
    getIntercepted,
    setIntercepted,
    getPlugins,
  };

  // Auto-attach to registry in global mode (CORE-001 requirement)
  // This must be after store is defined to avoid ReferenceError
  if (typeof atomRegistry.attachStore === 'function') {
    atomRegistry.attachStore(store, 'global');
  }

  // Apply plugins
  plugins.forEach((plugin) => {
    const hooks = plugin(store);
    // If plugin returns hooks, register them
    if (hooks && typeof hooks === 'object') {
      pluginHooks.push(hooks);
    }
  });

  return store;
}
