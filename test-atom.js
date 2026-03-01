/* eslint-disable @typescript-eslint/no-var-requires, no-console */
const { atom, createStore } = require("./packages/core/dist/cjs/index.js");

console.log("Testing atom creation...");

try {
  // Создаем простой атом
  const countAtom = atom(0, "counter");
  console.log("Atom created:", countAtom);
  console.log("Atom type:", countAtom.type);
  console.log("Atom read function:", typeof countAtom.read);

  // Создаем store
  const store = createStore();
  console.log("Store created");

  // Пробуем получить значение
  const value = store.get(countAtom);
  console.log("Value from store:", value);

  // Создаем вычисляемый атом
  const doubleAtom = atom((get) => get(countAtom) * 2, "double");
  console.log("Computed atom created:", doubleAtom);
  console.log("Computed atom type:", doubleAtom.type);

  // Пробуем получить значение вычисляемого атома
  const doubleValue = store.get(doubleAtom);
  console.log("Double value:", doubleValue);
} catch (error) {
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);
}
