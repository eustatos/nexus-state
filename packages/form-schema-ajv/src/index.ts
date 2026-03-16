import Ajv from 'ajv';
import type {
  Options as AjvOptions,
  ErrorObject,
  KeywordDefinition,
  ValidateFunction,
} from 'ajv';
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
 * AJV schema configuration
 */
export interface AjvSchemaConfig {
  /** JSON Schema object */
  schema: object;
  /** AJV options */
  ajvOptions?: AjvOptions;
  /** Custom keywords */
  keywords?: KeywordDefinition[];
  /** Custom formats */
  formats?: Record<string, string | RegExp | ((value: string) => boolean)>;
}

/**
 * AJV plugin for Nexus State forms
 *
 * @example
 * ```typescript
 * import { createForm } from '@nexus-state/form';
 *
 * const form = createForm(store, {
 *   schemaType: 'ajv',
 *   schemaConfig: {
 *     schema: {
 *       type: 'object',
 *       properties: {
 *         username: { type: 'string', minLength: 3 },
 *         email: { type: 'string', format: 'email' },
 *         password: { type: 'string', minLength: 8 },
 *       },
 *       required: ['username', 'email', 'password'],
 *     },
 *   },
 *   initialValues: {
 *     username: '',
 *     email: '',
 *     password: '',
 *   }
 * });
 * ```
 */
export const ajvPlugin = createSchemaPlugin<
  AjvSchemaConfig,
  Record<string, unknown>
>({
  type: 'ajv',
  meta: {
    description: 'AJV (JSON Schema) validator for Nexus State forms',
    version: '0.1.0',
    author: 'Nexus State Contributors',
    repository: 'https://github.com/eustatos/nexus-state',
    dependencies: [],
  },
  create: (config: AjvSchemaConfig) => {
    /**
     * Initialize AJV instance
     */
    const ajv = new Ajv({
      allErrors: true, // Collect all errors
      useDefaults: true, // Use default values
      ...config.ajvOptions,
    });

    /**
     * Register custom formats
     */
    if (config.formats) {
      for (const [name, format] of Object.entries(config.formats)) {
        ajv.addFormat(name, format);
      }
    }

    /**
     * Register custom keywords
     */
    if (config.keywords) {
      for (const keyword of config.keywords) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const kw = keyword as any;
        ajv.addKeyword(kw.keyword, keyword);
      }
    }

    /**
     * Compile schema
     */
    const validate: ValidateFunction = ajv.compile(config.schema);

    /**
     * Convert AJV error to FieldError
     */
    const ajvErrorToFieldError = (error: ErrorObject): FieldError => {
      // AJV v6 uses dataPath, v7+ uses instancePath
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errAny = error as any;
      let path = normalizeFieldPath(
        errAny.instancePath ?? errAny.dataPath ?? ''
      );

      // Handle required property errors - path is in params.missingProperty
      if (error.keyword === 'required' && errAny.params?.missingProperty) {
        const parentPath = path ? path + '.' : '';
        path = parentPath + errAny.params.missingProperty;
      }

      return createFieldError(
        error.message ?? 'Validation failed',
        error.keyword,
        {
          schemaPath: error.schemaPath,
          path,
          params: error.params as Record<string, unknown>,
        }
      );
    };

    /**
     * Convert AJV errors to ValidationErrors
     */
    const ajvErrorsToValidationErrors = (
      errors: ErrorObject[]
    ): ValidationErrors => {
      const fieldErrors: Record<string, FieldError | null> = {};

      for (const error of errors) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errAny = error as any;
        let path = normalizeFieldPath(
          errAny.instancePath ?? errAny.dataPath ?? ''
        );

        // Handle required property errors
        if (error.keyword === 'required' && errAny.params?.missingProperty) {
          const parentPath = path ? path + '.' : '';
          path = parentPath + errAny.params.missingProperty;
        }

        if (path) {
          fieldErrors[path] = ajvErrorToFieldError(error);
        }
      }

      return { fieldErrors };
    };

    return {
      /**
       * Validate all form values
       */
      validate: (
        values: Record<string, unknown>,
        _context?: ValidationContext
      ): ValidationErrors => {
        const valid = validate(values);

        if (valid) {
          return { fieldErrors: {} };
        }

        if (validate.errors) {
          return ajvErrorsToValidationErrors(validate.errors);
        }

        return { fieldErrors: {} };
      },

      /**
       * Validate a single field
       *
       * AJV validates the entire schema, but we return
       * error only for the specific field
       */
      validateField: async <K extends keyof Record<string, unknown>>(
        fieldName: K,
        value: Record<string, unknown>[K],
        context?: ValidationContext<Record<string, unknown>>
      ): Promise<FieldError | null> => {
        // Use context values or create a copy with updated field
        const values = context?.values ?? {};
        const updatedValues = { ...values, [fieldName]: value };
        const valid = validate(updatedValues);
        if (valid) {
          return null;
        }
        if (!validate.errors) {
          return null;
        }
        // Find error for this field
        const normalizedFieldName = String(fieldName);
        for (const error of validate.errors) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const errAny = error as any;
          let path = normalizeFieldPath(
            errAny.instancePath ?? errAny.dataPath ?? ''
          );
          // Handle required property errors
          if (error.keyword === 'required' && errAny.params?.missingProperty) {
            const parentPath = path ? path + '.' : '';
            path = parentPath + errAny.params.missingProperty;
          }
          if (path === normalizedFieldName) {
            return ajvErrorToFieldError(error);
          }
        }
        return null;
      },

      /**
       * Parse and validate
       * JSON Schema doesn't support transformation, only validation
       */
      parse: async (values: unknown): Promise<Record<string, unknown>> => {
        const valid = validate(values);

        if (!valid) {
          throw new Error(
            `Validation failed: ${validate.errors?.[0]?.message ?? 'Unknown error'}`
          );
        }

        return values as Record<string, unknown>;
      },

      /**
       * Cleanup resources
       */
      dispose: () => {
        ajv.removeSchema(config.schema);
      },
    };
  },

  /**
   * Check if configuration is a valid AJV schema
   */
  supports: (config: unknown): config is AjvSchemaConfig => {
    return (
      config !== null &&
      typeof config === 'object' &&
      'schema' in config &&
      typeof config.schema === 'object'
    );
  },
});

/**
 * Auto-registration in global registry
 */
if (typeof globalThis !== 'undefined') {
  try {
    import('@nexus-state/form/schema').then(({ defaultSchemaRegistry }) => {
      defaultSchemaRegistry.register('ajv', ajvPlugin);
    });
  } catch {
    // Ignore if registry is unavailable
  }
}

export default ajvPlugin;

/**
 * Built-in formats for convenience
 */
export const builtInFormats = {
  /** Email format */
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  /** URL format */
  uri: /^https?:\/\/.+\..+/,

  /** UUID format */
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,

  /** Date format (YYYY-MM-DD) */
  date: /^\d{4}-\d{2}-\d{2}$/,

  /** DateTime format (ISO 8601) */
  'date-time':
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,

  /** Time format (HH:MM:SS) */
  time: /^\d{2}:\d{2}:\d{2}(\.\d+)?$/,

  /** IPv4 format */
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,

  /** IPv6 format */
  ipv6: /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
} as const;

/**
 * Helper for creating custom keywords
 *
 * @example
 * ```typescript
 * const adultKeyword = createCustomKeyword({
 *   keyword: 'adult',
 *   type: 'number',
 *   validate: (schema, age) => age >= schema,
 * });
 * ```
 */
export function createCustomKeyword(
  keyword: KeywordDefinition
): KeywordDefinition {
  return keyword;
}
