/**
 * SDK for developing validation schema plugins
 * @packageDocumentation
 */

/**
 * Unique identifier for a schema type
 * @example 'zod', 'yup', 'ajv', 'dsl'
 */
export type SchemaType = string;

/**
 * Validation error for a single field
 */
export interface FieldError {
  /** Error message */
  message: string;
  /** Error code for internationalization */
  code?: string;
  /** Parameters for substitution in the message */
  params?: Record<string, unknown>;
}

/**
 * Form validation result
 */
export interface ValidationErrors<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Field-level errors */
  fieldErrors: Partial<Record<keyof TValues, FieldError | null>>;
  /** Form-level errors */
  formErrors?: FieldError[];
}

/**
 * Validation context
 */
export interface ValidationContext<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> {
  /** All form values */
  values: TValues;
  /** Field name for field-level validation */
  fieldName?: keyof TValues;
  /** Reference to the form for advanced scenarios */
  form?: Record<string, unknown>;
  /** Signal for aborting async validation */
  signal?: AbortSignal;
}

/**
 * Schema validator instance
 */
export interface SchemaValidator<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * Validate all form values
   */
  validate(
    _values: TValues,
    _context?: ValidationContext<TValues>
  ): Promise<ValidationErrors<TValues>> | ValidationErrors<TValues>;

  /**
   * Validate a single field
   */
  validateField?<K extends keyof TValues>(
    _fieldName: K,
    _value: TValues[K],
    _context?: ValidationContext<TValues>
  ): Promise<FieldError | null> | FieldError | null;

  /**
   * Parse and transform values
   */
  parse?(_values: unknown): Promise<TValues> | TValues;

  /**
   * Cleanup resources
   */
  dispose?(): void;
}

/**
 * Base interface for validation schema plugins
 * Every plugin must implement this interface
 */
export interface SchemaPlugin<
  TSchema = unknown,
  TValues extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * Schema type (unique identifier)
   */
  readonly type: SchemaType;

  /**
   * Plugin version for compatibility
   */
  readonly version?: string;

  /**
   * Create a validator instance from a schema
   * @param schema - Original schema from the user
   * @returns Validator instance
   */
  create(_schema: TSchema): SchemaValidator<TValues>;

  /**
   * Check if schema is supported (type guard)
   * @param schema - Schema to check
   * @returns true if the plugin can handle the schema
   */
  supports?(schema: unknown): schema is TSchema;
}

/**
 * Plugin metadata
 */
export interface SchemaPluginMeta {
  /** Plugin name */
  name: string;
  /** Description */
  description?: string;
  /** Version */
  version: string;
  /** Author */
  author?: string;
  /** Repository URL */
  repository?: string;
  /** Dependencies on other plugins */
  dependencies?: SchemaType[];
}

/**
 * Plugin with metadata
 */
export interface SchemaPluginWithMeta<
  TSchema = unknown,
  TValues extends Record<string, unknown> = Record<string, unknown>,
> extends SchemaPlugin<TSchema, TValues> {
  meta: SchemaPluginMeta;
}
