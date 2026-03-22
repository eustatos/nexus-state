import { useCallback, useRef, useEffect, useState } from 'react';
import { useStore, useAtomValue } from '@nexus-state/react';
import type { UseFieldReturn } from './types';
import type { ChangeEvent } from 'react';
import type { Form, Field } from '../types';

/**
 * Hook for field in form with full control
 * @param form - Form instance
 * @param name - Field name
 * @returns Field props, state, and helpers
 *
 * @example
 * ```tsx
 * const { field, fieldState, helpers } = useField(form, 'username');
 *
 * return (
 *   <div>
 *     <input {...field} />
 *     {fieldState.error && <span>{fieldState.error}</span>}
 *   </div>
 * );
 * ```
 */
export function useField<TFormValues extends Record<string, unknown>, K extends keyof TFormValues>(
  form: Form<TFormValues>,
  name: K
): UseFieldReturn<TFormValues[K]> {
  const store = useStore();
  const fieldName = String(name);
  
  // Get field atom for subscription - this is the key to granular reactivity
  const fieldAtom = form.getFieldAtom(name);
  
  // Get field API for mutations - keep stable reference
  const fieldApiRef = useRef<Field<TFormValues[K]>>(form.field(name));
  fieldApiRef.current = form.field(name);
  const fieldApi = fieldApiRef.current;

  // Subscribe to field state changes - only this field's atom
  const [forceUpdate, setForceUpdate] = useState(0);
  
  useEffect(() => {
    const unsubscribe = store.subscribe(fieldAtom, () => {
      setForceUpdate((prev: number) => prev + 1);
    });
    return unsubscribe;
  }, [store, fieldAtom]);

  // Get current field state from atom
  const state = useAtomValue(fieldAtom);

  // Stable handlers - use ref to avoid recreation
  const handlersRef = useRef({
    onChange: (e: ChangeEvent<any>) => {
      const value = e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value;
      fieldApi.setValue(value as TFormValues[K]);
    },
    onBlur: () => {
      fieldApi.setTouched(true);
    },
    setValue: (value: TFormValues[K]) => {
      fieldApi.setValue(value);
    },
    setTouched: (touched: boolean) => {
      fieldApi.setTouched(touched);
    },
    setError: (error: string | null) => {
      fieldApi.setError(error);
    },
  });

  // Field props for input binding - stable references
  const fieldProps = {
    name: fieldName,
    value: state.value,
    onChange: handlersRef.current.onChange,
    onBlur: handlersRef.current.onBlur,
  };

  // Field state
  const fieldState = {
    error: state.error,
    isDirty: state.dirty,
    isTouched: state.touched,
    isValidating: state.validating,
  };

  // Helpers - stable references
  const helpers = {
    setValue: handlersRef.current.setValue,
    setTouched: handlersRef.current.setTouched,
    setError: handlersRef.current.setError,
  };

  return {
    field: fieldProps,
    fieldState,
    helpers,
  };
}
