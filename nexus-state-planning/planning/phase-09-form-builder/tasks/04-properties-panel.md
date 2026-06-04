# Task 04: Properties Panel

**Приоритет:** High  
**Оценка:** 1 неделя  
**Статус:** Todo

---

## Цель

Реализовать Properties Panel для настройки полей формы.

---

## Scope

### 1. Properties Panel Component

```typescript
// packages/form-builder-ui/src/components/PropertiesPanel.tsx
import { useAtom } from '@nexus-state/react';
import { builderAtom, builderActions } from '@nexus-state/form-builder';
import { useComponentRegistry } from '../hooks/useComponentRegistry';

export function PropertiesPanel() {
  const [state] = useAtom(builderAtom);
  const registry = useComponentRegistry();

  if (!state.selectedFieldId) {
    return (
      <div className="properties-panel">
        <div className="empty-state">
          <p>Select a field to edit its properties</p>
        </div>
      </div>
    );
  }

  const field = state.schema.fields.find(f => f.id === state.selectedFieldId);
  if (!field) return null;

  const component = registry.get(field.type);
  if (!component) return null;

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>Properties</h3>
        <button onClick={() => builderActions.selectField(null)}>×</button>
      </div>

      <div className="panel-body">
        {/* Basic Properties */}
        <PropertySection title="Basic">
          <PropertyField
            label="Field Name"
            value={field.name}
            onChange={(value) => builderActions.updateField(field.id, { name: value })}
            type="string"
          />
          <PropertyField
            label="Field Type"
            value={field.type}
            onChange={(value) => builderActions.updateField(field.id, { type: value })}
            type="select"
            options={registry.getAll().map(c => ({ value: c.type, label: c.label }))}
          />
        </PropertySection>

        {/* Component-specific Properties */}
        <PropertySection title="Configuration">
          {Object.entries(component.configSchema).map(([key, config]) => (
            <PropertyField
              key={key}
              label={config.label}
              value={field[key]}
              onChange={(value) => builderActions.updateField(field.id, { [key]: value })}
              type={config.type}
              options={config.options}
              required={config.required}
            />
          ))}
        </PropertySection>

        {/* Validation Rules */}
        <PropertySection title="Validation">
          <ValidationRulesEditor
            rules={field.validation || []}
            onChange={(rules) => builderActions.updateField(field.id, { validation: rules })}
          />
        </PropertySection>

        {/* Conditional Logic */}
        <PropertySection title="Conditional Logic">
          <ConditionalLogicEditor
            conditional={field.conditional}
            fields={state.schema.fields}
            onChange={(conditional) => builderActions.updateField(field.id, { conditional })}
          />
        </PropertySection>
      </div>
    </div>
  );
}
```

### 2. Property Field Component

```typescript
// packages/form-builder-ui/src/components/PropertyField.tsx
interface PropertyFieldProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type: 'string' | 'number' | 'boolean' | 'select' | 'array';
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
}

export function PropertyField({ label, value, onChange, type, options, required }: PropertyFieldProps) {
  switch (type) {
    case 'string':
      return (
        <div className="property-field">
          <label>
            {label}
            {required && <span className="required">*</span>}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    case 'number':
      return (
        <div className="property-field">
          <label>
            {label}
            {required && <span className="required">*</span>}
          </label>
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
      );

    case 'boolean':
      return (
        <div className="property-field">
          <label>
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
            />
            {label}
          </label>
        </div>
      );

    case 'select':
      return (
        <div className="property-field">
          <label>
            {label}
            {required && <span className="required">*</span>}
          </label>
          <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">Select...</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    default:
      return null;
  }
}
```

### 3. Validation Rules Editor

