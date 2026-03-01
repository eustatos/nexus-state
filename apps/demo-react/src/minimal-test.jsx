import React from 'react';
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from '@nexus-state/react';

// Создаем атомы правильно
const countAtom = atom(0, 'count');
const doubleAtom = atom((get) => get(countAtom) * 2, 'double');

const store = createStore();

const MinimalTest = () => {
  const count = useAtom(countAtom, store);
  const double = useAtom(doubleAtom, store);
  
  return (
    <div>
      <h1>Minimal Test</h1>
      <p>Count: {count}</p>
      <p>Double: {double}</p>
      <button onClick={() => store.set(countAtom, count + 1)}>
        Increment
      </button>
    </div>
  );
};

export default MinimalTest;