/**
 * FieldPreview Component - Preview of form field
 */

import type { FieldSchema } from '@nexus-state/form-builder';

interface FieldPreviewProps {
  field: FieldSchema;
}

/**
 * Render field preview based on type
 */
export function FieldPreview({ field }: FieldPreviewProps) {
  const { type, placeholder, options } = field;

  switch (type) {
    case 'textarea':
      return (
        <textarea
          placeholder={placeholder || 'Text area'}
          disabled
          rows={3}
          className="field-preview-input"
        />
      );

    case 'select':
      return (
        <select disabled className="field-preview-input">
          <option value="">Select...</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case 'checkbox':
      return (
        <label className="field-preview-checkbox">
          <input type="checkbox" disabled />
          <span>{field.label}</span>
        </label>
      );

    case 'radio':
      return (
        <div className="field-preview-radio-group">
          {options?.map((opt) => (
            <label key={opt.value} className="field-preview-radio">
              <input type="radio" name={field.id} disabled />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      );

    case 'password':
      return (
        <input
          type="password"
          placeholder={placeholder || 'Password'}
          disabled
          className="field-preview-input"
        />
      );

    case 'number':
      return (
        <input
          type="number"
          placeholder={placeholder || '0'}
          disabled
          className="field-preview-input"
        />
      );

    case 'email':
      return (
        <input
          type="email"
          placeholder={placeholder || 'email@example.com'}
          disabled
          className="field-preview-input"
        />
      );

    case 'date':
      return (
        <input
          type="date"
          disabled
          className="field-preview-input"
        />
      );

    case 'file':
      return (
        <div className="field-preview-file">
          <span className="field-preview-file-text">Choose file...</span>
          <button type="button" disabled>Browse</button>
        </div>
      );

    default:
      return (
        <input
          type={type}
          placeholder={placeholder || ''}
          disabled
          className="field-preview-input"
        />
      );
  }
}
