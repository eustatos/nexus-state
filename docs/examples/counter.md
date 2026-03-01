# Counter Example

A simple counter example demonstrating basic usage of Nexus State.

## Core Implementation

```javascript
import { atom, createStore } from '@nexus-state/core';

const countAtom = atom(0);
const store = createStore();

// Get current value
console.log(store.get(countAtom)); // 0

// Increment
store.set(countAtom, (prev) => prev + 1);
console.log(store.get(countAtom)); // 1
```

## React Implementation

```jsx
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

## Vue Implementation

```vue
<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<script>
import { useAtom } from '@nexus-state/vue';

export default {
  setup() {
    const count = useAtom(countAtom);
    
    const increment = () => {
      count.value++;
    };
    
    return { count, increment };
  }
};
</script>
```

## Svelte Implementation

```svelte
<script>
  import { useAtom } from '@nexus-state/svelte';
  
  let count = useAtom(countAtom);
  
  function increment() {
    $count++;
  }
</script>

<p>Count: {$count}</p>
<button on:click={increment}>Increment</button>
```

## Async Implementation

```javascript
import { createAsyncOperation } from '@nexus-state/async';

// Create async operation for counter increment
const incrementAsync = createAsyncOperation(async (currentCount) => {
  // Simulate async work
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real app, this might be an API call
  const response = await fetch('/api/increment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count: currentCount })
  });
  
  if (!response.ok) {
    throw new Error('Failed to increment');
  }
  
  const result = await response.json();
  return result.newCount;
});

// Async counter function
const incrementCounterAsync = async () => {
  const currentCount = store.get(countAtom);
  
  try {
    const newCount = await incrementAsync.execute(currentCount);
    store.set(countAtom, newCount);
  } catch (error) {
    console.error('Failed to increment counter:', error.message);
  }
};
```

## Family Implementation

```javascript
import { createFamily } from '@nexus-state/family';

// Create counter as part of a family
const appFamily = createFamily({
  counter: 0,
  history: []
});

// Counter actions using family
const incrementFamily = () => {
  const currentCounter = appFamily.get('counter');
  const newCounter = currentCounter + 1;
  
  appFamily.set('counter', newCounter);
  appFamily.set('history', (prev) => [...prev, newCounter]);
};

const decrementFamily = () => {
  const currentCounter = appFamily.get('counter');
  const newCounter = currentCounter - 1;
  
  appFamily.set('counter', newCounter);
  appFamily.set('history', (prev) => [...prev, newCounter]);
};

const resetFamily = () => {
  appFamily.set('counter', 0);
  appFamily.set('history', []);
};
```

## Immer Implementation

```javascript
import { createImmerStore } from '@nexus-state/immer';

// Create counter store with Immer
const counterStore = createImmerStore({
  count: 0,
  history: []
});

// Counter actions using Immer
const incrementImmer = () => {
  counterStore.setState((draft) => {
    draft.count += 1;
    draft.history.push(draft.count);
  });
};

const decrementImmer = () => {
  counterStore.setState((draft) => {
    draft.count -= 1;
    draft.history.push(draft.count);
  });
};

const resetImmer = () => {
  counterStore.setState((draft) => {
    draft.count = 0;
    draft.history = [];
  });
};
```

## Middleware Implementation

```javascript
import { createMiddleware } from '@nexus-state/middleware';

// Create logging middleware for counter
const counterLogger = createMiddleware((action, next, store) => {
  console.log('Counter action:', action.type, action.payload);
  
  const before = store.get(countAtom);
  console.log('Count before:', before);
  
  const result = next(action);
  
  const after = store.get(countAtom);
  console.log('Count after:', after);
  
  return result;
});

// Apply middleware to store
store.use(counterLogger);

// Create validation middleware
const counterValidator = createMiddleware((action, next) => {
  if (action.type === 'SET_COUNT') {
    const { value } = action.payload;
    
    if (typeof value !== 'number') {
      throw new Error('Count must be a number');
    }
    
    if (value < 0) {
      throw new Error('Count cannot be negative');
    }
  }
  
  return next(action);
});

// Apply validation middleware
store.use(counterValidator);
```

## Persistence Implementation

```javascript
import { createPersist } from '@nexus-state/persist';

// Add persistence to counter
store.use(createPersist({
  key: 'counter-app',
  storage: localStorage,
  atoms: [countAtom]
}));

// Custom serialization for counter
const counterPersist = createPersist({
  key: 'counter-app-custom',
  storage: localStorage,
  atoms: [countAtom],
  serialize: (state) => {
    return JSON.stringify({
      ...state,
      // Add timestamp for when the state was saved
      savedAt: new Date().toISOString()
    });
  },
  deserialize: (str) => {
    const state = JSON.parse(str);
    console.log('Counter state loaded from:', state.savedAt);
    return state;
  }
});

// Apply custom persistence
store.use(counterPersist);
```