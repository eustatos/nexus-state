<script>
  import { atom } from '@nexus-state/core';
  import { useAtom } from '@nexus-state/svelte';

  const countAtom = atom(0);
  const count = useAtom(countAtom);
</script>

<main>
  <h1>Hello, Svelte!</h1>
  <p>Count: {$count}</p>
  <button on:click={() => count.set(count.get() + 1)}>Increment</button>
</main>

<style>
  main {
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 2rem;
  }
</style>