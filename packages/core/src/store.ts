// Implementation of createStore function

import type { Atom, Store, Subscriber, Getter, Setter, Plugin, ActionMetadata } from './types';
import { serializeState as serializeStoreState } from './utils/serialization';
import { atomRegistry } from './atom-registry';

type AtomState<Value> = {
  value: Value;
  subscribers: Set<Subscriber<Value>>;
  dependents: Set<Atom<any>>; // eslint-disable-line @typescript-eslint/no-explicit-any
};

// Store enhancement options
type StoreEnhancementOptions = {
  enableDevTools?: boolean;
  enableStackTrace?: boolean;
  debounceDelay?: number;
};

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
  let debounceTimer: NodeJS.Timeout | null = null;
  const debounceDelay = 100;

  const get: Getter = <Value>(atom: Atom<Value>): Value => {
    // Get or create atom state
    let atomState = atomStates.get(atom) as AtomState<Value> | undefined;
    if (!atomState) {
      // Determine if this is a computed atom by checking if read function expects parameters
      let initialValue: Value;
      if (atom.read.length > 0) {
        // This is a computed atom - it expects a get parameter
        const previousAtom = currentAtom;
        currentAtom = atom;
        try {
          initialValue = atom.read(get as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        } finally {
          currentAtom = previousAtom;
        }
      } else {
        // This is a primitive atom - it doesn't expect parameters
        initialValue = atom.read();
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
      atomState = {
        value: atom.read(), // For primitive atoms, read() returns initial value
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

    // Notify subscribers
    atomState.subscribers.forEach((subscriber) => {
      subscriber(newValue);
    });

    // Notify dependents
    atomState.dependents.forEach((dependent) => {
      // For computed atoms, we need to recompute their values
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dependentState = atomStates.get(dependent) as AtomState<any> | undefined;
      if (dependentState) {
        // Track which atom is being evaluated
        const previousAtom = currentAtom;
        currentAtom = dependent;
        try {
          // Recompute the value
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newValue = dependent.read(get as any);
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
      // Determine if this is a computed atom by checking if read function expects parameters
      let initialValue: Value;
      if (atom.read.length > 0) {
        // This is a computed atom - it expects a get parameter
        const previousAtom = currentAtom;
        currentAtom = atom;
        try {
          initialValue = atom.read(get as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        } finally {
          currentAtom = previousAtom;
        }
      } else {
        // This is a primitive atom - it doesn't expect parameters
        initialValue = atom.read();
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getState = (): Record<string, any> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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