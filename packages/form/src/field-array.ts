import { atom, Store } from '@nexus-state/core';
import type { ChangeEvent } from 'react';
import type {
  FieldArray,
  FieldArrayMeta,
  Field,
  FieldState,
  FieldMeta
} from './types';
import {
  createField,
  setFieldValue,
  setFieldTouched,
  setFieldError,
  resetField
} from './field';

/**
 * Generate a unique ID for array items
 */
function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Extract ID from item if it exists, otherwise return undefined
 */
function getItemId<TItem>(item: TItem): string | undefined {
  if (item && typeof item === 'object' && 'id' in item) {
    return (item as any).id;
  }
  return undefined;
}

/**
 * Create field array metadata
 */
export function createFieldArray<TItem>(
  store: Store,
  name: string,
  initialItems: TItem[],
  defaultItem: TItem
): FieldArrayMeta<TItem> {
  const itemAtoms = initialItems.map((item, index) => {
    const fieldMeta = createField(store, `${name}[${index}]`, {
      initialValue: item
    });
    return fieldMeta.atom;
  });

  // Generate stable IDs for initial items
  const itemIds = initialItems.map(item => {
    const existingId = getItemId(item);
    return existingId ?? generateId();
  });

  return {
    name,
    itemAtoms,
    itemIds,
    defaultItem,
    idCounter: itemIds.length
  };
}

/**
 * Get field array API
 */
