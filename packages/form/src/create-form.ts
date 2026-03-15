import { atom, Store } from '@nexus-state/core';
import {
  FormOptions,
  FormValues,
  Form,
  Field,
  FieldMeta,
  FormState,
  FormErrors,
  SchemaValidator,
  FieldArray,
  FieldArrayMeta,
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
  validateField,
} from './field';
import { createFieldArray, getFieldArray } from './field-array';
import { defaultSchemaRegistry } from './schema';

/**
 * Create a form
 */
export function createForm<TValues extends FormValues>(
  store: Store,
  options: FormOptions<TValues>
): Form<TValues> {
  // Form-level validation defaults
  const defaultValidationMode: ValidationMode =
    options.defaultValidationMode ?? 'onBlur';
  const defaultRevalidateMode: ReValidateMode =
    options.defaultRevalidateMode ?? 'onChange';
  const showErrorsOnTouched = options.showErrorsOnTouched ?? true;

  // Get schema from registry or options
  let schema: SchemaValidator<TValues> | undefined;

  // Priority 1: schemaType + schemaConfig (new way via registry)
  if (options.schemaType && options.schemaConfig !== undefined) {
    const registrySchema = defaultSchemaRegistry.create(
      options.schemaType,
      options.schemaConfig
    );
    if (registrySchema) {
      schema = registrySchema as SchemaValidator<TValues>;
    }

    if (!schema) {
      const availableTypes = defaultSchemaRegistry.getRegisteredTypes();
      throw new Error(
        `Schema type "${options.schemaType}" not registered. ` +
        `Available types: ${availableTypes.join(', ') || 'none'}`
      );
    }
  }
  // Priority 2: direct schema (backward compatibility)
  else if (options.schema) {
    schema = options.schema;
  }

  // Create field atoms for each initial value
  const fieldMetas: Map<keyof TValues, FieldMeta<any>> = new Map();

  const initialValues = options.initialValues ?? {} as TValues;

  for (const key in initialValues) {
    const fieldMeta = createField(store, key as string, {
      initialValue: initialValues[key],
      validateOn: defaultValidationMode,
      revalidateOn: defaultRevalidateMode,
      showErrorsOnTouched,
    });
    fieldMetas.set(key, fieldMeta);
  }

  // Field array metas
  const fieldArrayMetas: Map<keyof TValues, FieldArrayMeta<any>> = new Map();

  // Form state atom
  const formStateAtom = atom<
    Omit<FormState<TValues>, 'values' | 'errors' | 'touched' | 'dirty'>
  >(
    {
      isSubmitting: false,
      isValid: true,
      isDirty: false,
      submitCount: 0
    },
    'form:state'
  );

  // Get all values
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

  // Get all errors
  const getErrors = (): FormErrors<TValues> => {
    const errors: FormErrors<TValues> = {};
    for (const [key, meta] of fieldMetas.entries()) {
      const fieldState = store.get(meta.atom);
      if (fieldState.error) {
        errors[key] = fieldState.error;
      }
    }
    return errors;
  };

  // Check if form is valid
  const checkIsValid = (): boolean => {
    const errors = getErrors();
    return Object.keys(errors).length === 0;
  };

  // Check if form is dirty
  const checkIsDirty = (): boolean => {
    for (const meta of fieldMetas.values()) {
      const fieldState = store.get(meta.atom);
      if (fieldState.dirty) {
        return true;
      }
    }
    return false;
  };

  // Validate all fields
  const validateAll = async (): Promise<boolean> => {
    const values = getValues();

    // Schema validation takes precedence
    if (schema) {
      const errors = await schema.validate(values);

      // Apply schema errors to fields
      for (const key of Object.keys(errors)) {
        const meta = fieldMetas.get(key as keyof TValues);
        const error = errors[key as keyof typeof errors];
        if (meta && error) {
          setFieldError(store, meta, error);
        }
      }

      // Clear errors for fields without schema errors
      for (const [key, meta] of fieldMetas.entries()) {
        if (!errors[key as keyof TValues]) {
          setFieldError(store, meta, null);
        }
      }
    }
    // Fallback to form-level validation
    else if (options.validate) {
      const errors = options.validate(values);
      if (errors) {
        for (const key in errors) {
          const meta = fieldMetas.get(key as keyof TValues);
          if (meta && errors[key]) {
            setFieldError(store, meta, errors[key]!);
          }
        }
      }
    }

    const isValid = checkIsValid();

    const formState = store.get(formStateAtom);
    store.set(formStateAtom, {
      ...formState,
      isValid
    });

    return isValid;
  };

  // Submit handler
  const submit = async (): Promise<void> => {
    // Mark all fields as touched
    for (const meta of fieldMetas.values()) {
      setFieldTouched(store, meta, true);
    }

    // Validate
    const isValid = await validateAll();
    if (!isValid) {
      return;
    }

    // Set submitting state
    const formState = store.get(formStateAtom);
    store.set(formStateAtom, {
      ...formState,
      isSubmitting: true
    });

    try {
      const values = getValues();
      if (options.onSubmit) {
        await options.onSubmit(values);
      }

      // Update submit count
      store.set(formStateAtom, {
        ...formState,
        isSubmitting: false,
        submitCount: formState.submitCount + 1
      });
    } catch (error) {
      store.set(formStateAtom, {
        ...formState,
        isSubmitting: false
      });
      throw error;
    }
  };

  // Reset form
  const reset = (): void => {
    for (const meta of fieldMetas.values()) {
      resetField(store, meta);
    }

    store.set(formStateAtom, {
      isSubmitting: false,
      isValid: true,
      isDirty: false,
      submitCount: 0
    });
  };

  // Get field array API
  const fieldArray = <K extends keyof TValues>(
    name: K,
    defaultItem: TValues[K] extends Array<infer U> ? U : never
  ): TValues[K] extends Array<infer U> ? FieldArray<U> : never => {
    // Check if already created
    let meta = fieldArrayMetas.get(name);

    if (!meta) {
      // Get initial value
      const initialValue = options.initialValues?.[name];

      if (!Array.isArray(initialValue)) {
        throw new Error(`Field "${String(name)}" is not an array`);
      }

      // Create field array meta
      meta = createFieldArray(
        store,
        String(name),
        initialValue as any[],
        defaultItem
      );

      fieldArrayMetas.set(name, meta);
    }

    return getFieldArray(store, meta) as any;
  };

  // Get field API
  const field = <K extends keyof TValues>(name: K): Field<TValues[K]> => {
    const meta = fieldMetas.get(name);
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
        setFieldValue(store, meta as FieldMeta<TValues[K]>, value);

        if (options.validateOnChange && schema?.validateField) {
          const values = { ...getValues(), [name]: value };

          const validationPromise = schema.validateField(name, value, values as TValues);
          Promise.resolve(validationPromise).then((error) => {
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

        if (touched && options.validateOnBlur && schema?.validateField) {
          const values = getValues();

          const validationPromise = schema.validateField(name, fieldState.value, values);
          Promise.resolve(validationPromise).then((error) => {
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
          setFieldValue(store, meta as FieldMeta<TValues[K]>, value);
        },
        onBlur: () => {
          setFieldTouched(store, meta, true);
        }
      }
    };
  };

  // Return form API
  const formState = store.get(formStateAtom);

  return {
    get values() {
      return getValues();
    },
    get errors() {
      return getErrors();
    },
    get isValid() {
      return checkIsValid();
    },
    get isDirty() {
      return checkIsDirty();
    },
    get isSubmitting() {
      return store.get(formStateAtom).isSubmitting;
    },

    field,
    fieldArray,

    setFieldValue: (name, value) => {
      const meta = fieldMetas.get(name);
      if (meta) {
        setFieldValue(store, meta, value);
      }
    },

    setFieldError: (name, error) => {
      const meta = fieldMetas.get(name);
      if (meta) {
        setFieldError(store, meta, error);
      }
    },

    setFieldTouched: (name, touched) => {
      const meta = fieldMetas.get(name);
      if (meta) {
        setFieldTouched(store, meta, touched);
      }
    },

    reset,
    submit,
    validate: validateAll
  };
}
