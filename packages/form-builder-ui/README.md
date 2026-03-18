# @nexus-state/form-builder-ui

> **React UI components** for Nexus State Form Builder with drag-and-drop interface

[![npm version](https://img.shields.io/npm/v/@nexus-state/form-builder-ui.svg)](https://www.npmjs.com/package/@nexus-state/form-builder-ui)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 Overview

Form Builder UI provides ready-to-use React components for building visual form builders with drag-and-drop functionality.

**Features:**
- 🎨 Drag-and-Drop with @dnd-kit
- 📦 Built-in component palette
- ⚙️ Properties panel
- 👁️ Live field preview
- ♿ Accessibility support
- 🎯 TypeScript support
- 💅 CSS variables theming

---

## 📦 Installation

```bash
npm install @nexus-state/form-builder-ui @nexus-state/form-builder @nexus-state/react
```

**Peer dependencies:**
- `react` — ^17.0.0 || ^18.0.0 || ^19.0.0
- `react-dom` — ^17.0.0 || ^18.0.0 || ^19.0.0

---

## 🚀 Quick Start

### Basic Usage

```tsx
import { FormBuilder } from '@nexus-state/form-builder-ui';
import '@nexus-state/form-builder-ui/dist/styles.css';

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <FormBuilder />
    </div>
  );
}
```

### With Custom Configuration

```tsx
import { FormBuilder, Palette, Canvas, PropertiesPanel } from '@nexus-state/form-builder-ui';

function CustomBuilder() {
  return (
    <div className="form-builder">
      <Palette />
      <Canvas />
      <PropertiesPanel />
    </div>
  );
}
```

---

## 📖 Components

### FormBuilder

Main component that wraps the entire builder with DnD context.

```tsx
import { FormBuilder } from '@nexus-state/form-builder-ui';

<FormBuilder />
```

### Palette

Component palette with draggable items.

```tsx
import { Palette } from '@nexus-state/form-builder-ui';

<Palette />
```

### Canvas

Drop zone for form fields.

```tsx
import { Canvas } from '@nexus-state/form-builder-ui';

<Canvas />
```

### PropertiesPanel

Panel for editing field properties.

```tsx
import { PropertiesPanel } from '@nexus-state/form-builder-ui';

<PropertiesPanel />
```

### SortableField

Draggable and sortable field item.

```tsx
import { SortableField } from '@nexus-state/form-builder-ui';

<SortableField field={field} />
```

### FieldPreview

Preview of form field.

```tsx
import { FieldPreview } from '@nexus-state/form-builder-ui';

<FieldPreview field={field} />
```

---

## 🎨 Styling

### CSS Variables

The builder uses CSS variables for theming:

```css
:root {
  --fb-color-primary: #3b82f6;
  --fb-bg-primary: #ffffff;
  --fb-border-color: #e2e8f0;
  /* ... more variables */
}
```

### Custom Styles

Override default styles:

```css
.form-builder {
  --fb-color-primary: #your-color;
}

.palette-item {
  /* Custom palette item styles */
}
```

---

## 🔧 Customization

### Custom Components

Register custom components in the registry:

```tsx
import { defaultRegistry } from '@nexus-state/form-builder';

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

---

## 📚 Resources

- [Nexus State Documentation](https://nexus-state.dev/)
- [GitHub Repository](https://github.com/eustatos/nexus-state)
- [@dnd-kit Documentation](https://dndkit.com/)

---

## 🔗 See Also

- **Core:** [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) — Foundation (atoms, stores)
- **Forms:**
  - [@nexus-state/form](https://www.npmjs.com/package/@nexus-state/form) — Form management
  - [@nexus-state/form-builder-react](https://www.npmjs.com/package/@nexus-state/form-builder-react) — Form builder React components
  - [@nexus-state/form-schema-zod](https://www.npmjs.com/package/@nexus-state/form-schema-zod) — Zod validation
  - [@nexus-state/form-schema-yup](https://www.npmjs.com/package/@nexus-state/form-schema-yup) — Yup validation
- **Framework integration:**
  - [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react) — React hooks

**Full ecosystem:** [Nexus State Packages](https://www.npmjs.com/org/nexus-state)

---

## 📄 License

MIT © Nexus State Contributors
