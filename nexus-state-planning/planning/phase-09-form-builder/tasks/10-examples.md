# Task 10: Examples

**Приоритет:** Medium  
**Оценка:** 3-5 дней  
**Статус:** Todo

---

## Цель

Создать рабочие примеры использования Form Builder.

---

## Scope

### 1. Basic Example

```
examples/01-basic/
├── package.json
├── src/
│   ├── App.tsx
│   └── index.tsx
└── README.md
```

**App.tsx:**
```tsx
import { FormBuilder } from '@nexus-state/form-builder-ui';
import '@nexus-state/form-builder-ui/dist/styles.css';

export default function App() {
  return (
    <div style={{ height: '100vh' }}>
      <FormBuilder />
    </div>
  );
}
```

### 2. Custom Components Example

```
examples/02-custom-components/
├── package.json
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── StarRating.tsx
│   │   └── ColorPicker.tsx
│   └── index.tsx
└── README.md
```

**StarRating.tsx:**
```tsx
import { ComponentDefinition } from '@nexus-state/form-builder';

export const starRatingComponent: ComponentDefinition = {
  type: 'star-rating',
  label: 'Star Rating',
  icon: '⭐',
  category: 'advanced',
  defaultProps: {
    type: 'star-rating',
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
  renderField: (props) => {
    const [rating, setRating] = useState(0);
    return (
      <div className="star-rating">
        {Array.from({ length: props.maxStars }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i + 1)}
            className={i < rating ? 'active' : ''}
          >
            ⭐
          </button>
        ))}
      </div>
    );
  },
};
```

### 3. Export Integration Example

```
examples/03-export-integration/
├── package.json
├── src/
│   ├── App.tsx
│   ├── FormBuilderWithExport.tsx
│   └── index.tsx
└── README.md
```

**FormBuilderWithExport.tsx:**
```tsx
import { useState } from 'react';
import { FormBuilder } from '@nexus-state/form-builder-ui';
import { generateCode } from '@nexus-state/form-builder';
import { useAtom } from '@nexus-state/react';
import { builderAtom } from '@nexus-state/form-builder';

export function FormBuilderWithExport() {
  const [state] = useAtom(builderAtom);
  const [showExport, setShowExport] = useState(false);

  const handleExport = () => {
    const code = generateCode(state.schema, {
      framework: 'react',
      typescript: true,
      schemaLibrary: 'zod',
      styling: 'css',
    });

    // Download code
    const blob = new Blob([code.files[0].content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = code.files[0].path;
    a.click();
  };

  return (
    <div>
      <div className="toolbar">
        <button onClick={handleExport}>Export Code</button>
      </div>
      <FormBuilder />
    </div>
  );
}
```

### 4. Persistence Example

```
examples/04-persistence/
├── package.json
├── src/
│   ├── App.tsx
│   ├── FormBuilderWithPersistence.tsx
│   └── index.tsx
└── README.md
```

**FormBuilderWithPersistence.tsx:**
```tsx
import { useEffect } from 'react';
import { FormBuilder } from '@nexus-state/form-builder-ui';
import { useAtom } from '@nexus-state/react';
import { builderAtom, builderActions } from '@nexus-state/form-builder';

const STORAGE_KEY = 'form-builder-state';

export function FormBuilderWithPersistence() {
  const [state] = useAtom(builderAtom);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const schema = JSON.parse(saved);
      builderActions.setSchema(schema);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.schema));
    }, 1000); // Debounce 1 second

    return () => clearTimeout(timeoutId);
  }, [state.schema]);

  return <FormBuilder />;
}
```

### 5. Full-featured Example

```
examples/05-full-featured/
├── package.json
├── src/
│   ├── App.tsx
│   ├── FormBuilderApp.tsx
│   ├── components/
│   │   ├── Toolbar.tsx
│   │   ├── ExportDialog.tsx
│   │   └── SaveDialog.tsx
│   └── index.tsx
└── README.md
```

**FormBuilderApp.tsx:**
```tsx
import { useState } from 'react';
import { FormBuilder } from '@nexus-state/form-builder-ui';
import { Toolbar } from './components/Toolbar';
import { ExportDialog } from './components/ExportDialog';
import { SaveDialog } from './components/SaveDialog';

export function FormBuilderApp() {
  const [showExport, setShowExport] = useState(false);
  const [showSave, setShowSave] = useState(false);

  return (
    <div className="form-builder-app">
      <Toolbar
        onExport={() => setShowExport(true)}
        onSave={() => setShowSave(true)}
      />
      <FormBuilder />
      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
      {showSave && <SaveDialog onClose={() => setShowSave(false)} />}
    </div>
  );
}
```

---

## Implementation Plan

1. **Setup Examples Structure** (0.5 дня)
   - Create examples/ folder
   - Setup package.json for each example
   - Configure build/dev scripts

2. **Basic Example** (0.5 дня)
   - Simple FormBuilder usage
   - README with instructions

3. **Custom Components** (1 день)
   - Star rating component
   - Color picker component
   - Registration example

4. **Export Integration** (1 день)
   - Export dialog
   - Code download
   - Copy to clipboard

5. **Persistence Example** (0.5 дня)
   - localStorage integration
   - Auto-save
   - Load on mount

6. **Full-featured Example** (1 день)
   - Complete app with toolbar
   - All features integrated
   - Production-ready structure

---

## Acceptance Criteria

- [ ] Все примеры работают и протестированы
- [ ] README для каждого примера
- [ ] Run scripts настроены
- [ ] CodeSandbox links добавлены
- [ ] Examples покрывают основные use cases

---

## Dependencies

- All previous tasks

---

## Notes

- Примеры должны быть self-contained
- Использовать реальные use cases
- Добавить screenshots где возможно
- Включить troubleshooting tips
