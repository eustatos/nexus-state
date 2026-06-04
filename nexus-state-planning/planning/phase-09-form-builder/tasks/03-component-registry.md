# Task 03: Component Registry

**Приоритет:** High  
**Оценка:** 1 неделя  
**Статус:** Todo

---

## Цель

Реализовать Component Registry с built-in компонентами и API для регистрации custom компонентов.

---

## Scope

### 1. Built-in Components

```typescript
// packages/form-builder/src/registry/built-in/text-input.tsx
import { ComponentDefinition } from '../types';

export const textInputComponent: ComponentDefinition = {
  type: 'text',
  label: 'Text Input',
  icon: '📝',
  category: 'input',
  defaultProps: {
    type: 'text',
    label: 'Text Field',
    placeholder: '',
    required: false,
  },
  configSchema: {
    label: { type: 'string', label: 'Label', required: true },
    placeholder: { type: 'string', label: 'Placeholder' },
    required: { type: 'boolean', label: 'Required' },
    minLength: { type: 'number', label: 'Min Length' },
    maxLength: { type: 'number', label: 'Max Length' },
  },
  renderPreview: (props) => (
    <input
      type="text"
      placeholder={props.placeholder}
      disabled
      className="preview-input"
    />
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
};
```

### 2. Component List

**Input Components:**
- Text Input
- Email Input
- Number Input
- Password Input
- Textarea
- Date Input
- Time Input
- File Upload

**Select Components:**
- Select Dropdown
- Radio Group
- Checkbox Group
- Multi-select

**Layout Components:**
- Section Header
- Divider
- Spacer
- Column Layout

**Advanced Components:**
- Rich Text Editor
- Date Range Picker
- Color Picker
- Slider
- Rating

### 3. Registry API

```typescript
// packages/form-builder/src/registry/component-registry.ts
export class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map();

  /**
   * Register a component
   */
  register(definition: ComponentDefinition): void {
    if (this.components.has(definition.type)) {
      throw new Error(`Component type "${definition.type}" already registered`);
    }
    this.components.set(definition.type, definition);
  }

  /**
   * Register multiple components
   */
  registerMany(definitions: ComponentDefinition[]): void {
    definitions.forEach(def => this.register(def));
  }

  /**
   * Unregister a component
   */
  unregister(type: string): boolean {
    return this.components.delete(type);
  }

  /**
   * Get component by type
   */
  get(type: string): ComponentDefinition | undefined {
    return this.components.get(type);
  }

  /**
   * Get all components
   */
  getAll(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  /**
   * Get components by category
   */
  getByCategory(category: ComponentCategory): ComponentDefinition[] {
    return this.getAll().filter(c => c.category === category);
  }

  /**
   * Check if component exists
   */
  has(type: string): boolean {
    return this.components.has(type);
  }

  /**
   * Clear all components
   */
  clear(): void {
    this.components.clear();
  }
}

// Default registry instance
export const defaultRegistry = new ComponentRegistry();

// Auto-register built-in components
import { builtInComponents } from './built-in';
defaultRegistry.registerMany(builtInComponents);
```

### 4. Custom Components

```typescript
// User code
import { defaultRegistry, ComponentDefinition } from '@nexus-state/form-builder';

const customComponent: ComponentDefinition = {
  type: 'custom-rating',
  label: 'Star Rating',
  icon: '⭐',
  category: 'advanced',
  defaultProps: {
    type: 'custom-rating',
    label: 'Rating',
    maxStars: 5,
  },
  configSchema: {
    label: { type: 'string', label: 'Label', required: true },
    maxStars: { type: 'number', label: 'Max Stars', defaultValue: 5 },
  },
  renderPreview: (props) => (
    <div className="star-rating">
      {Array.from({ length: props.maxStars }).map((_, i) => (
        <span key={i}>⭐</span>
      ))}
    </div>
  ),
  renderField: (props) => (
    <StarRatingComponent {...props} />
  ),
};

// Register custom component
defaultRegistry.register(customComponent);
```

---

## Implementation Plan

1. **Built-in Components** (3 дня)
   - Input components (text, email, number, etc.)
   - Select components (select, radio, checkbox)
   - Layout components (header, divider, spacer)
   - Advanced components (rich text, date range, etc.)

2. **Registry Implementation** (1 день)
   - ComponentRegistry class
   - Registration API
   - Auto-registration of built-in components

3. **React Integration** (1 день)
   - useComponentRegistry hook
   - Component preview rendering
   - Component field rendering

4. **Tests** (1 день)
   - Registry tests
   - Component rendering tests
   - Custom component tests

5. **Documentation** (1 день)
   - Component catalog
   - Custom component guide
   - API reference

---

## Acceptance Criteria

- [ ] All built-in components реализованы
- [ ] ComponentRegistry работает корректно
- [ ] Custom components можно регистрировать
- [ ] Preview и field rendering работают
- [ ] Tests покрывают все компоненты
- [ ] Documentation complete

---

## Dependencies

- Task 01 (Core Architecture)
- React 18+

---

## Notes

- Компоненты должны быть accessibility-friendly
- Preview должен быть disabled (не интерактивный)
- Field rendering должен быть полностью функциональным
