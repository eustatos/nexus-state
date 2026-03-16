/**
 * Builder Actions Tests
 */

import { describe, expect, it } from 'vitest';
import { builderActions, createInitialBuilderState } from '@nexus-state/form-builder-core';
import type { FieldSchema } from '@nexus-state/form-builder-core';

describe('Builder Actions', () => {
  const createTestState = () => createInitialBuilderState();

  const createMockField = (id: string, type = 'text', name = 'test'): FieldSchema => ({
    id,
    type,
    name,
    label: name.charAt(0).toUpperCase() + name.slice(1),
    required: false,
  });

  describe('setSchema', () => {
    it('should set new schema', () => {
      const state = createTestState();
      const newSchema = {
        id: 'new-form',
        title: 'New Form',
        fields: [],
        metadata: {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
        },
      };

      const newState = builderActions.setSchema(state, newSchema);

      expect(newState.schema).toEqual(newSchema);
      expect(newState.isDirty).toBe(false);
    });
  });

  describe('addField', () => {
    it('should add field to schema', () => {
      const state = createTestState();
      const field = createMockField('field_1', 'text', 'username');

      const newState = builderActions.addField(state, field);

      expect(newState.schema.fields).toHaveLength(1);
      expect(newState.schema.fields[0]).toEqual(field);
      expect(newState.isDirty).toBe(true);
    });
  });

  describe('addFieldAt', () => {
    it('should add field at specific index', () => {
      let state = createTestState();
      const field1 = createMockField('field_1');
      const field2 = createMockField('field_2', 'email', 'email');

      state = builderActions.addField(state, field1);
      const newState = builderActions.addFieldAt(state, field2, 0);

      expect(newState.schema.fields[0]).toEqual(field2);
      expect(newState.schema.fields[1]).toEqual(field1);
    });
  });

  describe('removeField', () => {
    it('should remove field by id', () => {
      let state = createTestState();
      const field = createMockField('field_1');

      state = builderActions.addField(state, field);
      const newState = builderActions.removeField(state, 'field_1');

      expect(newState.schema.fields).toHaveLength(0);
    });
  });

  describe('updateField', () => {
    it('should update field properties', () => {
      const state = createTestState();
      const field = createMockField('field_1', 'text', 'username');

      const stateWithField = builderActions.addField(state, field);
      const newState = builderActions.updateField(stateWithField, 'field_1', {
        label: 'New Label',
        required: true,
      });

      const updatedField = newState.schema.fields[0];
      expect(updatedField.label).toBe('New Label');
      expect(updatedField.required).toBe(true);
      expect(updatedField.name).toBe('username');
    });

    it('should not update if field not found', () => {
      const state = createTestState();
      const field = createMockField('field_1');

      const stateWithField = builderActions.addField(state, field);
      const newState = builderActions.updateField(stateWithField, 'nonexistent', {
        label: 'New Label',
      });

      expect(newState.schema.fields[0].label).toBe('Test');
    });
  });

  describe('reorderFields', () => {
    it('should reorder fields', () => {
      const state = createTestState();
      const field1 = createMockField('field_1');
      const field2 = createMockField('field_2', 'email', 'email');

      const stateWithFields = builderActions.addField(
        builderActions.addField(state, field1),
        field2
      );
      const newState = builderActions.reorderFields(stateWithFields, 0, 1);

      expect(newState.schema.fields).toHaveLength(2);
      expect(newState.schema.fields[0]).toEqual(field2);
      expect(newState.schema.fields[1]).toEqual(field1);
    });
  });

  describe('moveField', () => {
    it('should move field to new index', () => {
      const state = createTestState();
      const field1 = createMockField('field_1');
      const field2 = createMockField('field_2', 'email', 'email');

      const stateWithFields = builderActions.addField(
        builderActions.addField(state, field1),
        field2
      );
      const newState = builderActions.moveField(stateWithFields, 'field_1', 1);

      expect(newState.schema.fields).toHaveLength(2);
      expect(newState.schema.fields[0]).toEqual(field2);
      expect(newState.schema.fields[1]).toEqual(field1);
    });

    it('should return same state if field not found', () => {
      const state = createTestState();
      const newState = builderActions.moveField(state, 'nonexistent', 0);

      expect(newState).toBe(state);
    });
  });

  describe('selectField', () => {
    it('should select field', () => {
      const state = createTestState();
      const newState = builderActions.selectField(state, 'field_1');

      expect(newState.selectedFieldId).toBe('field_1');
    });

    it('should deselect field', () => {
      const state = createTestState();
      const stateWithSelection = builderActions.selectField(state, 'field_1');
      const newState = builderActions.selectField(stateWithSelection, null);

      expect(newState.selectedFieldId).toBeNull();
    });
  });

  describe('togglePreviewMode', () => {
    it('should toggle preview mode', () => {
      const state = createTestState();
      expect(state.isPreviewMode).toBe(false);

      const newState = builderActions.togglePreviewMode(state);

      expect(newState.isPreviewMode).toBe(true);
    });
  });

  describe('setPreviewMode', () => {
    it('should set preview mode', () => {
      const state = createTestState();
      const newState = builderActions.setPreviewMode(state, true);

      expect(newState.isPreviewMode).toBe(true);
    });
  });

  describe('undo', () => {
    it('should undo last action', () => {
      const state = createTestState();
      const field = createMockField('field_1');

      const stateWithField = builderActions.addField(state, field);
      const newState = builderActions.undo(stateWithField);

      expect(newState.schema.fields).toHaveLength(0);
      expect(newState.isDirty).toBe(true);
    });

    it('should return same state if no past states', () => {
      const state = createTestState();
      const newState = builderActions.undo(state);

      expect(newState).toBe(state);
    });
  });

  describe('redo', () => {
    it('should redo undone action', () => {
      const state = createTestState();
      const field = createMockField('field_1');

      let currentState = builderActions.addField(state, field);
      currentState = builderActions.undo(currentState);
      const newState = builderActions.redo(currentState);

      expect(newState.schema.fields).toHaveLength(1);
    });

    it('should return same state if no future states', () => {
      const state = createTestState();
      const newState = builderActions.redo(state);

      expect(newState).toBe(state);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const state = createTestState();
      const field = createMockField('field_1');

      builderActions.addField(state, field);
      const newState = builderActions.reset();

      expect(newState.schema.fields).toHaveLength(0);
      expect(newState.selectedFieldId).toBeNull();
      expect(newState.isDirty).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('should clear history', () => {
      const state = createTestState();
      const field = createMockField('field_1');

      const stateWithField = builderActions.addField(state, field);
      const newState = builderActions.clearHistory(stateWithField);

      expect(newState.history.past).toHaveLength(0);
      expect(newState.history.future).toHaveLength(0);
    });
  });

  describe('save', () => {
    it('should mark form as clean', () => {
      const state = createTestState();
      const field = createMockField('field_1');

      const stateWithField = builderActions.addField(state, field);
      expect(stateWithField.isDirty).toBe(true);

      const newState = builderActions.save(stateWithField);

      expect(newState.isDirty).toBe(false);
    });

    it('should update metadata', () => {
      const state = createTestState();
      const field = createMockField('field_1');

      const stateWithField = builderActions.addField(state, field);
      const newState = builderActions.save(stateWithField);

      expect(newState.schema.metadata?.updatedAt).toBeDefined();
    });

    it('should clear history on save', () => {
      const state = createTestState();
      const field = createMockField('field_1');

      const stateWithField = builderActions.addField(state, field);
      const newState = builderActions.save(stateWithField);

      expect(newState.history.past).toHaveLength(0);
      expect(newState.history.future).toHaveLength(0);
    });
  });
});
