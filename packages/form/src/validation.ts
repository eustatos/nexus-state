import { Store, Atom } from '@nexus-state/core';
import {
  FormValues,
  FormErrors,
  FormValidator,
  FieldMeta,
} from './types';
import type { SchemaPlugin, SchemaValidator } from './schema';
import { setFieldError } from './field';
import { defaultSchemaRegistry } from './schema';
import { FormCore } from './core';
import { normalizeFieldPath } from './schema/utils';

export interface ValidationOptions<TValues extends FormValues> {
  /** Schema plugin instance (recommended API) */
  schemaPlugin?: SchemaPlugin<unknown, TValues>;
  /** Schema configuration (used with schemaPlugin or schemaType) */
  schemaConfig?: unknown;
  /** Direct schema validator instance (backward compatibility) */
  schema?: SchemaValidator<TValues>;
  /** Schema type for registry-based resolution (deprecated) */
  schemaType?: string;
  /** Form-level validation function */
  validate?: FormValidator<TValues>;
  /** Validate on change? */
  validateOnChange?: boolean;
  /** Validate on blur? */
  validateOnBlur?: boolean;
}

export interface ValidationAPI<TValues extends FormValues> {
  /** Validate all fields */
  validateAll(): Promise<{ valid: boolean; errors: FormErrors<TValues> }>;
  /** Validate a specific field */
  validateField<K extends keyof TValues>(
    name: K,
    value: TValues[K],
    allValues: TValues
  ): Promise<string | null>;
  /** Clear all validation errors */
  clearErrors(): void;
}

/**
 * Create validation module for a form core.
 * This module handles schema validation, form-level validation,
 * and field-level validation triggers.
 */
export function createValidation<TValues extends FormValues>(
  core: FormCore<TValues>,
  options: ValidationOptions<TValues>
): ValidationAPI<TValues> {
  const { store, fields, extraErrors } = core;
  let schema: SchemaValidator<TValues> | undefined;

  // Resolve schema with priority:
  // 1. schemaPlugin + schemaConfig (recommended API)
  // 2. schemaType + schemaConfig (deprecated, registry-based)
  // 3. schema (deprecated, direct validator)
  if (options.schemaPlugin && options.schemaConfig !== undefined) {
    // Recommended: explicit plugin import, no global state
    schema = options.schemaPlugin.create(options.schemaConfig) as SchemaValidator<TValues>;
  } else if (options.schemaType && options.schemaConfig !== undefined) {
    // Deprecated: registry-based resolution
    const registrySchema = defaultSchemaRegistry.create(
      options.schemaType,
      options.schemaConfig
    );
    if (registrySchema) {
      schema = registrySchema as SchemaValidator<TValues>;
    } else {
      const availableTypes = defaultSchemaRegistry.getRegisteredTypes();
      throw new Error(
        `Schema type "${options.schemaType}" not registered. ` +
          `Available types: ${availableTypes.join(', ') || 'none'}`
      );
    }
  } else if (options.schema) {
    // Deprecated: direct validator
    schema = options.schema;
  }

  const formValidate = options.validate;

  // Validate all fields
  const validateAll = async (): Promise<{ valid: boolean; errors: FormErrors<TValues> }> => {
    const values = core.getValues();
    // Clear extra errors before validation
    store.set(extraErrors, {});

    // Schema validation takes precedence
    if (schema) {
      const errors = await schema.validate(values);
      const fieldErrors: Record<string, any> =
        (errors as any).fieldErrors || errors;
      const newExtraErrors: Record<string, string> = {};

      // Normalize field errors and map them to field metas
      const normalizedFieldErrors: Record<string, string> = {};
      for (const key of Object.keys(fieldErrors)) {
        const error = fieldErrors[key];
        if (error == null) continue;
        const errorMessage =
          typeof error === 'string' ? error : (error as any).message;
        const normalizedKey = normalizeFieldPath(key);
        normalizedFieldErrors[normalizedKey] = errorMessage;
      }

      // Apply errors to fields or extra errors
      for (const [normalizedKey, errorMessage] of Object.entries(
        normalizedFieldErrors
      )) {
        const meta = fields.get(normalizedKey as keyof TValues);
        if (meta) {
          setFieldError(store, meta, errorMessage);
        } else {
          newExtraErrors[normalizedKey] = errorMessage;
        }
      }

      // Clear errors for fields without schema errors
      for (const [key, meta] of fields.entries()) {
        if (!normalizedFieldErrors[key as string]) {
          setFieldError(store, meta, null);
        }
      }

      // Update extra errors atom
      if (Object.keys(newExtraErrors).length > 0) {
        store.set(extraErrors, newExtraErrors);
      }
    }
    // Fallback to form-level validation
    else if (formValidate) {
      const errors = formValidate(values);
      if (errors) {
        const newExtraErrors: Record<string, string> = {};
        for (const key in errors) {
          const normalizedKey = normalizeFieldPath(key);
          const meta = fields.get(normalizedKey as keyof TValues);
          if (meta && errors[key]) {
            setFieldError(store, meta, errors[key]!);
          } else if (errors[key]) {
            newExtraErrors[normalizedKey] = errors[key]!;
          }
        }
        if (Object.keys(newExtraErrors).length > 0) {
          store.set(extraErrors, newExtraErrors);
        }
      }
    }

    // Compute overall validity and return errors
    const isValid = core.getIsValid();
    const errors = core.getErrors();
    return { valid: isValid, errors };
  };

  // Validate a single field
  const validateField = async <K extends keyof TValues>(
    name: K,
    value: TValues[K],
    allValues: TValues
  ): Promise<string | null> => {
    if (schema?.validateField) {
      const error = await schema.validateField(name, value, { values: allValues });
      return error
        ? typeof error === 'string'
          ? error
          : (error as any).message
        : null;
    }
    // TODO: support field-level validators
    return null;
  };

  // Clear all validation errors
  const clearErrors = (): void => {
    for (const meta of fields.values()) {
      setFieldError(store, meta, null);
    }
    store.set(extraErrors, {});
  };

  return {
    validateAll,
    validateField,
    clearErrors,
  };
}
