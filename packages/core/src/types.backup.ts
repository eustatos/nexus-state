// Types for nexus-state core

export type Getter = <Value>(atom: Atom<Value>) => Value;

export type Setter = <Value>(atom: Atom<Value>, update: Value | ((prev: Value) => Value)) => void;

export type Subscriber<Value> = (value: Value) => void;

export type Plugin = (store: Store) => void;

// Action metadata for DevTools integration
export type ActionMetadata = {
  type: string;
  source?: string;
  timestamp: number;
  stackTrace?: string;
};

// Store registry modes
export type RegistryMode = 'global' | 'isolated';

export interface Store {
  get: <Value>(atom: Atom<Value>) => Value;
  set: <Value>(atom: Atom<Value>, update: Value | ((prev: Value) => Value)) => void;
  subscribe: <Value>(atom: Atom<Value>, subscriber: Subscriber<Value>) => () => void;
  getState: () => Record<string, unknown>;
  
  // Enhanced methods for DevTools integration (backward compatible)
  applyPlugin?: (plugin: Plugin) => void;
  setWithMetadata?: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value),
    metadata?: ActionMetadata
  ) => void;
  serializeState?: () => Record<string, unknown>;
  getIntercepted?: <Value>(atom: Atom<Value>) => Value;
  setIntercepted?: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value)
  ) => void;
  getPlugins?: () => Plugin[];
}

// Atom types - supporting both primitive and computed atoms
export interface PrimitiveAtom<Value> {
  readonly id: symbol;
  read: () => Value;
  write?: (set: Setter, value: Value) => void;
}

export interface ComputedAtom<Value> {
  readonly id: symbol;
  read: (get: Getter) => Value;
  write?: undefined; // Computed atoms are read-only
}

// Union type for all atom types
export type Atom<Value> = PrimitiveAtom<Value> | ComputedAtom<Value>;

// Type guards for atom types
export function isPrimitiveAtom<Value>(atom: Atom<Value>): atom is PrimitiveAtom<Value> {
  return typeof atom.read === 'function' && atom.read.length === 0;
}

export function isComputedAtom<Value>(atom: Atom<Value>): atom is ComputedAtom<Value> {
  return typeof atom.read === 'function' && atom.read.length > 0;
}

// Store registry interface for tracking atom ownership
export interface StoreRegistry {
  store: Store;
  atoms: Set<symbol>;
}

// Enhanced store types
export interface EnhancedStore extends Store {
  connectDevTools?: () => void;
}

export type StoreEnhancementOptions = {
  enableDevTools?: boolean;
  devToolsName?: string;
  registryMode?: RegistryMode;
};