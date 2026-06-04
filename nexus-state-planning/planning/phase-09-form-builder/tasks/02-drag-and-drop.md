# Task 02: Drag-and-Drop

**Приоритет:** High  
**Оценка:** 1 неделя  
**Статус:** Todo

---

## Цель

Реализовать Drag-and-Drop интерфейс с использованием @dnd-kit.

---

## Scope

### 1. Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 2. Palette Component

```typescript
// packages/form-builder-ui/src/components/Palette.tsx
import { useDraggable } from '@dnd-kit/core';
import { ComponentDefinition } from '@nexus-state/form-builder';

interface PaletteItemProps {
  component: ComponentDefinition;
}

function PaletteItem({ component }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `palette-${component.type}`,
    data: { component },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
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

export function Palette() {
  const registry = useComponentRegistry();
  const categories = ['input', 'select', 'layout', 'advanced'];

  return (
    <div className="palette">
      <h3>Components</h3>
      {categories.map((category) => (
        <div key={category} className="category">
          <h4>{category}</h4>
          {registry.getByCategory(category).map((component) => (
            <PaletteItem key={component.type} component={component} />
          ))}
        </div>
      ))}
    </div>
  );
}
```

### 3. Canvas Component

```typescript
// packages/form-builder-ui/src/components/Canvas.tsx
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useAtom } from '@nexus-state/react';
import { builderAtom } from '@nexus-state/form-builder';

export function Canvas() {
  const [state] = useAtom(builderAtom);
  const { setNodeRef } = useDroppable({ id: 'canvas' });

  return (
    <div ref={setNodeRef} className="canvas">
      <h2>{state.schema.title}</h2>
      
      <SortableContext
        items={state.schema.fields.map(f => f.id)}
        strategy={verticalListSortingStrategy}
      >
        {state.schema.fields.map((field) => (
          <SortableField key={field.id} field={field} />
        ))}
      </SortableContext>
      
      {state.schema.fields.length === 0 && (
        <div className="empty-state">
          Drag components here to build your form
        </div>
      )}
    </div>
  );
}
```

### 4. Sortable Field

```typescript
// packages/form-builder-ui/src/components/SortableField.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FieldSchema } from '@nexus-state/form-builder';
import { builderActions } from '@nexus-state/form-builder';

interface SortableFieldProps {
  field: FieldSchema;
}

export function SortableField({ field }: SortableFieldProps) {
  const [state] = useAtom(builderAtom);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected = state.selectedFieldId === field.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`field-item ${isSelected ? 'selected' : ''}`}
      onClick={() => builderActions.selectField(field.id)}
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
          builderActions.removeField(field.id);
        }}
      >
        ×
      </button>
    </div>
  );
}
```

### 5. DnD Context

```typescript
// packages/form-builder-ui/src/components/FormBuilder.tsx
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { builderActions } from '@nexus-state/form-builder';

export function FormBuilder() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Adding new component from palette
    if (active.id.toString().startsWith('palette-')) {
      const component = active.data.current?.component as ComponentDefinition;
      const newField: FieldSchema = {
        id: `field-${Date.now()}`,
        type: component.type,
        name: `field_${Date.now()}`,
        label: component.label,
        ...component.defaultProps,
      };
      builderActions.addField(newField);
    }
    // Reordering existing fields
    else if (active.id !== over.id) {
      const oldIndex = state.schema.fields.findIndex(f => f.id === active.id);
      const newIndex = state.schema.fields.findIndex(f => f.id === over.id);
      builderActions.reorderFields(oldIndex, newIndex);
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

## Implementation Plan

1. **Setup @dnd-kit** (1 день)
   - Install dependencies
   - Configure DndContext
   - Basic drag-and-drop

2. **Palette Component** (1 день)
   - Draggable items
   - Categories
   - Styling

3. **Canvas Component** (2 дня)
   - Drop zone
   - Sortable context
   - Empty state

4. **Sortable Fields** (2 дня)
   - Sortable items
   - Drag handle
   - Selection
   - Remove button

5. **Polish** (1 день)
   - Drag overlay
   - Animations
   - Accessibility

---

## Acceptance Criteria

- [ ] Можно перетаскивать компоненты из Palette на Canvas
- [ ] Можно менять порядок полей на Canvas
- [ ] Drag handle работает корректно
- [ ] Animations плавные
- [ ] Keyboard navigation работает
- [ ] Accessibility соблюдена

---

## Dependencies

- Task 01 (Core Architecture)
- @dnd-kit/core
- @dnd-kit/sortable

---

## Notes

- Использовать @dnd-kit вместо react-dnd (более современный)
- Обеспечить accessibility (keyboard navigation)
- Добавить visual feedback при drag
