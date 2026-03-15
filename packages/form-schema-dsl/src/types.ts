import type { FieldError, ValidationContext } from '@nexus-state/form/schema';

/**
 * Validation function type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ValidatorFn<TValue = any> = (
  value: TValue,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allValues?: any,
  context?: ValidationContext
) => string | null | Promise<string | null>;

/**
 * DSL validation rule
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DSLRule<TValue = any> {
  /** Validation function */
  validate: ValidatorFn<TValue>;

  /** Error message (overrides returned message) */
  message?: string;

  /** Error code for i18n */
  code?: string;

  /** Async validator flag */
  async?: boolean;

  /** Options */
  options?: {
    /** Debounce delay in ms */
    debounce?: number;
    /** Cache results */
    cache?: boolean;
    /** Retry attempts */
    retry?: number;
    /** Timeout in ms */
    timeout?: number;
  };
}

/**
 * DSL Schema
 *
 * @example
 * ```typescript
 * const schema: DSLSchema = {
 *   username: [required, minLength(3)],
 *   email: [required, email],
 *   password: [required, minLength(8)],
 * };
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DSLSchema<TValues extends Record<string, any> = any> = {
  [K in keyof TValues]?: DSLRule<TValues[K]> | DSLRule<TValues[K]>[];
};

/**
 * Compiled DSL rule result
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CompiledDSLRule<TValue = any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate: (value: TValue, allValues?: any, context?: ValidationContext) => Promise<FieldError | null>;
  originalRule: DSLRule<TValue>;
}

/**
 * Compiled DSL schema
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CompiledDSLSchema<TValues extends Record<string, any> = any> = {
  [K in keyof TValues]: CompiledDSLRule<TValues[K]>[];
};
