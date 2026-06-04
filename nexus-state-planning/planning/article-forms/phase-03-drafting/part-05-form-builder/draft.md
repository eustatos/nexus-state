# Forms в Nexus State: Часть 5 — Form Builder

**Статус:** 🚧 In Progress  
**Целевая длина:** 2500-3000 слов  
**Время чтения:** 10-12 минут

---

## Метаданные для dev.to

**Title:** Forms в Nexus State: Часть 5 — Form Builder  
**Tags:** react, forms, dragdrop, typescript  
**Series:** Forms в Nexus State  
**Published:** false

---

## Введение

В предыдущих частях мы прошли путь от foundations до advanced patterns:
- [Часть 1](../part-01-foundations-patterns/draft.md): Controlled vs Uncontrolled, Validation, Libraries
- [Часть 2](../part-02-ux-accessibility/draft.md): Error Handling, Accessibility, Performance
- [Часть 3](../part-03-advanced-patterns-1/draft.md): Multi-step Forms, Dynamic Forms, Form Arrays
- [Часть 4](../part-04-advanced-patterns-2/draft.md): Cross-field Validation, Async Validation, Persistence

В этой пятой части мы создадим **Form Builder** — визуальный инструмент для создания форм без кода:
- **Schema-driven Architecture** — формы из JSON схем
- **Drag-and-Drop** — визуальное построение форм
- **Component Registry** — переиспользуемые компоненты
- **Live Preview** — мгновенный предпросмотр
- **Export to Code** — генерация React кода
- **Undo/Redo** — Time Travel для истории изменений

---

## 1. Builder Architecture

Form Builder — это no-code инструмент для создания форм визуально.

### Что такое Form Builder

**Определение:**
Визуальный редактор для создания форм без написания кода.

**Use cases:**
- **No-code платформы:** пользователи создают формы без программирования
- **Rapid prototyping:** быстрое прототипирование форм
- **CMS системы:** создание кастомных форм для контента
- **Admin панели:** динамические формы для настроек

### Архитектура

```
┌─────────────────────────────────────────────────┐
│                  Form Builder                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   Palette    │  │   Canvas     │            │
│  │  (Components)│  │  (Drop Zone) │            │
│  └──────────────┘  └──────────────┘            │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  Properties  │  │    Preview   │            │
│  │    Panel     │  │              │            │
│  └──────────────┘  └──────────────┘            │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │         Schema (JSON)                     │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Core Concepts

**1. Schema:**
JSON представление формы

```typescript
interface FormSchema {
  id: string;
  title: string;
  fields: FieldSchema[];
}

interface FieldSchema {
  id: string;
  type: 'text' | 'email' | 'number' | 'select' | 'checkbox';
  label: string;
  name: string;
  required?: boolean;
  validation?: ValidationRule[];
  options?: Array<{ value: string; label: string }>;
}
```

**2. Component Registry:**
Доступные компоненты для построения

```typescript
interface ComponentDefinition {
  type: string;
  label: string;
  icon: string;
  defaultProps: Partial<FieldSchema>;
  configSchema: ConfigSchema;
}

const componentRegistry: ComponentDefinition[] = [
  {
    type: 'text',
    label: 'Text Input',
    icon: '📝',
    defaultProps: {
      type: 'text',
      label: 'Text Field',
      required: false
    },
    configSchema: {
      label: { type: 'string', label: 'Label' },
      placeholder: { type: 'string', label: 'Placeholder' },
      required: { type: 'boolean', label: 'Required' }
    }
  },
  // ... other components
];
```

**3. Builder State:**
Текущее состояние редактора

```typescript
interface BuilderState {
  schema: FormSchema;
  selectedFieldId: string | null;
  history: FormSchema[];
  historyIndex: number;
}
```

### State Management

```typescript
import { atom } from '@nexus-state/core';

const builderAtom = atom<BuilderState>({
  schema: {
    id: 'form-1',
    title: 'New Form',
    fields: []
  },
  selectedFieldId: null,
  history: [],
  historyIndex: -1
});

// Actions
const addField = (field: FieldSchema) => {
  builderAtom.update((state) => ({
    ...state,
    schema: {
      ...state.schema,
      fields: [...state.schema.fields, field]
    }
  }));
};

