import type {
  FormValues,
  FormErrors,
  SchemaValidator,
  ZodSchema,
  YupSchema
} from './types';

/**
 * Create Zod schema validator
 */
export function zodValidator<TValues extends FormValues>(
  schema: ZodSchema<TValues>
): SchemaValidator<TValues> {
  return {
    validate: async (values: TValues): Promise<FormErrors<TValues>> => {
      const result = await schema.safeParseAsync(values);

      if (result.success) {
        return {};
      }

      // Map Zod errors to form errors
      const errors: FormErrors<TValues> = {};

      if ('error' in result && result.error) {
        for (const issue of result.error.issues) {
          const path = issue.path.join('.') as keyof TValues;
          if (path) {
            errors[path] = issue.message;
          }
        }
      }

      return errors;
    },

    validateField: async <K extends keyof TValues>(
      _name: K,
      _value: TValues[K],
      allValues: TValues
    ): Promise<string | null> => {
      // Validate entire object but only return error for specific field
      const result = await schema.safeParseAsync(allValues);

      if (result.success) {
        return null;
      }

      if ('error' in result && result.error) {
        const fieldError = result.error.issues.find(
          (issue: any) => issue.path.join('.') === String(_name)
        );

        return fieldError ? fieldError.message : null;
      }

      return null;
    },

    parse: async (values: unknown): Promise<TValues> => {
      return schema.parseAsync(values);
    }
  };
}

/**
 * Create Yup schema validator
 */
export function yupValidator<TValues extends FormValues>(
  schema: YupSchema<TValues>
): SchemaValidator<TValues> {
  return {
    validate: async (values: TValues): Promise<FormErrors<TValues>> => {
      try {
        await (schema as any).validate(values, { abortEarly: false });
        return {};
      } catch (error: any) {
        const errors: FormErrors<TValues> = {};

        if (error.inner && Array.isArray(error.inner)) {
          for (const err of error.inner) {
            if (err.path) {
              errors[err.path as keyof TValues] = err.message;
            }
          }
        } else if (error.path) {
          errors[error.path as keyof TValues] = error.message;
        }

        return errors;
      }
    },

    validateField: async <K extends keyof TValues>(
      name: K,
      _value: TValues[K],
      allValues: TValues
    ): Promise<string | null> => {
      try {
        await schema.validateAt(String(name), allValues);
        return null;
      } catch (error: any) {
        return error.message || 'Validation failed';
      }
    },

    parse: async (values: unknown): Promise<TValues> => {
      return schema.validate(values);
    }
  };
}

/**
 * Type helper to infer schema type
 */
export type InferSchema<T> = T extends ZodSchema<infer U>
  ? U
  : T extends YupSchema<infer V>
  ? V
  : never;
