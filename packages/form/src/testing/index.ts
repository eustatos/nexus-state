/**
 * Testing utilities for @nexus-state/form
 * 
 * Provides factory functions and helpers for testing forms without
 * the boilerplate of manual store and form setup.
 * 
 * @example
 * ```typescript
 * import { createTestForm } from '@nexus-state/form/testing';
 * 
 * const form = createTestForm({
 *   initialValues: { name: '', email: '' },
 * });
 * 
 * form.setFieldValue('name', 'John');
 * expect(form.values.name).toBe('John');
 * ```
 * 
 * @packageDocumentation
 */

import { createForm } from '../create-form';
import { createStore, type Store } from '@nexus-state/core';
import type { Form, FormValues, FormOptions } from '../types';

/**
 * Options for creating a test form
 */
export interface CreateTestFormOptions<TValues extends FormValues> 
  extends Partial<Omit<FormOptions<TValues>, 'initialValues' | 'onSubmit'>> {
  /**
   * Initial values for the form
   */
  initialValues?: Partial<TValues>;
  
  /**
   * Disable validation (default: true for tests)
   * 
   * When true, validation is completely disabled for faster tests.
   * When false, you can provide validation logic via validate, schemaType, etc.
   */
  disableValidation?: boolean;
  
  /**
   * Custom store (creates new if not provided)
   * 
   * Useful when you need to share a store between multiple forms
   * or test store-specific behavior.
   */
  store?: Store;
}

/**
 * Create a form optimized for testing
 * 
 * Features:
 * - No validation by default (faster tests)
 * - Isolated store instance
 * - Type-safe initial values
 * - No-op submit handler
 * 
 * @example
 * ```typescript
 * // Basic usage - form without validation
 * const form = createTestForm({
 *   initialValues: {
 *     username: '',
 *     email: '',
 *   },
 * });
 * 
 * // Test form behavior
 * form.setFieldValue('username', 'john_doe');
 * expect(form.values.username).toBe('john_doe');
 * expect(form.isDirty).toBe(true);
 * ```
 * 
 * @example
 * ```typescript
 * // Form with validation disabled explicitly
 * const form = createTestForm({
 *   initialValues: { name: '' },
 *   disableValidation: true,
 *   validateOnChange: false,
 *   validateOnBlur: false,
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Form with custom initial values
 * interface MyFormValues {
 *   username: string;
 *   email: string;
 * }
 * 
 * const form = createTestForm<MyFormValues>({
 *   initialValues: { 
 *     username: 'test', 
 *     email: 'test@example.com' 
 *   },
 * });
 * ```
 * 
 * @param options - Optional configuration for the test form
 * @returns Form instance ready for testing
 */
export function createTestForm<TValues extends FormValues>(
  options: CreateTestFormOptions<TValues> = {}
): Form<TValues> {
  const {
    initialValues = {} as TValues,
    disableValidation = true,
    store = createStore(),
    validateOnChange,
    validateOnBlur,
    ...restOptions
  } = options;

  // Build form options
  const formOptions: FormOptions<TValues> = {
    ...restOptions,
    initialValues: initialValues as TValues,
    onSubmit: async () => {}, // No-op submit for tests
  };

  // Handle validation settings
  if (disableValidation) {
    // Completely disable validation
    formOptions.validateOnChange = false;
    formOptions.validateOnBlur = false;
    // Don't set schemaType/schemaConfig/validate
  } else {
    // Use provided values or defaults
    formOptions.validateOnChange = validateOnChange ?? true;
    formOptions.validateOnBlur = validateOnBlur ?? true;
  }

  return createForm<TValues>(store, formOptions);
}

/**
 * Options for creating a test form with validation
 */
export interface CreateTestFormWithValidationOptions<TValues extends FormValues> 
  extends Omit<CreateTestFormOptions<TValues>, 'disableValidation'> {
  /**
   * Custom sync validation function
   * 
   * @example
   * ```typescript
   * validate: (values) => ({
   *   email: !values.email.includes('@') ? 'Invalid email' : null,
   * })
   * ```
   */
  validate?: FormOptions<TValues>['validate'];
  
  /**
   * Schema type for schema-based validation (e.g., 'zod', 'yup')
   */
  schemaType?: string;
  
  /**
   * Schema configuration (the actual schema object)
   * 
   * @example
   * ```typescript
   * import { z } from 'zod';
   * 
   * schemaConfig: z.object({
   *   email: z.string().email(),
   * })
   * ```
   */
  schemaConfig?: any;
}