const removeField = (fieldId: string) => {
  builderAtom.update((state) => ({
    ...state,
    schema: {
      ...state.schema,
      fields: state.schema.fields.filter(f => f.id !== fieldId)
    }
  }));
};

const updateField = (fieldId: string, updates: Partial<FieldSchema>) => {
  builderAtom.update((state) => ({
    ...state,
    schema: {
      ...state.schema,
      fields: state.schema.fields.map(f =>
        f.id === fieldId ? { ...f, ...updates } : f
      )
    }
  }));
};
```

---

## 2. Drag-and-Drop

Drag-and-Drop — ключевая функция Form Builder для интуитивного построения форм.

### dnd-kit Integration

Используем @dnd-kit — современную библиотеку для drag-and-drop в React.

**Установка:**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Palette (Draggable Components)

```tsx
import { useDraggable } from '@dnd-kit/core';

function PaletteItem({ component }: { component: ComponentDefinition }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `palette-${component.type}`,
    data: { component }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="palette-item"
    >
      <span className="icon">{component.icon}</span>
      <span className="label">{component.label}</span>
    </div>
  );
}

function Palette() {
  return (
    <div className="palette">
      <h3>Components</h3>
      {componentRegistry.map((component) => (
        <PaletteItem key={component.type} component={component} />
      ))}
    </div>
  );
}
```

### Canvas (Drop Zone)

```tsx
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function Canvas() {
  const [builderState] = useAtom(builderAtom);
  const { setNodeRef } = useDroppable({ id: 'canvas' });

  return (
    <div ref={setNodeRef} className="canvas">
      <h2>{builderState.schema.title}</h2>
      
      <SortableContext
        items={builderState.schema.fields.map(f => f.id)}
        strategy={verticalListSortingStrategy}
      >
        {builderState.schema.fields.map((field) => (
          <SortableField key={field.id} field={field} />
        ))}
      </SortableContext>
      
      {builderState.schema.fields.length === 0 && (
        <div className="empty-state">
          Drag components here to build your form
        </div>
      )}
    </div>
  );
}
```

### Sortable Field

```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableField({ field }: { field: FieldSchema }) {
  const [builderState] = useAtom(builderAtom);
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

  const isSelected = builderState.selectedFieldId === field.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`field-item ${isSelected ? 'selected' : ''}`}
      onClick={() => selectField(field.id)}
    >
      <div className="drag-handle" {...attributes} {...listeners}>
        ⋮⋮
      </div>
      
      <div className="field-preview">
        <label>{field.label}</label>
        <FieldPreview field={field} />
      </div>
      
      <button
        className="remove-btn"
        onClick={(e) => {
          e.stopPropagation();
          removeField(field.id);
        }}
      >
        ×
      </button>
    </div>
  );
}
```

### DnD Context

```tsx
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';

