# Core API

## atom(initialValue, name?)

Creates an atom with an initial value.

```javascript
const countAtom = atom(0);

// With optional name for DevTools
const namedCountAtom = atom(0, 'count');
```

## atom(getterFn, name?)

Creates a computed atom based on other atoms.

```javascript
const doubleCountAtom = atom((get) => get(countAtom) * 2);

// With optional name for DevTools
const namedDoubleCountAtom = atom((get) => get(countAtom) * 2, 'doubleCount');
```

## atom(initialValue, writeFn, name?)

Creates a writable atom with custom write behavior.

```javascript
const writableCountAtom = atom(0, (get, set, value) => {
  set(countAtom, value);
});

// With optional name for DevTools
const namedWritableCountAtom = atom(0, (get, set, value) => {
  set(countAtom, value);
}, 'writableCount');
```

## createStore(plugins)

Creates a store to hold atoms.

```javascript
const store = createStore();

// With plugins
const store = createStore([plugin1, plugin2]);
```

## store.get(atom)

Gets the current value of an atom.

```javascript
const value = store.get(atom);
```

## store.set(atom, newValue | updater)

Sets the value of an atom.

```javascript
store.set(atom, 5);
store.set(atom, (prev) => prev + 1);
```

## store.subscribe(atom, listener)

Subscribes to changes in an atom.

```javascript
const unsubscribe = store.subscribe(atom, (value) => {
  console.log(value);
});
```