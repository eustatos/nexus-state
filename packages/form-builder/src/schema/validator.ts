/**
 * Schema validation utilities
 */

import type { FormSchema, FieldSchema, ValidationRule } from './types';

/**
 * Validate a field schema
 */
export function validateFieldSchema(field: FieldSchema): string[] {
  const errors: string[] = [];

  // Required fields
  if (!field.id) {
    errors.push('Field must have an id');
  }
  if (!field.type) {
    errors.push(`Field "${field.name}" must have a type`);
  }
  if (!field.name) {
    errors.push('Field must have a name');
  }
  if (!field.label) {
    errors.push(`Field "${field.name}" must have a label`);
  }

  // Name validation
  if (field.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.name)) {
    errors.push(`Field name "${field.name}" must be a valid identifier`);
  }

  // Type-specific validation
  if (field.type === 'select' || field.type === 'radio') {
    if (!field.options || field.options.length === 0) {
      errors.push(`Field "${field.name}" of type "${field.type}" must have options`);
    }
  }

  // Validation rules
  if (field.validation) {
    field.validation.forEach((rule, index) => {
      if (!rule.type) {
        errors.push(`Validation rule ${index} in field "${field.name}" must have a type`);
      }
    });
  }

  return errors;
}

/**
 * Validate a form schema
 */
export function validateFormSchema(schema: FormSchema): string[] {
  const errors: string[] = [];

  // Required fields
  if (!schema.id) {
    errors.push('Form must have an id');
  }
  if (!schema.title) {
    errors.push('Form must have a title');
  }
  if (!schema.fields || schema.fields.length === 0) {
    errors.push('Form must have at least one field');
  }

  // Check for duplicate field names
  const fieldNames = new Set<string>();
  schema.fields.forEach((field) => {
    if (fieldNames.has(field.name)) {
      errors.push(`Duplicate field name: "${field.name}"`);
    }
    fieldNames.add(field.name);

    // Check for duplicate field ids
    const fieldIds = new Set<string>();
    if (fieldIds.has(field.id)) {
      errors.push(`Duplicate field id: "${field.id}"`);
    }
    fieldIds.add(field.id);

    // Validate individual field
    const fieldErrors = validateFieldSchema(field);
    errors.push(...fieldErrors);
  });

  // Check conditional logic references
  schema.fields.forEach((field) => {
    if (field.conditional) {
      const referencedField = schema.fields.find(f => f.name === field.conditional?.field);
      if (!referencedField) {
        errors.push(`Field "${field.name}" has conditional logic referencing non-existent field "${field.conditional.field}"`);
      }
    }
  });

  return errors;
}

/**
 * Check if a form schema is valid
 */
export function isFormSchemaValid(schema: FormSchema): boolean {
  return validateFormSchema(schema).length === 0;
}

/**
 * Create a default field schema
 */
export function createDefaultField(type: FieldType, name?: string): FieldSchema {
  const fieldName = name || `field_${Date.now()}`;
  
  return {
    id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    name: fieldName,
    label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' '),
    required: false,
    validation: [],
  };
}

/**
 * Create a default form schema
 */
export function createDefaultFormSchema(title?: string): FormSchema {
  return {
    id: `form_${Date.now()}`,
    title: title || 'New Form',
    fields: [],
    metadata: {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
    },
  };
}
