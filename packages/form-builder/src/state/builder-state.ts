/**
 * Form Builder State
 * 
 * Manages the state of the form builder including schema, selection, and history.
 */

import { atom } from '@nexus-state/core';
import type { FormSchema, FieldSchema } from '../schema/types';

/**
 * History state for undo/redo
 */
export interface HistoryState {
  past: FormSchema[];
  present: FormSchema;
  future: FormSchema[];
}

/**
 * Builder state interface
 */
export interface BuilderState {
  /** Current form schema */
  schema: FormSchema;
  /** Currently selected field id */
  selectedFieldId: string | null;
  /** History for undo/redo */
  history: HistoryState;
  /** Is form dirty (has unsaved changes) */
  isDirty: boolean;
  /** Is preview mode active */
  isPreviewMode: boolean;
}

/**
 * Initial builder state
 */
export function createInitialBuilderState(): BuilderState {
  const initialSchema: FormSchema = {
    id: `form_${Date.now()}`,
    title: 'New Form',
    fields: [],
    metadata: {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
    },
  };

  return {
    schema: initialSchema,
    selectedFieldId: null,
    history: {
      past: [],
      present: initialSchema,
      future: [],
    },
    isDirty: false,
    isPreviewMode: false,
  };
}

/**
 * Create builder atom
 */
export const builderAtom = atom<BuilderState>(createInitialBuilderState());

/**
 * Add to history (for undo/redo)
 */
function addToHistory(state: BuilderState, newSchema: FormSchema): BuilderState {
  return {
    ...state,
    history: {
      past: [...state.history.past, state.history.present],
      present: newSchema,
      future: [], // Clear future on new action
    },
    isDirty: true,
  };
}

/**
 * Builder actions
 */
export const builderActions = {
  /**
   * Set the entire schema
   */
  setSchema(schema: FormSchema) {
    builderAtom.update((state) => ({
      ...state,
      schema,
      history: {
        ...state.history,
        present: schema,
      },
      isDirty: false,
    }));
  },

  /**
   * Add a field to the form
   */
  addField(field: FieldSchema) {
    builderAtom.update((state) => {
      const newSchema = {
        ...state.schema,
        fields: [...state.schema.fields, field],
      };

      return addToHistory(state, newSchema);
    });
  },

  /**
   * Add a field at a specific index
   */
  addFieldAt(field: FieldSchema, index: number) {
    builderAtom.update((state) => {
      const newFields = [...state.schema.fields];
      newFields.splice(index, 0, field);
      
      const newSchema = {
        ...state.schema,
        fields: newFields,
      };

      return addToHistory(state, newSchema);
    });
  },

  /**
   * Remove a field by id
   */
  removeField(fieldId: string) {
    builderAtom.update((state) => {
      const newSchema = {
        ...state.schema,
        fields: state.schema.fields.filter(f => f.id !== fieldId),
      };

      return addToHistory(state, newSchema);
    });
  },

  /**
   * Update a field
   */
  updateField(fieldId: string, updates: Partial<FieldSchema>) {
    builderAtom.update((state) => {
      const newSchema = {
        ...state.schema,
        fields: state.schema.fields.map(f =>
          f.id === fieldId ? { ...f, ...updates } : f
        ),
      };

      return addToHistory(state, newSchema);
    });
  },

  /**
   * Reorder fields
   */
  reorderFields(fromIndex: number, toIndex: number) {
    builderAtom.update((state) => {
      const newFields = [...state.schema.fields];
      const [removed] = newFields.splice(fromIndex, 1);
      newFields.splice(toIndex, 0, removed);
      
      const newSchema = {
        ...state.schema,
        fields: newFields,
      };

      return addToHistory(state, newSchema);
    });
  },

  /**
   * Move field
   */
  moveField(fieldId: string, toIndex: number) {
    builderAtom.update((state) => {
      const fromIndex = state.schema.fields.findIndex(f => f.id === fieldId);
      if (fromIndex === -1) return state;

      const newFields = [...state.schema.fields];
      const [removed] = newFields.splice(fromIndex, 1);
      newFields.splice(toIndex, 0, removed);
      
      const newSchema = {
        ...state.schema,
        fields: newFields,
      };

      return addToHistory(state, newSchema);
    });
  },

  /**
   * Select a field
   */
  selectField(fieldId: string | null) {
    builderAtom.update((state) => ({
      ...state,
      selectedFieldId: fieldId,
    }));
  },

  /**
   * Toggle preview mode
   */
  togglePreviewMode() {
    builderAtom.update((state) => ({
      ...state,
      isPreviewMode: !state.isPreviewMode,
    }));
  },

  /**
   * Set preview mode
   */
  setPreviewMode(isPreviewMode: boolean) {
    builderAtom.update((state) => ({
      ...state,
      isPreviewMode,
    }));
  },

  /**
   * Undo last action
   */
  undo() {
    builderAtom.update((state) => {
      if (state.history.past.length === 0) return state;

      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);

      return {
        ...state,
        schema: previous,
        history: {
          past: newPast,
          present: previous,
          future: [state.history.present, ...state.history.future],
        },
        isDirty: true,
      };
    });
  },

  /**
   * Redo last undone action
   */
  redo() {
    builderAtom.update((state) => {
      if (state.history.future.length === 0) return state;

      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);

      return {
        ...state,
        schema: next,
        history: {
          past: [...state.history.past, state.history.present],
          present: next,
          future: newFuture,
        },
        isDirty: true,
      };
    });
  },

  /**
   * Reset form to initial state
   */
  reset() {
    builderAtom.update(() => createInitialBuilderState());
  },

  /**
   * Clear history
   */
  clearHistory() {
    builderAtom.update((state) => ({
      ...state,
      history: {
        past: [],
        present: state.schema,
        future: [],
      },
    }));
  },

  /**
   * Save (mark as clean)
   */
  save() {
    builderAtom.update((state) => ({
      ...state,
      isDirty: false,
      history: {
        past: [],
        present: state.schema,
        future: [],
      },
      metadata: {
        ...state.schema.metadata,
        updatedAt: new Date().toISOString(),
      },
    }));
  },
};

/**
 * Builder selectors
 */
export const builderSelectors = {
  /**
   * Get selected field
   */
  getSelectedField: (state: BuilderState): FieldSchema | undefined => {
    if (!state.selectedFieldId) return undefined;
    return state.schema.fields.find(f => f.id === state.selectedFieldId);
  },

  /**
   * Check if can undo
   */
  canUndo: (state: BuilderState): boolean => {
    return state.history.past.length > 0;
  },

  /**
   * Check if can redo
   */
  canRedo: (state: BuilderState): boolean => {
    return state.history.future.length > 0;
  },

  /**
   * Get field count
   */
  getFieldCount: (state: BuilderState): number => {
    return state.schema.fields.length;
  },

  /**
   * Get fields by category
   */
  getFieldsByCategory: (state: BuilderState, category: string): FieldSchema[] => {
    return state.schema.fields.filter(f => f.category === category);
  },

  /**
   * Get required fields
   */
  getRequiredFields: (state: BuilderState): FieldSchema[] => {
    return state.schema.fields.filter(f => f.required);
  },
};
