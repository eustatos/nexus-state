/**
 * Configuration options for the DevTools plugin.
 */
export interface DevToolsConfig {
  /** The name to display in DevTools for this store instance */
  name?: string;
  
  /** Enable stack traces for actions in DevTools */
  trace?: boolean;
  
  /** Debounce time (in ms) for sending updates to DevTools */
  latency?: number;
  
  /** Maximum number of actions to keep in DevTools history */
  maxAge?: number;
  
  /** Predicate function to determine if an action should be sent to DevTools */
  actionSanitizer?: (action: string, state: unknown) => boolean;
  
  /** Function to sanitize state before sending to DevTools */
  stateSanitizer?: (state: unknown) => unknown;
  
  /** Enable display of atom names in DevTools actions */
  showAtomNames?: boolean;
  
  /** Custom formatter for atom names */
  atomNameFormatter?: (atom: any, defaultName: string) => string;
}

/**
 * Connection interface for DevTools integration
 */
export interface DevToolsConnection {
  /** Send action and state to DevTools */
  send: (action: string | { type: string }, state: unknown) => void;
  
  /** Subscribe to messages from DevTools */
  subscribe: (listener: (message: DevToolsMessage) => void) => () => void;
  
  /** Initialize DevTools with initial state */
  init: (state: unknown) => void;
  
  /** Unsubscribe from DevTools */
  unsubscribe: () => void;
}

/**
 * Message interface from DevTools
 */
export interface DevToolsMessage {
  /** Message type */
  type: string;
  
  /** Message payload */
  payload?: unknown;
  
  /** State as JSON string */
  state?: string;
}

/**
 * Extended store interface with enhanced DevTools support
 */
export interface EnhancedStore {
  /** Get the current value of an atom */
  get: <Value>(atom: any) => Value;
  
  /** Set the value of an atom */
  set: <Value>(atom: any, update: Value | ((prev: Value) => Value)) => void;
  
  /** Get the state of all atoms in the store */
  getState: () => Record<string, unknown>;
  
  /** Set the value of an atom with metadata for DevTools */
  setWithMetadata?: <Value>(
    atom: any,
    update: Value | ((prev: Value) => Value),
    metadata?: any
  ) => void;
  
  /** Serialize the state of all atoms in the store */
  serializeState?: () => Record<string, unknown>;
}