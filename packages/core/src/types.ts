// Types for nexus-state core

/**
 * Function to get the current value of an atom
 * @template Value The type of value the atom holds
 * @param atom The atom to get the value from
 * @returns The current value of the atom
 */
export type Getter = <Value>(atom: Atom<Value>) => Value;

/**
 * Function to set the value of an atom
 * @template Value The type of value the atom holds
 * @param atom The atom to set the value for
 * @param update The new value or a function to compute the new value
 */
export type Setter = <Value>(
  atom: Atom<Value>,
  update: Value | ((prev: Value) => Value),
) => void;

/**
 * Function to subscribe to changes in an atom's value
 * @template Value The type of value the atom holds
 * @param value The new value of the atom
 */
export type Subscriber<Value> = (value: Value) => void;

/**
 * A plugin function that can enhance a store with additional functionality
 * @param store The store to enhance
 */
export type Plugin = (store: Store) => void;

/**
 * Metadata about an action for DevTools integration
 */
export type ActionMetadata = {
  /** The type of action */
  type: string;
  /** The source of the action (e.g., atom name) */
  source?: string;
  /** Timestamp when the action occurred */
  timestamp: number;
  /** Stack trace for the action (if enabled) */
  stackTrace?: string;
};

/**
 * Modes for store registry
 */
export type RegistryMode = "global" | "isolated";

/**
 * Interface for a store that holds atoms and provides methods to interact with them
 */
export interface Store {
  /**
   * Get the current value of an atom
   * @template Value The type of value the atom holds
   * @param atom The atom to get the value from
   * @returns The current value of the atom
   */
  get: <Value>(atom: Atom<Value>) => Value;

  /**
   * Set the value of an atom
   * @template Value The type of value the atom holds
   * @param atom The atom to set the value for
   * @param update The new value or a function to compute the new value
   */
  set: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
  ) => void;

  /**
   * Subscribe to changes in an atom's value
   * @template Value The type of value the atom holds
   * @param atom The atom to subscribe to
   * @param subscriber The function to call when the atom's value changes
   * @returns A function to unsubscribe from the atom
   */
  subscribe: <Value>(
    atom: Atom<Value>,
    subscriber: Subscriber<Value>,
  ) => () => void;

  /**
   * Get the state of all atoms in the store
   * @returns An object containing the state of all atoms
   */
  getState: () => Record<string, unknown>;

  /**
   * Apply a plugin to the store
   * @param plugin The plugin to apply
   */
  applyPlugin?: (plugin: Plugin) => void;

  /**
   * Set the value of an atom with metadata for DevTools
   * @template Value The type of value the atom holds
   * @param atom The atom to set the value for
   * @param update The new value or a function to compute the new value
   * @param metadata Metadata about the action
   */
  setWithMetadata?: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
    metadata?: ActionMetadata,
  ) => void;

  /**
   * Serialize the state of all atoms in the store
   * @returns An object containing the serialized state of all atoms
   */
  serializeState?: () => Record<string, unknown>;

  /**
   * Get the current value of an atom with interception for DevTools
   * @template Value The type of value the atom holds
   * @param atom The atom to get the value from
   * @returns The current value of the atom
   */
  getIntercepted?: <Value>(atom: Atom<Value>) => Value;

  /**
   * Set the value of an atom with interception for DevTools
   * @template Value The type of value the atom holds
   * @param atom The atom to set the value for
   * @param update The new value or a function to compute the new value
   */
  setIntercepted?: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
  ) => void;

  /**
   * Get the list of applied plugins
   * @returns An array of applied plugins
   */
  getPlugins?: () => Plugin[];
}

// === NEW HIERARCHICAL ATOM TYPES (CORE-002) ===

/**
 * Base interface for all atom types
 * @template Value The type of value the atom holds
 */
export interface BaseAtom<Value> {
  /** Unique identifier for the atom */
  readonly id: symbol;
  /** Type of the atom for runtime type checking */
  readonly type: "primitive" | "computed" | "writable";
  /** Optional name for debugging and DevTools */
  readonly name?: string;
}

/**
 * Primitive atom that holds a value and can be updated
 * @template Value The type of value the atom holds
 */
