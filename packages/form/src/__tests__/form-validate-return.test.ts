import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { zodPlugin } from '@nexus-state/form-schema-zod';
import { z } from 'zod';

describe('Form.validate return type', () => {
  let store: ReturnType<typeof createStore>;
  const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
  });

  beforeEach(() => {
    store = createStore();
  });

  it('должен возвращать объект с valid и errors', async () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin,
      schemaConfig: schema,
      initialValues: { name: '', email: '' },
    });

    const result = await form.validate();

    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('errors');
    expect(typeof result.valid).toBe('boolean');
    expect(typeof result.errors).toBe('object');
  });

  it('должен возвращать valid=true при успешной валидации', async () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin,
      schemaConfig: schema,
      initialValues: { name: 'John', email: 'john@example.com' },
    });

    const result = await form.validate();

    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  it('должен возвращать valid=false и ошибки при неудаче', async () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin,
      schemaConfig: schema,
      initialValues: { name: 'J', email: 'invalid' },
    });

    const result = await form.validate();

    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe('Name must be at least 2 characters');
    expect(result.errors.email).toBe('Invalid email');
  });

  it('должен возвращать правильные сообщения ошибок', async () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin,
      schemaConfig: schema,
      initialValues: { name: '', email: '' },
    });

    const result = await form.validate();

    expect(result.errors.name).toBeDefined();
    expect(result.errors.email).toBeDefined();
  });

  it('должен очищать ошибки при повторной валидации с валидными данными', async () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin,
      schemaConfig: schema,
      initialValues: { name: '', email: '' },
    });

    // Первая валидация с ошибками
    const result1 = await form.validate();
    expect(result1.valid).toBe(false);
    expect(result1.errors.name).toBeDefined();

    // Устанавливаем валидные значения
    form.setFieldValue('name', 'John');
    form.setFieldValue('email', 'john@example.com');

    // Повторная валидация должна быть успешной
    const result2 = await form.validate();
    expect(result2.valid).toBe(true);
    expect(result2.errors.name).toBeUndefined();
    expect(result2.errors.email).toBeUndefined();
  });

  it('должен возвращать ошибки только для невалидных полей', async () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin,
      schemaConfig: schema,
      initialValues: { name: 'John', email: '' },
    });

    const result = await form.validate();

    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeUndefined(); // name валиден
    expect(result.errors.email).toBeDefined(); // email не валиден
  });
});
