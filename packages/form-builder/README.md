# @nexus-state/form-builder

> **Visual form builder** for Nexus State with drag-and-drop interface

[![npm version](https://img.shields.io/npm/v/@nexus-state/form-builder.svg)](https://www.npmjs.com/package/@nexus-state/form-builder)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 Overview

Form Builder is a visual drag-and-drop interface for creating forms without code. Build forms visually, configure fields, and export production-ready React code.

**Features:**
- 🎨 Drag-and-Drop interface
- 📦 Component Registry with built-in components
- ⚙️ Properties Panel for configuration
- 👁️ Live Preview with validation
- 💾 Export to React/Vue/Svelte code
- ↶ Undo/Redo with Time Travel
- 🎯 TypeScript support
- ♿ Accessibility-friendly

---

## 📦 Installation

```bash
npm install @nexus-state/form-builder @nexus-state/core @nexus-state/form
```

**Peer dependencies:**
- `react` — for UI components (optional)

---

## 🚀 Quick Start

### Basic Usage

```tsx
import { builderAtom, builderActions, defaultRegistry, builtInComponents } from '@nexus-state/form-builder';
import { useAtom } from '@nexus-state/react';

// Register built-in components
defaultRegistry.registerMany(builtInComponents);

// Use in component
function FormBuilderApp() {
  const [state] = useAtom(builderAtom);

  // Add a field
  const addField = () => {
    builderActions.addField({
      id: `field_${Date.now()}`,
      type: 'text',
      name: 'username',
      label: 'Username',
      required: false,
    });
  };

  return (
    <div>
      <button onClick={addField}>Add Field</button>
      <p>Current fields: {state.schema.fields.length}</p>
    </div>
  );
}
```

---

## 📖 API Reference

### Schema Types

```typescript
interface FormSchema {
  id: string;
  title: string;
  description?: string;
  fields: FieldSchema[];
  metadata?: {
    version?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

interface FieldSchema {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: unknown;
  required?: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];
  conditional?: ConditionalLogic;
}
```

### Builder State

```typescript
interface BuilderState {
  schema: FormSchema;
  selectedFieldId: string | null;
  history: {
    past: FormSchema[];
    present: FormSchema;
    future: FormSchema[];
  };
  isDirty: boolean;
  isPreviewMode: boolean;
}
```

### Builder Actions

```typescript
// Add field
builderActions.addField(field: FieldSchema);

// Remove field
builderActions.removeField(fieldId: string);

// Update field
builderActions.updateField(fieldId: string, updates: Partial<FieldSchema>);

// Reorder fields
builderActions.reorderFields(fromIndex: number, toIndex: number);

// Select field
builderActions.selectField(fieldId: string | null);

// Undo/Redo
builderActions.undo();
builderActions.redo();

// Save
builderActions.save();

// Reset
builderActions.reset();
```

### Component Registry

```typescript
import { defaultRegistry, builtInComponents } from '@nexus-state/form-builder';

// Register built-in components
defaultRegistry.registerMany(builtInComponents);

// Get component
const textInput = defaultRegistry.get('text');

// Get by category
const inputComponents = defaultRegistry.getByCategory('input');

// Register custom component
defaultRegistry.register({
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

### Code Generator

```typescript
import { generateCode } from '@nexus-state/form-builder/export';

const code = generateCode(schema, {
  framework: 'react',
  typescript: true,
  schemaLibrary: 'zod',
  styling: 'css',
});

// Download files
code.files.forEach(file => {
  downloadFile(file.path, file.content);
});
```

---

## 📝 Examples

### Creating a Form Programmatically

```typescript
import { builderActions, createDefaultFormSchema } from '@nexus-state/form-builder';

// Create form
builderActions.setSchema({
  id: 'contact-form',
  title: 'Contact Form',
  fields: [
    {
      id: 'field_name',
      type: 'text',
      name: 'name',
      label: 'Name',
      required: true,
    },
    {
      id: 'field_email',
      type: 'email',
      name: 'email',
      label: 'Email',
      required: true,
    },
    {
      id: 'field_message',
      type: 'textarea',
      name: 'message',
      label: 'Message',
      required: true,
    },
  ],
});
```

### Adding Validation

```typescript
builderActions.addField({
  id: 'field_password',
  type: 'password',
  name: 'password',
  label: 'Password',
  required: true,
  validation: [
    { type: 'minLength', params: { length: 8 } },
    { type: 'pattern', params: { pattern: '.*[A-Z].*' }, message: 'Need uppercase' },
  ],
});
```

### Conditional Fields

```typescript
builderActions.addField({
  id: 'field_shipping',
  type: 'text',
  name: 'shippingAddress',
  label: 'Shipping Address',
  conditional: {
    field: 'needsShipping',
    operator: 'equals',
    value: true,
  },
});
```

---

## 🔧 Built-in Components

### Input Components
- Text Input
- Email Input
- Number Input
- Password Input
- Textarea

### Select Components
- Select Dropdown
- Radio Group
- Checkbox

---

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│            Form Builder                  │
├─────────────────────────────────────────┤
│  ┌────────────┐  ┌──────────────┐      │
│  │  Palette   │  │    Canvas    │      │
│  │(Components)│  │  (Drop Zone) │      │
│  └────────────┘  └──────────────┘      │
│                                         │
│  ┌────────────┐  ┌──────────────┐      │
│  │ Properties │  │    Preview   │      │
│  │   Panel    │  │              │      │
│  └────────────┘  └──────────────┘      │
└─────────────────────────────────────────┘
```

---

## 📚 Resources

- [Nexus State Documentation](https://nexus-state.dev/)
- [GitHub Repository](https://github.com/eustatos/nexus-state)

---

## 📄 License

MIT © Nexus State Contributors
