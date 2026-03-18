# @nexus-state/form-builder-react

> **React UI components** for Nexus State Form Builder

[![npm version](https://img.shields.io/npm/v/@nexus-state/form-builder-react.svg)](https://www.npmjs.com/package/@nexus-state/form-builder-react)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 Overview

React UI components for the Nexus State Form Builder. Provides drag-and-drop interface, canvas, palette, and properties panel for visual form building.

**Features:**
- 🎨 Drag-and-Drop interface
- 📦 Component Registry with built-in React components
- ⚙️ Properties Panel for configuration
- 👁️ Live Preview with validation
- 🎯 TypeScript support
- ♿ Accessibility-friendly

---

## 📦 Installation

```bash
npm install @nexus-state/form-builder-react @nexus-state/core @nexus-state/form
```

**Peer dependencies:**
- `react` — for UI components (optional)
- `react-dom` — for React DOM rendering

---

## 🚀 Quick Start

### Basic Usage

```tsx
import { builderAtom, builderActions, defaultRegistry, builtInComponents } from '@nexus-state/form-builder-react';
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

### Core Exports (from form-builder-core)

All exports from `@nexus-state/form-builder-core` are available:
- `builderAtom`, `builderActions`, `builderSelectors`
- `defaultRegistry`, `ComponentRegistry`
- `generateCode`, `validateFieldSchema`, etc.

### React-Specific Exports

```typescript
import { builtInComponents } from '@nexus-state/form-builder-react';

// Built-in React components
const components = builtInComponents;
```

---

## 📊 Architecture

```
@nexus-state/form-builder-core/      # Framework-agnostic core
├── schema/                          # Types and validation
├── registry/                        # Component registry
├── state/                           # Builder state
├── export/                          # Code generator
└── utils/                           # Utility functions

@nexus-state/form-builder-react/     # React adapter
├── registry/built-in-components.tsx # React components
└── index.ts                         # React exports
```

---

## 📚 Resources

- [Nexus State Documentation](https://nexus-state.dev/)
- [GitHub Repository](https://github.com/eustatos/nexus-state)
- [Examples](https://github.com/eustatos/nexus-state/tree/main/apps/form-builder-examples)

---

## 🔗 See Also

- **Core:** [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) — Foundation (atoms, stores)
- **Forms:**
  - [@nexus-state/form](https://www.npmjs.com/package/@nexus-state/form) — Form management
  - [@nexus-state/form-schema-zod](https://www.npmjs.com/package/@nexus-state/form-schema-zod) — Zod validation
  - [@nexus-state/form-schema-yup](https://www.npmjs.com/package/@nexus-state/form-schema-yup) — Yup validation
- **Framework integration:**
  - [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react) — React hooks

**Full ecosystem:** [Nexus State Packages](https://www.npmjs.com/org/nexus-state)

---

## 📄 License

MIT © Nexus State Contributors
