# Component Registry Guide

The Component Registry is the heart of the Form Builder, managing all available form components.

---

## Overview

The registry provides:
- **Built-in components** - Ready-to-use form components
- **Custom components** - Register your own components
- **Category management** - Organize components by type
- **Type-safe API** - Full TypeScript support

---

## Built-in Components

### Input Components

| Component | Type | Icon | Description |
|-----------|------|------|-------------|
| Text Input | `text` | 📝 | Single-line text input |
| Email Input | `email` | 📧 | Email input with validation |
| Number Input | `number` | 🔢 | Numeric input |
| Password Input | `password` | 🔒 | Password input |
| Textarea | `textarea` | 📄 | Multi-line text input |

### Select Components

| Component | Type | Icon | Description |
|-----------|------|------|-------------|
| Select | `select` | 📋 | Dropdown selection |
| Checkbox | `checkbox` | ☑️ | Checkbox for boolean values |
| Radio Group | `radio` | 🔘 | Radio button group |

### Accessing Built-in Components

```typescript
import { defaultRegistry, builtInComponents } from '@nexus-state/form-builder';

// Get all built-in components
console.log(builtInComponents.length); // 8 components

// Get specific component
const textInput = defaultRegistry.get('text');

// Get by category
const inputComponents = defaultRegistry.getByCategory('input');
```

---

## Registry API

### ComponentRegistry Class

```typescript
import { ComponentRegistry } from '@nexus-state/form-builder';

const registry = new ComponentRegistry();
```

### Methods

#### register(definition)

Register a single component.

```typescript
registry.register({
  type: 'custom-rating',
  label: 'Star Rating',
  icon: '⭐',
  category: 'advanced',
  defaultProps: { maxStars: 5 },
  configSchema: { /* ... */ },
  renderPreview: (props) => {/* ... */},
  renderField: (props) => {/* ... */},
});
```

#### registerMany(definitions)

Register multiple components at once.

```typescript
registry.registerMany([
  component1,
  component2,
  component3,
]);
```

#### get(type)

Get component by type.

```typescript
const component = registry.get('text');
if (component) {
  console.log(component.label);
}
```

#### getByCategory(category)

Get all components in a category.

```typescript
const inputComponents = registry.getByCategory('input');
const selectComponents = registry.getByCategory('select');
```

#### getAll()

Get all registered components.

```typescript
const allComponents = registry.getAll();
```

#### has(type)

Check if component exists.

```typescript
if (registry.has('text')) {
  // Component exists
}
```

#### unregister(type)

Remove a component.

```typescript
registry.unregister('custom-component');
```

#### clear()

Remove all components.

```typescript
registry.clear();
```

#### size

Get component count.

```typescript
console.log(`Registered components: ${registry.size}`);
```

---

## Custom Components

### Creating a Custom Component

```typescript
import type { ComponentDefinition } from '@nexus-state/form-builder';

const starRatingComponent: ComponentDefinition = {
  // Basic info
  type: 'star-rating',
  label: 'Star Rating',
  icon: '⭐',
  category: 'advanced',
  description: 'Rating component with stars',
  
  // Default props
  defaultProps: {
    type: 'star-rating',
    label: 'Rating',
    maxStars: 5,
  },
  
  // Configuration schema for properties panel
  configSchema: {
    label: { 
      type: 'string', 
      label: 'Label', 
      required: true 
    },
    maxStars: { 
      type: 'number', 
      label: 'Max Stars', 
      defaultValue: 5 
    },
  },
  
  // Preview rendering (non-interactive)
  renderPreview: (props) => (
    <div className="star-rating-preview">
      {Array.from({ length: props.maxStars || 5 }).map((_, i) => (
        <span key={i}>⭐</span>
      ))}
    </div>
  ),
  
  // Field rendering (interactive)
  renderField: (props) => (
    <div className="star-rating">
      {Array.from({ length: props.maxStars || 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => console.log('Rating:', i + 1)}
        >
          ⭐
        </button>
      ))}
    </div>
  ),
  
  // Optional features
  supportsValidation: false,
  supportsConditional: true,
};
```

### Registering Custom Components

```typescript
import { defaultRegistry } from '@nexus-state/form-builder';

// Register single component
defaultRegistry.register(starRatingComponent);

// Register multiple
defaultRegistry.registerMany([
  starRatingComponent,
  colorPickerComponent,
  datePickerComponent,
]);
```

### Using Custom Components

Once registered, custom components appear in the palette automatically:

```typescript
// In the builder UI
import { FormBuilder } from '@nexus-state/form-builder-ui';

function App() {
  return <FormBuilder />;
}

// Your custom component will appear in the "advanced" category
```

---

## Component Definition Interface

```typescript
interface ComponentDefinition {
  // Basic info
  type: string;
  label: string;
  icon: string;
  category: FieldCategory;
  description?: string;
  
  // Defaults
  defaultProps: Partial<FieldSchema>;
  
  // Configuration
  configSchema: Record<string, ConfigField>;
  
  // Rendering
  renderPreview: (props: Partial<FieldSchema>) => JSX.Element;
  renderField: (props: FieldSchema) => JSX.Element;
  
  // Features
  supportsValidation?: boolean;
  supportsConditional?: boolean;
}
```

