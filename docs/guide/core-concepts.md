# Core Concepts

Nexus State is built around a few core concepts that make it powerful and flexible.

## Atoms

Atoms are the basic units of state in Nexus State. They hold a single value and can be updated and subscribed to.

```javascript
import { atom } from '@nexus-state/core';

// Create an atom with an initial value
const countAtom = atom(0);

// Create a computed atom
const doubleCountAtom = atom((get) => get(countAtom) * 2);
```

## Store

A store holds atoms and provides methods to interact with them.

```javascript
import { createStore } from '@nexus-state/core';

const store = createStore();

// Get atom value
const value = store.get(atom);

// Set atom value
store.set(atom, newValue);

// Subscribe to atom changes
const unsubscribe = store.subscribe(atom, (value) => {
  console.log('Value changed:', value);
});
```

## Adapters

Adapters provide integration with different frameworks like React, Vue, and Svelte.

### React

```javascript
import { useAtom } from '@nexus-state/react';

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### Vue

```javascript
import { useAtom } from '@nexus-state/vue';

export default {
  setup() {
    const count = useAtom(countAtom);
    
    return { count };
  }
};
```

### Svelte

```javascript
import { useAtom } from '@nexus-state/svelte';

let count = useAtom(countAtom);
```

## Plugins

Plugins extend the functionality of stores.

```javascript
import { createStore } from '@nexus-state/core';
import { persist } from '@nexus-state/persist';

const store = createStore([
  persist(countAtom, { key: 'count', storage: localStorage })
]);
```