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