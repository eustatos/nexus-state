import { atom, Store, Atom } from '@nexus-state/core';
import { AsyncValidationManager } from './async-validation';
import { ValidationTrigger } from './validation-trigger';
import {
  FieldState,
  FieldMeta,
  FieldOptions,
  FieldValidator,
  AsyncFieldValidator,
  AsyncValidator,
  AsyncValidatorWithConfig,
  ValidationMode,
  ReValidateMode,
} from './types';

/**
 * Create a field atom
 */
export function createField<TValue>(
  _store: Store,
  name: string,
  options: FieldOptions<TValue>
): FieldMeta<TValue> & {
  error: Atom<string | null>;
  isValid: Atom<boolean>;
  setValue: (value: TValue, formValues?: Record<string, unknown>) => void;
  setTouched: (touched: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  dispose: () => void;
  validateNow: (formValues?: Record<string, unknown>) => void;
} {
  // Default validation modes
  const validateOn: ValidationMode = options.validateOn ?? 'onBlur';
  const revalidateOn: ReValidateMode = options.revalidateOn ?? 'onChange';
  const showErrorsOnTouched = options.showErrorsOnTouched ?? true;

  const fieldAtom = atom<FieldState<TValue>>(
    {
      value: options.initialValue,
      touched: false,
      dirty: false,
      error: null,
      validating: false,
      asyncError: null,
      validated: false,
    },
    `field:${name}`
  );

  // Create validation trigger manager
  const validationTrigger = new ValidationTrigger({
    mode: validateOn,
    reValidateMode: revalidateOn,
    showErrorsOnTouched,
  });

  // Create async validation manager
  let asyncManager: AsyncValidationManager<TValue> | null = null;
  const asyncValidators = options.asyncValidators ?? [];
  if (asyncValidators.length > 0) {
    asyncManager = new AsyncValidationManager<TValue>(
      options.store ?? _store,
      fieldAtom,
      asyncValidators,
      options.debounce
    );
  }

  // Run sync validators
  const runSyncValidation = (
    value: TValue,
    formValues?: Record<string, unknown>
  ): string | null => {
    const validators = options.validators ?? [];
    for (const validator of validators) {
      const error = validator(value, formValues);
      if (error) {
        return error;
      }
    }
    return null;
  };

  const store = options.store ?? _store;

  // Internal validation function
  const validate = (value: TValue, formValues?: Record<string, unknown>): void => {
    // Run sync validation
    const syncError = runSyncValidation(value, formValues);

    // Update state
    store.set(fieldAtom, (prev) => ({
      ...prev,
      error: syncError,
      validated: true,
    }));

    // Update trigger error state
    validationTrigger.setHasError(!!syncError);

    // Run async validation if sync passed
    if (!syncError && asyncManager) {
      asyncManager.validate(value, formValues);
    } else if (asyncManager) {
      asyncManager.cancel();
    }
  };

  // Combined error (sync + async) with display logic
  const errorAtom = atom<string | null>((get) => {
    const state = get(fieldAtom);
    const error = state.error || state.asyncError;

    if (!error) {
      return null;
    }

    // Show error if showErrorsOnTouched is false OR field is touched
    if (showErrorsOnTouched) {
      return state.touched ? error : null;
    }

    return error;
  }, `field:${name}:error`);

  // Is valid (no sync or async errors, not validating)
  const isValidAtom = atom<boolean>((get) => {
    const state = get(fieldAtom);
    return !state.error && !state.asyncError && !state.validating;
  }, `field:${name}:isValid`);

  return {
    atom: fieldAtom,
    name,
    initialValue: options.initialValue,
    error: errorAtom,
    isValid: isValidAtom,

    setValue(value: TValue, formValues?: Record<string, unknown>) {
      const currentState = store.get(fieldAtom);

      // Update value
      store.set(fieldAtom, (prev) => ({
        ...prev,
        value,
        dirty: true,
      }));

      // Validate based on trigger
      if (validationTrigger.shouldValidateOnChange(currentState)) {
        validate(value, formValues);
      }
    },

    setTouched(touched: boolean, formValues?: Record<string, unknown>) {
      const currentState = store.get(fieldAtom);

      store.set(fieldAtom, (prev) => ({ ...prev, touched }));

      // Validate on blur if touched
      if (touched && validationTrigger.shouldValidateOnBlur(currentState)) {
        const value = store.get(fieldAtom).value;
        validate(value, formValues);
      }
    },

    setError(error: string | null) {
      store.set(fieldAtom, (prev) => ({ ...prev, error }));
    },

    validateNow(formValues?: Record<string, unknown>) {
      const value = store.get(fieldAtom).value;
      validate(value, formValues);
    },

    reset() {
      asyncManager?.cancel();
      validationTrigger.reset();
      store.set(fieldAtom, {
        value: options.initialValue,
        touched: false,
        dirty: false,
        error: null,
        validating: false,
        asyncError: null,
        validated: false,
      });
    },

    dispose() {
      asyncManager?.dispose();
    },
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
    dirty: value !== fieldMeta.initialValue,
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
    touched,
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
    error,
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
    error: null,
    validating: false,
    asyncError: null,
    validated: false,
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
