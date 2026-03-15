import { Atom, Store } from '@nexus-state/core';

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
 * Schema validation adapter interface
 */
export interface SchemaValidator<TValues extends FormValues = FormValues> {
  /**
   * Validate all values
   */
  validate(values: TValues): Promise<FormErrors<TValues>> | FormErrors<TValues>;

  /**
   * Validate single field
   */
  validateField?: <K extends keyof TValues>(
    name: K,
    value: TValues[K],
    allValues: TValues
  ) => Promise<string | null> | string | null;

  /**
   * Parse and validate (returns typed values or throws)
   */
  parse?: (values: unknown) => TValues | Promise<TValues>;
}

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
   * Direct schema validator instance (backward compatibility)
   * @deprecated Use schemaType + schemaConfig for automatic registration via registry
   */
  schema?: SchemaValidator<TValues>;

  /**
   * Schema type for use via registry
   * @example 'zod', 'yup', 'ajv', 'dsl'
   */
  schemaType?: string;

  /**
   * Schema configuration to pass to plugin factory
   * Interpreted based on schemaType
   */
  schemaConfig?: unknown;

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
    value: TValue;
    onChange: (value: TValue) => void;
    onBlur: () => void;
  };
}

/**
 * Form API
 */
export interface Form<TValues extends FormValues = FormValues> {
  values: TValues;
  errors: FormErrors<TValues>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;

  field: <K extends keyof TValues>(name: K) => Field<TValues[K]>;

  // Field array support
  fieldArray: <K extends keyof TValues>(
    name: K,
    defaultItem: TValues[K] extends Array<infer U> ? U : never
  ) => TValues[K] extends Array<infer U> ? FieldArray<U> : never;

  setFieldValue: <K extends keyof TValues>(name: K, value: TValues[K]) => void;
  setFieldError: <K extends keyof TValues>(
    name: K,
    error: string | null
  ) => void;
  setFieldTouched: <K extends keyof TValues>(name: K, touched: boolean) => void;

  reset: () => void;
  submit: () => Promise<void>;
  validate: () => Promise<boolean>;
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
}

/**
 * Field array metadata
 */
export interface FieldArrayMeta<TItem = any> {
  name: string;
  itemAtoms: Array<Atom<FieldState<TItem>>>;
  defaultItem: TItem;
}
