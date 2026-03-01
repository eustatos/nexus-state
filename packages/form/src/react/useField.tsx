import { useCallback, useRef, useEffect, useState } from 'react';
import { useStore, useAtomValue } from '@nexus-state/react';
import { createField } from '../field';
import type { FieldOptions } from '../types';
import type { UseFieldReturn } from './types';
import type { ChangeEvent } from 'react';

/**
 * Hook for standalone field with full control
 * @param name - Field name
 * @param options - Field options including initial value and validators
 * @returns Field props, state, and helpers
 * 
 * @example
 * ```tsx
 * const { field, fieldState, helpers } = useField('username', {
 *   initialValue: '',
 *   validators: [required, minLength(3)],
 *   validateOn: 'onBlur',
 * });
 * 
 * return (
 *   <div>
 *     <input {...field} />
 *     {fieldState.error && <span>{fieldState.error}</span>}
 *   </div>
 * );
 * ```
 */
export function useField<TValue>(
  name: string,
  options: FieldOptions<TValue>
): UseFieldReturn<TValue> {
  const store = useStore();
  const fieldRef = useRef<ReturnType<typeof createField<TValue>> | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Create field instance once
  if (!fieldRef.current) {
    fieldRef.current = createField<TValue>(store, name, options);
  }

  const field = fieldRef.current;

  // Subscribe to field state changes
  useEffect(() => {
    const unsubscribe = store.subscribe(field.atom, () => {
      setForceUpdate((prev: number) => prev + 1);
    });
    return unsubscribe;
  }, [store, field.atom]);

  // Get field state
  const state = useAtomValue(field.atom);
  const error = useAtomValue(field.error);

  // Field props for input binding
  const fieldProps = {
    name,
    value: state.value,
    onChange: useCallback(
      (e: ChangeEvent<any>) => {
        const value = e.target.type === 'checkbox'
          ? e.target.checked
          : e.target.value;
        field.setValue(value as TValue);
      },
      [field]
    ),
    onBlur: useCallback(() => {
      field.setTouched(true);
    }, [field]),
  };

  // Field state
  const fieldState = {
    error,
    isDirty: state.dirty,
    isTouched: state.touched,
    isValidating: state.validating,
  };

  // Helpers
  const helpers = {
    setValue: useCallback((value: TValue) => {
      field.setValue(value);
    }, [field]),

    setTouched: useCallback((touched: boolean) => {
      field.setTouched(touched);
    }, [field]),

    setError: useCallback((error: string | null) => {
      field.setError(error);
    }, [field]),
  };

  return {
    field: fieldProps,
    fieldState,
    helpers,
  };
}
