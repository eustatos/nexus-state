/**
 * Built-in form components
 */

import type { ComponentDefinition } from './component-registry';

/**
 * Text Input component
 */
export const textInputComponent: ComponentDefinition = {
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
    minLength: { type: 'number', label: 'Min Length' },
    maxLength: { type: 'number', label: 'Max Length' },
  },
  renderPreview: (props) => (
    <input type="text" placeholder={props.placeholder} disabled className="preview-input" />
  ),
  renderField: (props) => (
    <input
      type="text"
      name={props.name}
      placeholder={props.placeholder}
      required={props.required}
      className="form-input"
    />
  ),
  supportsValidation: true,
  supportsConditional: true,
};

/**
 * Email Input component
 */
export const emailInputComponent: ComponentDefinition = {
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
  renderPreview: (props) => (
    <input type="email" placeholder={props.placeholder} disabled className="preview-input" />
  ),
  renderField: (props) => (
    <input
      type="email"
      name={props.name}
      placeholder={props.placeholder}
      required={props.required}
      className="form-input"
    />
  ),
  supportsValidation: true,
  supportsConditional: true,
};

/**
 * Number Input component
 */
export const numberInputComponent: ComponentDefinition = {
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
    minValue: { type: 'number', label: 'Min Value' },
    maxValue: { type: 'number', label: 'Max Value' },
  },
  renderPreview: (props) => (
    <input type="number" placeholder={props.placeholder} disabled className="preview-input" />
  ),
  renderField: (props) => (
    <input
      type="number"
      name={props.name}
      placeholder={props.placeholder}
      required={props.required}
      min={props.props?.minValue as number}
      max={props.props?.maxValue as number}
      className="form-input"
    />
  ),
  supportsValidation: true,
  supportsConditional: true,
};

/**
 * Password Input component
 */
export const passwordInputComponent: ComponentDefinition = {
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
    minLength: { type: 'number', label: 'Min Length', defaultValue: 8 },
  },
  renderPreview: (props) => (
    <input type="password" placeholder={props.placeholder} disabled className="preview-input" />
  ),
  renderField: (props) => (
    <input
      type="password"
      name={props.name}
      placeholder={props.placeholder}
      required={props.required}
      minLength={props.props?.minLength as number}
      className="form-input"
    />
  ),
  supportsValidation: true,
  supportsConditional: true,
};

/**
 * Textarea component
 */
export const textareaComponent: ComponentDefinition = {
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
    minLength: { type: 'number', label: 'Min Length' },
    maxLength: { type: 'number', label: 'Max Length' },
  },
  renderPreview: (props) => (
    <textarea placeholder={props.placeholder} rows={props.props?.rows as number || 4} disabled className="preview-textarea" />
  ),
  renderField: (props) => (
    <textarea
      name={props.name}
      placeholder={props.placeholder}
      required={props.required}
      rows={props.props?.rows as number || 4}
      className="form-textarea"
    />
  ),
  supportsValidation: true,
  supportsConditional: true,
};

/**
 * Select Dropdown component
 */
export const selectComponent: ComponentDefinition = {
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
  renderPreview: (props) => (
    <select disabled className="preview-select">
      <option value="">Select...</option>
      {props.options?.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
  renderField: (props) => (
    <select name={props.name} required={props.required} className="form-select">
      <option value="">Select...</option>
      {props.options?.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
  supportsValidation: true,
  supportsConditional: true,
};

/**
 * Checkbox component
 */
export const checkboxComponent: ComponentDefinition = {
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
  renderPreview: (props) => (
    <label className="preview-checkbox">
      <input type="checkbox" disabled checked={props.defaultValue as boolean} />
      {props.label}
    </label>
  ),
  renderField: (props) => (
    <label className="form-checkbox">
      <input
        type="checkbox"
        name={props.name}
        checked={props.defaultValue as boolean}
      />
      {props.label}
    </label>
  ),
  supportsValidation: false,
  supportsConditional: true,
};

/**
 * Radio Group component
 */
export const radioComponent: ComponentDefinition = {
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
  renderPreview: (props) => (
    <div className="preview-radio-group">
      {props.options?.map(opt => (
        <label key={opt.value}>
          <input type="radio" name={props.name} disabled /> {opt.label}
        </label>
      ))}
    </div>
  ),
  renderField: (props) => (
    <div className="form-radio-group">
      {props.options?.map(opt => (
        <label key={opt.value}>
          <input type="radio" name={props.name} value={opt.value} required={props.required} />
          {opt.label}
        </label>
      ))}
    </div>
  ),
  supportsValidation: true,
  supportsConditional: true,
};

/**
 * Built-in components array
 */
export const builtInComponents: ComponentDefinition[] = [
  textInputComponent,
  emailInputComponent,
  numberInputComponent,
  passwordInputComponent,
  textareaComponent,
  selectComponent,
  checkboxComponent,
  radioComponent,
];
