import type { FieldOptions, ValidationMode, ReValidateMode } from '../types';
import type { ChangeEvent, FormEvent } from 'react';

/**
 * Options for useForm hook
 */
export interface UseFormOptions<TFormValues extends Record<string, unknown>> {
  /** Default form values */
  defaultValues?: Partial<TFormValues>;
  
  /** When to run validation first time */
  mode?: ValidationMode;
  
  /** When to revalidate after first error */
  reValidateMode?: ReValidateMode;
  
  /** Show errors only after field is touched */
  showErrorsOnTouched?: boolean;
}

/**
 * Form state returned from useForm
 */
export interface FormState<TFormValues extends Record<string, unknown>> {
  /** Whether form has been modified */
  isDirty: boolean;
  
  /** Whether form is valid (no errors) */
  isValid: boolean;
  
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  
  /** Whether form has been submitted */
  isSubmitted: boolean;
  
  /** Field errors */
  errors: Partial<Record<keyof TFormValues, string | null>>;
  
  /** Touched fields */
  touchedFields: Partial<Record<keyof TFormValues, boolean>>;
}

/**
 * Return type for useForm hook
 */
export interface UseFormReturn<TFormValues extends Record<string, unknown>> {
  /** Register a field with the form */
  register: <TFieldName extends keyof TFormValues>(
    name: TFieldName,
    options?: Omit<FieldOptions<TFormValues[TFieldName]>, 'initialValue'>
  ) => {
    /** Field name */
    name: string;
    /** Field value */
    value: TFormValues[TFieldName];
    /** Change handler */
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    /** Blur handler */
    onBlur: () => void;
  };

  /** Form state */
  formState: FormState<TFormValues>;

  /** Submit handler factory */
  handleSubmit: <TResult>(
    onSubmit: (values: TFormValues) => Promise<TResult> | TResult
  ) => (e?: FormEvent) => Promise<void>;

  /** Reset form to initial values */
  reset: (values?: Partial<TFormValues>) => void;

  /** Set field value */
  setValue: <TFieldName extends keyof TFormValues>(
    name: TFieldName,
    value: TFormValues[TFieldName]
  ) => void;

  /** Get field value */
  getValue: <TFieldName extends keyof TFormValues>(
    name: TFieldName
  ) => TFormValues[TFieldName] | undefined;

  /** Set field error */
  setError: <TFieldName extends keyof TFormValues>(
    name: TFieldName,
    error: string | null
  ) => void;

  /** Clear field errors */
  clearErrors: (name?: keyof TFormValues) => void;

  /** Trigger validation */
  trigger: (name?: keyof TFormValues) => Promise<boolean>;
}

/**
 * Return type for useField hook
 */
export interface UseFieldReturn<TValue> {
  /** Field props for input binding */
  field: {
    /** Field name */
    name: string;
    /** Field value */
    value: TValue;
    /** Change handler */
    onChange: (e: ChangeEvent<any>) => void;
    /** Blur handler */
    onBlur: () => void;
  };

  /** Field state */
  fieldState: {
    /** Error message */
    error: string | null;
    /** Whether field has been modified */
    isDirty: boolean;
    /** Whether field has been touched */
    isTouched: boolean;
    /** Whether field is currently validating */
    isValidating: boolean;
  };

  /** Field helpers */
  helpers: {
    /** Set field value */
    setValue: (value: TValue) => void;
    /** Set touched state */
    setTouched: (touched: boolean) => void;
    /** Set error message */
    setError: (error: string | null) => void;
  };
}

/**
 * Field item with stable ID - used for React keys
 * For primitives: { id, value }
 * For objects: TItem & { id: string }
 */
export type FieldItem<TItem> = TItem extends string | number | boolean | null | undefined
  ? { id: string; value: TItem }
  : TItem extends Record<string, unknown>
    ? TItem & { id: string }
    : { id: string } & TItem;

/**
 * Return type for useFieldArray hook
 */
export interface UseFieldArrayReturn<TItem> {
  /** Array fields with unique IDs 
   * For primitives: { id, value }[]
   * For objects: (TItem & { id: string })[]
   */
  fields: FieldItem<TItem>[];

  /** Append item to end */
  append: (item: TItem) => void;

  /** Prepend item to start */
  prepend: (item: TItem) => void;

  /** Remove item at index */
  remove: (index: number) => void;

  /** Insert item at index */
  insert: (index: number, item: TItem) => void;

  /** Swap two items */
  swap: (indexA: number, indexB: number) => void;

  /** Move item from one index to another */
  move: (from: number, to: number) => void;

  /** Update item at index */
  update: (index: number, item: TItem) => void;

  /** Replace entire array */
  replace: (items: TItem[]) => void;
}

/**
 * Return type for useFieldInArray hook
 */
export interface UseFieldInArrayReturn<TValue> {
  /** Field value */
  value: TValue;

  /** Field name */
  name: string;

  /** Change handler */
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;

  /** Blur handler */
  onBlur: () => void;

  /** Set field value */
  setValue: (value: TValue) => void;

  /** Field state */
  fieldState: {
    /** Error message */
    error: string | null;
    /** Whether field has been modified */
    isDirty: boolean;
    /** Whether field has been touched */
    isTouched: boolean;
    /** Whether field is currently validating */
    isValidating: boolean;
  };
}

/**
 * Context type for form context
 */
export interface FormContextType<TFormValues extends Record<string, unknown>> {
  form: UseFormReturn<TFormValues> | null;
}
