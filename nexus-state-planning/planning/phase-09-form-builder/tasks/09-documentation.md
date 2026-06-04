# Task 09: Documentation

**Приоритет:** High  
**Оценка:** 3-5 дней  
**Статус:** Todo

---

## Цель

Создать полную документацию для Form Builder.

---

## Scope

### 1. README.md

```markdown
# @nexus-state/form-builder

Visual form builder for creating forms without code.

## Features

- 🎨 Drag-and-Drop interface
- 📦 Component Registry with built-in components
- ⚙️ Properties Panel for configuration
- 👁️ Live Preview with validation
- 💾 Export to React/Vue/Svelte code
- ↶ Undo/Redo with Time Travel
- 🎯 TypeScript support
- ♿ Accessibility-friendly

## Installation

\`\`\`bash
npm install @nexus-state/form-builder @nexus-state/form-builder-ui
\`\`\`

## Quick Start

\`\`\`tsx
import { FormBuilder } from '@nexus-state/form-builder-ui';

function App() {
  return <FormBuilder />;
}
\`\`\`

## Documentation

- [Getting Started](docs/getting-started.md)
- [Component Registry](docs/component-registry.md)
- [Custom Components](docs/custom-components.md)
- [Export Options](docs/export-options.md)
- [API Reference](docs/api-reference.md)

## Examples

See [examples/](examples/) folder for complete examples.

## License

MIT
```

### 2. Getting Started Guide

```markdown
# Getting Started

## Installation

\`\`\`bash
npm install @nexus-state/form-builder @nexus-state/form-builder-ui
\`\`\`

## Basic Usage

1. Import the FormBuilder component
2. Render it in your app
3. Start building forms visually

\`\`\`tsx
import { FormBuilder } from '@nexus-state/form-builder-ui';

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <FormBuilder />
    </div>
  );
}
\`\`\`

## Building Your First Form

1. **Add Fields**: Drag components from the Palette to the Canvas
2. **Configure**: Click on a field to edit its properties
3. **Preview**: See your form in real-time in the Preview panel
4. **Export**: Click Export to generate React code

## Next Steps

- [Learn about Component Registry](component-registry.md)
- [Create Custom Components](custom-components.md)
- [Explore Export Options](export-options.md)
```

### 3. Component Registry Guide

```markdown
# Component Registry

The Component Registry manages all available form components.

## Built-in Components

### Input Components
- Text Input
- Email Input
- Number Input
- Password Input
- Textarea
- Date Input
- File Upload

### Select Components
- Select Dropdown
- Radio Group
- Checkbox Group
- Multi-select

### Layout Components
- Section Header
- Divider
- Spacer

## Using the Registry

\`\`\`typescript
import { defaultRegistry } from '@nexus-state/form-builder';

// Get all components
const components = defaultRegistry.getAll();

// Get by category
const inputComponents = defaultRegistry.getByCategory('input');

// Get specific component
const textInput = defaultRegistry.get('text');
\`\`\`

## Next: [Create Custom Components](custom-components.md)
```

### 4. Custom Components Guide

```markdown
# Custom Components

Create your own form components.

## Component Definition

\`\`\`typescript
import { ComponentDefinition } from '@nexus-state/form-builder';

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
\`\`\`

## Register Component

\`\`\`typescript
import { defaultRegistry } from '@nexus-state/form-builder';

defaultRegistry.register(customComponent);
\`\`\`

## Best Practices

1. Use unique type names
2. Provide clear labels and icons
3. Define comprehensive config schema
4. Ensure preview is non-interactive
5. Make field fully functional
```

### 5. API Reference

```markdown
# API Reference

## ComponentRegistry

### Methods

#### register(definition: ComponentDefinition): void
Register a new component.

#### get(type: string): ComponentDefinition | undefined
Get component by type.

#### getAll(): ComponentDefinition[]
Get all registered components.

#### getByCategory(category: ComponentCategory): ComponentDefinition[]
Get components by category.

## builderActions

### addField(field: FieldSchema): void
Add a field to the form.

### removeField(fieldId: string): void
Remove a field from the form.

### updateField(fieldId: string, updates: Partial<FieldSchema>): void
Update field properties.

### reorderFields(fromIndex: number, toIndex: number): void
Reorder fields.

### undo(): void
Undo last action.

### redo(): void
Redo last undone action.

## generateCode(schema: FormSchema, options: CodeGeneratorOptions): GeneratedCode
Generate code from schema.
```

---

## Implementation Plan

1. **README** (0.5 дня)
   - Overview
   - Features
   - Quick start
   - Links to docs

2. **Getting Started** (0.5 дня)
   - Installation
   - Basic usage
   - First form tutorial

3. **Component Registry** (1 день)
   - Built-in components list
   - Registry API
   - Usage examples

4. **Custom Components** (1 день)
   - Component definition
   - Registration
   - Best practices
   - Examples

5. **API Reference** (1 день)
   - All public APIs
   - Type definitions
   - Examples

6. **Export Options** (0.5 дня)
   - Framework options
   - Schema libraries
   - Styling options

---

## Acceptance Criteria

- [ ] README complete и информативный
- [ ] Getting Started guide понятен новичкам
- [ ] Component Registry документирован
- [ ] Custom Components guide с примерами
- [ ] API Reference полный
- [ ] Все примеры работают

---

## Dependencies

- All previous tasks

---

## Notes

- Использовать screenshots где возможно
- Добавить CodeSandbox demos
- Включить troubleshooting секцию
- Добавить FAQ
