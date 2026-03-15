import { describe, expect, it } from 'vitest';
import { validateFormSchema, validateFieldSchema, createDefaultField, createDefaultFormSchema } from '../schema/validator';

describe('Schema Validator', () => {
  describe('validateFieldSchema', () => {
    it('should pass valid field', () => {
      const field = createDefaultField('text', 'username');
      const errors = validateFieldSchema(field);
      expect(errors).toHaveLength(0);
    });

    it('should error on missing id', () => {
      const field = {
        ...createDefaultField('text', 'username'),
        id: '',
      };
      const errors = validateFieldSchema(field);
      expect(errors).toContain('Field must have an id');
    });

    it('should error on missing name', () => {
      const field = {
        ...createDefaultField('text', ''),
        name: '',
      };
      const errors = validateFieldSchema(field);
      expect(errors).toContain('Field must have a name');
    });

    it('should error on invalid name format', () => {
      const field = {
        ...createDefaultField('text', 'invalid-name!'),
      };
      const errors = validateFieldSchema(field);
      expect(errors.join(' ')).toContain('must be a valid identifier');
    });

    it('should error on select without options', () => {
      const field = {
        ...createDefaultField('select', 'choice'),
        options: [],
      };
      const errors = validateFieldSchema(field);
      expect(errors.join(' ')).toContain('must have options');
    });
  });

  describe('validateFormSchema', () => {
    it('should pass valid form', () => {
      const schema = createDefaultFormSchema('Test Form');
      schema.fields = [createDefaultField('text', 'name')];
      const errors = validateFormSchema(schema);
      expect(errors).toHaveLength(0);
    });

    it('should error on missing title', () => {
      const schema = {
        ...createDefaultFormSchema(''),
        title: '',
      };
      const errors = validateFormSchema(schema);
      expect(errors).toContain('Form must have a title');
    });

    it('should error on empty fields', () => {
      const schema = {
        ...createDefaultFormSchema('Test'),
        fields: [],
      };
      const errors = validateFormSchema(schema);
      expect(errors).toContain('Form must have at least one field');
    });

    it('should error on duplicate field names', () => {
      const schema = createDefaultFormSchema('Test');
      const field1 = createDefaultField('text', 'username');
      const field2 = { ...field1, id: 'field_2' };
      schema.fields = [field1, field2];
      const errors = validateFormSchema(schema);
      expect(errors.join(' ')).toContain('Duplicate field name');
    });

    it('should error on invalid conditional reference', () => {
      const schema = createDefaultFormSchema('Test');
      schema.fields = [
        {
          ...createDefaultField('text', 'field1'),
          conditional: {
            field: 'nonexistent',
            operator: 'equals',
            value: 'test',
          },
        },
      ];
      const errors = validateFormSchema(schema);
      expect(errors.join(' ')).toContain('non-existent field');
    });
  });

  describe('createDefaultField', () => {
    it('should create field with defaults', () => {
      const field = createDefaultField('text', 'test');
      expect(field.type).toBe('text');
      expect(field.name).toBe('test');
      expect(field.label).toBe('Test');
      expect(field.required).toBe(false);
    });

    it('should generate name if not provided', () => {
      const field = createDefaultField('text');
      expect(field.name).toMatch(/field_\d+/);
    });
  });

  describe('createDefaultFormSchema', () => {
    it('should create form with defaults', () => {
      const schema = createDefaultFormSchema('My Form');
      expect(schema.title).toBe('My Form');
      expect(schema.fields).toEqual([]);
      expect(schema.metadata?.version).toBe('1.0.0');
    });

    it('should generate title if not provided', () => {
      const schema = createDefaultFormSchema();
      expect(schema.title).toBe('New Form');
    });
  });
});
