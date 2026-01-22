<script>
let count = 0;

function increment() {
  count += 1;
}
</script>

<main>
<h1>Hello, Svelte!</h1>
<p>Count: {count}</p>
<button on:click={increment}>Increment</button>
</main>

<style>
main {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 2rem;
}
</style>