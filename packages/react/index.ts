// React adapter for nexus-state
import { Atom, Store, createStore } from '@nexus-state/core';
import { useEffect, useMemo, useState } from 'react';

/**
 * Hook to use an atom in a React component.
 * @template T - The type of the atom's value
 * @param {Atom<T>} atom - The atom to use
 * @param {Store} [store] - The store to use (defaults to a new store)
 * @returns {T} The current value of the atom
 * @example
 * function Counter() {
 *   const [count, setCount] = useAtom(countAtom);
 *   
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={() => setCount(count + 1)}>Increment</button>
 *     </div>
 *   );
 * }
 */
export function useAtom<T>(atom: Atom<T>, store: Store = useMemo(() => createStore(), [])): T {
  const [value, setValue] = useState(() => store.get(atom));

  useEffect(() => {
    const unsubscribe = store.subscribe(atom, () => {
      setValue(store.get(atom));
    });

    // Check if the value has changed immediately after subscription
    setValue(store.get(atom));

    return unsubscribe;
  }, [atom, store]);

  return value;
}