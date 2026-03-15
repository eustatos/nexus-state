/**
 * Palette Component - Draggable component items
 */

import { useDraggable } from '@dnd-kit/core';
import type { ComponentDefinition } from '@nexus-state/form-builder';
import { defaultRegistry } from '@nexus-state/form-builder';

interface PaletteItemProps {
  component: ComponentDefinition;
}

/**
 * Draggable palette item
 */
export function PaletteItem({ component }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${component.type}`,
    data: {
      type: 'palette-item',
      component,
    },
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="palette-item"
      {...listeners}
      {...attributes}
    >
      <span className="palette-item-icon">{component.icon}</span>
      <span className="palette-item-label">{component.label}</span>
    </div>
  );
}

/**
 * Component category section
 */
interface PaletteCategoryProps {
  category: string;
}

export function PaletteCategory({ category }: PaletteCategoryProps) {
  const registry = defaultRegistry;
  const components = registry.getByCategory(category as any);

  if (components.length === 0) {
    return null;
  }

  return (
    <div className="palette-category">
      <h4 className="palette-category-title">{category}</h4>
      <div className="palette-items">
        {components.map((component) => (
          <PaletteItem key={component.type} component={component} />
        ))}
      </div>
    </div>
  );
}

/**
 * Main Palette component
 */
export function Palette() {
  const categories = ['input', 'select', 'layout', 'advanced'];

  return (
    <div className="palette">
      <h3 className="palette-title">Components</h3>
      {categories.map((category) => (
        <PaletteCategory key={category} category={category} />
      ))}
    </div>
  );
}
