/**
 * Mock components for testing (framework-agnostic)
 */

import type { ComponentDefinition } from './component-registry';

/**
 * Mock text component
 */
export const mockTextInputComponent: ComponentDefinition = {
  type: 'text',
  label: 'Text Input',
  icon: '📝',
  category: 'input',
  description: 'Single-line text input field',
  defaultProps: {
    type: 'text',
    label: 'Text Field',
    placeholder: '',
    required: false,
  },
  configSchema: {
    label: { type: 'string', label: 'Label', required: true },
    placeholder: { type: 'string', label: 'Placeholder' },
    required: { type: 'boolean', label: 'Required', defaultValue: false },
  },
  renderPreview: () => null as any,
  renderField: () => null as any,
  supportsValidation: true,
  supportsConditional: true,
};

/**
 * Mock email component
 */
export const mockEmailInputComponent: ComponentDefinition = {
  type: 'email',
  label: 'Email',
  icon: '📧',
  category: 'input',
  description: 'Email address input with validation',
  defaultProps: {
    type: 'email',
    label: 'Email',
    placeholder: 'email@example.com',
    required: false,
  },
  configSchema: {
    label: { type: 'string', label: 'Label', required: true },
    placeholder: { type: 'string', label: 'Placeholder', defaultValue: 'email@example.com' },
    required: { type: 'boolean', label: 'Required', defaultValue: false },
  },
  renderPreview: () => null as any,
  renderField: () => null as any,
  supportsValidation: true,
  supportsConditional: true,
};

/**
 * Mock number component
 */
export const mockNumberInputComponent: ComponentDefinition = {
  type: 'number',
  label: 'Number',
  icon: '🔢',
  category: 'input',
  description: 'Numeric input field',
  defaultProps: {
    type: 'number',
    label: 'Number',
    placeholder: '0',
    required: false,
  },
  configSchema: {
    label: { type: 'string', label: 'Label', required: true },
    placeholder: { type: 'string', label: 'Placeholder' },
    required: { type: 'boolean', label: 'Required', defaultValue: false },
  },
  renderPreview: () => null as any,
  renderField: () => null as any,
  supportsValidation: true,
  supportsConditional: true,
};

/**
 * Mock select component
 */
export const mockSelectComponent: ComponentDefinition = {
  type: 'select',
  label: 'Select',
  icon: '📋',
  category: 'select',
  description: 'Dropdown selection field',
  defaultProps: {
    type: 'select',
    label: 'Select Option',
    required: false,
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ],
  },
  configSchema: {
    label: { type: 'string', label: 'Label', required: true },
    required: { type: 'boolean', label: 'Required', defaultValue: false },
    options: { type: 'array', label: 'Options' },
  },
  renderPreview: () => null as any,
  renderField: () => null as any,
  supportsValidation: true,
  supportsConditional: true,
};

/**
 * Mock checkbox component
 */
export const mockCheckboxComponent: ComponentDefinition = {
  type: 'checkbox',
  label: 'Checkbox',
  icon: '☑️',
  category: 'select',
  description: 'Checkbox field for boolean values',
  defaultProps: {
    type: 'checkbox',
    label: 'I agree',
    required: false,
    defaultValue: false,
  },
  configSchema: {
    label: { type: 'string', label: 'Label', required: true },
    required: { type: 'boolean', label: 'Required', defaultValue: false },
    defaultValue: { type: 'boolean', label: 'Default Value', defaultValue: false },
  },
  renderPreview: () => null as any,
  renderField: () => null as any,
  supportsValidation: false,
  supportsConditional: true,
};

/**
 * Mock radio component
 */
export const mockRadioComponent: ComponentDefinition = {
  type: 'radio',
  label: 'Radio Group',
  icon: '🔘',
  category: 'select',
  description: 'Radio button group for single selection',
  defaultProps: {
    type: 'radio',
    label: 'Choose an option',
    required: false,
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ],
  },
  configSchema: {
    label: { type: 'string', label: 'Label', required: true },
    required: { type: 'boolean', label: 'Required', defaultValue: false },
    options: { type: 'array', label: 'Options' },
  },
  renderPreview: () => null as any,
  renderField: () => null as any,
  supportsValidation: true,
  supportsConditional: true,
};

/**
 * Mock textarea component
 */
export const mockTextareaComponent: ComponentDefinition = {
  type: 'textarea',
  label: 'Textarea',
  icon: '📄',
  category: 'input',
  description: 'Multi-line text input',
  defaultProps: {
    type: 'textarea',
    label: 'Message',
    placeholder: '',
    required: false,
    props: { rows: 4 },
  },
  configSchema: {
    label: { type: 'string', label: 'Label', required: true },
    placeholder: { type: 'string', label: 'Placeholder' },
    required: { type: 'boolean', label: 'Required', defaultValue: false },
    rows: { type: 'number', label: 'Rows', defaultValue: 4 },
  },
  renderPreview: () => null as any,
  renderField: () => null as any,
  supportsValidation: true,
  supportsConditional: true,
};

/**
 * Mock password component
 */
export const mockPasswordComponent: ComponentDefinition = {
  type: 'password',
  label: 'Password',
  icon: '🔒',
  category: 'input',
  description: 'Password input field',
  defaultProps: {
    type: 'password',
    label: 'Password',
    placeholder: 'Enter password',
    required: false,
  },
  configSchema: {
    label: { type: 'string', label: 'Label', required: true },
    placeholder: { type: 'string', label: 'Placeholder' },
    required: { type: 'boolean', label: 'Required', defaultValue: false },
  },
  renderPreview: () => null as any,
  renderField: () => null as any,
  supportsValidation: true,
  supportsConditional: true,
};

/**
 * Array of all mock components
 */
export const mockComponents: ComponentDefinition[] = [
  mockTextInputComponent,
  mockEmailInputComponent,
  mockNumberInputComponent,
  mockSelectComponent,
  mockCheckboxComponent,
  mockRadioComponent,
  mockTextareaComponent,
  mockPasswordComponent,
];
