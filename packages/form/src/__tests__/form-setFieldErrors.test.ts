import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { zodPlugin } from '@nexus-state/form-schema-zod';
import { z } from 'zod';

describe('Form.setFieldErrors', () => {
  let store: ReturnType<typeof createStore>;
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    age: z.number().min(18),
  });

  beforeEach(() => {
    store = createStore();
  });

  it('должен устанавливать несколько ошибок одновременно', () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin, schemaConfig: schema,
      initialValues: { name: '', email: '', age: 0 },
      onSubmit: () => {},
    });

    form.setFieldErrors({
      name: 'Name is required',
      email: 'Invalid email',
    });

    expect(form.errors.name).toBe('Name is required');
    expect(form.errors.email).toBe('Invalid email');
    expect(form.errors.age).toBeUndefined();
  });

  it('должен игнорировать несуществующие поля', () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin, schemaConfig: schema,
      initialValues: { name: '', email: '', age: 0 },
      onSubmit: () => {},
    });

    expect(() => {
      form.setFieldErrors({
        nonexistent: 'Error' as any,
      });
    }).not.toThrow();
  });

  it('должен сбрасывать ошибки при установке null', () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin, schemaConfig: schema,
      initialValues: { name: '', email: '', age: 0 },
      onSubmit: () => {},
    });

    form.setFieldErrors({
      name: 'Error',
      email: 'Error',
    });

    form.setFieldErrors({
      name: null,
    });

    expect(form.errors.name).toBeUndefined();
    expect(form.errors.email).toBe('Error');
  });

  it('должен работать с частичными ошибками', () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin, schemaConfig: schema,
      initialValues: { name: '', email: '', age: 0 },
      onSubmit: () => {},
    });

    form.setFieldErrors({
      email: 'Invalid email',
    });

    expect(form.errors.email).toBe('Invalid email');
    expect(form.errors.name).toBeUndefined();
    expect(form.errors.age).toBeUndefined();
  });

  it('должен обновлять isValid после установки ошибок', () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin, schemaConfig: schema,
      initialValues: { name: 'John', email: 'john@example.com', age: 25 },
      onSubmit: () => {},
    });

    expect(form.isValid).toBe(true);

    form.setFieldErrors({
      name: 'Error',
    });

    expect(form.isValid).toBe(false);
  });

  it('должен устанавливать ошибки на все поля сразу', () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin, schemaConfig: schema,
      initialValues: { name: '', email: '', age: 0 },
      onSubmit: () => {},
    });

    form.setFieldErrors({
      name: 'Name error',
      email: 'Email error',
      age: 'Age error',
    });

    expect(form.errors.name).toBe('Name error');
    expect(form.errors.email).toBe('Email error');
    expect(form.errors.age).toBe('Age error');
  });

  it('должен работать с пустым объектом ошибок', () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin, schemaConfig: schema,
      initialValues: { name: '', email: '', age: 0 },
      onSubmit: () => {},
    });

    expect(() => {
      form.setFieldErrors({});
    }).not.toThrow();
  });
});
