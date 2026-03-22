import { Atom, Store } from '@nexus-state/core';
import type { SchemaPlugin, SchemaValidator } from './schema';
import type { ChangeEvent } from 'react';

/**
 * Validation trigger mode
 */
export type ValidationMode = 'onChange' | 'onBlur' | 'onSubmit';

/**
 * Re-validation trigger mode
 */
export type ReValidateMode = 'onChange' | 'onBlur' | 'onSubmit';

/**
 * Validation configuration
 */
export interface ValidationConfig {
  /**
   * When to run validation first time
   */
  mode?: ValidationMode;

  /**
   * When to revalidate after first error
   */
  reValidateMode?: ReValidateMode;

  /**
   * Show errors only after field is touched
   */
  showErrorsOnTouched?: boolean;
}

/**
 * Field state
 */
export interface FieldState<TValue = any> {
  value: TValue;
  touched: boolean;
  dirty: boolean;
  error: string | null;
  validating: boolean;
  asyncError: string | null;
  validated: boolean;
}

/**
 * Field metadata
 */
export interface FieldMeta<TValue = any> {
  atom: Atom<FieldState<TValue>>;
  name: string;
  initialValue: TValue;
}

/**
 * Form values type (generic object)
 */
export type FormValues = Record<string, any>;

/**
 * Form errors type
 */
export type FormErrors<TValues extends FormValues = FormValues> = {
  [K in keyof TValues]?: string;
};

/**
 * Field validator function
 */
export type FieldValidator<TValue = any> = (
  value: TValue,
  allValues: FormValues
) => string | null | undefined;

/**
 * Async field validator
 */
export type AsyncFieldValidator<TValue = any> = (
  value: TValue,
  allValues: FormValues
) => Promise<string | null | undefined>;

/**
 * Synchronous validator function (simplified)
 */
export type ValidatorFn<TValue = any> = (
  value: TValue,
  formValues?: Record<string, unknown>
) => string | null;

/**
 * Asynchronous validator function
 */
export type AsyncValidator<TValue = any> = (
  value: TValue,
  formValues?: Record<string, unknown>
) => Promise<string | null>;

/**
 * Async validator options
 */
export interface AsyncValidatorOptions {
  /**
   * Debounce delay in ms (default: 300)
   */
  debounce?: number;

  /**
   * Retry attempts on failure (default: 0)
   */
  retry?: number;

  /**
   * Cache validation results (default: true)
   */
  cache?: boolean;

  /**
   * Validation timeout in ms (default: 5000)
   */
  timeout?: number;
}

/**
 * Async validator with options
 */
export interface AsyncValidatorWithConfig<TValue = any> {
  validate: AsyncValidator<TValue>;
  options?: AsyncValidatorOptions;
}

/**
 * Form validator function
 */
export type FormValidator<TValues extends FormValues = FormValues> = (
  values: TValues
) => FormErrors<TValues> | null;

/**
 * Zod schema type helper
 */
export type ZodSchema<TValues = any> = {
  parse: (value: unknown) => TValues | Promise<TValues>;
  parseAsync: (value: unknown) => Promise<TValues>;
  safeParse: (value: unknown) => {
    success: boolean;
    data?: TValues;
    error?: any;
  };
  safeParseAsync: (
    value: unknown
  ) => Promise<{ success: boolean; data?: TValues; error?: any }>;
};

/**
 * Yup schema type helper
 */
export type YupSchema<TValues = any> = {
  validate: (value: unknown) => Promise<TValues>;
  validateSync: (value: unknown) => TValues;
  validateAt: (path: string, value: unknown) => Promise<any>;
  validateSyncAt: (path: string, value: unknown) => any;
};

/**
 * Field options
 */
export interface FieldOptions<TValue = any> {
  initialValue: TValue;
  validate?: FieldValidator<TValue>;
  validateAsync?: AsyncFieldValidator<TValue>;
  validators?: ValidatorFn<TValue>[];
  asyncValidators?: Array<
    AsyncValidator<TValue> | AsyncValidatorWithConfig<TValue>
  >;

