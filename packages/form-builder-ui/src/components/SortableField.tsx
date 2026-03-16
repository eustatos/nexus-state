/**
 * SortableField Component - Draggable and sortable form field
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAtom, useStore } from '@nexus-state/react';
import type { FieldSchema } from '@nexus-state/form-builder-react';
import { builderAtom, builderActions } from '@nexus-state/form-builder-react';
import { FieldPreview } from './FieldPreview';

interface SortableFieldProps {
  field: FieldSchema;
}

/**
 * Sortable field item
 */
export function SortableField({ field }: SortableFieldProps) {
  const [state] = useAtom(builderAtom);
  const store = useStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: {
      type: 'field',
      field,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected = state.selectedFieldId === field.id;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = builderActions.removeField(state, field.id);
    store.set(builderAtom, newState);
  };

  const handleClick = () => {
    const newState = builderActions.selectField(state, field.id);
    store.set(builderAtom, newState);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`field-item ${isSelected ? 'field-item-selected' : ''}`}
      onClick={handleClick}
    >
      <div
        className="field-drag-handle"
        {...attributes}
        {...listeners}
      >
        <span>⋮⋮</span>
      </div>

      <div className="field-content">
        <div className="field-header">
          <label className="field-label">{field.label}</label>
          {field.required && <span className="field-required">*</span>}
        </div>
        <FieldPreview field={field} />
      </div>

      <button
        className="field-remove-btn"
        onClick={handleRemove}
        title="Remove field"
        type="button"
      >
        ×
      </button>
    </div>
  );
}
