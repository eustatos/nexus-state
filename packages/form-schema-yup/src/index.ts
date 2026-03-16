import type { AnySchema } from 'yup';
import { ValidationError } from 'yup';
import type {
  FieldError,
  ValidationContext,
  ValidationErrors,
} from '@nexus-state/form/schema';
import {
  createFieldError,
  createSchemaPlugin,
  normalizeFieldPath,
} from '@nexus-state/form/schema';

/**
 * Yup plugin for Nexus State forms
 *
 * @example
 * ```typescript
 * import { createForm } from '@nexus-state/form';
 * import * as yup from 'yup';
 *
 * const form = createForm(store, {
 *   schemaType: 'yup',
 *   schemaConfig: yup.object({
 *     username: yup.string().min(3).required(),
 *     email: yup.string().email().required(),
 *     password: yup.string().min(8).required(),
 *   }),
 *   initialValues: {
 *     username: '',
 *     email: '',
 *     password: '',
 *   }
 * });
 * ```
 */
export const yupPlugin = createSchemaPlugin<AnySchema, Record<string, unknown>>(
  {
    type: 'yup',
    meta: {
      description: 'Yup schema validator for Nexus State forms',
      version: '0.1.0',
      author: 'Nexus State Contributors',
      repository: 'https://github.com/eustatos/nexus-state',
      dependencies: [],
    },
    create: (schema: AnySchema) => {
      /**
       * Convert Yup error to FieldError
       */
      const yupErrorToFieldError = (error: ValidationError): FieldError => {
        return createFieldError(
          error.message,
          error.type ?? 'validation_error',
          {
            path: error.path ?? '',
            value: error.value,
            type: error.type,
          }
        );
      };

      /**
       * Convert Yup errors to ValidationErrors
       */
      const yupErrorsToValidationErrors = (
        error: ValidationError
      ): ValidationErrors => {
        const fieldErrors: Record<string, FieldError | null> = {};

        // Yup can contain multiple errors in inner
        if (error.inner && error.inner.length > 0) {
          for (const innerError of error.inner) {
            if (innerError.path) {
              fieldErrors[normalizeFieldPath(innerError.path)] =
                yupErrorToFieldError(innerError);
            }
          }
        } else if (error.path) {
          // Single error
          fieldErrors[normalizeFieldPath(error.path)] =
            yupErrorToFieldError(error);
        }

        return { fieldErrors };
      };

      /**
       * Validation options
       */
      const validateOptions = {
        abortEarly: false, // Collect all errors, don't stop at first
        stripUnknown: true, // Remove unknown fields
      };

      return {
        /**
         * Validate all form values
         */
        validate: async (
          values: Record<string, unknown>,
          _context?: ValidationContext
        ): Promise<ValidationErrors> => {
          try {
            await schema.validate(values, validateOptions);

            return { fieldErrors: {} };
          } catch (error) {
            console.error('Yup validation error:', error);
            if (error instanceof ValidationError) {
              return yupErrorsToValidationErrors(error);
            }
            throw error;
          }
        },

        /**
         * Validate a single field
         *
         * Yup supports validateAt for validating specific field
         */
        validateField: async <K extends keyof Record<string, unknown>>(
          fieldName: K,
          value: Record<string, unknown>[K],
          _context?: ValidationContext
        ): Promise<FieldError | null> => {
          try {
            // Yup's validateAt requires all values, so we create a temporary object
            // with just the field being validated
            const tempValues = { [fieldName as string]: value };

            await schema.validateAt(fieldName as string, tempValues, {
              abortEarly: true,
              stripUnknown: true,
            });

            return null;
          } catch (error) {
            if (error instanceof ValidationError) {
              return yupErrorToFieldError(error);
            }
            throw error;
          }
        },

        /**
         * Parse and transform values
         * Yup can transform values via .transform()
         */
        parse: async (values: unknown): Promise<Record<string, unknown>> => {
          return schema.validate(values, {
            ...validateOptions,
            stripUnknown: true,
          });
        },
      };
    },

    /**
     * Check if schema is a Yup schema
     */
    supports: (schema: unknown): schema is AnySchema => {
      return (
        schema !== null &&
        typeof schema === 'object' &&
        'validate' in schema &&
        'validateSync' in schema &&
        'validateAt' in schema
      );
    },
  }
);

/**
 * Auto-registration in global registry
 */
if (typeof globalThis !== 'undefined') {
  try {
    import('@nexus-state/form/schema').then(({ defaultSchemaRegistry }) => {
      defaultSchemaRegistry.register('yup', yupPlugin);
    });
  } catch {
    // Ignore if registry is unavailable
  }
}

export default yupPlugin;

/**
 * Type helper for inferring schema type
 *
 * @example
 * ```typescript
 * const schema = yup.object({ name: yup.string() });
 * type SchemaType = InferYupType<typeof schema>;  // { name: string }
 * ```
 */
export type InferYupType<T extends AnySchema> =
  T extends AnySchema<infer U> ? U : never;
