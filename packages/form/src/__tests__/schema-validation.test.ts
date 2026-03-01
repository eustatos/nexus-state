import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { zodValidator, yupValidator } from '../schema-validation';
import { z } from 'zod';
import * as yup from 'yup';

describe('Schema Validation', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('Zod Integration', () => {
    it('should validate form with Zod schema', async () => {
      const schema = z.object({
        email: z.string().email('Invalid email'),
        age: z.number().min(18, 'Must be 18 or older')
      });

      const form = createForm(store, {
        initialValues: {
          email: '',
          age: 0
        },
        schema: zodValidator(schema),
        onSubmit: () => {}
      });

      const isValid = await form.validate();

      expect(isValid).toBe(false);
      expect(form.errors.email).toBe('Invalid email');
      expect(form.errors.age).toBe('Must be 18 or older');
    });

    it('should pass validation with valid Zod data', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18)
      });

      const form = createForm(store, {
        initialValues: {
          email: 'test@example.com',
          age: 25
        },
        schema: zodValidator(schema),
        onSubmit: () => {}
      });

      const isValid = await form.validate();

      expect(isValid).toBe(true);
      expect(form.errors).toEqual({});
    });

    it('should validate field on change with Zod', async () => {
      const schema = z.object({
        email: z.string().email('Invalid email'),
        password: z.string().min(8, 'Too short')
      });

      const form = createForm(store, {
        initialValues: {
          email: '',
          password: ''
        },
        schema: zodValidator(schema),
        validateOnChange: true,
        onSubmit: () => {}
      });

      const emailField = form.field('email');
      emailField.setValue('invalid');

      // Wait for async validation
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(form.field('email').error).toBe('Invalid email');
    });

    it('should validate nested Zod schemas', async () => {
      const schema = z.object({
        name: z.string().min(1, 'Name required'),
        email: z.string().email('Invalid email')
      });

      const form = createForm(store, {
        initialValues: {
          name: '',
          email: 'invalid'
        },
        schema: zodValidator(schema),
        onSubmit: () => {}
      });

      await form.validate();

      expect(form.errors.name).toBeDefined();
      expect(form.errors.email).toBeDefined();
    });
  });

  describe('Yup Integration', () => {
    it('should validate form with Yup schema', async () => {
      const schema = yup.object({
        email: yup.string().email('Invalid email').required('Required'),
        age: yup.number().min(18, 'Must be 18 or older').required('Required')
      });

      const form = createForm(store, {
        initialValues: {
          email: '',
          age: 0
        },
        schema: yupValidator(schema),
        onSubmit: () => {}
      });

      const isValid = await form.validate();

      expect(isValid).toBe(false);
      expect(form.errors.email).toBeTruthy();
    });

    it('should pass validation with valid Yup data', async () => {
      const schema = yup.object({
        email: yup.string().email().required(),
        age: yup.number().min(18).required()
      });

      const form = createForm(store, {
        initialValues: {
          email: 'test@example.com',
          age: 25
        },
        schema: yupValidator(schema),
        onSubmit: () => {}
      });

      const isValid = await form.validate();

      expect(isValid).toBe(true);
      expect(form.errors).toEqual({});
    });

    it('should validate field on blur with Yup', async () => {
      const schema = yup.object({
        email: yup.string().email('Invalid email').required(),
        password: yup.string().min(8, 'Too short').required()
      });

      const form = createForm(store, {
        initialValues: {
          email: '',
          password: ''
        },
        schema: yupValidator(schema),
        validateOnBlur: true,
        onSubmit: () => {}
      });

      const emailField = form.field('email');
      emailField.setValue('invalid');
      emailField.setTouched(true);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(form.field('email').error).toBeTruthy();
    });
  });

  describe('Schema Priority', () => {
    it('should use schema validation over custom validate function', async () => {
      const schema = z.object({
        email: z.string().email('Zod error')
      });

      const form = createForm(store, {
        initialValues: { email: 'invalid' },
        schema: zodValidator(schema),
        validate: () => ({
          email: 'Custom error'
        }),
        onSubmit: () => {}
      });

      await form.validate();

      // Schema validation should take precedence
      expect(form.errors.email).toBe('Zod error');
    });
  });

  describe('Yup validateField', () => {
    it('should validate single field with Yup', async () => {
      const schema = yup.object({
        email: yup.string().email('Invalid email').required(),
        password: yup.string().min(8, 'Too short').required()
      });

      const form = createForm(store, {
        initialValues: {
          email: 'test@example.com',
          password: ''
        },
        schema: yupValidator(schema),
        onSubmit: () => {}
      });

      const validator = yupValidator(schema);
      const error = await validator.validateField?.('password', '', { email: 'test@example.com', password: '' });

      expect(error).toBeTruthy();
    });

    it('should return null for valid field with Yup', async () => {
      const schema = yup.object({
        email: yup.string().email().required(),
        password: yup.string().min(8).required()
      });

      const validator = yupValidator(schema);
      const error = await validator.validateField?.('email', 'test@example.com', { email: 'test@example.com', password: '12345678' });

      expect(error).toBeNull();
    });
  });
});
