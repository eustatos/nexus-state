/**
 * FormBuilder Component - Main form builder with DnD context
 */

import { useState } from 'react';
import {
  DndContext,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import { useAtom, useStore } from '@nexus-state/react';
import type { FieldSchema, ComponentDefinition } from '@nexus-state/form-builder-react';
import { builderAtom, builderActions, defaultRegistry, builtInComponents } from '@nexus-state/form-builder-react';
import { Palette } from './Palette';
import { Canvas } from './Canvas';
import { PropertiesPanel } from './PropertiesPanel';
import { FieldPreview } from './FieldPreview';

/**
 * Drag overlay content
 */
function DragOverlayContent({ activeId }: { activeId: string }) {
  const [state] = useAtom(builderAtom);

  // Check if dragging from palette
  if (activeId.startsWith('palette-')) {
    const type = activeId.replace('palette-', '');
    const component = defaultRegistry.get(type);
    
    if (component) {
      return (
        <div className="drag-overlay palette-item">
          <span className="palette-item-icon">{component.icon}</span>
          <span className="palette-item-label">{component.label}</span>
        </div>
      );
    }
  }

  // Check if dragging existing field
  const field = state.schema.fields.find((f) => f.id === activeId);
  if (field) {
    return (
      <div className="drag-overlay field-item">
        <label className="field-label">{field.label}</label>
        <FieldPreview field={field} />
      </div>
    );
  }

  return null;
}

/**
 * Main FormBuilder component
 */
export function FormBuilder() {
  const [state] = useAtom(builderAtom);
  const store = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Initialize registry with built-in components
  useState(() => {
    defaultRegistry.registerMany(builtInComponents);
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    // Adding new component from palette
    if (active.id.toString().startsWith('palette-')) {
      const component = (active.data as { component?: ComponentDefinition }).component;

      if (component) {
        const newField: FieldSchema = {
          id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: component.type as any,
          name: `field_${Date.now()}`,
          label: component.label,
          ...component.defaultProps,
        };
        const newState = builderActions.addField(state, newField);
        store.set(builderAtom, newState);
      }
    }
    // Reordering existing fields
    else if (active.id !== over.id) {
      const oldIndex = state.schema.fields.findIndex((f) => f.id === active.id);
      const overId = over.id.toString();

      // Find the correct index
      let newIndex = state.schema.fields.findIndex((f) => f.id === overId);

      // If over a field, insert before it
      if (newIndex === -1) {
        newIndex = state.schema.fields.length;
      }

      if (oldIndex !== -1 && oldIndex !== newIndex) {
        const newState = builderActions.reorderFields(state, oldIndex, newIndex);
        store.set(builderAtom, newState);
      }
    }

    setActiveId(null);
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCorners}
    >
      <div className="form-builder">
        <Palette />
        <Canvas />
        <PropertiesPanel />
      </div>

      <DragOverlay>
        {activeId ? <DragOverlayContent activeId={activeId} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
