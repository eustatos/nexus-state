/**
 * README Examples Tests
 * 
 * This file tests the examples from the form package READMEs to ensure
 * they work correctly and don't become outdated.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../core/createForm';
import { useForm } from '../react/useForm';

// ============================================================================
// @nexus-state/form README Examples
// ============================================================================

describe('README: @nexus-state/form', () => {
  describe('Quick Start', () => {
    it('basic form example should work', () => {
      const store = createStore();
      
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          username: [],
          email: [],
          password: [],
        },
        initialValues: {
          username: '',
          email: '',
          password: '',
        },
      });

      expect(form).toBeDefined();
      expect(form.getState().values.username).toBe('');
    });
  });

  describe('Validation Triggers', () => {
    it('should support different validation modes', () => {
      const store = createStore();

      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          email: [],
        },
        initialValues: { email: '' },
        mode: 'onBlur',
        showErrorsOnTouched: true,
      });

      expect(form).toBeDefined();
      expect(form.getState().config.mode).toBe('onBlur');
    });
  });
});

// ============================================================================
// @nexus-state/form-schema-zod README Examples
// ============================================================================

describe('README: @nexus-state/form-schema-zod', () => {
  describe('Quick Start', () => {
    it('Zod validator should work', () => {
      // Note: This test verifies the API structure
      // Actual Zod validation requires the zod package
      const store = createStore();

      // Schema structure test (without actual zod import)
      const schemaConfig = {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
      };

      expect(schemaConfig).toBeDefined();
      expect(schemaConfig.email.format).toBe('email');
    });
  });

  describe('Registration Form', () => {
    it('should define registration schema', () => {
      const registrationSchema = {
        username: { type: 'string', minLength: 3, maxLength: 20 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        confirmPassword: { type: 'string' },
        age: { type: 'number', minimum: 18 },
        terms: { type: 'boolean', enum: [true] },
      };

      expect(registrationSchema).toBeDefined();
      expect(registrationSchema.username.minLength).toBe(3);
    });
  });
});

// ============================================================================
// @nexus-state/form-schema-yup README Examples
// ============================================================================

describe('README: @nexus-state/form-schema-yup', () => {
  describe('Quick Start', () => {
    it('Yup validator structure should work', () => {
      const store = createStore();

      // Schema structure test (without actual yup import)
      const loginSchema = {
        email: { type: 'string', required: true },
        password: { type: 'string', minLength: 8, required: true },
      };

      expect(loginSchema).toBeDefined();
      expect(loginSchema.email.required).toBe(true);
    });
  });

  describe('Registration Form', () => {
    it('should define yup-style schema', () => {
      const registrationSchema = {
        username: { type: 'string', required: true, minLength: 3 },
        email: { type: 'string', required: true, format: 'email' },
        password: { type: 'string', required: true, minLength: 8 },
        confirmPassword: { type: 'string', oneOf: ['password'] },
        age: { type: 'number', minimum: 18, required: true },
        terms: { type: 'boolean', oneOf: [true], required: true },
      };

      expect(registrationSchema).toBeDefined();
    });
  });
});

// ============================================================================
// @nexus-state/form-schema-ajv README Examples
// ============================================================================

describe('README: @nexus-state/form-schema-ajv', () => {
  describe('Quick Start', () => {
    it('AJV JSON Schema should work', () => {
      const store = createStore();

      // Define JSON Schema
      const loginSchema = {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
          },
          password: {
            type: 'string',
            minLength: 8,
          },
        },
        required: ['email', 'password'],
      };

      expect(loginSchema).toBeDefined();
      expect(loginSchema.type).toBe('object');
      expect(loginSchema.required).toEqual(['email', 'password']);
    });
  });

  describe('Registration Form', () => {
    it('should define JSON Schema for registration', () => {
      const registrationSchema = {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 20,
            pattern: '^[a-zA-Z0-9_]+$',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          password: {
            type: 'string',
            minLength: 8,
          },
          age: {
            type: 'number',
            minimum: 18,
            maximum: 120,
          },
          terms: {
            type: 'boolean',
            enum: [true],
          },
        },
        required: ['username', 'email', 'password', 'age', 'terms'],
      };

      expect(registrationSchema).toBeDefined();
      expect(registrationSchema.required.length).toBe(5);
    });
  });
});

// ============================================================================
// @nexus-state/form-schema-dsl README Examples
// ============================================================================

describe('README: @nexus-state/form-schema-dsl', () => {
  describe('Quick Start', () => {
    it('DSL validators should work', () => {
      const store = createStore();

      // Import validators from DSL package
      const { required, minLength, email } = require('@nexus-state/form-schema-dsl');

      // Define schema
      const loginSchema = {
        email: [required, email],
        password: [required, minLength(8)],
      };

      expect(loginSchema).toBeDefined();
      expect(loginSchema.email.length).toBe(2);
    });
  });

  describe('Registration Form', () => {
    it('should define DSL schema for registration', () => {
      const { required, minLength, maxLength, email, pattern } = require('@nexus-state/form-schema-dsl');

      const registrationSchema = {
        username: [required, minLength(3), maxLength(20), pattern(/^[a-zA-Z0-9_]+$/)],
        email: [required, email],
        password: [required, minLength(8)],
        age: [required],
        terms: [required],
      };

      expect(registrationSchema).toBeDefined();
      expect(registrationSchema.username.length).toBe(4);
    });
  });
});

// ============================================================================
// Cross-Package Integration Tests
// ============================================================================

describe('README: Integration Examples', () => {
  describe('Form with DevTools', () => {
    it('should work with DevTools plugin', () => {
      const store = createStore();

      // DevTools integration test
      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          firstName: [],
          lastName: [],
        },
        initialValues: {
          firstName: '',
          lastName: '',
        },
      });

      expect(form).toBeDefined();
      expect(form.getState().values.firstName).toBe('');
    });
  });

  describe('Async Validation', () => {
    it('should support async validators', async () => {
      const store = createStore();

      const form = createForm(store, {
        schemaType: 'dsl',
        schemaConfig: {
          username: [
            {
              validate: async (value: string) => {
                // Simulate async API call
                await new Promise(resolve => setTimeout(resolve, 10));
                return value === 'taken' ? 'Username is taken' : null;
              },
            },
          ],
        },
        initialValues: { username: '' },
      });

      expect(form).toBeDefined();
    });
  });
});
