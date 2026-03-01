import { Store } from '@nexus-state/core';
import { FieldMeta, FieldValidator, AsyncFieldValidator, FormErrors, FormValues } from './types';
import { setFieldError } from './field';

/**
 * Required field validator
 */
export function required<TValue>(
  value: TValue
): string | null {
  if (value === null || value === undefined || value === '') {
    return 'Required';
  }
  if (typeof value === 'string' && value.trim() === '') {
    return 'Required';
  }
  return null;
}

/**
 * Email validator
 */
export function email(value: string): string | null {
  if (!value) {
    return null;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Invalid email address';
  }
  return null;
}

/**
 * Min length validator
 */
export function minLength(min: number) {
  return (value: string): string | null => {
    if (!value) {
      return null;
    }
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  };
}

/**
 * Max length validator
 */
export function maxLength(max: number) {
  return (value: string): string | null => {
    if (!value) {
      return null;
    }
    if (value.length > max) {
      return `Must be at most ${max} characters`;
    }
    return null;
  };
}

/**
 * Min value validator (for numbers)
 */
export function minValue(min: number) {
  return (value: number): string | null => {
    if (value === null || value === undefined) {
      return null;
    }
    if (value < min) {
      return `Must be at least ${min}`;
    }
    return null;
  };
}

/**
 * Max value validator (for numbers)
 */
export function maxValue(max: number) {
  return (value: number): string | null => {
    if (value === null || value === undefined) {
      return null;
    }
    if (value > max) {
      return `Must be at most ${max}`;
    }
    return null;
  };
}

/**
 * Pattern validator
 */
export function pattern(regex: RegExp, message: string = 'Invalid format') {
  return (value: string): string | null => {
    if (!value) {
      return null;
    }
    if (!regex.test(value)) {
      return message;
    }
    return null;
  };
}

/**
 * Compose multiple validators
 */
export function composeValidators<TValue>(
  ...validators: Array<FieldValidator<TValue>>
): FieldValidator<TValue> {
  return (value: TValue, allValues: FormValues): string | null => {
    for (const validator of validators) {
      const error = validator(value, allValues);
      if (error) {
        return error;
      }
    }
    return null;
  };
}

/**
 * Create async validator with debounce
 */
export function debounceAsyncValidator<TValue>(
  validator: AsyncFieldValidator<TValue>,
  delay: number = 300
): AsyncFieldValidator<TValue> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return async (value: TValue, allValues: FormValues): Promise<string | null> => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        const error = await validator(value, allValues);
        resolve(error ?? null);
      }, delay);
    });
  };
}

/**
 * Get form values as plain object
 */
export function getFormValues<TValues extends FormValues>(
  fieldMetas: Map<keyof TValues, FieldMeta<any>>,
  store: Store
): TValues {
  const values = {} as TValues;
  for (const [key, meta] of fieldMetas.entries()) {
    values[key] = store.get(meta.atom).value;
  }
  return values;
}

/**
 * Get form errors as plain object
 */
export function getFormErrors<TValues extends FormValues>(
  fieldMetas: Map<keyof TValues, FieldMeta<any>>,
  store: Store
): FormErrors<TValues> {
  const errors: FormErrors<TValues> = {};
  for (const [key, meta] of fieldMetas.entries()) {
    const fieldState = store.get(meta.atom);
    if (fieldState.error) {
      errors[key] = fieldState.error;
    }
  }
  return errors;
}

/**
 * Check if all fields are touched
 */
export function areAllFieldsTouched<TValues extends FormValues>(
  fieldMetas: Map<keyof TValues, FieldMeta<any>>,
  store: Store
): boolean {
  for (const meta of fieldMetas.values()) {
    const fieldState = store.get(meta.atom);
    if (!fieldState.touched) {
      return false;
    }
  }
  return true;
}

/**
 * Check if any field is dirty
 */
export function isAnyFieldDirty<TValues extends FormValues>(
  fieldMetas: Map<keyof TValues, FieldMeta<any>>,
  store: Store
): boolean {
  for (const meta of fieldMetas.values()) {
    const fieldState = store.get(meta.atom);
    if (fieldState.dirty) {
      return true;
    }
  }
  return false;
}
