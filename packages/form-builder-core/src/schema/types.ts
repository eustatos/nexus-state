/**
 * Form Builder Schema Types
 *
 * Defines the structure for form schemas used in the visual builder.
 */

/**
 * Field type enumeration
 */
export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'password'
  | 'tel'
  | 'url'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'custom';

/**
 * Field category
 */
export type FieldCategory = 'input' | 'select' | 'layout' | 'advanced';

/**
 * Validation rule for a field
 */
export interface ValidationRule {
  /** Rule type (required, min, max, pattern, etc.) */
  type: string;
  /** Rule parameters */
  params?: Record<string, unknown>;
  /** Custom error message */
  message?: string;
}

/**
 * Select option for radio/checkbox/select fields
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Conditional logic for showing/hiding fields
 */
export interface ConditionalLogic {
  /** Field to watch */
  field: string;
  /** Operator */
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  /** Value to compare */
  value?: unknown;
}

/**
 * Field schema definition
 */
export interface FieldSchema {
  /** Unique field identifier */
  id: string;
  /** Field type */
  type: FieldType;
  /** Field name (for form data) */
  name: string;
  /** Field label */
  label: string;
  /** Field placeholder */
  placeholder?: string;
  /** Field description/help text */
  description?: string;
  /** Default value */
  defaultValue?: unknown;
  /** Is field required */
  required?: boolean;
  /** Validation rules */
  validation?: ValidationRule[];
  /** Options for select/radio/checkbox */
  options?: SelectOption[];
  /** Conditional visibility */
  conditional?: ConditionalLogic;
  /** Field category */
  category?: FieldCategory;
  /** Custom component type (for custom fields) */
  customType?: string;
  /** Custom props for the field */
  props?: Record<string, unknown>;
  /** Metadata for extensions */
  metadata?: Record<string, unknown>;
}

/**
 * Form schema definition
 */
export interface FormSchema {
  /** Unique form identifier */
  id: string;
  /** Form title */
  title: string;
  /** Form description */
  description?: string;
  /** Form fields */
  fields: FieldSchema[];
  /** Form metadata */
  metadata?: {
    version?: string;
    createdAt?: string;
    updatedAt?: string;
    author?: string;
    tags?: string[];
    [key: string]: unknown;
  };
}

/**
 * Form layout configuration
 */
export interface FormLayout {
  /** Number of columns */
  columns?: number;
  /** Gap between fields */
  gap?: string;
  /** Label position */
  labelPosition?: 'top' | 'left' | 'right';
  /** Label width (for left/right position) */
  labelWidth?: string;
}

/**
 * Complete builder configuration
 */
export interface BuilderConfig {
  /** Form schema */
  schema: FormSchema;
  /** Layout configuration */
  layout?: FormLayout;
  /** Custom components registry */
  customComponents?: Record<string, unknown>;
}
