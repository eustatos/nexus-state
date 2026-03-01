/* eslint-disable @typescript-eslint/no-var-requires, no-console */
const { atom, createStore } = require("./packages/core/dist/cjs/index.js");
const { devTools } = require("./packages/devtools/dist/cjs/src/index.js");

console.log("Testing store with devtools...");

try {
  // Создаем простой атом
  const countAtom = atom(0, "counter");
  console.log("Atom created:", countAtom);

  // Создаем store с devtools
  const store = createStore([
    devTools({
      name: "Test Demo",
      trace: true,
      maxAge: 50,
      showAtomNames: true,
    }),
  ]);
  console.log("Store with devtools created");

  // Пробуем получить значение
  const value = store.get(countAtom);
  console.log("Value from store:", value);

  // Пробуем установить значение
  store.set(countAtom, 5);
  console.log("Value after set:", store.get(countAtom));

  // Создаем вычисляемый атом
  const doubleAtom = atom((get) => get(countAtom) * 2, "double");
  console.log("Double value:", store.get(doubleAtom));
} catch (error) {
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);
}
