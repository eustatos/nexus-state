import { useMemo, useCallback } from 'react';
import { useAtomValue } from '@nexus-state/react';
import type { FieldArray } from '../types';
import type { UseFieldInArrayReturn } from './types';
import type { ChangeEvent } from 'react';
import type { Atom } from '@nexus-state/core';

/**
 * Helper type to get keys of specific value type
 */
type TKeyOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Internal interface to access field array meta
 */
interface FieldArrayWithMeta<TItem> extends FieldArray<TItem> {
  _meta?: {
    name: string;
    itemAtoms: Array<Atom<any>>;
  };
}

/**
 * Hook for subscribing to individual field within array item
 *
 * @param array - FieldArray instance
 * @param index - Index of item in array
 * @param key - Key of field within item (for objects) or undefined for primitives
 * @returns Field props and state
 *
 * @example
 * ```tsx
 * // For objects
 * function AddressField({ array, index }) {
 *   const street = useFieldInArray(array, index, 'street');
 *   const city = useFieldInArray(array, index, 'city');
 *
 *   return (
 *     <div>
 *       <input {...street} />
 *       <input {...city} />
 *     </div>
 *   );
 * }
 *
 * // For primitives
 * function TagsField({ array, index }) {
 *   const tag = useFieldInArray(array, index);
 *   return <input {...tag} />;
 * }
 * ```
 */
export function useFieldInArray<
  TItem,
  TKey extends TKeyOfType<TItem, string | number | boolean>
>(
  array: FieldArray<TItem>,
  index: number,
  key?: TKey
): UseFieldInArrayReturn<TKey extends TKeyOfType<TItem, infer V> ? V : TItem> {
  // Get the atom for this specific field to subscribe to changes
  const arrayWithMeta = array as unknown as FieldArrayWithMeta<TItem>;
  const atom = arrayWithMeta._meta?.itemAtoms?.[index];

  // Subscribe to the specific atom for reactivity
  const currentFieldState = atom ? useAtomValue(atom) : null;
  const fieldValue = currentFieldState?.value ?? (array.fields[index] as TItem);

  if (!fieldValue && !atom) {
    throw new Error(`Field at index ${index} not found in array`);
  }

  // Get value (primitive or property of object) - computed directly for reactivity
  const value = key === undefined
    ? fieldValue as unknown as TKey extends TKeyOfType<TItem, infer V> ? V : TItem
    : (fieldValue as any)[key] as any;

  // Get array name from meta
  const arrayName = arrayWithMeta._meta?.name ?? '';

  // Create field name
  const name = useMemo(() => {
    const baseName = `${arrayName}[${index}]`;
    return key !== undefined ? `${baseName}.${String(key)}` : baseName;
  }, [arrayName, index, key]);

  // Create stable onChange handler
  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const newValue = e.target.value;

      // Use field.setValue if available to update atom directly
      const field = array.field(index);
      if (field) {
        if (key === undefined) {
          // Primitive: replace entire item
          field.setValue(newValue as unknown as TItem);
        } else {
          // Object: update specific property
          const currentItem = fieldValue as Record<string, any>;
          field.setValue({
            ...currentItem,
            [key]: newValue,
          } as TItem);
        }
      } else {
        // Fallback to array.replace() if field not available
        const newItems = [...array.fields];
        newItems[index] = key === undefined
          ? newValue as unknown as TItem
          : {
              ...(array.fields[index] as Record<string, any>),
              [key]: newValue,
            } as TItem;
        array.replace(newItems);
      }
    },
    [array, index, key, fieldValue, arrayName]
  );

  // Create stable onBlur handler (no-op for now, as FieldArray doesn't track touched)
  const onBlur = useCallback(() => {
    // FieldArray doesn't track touched state yet
  }, []);

  // Create setValue handler
  const setValue = useCallback(
    (newValue: any) => {
      // Use field.setValue if available to update atom directly
      const field = array.field(index);
      if (field) {
        if (key === undefined) {
          field.setValue(newValue as TItem);
        } else {
          const currentItem = fieldValue as Record<string, any>;
          field.setValue({
            ...currentItem,
            [key]: newValue,
          } as TItem);
        }
      } else {
        // Fallback to array.replace() if field not available
        const newItems = [...array.fields];
        newItems[index] = key === undefined
          ? newValue as TItem
          : {
              ...(array.fields[index] as Record<string, any>),
              [key]: newValue,
            } as TItem;
        array.replace(newItems);
      }
    },
    [array, index, key, fieldValue, arrayName]
  );

  // Get field state (simplified for now)
  const fieldStateMemo = useMemo(() => ({
    error: null,
    isDirty: false,
    isTouched: false,
    isValidating: false,
  }), []);

  return {
    value,
    name,
    onChange,
    onBlur,
    setValue,
    fieldState: fieldStateMemo,
  };
}
