/**
 * Package exports tests
 */

import { describe, expect, it } from 'vitest';
import * as formBuilder from '../index';
import * as schema from '../schema';
import * as state from '../state';
import * as exportModule from '../export';
import * as utils from '../utils';

describe('Package Exports', () => {
  describe('Main index', () => {
    it('should export schema module', () => {
      expect(schema).toBeDefined();
    });

    it('should export state module', () => {
      expect(state).toBeDefined();
    });

    it('should export export module', () => {
      expect(exportModule).toBeDefined();
    });

    it('should export utils module', () => {
      expect(utils).toBeDefined();
    });
  });

  describe('Schema exports', () => {
    it('should export validator functions', () => {
      expect(schema.validateFieldSchema).toBeDefined();
      expect(schema.validateFormSchema).toBeDefined();
      expect(schema.createDefaultField).toBeDefined();
      expect(schema.createDefaultFormSchema).toBeDefined();
      expect(schema.isFormSchemaValid).toBeDefined();
    });
  });

  describe('State exports', () => {
    it('should export builder atom', () => {
      expect(state.builderAtom).toBeDefined();
    });

    it('should export builder actions', () => {
      expect(state.builderActions).toBeDefined();
      expect(typeof state.builderActions.addField).toBe('function');
      expect(typeof state.builderActions.removeField).toBe('function');
      expect(typeof state.builderActions.updateField).toBe('function');
      expect(typeof state.builderActions.undo).toBe('function');
      expect(typeof state.builderActions.redo).toBe('function');
    });

    it('should export builder selectors', () => {
      expect(state.builderSelectors).toBeDefined();
      expect(typeof state.builderSelectors.getSelectedField).toBe('function');
      expect(typeof state.builderSelectors.canUndo).toBe('function');
      expect(typeof state.builderSelectors.canRedo).toBe('function');
    });

    it('should export createInitialBuilderState', () => {
      expect(state.createInitialBuilderState).toBeDefined();
    });
  });

  describe('Export module exports', () => {
    it('should export generateCode', () => {
      expect(exportModule.generateCode).toBeDefined();
    });

    it('should export toPascalCase', () => {
      expect(exportModule.toPascalCase).toBeDefined();
    });

    it('should export toKebabCase', () => {
      expect(exportModule.toKebabCase).toBeDefined();
    });
  });

  describe('Utils exports', () => {
    it('should export generateId', () => {
      expect(utils.generateId).toBeDefined();
    });

    it('should export deepClone', () => {
      expect(utils.deepClone).toBeDefined();
    });

    it('should export debounce', () => {
      expect(utils.debounce).toBeDefined();
    });

    it('should export downloadFile', () => {
      expect(utils.downloadFile).toBeDefined();
    });

    it('should export copyToClipboard', () => {
      expect(utils.copyToClipboard).toBeDefined();
    });
  });

  describe('Registry exports', () => {
    it('should export built-in components', () => {
      expect(formBuilder.builtInComponents).toBeDefined();
      expect(Array.isArray(formBuilder.builtInComponents)).toBe(true);
      expect(formBuilder.builtInComponents.length).toBeGreaterThan(0);
    });

    it('should export default registry', () => {
      expect(formBuilder.defaultRegistry).toBeDefined();
    });

    it('should export ComponentRegistry class', () => {
      expect(formBuilder.ComponentRegistry).toBeDefined();
    });
  });
});