### ConfigField Interface

```typescript
interface ConfigField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'select';
  label: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: Array<{ value: string; label: string }>;
  description?: string;
}
```

---

## Examples

### Example 1: Color Picker Component

```typescript
const colorPickerComponent: ComponentDefinition = {
  type: 'color',
  label: 'Color Picker',
  icon: '🎨',
  category: 'advanced',
  defaultProps: {
    type: 'color',
    label: 'Choose Color',
    defaultValue: '#000000',
  },
  configSchema: {
    label: { type: 'string', label: 'Label', required: true },
    defaultValue: { type: 'string', label: 'Default Color' },
  },
  renderPreview: (props) => (
    <input 
      type="color" 
      value={props.defaultValue as string} 
      disabled 
    />
  ),
  renderField: (props) => (
    <input 
      type="color" 
      name={props.name}
      defaultValue={props.defaultValue as string}
    />
  ),
};

defaultRegistry.register(colorPickerComponent);
```

### Example 2: Date Range Component

```typescript
const dateRangeComponent: ComponentDefinition = {
  type: 'date-range',
  label: 'Date Range',
  icon: '📅',
  category: 'advanced',
  defaultProps: {
    type: 'date-range',
    label: 'Select Date Range',
  },
  configSchema: {
    label: { type: 'string', label: 'Label', required: true },
    minDate: { type: 'string', label: 'Min Date' },
    maxDate: { type: 'string', label: 'Max Date' },
  },
  renderPreview: (props) => (
    <div className="date-range-preview">
      <input type="date" disabled /> - <input type="date" disabled />
    </div>
  ),
  renderField: (props) => (
    <div className="date-range">
      <input type="date" name={`${props.name}_start`} />
      <span>to</span>
      <input type="date" name={`${props.name}_end`} />
    </div>
  ),
};

defaultRegistry.register(dateRangeComponent);
```

### Example 3: Rich Text Editor

```typescript
const richTextComponent: ComponentDefinition = {
  type: 'rich-text',
  label: 'Rich Text Editor',
  icon: '📝',
  category: 'advanced',
  defaultProps: {
    type: 'rich-text',
    label: 'Content',
    placeholder: 'Enter content...',
  },
  configSchema: {
    label: { type: 'string', label: 'Label', required: true },
    placeholder: { type: 'string', label: 'Placeholder' },
    toolbar: { 
      type: 'select', 
      label: 'Toolbar',
      options: [
        { value: 'full', label: 'Full' },
        { value: 'minimal', label: 'Minimal' },
      ]
    },
  },
  renderPreview: (props) => (
    <div className="rich-text-preview">
      <div className="toolbar">B I U</div>
      <div className="content">{props.placeholder}</div>
    </div>
  ),
  renderField: (props) => (
    <RichTextEditor
      name={props.name}
      placeholder={props.placeholder}
    />
  ),
};

defaultRegistry.register(richTextComponent);
```

---

## Best Practices

### 1. Unique Types

Always use unique type names to avoid conflicts:

```typescript
// ✅ Good
type: 'my-company-rating'

// ❌ Bad (might conflict with built-in)
type: 'text'
```

### 2. Descriptive Labels

Use clear, descriptive labels:

```typescript
// ✅ Good
label: 'Star Rating (1-5)'

// ❌ Bad
label: 'Rating'
```

### 3. Proper Icons

Use emoji or SVG icons for visual identification:

```typescript
// Emoji
icon: '⭐'

// SVG
icon: '<svg>...</svg>'
```

### 4. Default Props

Always provide sensible defaults:

```typescript
defaultProps: {
  label: 'Default Label',
  required: false,
  maxStars: 5,
}
```

### 5. Config Schema

Define complete config schemas for the properties panel:

```typescript
configSchema: {
  label: { type: 'string', label: 'Label', required: true },
  maxItems: { type: 'number', label: 'Max Items', defaultValue: 10 },
  required: { type: 'boolean', label: 'Required', defaultValue: false },
}
```

### 6. Preview Rendering

Previews should be non-interactive:

```typescript
renderPreview: (props) => (
  <input type="text" disabled value={props.label} />
)
```

### 7. Field Rendering

Fields should be fully functional:

```typescript
renderField: (props) => (
  <input 
    type="text" 
    name={props.name}
    defaultValue={props.defaultValue}
    required={props.required}
  />
)
```

---

## Troubleshooting

### Component not appearing in palette

1. Check if component is registered:
   ```typescript
   console.log(defaultRegistry.has('my-component'));
   ```

2. Check category:
   ```typescript
   console.log(defaultRegistry.getByCategory('advanced'));
   ```

3. Ensure registration happens before rendering:
   ```typescript
   // Register before rendering FormBuilder
   defaultRegistry.register(myComponent);
   ```

### Preview not rendering

1. Check renderPreview function returns valid JSX
2. Ensure props are passed correctly
3. Check for console errors

### Custom component not saving

1. Verify defaultProps includes all required fields
2. Check configSchema matches field properties
3. Ensure type matches between definition and usage

---

## Resources

- [API Reference](./api-reference.md)
- [Built-in Components](./built-in-components.md)
- [Custom Components Examples](./examples/custom-components.md)

---

## License

MIT © Nexus State Contributors