function FormBuilder() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Добавление нового компонента из палитры
    if (active.id.toString().startsWith('palette-')) {
      const component = active.data.current?.component as ComponentDefinition;
      const newField: FieldSchema = {
        id: `field-${Date.now()}`,
        ...component.defaultProps,
        name: `field_${Date.now()}`
      };
      addField(newField);
    }
    // Перестановка существующих полей
    else if (active.id !== over.id) {
      reorderFields(active.id as string, over.id as string);
    }

    setActiveId(null);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="form-builder">
        <Palette />
        <Canvas />
        <PropertiesPanel />
      </div>
      
      <DragOverlay>
        {activeId ? <DragOverlayContent id={activeId} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```


---

## 3. Component Registry

Component Registry — это каталог переиспользуемых компонентов для Form Builder.

### Registry Structure

```typescript
interface ComponentDefinition {
  type: string;
  label: string;
  icon: string;
  category: 'input' | 'select' | 'layout' | 'advanced';
  defaultProps: Partial<FieldSchema>;
  configSchema: Record<string, ConfigField>;
  renderPreview: (props: any) => React.ReactNode;
  renderField: (props: any) => React.ReactNode;
}

const componentRegistry: Record<string, ComponentDefinition> = {
  text: {
    type: 'text',
    label: 'Text Input',
    icon: '📝',
    category: 'input',
    defaultProps: {
      type: 'text',
      label: 'Text Field',
      placeholder: '',
      required: false
    },
    configSchema: {
      label: { type: 'string', label: 'Label', required: true },
      placeholder: { type: 'string', label: 'Placeholder' },
      required: { type: 'boolean', label: 'Required' },
      minLength: { type: 'number', label: 'Min Length' },
      maxLength: { type: 'number', label: 'Max Length' }
    },
    renderPreview: (props) => <input type="text" placeholder={props.placeholder} />,
    renderField: (props) => <input {...props} type="text" />
  },
  
  email: {
    type: 'email',
    label: 'Email',
    icon: '📧',
    category: 'input',
    defaultProps: {
      type: 'email',
      label: 'Email',
      required: false
    },
    configSchema: {
      label: { type: 'string', label: 'Label', required: true },
      required: { type: 'boolean', label: 'Required' }
    },
    renderPreview: (props) => <input type="email" placeholder="email@example.com" />,
    renderField: (props) => <input {...props} type="email" />
  },
  
  select: {
    type: 'select',
    label: 'Select',
    icon: '📋',
    category: 'select',
    defaultProps: {
      type: 'select',
      label: 'Select',
      options: [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' }
      ],
      required: false
    },
    configSchema: {
      label: { type: 'string', label: 'Label', required: true },
      options: { type: 'array', label: 'Options', required: true },
      required: { type: 'boolean', label: 'Required' }
    },
    renderPreview: (props) => (
      <select>
        {props.options?.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ),
    renderField: (props) => (
      <select {...props}>
        {props.options?.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }
};
```

### Properties Panel

```tsx
function PropertiesPanel() {
  const [builderState] = useAtom(builderAtom);
  
  if (!builderState.selectedFieldId) {
    return (
      <div className="properties-panel">
        <p>Select a field to edit its properties</p>
      </div>
    );
  }
  
  const field = builderState.schema.fields.find(
    f => f.id === builderState.selectedFieldId
  );
  
  if (!field) return null;
  
  const component = componentRegistry[field.type];
  
  return (
    <div className="properties-panel">
      <h3>Properties</h3>
      
      {Object.entries(component.configSchema).map(([key, config]) => (
        <PropertyField
          key={key}
          name={key}
          config={config}
          value={field[key]}
          onChange={(value) => updateField(field.id, { [key]: value })}
        />
      ))}
    </div>
  );
}

function PropertyField({ name, config, value, onChange }) {
  switch (config.type) {
    case 'string':
      return (
        <div className="property-field">
          <label>{config.label}</label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
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
            {config.label}
          </label>
        </div>
      );
      
    case 'number':
      return (
        <div className="property-field">
          <label>{config.label}</label>
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </div>
      );
      
    default:
      return null;
  }
}
```

---

## 4. Live Preview

Live Preview показывает форму в реальном времени по мере её построения.

```tsx
function LivePreview() {
  const [builderState] = useAtom(builderAtom);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  return (
    <div className="live-preview">
      <h3>Preview</h3>
      
      <form className="preview-form">
        <h2>{builderState.schema.title}</h2>
        
        {builderState.schema.fields.map((field) => {
          const component = componentRegistry[field.type];
          
          return (
            <div key={field.id} className="preview-field">
              <label htmlFor={`preview-${field.id}`}>
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>
              
              {component.renderField({
                id: `preview-${field.id}`,
                name: field.name,
                value: formValues[field.name] || '',
                onChange: (e) => setFormValues({
                  ...formValues,
                  [field.name]: e.target.value
                }),
                ...field
              })}
            </div>
          );
        })}
        
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
```

---

## 5. Export to Code

Export to Code генерирует React код из схемы формы.

```typescript
function generateReactCode(schema: FormSchema): string {
  const imports = `
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
`;

  const zodSchema = generateZodSchema(schema);
  const component = generateComponent(schema);

  return `${imports}\n${zodSchema}\n${component}`;
}

function generateZodSchema(schema: FormSchema): string {
  const fields = schema.fields.map((field) => {
    let validation = `z.${field.type}()`;
    
    if (field.type === 'string') {
      if (field.minLength) validation += `.min(${field.minLength})`;
      if (field.maxLength) validation += `.max(${field.maxLength})`;
      if (field.pattern) validation += `.regex(${field.pattern})`;
    }
    
    if (field.type === 'number') {
      if (field.min) validation += `.min(${field.min})`;
      if (field.max) validation += `.max(${field.max})`;
    }
    
    if (!field.required) validation += `.optional()`;
    
    return `  ${field.name}: ${validation}`;
  }).join(',\n');

  return `
const schema = z.object({
${fields}
});

type FormData = z.infer<typeof schema>;
`;
}

function generateComponent(schema: FormSchema): string {
  const fields = schema.fields.map((field) => {
    const component = componentRegistry[field.type];
    return `
      <div className="form-field">
        <label htmlFor="${field.name}">
          ${field.label}
          ${field.required ? '<span className="required">*</span>' : ''}
        </label>
        <input
          id="${field.name}"
          type="${field.type}"
          {...register('${field.name}')}
        />
        {errors.${field.name} && (
          <span className="error">{errors.${field.name}.message}</span>
        )}
      </div>
    `;
  }).join('\n');

  return `
export function ${schema.title.replace(/\s+/g, '')}Form() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2>${schema.title}</h2>
      ${fields}
      <button type="submit">Submit</button>
    </form>
  );
}
`;
}
```

---

## 6. Undo/Redo с Time Travel

Time Travel позволяет откатывать и повторять изменения в Form Builder.

```typescript
const builderAtom = atom<BuilderState>({
  schema: initialSchema,
  selectedFieldId: null,
  history: [initialSchema],
  historyIndex: 0
});

// Undo
const undo = () => {
  builderAtom.update((state) => {
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        schema: state.history[newIndex],
        historyIndex: newIndex
      };
    }
    return state;
  });
};

// Redo
const redo = () => {
  builderAtom.update((state) => {
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        schema: state.history[newIndex],
        historyIndex: newIndex
      };
    }
    return state;
  });
};

// Add to history
const addToHistory = (newSchema: FormSchema) => {
  builderAtom.update((state) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newSchema);
    
    return {
      ...state,
      schema: newSchema,
      history: newHistory,
      historyIndex: newHistory.length - 1
    };
  });
};
```


---

## Заключение

В этой пятой части мы создали полноценный Form Builder — визуальный инструмент для создания форм без кода:

### Ключевые выводы

**1. Builder Architecture:**
- Schema-driven подход (JSON представление)
- Component Registry для переиспользуемых компонентов
- State management с @nexus-state/core

**2. Drag-and-Drop:**
- @dnd-kit для современного DnD
- Palette с draggable компонентами
- Canvas как drop zone
- Sortable fields для перестановки

**3. Component Registry:**
- Декларативное описание компонентов
- Config schema для properties
- Render functions для preview и field

**4. Live Preview:**
- Мгновенный предпросмотр формы
- Интерактивное тестирование

**5. Export to Code:**
- Генерация React кода
- Zod schema generation
- Production-ready код

**6. Undo/Redo:**
- Time Travel для истории
- Откат и повтор изменений
- История всех операций

### Что дальше

**Часть 6: DSL для валидации** (финал, следующая неделя)
- Создание собственного DSL
- Parser Implementation
- Syntax Design
- Query Integration
- Real-world Examples
- Итоги всей серии Forms

### Полезные ссылки

**Документация:**
- [@dnd-kit](https://dndkit.com/) — Modern drag-and-drop
- [Zod](https://zod.dev/) — Schema validation
- [@nexus-state/core](https://github.com/eustatos/nexus-state) — State management

**Другие части серии:**
- [Часть 1: Foundations & Patterns](../part-01-foundations-patterns/draft.md)
- [Часть 2: UX & Accessibility](../part-02-ux-accessibility/draft.md)
- [Часть 3: Advanced Patterns I](../part-03-advanced-patterns-1/draft.md)
- [Часть 4: Advanced Patterns II](../part-04-advanced-patterns-2/draft.md)
- [Time Travel Series](../../article-time-travel/) — Undo/Redo patterns

**Обратная связь:**
Буду рад вашим комментариям и вопросам! Пишите в комментариях или в [GitHub Issues](https://github.com/eustatos/nexus-state/issues).

---

**Предыдущая статья:** [Часть 4: Advanced Patterns II](../part-04-advanced-patterns-2/draft.md)  
**Следующая статья:** [Часть 6: DSL для валидации](../part-06-dsl-validation/draft.md)

