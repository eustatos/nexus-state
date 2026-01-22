import React, { useState } from "react";
import { useAtom } from "@nexus-state/react";
import { atom } from "@nexus-state/core";

const countAtom = atom(0);

export const App = () => {
  const [count, setCount] = useAtom(countAtom);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Nexus State React Demo</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button
        onClick={() => setCount(count - 1)}
        style={{ marginLeft: "10px" }}
      >
        Decrement
      </button>
      <button onClick={() => setCount(0)} style={{ marginLeft: "10px" }}>
        Reset
      </button>
    </div>
  );
};
