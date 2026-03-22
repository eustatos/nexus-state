import { useCallback, useRef, useEffect, useState } from 'react';
import { useStore, useAtomValue } from '@nexus-state/react';
import { createFieldArray, getFieldArray } from '../field-array';
import type { UseFieldArrayReturn, FieldItem } from './types';

/**
 * Hook for managing dynamic field arrays
 * @param name - Field array name
 * @param options - Options including default items
 * @returns Array fields with stable IDs and manipulation methods
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
 *       {fields.map((field) => (
 *         <div key={field.id}>
 *           <input value={field.text} />
 *           <button onClick={() => remove(field.id)}>Remove</button>
 *         </div>
 *       ))}
 *       <button onClick={() => append({ text: '' })}>Add</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFieldArray<TItem>(
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

  // Subscribe to all item atoms for changes
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];
    for (const atom of meta.itemAtoms) {
      unsubscribers.push(store.subscribe(atom, () => {
        setForceUpdate((prev: number) => prev + 1);
      }));
    }
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [store, meta.itemAtoms]);

  // Get items and their stable IDs
  const items = fieldArray.fields;
  const itemIds = meta.itemIds;

  // Build fields with stable IDs
  // For primitives: { id, value }
  // For objects with existing id: use existing id
  // For objects without id: use generated stable id
  const fields = items.map((item, index) => {
    const id = itemIds[index];

    // Check if item is a primitive
    if (item === null || typeof item !== 'object') {
      return { id, value: item } as FieldItem<TItem>;
    }

    // For objects, spread the item and ensure id is present
    return { ...item, id } as FieldItem<TItem>;
  });

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
    // Get current items and IDs
    const currentItems = fieldArray.fields;
    const currentIds = meta.itemIds;
    
    // Preserve the existing ID when updating
    const existingId = currentIds[index];
    const itemWithId = existingId 
      ? { ...item, id: existingId } as TItem
      : item;
    
    const newItems = currentItems.map((existing: TItem, i: number) => 
      i === index ? itemWithId : existing
    );
    fieldArray.replace(newItems);
    setForceUpdate((prev: number) => prev + 1);
  }, [fieldArray, meta.itemIds]);

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
