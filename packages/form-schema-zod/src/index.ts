import { z } from 'zod';
import type { FieldError, ValidationContext, ValidationErrors } from '@nexus-state/form/schema';
import { createFieldError, createSchemaPlugin, normalizeFieldPath } from '@nexus-state/form/schema';

/**
 * Zod plugin for Nexus State forms
 *
 * @example
 * ```typescript
 * import { createForm } from '@nexus-state/form';
 * import { z } from 'zod';
 *
 * const form = createForm(store, {
 *   schemaType: 'zod',
 *   schemaConfig: z.object({
 *     username: z.string().min(3),
 *     email: z.string().email(),
 *     password: z.string().min(8),
 *   }),
 *   initialValues: {
 *     username: '',
 *     email: '',
 *     password: '',
 *   }
 * });
 * ```
 */
export const zodPlugin = createSchemaPlugin<z.ZodType, Record<string, unknown>>({
  type: 'zod',
  meta: {
    description: 'Zod schema validator for Nexus State forms',
    version: '0.1.0',
    author: 'Nexus State Contributors',
    repository: 'https://github.com/eustatos/nexus-state',
    dependencies: [],
  },
  create: (schema: z.ZodType) => {
    /**
     * Convert Zod issue to FieldError
     */
    const zodIssueToFieldError = (issue: z.ZodIssue): FieldError => {
      return createFieldError(issue.message, issue.code, {
        received: (issue as z.ZodInvalidTypeIssue).received,
        expected: (issue as z.ZodInvalidTypeIssue).expected,
        path: issue.path.join('.'),
      });
    };

    /**
     * Convert Zod errors to ValidationErrors
     */
    const zodErrorsToValidationErrors = (
      error: z.ZodError
    ): ValidationErrors => {
      const fieldErrors: Record<string, FieldError | null> = {};

      for (const issue of error.issues) {
        const path = normalizeFieldPath(issue.path.join('.'));
        if (path) {
          fieldErrors[path] = zodIssueToFieldError(issue);
        }
      }

      return { fieldErrors };
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
          const result = await schema.safeParseAsync(values);

          if (result.success) {
            return { fieldErrors: {} };
          }

          return zodErrorsToValidationErrors(result.error);
        } catch (error) {
          // Handle unexpected errors
          if (error instanceof z.ZodError) {
            return zodErrorsToValidationErrors(error);
          }
          throw error;
        }
      },

      /**
       * Validate a single field
       *
       * Note: Zod validates the entire schema, but we return
       * error only for the specific field
       */
      validateField: async <K extends keyof Record<string, unknown>>(
        _fieldName: K,
        _value: Record<string, unknown>[K],
        _context?: ValidationContext
      ): Promise<FieldError | null> => {
        // validateField is called with field context, but we need all values
        // This is a limitation - we return null and rely on full validation
        return null;
      },

      /**
       * Parse and transform values
       * Zod can transform values via .transform()
       */
      parse: async (values: unknown): Promise<Record<string, unknown>> => {
        return schema.parseAsync(values);
      },
    };
  },

  /**
   * Check if schema is a Zod schema
   */
  supports: (schema: unknown): schema is z.ZodType => {
    return (
      schema !== null &&
      typeof schema === 'object' &&
      'safeParseAsync' in schema &&
      'safeParse' in schema &&
      'parse' in schema
    );
  },
});

/**
 * Auto-registration in global registry
 *
 * When the plugin is imported, it automatically registers itself
 */
if (typeof globalThis !== 'undefined') {
  try {
    // Dynamic import to avoid circular dependency
    import('@nexus-state/form/schema').then(
      ({ defaultSchemaRegistry }) => {
        defaultSchemaRegistry.register('zod', zodPlugin);
      }
    );
  } catch {
    // Ignore if registry is unavailable (e.g., in SSR)
  }
}

export default zodPlugin;

/**
 * Type helper for inferring schema type
 *
 * @example
 * ```typescript
 * const schema = z.object({ name: z.string() });
 * type SchemaType = InferZodType<typeof schema>;  // { name: string }
 * ```
 */
export type InferZodType<T extends z.ZodType> = z.infer<T>;