  /**
   * Validation trigger (defaults to form-level or 'onBlur')
   */
  validateOn?: ValidationMode;

  /**
   * Revalidation trigger (defaults to 'onChange')
   */
  revalidateOn?: ReValidateMode;

  /**
   * Show errors only when touched
   */
  showErrorsOnTouched?: boolean;

  /**
   * Debounce delay for async validation (field-level override)
   */
  debounce?: number;

  /**
   * Store instance (optional, uses default store if not provided)
   */
  store?: Store;
}

/**
 * Form options
 */
export interface FormOptions<TValues extends FormValues = FormValues> {
  initialValues?: TValues;
  validate?: FormValidator<TValues>;

  /**
   * Schema plugin instance (recommended API)
   * 
   * @example
   * ```typescript
   * import { zodPlugin } from '@nexus-state/form-schema-zod';
   * 
   * const form = createForm(store, {
   *   schemaPlugin: zodPlugin,
   *   schemaConfig: myZodSchema,
   *   initialValues: { ... },
   * });
   * ```
   */
  schemaPlugin?: SchemaPlugin<unknown, TValues>;

  /**
   * Schema configuration (used with schemaPlugin or schemaType)
   */
  schemaConfig?: unknown;

  /**
   * Direct schema validator instance (backward compatibility)
   * @deprecated Use schemaPlugin + schemaConfig instead
   */
  schema?: SchemaValidator<TValues>;

  /**
   * Schema type for registry-based resolution
   * @deprecated Use schemaPlugin + schemaConfig for explicit imports
   * @example 'zod', 'yup', 'ajv', 'dsl'
   */
  schemaType?: string;

  onSubmit?: (values: TValues) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;

  /**
   * Default validation mode for all fields
   */
  defaultValidationMode?: ValidationMode;

  /**
   * Default revalidation mode
   */
  defaultRevalidateMode?: ReValidateMode;

  /**
   * Global error display setting
   */
  showErrorsOnTouched?: boolean;

  /**
   * Store instance (optional, uses default store if not provided)
   */
  store?: Store;
}

/**
 * Form state
 */
export interface FormState<TValues extends FormValues = FormValues> {
  values: TValues;
  errors: FormErrors<TValues>;
  touched: { [K in keyof TValues]?: boolean };
  dirty: { [K in keyof TValues]?: boolean };
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  submitCount: number;
}

/**
 * Field API
 */
export interface Field<TValue = any> {
  value: TValue;
  error: string | null;
  touched: boolean;
  dirty: boolean;

  setValue: (value: TValue) => void;
  setTouched: (touched: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Helper for input binding
  inputProps: {
    name: string;
    value: TValue;
    onChange: (value: TValue) => void;
    onBlur: () => void;
  };

  // Helper for checkbox/switch binding
  switchProps: {
    name: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  };

  // Helper for checkbox binding (same as switchProps but with event)
  checkboxProps: {
    name: string;
    checked: boolean;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  };

  // Helper for radio group binding
  radioProps: {
    name: string;
    value: TValue;
    checked: boolean;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  };

  // Helper for select binding
  selectProps: {
    name: string;
    value: TValue;
    onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  };
}

/**
 * Form API
 */
export interface Form<TValues extends FormValues = FormValues> {
  // === Reactive getters (read-only state) ===
  /** Current form values */
  values: TValues;
  /** Current form errors */
  errors: FormErrors<TValues>;
  /** Whether form is valid */
  isValid: boolean;
  /** Whether form has been modified */
  isDirty: boolean;
  /** Whether form is submitting */
  isSubmitting: boolean;

  // === Atoms for granular subscription ===
  /**
   * Get atom for field state subscription
   * @param name - Field name
   * @returns Atom with full field state (value, error, touched, dirty, etc.)
   */
  getFieldAtom: <K extends keyof TValues>(name: K) => Atom<FieldState<TValues[K]>>;

