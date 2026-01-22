// Types for nexus-state core

export type Getter = <Value>(atom: Atom<Value>) => Value;

export type Setter = <Value>(
  atom: Atom<Value>,
  update: Value | ((prev: Value) => Value)
) => void;

export type Subscriber<Value> = (value: Value) => void;

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
}

export interface Atom<Value> {
  readonly id: symbol;
  read: (get: Getter) => Value;
  write?: (get: Getter, set: Setter, value: Value) => void;
}