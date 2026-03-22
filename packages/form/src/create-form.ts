import { Store } from '@nexus-state/core';
import {
  FormOptions,
  FormValues,
  Form,
  Field,
  FieldArray,
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
        value: fieldState.value,
        onChange: (value: TValues[K]) => {
          setFieldValue(store, meta as any, value);
        },
        onBlur: () => {
          setFieldTouched(store, meta, true);
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

    field,
    fieldArray,

    setFieldValue: <K extends keyof TValues>(name: K, value: TValues[K]) => {
      core.setFieldValue(name, value);
    },

    setFieldError: <K extends keyof TValues>(name: K, error: string | null) => {
      core.setFieldError(name, error);
    },

    setFieldTouched: <K extends keyof TValues>(name: K, touched: boolean) => {
      core.setFieldTouched(name, touched);
    },

    reset: () => {
      core.reset();
      submission.resetSubmission();
    },

    submit: () => submission.submit(),
    validate: () => validation.validateAll(),
  };
}
