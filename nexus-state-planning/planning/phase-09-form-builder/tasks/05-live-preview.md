# Task 05: Live Preview

**Приоритет:** High  
**Оценка:** 3-5 дней  
**Статус:** Todo

---

## Цель

Реализовать Live Preview для мгновенного предпросмотра формы в реальном времени.

---

## Scope

### 1. Preview Component

```typescript
// packages/form-builder-ui/src/components/LivePreview.tsx
import { useAtom } from '@nexus-state/react';
import { builderAtom } from '@nexus-state/form-builder';
import { useComponentRegistry } from '../hooks/useComponentRegistry';

export function LivePreview() {
  const [state] = useAtom(builderAtom);
  const registry = useComponentRegistry();
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormValues({ ...formValues, [fieldName]: value });
  };

  // Evaluate conditional logic
  const isFieldVisible = (field: FieldSchema): boolean => {
    if (!field.conditional) return true;

    const dependentValue = formValues[field.conditional.field];
    const { operator, value } = field.conditional;

    switch (operator) {
      case 'equals':
        return dependentValue === value;
      case 'notEquals':
        return dependentValue !== value;
      case 'contains':
        return String(dependentValue).includes(String(value));
      case 'greaterThan':
        return Number(dependentValue) > Number(value);
      case 'lessThan':
        return Number(dependentValue) < Number(value);
      default:
        return true;
    }
  };

  return (
    <div className="live-preview">
      <div className="preview-header">
        <h3>Preview</h3>
        <div className="preview-controls">
          <button onClick={() => setFormValues({})}>Reset</button>
        </div>
      </div>

      <div className="preview-body">
        <form className="preview-form" onSubmit={(e) => e.preventDefault()}>
          <h2>{state.schema.title}</h2>
          {state.schema.description && (
            <p className="form-description">{state.schema.description}</p>
          )}

          {state.schema.fields.map((field) => {
            if (!isFieldVisible(field)) return null;

            const component = registry.get(field.type);
            if (!component) return null;

            return (
              <div key={field.id} className="preview-field">
                <label htmlFor={`preview-${field.id}`}>
                  {field.label}
                  {field.required && <span className="required">*</span>}
                </label>

                {component.renderField({
                  ...field,
                  id: `preview-${field.id}`,
                  value: formValues[field.name] || '',
                  onChange: (e: any) => {
                    const value = e.target.type === 'checkbox' 
                      ? e.target.checked 
                      : e.target.value;
                    handleFieldChange(field.name, value);
                  },
                })}

                {field.placeholder && (
                  <small className="field-hint">{field.placeholder}</small>
                )}
              </div>
            );
          })}

          <button type="submit" className="submit-button">
            Submit
          </button>
        </form>
      </div>

      {/* Debug Panel */}
      <div className="preview-debug">
        <details>
          <summary>Form Values (Debug)</summary>
          <pre>{JSON.stringify(formValues, null, 2)}</pre>
        </details>
      </div>
    </div>
  );
}
```

### 2. Responsive Preview

```typescript
// packages/form-builder-ui/src/components/ResponsivePreview.tsx
type ViewportSize = 'mobile' | 'tablet' | 'desktop';

export function ResponsivePreview() {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');

  const viewportSizes = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1440, height: 900 },
  };

  return (
    <div className="responsive-preview">
      <div className="viewport-controls">
        <button
          className={viewport === 'mobile' ? 'active' : ''}
          onClick={() => setViewport('mobile')}
        >
          📱 Mobile
        </button>
        <button
          className={viewport === 'tablet' ? 'active' : ''}
          onClick={() => setViewport('tablet')}
        >
          📱 Tablet
        </button>
        <button
          className={viewport === 'desktop' ? 'active' : ''}
          onClick={() => setViewport('desktop')}
        >
          💻 Desktop
        </button>
      </div>

      <div
        className="viewport-frame"
        style={{
          width: viewportSizes[viewport].width,
          height: viewportSizes[viewport].height,
        }}
      >
        <LivePreview />
      </div>
    </div>
  );
}
```

### 3. Validation Preview

```typescript
// packages/form-builder-ui/src/components/ValidationPreview.tsx
export function ValidationPreview() {
  const [state] = useAtom(builderAtom);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: FieldSchema, value: any): string | null => {
    if (!field.validation) return null;

    for (const rule of field.validation) {
      switch (rule.type) {
        case 'required':
          if (!value) return rule.message || 'This field is required';
          break;
        case 'minLength':
          if (value.length < (rule.params?.length || 0)) {
            return rule.message || `Min length is ${rule.params?.length}`;
          }
          break;
        case 'maxLength':
          if (value.length > (rule.params?.length || 0)) {
            return rule.message || `Max length is ${rule.params?.length}`;
          }
          break;
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return rule.message || 'Invalid email format';
          }
          break;
        case 'pattern':
          if (!new RegExp(rule.params?.pattern || '').test(value)) {
            return rule.message || 'Invalid format';
          }
          break;
      }
    }

    return null;
  };

  const handleBlur = (field: FieldSchema) => {
    const error = validateField(field, formValues[field.name]);
    setErrors({ ...errors, [field.name]: error || '' });
  };

  return (
    <LivePreview
      onFieldChange={(name, value) => {
        setFormValues({ ...formValues, [name]: value });
        // Clear error on change
        if (errors[name]) {
          setErrors({ ...errors, [name]: '' });
        }
      }}
      onFieldBlur={handleBlur}
      errors={errors}
    />
  );
}
```

---

## Implementation Plan

1. **Basic Preview** (1 день)
   - LivePreview component
   - Field rendering
   - Form values state

2. **Conditional Logic** (1 день)
   - Evaluate conditional visibility
   - Dynamic field showing/hiding
   - Dependent field updates

3. **Validation Preview** (1 день)
   - Client-side validation
   - Error display
   - Real-time feedback

4. **Responsive Preview** (1 день)
   - Viewport controls
   - Mobile/tablet/desktop views
   - Responsive styling

5. **Polish** (1 день)
   - Debug panel
   - Reset functionality
   - Smooth transitions

---

## Acceptance Criteria

- [ ] Preview обновляется в реальном времени
- [ ] Conditional logic работает
- [ ] Validation отображается корректно
- [ ] Responsive preview работает
- [ ] Debug panel полезен

---

## Dependencies

- Task 01 (Core Architecture)
- Task 03 (Component Registry)

---

## Notes

- Preview должен быть read-only (не влияет на builder state)
- Использовать debounce для performance
- Добавить loading states для async operations
