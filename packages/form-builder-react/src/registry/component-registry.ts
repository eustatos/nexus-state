/**
 * Component Registry for Form Builder
 *
 * Manages available form components and their configurations.
 */

import React from 'react';
import type { FieldCategory, FieldSchema } from '../schema/types';

/**
 * Configuration field definition
 */
export interface ConfigField {
  /** Field type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'select' | 'object';
  /** Field label */
  label: string;
  /** Is required */
  required?: boolean;
  /** Default value */
  defaultValue?: unknown;
  /** Options for select type */
  options?: Array<{ value: string; label: string }>;
  /** Description/help text */
  description?: string;
}

/**
 * Component definition for the builder
 */
export interface ComponentDefinition {
  /** Component type identifier */
  type: string;
  /** Display label */
  label: string;
  /** Icon (emoji or SVG) */
  icon: string;
  /** Component category */
  category: FieldCategory;
  /** Description */
  description?: string;
  /** Default field properties */
  defaultProps: Partial<FieldSchema>;
  /** Configuration schema for properties panel */
  configSchema: Record<string, ConfigField>;
  /** Render preview (non-interactive) */
  renderPreview: (props: Partial<FieldSchema>) => React.ReactNode;
  /** Render actual field (interactive) */
  renderField: (props: FieldSchema) => React.ReactNode;
  /** Whether component supports validation */
  supportsValidation?: boolean;
  /** Whether component supports conditional logic */
  supportsConditional?: boolean;
}

/**
 * Component Registry class
 */
export class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map();

  /**
   * Register a component
   */
  register(definition: ComponentDefinition): void {
    if (this.components.has(definition.type)) {
      console.warn(`Component "${definition.type}" is already registered. Overwriting.`);
    }
    this.components.set(definition.type, definition);
  }

  /**
   * Register multiple components
   */
  registerMany(definitions: ComponentDefinition[]): void {
    definitions.forEach(def => this.register(def));
  }

  /**
   * Unregister a component
   */
  unregister(type: string): boolean {
    return this.components.delete(type);
  }

  /**
   * Get component by type
   */
  get(type: string): ComponentDefinition | undefined {
    return this.components.get(type);
  }

  /**
   * Check if component exists
   */
  has(type: string): boolean {
    return this.components.has(type);
  }

  /**
   * Get all components
   */
  getAll(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  /**
   * Get components by category
   */
  getByCategory(category: FieldCategory): ComponentDefinition[] {
    return this.getAll().filter(c => c.category === category);
  }

  /**
   * Get categories with their components
   */
  getGroupedByCategory(): Record<FieldCategory, ComponentDefinition[]> {
    const categories: Record<FieldCategory, ComponentDefinition[]> = {
      input: [],
      select: [],
      layout: [],
      advanced: [],
    };

    this.getAll().forEach(component => {
      categories[component.category].push(component);
    });

    return categories;
  }

  /**
   * Clear all registered components
   */
  clear(): void {
    this.components.clear();
  }

  /**
   * Get component count
   */
  get size(): number {
    return this.components.size;
  }
}

/**
 * Default registry instance
 */
export const defaultRegistry = new ComponentRegistry();
