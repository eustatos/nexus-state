// Types for nexus-state core

export type Getter = <Value>(atom: Atom<Value>) => Value;

export type Setter = <Value>(
  atom: Atom<Value>,
  update: Value | ((prev: Value) => Value)
) => void;

export type Subscriber<Value> = (value: Value) => void;

export type Plugin = (store: Store) => void;

// Action metadata for DevTools integration
export type ActionMetadata = {
  type: string;
  source?: string;
  timestamp: number;
  stackTrace?: string;
};

export interface Store {
  get: <Value>(atom: Atom<Value>) => Value;
  set: <Value>(
    atom: Atom<Value>,
    update: Value | ((prev: Value) => Value)
  ) => void;
  subscribe: <Value>(
    atom: Atom<Value>,
    subscriber: Subscriber<Value>
  ) => () => void;
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

export interface Atom<Value> {
  readonly id: symbol;
  read: (get: Getter) => Value;
  write?: (get: Getter, set: Setter, value: Value) => void;
}

// Enhanced store types
export interface EnhancedStore extends Store {
  connectDevTools?: () => void;
}

export type StoreEnhancementOptions = {
  enableDevTools?: boolean;
  devToolsName?: string;
};