/**
 * Builder State Tests - Basic functionality
 */

import { describe, expect, it } from 'vitest';
import { createInitialBuilderState } from '@nexus-state/form-builder-core';

describe('Builder State - Basic', () => {
  describe('createInitialBuilderState', () => {
    it('should create initial state with defaults', () => {
      const state = createInitialBuilderState();

      expect(state.schema).toBeDefined();
      expect(state.schema.title).toBe('New Form');
      expect(state.schema.fields).toEqual([]);
      expect(state.selectedFieldId).toBeNull();
      expect(state.isDirty).toBe(false);
      expect(state.isPreviewMode).toBe(false);
    });

    it('should have empty history', () => {
      const state = createInitialBuilderState();

      expect(state.history.past).toEqual([]);
      expect(state.history.present).toBeDefined();
      expect(state.history.future).toEqual([]);
    });

    it('should generate unique form id', () => {
      const state1 = createInitialBuilderState();
      // Small delay to ensure different timestamp
      const start = Date.now();
      while (Date.now() === start) { /* wait */ }
      const state2 = createInitialBuilderState();

      expect(state1.schema.id).not.toBe(state2.schema.id);
    });

    it('should have metadata with version', () => {
      const state = createInitialBuilderState();

      expect(state.schema.metadata).toBeDefined();
      expect(state.schema.metadata?.version).toBe('1.0.0');
      expect(state.schema.metadata?.createdAt).toBeDefined();
    });
  });
});
