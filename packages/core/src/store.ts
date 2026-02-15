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
  BaseAtom
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
    
    // Track dependency if we're currently evaluating another atom
    if (currentAtom && currentAtom !== atom) {
      // Add currentAtom as a dependent of atom
      atomState.dependents.add(currentAtom);
    }

    return atomState.value as Value;
  };

  const set: Setter = <Value>(atom: Atom<Value>, update: Value | ((prev: Value) => Value)): void => {
    // For primitive atoms, we create state if it doesn't exist
    let atomState = atomStates.get(atom) as AtomState<Value> | undefined;
    if (!atomState) {
      // This must be a primitive atom since it doesn't have state yet
      // Create initial state
      let initialValue: Value;
      if (isPrimitiveAtom(atom)) {
        // This is a primitive atom - read() takes no parameters
        initialValue = (atom as PrimitiveAtom<Value>).read();
      } else if (isComputedAtom(atom)) {
        // Computed atoms cannot be set directly
        throw new Error('Cannot set value of computed atom');
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

    // Check if this atom can be set
    if (isComputedAtom(atom)) {
      throw new Error('Cannot set value of computed atom');
    }

    // Calculate new value
    const newValue =
      typeof update === 'function'
        ? (update as (prev: Value) => Value)(atomState.value)
        : update;

    // Update value
    const previousValue = atomState.value;
    atomState.value = newValue;

    // Notify subscribers
    atomState.subscribers.forEach((subscriber) => {
      subscriber(newValue);
    });

    // Notify dependents
    atomState.dependents.forEach((dependent) => {
      // For computed atoms, we need to recompute their values
      // eslint-disable-line @typescript-eslint/no-explicit-any
      const dependentState = atomStates.get(dependent) as AtomState<any> | undefined;
      if (dependentState && (isComputedAtom(dependent) || isWritableAtom(dependent))) {
        // Track which atom is being evaluated
        const previousAtom = currentAtom;
        currentAtom = dependent;
        try {
          // Recompute the value
          // eslint-disable-line @typescript-eslint/no-explicit-any
          let newValue: any;
          if (isComputedAtom(dependent)) {
            newValue = (dependent as ComputedAtom<any>).read(get);
          } else if (isWritableAtom(dependent)) {
            newValue = (dependent as WritableAtom<any>).read(get);
          }
          
          if (dependentState.value !== newValue) {
            dependentState.value = newValue;
            dependentState.subscribers.forEach((subscriber) => {
              subscriber(newValue);
            });
          }
        } finally {
          currentAtom = previousAtom;
        }
      }
    });

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
  // eslint-disable-line @typescript-eslint/no-explicit-any
  const getState = (): Record<string, any> => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    const state: Record<string, any> = {};
    atomStates.forEach((atomState, atom) => {
      // Here we use the atom's internal ID or other identification
      // Since we don't have direct access to the atom's name, we use its index or hash
      state[atom.toString()] = atomState.value;
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

  // Enable DevTools integration
  const enableDevTools = (options: StoreEnhancementOptions = {}) => {
    isDevToolsEnabled = options.enableDevTools ?? true;
    isStackTraceEnabled = options.enableStackTrace ?? false;
    // Set other options as needed
  };

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