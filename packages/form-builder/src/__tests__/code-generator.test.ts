/**
 * Code Generator Tests
 */

import { describe, expect, it } from 'vitest';
import { toPascalCase, toKebabCase, generateCode } from '../export/code-generator';
import type { FormSchema } from '../schema/types';

describe('Code Generator', () => {
  describe('toPascalCase', () => {
    it('should convert simple string', () => {
      expect(toPascalCase('hello')).toBe('Hello');
    });

    it('should convert kebab-case', () => {
      expect(toPascalCase('hello-world')).toBe('HelloWorld');
    });

    it('should convert snake_case', () => {
      expect(toPascalCase('hello_world')).toBe('HelloWorld');
    });

    it('should convert with numbers', () => {
      expect(toPascalCase('form-123-name')).toBe('Form123Name');
    });

    it('should handle empty string', () => {
      expect(toPascalCase('')).toBe('');
    });
  });

  describe('toKebabCase', () => {
    it('should convert camelCase', () => {
      expect(toKebabCase('helloWorld')).toBe('hello-world');
    });

    it('should convert PascalCase', () => {
      expect(toKebabCase('HelloWorld')).toBe('hello-world');
    });

    it('should handle spaces', () => {
      expect(toKebabCase('hello world')).toBe('hello-world');
    });

    it('should handle multiple words', () => {
      expect(toKebabCase('myFormName')).toBe('my-form-name');
    });
  });

  describe('generateCode', () => {
    const mockSchema: FormSchema = {
      id: 'test-form',
      title: 'Test Form',
      fields: [
        {
          id: 'field_1',
          type: 'text',
          name: 'username',
          label: 'Username',
          required: true,
        },
        {
          id: 'field_2',
          type: 'email',
          name: 'email',
          label: 'Email',
          required: true,
        },
      ],
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
      },
    };

    it('should generate React code', () => {
      const result = generateCode(mockSchema, {
        framework: 'react',
        typescript: true,
        schemaLibrary: 'zod',
        styling: 'css',
      });

      expect(result).toBeDefined();
      expect(result.formName).toBe('TestFormForm');
      expect(result.files).toBeDefined();
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should generate Vue code', () => {
      const result = generateCode(mockSchema, {
        framework: 'vue',
        typescript: true,
        schemaLibrary: 'zod',
        styling: 'css',
      });

      expect(result).toBeDefined();
      expect(result.formName).toBe('TestFormForm');
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should generate Svelte code', () => {
      const result = generateCode(mockSchema, {
        framework: 'svelte',
        typescript: true,
        schemaLibrary: 'zod',
        styling: 'css',
      });

      expect(result).toBeDefined();
      expect(result.formName).toBe('TestFormForm');
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should generate JavaScript when typescript is false', () => {
      const result = generateCode(mockSchema, {
        framework: 'react',
        typescript: false,
        schemaLibrary: 'zod',
        styling: 'css',
      });

      expect(result).toBeDefined();
      expect(result.files.some(f => f.language === 'javascript')).toBe(true);
    });

    it('should generate with Tailwind when specified', () => {
      const result = generateCode(mockSchema, {
        framework: 'react',
        typescript: true,
        schemaLibrary: 'zod',
        styling: 'tailwind',
      });

      expect(result).toBeDefined();
      expect(result.files.some(f => f.content.includes('tailwind') || f.content.includes('className='))).toBe(true);
    });

    it('should generate without schema library when none specified', () => {
      const result = generateCode(mockSchema, {
        framework: 'react',
        typescript: true,
        schemaLibrary: 'none',
        styling: 'css',
      });

      expect(result).toBeDefined();
      expect(result.files.some(f => !f.content.includes('zod') && !f.content.includes('yup'))).toBe(true);
    });

    it('should handle empty fields', () => {
      const emptySchema: FormSchema = {
        id: 'empty-form',
        title: 'Empty Form',
        fields: [],
        metadata: {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
        },
      };

      const result = generateCode(emptySchema, {
        framework: 'react',
        typescript: true,
        schemaLibrary: 'zod',
        styling: 'css',
      });

      expect(result).toBeDefined();
      expect(result.formName).toBe('EmptyFormForm');
    });

    it('should generate timestamp', () => {
      const result = generateCode(mockSchema, {
        framework: 'react',
        typescript: true,
        schemaLibrary: 'zod',
        styling: 'css',
      });

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });
});
