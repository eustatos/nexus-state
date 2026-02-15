import { Atom, Store, createStore, Getter, Setter } from "@nexus-state/core";
import { useEffect, useMemo, useState } from "react";

/**
 * Hook to use an atom in a React component.
 * @template T - The type of the atom's value
 * @param {Atom<T>} atom - The atom to use
 * @param {Store} [store] - The store to use (defaults to a new store)
 * @returns {[T, (value: T | ((prev: T) => T)) => void]} A tuple of [value, setter]
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
export function useAtom<T>(atom: Atom<T>, store?: Store): [T, (value: T | ((prev: T) => T)) => void] {
  // Если store не передан, создаем новый store с помощью useMemo
  const resolvedStore = useMemo(() => store || createStore(), [store]);

  const [value, setValue] = useState(() => resolvedStore.get(atom));

  useEffect(() => {
    const unsubscribe = resolvedStore.subscribe(atom, () => {
      setValue(resolvedStore.get(atom));
    });

    // Check if the value has changed immediately after subscription
    setValue(resolvedStore.get(atom));

    return unsubscribe;
  }, [atom, resolvedStore]);

  // Create a setter function that uses the store's set method
  const setter = useMemo(() => {
    return (update: T | ((prev: T) => T)) => {
      resolvedStore.set(atom, update);
    };
  }, [resolvedStore, atom]);

  return [value, setter];
}
