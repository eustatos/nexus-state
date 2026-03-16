/**
 * Built-in Components Tests
 */

import { describe, expect, it } from 'vitest';
import {
  builtInComponents,
  checkboxComponent,
  emailInputComponent,
  numberInputComponent,
  passwordInputComponent,
  radioComponent,
  selectComponent,
  textareaComponent,
  textInputComponent,
} from '../registry/built-in-components';

describe('Built-in Components', () => {
  describe('textInputComponent', () => {
    it('should have correct type', () => {
      expect(textInputComponent.type).toBe('text');
    });

    it('should have label', () => {
      expect(textInputComponent.label).toBe('Text Input');
    });

    it('should have icon', () => {
      expect(textInputComponent.icon).toBe('📝');
    });

    it('should have category', () => {
      expect(textInputComponent.category).toBe('input');
    });

    it('should have default props', () => {
      expect(textInputComponent.defaultProps).toBeDefined();
      expect(textInputComponent.defaultProps.type).toBe('text');
    });

    it('should have config schema', () => {
      expect(textInputComponent.configSchema).toBeDefined();
      expect(textInputComponent.configSchema.label).toBeDefined();
    });

    it('should have renderPreview', () => {
      expect(textInputComponent.renderPreview).toBeDefined();
    });

    it('should have renderField', () => {
      expect(textInputComponent.renderField).toBeDefined();
    });

    it('should support validation', () => {
      expect(textInputComponent.supportsValidation).toBe(true);
    });
  });

  describe('emailInputComponent', () => {
    it('should have correct type', () => {
      expect(emailInputComponent.type).toBe('email');
    });

    it('should have icon', () => {
      expect(emailInputComponent.icon).toBe('📧');
    });

    it('should have placeholder in default props', () => {
      expect(emailInputComponent.defaultProps.placeholder).toBe('email@example.com');
    });
  });

  describe('numberInputComponent', () => {
    it('should have correct type', () => {
      expect(numberInputComponent.type).toBe('number');
    });

    it('should have icon', () => {
      expect(numberInputComponent.icon).toBe('🔢');
    });
  });

  describe('passwordInputComponent', () => {
    it('should have correct type', () => {
      expect(passwordInputComponent.type).toBe('password');
    });

    it('should have icon', () => {
      expect(passwordInputComponent.icon).toBe('🔒');
    });
  });

  describe('textareaComponent', () => {
    it('should have correct type', () => {
      expect(textareaComponent.type).toBe('textarea');
    });

    it('should have icon', () => {
      expect(textareaComponent.icon).toBe('📄');
    });
  });

  describe('selectComponent', () => {
    it('should have correct type', () => {
      expect(selectComponent.type).toBe('select');
    });

    it('should have icon', () => {
      expect(selectComponent.icon).toBe('📋');
    });

    it('should have category select', () => {
      expect(selectComponent.category).toBe('select');
    });
  });

  describe('checkboxComponent', () => {
    it('should have correct type', () => {
      expect(checkboxComponent.type).toBe('checkbox');
    });

    it('should have icon', () => {
      expect(checkboxComponent.icon).toBe('☑️');
    });
  });

  describe('radioComponent', () => {
    it('should have correct type', () => {
      expect(radioComponent.type).toBe('radio');
    });

    it('should have icon', () => {
      expect(radioComponent.icon).toBe('🔘');
    });
  });

  describe('builtInComponents array', () => {
    it('should contain all components', () => {
      expect(builtInComponents).toHaveLength(8);
    });

    it('should have unique types', () => {
      const types = builtInComponents.map(c => c.type);
      const uniqueTypes = new Set(types);
      expect(types.length).toBe(uniqueTypes.size);
    });

    it('should have all required properties', () => {
      builtInComponents.forEach(component => {
        expect(component.type).toBeDefined();
        expect(component.label).toBeDefined();
        expect(component.icon).toBeDefined();
        expect(component.category).toBeDefined();
        expect(component.defaultProps).toBeDefined();
        expect(component.configSchema).toBeDefined();
        expect(component.renderPreview).toBeDefined();
        expect(component.renderField).toBeDefined();
      });
    });

    it('should have valid categories', () => {
      const validCategories = ['input', 'select', 'layout', 'advanced'];
      builtInComponents.forEach(component => {
        expect(validCategories).toContain(component.category);
      });
    });
  });
});
