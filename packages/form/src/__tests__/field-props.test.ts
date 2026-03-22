import { describe, it, expect, beforeEach } from 'vitest';
import type { ChangeEvent } from 'react';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { zodPlugin } from '@nexus-state/form-schema-zod';
import { z } from 'zod';

describe('Field props', () => {
  const schema = z.object({
    name: z.string(),
    type: z.enum(['admin', 'user']),
    active: z.boolean(),
    agree: z.boolean(),
  });

  let store: ReturnType<typeof createStore>;
  let form: ReturnType<typeof createForm<z.infer<typeof schema>>>;

  beforeEach(() => {
    store = createStore();
    form = createForm(store, {
      schemaPlugin: zodPlugin,
      schemaConfig: schema,
      initialValues: {
        name: '',
        type: 'user',
        active: false,
        agree: false,
      },
    });
  });

  describe('inputProps', () => {
    let field: ReturnType<typeof form.field<'name'>>;

    beforeEach(() => {
      field = form.field('name');
    });

    it('должен иметь правильные пропсы для Input', () => {
      expect(field.inputProps).toBeDefined();
      expect(field.inputProps.name).toBe('name');
      expect(field.inputProps.value).toBe('');
      expect(field.inputProps.onChange).toBeInstanceOf(Function);
      expect(field.inputProps.onBlur).toBeInstanceOf(Function);
    });

    it('должен обновлять значение при onChange', () => {
      field.inputProps.onChange({
        target: { value: 'John' },
      } as ChangeEvent<HTMLInputElement>);

      expect(form.field('name').value).toBe('John');
    });

    it('должен устанавливать touched при onBlur', () => {
      expect(form.field('name').touched).toBe(false);
      field.inputProps.onBlur();

      expect(form.field('name').touched).toBe(true);
    });
  });

  describe('selectProps', () => {
    let field: ReturnType<typeof form.field<'type'>>;

    beforeEach(() => {
      field = form.field('type');
    });

    it('должен иметь правильные пропсы для Select', () => {
      expect(field.selectProps).toBeDefined();
      expect(field.selectProps.name).toBe('type');
      expect(field.selectProps.value).toBe('user');
      expect(field.selectProps.onChange).toBeInstanceOf(Function);
    });

    it('должен обновлять значение при onChange', () => {
      field.selectProps.onChange('admin');

      expect(form.field('type').value).toBe('admin');
    });
  });

  describe('switchProps', () => {
    let field: ReturnType<typeof form.field<'active'>>;

    beforeEach(() => {
      field = form.field('active');
    });

    it('должен иметь правильные пропсы для Switch', () => {
      expect(field.switchProps).toBeDefined();
      expect(field.switchProps.name).toBe('active');
      expect(field.switchProps.checked).toBe(false);
      expect(field.switchProps.onChange).toBeInstanceOf(Function);
    });

    it('должен обновлять значение при onChange', () => {
      field.switchProps.onChange(true);

      expect(form.field('active').value).toBe(true);
    });

    it('должен переключать значение с false на true', () => {
      field.switchProps.onChange(true);
      expect(form.field('active').value).toBe(true);

      field.switchProps.onChange(false);
      expect(form.field('active').value).toBe(false);
    });
  });

  describe('checkboxProps', () => {
    let field: ReturnType<typeof form.field<'agree'>>;

    beforeEach(() => {
      field = form.field('agree');
    });

    it('должен иметь правильные пропсы для Checkbox', () => {
      expect(field.checkboxProps).toBeDefined();
      expect(field.checkboxProps.name).toBe('agree');
      expect(field.checkboxProps.checked).toBe(false);
    });

    it('должен обновлять значение при onChange', () => {
      field.checkboxProps.onChange({
        target: { checked: true },
      } as ChangeEvent<HTMLInputElement>);

      expect(form.field('agree').value).toBe(true);
    });

    it('должен переключать значение с true на false', () => {
      field.checkboxProps.onChange({
        target: { checked: true },
      } as ChangeEvent<HTMLInputElement>);
      expect(form.field('agree').value).toBe(true);

      field.checkboxProps.onChange({
        target: { checked: false },
      } as ChangeEvent<HTMLInputElement>);
      expect(form.field('agree').value).toBe(false);
    });
  });

  describe('radioProps', () => {
    let field: ReturnType<typeof form.field<'type'>>;

    beforeEach(() => {
      field = form.field('type');
    });

    it('должен иметь правильные пропсы для Radio', () => {
      expect(field.radioProps).toBeDefined();
      expect(field.radioProps.name).toBe('type');
      // checked для radio основан на Boolean(value), для 'user' будет true
      expect(field.radioProps.checked).toBe(true);
    });

    it('должен обновлять значение при onChange', () => {
      field.radioProps.onChange({
        target: { value: 'admin' },
      } as ChangeEvent<HTMLInputElement>);

      expect(form.field('type').value).toBe('admin');
    });

    it('должен иметь checked=true когда значение совпадает', () => {
      field.setValue('admin');
      // После изменения значения, radioProps будет иметь новое значение
      const updatedField = form.field('type');
      expect(updatedField.radioProps.checked).toBe(true);
    });
  });

  describe('все пропсы должны быть определены', () => {
    it('должен иметь все пропсы для любого поля', () => {
      const field = form.field('name');

      expect(field.inputProps).toBeDefined();
      expect(field.selectProps).toBeDefined();
      expect(field.switchProps).toBeDefined();
      expect(field.checkboxProps).toBeDefined();
      expect(field.radioProps).toBeDefined();
    });
  });
});
