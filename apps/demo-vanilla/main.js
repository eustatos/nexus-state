import { atom, createStore } from "@nexus-state/core";

// Create atoms
const countAtom = atom(0);

// Create store
const store = createStore();

// Get DOM elements
const countElement = document.getElementById("count");
const incrementButton = document.getElementById("increment");
const decrementButton = document.getElementById("decrement");
const resetButton = document.getElementById("reset");

// Update count display
function updateCount() {
  countElement.textContent = store.get(countAtom);
}

// Subscribe to count changes
store.subscribe(countAtom, updateCount);

// Initialize display
updateCount();

// Event handlers
incrementButton.addEventListener("click", () => {
  store.set(countAtom, (prev) => prev + 1);
});

decrementButton.addEventListener("click", () => {
  store.set(countAtom, (prev) => prev - 1);
});

resetButton.addEventListener("click", () => {
  store.set(countAtom, 0);
});
