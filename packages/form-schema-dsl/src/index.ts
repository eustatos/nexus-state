import {
  createFieldError,
  createSchemaPlugin,
  type FieldError,
  type ValidationContext,
  type ValidationErrors,
} from '@nexus-state/form/schema';
import type {
  CompiledDSLRule,
  CompiledDSLSchema,
  DSLRule,
  DSLSchema,
} from './types';

/**
 * Compile a DSL rule
 */
function compileRule<TValue>(rule: DSLRule<TValue>): CompiledDSLRule<TValue> {
  const { validate, message, code, options } = rule;

  return {
    originalRule: rule,
    validate: async (value, allValues, context): Promise<FieldError | null> => {
      // Apply debounce if specified (logic would be applied at higher level)
      let result: string | null;

      if (options?.debounce) {
        result = await validate(value, allValues, context);
      } else {
        result = await validate(value, allValues, context);
      }

      // Apply retry if specified
      if (options?.retry && result) {
        for (let i = 0; i < options.retry; i++) {
          result = await validate(value, allValues, context);
          if (!result) break;
        }
      }

      // Return error with overridden message/code if specified
      if (result) {
        return createFieldError(
          message ?? result,
          code ?? 'custom_validation',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          options as any
        );
      }

      return null;
    },
  };
}

/**
 * Compile a DSL schema
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function compileSchema<TValues extends Record<string, any>>(
  schema: DSLSchema<TValues>
): CompiledDSLSchema<TValues> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compiled: any = {};

  for (const [fieldName, rules] of Object.entries(schema)) {
    const rulesArray = Array.isArray(rules) ? rules : [rules];
    compiled[fieldName] = rulesArray.map(compileRule);
  }

  return compiled;
}

/**
 * DSL plugin for Nexus State forms
 *
 * @example
 * ```typescript
 * import { createForm } from '@nexus-state/form';
 * import { dslValidator, required, minLength, email } from '@nexus-state/form-schema-dsl';
 *
 * const form = createForm(store, {
 *   schemaType: 'dsl',
 *   schemaConfig: {
 *     username: [required, minLength(3)],
 *     email: [required, email],
 *     password: [required, minLength(8)],
 *   },
 *   initialValues: {
 *     username: '',
 *     email: '',
 *     password: '',
 *   }
 * });
 * ```
 */
export const dslPlugin = createSchemaPlugin<DSLSchema, Record<string, unknown>>(
  {
    type: 'dsl',
    meta: {
      description: 'Custom DSL schema validator for Nexus State forms',
      version: '0.1.0',
      author: 'Nexus State Contributors',
      repository: 'https://github.com/eustatos/nexus-state',
      dependencies: [],
    },
    create: (schema) => {
      // Compile schema
      const compiledSchema = compileSchema(schema);

      return {
        /**
         * Validate all form values
         */
        validate: async (values, context) => {
          const errors: ValidationErrors = { fieldErrors: {} };

          for (const [fieldName, rules] of Object.entries(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            compiledSchema as any
          )) {
            const value = values[fieldName];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const compiledRule of rules as any) {
              const error = await compiledRule.validate(value, values, context);

              if (error) {
                errors.fieldErrors[fieldName] = error;
                break; // First error stops field validation
              }
            }
          }

          return errors;
        },

        /**
         * Validate a single field
         */
        validateField: async <K extends keyof Record<string, unknown>>(
          fieldName: K,
          value: Record<string, unknown>[K],
          context?: ValidationContext<Record<string, unknown>>
        ): Promise<FieldError | null> => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rules = (compiledSchema as any)[fieldName];
          if (!rules) {
            return null;
          }
          const allValues = context?.values ?? {};
          // Evaluate each rule
          for (const compiledRule of rules) {
            const error = await compiledRule.validate(
              value,
              allValues,
              context
            );
            if (error) {
              return error;
            }
          }
          return null;
        },
      };
    },

    /**
     * Check if schema is a DSL schema
     */
    supports: (schema: unknown): schema is DSLSchema => {
      if (!schema || typeof schema !== 'object') {
        return false;
      }

      const entries = Object.entries(schema);

      // Empty object is not a valid schema
      if (entries.length === 0) {
        return false;
      }

      // Check that all values are rules or arrays of rules
      for (const value of entries.map(([, v]) => v)) {
        if (Array.isArray(value)) {
          // Array of rules
          if (
            !value.every((r) => r && typeof r === 'object' && 'validate' in r)
          ) {
            return false;
          }
        } else if (value && typeof value === 'object') {
          // Single rule
          if (!('validate' in value)) {
            return false;
          }
        } else {
          return false;
        }
      }

      return true;
    },
  }
);

/**
 * Auto-registration in global registry
 */
if (typeof globalThis !== 'undefined') {
  try {
    import('@nexus-state/form/schema').then(({ defaultSchemaRegistry }) => {
      defaultSchemaRegistry.register('dsl', dslPlugin);
    });
  } catch {
    // Ignore if registry is unavailable
  }
}

export default dslPlugin;
export type {
  DSLSchema,
  DSLRule,
  CompiledDSLRule,
  CompiledDSLSchema,
} from './types';
export { compileRule, compileSchema };

// Export validators
export {
  required,
  minLength,
  maxLength,
  lengthRange,
  length,
  minValue,
  maxValue,
  valueRange,
  pattern,
  email,
  url,
  phone,
  creditCard,
  equalTo,
  notEqualTo,
  oneOf,
  notOneOf,
  positive,
  negative,
  integer,
  arrayLength,
  custom,
  matchesField,
  conditional,
} from './validators';

// Export async validators
export {
  unique,
  exists,
  asyncCustom,
  checkDomain,
  checkFileExists,
  checkCaptcha,
  checkUserStatus,
  checkPromoCode,
  withDebounce,
  withRetry,
  withTimeout,
  withOptions,
  type AsyncValidatorOptions,
} from './async-validators';

// Grouped exports
export * as validators from './validators';
export * as asyncValidators from './async-validators';

// Export parser
export {
  parseDSL,
  Lexer,
  Parser,
  LexerError,
  ParserError,
  TokenType,
  defaultValidators,
  parsedSchemaToDSLSchema,
  type Token,
  type ParsedSchemaResult,
  type ParsedFieldValidation,
  type ParsedRule,
  type ValidatorMap,
} from './parser';
