import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { zodPlugin } from '@nexus-state/form-schema-zod';
import { z } from 'zod';

describe('Form.getFieldMeta', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
  });

  describe('basic functionality', () => {
    it('должен возвращать FieldMeta для существующего поля', () => {
      const form = createForm(store, {
        initialValues: { name: '', email: '' },
        onSubmit: () => {},
      });

      const meta = form.getFieldMeta('name');

      expect(meta).toBeDefined();
      expect(meta.name).toBe('name');
      expect(meta.atom).toBeDefined();
      expect(meta.initialValue).toBe('');
    });

    it('должен бросать ошибку для несуществующего поля', () => {
      const form = createForm(store, {
        initialValues: { name: '' },
        onSubmit: () => {},
      });

      expect(() => form.getFieldMeta('nonexistent' as any)).toThrow(
        'Field "nonexistent" not found in form'
      );
    });

    it('должен возвращать атом для подписки', () => {
      const form = createForm(store, {
        initialValues: { name: '', email: '' },
        onSubmit: () => {},
      });

      const meta = form.getFieldMeta('name');
      const state = store.get(meta.atom);

      expect(state.value).toBe('');
      expect(state.error).toBe(null);
      expect(state.touched).toBe(false);
    });

    it('должен обновлять состояние при изменении поля', () => {
      const form = createForm(store, {
        initialValues: { name: '', email: '' },
        onSubmit: () => {},
      });

      const meta = form.getFieldMeta('name');

      form.setFieldValue('name', 'John');
      const state = store.get(meta.atom);

      expect(state.value).toBe('John');
      expect(state.dirty).toBe(true);
    });
  });

  describe('with schema validation', () => {
    it('должен возвращать метаданные с начальными ошибками валидации', () => {
      const form = createForm(store, {
        initialValues: { name: '', email: '' },
        schemaPlugin: zodPlugin, schemaConfig: schema,
        onSubmit: () => {},
      });

      const meta = form.getFieldMeta('name');
      const state = store.get(meta.atom);

      // Поле должно иметь ошибку валидации (пустая строка не проходит min(1))
      expect(state.value).toBe('');
      expect(state.error).toBeDefined();
    });

    it('должен обновлять ошибку при изменении значения', () => {
      const form = createForm(store, {
        initialValues: { name: '', email: 'invalid' },
        schemaPlugin: zodPlugin, schemaConfig: schema,
        onSubmit: () => {},
      });

      const nameMeta = form.getFieldMeta('name');

      // Устанавливаем валидное значение
      form.setFieldValue('name', 'John');
      const nameState = store.get(nameMeta.atom);

      expect(nameState.value).toBe('John');
      // Ошибка должна быть очищена после установки валидного значения
      expect(nameState.error).toBe(null);
    });
  });

  describe('multiple fields', () => {
    it('должен возвращать независимые метаданные для разных полей', () => {
      const form = createForm(store, {
        initialValues: { name: 'John', email: 'john@example.com' },
        onSubmit: () => {},
      });

      const nameMeta = form.getFieldMeta('name');
      const emailMeta = form.getFieldMeta('email');

      expect(nameMeta.name).toBe('name');
      expect(emailMeta.name).toBe('email');
      expect(nameMeta.atom).not.toBe(emailMeta.atom);

      // Изменение одного поля не должно влиять на другое
      form.setFieldValue('name', 'Jane');

      const nameState = store.get(nameMeta.atom);
      const emailState = store.get(emailMeta.atom);

      expect(nameState.value).toBe('Jane');
      expect(emailState.value).toBe('john@example.com');
    });
  });

  describe('field state tracking', () => {
    it('должен отслеживать touched состояние', () => {
      const form = createForm(store, {
        initialValues: { name: '' },
        onSubmit: () => {},
      });

      const meta = form.getFieldMeta('name');

      expect(store.get(meta.atom).touched).toBe(false);

      form.setFieldTouched('name', true);

      expect(store.get(meta.atom).touched).toBe(true);
    });

    it('должен отслеживать dirty состояние', () => {
      const form = createForm(store, {
        initialValues: { name: 'John' },
        onSubmit: () => {},
      });

      const meta = form.getFieldMeta('name');

      expect(store.get(meta.atom).dirty).toBe(false);

      form.setFieldValue('name', 'Jane');

      expect(store.get(meta.atom).dirty).toBe(true);
    });

    it('должен отслеживать состояние ошибки', () => {
      const form = createForm(store, {
        initialValues: { name: '' },
        onSubmit: () => {},
      });

      const meta = form.getFieldMeta('name');

      expect(store.get(meta.atom).error).toBe(null);

      form.setFieldError('name', 'Name is required');

      expect(store.get(meta.atom).error).toBe('Name is required');
    });
  });

  describe('type safety', () => {
    it('должен корректно определять тип значения поля', () => {
      const form = createForm(store, {
        initialValues: {
          name: 'John',
          age: 30,
          active: true,
        },
        onSubmit: () => {},
      });

      const nameMeta = form.getFieldMeta('name');
      const ageMeta = form.getFieldMeta('age');
      const activeMeta = form.getFieldMeta('active');

      const nameState = store.get(nameMeta.atom);
      const ageState = store.get(ageMeta.atom);
      const activeState = store.get(activeMeta.atom);

      expect(typeof nameState.value).toBe('string');
      expect(typeof ageState.value).toBe('number');
      expect(typeof activeState.value).toBe('boolean');
    });
  });
});
