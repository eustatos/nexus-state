/**
 * PropertiesPanel Component - Field configuration panel
 */

import { useAtom, useStore } from '@nexus-state/react';
import type { FieldSchema } from '@nexus-state/form-builder-core';
import { builderAtom, builderActions, defaultRegistry } from '@nexus-state/form-builder-react';

/**
 * Property field component
 */
interface PropertyFieldProps {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  type: 'string' | 'number' | 'boolean' | 'select' | 'array' | 'object';
  options?: Array<{ value: string; label: string }>;
}

function PropertyField({ label, value, onChange, type, options }: PropertyFieldProps) {
  switch (type) {
    case 'boolean':
      return (
        <label className="property-field property-field-checkbox">
          <span className="property-label">{label}</span>
          <input
            type="checkbox"
            checked={value as boolean}
            onChange={(e) => onChange(e.target.checked)}
          />
        </label>
      );

    case 'select':
      return (
        <div className="property-field">
          <label className="property-label">{label}</label>
          <select
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="property-input"
          >
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'array':
    case 'object':
      return (
        <div className="property-field">
          <label className="property-label">{label}</label>
          <input
            type="text"
            value={JSON.stringify(value)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value));
              } catch {
                onChange(e.target.value);
              }
            }}
            className="property-input"
          />
        </div>
      );

    case 'number':
      return (
        <div className="property-field">
          <label className="property-label">{label}</label>
          <input
            type="number"
            value={value as number}
            onChange={(e) => onChange(Number(e.target.value))}
            className="property-input"
          />
        </div>
      );

    default:
      return (
        <div className="property-field">
          <label className="property-label">{label}</label>
          <input
            type="text"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="property-input"
          />
        </div>
      );
  }
}

/**
 * Main PropertiesPanel component
 */
export function PropertiesPanel() {
  const [state] = useAtom(builderAtom);
  const store = useStore();
  const registry = defaultRegistry;

  if (!state.selectedFieldId) {
    return (
      <div className="properties-panel">
        <div className="properties-panel-empty">
          <span className="properties-panel-empty-icon">👈</span>
          <p>Select a field to edit its properties</p>
        </div>
      </div>
    );
  }

  const field = state.schema.fields.find((f) => f.id === state.selectedFieldId);
  
  if (!field) {
    return null;
  }

  const component = registry.get(field.type);

  const updateField = (updates: Partial<FieldSchema>) => {
    const newState = builderActions.updateField(state, field.id, updates);
    store.set(builderAtom, newState);
  };

  return (
    <div className="properties-panel">
      <div className="properties-panel-header">
        <h3 className="properties-panel-title">Properties</h3>
        <button
          className="properties-panel-close"
          onClick={() => {
            const newState = builderActions.selectField(state, null);
            store.set(builderAtom, newState);
          }}
          type="button"
        >
          ×
        </button>
      </div>

      <div className="properties-panel-body">
        {/* Basic Properties */}
        <div className="property-section">
          <h4 className="property-section-title">Basic</h4>
          
          <PropertyField
            label="Field Name"
            value={field.name}
            onChange={(value) => updateField({ name: value as string })}
            type="string"
          />
          
          <PropertyField
            label="Label"
            value={field.label}
            onChange={(value) => updateField({ label: value as string })}
            type="string"
          />
          
          <PropertyField
            label="Placeholder"
            value={field.placeholder || ''}
            onChange={(value) => updateField({ placeholder: value as string })}
            type="string"
          />
          
          <PropertyField
            label="Required"
            value={field.required || false}
            onChange={(value) => updateField({ required: value as boolean })}
            type="boolean"
          />
        </div>

        {/* Component-specific Properties */}
        {component && Object.entries(component.configSchema).map(([key, config]) => (
          <PropertyField
            key={key}
            label={config.label}
            value={(field as any)[key] ?? config.defaultValue}
            onChange={(value) => updateField({ [key]: value })}
            type={config.type}
            options={config.options}
          />
        ))}
      </div>
    </div>
  );
}
