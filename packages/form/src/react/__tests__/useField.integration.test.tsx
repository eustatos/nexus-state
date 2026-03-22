import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createStore } from '@nexus-state/core';
import { StoreProvider } from '@nexus-state/react';
import { createForm } from '../../create-form';
import { zodPlugin } from '@nexus-state/form-schema-zod';
import { useField } from '../useField';
import { z } from 'zod';

describe('useField integration', () => {
  const schema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
  });

  function TestComponent() {
    const store = createStore();
    const form = createForm(store, {
      schemaPlugin: zodPlugin, schemaConfig: schema,
      initialValues: { username: '' },
      onSubmit: () => {},
    });

    function UsernameField() {
      const { field, fieldState } = useField(form, 'username');
      return (
        <div>
          <input data-testid="username" {...field} />
          {fieldState.error && (
            <span data-testid="error">{fieldState.error}</span>
          )}
          <span data-testid="dirty">{fieldState.isDirty.toString()}</span>
          <span data-testid="touched">{fieldState.isTouched.toString()}</span>
        </div>
      );
    }

    return (
      <StoreProvider store={store}>
        <UsernameField />
      </StoreProvider>
    );
  }

  it('должен реактивно обновляться при вводе', () => {
    render(<TestComponent />);

    const input = screen.getByTestId<HTMLInputElement>('username');
    fireEvent.change(input, { target: { value: 'john' } });

    expect(input.value).toBe('john');
  });

  it('должен отслеживать dirty состояние', () => {
    render(<TestComponent />);

    const input = screen.getByTestId('username');
    const dirtySpan = screen.getByTestId('dirty');

    expect(dirtySpan.textContent).toBe('false');

    fireEvent.change(input, { target: { value: 'john' } });

    expect(dirtySpan.textContent).toBe('true');
  });

  it('должен отслеживать touched состояние', () => {
    render(<TestComponent />);

    const input = screen.getByTestId('username');
    const touchedSpan = screen.getByTestId('touched');

    expect(touchedSpan.textContent).toBe('false');

    fireEvent.blur(input);

    expect(touchedSpan.textContent).toBe('true');
  });

  it('должен показывать валидное значение после исправления', () => {
    render(<TestComponent />);

    const input = screen.getByTestId<HTMLInputElement>('username');

    // Вводим невалидное значение
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.blur(input);

    // Исправляем на валидное
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(input.value).toBe('abc');
  });
});
