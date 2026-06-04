# Часть 5: Form Builder

**Целевая длина:** 2500-3000 слов (~10-12 минут чтения)  
**Статус:** 📝 Draft  
**Дата создания:** Март 2026

---

## 🎯 Цели статьи

1. Показать архитектуру Form Builder
2. Реализовать Drag-and-Drop интерфейс
3. Создать Component Registry для кастомных полей
4. Реализовать Live Preview
5. Генерировать код из схемы (Export to Code)
6. Интегрировать Undo/Redo с Time Travel

---

## 📋 Детальная структура

### Введение (150-200 слов)

**Recap Частей 1-4:**
- Части 1-2: Foundations, UX, Accessibility
- Части 3-4: Advanced Patterns, Validation, Persistence

**Зачем нужен Form Builder:**
- Ускорение разработки форм
- Визуальное проектирование
- Консистентность UI/UX
- Снижение порога входа

**Use cases:**
- Admin панели
- CMS системы
- Survey/Quiz платформы
- Low-code/No-code инструменты

**Что будет в статье:**
- Schema-driven архитектура
- Drag-and-Drop интерфейс
- Component Registry
- Live Preview
- Export to Code
- Undo/Redo

---

### 1. Builder Architecture (500-550 слов)

#### 1.1. Schema-driven подход

**Концепция:**
Форма описывается декларативной схемой

**Пример схемы:**
```typescript
interface FormSchema {
  id: string;
  title: string;
  fields: FieldSchema[];
  validation?: ValidationSchema;
  layout?: LayoutConfig;
}

interface FieldSchema {
  id: string;
  type: 'text' | 'email' | 'select' | 'checkbox' | 'textarea' | 'custom';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: FieldValidation;
  props?: Record<string, any>;
}

// Пример
const contactFormSchema: FormSchema = {
  id: 'contact-form',
  title: 'Contact Us',
  fields: [
    {
      id: 'name',
      type: 'text',
      label: 'Name',
      required: true,
      validation: { minLength: 2 }
    },
    {
      id: 'email',
      type: 'email',
      label: 'Email',
      required: true
    },
    {
      id: 'message',
      type: 'textarea',
      label: 'Message',
      props: { rows: 5 }
    }
  ]
};
```

#### 1.2. Component Model

**Архитектура:**
```
FormBuilder
├── Canvas (Drag-and-Drop area)
├── Sidebar (Component palette)
├── Properties Panel (Field configuration)
├── Preview (Live preview)
└── Code Export (Generated code)
```

**State Management:**
```typescript
interface BuilderState {
  schema: FormSchema;
  selectedFieldId: string | null;
  history: FormSchema[];
  historyIndex: number;
  previewMode: boolean;
}

const builderAtom = createAtom<BuilderState>({
  schema: { id: '', title: '', fields: [] },
  selectedFieldId: null,
  history: [],
  historyIndex: -1,
  previewMode: false
});
```

#### 1.3. Builder Actions

```typescript
interface BuilderActions {
  // Field operations
  addField: (field: FieldSchema, index?: number) => void;
  removeField: (fieldId: string) => void;
  updateField: (fieldId: string, updates: Partial<FieldSchema>) => void;
  moveField: (fromIndex: number, toIndex: number) => void;
  
  // Selection
  selectField: (fieldId: string | null) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  
  // Preview
  togglePreview: () => void;
  
  // Export
  exportToCode: (format: 'react' | 'vue' | 'html') => string;
  exportToJSON: () => string;
}
```

#### 1.4. Преимущества Schema-driven

| Преимущество | Описание |
|--------------|----------|
| **Serialization** | Легко сохранить/загрузить |
| **Validation** | Валидация схемы перед рендером |
| **Versioning** | История изменений |
| **Code Generation** | Генерация кода из схемы |
| **Platform-agnostic** | Одна схема для разных фреймворков |

---

### 2. Drag-and-Drop (600-650 слов)

#### 2.1. Выбор библиотеки

