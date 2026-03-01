import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { useStore, useAtomValue } from '@nexus-state/react';
import { createFieldArray, getFieldArray } from '../field-array';
import type { UseFieldArrayReturn } from './types';

/**
 * Hook for managing dynamic field arrays
 * @param name - Field array name
 * @param options - Options including default items
 * @returns Array fields and manipulation methods
 * 
 * @example
 * ```tsx
 * function TodoList() {
 *   const { fields, append, remove } = useFieldArray<TodoItem>('todos', {
 *     defaultValue: [],
 *   });
 * 
 *   return (
 *     <div>
 *       {fields.map((field, index) => (
 *         <div key={field.id}>
 *           <input value={field.text} />
 *           <button onClick={() => remove(index)}>Remove</button>
 *         </div>
 *       ))}
 *       <button onClick={() => append({ text: '' })}>Add</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFieldArray<TItem extends Record<string, unknown>>(
  name: string,
  options: { defaultValue?: TItem[] } = {}
): UseFieldArrayReturn<TItem> {
  const store = useStore();
  const fieldArrayMetaRef = useRef<ReturnType<typeof createFieldArray<TItem>> | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Create field array meta once
  if (!fieldArrayMetaRef.current) {
    fieldArrayMetaRef.current = createFieldArray<TItem>(
      store,
      name,
      options.defaultValue ?? [],
      {} as TItem
    );
  }

  const meta = fieldArrayMetaRef.current;
  const fieldArray = getFieldArray(store, meta);

  // Subscribe to field array changes - subscribe to first atom or use dummy subscription
  useEffect(() => {
    if (meta.itemAtoms.length > 0) {
      const unsubscribe = store.subscribe(meta.itemAtoms[0], () => {
        setForceUpdate((prev: number) => prev + 1);
      });
      return unsubscribe;
    }
    return undefined;
  }, [store, meta.itemAtoms]);

  // Get items
  const items = fieldArray.fields;

  // Add unique IDs to items for React keys
  const fields = useMemo(
    () => items.map((item: TItem, index: number) => ({ ...item, id: `${name}.${index}` })),
    [items, name]
  );

  // Array manipulation methods
  const append = useCallback((item: TItem) => {
    fieldArray.append(item);
    setForceUpdate((prev: number) => prev + 1);
  }, [fieldArray]);

  const prepend = useCallback((item: TItem) => {
    fieldArray.prepend(item);
    setForceUpdate((prev: number) => prev + 1);
  }, [fieldArray]);

  const remove = useCallback((index: number) => {
    fieldArray.remove(index);
    setForceUpdate((prev: number) => prev + 1);
  }, [fieldArray]);

  const insert = useCallback((index: number, item: TItem) => {
    fieldArray.insert(index, item);
    setForceUpdate((prev: number) => prev + 1);
  }, [fieldArray]);

  const swap = useCallback((indexA: number, indexB: number) => {
    fieldArray.swap(indexA, indexB);
    setForceUpdate((prev: number) => prev + 1);
  }, [fieldArray]);

  const move = useCallback((from: number, to: number) => {
    fieldArray.move(from, to);
    setForceUpdate((prev: number) => prev + 1);
  }, [fieldArray]);

  const update = useCallback((index: number, item: TItem) => {
    const newItems = items.map((existing: TItem, i: number) => (i === index ? item : existing));
    fieldArray.replace(newItems);
    setForceUpdate((prev: number) => prev + 1);
  }, [fieldArray, items]);

  const replace = useCallback((items: TItem[]) => {
    fieldArray.replace(items);
    setForceUpdate((prev: number) => prev + 1);
  }, [fieldArray]);

  return {
    fields,
    append,
    prepend,
    remove,
    insert,
    swap,
    move,
    update,
    replace,
  };
}
