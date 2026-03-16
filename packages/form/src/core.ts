import { atom, Store, Atom } from '@nexus-state/core';
import {
  FormValues,
  FormErrors,
  FieldMeta,
  FieldArrayMeta,
  FormState,
  ValidationMode,
  ReValidateMode,
} from './types';
import {
  createField,
  getFieldValue,
  setFieldValue,
  setFieldTouched,
  setFieldError,
  resetField,
} from './field';
import { createFieldArray, getFieldArray } from './field-array';

export interface FormCoreOptions<TValues extends FormValues> {
  initialValues?: TValues;
  defaultValidationMode?: ValidationMode;
  defaultRevalidateMode?: ReValidateMode;
  showErrorsOnTouched?: boolean;
}

export interface FormCore<TValues extends FormValues> {
  fields: Map<keyof TValues, FieldMeta<any>>;
  fieldArrays: Map<keyof TValues, FieldArrayMeta<any>>;
  state: Atom<
    Omit<FormState<TValues>, 'values' | 'errors' | 'touched' | 'dirty'>
  >;
  extraErrors: Atom<Record<string, string>>;
  store: Store;

  getValues(): TValues;
  getErrors(): FormErrors<TValues>;
  getIsValid(): boolean;
  getIsDirty(): boolean;
  getIsSubmitting(): boolean;
  getSubmitCount(): number;

  setFieldValue<K extends keyof TValues>(name: K, value: TValues[K]): void;
  setFieldTouched<K extends keyof TValues>(name: K, touched: boolean): void;
  setFieldError<K extends keyof TValues>(name: K, error: string | null): void;
  reset(): void;

  subscribe(listener: () => void): () => void;
}

/**
 * Create a form core with basic field and state management.
 * This core does NOT include validation or submission logic.
 */
export function createFormCore<TValues extends FormValues>(
  store: Store,
  options: FormCoreOptions<TValues> = {}
): FormCore<TValues> {
  const {
    initialValues = {} as TValues,
    defaultValidationMode = 'onBlur',
    defaultRevalidateMode = 'onChange',
    showErrorsOnTouched = true,
  } = options;

  // Field metas
  const fieldMetas: Map<keyof TValues, FieldMeta<any>> = new Map();
  const fieldArrayMetas: Map<keyof TValues, FieldArrayMeta<any>> = new Map();

  // Create fields for each initial value
  for (const key in initialValues) {
    const fieldMeta = createField(store, key as string, {
      initialValue: initialValues[key],
      validateOn: defaultValidationMode,
      revalidateOn: defaultRevalidateMode,
      showErrorsOnTouched,
    });
    fieldMetas.set(key, fieldMeta);
  }

  // Form state atom (excluding derived values)
  const formStateAtom = atom<
    Omit<FormState<TValues>, 'values' | 'errors' | 'touched' | 'dirty'>
  >(
    {
      isSubmitting: false,
      isValid: true,
      isDirty: false,
      submitCount: 0,
    },
    'form:state'
  );

  // Extra errors for nested paths without field metas
  const extraErrorsAtom = atom<Record<string, string>>({}, 'form:extraErrors');

  // Helper to get all values
  const getValues = (): TValues => {
    const values = {} as TValues;
    for (const [key, meta] of fieldMetas.entries()) {
      values[key] = getFieldValue(store, meta);
    }
    // Include field array values
    for (const [key, arrayMeta] of fieldArrayMetas.entries()) {
      const fieldArrayApi = getFieldArray(store, arrayMeta);
      values[key] = fieldArrayApi.fields as any;
    }
    return values;
  };

  // Helper to get all errors
  const getErrors = (): FormErrors<TValues> => {
    const errors: Record<string, string> = {};
    for (const [key, meta] of fieldMetas.entries()) {
      const fieldState = store.get(meta.atom);
      if (fieldState.error) {
        errors[key as string] = fieldState.error;
      }
    }
    const extraErrors = store.get(extraErrorsAtom);
    for (const [key, error] of Object.entries(extraErrors)) {
      errors[key] = error;
    }
    return errors as FormErrors<TValues>;
  };

  // Check if form is valid
  const getIsValid = (): boolean => {
    const errors = getErrors();
    return Object.keys(errors).length === 0;
  };

  // Check if form is dirty
  const getIsDirty = (): boolean => {
    for (const meta of fieldMetas.values()) {
      const fieldState = store.get(meta.atom);
      if (fieldState.dirty) {
        return true;
      }
    }
    return false;
  };

  // Subscribe to form state changes
  const subscribe = (listener: () => void): (() => void) => {
    // We'll subscribe to all field atoms and the form state atom
    const unsubscribers: Array<() => void> = [];
    for (const meta of fieldMetas.values()) {
      unsubscribers.push(store.subscribe(meta.atom, listener));
    }
    for (const meta of fieldArrayMetas.values()) {
      // field array atoms are not directly stored, but each item atom is a field
      // For simplicity, we can subscribe to each item atom.
      // However, we'll skip for now to keep it simple.
    }
    unsubscribers.push(store.subscribe(formStateAtom, listener));
    unsubscribers.push(store.subscribe(extraErrorsAtom, listener));
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  };

  // Public API
  return {
    fields: fieldMetas,
    fieldArrays: fieldArrayMetas,
    state: formStateAtom,
    extraErrors: extraErrorsAtom,
    store,

    getValues,
    getErrors,
    getIsValid,
    getIsDirty,
    getIsSubmitting: () => store.get(formStateAtom).isSubmitting,
    getSubmitCount: () => store.get(formStateAtom).submitCount,

    setFieldValue: <K extends keyof TValues>(name: K, value: TValues[K]) => {
      const meta = fieldMetas.get(name);
      if (meta) {
        setFieldValue(store, meta, value);
      }
    },

    setFieldTouched: <K extends keyof TValues>(name: K, touched: boolean) => {
      const meta = fieldMetas.get(name);
      if (meta) {
        setFieldTouched(store, meta, touched);
      }
    },

    setFieldError: <K extends keyof TValues>(name: K, error: string | null) => {
      const meta = fieldMetas.get(name);
      if (meta) {
        setFieldError(store, meta, error);
      }
    },

    reset: () => {
      for (const meta of fieldMetas.values()) {
        resetField(store, meta);
      }
      store.set(extraErrorsAtom, {});
      store.set(formStateAtom, {
        isSubmitting: false,
        isValid: true,
        isDirty: false,
        submitCount: 0,
      });
    },

    subscribe,
  };
}
