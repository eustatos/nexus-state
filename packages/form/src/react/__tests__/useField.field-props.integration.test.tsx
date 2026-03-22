import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createStore } from '@nexus-state/core';
import { StoreProvider } from '@nexus-state/react';
import { createForm } from '../../create-form';
import { zodPlugin } from '@nexus-state/form-schema-zod';
import { useField } from '../useField';
import { z } from 'zod';

describe('Field props integration', () => {
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
      schemaPlugin: zodPlugin, schemaConfig: schema,
      initialValues: {
        name: '',
        type: 'user',
        active: false,
        agree: false,
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreProvider store={store}>{children}</StoreProvider>
  );

  describe('inputProps', () => {
    it('должен рендерить Input с правильными пропами', () => {
      function NameField() {
        const field = form.field('name');
        return <input data-testid="name" {...field.inputProps} />;
      }

      render(<NameField />, { wrapper });

      const input = screen.getByTestId('name');
      expect((input as HTMLInputElement).value).toBe('');
      expect(input.getAttribute('name')).toBe('name');
    });

    it('должен обновлять значение Input при вводе', () => {
      function NameField() {
        const field = form.field('name');
        return <input data-testid="name" {...field.inputProps} />;
      }

      render(<NameField />, { wrapper });

      const input = screen.getByTestId('name') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'John' } });

      expect(form.field('name').value).toBe('John');
    });
  });

  describe('selectProps', () => {
    it('должен рендерить Select с правильными пропами', () => {
      function TypeField() {
        const field = form.field('type');
        return (
          <select data-testid="type" {...field.selectProps}>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        );
      }

      render(<TypeField />, { wrapper });

      const select = screen.getByTestId('type');
      expect((select as HTMLSelectElement).value).toBe('user');
      expect(select.getAttribute('name')).toBe('type');
    });

    it('должен обновлять значение Select при изменении', () => {
      function TypeField() {
        const field = form.field('type');
        return (
          <select
            data-testid="type"
            name={field.selectProps.name}
            value={field.selectProps.value}
            onChange={(e) => field.selectProps.onChange(e.target.value as any)}
          >
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        );
      }

      render(<TypeField />, { wrapper });

      const select = screen.getByTestId('type') as HTMLSelectElement;
      select.value = 'admin';
      fireEvent.change(select);

      expect(form.field('type').value).toBe('admin');
    });
  });

  describe('switchProps', () => {
    it('должен рендерить Switch/Checkbox с правильными пропами', () => {
      function ActiveField() {
        const field = form.field('active');
        return (
          <input
            type="checkbox"
            data-testid="active"
            name={field.switchProps.name}
            checked={field.switchProps.checked}
            onChange={(e) => field.switchProps.onChange(e.target.checked)}
          />
        );
      }

      render(<ActiveField />, { wrapper });

      const checkbox = screen.getByTestId('active');
      expect((checkbox as HTMLInputElement).checked).toBe(false);
      expect(checkbox.getAttribute('name')).toBe('active');
    });

    it('должен переключать значение при клике', () => {
      function ActiveField() {
        const field = form.field('active');
        return (
          <input
            type="checkbox"
            data-testid="active"
            name={field.switchProps.name}
            checked={field.switchProps.checked}
            onChange={(e) => field.switchProps.onChange(e.target.checked)}
          />
        );
      }

      render(<ActiveField />, { wrapper });

      const checkbox = screen.getByTestId('active') as HTMLInputElement;
      fireEvent.click(checkbox);

      // switchProps.onChange устанавливает значение напрямую
      expect(form.field('active').value).toBe(true);
    });
  });

  describe('checkboxProps', () => {
    it('должен рендерить Checkbox с правильными пропами', () => {
      function AgreeField() {
        const field = form.field('agree');
        return (
          <input
            type="checkbox"
            data-testid="agree"
            name={field.checkboxProps.name}
            checked={field.checkboxProps.checked}
            onChange={field.checkboxProps.onChange}
          />
        );
      }

      render(<AgreeField />, { wrapper });

      const checkbox = screen.getByTestId('agree');
      expect((checkbox as HTMLInputElement).checked).toBe(false);
      expect(checkbox.getAttribute('name')).toBe('agree');
    });

    it('должен переключать значение при изменении', () => {
      function AgreeField() {
        const field = form.field('agree');
        return (
          <input
            type="checkbox"
            data-testid="agree"
            name={field.checkboxProps.name}
            checked={field.checkboxProps.checked}
            onChange={field.checkboxProps.onChange}
          />
        );
      }

      render(<AgreeField />, { wrapper });

      const checkbox = screen.getByTestId('agree') as HTMLInputElement;
      fireEvent.click(checkbox);

      // checkboxProps.onChange устанавливает значение из e.target.checked
      expect(form.field('agree').value).toBe(true);
    });
  });

  describe('radioProps', () => {
    it('должен рендерить Radio группу с правильными пропами', () => {
      function TypeRadioGroup() {
        const field = form.field('type');
        return (
          <div data-testid="type-radio">
            <label>
              <input
                type="radio"
                name={field.radioProps.name}
                checked={field.value === 'admin'}
                onChange={(e) => field.radioProps.onChange(e)}
                value="admin"
              />
              Admin
            </label>
            <label>
              <input
                type="radio"
                name={field.radioProps.name}
                checked={field.value === 'user'}
                onChange={(e) => field.radioProps.onChange(e)}
                value="user"
              />
              User
            </label>
          </div>
        );
      }

      render(<TypeRadioGroup />, { wrapper });

      const radioGroup = screen.getByTestId('type-radio');
      const userRadio = radioGroup.querySelector('input[value="user"]') as HTMLInputElement;
      
      expect(userRadio.checked).toBe(true);
      expect(userRadio.getAttribute('name')).toBe('type');
    });

    it('должен переключать значение Radio группы', () => {
      function TypeRadioGroup() {
        const field = form.field('type');
        return (
          <div data-testid="type-radio">
            <label>
              <input
                type="radio"
                name={field.radioProps.name}
                checked={field.value === 'admin'}
                onChange={(e) => field.radioProps.onChange(e)}
                value="admin"
                data-testid="admin-radio"
              />
              Admin
            </label>
            <label>
              <input
                type="radio"
                name={field.radioProps.name}
                checked={field.value === 'user'}
                onChange={(e) => field.radioProps.onChange(e)}
                value="user"
                data-testid="user-radio"
              />
              User
            </label>
          </div>
        );
      }

      render(<TypeRadioGroup />, { wrapper });

      const adminRadio = screen.getByTestId('admin-radio');
      fireEvent.click(adminRadio);

      expect(form.field('type').value).toBe('admin');
    });
  });
});
