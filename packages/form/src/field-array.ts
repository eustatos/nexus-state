import { atom, Store } from '@nexus-state/core';
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

  return {
    name,
    itemAtoms,
    defaultItem
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
        value: fieldState.value,
        onChange: (value: TItem) => {
          setFieldValue(store, fieldMeta, value);
        },
        onBlur: () => {
          setFieldTouched(store, fieldMeta, true);
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
  };

  const prepend = (item: TItem): void => {
    const newAtom = createField(
      store,
      `${meta.name}[0]`,
      { initialValue: item }
    ).atom;

    meta.itemAtoms.unshift(newAtom);

    // Update field names for shifted items
    updateFieldNames(meta);
  };

  const insert = (index: number, item: TItem): void => {
    const newAtom = createField(
      store,
      `${meta.name}[${index}]`,
      { initialValue: item }
    ).atom;

    meta.itemAtoms.splice(index, 0, newAtom);

    // Update field names for shifted items
    updateFieldNames(meta);
  };

  const remove = (index: number): void => {
    if (index < 0 || index >= meta.itemAtoms.length) {
      return;
    }

    meta.itemAtoms.splice(index, 1);

    // Update field names for shifted items
    updateFieldNames(meta);
  };

  const swap = (indexA: number, indexB: number): void => {
    if (
      indexA < 0 || indexA >= meta.itemAtoms.length ||
      indexB < 0 || indexB >= meta.itemAtoms.length
    ) {
      return;
    }

    const temp = meta.itemAtoms[indexA];
    meta.itemAtoms[indexA] = meta.itemAtoms[indexB];
    meta.itemAtoms[indexB] = temp;
  };

  const move = (from: number, to: number): void => {
    if (
      from < 0 || from >= meta.itemAtoms.length ||
      to < 0 || to >= meta.itemAtoms.length
    ) {
      return;
    }

    const [item] = meta.itemAtoms.splice(from, 1);
    meta.itemAtoms.splice(to, 0, item);
  };

  const replace = (items: TItem[]): void => {
    // Clear existing
    meta.itemAtoms.length = 0;

    // Add new items
    items.forEach((item, index) => {
      const newAtom = createField(
        store,
        `${meta.name}[${index}]`,
        { initialValue: item }
      ).atom;

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
