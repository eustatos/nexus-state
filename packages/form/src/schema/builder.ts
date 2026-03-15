import type {
  FieldError,
  SchemaPluginMeta,
  SchemaPluginWithMeta,
  SchemaType,
  SchemaValidator,
  ValidationContext,
  ValidationErrors,
} from './types';

/**
 * Configuration for creating a plugin
 */
export interface PluginBuilderConfig<
  TSchema,
  TValues extends Record<string, unknown>,
> {
  /** Schema type (unique identifier) */
  type: SchemaType;

  /**
   * Plugin metadata (without name/version - filled automatically)
   */
  meta?: Omit<SchemaPluginMeta, 'name' | 'version'> & {
    /** Version override (defaults to '1.0.0') */
    version?: string;
  };

  /** Function to create validator from schema */
  create: (
    schema: TSchema
  ) => {
    /** Validate all values */
    validate?: (
      values: TValues,
      context?: ValidationContext<TValues>
    ) => Promise<ValidationErrors<TValues>> | ValidationErrors<TValues>;

    /** Validate single field */
    validateField?: <K extends keyof TValues>(
      fieldName: K,
      value: TValues[K],
      context?: ValidationContext<TValues>
    ) => Promise<FieldError | null> | FieldError | null;

    /** Parse and transform */
    parse?: (values: unknown) => Promise<TValues> | TValues;

    /** Cleanup resources */
    dispose?: () => void;
  };

  /** Check schema support (type guard) */
  supports?: (schema: unknown) => boolean;
}

/**
 * Create a validation schema plugin
 *
 * Automatically fills metadata:
 * - name: @nexus-state/form-schema-{type}
 * - version: 1.0.0 (override in meta)
 *
 * @param config - Plugin configuration
 * @returns Plugin with metadata
 *
 * @example
 * ```typescript
 * const zodPlugin = createSchemaPlugin({
 *   type: 'zod',
 *   meta: {
 *     description: 'Zod schema validator',
 *     author: 'Your Name',
 *   },
 *   create: (schema) => ({
 *     validate: async (values) => {
 *       const result = await schema.safeParseAsync(values);
 *       if (result.success) return { fieldErrors: {} };
 *       // Map errors...
 *     },
 *   }),
 * });
 * ```
 */
export function createSchemaPlugin<
  TSchema,
  TValues extends Record<string, unknown>,
>(
  config: PluginBuilderConfig<TSchema, TValues>
): SchemaPluginWithMeta<TSchema, TValues> {
  const plugin: SchemaPluginWithMeta<TSchema, TValues> = {
    meta: {
      name: `@nexus-state/form-schema-${config.type}`,
      version: config.meta?.version ?? '1.0.0',
      ...config.meta,
    },
    type: config.type,
    version: config.meta?.version,
    create: (schema: TSchema) => {
      const result = config.create(schema);
      return {
        validate: result.validate,
        validateField: result.validateField,
        parse: result.parse,
        dispose: result.dispose,
      } as SchemaValidator<TValues>;
    },
  };

  if (config.supports) {
    plugin.supports = config.supports as (schema: unknown) => schema is TSchema;
  }

  return plugin;
}

/**
 * Helper for creating simple synchronous validators
 *
 * @example
 * ```typescript
 * const syncValidator = createSyncValidator((values) => {
 *   const errors: ValidationErrors = { fieldErrors: {} };
 *   if (!values.email) {
 *     errors.fieldErrors.email = { message: 'Required', code: 'required' };
 *   }
 *   return errors;
 * });
 * ```
 */
export function createSyncValidator<TValues extends Record<string, unknown>>(
  validateFn: (
    values: TValues,
    context?: ValidationContext<TValues>
  ) => ValidationErrors<TValues>
): SchemaValidator<TValues> {
  return {
    validate: (values, context) => validateFn(values, context),
  };
}

/**
 * Helper for creating asynchronous validators
 *
 * @example
 * ```typescript
 * const asyncValidator = createAsyncValidator(async (values) => {
 *   const errors: ValidationErrors = { fieldErrors: {} };
 *   const response = await fetch('/api/validate');
 *   const result = await response.json();
 *   if (!result.valid) {
 *     errors.fieldErrors.username = { message: 'Taken', code: 'unique' };
 *   }
 *   return errors;
 * });
 * ```
 */
export function createAsyncValidator<TValues extends Record<string, unknown>>(
  validateFn: (
    values: TValues,
    context?: ValidationContext<TValues>
  ) => Promise<ValidationErrors<TValues>>
): SchemaValidator<TValues> {
  return {
    validate: (values, context) => validateFn(values, context),
  };
}

/**
 * Helper for creating field validator
 *
 * @example
 * ```typescript
 * const fieldValidator = createFieldValidator((fieldName, value) => {
 *   if (fieldName === 'email' && !value.includes('@')) {
 *     return { message: 'Invalid email', code: 'email' };
 *   }
 *   return null;
 * });
 * ```
 */
export function createFieldValidator<TValues extends Record<string, unknown>>(
  validateFieldFn: <K extends keyof TValues>(
    fieldName: K,
    value: TValues[K],
    context?: ValidationContext<TValues>
  ) => FieldError | null
): Pick<SchemaValidator<TValues>, 'validateField'> {
  return {
    validateField: validateFieldFn,
  };
}

/**
 * Helper for creating composite validator
 *
 * @example
 * ```typescript
 * const composedValidator = composeValidators(
 *   createSyncValidator(syncValidate),
 *   createAsyncValidator(asyncValidate)
 * );
 * ```
 */
export function composeValidators<TValues extends Record<string, unknown>>(
  ...validators: Array<Partial<SchemaValidator<TValues>>>
): SchemaValidator<TValues> {
  return {
    validate: async (values, context) => {
      const allErrors: ValidationErrors<TValues> = { fieldErrors: {} };

      for (const validator of validators) {
        if (validator.validate) {
          const errors = await validator.validate(values, context);
          Object.assign(allErrors.fieldErrors, errors.fieldErrors);
          if (errors.formErrors) {
            allErrors.formErrors = [
              ...(allErrors.formErrors ?? []),
              ...errors.formErrors,
            ];
          }
        }
      }

      return allErrors;
    },

    validateField: async (fieldName, value, context) => {
      for (const validator of validators) {
        if (validator.validateField) {
          const error = await validator.validateField(
            fieldName,
            value,
            context
          );
          if (error) return error;
        }
      }
      return null;
    },
  };
}
