import React from "react";
import { useAtom } from "@nexus-state/react";
import { atom, createStore } from "@nexus-state/core";

const countAtom = atom(0);
const store = createStore();

export const App = () => {
  const count = useAtom(countAtom, store);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Nexus State React Demo</h1>
      <p>Count: {count}</p>
      <button onClick={() => store.set(countAtom, count + 1)}>Increment</button>
      <button
        onClick={() => store.set(countAtom, count - 1)}
        style={{ marginLeft: "10px" }}
      >
        Decrement
      </button>
      <button onClick={() => store.set(countAtom, 0)} style={{ marginLeft: "10px" }}>
        Reset
      </button>
    </div>
  );
};