<script>
  import { atom } from '@nexus-state/core';
  import { useAtom } from '@nexus-state/svelte';
  import { writable } from 'svelte/store';

  const countAtom = atom(0);
  const count = useAtom(countAtom);
  
  function increment() {
    count.set($count + 1);
  }
</script>

<main>
  <h1>Hello, Svelte!</h1>
  <p>Count: {$count}</p>
  <button on:click={increment}>Increment</button>
</main>

<style>
  main {
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 2rem;
  }
</style>