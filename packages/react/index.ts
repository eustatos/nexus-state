// React adapter for nexus-state
import { Atom, Store, createStore } from '@nexus-state/core';
import { useEffect, useMemo, useState } from 'react';

// Хук для использования атома в React
export function useAtom<T>(atom: Atom<T>, store: Store = useMemo(() => createStore(), [])): T {
  const [value, setValue] = useState(() => store.get(atom));

  useEffect(() => {
    const unsubscribe = store.subscribe(atom, () => {
      setValue(store.get(atom));
    });

    // Проверим, не изменилось ли значение сразу после подписки
    setValue(store.get(atom));

    return unsubscribe;
  }, [atom, store]);

  return value;
}