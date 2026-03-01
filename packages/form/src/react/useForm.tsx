import { useCallback, useRef, useState, useEffect } from 'react';
import { useStore, useAtomValue } from '@nexus-state/react';
import { createField } from '../field';
import type { FieldOptions, ValidationMode, ReValidateMode } from '../types';
import type { UseFormOptions, UseFormReturn } from './types';
import type { ChangeEvent, FormEvent } from 'react';

/**
 * Hook for form management with validation and submission
 * @param options - Form options including default values and validation settings
 * @returns Form methods and state
 * 
 * @example
 * ```tsx
 * const { register, handleSubmit, formState } = useForm({
 *   defaultValues: { name: '', email: '' },
 *   mode: 'onBlur',
 * });
 * ```
 */
export function useForm<TFormValues extends Record<string, unknown> = Record<string, unknown>>(
  options: UseFormOptions<TFormValues> = {}
): UseFormReturn<TFormValues> {
  const store = useStore();
  const fieldsRef = useRef<Map<string, ReturnType<typeof createField<any>>>>(new Map());
  const [forceUpdate, setForceUpdate] = useState(0);

  // Default validation modes
  const defaultValidationMode: ValidationMode = options.mode ?? 'onBlur';
  const defaultRevalidateMode: ReValidateMode = options.reValidateMode ?? 'onChange';
  const showErrorsOnTouched = options.showErrorsOnTouched ?? true;

  // Track form state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof TFormValues, string | null>>>({});
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof TFormValues, boolean>>>({});

  // Get all field values
  const getValues = useCallback((): TFormValues => {
    const values = {} as TFormValues;
    fieldsRef.current.forEach((field, name) => {
      values[name as keyof TFormValues] = store.get(field.atom).value;
    });
    return values;
  }, [store]);

  // Check if form is valid
  const checkIsValid = useCallback((): boolean => {
    let isValid = true;
    fieldsRef.current.forEach((field) => {
      const state = store.get(field.atom);
      if (state.error || state.asyncError) {
        isValid = false;
      }
    });
    return isValid;
  }, [store]);

  // Register field
  const register = useCallback(
    <TFieldName extends keyof TFormValues>(
      name: TFieldName,
      fieldOptions?: Omit<FieldOptions<TFormValues[TFieldName]>, 'initialValue'>
    ) => {
      // Get or create field
      if (!fieldsRef.current.has(name as string)) {
        const defaultValue = options.defaultValues?.[name] as TFormValues[TFieldName];
        const field = createField<TFormValues[TFieldName]>(store, name as string, {
          initialValue: defaultValue,
          validateOn: fieldOptions?.validateOn ?? defaultValidationMode,
          revalidateOn: fieldOptions?.revalidateOn ?? defaultRevalidateMode,
          showErrorsOnTouched: fieldOptions?.showErrorsOnTouched ?? showErrorsOnTouched,
          validators: fieldOptions?.validators,
          asyncValidators: fieldOptions?.asyncValidators,
          debounce: fieldOptions?.debounce,
        });

        fieldsRef.current.set(name as string, field);

        // Subscribe to field state changes
        store.subscribe(field.atom, (state: { error: string | null; asyncError: string | null; touched: boolean }) => {
          setErrors((prev: Partial<Record<keyof TFormValues, string | null>>) => ({ ...prev, [name]: state.error || state.asyncError }));
          setTouchedFields((prev: Partial<Record<keyof TFormValues, boolean>>) => ({ ...prev, [name]: state.touched }));
          setForceUpdate((prev: number) => prev + 1);
        });
      }

      const field = fieldsRef.current.get(name as string)!;
      const fieldValue = store.get(field.atom).value;

      return {
        name: name as string,
        value: fieldValue as TFormValues[TFieldName],
        onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
          const value = e.target.type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : e.target.value;

          field.setValue(value as TFormValues[TFieldName]);
        },
        onBlur: () => {
          field.setTouched(true);
        },
      };
    },
    [store, options.defaultValues, defaultValidationMode, defaultRevalidateMode, showErrorsOnTouched]
  );

  // Form submission
  const handleSubmit = useCallback(
    <TResult,>(
      onSubmit: (values: TFormValues) => Promise<TResult> | TResult
    ) => {
      return async (e?: FormEvent) => {
        e?.preventDefault();

        // Mark all fields as touched
        setIsSubmitted(true);

        // Validate all fields
        fieldsRef.current.forEach((field) => {
          field.validateNow();
        });

        // Check if valid
        const isValid = checkIsValid();
        if (!isValid) {
          return;
        }

        const values = getValues();
        await onSubmit(values);
      };
    },
    [checkIsValid, getValues]
  );

  // Reset form
  const reset = useCallback(
    (values?: Partial<TFormValues>) => {
      fieldsRef.current.forEach((field) => {
        field.reset();
      });
      setIsSubmitted(false);
      setErrors({});
      setTouchedFields({});
      setForceUpdate((prev: number) => prev + 1);

      if (values) {
        // Set new values
        Object.entries(values).forEach(([key, value]) => {
          const field = fieldsRef.current.get(key);
          if (field) {
            field.setValue(value as TFormValues[keyof TFormValues]);
          }
        });
      }
    },
    []
  );

  // Set field value
  const setValue = useCallback(
    <TFieldName extends keyof TFormValues>(
      name: TFieldName,
      value: TFormValues[TFieldName]
    ) => {
      const field = fieldsRef.current.get(name as string);
      if (field) {
        field.setValue(value);
      }
    },
    []
  );

  // Get field value
  const getValue = useCallback(
    <TFieldName extends keyof TFormValues>(
      name: TFieldName
    ): TFormValues[TFieldName] | undefined => {
      const field = fieldsRef.current.get(name as string);
      if (field) {
        return store.get(field.atom).value;
      }
      return undefined;
    },
    [store]
  );

  // Set field error
  const setError = useCallback(
    <TFieldName extends keyof TFormValues>(
      name: TFieldName,
      error: string | null
    ) => {
      setErrors((prev: Partial<Record<keyof TFormValues, string | null>>) => ({ ...prev, [name]: error }));
    },
    []
  );

  // Clear errors
  const clearErrors = useCallback(
    (name?: keyof TFormValues) => {
      if (name) {
        setErrors((prev: Partial<Record<keyof TFormValues, string | null>>) => ({ ...prev, [name]: null }));
      } else {
        setErrors({});
      }
    },
    []
  );

  // Trigger validation
  const trigger = useCallback(
    async (name?: keyof TFormValues): Promise<boolean> => {
      if (name) {
        const field = fieldsRef.current.get(name as string);
        if (field) {
          field.validateNow();
          const state = store.get(field.atom);
          return !state.error && !state.asyncError;
        }
        return true;
      } else {
        fieldsRef.current.forEach((field) => {
          field.validateNow();
        });
        return checkIsValid();
      }
    },
    [checkIsValid, store]
  );

  // Compute form state
  const isValid = checkIsValid();
  const isSubmitting = false; // Simplified - no submitting state in this version
  const isDirty = Object.values(touchedFields).some(Boolean);

  return {
    register,
    formState: {
      isDirty,
      isValid,
      isSubmitting,
      isSubmitted,
      errors,
      touchedFields,
    },
    handleSubmit,
    reset,
    setValue,
    getValue,
    setError,
    clearErrors,
    trigger,
  };
}