**Популярные варианты:**
- **react-dnd** — гибкая, низкоуровневая
- **dnd-kit** — современная, accessibility-friendly
- **react-beautiful-dnd** — простая, красивая (deprecated)

**Рекомендация: dnd-kit**
- ✅ Accessibility из коробки
- ✅ Touch support
- ✅ Хорошая производительность
- ✅ Активная разработка

#### 2.2. Базовая реализация

**Компонент Canvas:**
```typescript
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function FormCanvas({ schema, onFieldMove }: FormCanvasProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = schema.fields.findIndex(f => f.id === active.id);
      const newIndex = schema.fields.findIndex(f => f.id === over.id);
      onFieldMove(oldIndex, newIndex);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext 
        items={schema.fields.map(f => f.id)} 
        strategy={verticalListSortingStrategy}
      >
        <div className="canvas">
          {schema.fields.map((field) => (
            <SortableField key={field.id} field={field} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

**Sortable Field:**
```typescript
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableField({ field }: { field: FieldSchema }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <FieldPreview field={field} />
    </div>
  );
}
```

#### 2.3. Component Palette (Sidebar)

```typescript
function ComponentPalette({ onAddField }: ComponentPaletteProps) {
  const fieldTypes: Array<{ type: FieldSchema['type']; label: string; icon: string }> = [
    { type: 'text', label: 'Text Input', icon: '📝' },
    { type: 'email', label: 'Email', icon: '📧' },
    { type: 'select', label: 'Select', icon: '📋' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { type: 'textarea', label: 'Textarea', icon: '📄' }
  ];

  const handleAddField = (type: FieldSchema['type']) => {
    const newField: FieldSchema = {
      id: generateId(),
      type,
      label: `New ${type} field`,
      required: false
    };
    onAddField(newField);
  };

  return (
    <div className="palette">
      <h3>Components</h3>
      {fieldTypes.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => handleAddField(type)}
          className="palette-item"
        >
          <span className="icon">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
```

#### 2.4. Properties Panel

```typescript
function PropertiesPanel({ 
  field, 
  onUpdate 
}: PropertiesPanelProps) {
  if (!field) {
    return <div className="properties-panel">Select a field to edit</div>;
  }

  return (
    <div className="properties-panel">
      <h3>Field Properties</h3>
      
      <div className="property">
        <label>Label</label>
        <input
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
        />
      </div>

      <div className="property">
        <label>Placeholder</label>
        <input
          value={field.placeholder || ''}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
        />
      </div>

      <div className="property">
        <label>
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
          />
          Required
        </label>
      </div>

      {field.type === 'text' && (
        <div className="property">
          <label>Min Length</label>
          <input
            type="number"
            value={field.validation?.minLength || ''}
            onChange={(e) => onUpdate({
              validation: { ...field.validation, minLength: Number(e.target.value) }
            })}
          />
        </div>
      )}
    </div>
  );
}
```

---

### 3. Component Registry (400-450 слов)

#### 3.1. Registry Pattern

**Концепция:**
Регистрация кастомных компонентов для использования в builder

**Интерфейс:**
```typescript
interface ComponentDefinition {
  type: string;
  label: string;
  icon: string;
  defaultProps: Record<string, any>;
  propertiesSchema: PropertySchema[];
  render: (props: any) => React.ReactNode;
}

interface PropertySchema {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: Array<{ value: any; label: string }>;
}
```

#### 3.2. Registry Implementation

```typescript
class ComponentRegistry {
  private components = new Map<string, ComponentDefinition>();

  register(definition: ComponentDefinition) {
    this.components.set(definition.type, definition);
  }

  get(type: string): ComponentDefinition | undefined {
    return this.components.get(type);
  }

  getAll(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  render(field: FieldSchema): React.ReactNode {
    const component = this.get(field.type);
    if (!component) {
      throw new Error(`Component type "${field.type}" not registered`);
    }
    return component.render({ ...component.defaultProps, ...field.props });
  }
}

export const registry = new ComponentRegistry();
```

#### 3.3. Регистрация кастомных компонентов

```typescript
// Регистрация Rating компонента
registry.register({
  type: 'rating',
  label: 'Rating',
  icon: '⭐',
  defaultProps: {
    max: 5,
    value: 0
  },
  propertiesSchema: [
    {
      name: 'max',
      label: 'Max Rating',
      type: 'number'
    }
  ],
  render: (props) => <RatingComponent {...props} />
});

// Регистрация Date Picker
registry.register({
  type: 'datepicker',
  label: 'Date Picker',
  icon: '📅',
  defaultProps: {
    format: 'YYYY-MM-DD'
  },
  propertiesSchema: [
    {
      name: 'format',
      label: 'Date Format',
      type: 'select',
      options: [
        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }
      ]
    }
  ],
  render: (props) => <DatePickerComponent {...props} />
});
```

#### 3.4. Использование в Builder

```typescript
function FormBuilder() {
  const availableComponents = registry.getAll();

  return (
    <div className="builder">
      <ComponentPalette components={availableComponents} />
      <Canvas registry={registry} />
    </div>
  );
}
```

---

### 4. Live Preview (350-400 слов)

#### 4.1. Preview Component

```typescript
function LivePreview({ schema }: { schema: FormSchema }) {
  const formAtom = useMemo(
    () => createFormAtom(schemaToZod(schema), getInitialValues(schema)),
    [schema]
  );

  const [formState] = useAtom(formAtom);

  return (
    <div className="preview">
      <h2>{schema.title}</h2>
      <form>
        {schema.fields.map((field) => (
          <div key={field.id} className="field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            {registry.render(field)}
            {formState.errors[field.id] && (
              <span className="error">{formState.errors[field.id]}</span>
            )}
          </div>
        ))}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
```

#### 4.2. Real-time Sync

**Проблема:**
Изменения в builder должны мгновенно отражаться в preview

**Решение:**
```typescript
function FormBuilder() {
  const [schema, setSchema] = useState<FormSchema>(initialSchema);

  // Debounce для производительности
  const debouncedSchema = useDebounce(schema, 300);

  return (
    <div className="builder-layout">
      <Canvas schema={schema} onChange={setSchema} />
      <LivePreview schema={debouncedSchema} />
    </div>
  );
}
```

---

### 5. Export to Code (500-550 слов)

#### 5.1. Code Generation Strategy

**Цель:**
Генерировать готовый к использованию код из схемы

**Форматы:**
- React (TypeScript/JavaScript)
- Vue
- HTML + Vanilla JS

#### 5.2. React Code Generator

```typescript
function generateReactCode(schema: FormSchema): string {
  const imports = `
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
`;

  const zodSchema = generateZodSchema(schema);
  
  const component = `
export function ${toPascalCase(schema.id)}() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2>${schema.title}</h2>
      ${schema.fields.map(field => generateFieldCode(field)).join('\n      ')}
      <button type="submit">Submit</button>
    </form>
  );
}
`;

  return imports + '\n' + zodSchema + '\n' + component;
}

function generateZodSchema(schema: FormSchema): string {
  const fields = schema.fields.map(field => {
    let validation = `z.string()`;
    
    if (field.type === 'email') {
      validation += `.email()`;
    }
    
    if (field.validation?.minLength) {
      validation += `.min(${field.validation.minLength})`;
    }
    
    if (!field.required) {
      validation += `.optional()`;
    }
    
    return `  ${field.id}: ${validation}`;
  }).join(',\n');

  return `
const schema = z.object({
${fields}
});
`;
}

function generateFieldCode(field: FieldSchema): string {
  return `
<div className="field">
  <label htmlFor="${field.id}">
    ${field.label}
    ${field.required ? '<span className="required">*</span>' : ''}
  </label>
  <input
    id="${field.id}"
    type="${field.type}"
    ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
    {...register('${field.id}')}
  />
  {errors.${field.id} && <span className="error">{errors.${field.id}.message}</span>}
</div>`;
}
```

#### 5.3. Export UI

```typescript
function ExportPanel({ schema }: { schema: FormSchema }) {
  const [format, setFormat] = useState<'react' | 'vue' | 'html'>('react');
  const [code, setCode] = useState('');

  const handleExport = () => {
    const generated = format === 'react' 
      ? generateReactCode(schema)
      : format === 'vue'
      ? generateVueCode(schema)
      : generateHTMLCode(schema);
    
    setCode(generated);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="export-panel">
      <div className="export-controls">
        <select value={format} onChange={(e) => setFormat(e.target.value as any)}>
          <option value="react">React</option>
          <option value="vue">Vue</option>
          <option value="html">HTML</option>
        </select>
        <button onClick={handleExport}>Generate Code</button>
        <button onClick={handleCopy} disabled={!code}>Copy</button>
      </div>
      
      {code && (
        <pre className="code-preview">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
```

---

### 6. Undo/Redo с Time Travel (400-450 слов)

#### 6.1. History Management

```typescript
interface HistoryState {
  past: FormSchema[];
  present: FormSchema;
  future: FormSchema[];
}

function useHistory(initialState: FormSchema) {
  const [state, setState] = useState<HistoryState>({
    past: [],
    present: initialState,
    future: []
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const set = (newPresent: FormSchema) => {
    setState({
      past: [...state.past, state.present],
      present: newPresent,
      future: []
    });
  };

  const undo = () => {
    if (!canUndo) return;

    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, state.past.length - 1);

    setState({
      past: newPast,
      present: previous,
      future: [state.present, ...state.future]
    });
  };

  const redo = () => {
    if (!canRedo) return;

    const next = state.future[0];
    const newFuture = state.future.slice(1);

    setState({
      past: [...state.past, state.present],
      present: next,
      future: newFuture
    });
  };

  return { state: state.present, set, undo, redo, canUndo, canRedo };
}
```

#### 6.2. Integration с @nexus-state/form

```typescript
const builderAtom = createAtom<FormSchema>(initialSchema, {
  timeTravel: true,
  maxHistory: 50
});

// Автоматически:
// - История изменений
// - Undo/Redo
// - Time Travel DevTools
```

#### 6.3. UI Controls

```typescript
function HistoryControls() {
  const { undo, redo, canUndo, canRedo } = useHistory();

  return (
    <div className="history-controls">
      <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        ↶ Undo
      </button>
      <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
        ↷ Redo
      </button>
    </div>
  );
}

// Keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key === 'z' && e.shiftKey || e.key === 'y') {
        e.preventDefault();
        redo();
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [undo, redo]);
```

---

### 7. Заключение (150-200 слов)

#### Ключевые выводы

1. **Schema-driven Architecture:**
   - Декларативное описание форм
   - Легкая сериализация и версионирование

2. **Drag-and-Drop:**
   - dnd-kit для accessibility
   - Sortable fields

3. **Component Registry:**
   - Расширяемость через кастомные компоненты
   - Registry pattern

4. **Live Preview:**
   - Real-time sync
   - Debouncing для производительности

5. **Export to Code:**
   - Генерация React/Vue/HTML
   - Production-ready код

6. **Undo/Redo:**
   - History management
   - Time Travel integration

#### Что дальше

В **Части 6** (финальной) мы рассмотрим:
- DSL для валидации
- Parser Implementation
- Query Integration
- Real-world Examples
- Итоги всей серии

#### Ссылки

- [dnd-kit Documentation](https://docs.dndkit.com/)
- [Time Travel Part 3](../../article-time-travel/part-03.md) — Undo/Redo implementation

---

## 📊 Метрики

**Целевые показатели для dev.to:**
- Время чтения: 10-12 минут
- Engagement rate: >75%
- Reactions: >60
- Comments: >12

**SEO ключевые слова:**
- Form builder React
- Drag and drop forms
- Visual form designer
- Code generation
- Component registry
- Form schema

---

## ✅ Чек-лист перед публикацией

- [ ] Все примеры кода проверены
- [ ] dnd-kit примеры актуальны
- [ ] Code generation работает
- [ ] Ссылки добавлены
- [ ] SEO оптимизация
- [ ] Вычитка
- [ ] Проверка длины (2500-3000 слов)
- [ ] Cover image