```typescript
// packages/form-builder-ui/src/components/ValidationRulesEditor.tsx
interface ValidationRulesEditorProps {
  rules: ValidationRule[];
  onChange: (rules: ValidationRule[]) => void;
}

export function ValidationRulesEditor({ rules, onChange }: ValidationRulesEditorProps) {
  const addRule = () => {
    onChange([...rules, { type: 'required', params: {}, message: '' }]);
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updates: Partial<ValidationRule>) => {
    onChange(rules.map((rule, i) => (i === index ? { ...rule, ...updates } : rule)));
  };

  return (
    <div className="validation-rules-editor">
      {rules.map((rule, index) => (
        <div key={index} className="validation-rule">
          <select
            value={rule.type}
            onChange={(e) => updateRule(index, { type: e.target.value })}
          >
            <option value="required">Required</option>
            <option value="minLength">Min Length</option>
            <option value="maxLength">Max Length</option>
            <option value="pattern">Pattern</option>
            <option value="email">Email</option>
            <option value="url">URL</option>
          </select>

          {/* Rule-specific parameters */}
          {(rule.type === 'minLength' || rule.type === 'maxLength') && (
            <input
              type="number"
              placeholder="Length"
              value={rule.params?.length || ''}
              onChange={(e) =>
                updateRule(index, {
                  params: { ...rule.params, length: Number(e.target.value) },
                })
              }
            />
          )}

          {rule.type === 'pattern' && (
            <input
              type="text"
              placeholder="Regex pattern"
              value={rule.params?.pattern || ''}
              onChange={(e) =>
                updateRule(index, { params: { ...rule.params, pattern: e.target.value } })
              }
            />
          )}

          <input
            type="text"
            placeholder="Error message"
            value={rule.message || ''}
            onChange={(e) => updateRule(index, { message: e.target.value })}
          />

          <button onClick={() => removeRule(index)}>×</button>
        </div>
      ))}

      <button onClick={addRule}>+ Add Rule</button>
    </div>
  );
}
```

### 4. Conditional Logic Editor

```typescript
// packages/form-builder-ui/src/components/ConditionalLogicEditor.tsx
interface ConditionalLogicEditorProps {
  conditional?: ConditionalLogic;
  fields: FieldSchema[];
  onChange: (conditional?: ConditionalLogic) => void;
}

export function ConditionalLogicEditor({ conditional, fields, onChange }: ConditionalLogicEditorProps) {
  const [enabled, setEnabled] = useState(!!conditional);

  const toggleEnabled = () => {
    if (enabled) {
      onChange(undefined);
      setEnabled(false);
    } else {
      onChange({ field: '', operator: 'equals', value: '' });
      setEnabled(true);
    }
  };

  if (!enabled) {
    return (
      <div className="conditional-logic-editor">
        <button onClick={toggleEnabled}>+ Add Conditional Logic</button>
      </div>
    );
  }

  return (
    <div className="conditional-logic-editor">
      <div className="logic-rule">
        <span>Show this field when</span>
        <select
          value={conditional?.field || ''}
          onChange={(e) => onChange({ ...conditional!, field: e.target.value })}
        >
          <option value="">Select field...</option>
          {fields.map((field) => (
            <option key={field.id} value={field.name}>
              {field.label}
            </option>
          ))}
        </select>

        <select
          value={conditional?.operator || 'equals'}
          onChange={(e) =>
            onChange({ ...conditional!, operator: e.target.value as any })
          }
        >
          <option value="equals">equals</option>
          <option value="notEquals">not equals</option>
          <option value="contains">contains</option>
          <option value="greaterThan">greater than</option>
          <option value="lessThan">less than</option>
        </select>

        <input
          type="text"
          placeholder="Value"
          value={conditional?.value || ''}
          onChange={(e) => onChange({ ...conditional!, value: e.target.value })}
        />

        <button onClick={toggleEnabled}>×</button>
      </div>
    </div>
  );
}
```

---

## Implementation Plan

1. **Properties Panel Layout** (1 день)
   - Panel structure
   - Header with close button
   - Scrollable body

2. **Property Fields** (2 дня)
   - String, number, boolean inputs
   - Select dropdowns
   - Array editors

3. **Validation Rules Editor** (2 дня)
   - Add/remove rules
   - Rule type selection
   - Parameter inputs

4. **Conditional Logic Editor** (1 день)
   - Enable/disable logic
   - Field selection
   - Operator selection

5. **Polish** (1 день)
   - Styling
   - Animations
   - Validation

---

## Acceptance Criteria

- [ ] Properties Panel отображается при выборе поля
- [ ] Все property types работают
- [ ] Validation rules можно добавлять/удалять
- [ ] Conditional logic работает
- [ ] UI интуитивный и полированный

---

## Dependencies

- Task 01 (Core Architecture)
- Task 03 (Component Registry)

---

## Notes

- Использовать controlled inputs
- Debounce updates для performance
- Validate property values
