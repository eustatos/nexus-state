import { atom, Store } from '@nexus-state/core';
import {
  FieldState,
  FieldMeta,
  FieldOptions,
  FieldValidator,
  AsyncFieldValidator
} from './types';

/**
 * Create a field atom
 */
export function createField<TValue>(
  _store: Store,
  name: string,
  options: FieldOptions<TValue>
): FieldMeta<TValue> {
  const fieldAtom = atom<FieldState<TValue>>(
    {
      value: options.initialValue,
      touched: false,
      dirty: false,
      error: null
    },
    `field:${name}`
  );

  return {
    atom: fieldAtom,
    name,
    initialValue: options.initialValue
  };
}

/**
 * Get field value
 */
export function getFieldValue<TValue>(
  store: Store,
  fieldMeta: FieldMeta<TValue>
): TValue {
  return store.get(fieldMeta.atom).value;
}

/**
 * Set field value
 */
export function setFieldValue<TValue>(
  store: Store,
  fieldMeta: FieldMeta<TValue>,
  value: TValue
): void {
  const currentState = store.get(fieldMeta.atom);
  store.set(fieldMeta.atom, {
    ...currentState,
    value,
    dirty: value !== fieldMeta.initialValue
  });
}

/**
 * Set field touched
 */
export function setFieldTouched<TValue>(
  store: Store,
  fieldMeta: FieldMeta<TValue>,
  touched: boolean
): void {
  const currentState = store.get(fieldMeta.atom);
  store.set(fieldMeta.atom, {
    ...currentState,
    touched
  });
}

/**
 * Set field error
 */
export function setFieldError<TValue>(
  store: Store,
  fieldMeta: FieldMeta<TValue>,
  error: string | null
): void {
  const currentState = store.get(fieldMeta.atom);
  store.set(fieldMeta.atom, {
    ...currentState,
    error
  });
}

/**
 * Reset field to initial value
 */
export function resetField<TValue>(
  store: Store,
  fieldMeta: FieldMeta<TValue>
): void {
  store.set(fieldMeta.atom, {
    value: fieldMeta.initialValue,
    touched: false,
    dirty: false,
    error: null
  });
}

/**
 * Validate a field
 */
export async function validateField<TValue>(
  store: Store,
  fieldMeta: FieldMeta<TValue>,
  validator: FieldValidator<TValue> | undefined,
  asyncValidator: AsyncFieldValidator<TValue> | undefined,
  allValues: Record<string, any>
): Promise<string | null> {
  const value = getFieldValue(store, fieldMeta);

  // Sync validation
  if (validator) {
    const error = validator(value, allValues);
    if (error) {
      setFieldError(store, fieldMeta, error);
      return error;
    }
  }

  // Async validation
  if (asyncValidator) {
    const error = await asyncValidator(value, allValues);
    if (error) {
      setFieldError(store, fieldMeta, error);
      return error;
    }
  }

  // No errors
  setFieldError(store, fieldMeta, null);
  return null;
}
