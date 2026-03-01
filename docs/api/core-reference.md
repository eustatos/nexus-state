# Core API Reference

## atom(initialValue, name?)

Creates a new atom with an initial value.

### Syntax

```typescript
function atom<Value>(initialValue: Value, name?: string): PrimitiveAtom<Value>;

function atom<Value>(
  read: (get: Getter) => Value,
  name?: string,
): ComputedAtom<Value>;

function atom<Value>(
  initialValue: Value,
  write: (get: Getter, set: Setter, value: Value) => void,
  name?: string,
): WritableAtom<Value>;
```

### Parameters

- `initialValue` (`Value`): The initial value for the atom
- `read` (`(get: Getter) => Value`): Function to compute atom value
- `write` (`(get: Getter, set: Setter, value: Value) => void`): Function to handle writes
- `name` (`string`, optional): Display name for DevTools

### Returns

- `PrimitiveAtom<Value>`, `ComputedAtom<Value>`, or `WritableAtom<Value>`: The created atom

### Examples

#### Creating a primitive atom:

```typescript
import { atom } from "@nexus-state/core";

const counter = atom(0, "counter");
// typeof counter: PrimitiveAtom<number>
```

#### Creating a computed atom:

```typescript
import { atom } from "@nexus-state/core";

const counter = atom(0, "counter");
const doubleCounter = atom((get) => get(counter) * 2, "doubleCounter");
// typeof doubleCounter: ComputedAtom<number>
```

#### Creating a writable atom:

```typescript
import { atom } from "@nexus-state/core";

const user = atom(
  () => ({ name: "", age: 0 }),
  (get, set, update) => {
    set(user, { ...get(user), ...update });
  },
  "user",
);
// typeof user: WritableAtom<User>
```

## atomRegistry

Global registry for atoms to support DevTools integration and time travel.

### Methods

#### `get(atomId)`

Get an atom by its ID.

```typescript
const atom = atomRegistry.get(atomId);
```

#### `getAll()`

Get all registered atoms.

```typescript
const allAtoms = atomRegistry.getAll();
```

#### `getName(atom)`

Get the name of an atom.

```typescript
const name = atomRegistry.getName(atom);
```

#### `attachStore(store, mode?)`

Attach a store to the registry.

```typescript
atomRegistry.attachStore(store, 'global' | 'isolated');
```

## createEnhancedStore(plugins, options?)

Creates an enhanced store with DevTools integration capabilities.

### Syntax

```typescript
function createEnhancedStore(
  plugins?: Plugin[],
  options?: StoreEnhancementOptions,
): EnhancedStore;
```

### Parameters

- `plugins` (`Plugin[]`, optional): Array of plugins to apply to the store
- `options` (`StoreEnhancementOptions`, optional): Options for store enhancement

### StoreEnhancementOptions

- `enableDevTools` (`boolean`, default: `false`): Whether to enable DevTools integration
- `devToolsName` (`string`, optional): Name to display in DevTools
- `enableTimeTravel` (`boolean`, default: `true`): Whether to enable Time Travel functionality
- `maxHistory` (`number`, default: `50`): Maximum number of snapshots to keep
- `autoCapture` (`boolean`, default: `true`): Automatically capture snapshots on store changes
- `registryMode` (`string`, default: `'global'`): Registry mode: `'global'` or `'isolated'`

### EnhancedStore API

#### Standard Store Methods

- `get(atom)`: Get the current value of an atom
- `set(atom, newValue | updater)`: Set the value of an atom
- `subscribe(atom, listener)`: Subscribe to changes in an atom
- `getState()`: Get the state of all atoms

#### Time Travel Methods

- `captureSnapshot(action?)`: Capture a new snapshot
- `undo()`: Undo to the previous state
- `redo()`: Redo to the next state
- `canUndo()`: Check if undo is available
- `canRedo()`: Check if redo is available
- `jumpTo(index)`: Jump to a specific snapshot
- `clearHistory()`: Clear all history
- `getHistory()`: Get all snapshots in history

#### DevTools Methods

- `connectDevTools()`: Connect to DevTools for debugging

### Examples

#### Basic usage:

```typescript
import { createEnhancedStore } from "@nexus-state/core";

const store = createEnhancedStore();
```

#### With plugins:

```typescript
import { createEnhancedStore } from "@nexus-state/core";
import { devTools } from "@nexus-state/devtools";

const store = createEnhancedStore([devTools()], {
  enableDevTools: true,
  enableTimeTravel: true
});
```

#### With options:

```typescript
import { createEnhancedStore } from "@nexus-state/core";

const store = createEnhancedStore([], {
  enableDevTools: true,
  enableTimeTravel: true,
  maxHistory: 100,
  autoCapture: false
});
```

## SimpleTimeTravel

Manages time travel functionality for stores.

### Constructor

```typescript
new SimpleTimeTravel(store, options);
```

### Options

- `maxHistory` (`number`, default: `50`): Maximum number of snapshots to keep
- `autoCapture` (`boolean`, default: `true`): Automatically capture snapshots on store changes

### Methods

- `capture(action?)`: Capture a new snapshot
- `undo()`: Undo to the previous state
- `redo()`: Redo to the next state
- `canUndo()`: Check if undo is available
- `canRedo()`: Check if redo is available
- `jumpTo(index)`: Jump to a specific snapshot
- `clearHistory()`: Clear all history
- `getHistory()`: Get all snapshots in history

### Example

```typescript
import { SimpleTimeTravel } from "@nexus-state/core";

const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 100,
  autoCapture: false
});

timeTravel.capture('User Action');
timeTravel.undo();
timeTravel.redo();
```

## serializeState(state)

Serializes the state for persistence or debugging.

### Parameters

- `state` (`State`): The state to serialize

### Returns

- `SerializedState`: The serialized state

### Example

```typescript
import { serializeState, atom, createStore } from "@nexus-state/core";

const countAtom = atom(0);
const store = createStore();
store.set(countAtom, 5);

const serialized = serializeState(store.getState());
console.log(serialized); // { "countAtom": 5 }
```

## Types

### Atom

```typescript
interface Atom {
  id: symbol;
  read: Getter;
  write?: Setter;
  name?: string;
}
```

### Store

```typescript
interface Store {
  get<T>(atom: Atom<T>): T;
  set<T>(atom: Atom<T>, value: T | ((prev: T) => T)): void;
  subscribe<T>(atom: Atom<T>, listener: (value: T) => void): () => void;
  getState(): State;
}
```

### EnhancedStore

```typescript
interface EnhancedStore extends Store {
  // Time travel methods
  captureSnapshot?(action?: string): void;
  undo?(): boolean;
  redo?(): boolean;
  canUndo?(): boolean;
  canRedo?(): boolean;
  jumpTo?(index: number): boolean;
  clearHistory?(): void;
  getHistory?(): Snapshot[];
  
  // DevTools methods
  connectDevTools?(): void;
}
```

### Snapshot

```typescript
interface Snapshot {
  id: string;
  timestamp: number;
  state: State;
  action?: string;
}
```

### Getter

```typescript
type Getter = <T>(atom: Atom<T>) => T;
```

### Setter

```typescript
type Setter = <T>(atom: Atom<T>, value: T | ((prev: T) => T)) => void;
```

### Plugin

```typescript
interface Plugin {
  (store: Store): void;
}
```
