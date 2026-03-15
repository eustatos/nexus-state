/**
 * Canvas Component - Drop zone for form fields
 */

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useAtom } from '@nexus-state/react';
import { builderAtom } from '@nexus-state/form-builder';
import { SortableField } from './SortableField';

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="canvas-empty-state">
      <div className="canvas-empty-state-icon">📋</div>
      <h3 className="canvas-empty-state-title">No fields yet</h3>
      <p className="canvas-empty-state-description">
        Drag components from the palette to build your form
      </p>
    </div>
  );
}

/**
 * Main Canvas component
 */
export function Canvas() {
  const [state] = useAtom(builderAtom);
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
    data: {
      type: 'canvas',
    },
  });

  const fieldIds = state.schema.fields.map((f) => f.id);

  return (
    <div
      ref={setNodeRef}
      className={`canvas ${isOver ? 'canvas-over' : ''}`}
    >
      <div className="canvas-header">
        <h2 className="canvas-title">{state.schema.title}</h2>
        {state.schema.description && (
          <p className="canvas-description">{state.schema.description}</p>
        )}
      </div>

      <SortableContext
        items={fieldIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="canvas-fields">
          {state.schema.fields.length === 0 ? (
            <EmptyState />
          ) : (
            state.schema.fields.map((field) => (
              <SortableField key={field.id} field={field} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