  /**
   * Get atom for field value subscription
   * @param name - Field name
   * @returns Atom with field value only
   */
  getFieldAtomValue: <K extends keyof TValues>(name: K) => Atom<TValues[K]>;

  /**
   * Get atom for field error subscription
   * @param name - Field name
   * @returns Atom with field error (computed from sync + async errors)
   */
  getFieldAtomError: <K extends keyof TValues>(name: K) => Atom<string | null>;

  // === Computed atoms for form-level subscription ===
  /**
   * Computed atom of all form values
   * Triggers on ANY field value change - use cautiously
   */
  valuesAtom: Atom<TValues>;

  /**
   * Computed atom of form validity
   * Triggers when any field error changes
   */
  isValidAtom: Atom<boolean>;

  /**
   * Computed atom of form dirty state
   * Triggers when any field dirty state changes
   */
  isDirtyAtom: Atom<boolean>;

  // === Field management ===
  /**
   * Get field API for programmatic control
   */
  field: <K extends keyof TValues>(name: K) => Field<TValues[K]>;

  /**
   * Get field array API for dynamic arrays
   */
  fieldArray: <K extends keyof TValues>(
    name: K,
    defaultItem: TValues[K] extends Array<infer U> ? U : never
  ) => TValues[K] extends Array<infer U> ? FieldArray<U> : never;

  /**
   * Get field metadata
   */
  getFieldMeta: <K extends keyof TValues>(name: K) => FieldMeta<TValues[K]>;

  // === Mutations ===
  setFieldValue: <K extends keyof TValues>(name: K, value: TValues[K]) => void;
  setFieldError: <K extends keyof TValues>(
    name: K,
    error: string | null
  ) => void;
  /**
   * Set errors for multiple fields at once
   */
  setFieldErrors: (errors: Partial<Record<keyof TValues, string | null>>) => void;
  setFieldTouched: <K extends keyof TValues>(name: K, touched: boolean) => void;

  // === Actions ===
  reset: () => void;
  submit: () => Promise<void>;
  validate: () => Promise<{ valid: boolean; errors: FormErrors<TValues> }>;
}

/**
 * Field array operations
 */
export interface FieldArrayOperations<TItem = any> {
  /**
   * Append item to end of array
   */
  append(item: TItem): void;

  /**
   * Prepend item to start of array
   */
  prepend(item: TItem): void;

  /**
   * Insert item at specific index
   */
  insert(index: number, item: TItem): void;

  /**
   * Remove item at index
   */
  remove(index: number): void;

  /**
   * Swap two items
   */
  swap(indexA: number, indexB: number): void;

  /**
   * Move item from one index to another
   */
  move(from: number, to: number): void;

  /**
   * Replace entire array
   */
  replace(items: TItem[]): void;

  /**
   * Clear array
   */
  clear(): void;
}

/**
 * Field array API
 */
export interface FieldArray<TItem = any> extends FieldArrayOperations<TItem> {
  /**
   * Current fields array
   */
  fields: TItem[];

  /**
   * Get field at index
   */
  field(index: number): Field<TItem> | undefined;

  /**
   * Total field count
   */
  length: number;

  /**
   * Get all errors for array items
   */
  errors: Array<string | null>;

  /**
   * Get error for specific item at index
   */
  getError(index: number): string | null;

  /**
   * Check if item at index is valid, or check all items if no index provided
   */
  isValid(index?: number): boolean;

  /**
   * Check if all items are valid (alias for isValid() without arguments)
   */
  isvalid: boolean;

  /**
   * @internal Internal metadata for useFieldInArray hook
   */
  _meta?: FieldArrayMeta<TItem>;
}

/**
 * Field array metadata
 */
export interface FieldArrayMeta<TItem = any> {
  name: string;
  itemAtoms: Array<Atom<FieldState<TItem>>>;
  /** Stable IDs for each item atom - used for React keys */
  itemIds: string[];
  defaultItem: TItem;
  /** Counter for generating unique IDs */
  idCounter: number;
}