export interface PrimitiveAtom<Value> extends BaseAtom<Value> {
  /** Type identifier for runtime type checking */
  readonly type: "primitive";
  /** Function to read the atom's value */
  read: () => Value;
  /** Optional function to write to the atom */
  write?: (set: Setter, value: Value) => void;
}

/**
 * Computed atom that derives its value from other atoms
 * @template Value The type of value the atom holds
 */
export interface ComputedAtom<Value> extends BaseAtom<Value> {
  /** Type identifier for runtime type checking */
  readonly type: "computed";
  /** Function to compute the atom's value based on other atoms */
  read: (get: Getter) => Value;
  /** Computed atoms are read-only */
  write?: undefined;
}

/**
 * Writable atom that can both read and write values
 * @template Value The type of value the atom holds
 */
export interface WritableAtom<Value> extends BaseAtom<Value> {
  /** Type identifier for runtime type checking */
  readonly type: "writable";
  /** Function to compute the atom's value based on other atoms */
  read: (get: Getter) => Value;
  /** Function to write to the atom */
  write: (get: Getter, set: Setter, value: Value) => void;
}

/**
 * Union type for all atom types
 * @template Value The type of value the atom holds
 */
export type Atom<Value> =
  | PrimitiveAtom<Value>
  | ComputedAtom<Value>
  | WritableAtom<Value>;

// === TYPE GUARDS ===

/**
 * Type guard to check if an atom is a primitive atom
 * @template Value The type of value the atom holds
 * @param atom The atom to check
 * @returns True if the atom is a primitive atom
 */
export function isPrimitiveAtom<Value>(
  atom: Atom<Value>,
): atom is PrimitiveAtom<Value> {
  return atom.type === "primitive";
}

/**
 * Type guard to check if an atom is a computed atom
 * @template Value The type of value the atom holds
 * @param atom The atom to check
 * @returns True if the atom is a computed atom
 */
export function isComputedAtom<Value>(
  atom: Atom<Value>,
): atom is ComputedAtom<Value> {
  return atom.type === "computed";
}

/**
 * Type guard to check if an atom is a writable atom
 * @template Value The type of value the atom holds
 * @param atom The atom to check
 * @returns True if the atom is a writable atom
 */
export function isWritableAtom<Value>(
  atom: Atom<Value>,
): atom is WritableAtom<Value> {
  return atom.type === "writable";
}

// === UTILITY TYPES ===

/**
 * Extract the value type from an atom
 * @template A The atom type
 */
export type AtomValue<A> = A extends Atom<infer V> ? V : never;

/**
 * Any atom type
 */
export type AnyAtom = Atom<any>;

// Store registry interface for tracking atom ownership
export interface StoreRegistry {
  /** The store that owns the atoms */
  store: Store;
  /** The set of atom IDs owned by the store */
  atoms: Set<symbol>;
}

// === TIME TRAVEL TYPES ===

export interface TimeTravelOptions {
  maxHistory?: number;
  autoCapture?: boolean;
}

export interface SnapshotMetadata {
  timestamp: number;
  action?: string;
  atomCount: number;
}

export interface SnapshotStateEntry {
  value: any;
  type: "primitive" | "computed" | "writable";
}

export interface Snapshot {
  id: string;
  state: Record<string, SnapshotStateEntry>;
  metadata: SnapshotMetadata;
}

export interface TimeTravelAPI {
  capture(action?: string): void;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  jumpTo(index: number): boolean;
  clearHistory(): void;
  getHistory(): Snapshot[];
  importState(state: Record<string, unknown>): boolean;
}

// Enhanced store types
export interface EnhancedStore extends Store, TimeTravelAPI {
  /** Connect to DevTools */
  connectDevTools?: () => void;
}

export type StoreEnhancementOptions = {
  /** Enable DevTools integration */
  enableDevTools?: boolean;
  /** Name for the DevTools instance */
  devToolsName?: string;
  /** Registry mode for the store */
  registryMode?: RegistryMode;
  /** Enable Time Travel functionality */
  enableTimeTravel?: boolean;
  /** Maximum number of snapshots to keep */
  maxHistory?: number;
  /** Automatically capture snapshots on store changes */
  autoCapture?: boolean;
};
