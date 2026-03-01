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
} from './types';
import { isPrimitiveAtom, isComputedAtom, isWritableAtom } from './types';
import { serializeState as serializeStoreState } from './utils/serialization';
import { atomRegistry } from './atom-registry';

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
  dependents: Set<Atom<any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const atomStates = new Map<Atom<any>, AtomState<any>>();
  
  // Track the current atom being evaluated for dependency tracking
  let currentAtom: Atom<any> | null = null;
  
  // Store enhancement state
  const appliedPlugins: Plugin[] = [];
  let isDevToolsEnabled = false;
  let isStackTraceEnabled = false;
  let pendingStateUpdates: Array<{ atom: Atom<any>, value: any }> = [];
  let debounceTimer: any | null = null;
  const debounceDelay = 100;

  const get: Getter = <Value>(atom: Atom<Value>): Value => {
    // Get or create atom state
    let atomState = atomStates.get(atom) as AtomState<Value> | undefined;
    if (!atomState) {
      console.log('[GET] Creating state for atom:', (atom as any).name || 'unnamed', 'type:', atom.type);
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
          console.log('[GET] Evaluating computed atom:', (atom as any).name, 'currentAtom:', currentAtom ? (currentAtom as any).name : 'null');
          initialValue = (atom as ComputedAtom<Value>).read(get);
          console.log('[GET] Computed atom:', (atom as any).name, 'value:', initialValue);
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
      atomStates.set(atom, atomState as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    
    // Track dependency if we're currently evaluating another atom
    if (currentAtom && currentAtom !== atom) {
      // Add currentAtom as a dependent of atom
      console.log('[GET] Adding dependency:', (atom as any).name, '->', (currentAtom as any).name);
      const added = atomState.dependents.add(currentAtom);
      console.log('[GET] Added dependency:', (atom as any).name, '->', (currentAtom as any).name, 'size now:', atomState.dependents.size, 'was new?', added);
    }

    return atomState.value as Value;
  };

  const set: Setter = <Value>(atom: Atom<Value>, update: Value | ((prev: Value) => Value)): void => {
    console.log('[SET] Setting atom:', (atom as any).name, 'to:', update);
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
      atomStates.set(atom, atomState as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    // Calculate new value
    const newValue =
      typeof update === 'function'
        ? (update as (prev: Value) => Value)(atomState.value)
        : update;

    // Update value
    const previousValue = atomState.value;
    atomState.value = newValue;
    console.log('[SET] Updated atom:', (atom as any).name, 'from:', previousValue, 'to:', newValue);

    // Notify subscribers
    atomState.subscribers.forEach((subscriber) => {
      subscriber(newValue);
    });

    // Notify dependents using BFS to handle nested computed atoms
    console.log('[SET] Notifying dependents of:', (atom as any).name, 'count:', atomState.dependents.size);
    const toNotify = new Set<Atom<any>>(atomState.dependents);
    const notified = new Set<Atom<any>>();
    
    while (toNotify.size > 0) {
      const current = toNotify.values().next().value as Atom<any>;
      toNotify.delete(current);
      
      if (notified.has(current)) continue;
      notified.add(current);
      
      console.log('[SET] Notifying dependent:', (current as any).name, 'dependents size:', (atomStates.get(current) as any)?.dependents?.size);
      
      // For computed atoms, we need to recompute their values
      const currentState = atomStates.get(current);
      if (currentState && (isComputedAtom(current) || isWritableAtom(current))) {
        console.log('[SET] Dependent found, type:', current.type);
        // Track which atom is being evaluated
        const previousAtom = currentAtom;
        currentAtom = current;
        try {
          // Recompute the value
          let newValue: any;
          if (isComputedAtom(current)) {
            console.log('[SET] Recomputing:', (current as any).name);
            newValue = (current as ComputedAtom<any>).read(get);
            console.log('[SET] Recomputed:', (current as any).name, 'value:', newValue);
          } else if (isWritableAtom(current)) {
            newValue = (current as WritableAtom<any>).read(get);
          }
          
          if (currentState.value !== newValue) {
            console.log('[SET] Value changed, updating dependent:', (current as any).name);
            currentState.value = newValue;
            currentState.subscribers.forEach((subscriber) => {
              subscriber(newValue);
            });
            // Add dependents to queue
            currentState.dependents.forEach((dep) => {
              if (!notified.has(dep)) {
                toNotify.add(dep);
              }
            });
          } else {
            console.log('[SET] Value not changed, skipping update for:', (current as any).name);
          }
        } finally {
          currentAtom = previousAtom;
        }
      } else {
        console.log('[SET] Dependent state not found or not computed/writable:', (current as any).name, 'found:', !!currentState, 'isComputedOrWritable:', currentState ? (isComputedAtom(current) || isWritableAtom(current)) : 'N/A');
      }
    }

    // Track state change for DevTools
    if (isDevToolsEnabled) {
      pendingStateUpdates.push({ atom, value: newValue });
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

  const subscribe = <Value>(atom: Atom<Value>, subscriber: Subscriber<Value>): (() => void) => {
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
      atomStates.set(atom, atomState as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    // Add subscriber
    atomState.subscribers.add(subscriber);

    // Return unsubscribe function
    return () => {
      atomState!.subscribers.delete(subscriber);
    };
  };

  // Add method to get state of all atoms (for devtools)
   
  const getState = (): Record<string, any> => {
     
    const state: Record<string, any> = {};
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
    plugin(store);
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
  if (typeof atomRegistry.attachStore === "function") {
    atomRegistry.attachStore(store, "global");
  }

  // Apply plugins
  plugins.forEach(plugin => plugin(store));

  return store;
}