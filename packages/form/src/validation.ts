import { Store, Atom } from '@nexus-state/core';
import {
  FormValues,
  FormErrors,
  SchemaValidator,
  FormValidator,
  FieldMeta,
} from './types';
import { setFieldError } from './field';
import { defaultSchemaRegistry } from './schema';
import { FormCore } from './core';

export interface ValidationOptions<TValues extends FormValues> {
  /** Direct schema validator instance */
  schema?: SchemaValidator<TValues>;
  /** Schema type for registry */
  schemaType?: string;
  /** Schema configuration for registry */
  schemaConfig?: unknown;
  /** Form-level validation function */
  validate?: FormValidator<TValues>;
  /** Validate on change? */
  validateOnChange?: boolean;
  /** Validate on blur? */
  validateOnBlur?: boolean;
}

export interface ValidationAPI<TValues extends FormValues> {
  /** Validate all fields */
  validateAll(): Promise<boolean>;
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

  // Resolve schema from registry or options
  if (options.schemaType && options.schemaConfig !== undefined) {
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
    schema = options.schema;
  }

  const formValidate = options.validate;

  // Validate all fields
  const validateAll = async (): Promise<boolean> => {
    const values = core.getValues();
    // Clear extra errors before validation
    store.set(extraErrors, {});

    // Schema validation takes precedence
    if (schema) {
      const errors = await schema.validate(values);
      const fieldErrors: Record<string, any> =
        (errors as any).fieldErrors || errors;
      const newExtraErrors: Record<string, string> = {};

      for (const key of Object.keys(fieldErrors)) {
        const meta = fields.get(key as keyof TValues);
        const error = fieldErrors[key];
        if (error == null) continue;
        const errorMessage =
          typeof error === 'string' ? error : (error as any).message;
        if (meta) {
          setFieldError(store, meta, errorMessage);
        } else {
          newExtraErrors[key] = errorMessage;
        }
      }

      // Clear errors for fields without schema errors
      for (const [key, meta] of fields.entries()) {
        if (!fieldErrors[key as string]) {
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
          const meta = fields.get(key as keyof TValues);
          if (meta && errors[key]) {
            setFieldError(store, meta, errors[key]!);
          } else if (errors[key]) {
            newExtraErrors[key] = errors[key]!;
          }
        }
        if (Object.keys(newExtraErrors).length > 0) {
          store.set(extraErrors, newExtraErrors);
        }
      }
    }

    // Compute overall validity
    const isValid = core.getIsValid();
    return isValid;
  };

  // Validate a single field
  const validateField = async <K extends keyof TValues>(
    name: K,
    value: TValues[K],
    allValues: TValues
  ): Promise<string | null> => {
    if (schema?.validateField) {
      const error = await schema.validateField(name, value, allValues);
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