/**
 * Create a form with validation for testing validation logic
 * 
 * Use this when you need to test:
 * - Sync validation logic
 * - Schema-based validation (Zod, Yup, etc.)
 * - Validation error messages
 * - Form validity state
 * 
 * @example
 * ```typescript
 * // Custom validation function
 * const form = createTestFormWithValidation({
 *   initialValues: { email: '' },
 *   validate: (values) => ({
 *     email: !values.email.includes('@') ? 'Invalid email' : null,
 *   }),
 * });
 * 
 * form.setFieldValue('email', 'invalid');
 * await form.validate();
 * 
 * expect(form.errors.email).toBe('Invalid email');
 * expect(form.isValid).toBe(false);
 * ```
 * 
 * @example
 * ```typescript
 * // Zod schema validation
 * import { z } from 'zod';
 * 
 * const schema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8),
 * });
 * 
 * const form = createTestFormWithValidation({
 *   initialValues: { email: '', password: '' },
 *   schemaType: 'zod',
 *   schemaConfig: schema,
 * });
 * 
 * form.setFieldValue('email', 'not-an-email');
 * await form.validate();
 * 
 * expect(form.errors.email).toBeDefined();
 * ```
 * 
 * @param options - Configuration including validation logic
 * @returns Form instance with validation enabled
 */
export function createTestFormWithValidation<TValues extends FormValues>(
  options: CreateTestFormWithValidationOptions<TValues>
): Form<TValues> {
  const {
    validate,
    schemaType,
    schemaConfig,
    ...restOptions
  } = options;

  return createTestForm<TValues>({
    ...restOptions,
    disableValidation: false,
    validate,
    ...(schemaType && { schemaType }),
    ...(schemaConfig && { schemaConfig }),
  });
}

/**
 * Wait for async validation to complete
 * 
 * Polls the form state until validation errors are settled
 * or the timeout is reached.
 * 
 * @example
 * ```typescript
 * import { 
 *   createTestFormWithValidation,
 *   waitForValidation 
 * } from '@nexus-state/form/testing';
 * 
 * const form = createTestFormWithValidation({
 *   initialValues: { username: '' },
 *   validate: async (values) => {
 *     await new Promise(resolve => setTimeout(resolve, 200));
 *     return values.username === 'taken' 
 *       ? { username: 'Username taken' } 
 *       : null;
 *   },
 * });
 * 
 * form.setFieldValue('username', 'taken');
 * 
 * // Wait for async validation to complete
 * await waitForValidation(form);
 * 
 * expect(form.errors.username).toBe('Username taken');
 * ```
 * 
 * @param form - Form instance to wait for
 * @param timeout - Maximum wait time in milliseconds (default: 1000)
 * @returns Promise that resolves when validation completes
 * @throws Error if validation does not complete within timeout
 */
export async function waitForValidation(
  form: Form<any>,
  timeout = 1000
): Promise<void> {
  const startTime = Date.now();
  const initialErrorCount = Object.keys(form.errors).length;
  
  while (Date.now() - startTime < timeout) {
    // Check if form validity has stabilized
    const currentErrorCount = Object.keys(form.errors).length;
    const isValid = form.isValid;
    
    // If validity state is stable for one iteration, consider validation complete
    // This works because validation changes errors/isValid
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const finalErrorCount = Object.keys(form.errors).length;
    const finalIsValid = form.isValid;
    
    if (currentErrorCount === finalErrorCount && isValid === finalIsValid) {
      return;
    }
  }
  
  throw new Error(`Validation did not complete within ${timeout}ms`);
}

/**
 * Wait for form state to match expected condition
 * 
 * Useful for waiting for async operations like submission.
 * 
 * @example
 * ```typescript
 * await waitForFormState(
 *   form, 
 *   state => !state.isSubmitting,
 *   'Form submission to complete'
 * );
 * ```
 * 
 * @param form - Form instance to watch
 * @param condition - Predicate function that returns true when done
 * @param message - Error message if timeout is reached
 * @param timeout - Maximum wait time in milliseconds (default: 1000)
 * @returns Promise that resolves when condition is met
 */
export async function waitForFormState<TValues extends FormValues>(
  form: Form<TValues>,
  condition: (state: {
    values: TValues;
    errors: Partial<Record<keyof TValues, string>>;
    isValid: boolean;
    isDirty: boolean;
    isSubmitting: boolean;
  }) => boolean,
  message = 'Condition not met within timeout',
  timeout = 1000
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const state = {
      values: form.values,
      errors: form.errors,
      isValid: form.isValid,
      isDirty: form.isDirty,
      isSubmitting: form.isSubmitting,
    };
    
    if (condition(state)) {
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  throw new Error(message);
}

// Re-export createStore for convenience
export { createStore } from '@nexus-state/core';
export type { Store } from '@nexus-state/core';
