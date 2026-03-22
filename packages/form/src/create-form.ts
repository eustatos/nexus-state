import { atom, Atom, Store } from '@nexus-state/core';
import type { ChangeEvent } from 'react';
import {
  FormOptions,
  FormValues,
  Form,
  Field,
  FieldArray,
  FieldState,
  ValidationMode,
  ReValidateMode,
} from './types';
import { createFormCore, FormCore } from './core';
import { createValidation, ValidationOptions } from './validation';
import { createSubmission, SubmissionOptions } from './submission';
import { getFieldArray, createFieldArray } from './field-array';
import {
  getFieldValue,
  setFieldValue,
  setFieldTouched,
  setFieldError,
  resetField,
} from './field';

/**
 * Create a form with modular architecture.
 */
export function createForm<TValues extends FormValues>(
  store: Store,
  options: FormOptions<TValues>
): Form<TValues> {
  // Extract core options
  const coreOptions = {
    initialValues: options.initialValues,
    defaultValidationMode: options.defaultValidationMode,
    defaultRevalidateMode: options.defaultRevalidateMode,
    showErrorsOnTouched: options.showErrorsOnTouched,
  };

  // Create core
  const core = createFormCore(store, coreOptions);

  // Validation options
  const validationOptions: ValidationOptions<TValues> = {
    schemaPlugin: options.schemaPlugin,
    schemaConfig: options.schemaConfig,
    schema: options.schema,
    schemaType: options.schemaType,
    validate: options.validate,
    validateOnChange: options.validateOnChange,
    validateOnBlur: options.validateOnBlur,
  };

  const validation = createValidation(core, validationOptions);

  // Submission options
  const submissionOptions: SubmissionOptions<TValues> = {
    onSubmit: options.onSubmit,
    validateBeforeSubmit: true,
    markTouchedOnSubmit: true,
  };

  const submission = createSubmission(core, validation, submissionOptions);

  // === Create computed atoms for form-level subscription ===

  // Computed atom of all values - triggers on ANY field change
  const valuesAtom = atom<TValues>((get) => {
    const values = {} as TValues;
    for (const [key, meta] of core.fields.entries()) {
      values[key] = get(meta.atom).value;
    }
    // Include field array values
    for (const [key, arrayMeta] of core.fieldArrays.entries()) {
      const fieldArrayApi = getFieldArray(store, arrayMeta);
      values[key] = fieldArrayApi.fields as any;
    }
    return values;
  }, 'form:values:computed');

  // Computed atom of form validity - triggers when any field error changes
  const isValidAtom = atom<boolean>((get) => {
    for (const [, meta] of core.fields.entries()) {
      const fieldState = get(meta.atom);
      if (fieldState.error !== null) {
        return false;
      }
    }
    // Also check extra errors
    const extraErrors = store.get(core.extraErrors);
    if (Object.keys(extraErrors).length > 0) {
      return false;
    }
    return true;
  }, 'form:isValid:computed');

  // Computed atom of form dirty state - triggers when any field dirty changes
  const isDirtyAtom = atom<boolean>((get) => {
    for (const [, meta] of core.fields.entries()) {
      if (get(meta.atom).dirty) {
        return true;
      }
    }
    return false;
  }, 'form:isDirty:computed');

  // Helper to get field API
  const field = <K extends keyof TValues>(name: K): Field<TValues[K]> => {
    const meta = core.fields.get(name);
    if (!meta) {
      throw new Error(`Field "${String(name)}" not found in form`);
    }

    const fieldState = store.get(meta.atom);

    return {
      value: fieldState.value,
      error: fieldState.error,
      touched: fieldState.touched,
      dirty: fieldState.dirty,

      setValue: (value: TValues[K]) => {
        setFieldValue(store, meta as any, value);
        // Trigger validation if needed
        if (options.validateOnChange) {
          const values = core.getValues();
          validation
            .validateField(name, value, values as TValues)
            .then((error) => {
              if (error) {
                setFieldError(store, meta, error);
              } else {
                setFieldError(store, meta, null);
              }
            });
        }
      },

      setTouched: (touched: boolean) => {
        setFieldTouched(store, meta, touched);
        if (touched && options.validateOnBlur) {
          const values = core.getValues();
          validation
            .validateField(name, fieldState.value, values as TValues)
            .then((error) => {
              if (error) {
                setFieldError(store, meta, error);
              } else {
                setFieldError(store, meta, null);
              }
            });
        }
      },

      setError: (error: string | null) => {
        setFieldError(store, meta, error);
      },

      reset: () => {
        resetField(store, meta);
      },

      inputProps: {
        name: name as string,
        value: fieldState.value,
        onChange: (valueOrEvent: TValues[K] | ChangeEvent<HTMLInputElement>) => {
          // Handle both direct value and event
          const value = typeof valueOrEvent === 'object' && 'target' in valueOrEvent
            ? (valueOrEvent as ChangeEvent<HTMLInputElement>).target.value
            : valueOrEvent;
          setFieldValue(store, meta as any, value as TValues[K]);
        },
        onBlur: () => {
          setFieldTouched(store, meta, true);
        },
      },

      // Checkbox/switch props
      switchProps: {
        name: name as string,
        checked: !!fieldState.value,
        onChange: (checked: boolean) => {
          setFieldValue(store, meta as any, checked as TValues[K]);
        },
      },

      // Checkbox props (with event)
      checkboxProps: {
        name: name as string,
        checked: !!fieldState.value,
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
          setFieldValue(store, meta as any, e.target.checked as TValues[K]);
        },
      },

      // Radio props
      radioProps: {
        name: name as string,
        value: fieldState.value,
        checked: true, // Radio button is always checked when its value matches the field value
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
          setFieldValue(store, meta as any, e.target.value as TValues[K]);
        },
      },

      // Select props
      selectProps: {
        name: name as string,
        value: fieldState.value,
        onChange: (e: ChangeEvent<HTMLSelectElement> | { target: { value: any } }) => {
          const value = e?.target?.value ?? e;
          setFieldValue(store, meta as any, value as TValues[K]);
        },
      },
    };
  };

  // Field array API
  const fieldArray = <K extends keyof TValues>(
    name: K,
    defaultItem: TValues[K] extends Array<infer U> ? U : never
  ): TValues[K] extends Array<infer U> ? FieldArray<U> : never => {
    // Check if already created
    let meta = core.fieldArrays.get(name);
    if (!meta) {
      const initialValue = options.initialValues?.[name];
      if (!Array.isArray(initialValue)) {
        throw new Error(`Field "${String(name)}" is not an array`);
      }
      meta = createFieldArray(
        store,
        String(name),
        initialValue as any[],
        defaultItem
      );
      core.fieldArrays.set(name, meta);
    }
    // meta is now guaranteed to be defined
    return getFieldArray(store, meta!) as any;
  };

  // Return form API
  return {
    // === Reactive getters ===
    get values() {
      return core.getValues();
    },
    get errors() {
      return core.getErrors();
    },
    get isValid() {
      return core.getIsValid();
    },
    get isDirty() {
      return core.getIsDirty();
    },
    get isSubmitting() {
      return submission.isSubmitting;
    },

    // === Atoms for granular subscription ===
    getFieldAtom: <K extends keyof TValues>(name: K) => {
      const meta = core.fields.get(name);
      if (!meta) {
        throw new Error(`Field "${String(name)}" not found in form`);
      }
      return meta.atom;
    },

    getFieldAtomValue: <K extends keyof TValues>(name: K) => {
      const meta = core.fields.get(name);
      if (!meta) {
        throw new Error(`Field "${String(name)}" not found in form`);
      }
      // Create a derived atom that returns only the value
      return atom<TValues[K]>((get) => get(meta.atom).value, `field:${String(name)}:value`);
    },

    getFieldAtomError: <K extends keyof TValues>(name: K) => {
      const meta = core.fields.get(name);
      if (!meta) {
        throw new Error(`Field "${String(name)}" not found in form`);
      }
      // Create a derived atom that returns the error
      return atom<string | null>((get) => get(meta.atom).error, `field:${String(name)}:error`);
    },

    // === Computed atoms for form-level subscription ===
    valuesAtom,
    isValidAtom,
    isDirtyAtom,

    // === Field management ===
    field,
    fieldArray,

    getFieldMeta: <K extends keyof TValues>(name: K) => {
      const meta = core.fields.get(name);
      if (!meta) {
        throw new Error(`Field "${String(name)}" not found in form`);
      }
      return meta;
    },

    // === Mutations ===
    setFieldValue: <K extends keyof TValues>(name: K, value: TValues[K]) => {
      core.setFieldValue(name, value);
    },

    setFieldError: <K extends keyof TValues>(name: K, error: string | null) => {
      core.setFieldError(name, error);
    },

    setFieldErrors: (errors: Partial<Record<keyof TValues, string | null>>) => {
      for (const [name, error] of Object.entries(errors)) {
        core.setFieldError(name as keyof TValues, error as string | null);
      }
    },

    setFieldTouched: <K extends keyof TValues>(name: K, touched: boolean) => {
      core.setFieldTouched(name, touched);
    },

    // === Actions ===
    reset: () => {
      core.reset();
      submission.resetSubmission();
    },

    submit: () => submission.submit(),
    validate: () => validation.validateAll(),
  };
}