export function getFieldArray<TItem>(
  store: Store,
  meta: FieldArrayMeta<TItem>
): FieldArray<TItem> {
  const getFields = (): TItem[] => {
    return meta.itemAtoms.map(atom => store.get(atom).value);
  };

  const getFieldMeta = (index: number): FieldMeta<TItem> | undefined => {
    const atom = meta.itemAtoms[index];
    if (!atom) return undefined;

    return {
      atom,
      name: `${meta.name}[${index}]`,
      initialValue: meta.defaultItem
    };
  };

  const field = (index: number): Field<TItem> | undefined => {
    const fieldMeta = getFieldMeta(index);
    if (!fieldMeta) return undefined;

    const fieldState = store.get(fieldMeta.atom);

    return {
      value: fieldState.value,
      error: fieldState.error,
      touched: fieldState.touched,
      dirty: fieldState.dirty,

      setValue: (value: TItem) => {
        setFieldValue(store, fieldMeta, value);
      },

      setTouched: (touched: boolean) => {
        setFieldTouched(store, fieldMeta, touched);
      },

      setError: (error: string | null) => {
        setFieldError(store, fieldMeta, error);
      },

      reset: () => {
        resetField(store, fieldMeta);
      },

      inputProps: {
        name: `${meta.name}[${index}]`,
        value: fieldState.value,
        onChange: (value: TItem) => {
          setFieldValue(store, fieldMeta, value);
        },
        onBlur: () => {
          setFieldTouched(store, fieldMeta, true);
        }
      },

      // Checkbox/switch props
      switchProps: {
        name: `${meta.name}[${index}]`,
        checked: !!fieldState.value,
        onChange: (checked: boolean) => {
          setFieldValue(store, fieldMeta, checked as TItem);
        }
      },

      // Checkbox props (with event)
      checkboxProps: {
        name: `${meta.name}[${index}]`,
        checked: !!fieldState.value,
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
          setFieldValue(store, fieldMeta, e.target.checked as TItem);
        }
      },

      // Radio props
      radioProps: {
        name: `${meta.name}[${index}]`,
        value: fieldState.value,
        checked: true,
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
          setFieldValue(store, fieldMeta, e.target.value as unknown as TItem);
        }
      },

      // Select props
      selectProps: {
        name: `${meta.name}[${index}]`,
        value: fieldState.value,
        onChange: (e: ChangeEvent<HTMLSelectElement> | { target: { value: any } }) => {
          const value = e?.target?.value ?? e;
          setFieldValue(store, fieldMeta, value as TItem);
        }
      }
    };
  };

  const append = (item: TItem): void => {
    const newAtom = createField(
      store,
      `${meta.name}[${meta.itemAtoms.length}]`,
      { initialValue: item }
    ).atom;

    meta.itemAtoms.push(newAtom);
    // Generate stable ID for new item
    const existingId = getItemId(item);
    meta.itemIds.push(existingId ?? generateId());
  };

  const prepend = (item: TItem): void => {
    const newAtom = createField(
      store,
      `${meta.name}[0]`,
      { initialValue: item }
    ).atom;

    meta.itemAtoms.unshift(newAtom);
    // Generate stable ID for new item
    const existingId = getItemId(item);
    meta.itemIds.unshift(existingId ?? generateId());
  };

  const insert = (index: number, item: TItem): void => {
    const newAtom = createField(
      store,
      `${meta.name}[${index}]`,
      { initialValue: item }
    ).atom;

    meta.itemAtoms.splice(index, 0, newAtom);
    // Generate stable ID for new item
    const existingId = getItemId(item);
    meta.itemIds.splice(index, 0, existingId ?? generateId());
  };

  const remove = (index: number): void => {
    if (index < 0 || index >= meta.itemAtoms.length) {
      return;
    }

    meta.itemAtoms.splice(index, 1);
    // Remove corresponding ID
    meta.itemIds.splice(index, 1);
  };

  const swap = (indexA: number, indexB: number): void => {
    if (
      indexA < 0 || indexA >= meta.itemAtoms.length ||
      indexB < 0 || indexB >= meta.itemAtoms.length
    ) {
      return;
    }

    // Swap atoms
    const tempAtom = meta.itemAtoms[indexA];
    meta.itemAtoms[indexA] = meta.itemAtoms[indexB];
    meta.itemAtoms[indexB] = tempAtom;
    
    // Swap IDs to keep them with their atoms
    const tempId = meta.itemIds[indexA];
    meta.itemIds[indexA] = meta.itemIds[indexB];
    meta.itemIds[indexB] = tempId;
  };

  const move = (from: number, to: number): void => {
    if (
      from < 0 || from >= meta.itemAtoms.length ||
      to < 0 || to >= meta.itemAtoms.length
    ) {
      return;
    }

    // Move atom
    const [atom] = meta.itemAtoms.splice(from, 1);
    meta.itemAtoms.splice(to, 0, atom);
    
    // Move ID to keep it with the atom
    const [id] = meta.itemIds.splice(from, 1);
    meta.itemIds.splice(to, 0, id);
  };

  const replace = (items: TItem[]): void => {
    // Clear existing
    meta.itemAtoms.length = 0;
    meta.itemIds.length = 0;

    // Add new items with new IDs
    items.forEach((item, index) => {
      const newAtom = createField(
        store,
        `${meta.name}[${index}]`,
        { initialValue: item }
      ).atom;
      
      const existingId = getItemId(item);
      meta.itemIds.push(existingId ?? generateId());

      meta.itemAtoms.push(newAtom);
    });
  };

  const clear = (): void => {
    meta.itemAtoms.length = 0;
  };

  return {
    get fields() {
      return getFields();
    },
    get length() {
      return meta.itemAtoms.length;
    },

    // Error tracking
    get errors() {
      return meta.itemAtoms.map(atom => {
        const state = store.get(atom);
        return state.error;
      });
    },

    getError: (index: number): string | null => {
      const fieldMeta = getFieldMeta(index);
      if (!fieldMeta) return null;
      const state = store.get(fieldMeta.atom);
      return state.error;
    },

    isValid: (index?: number): boolean => {
      if (index !== undefined) {
        const fieldMeta = getFieldMeta(index);
        if (!fieldMeta) return true;
        const state = store.get(fieldMeta.atom);
        return state.error === null;
      }
      // Check all items
      return meta.itemAtoms.every(atom => store.get(atom).error === null);
    },

    // Alias for isValid (lowercase for convenience)
    get isvalid() {
      return meta.itemAtoms.every(atom => store.get(atom).error === null);
    },

    field,
    append,
    prepend,
    insert,
    remove,
    swap,
    move,
    replace,
    clear,

    // Internal meta for useFieldInArray
    _meta: meta
  };
}

/**
 * Update field names after array mutation
 */
function updateFieldNames<TItem>(_meta: FieldArrayMeta<TItem>): void {
  // Field names are used for debugging/devtools
  // The actual atoms don't need renaming
}
