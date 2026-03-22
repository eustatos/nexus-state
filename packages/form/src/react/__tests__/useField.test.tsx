import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, WrapperComponent } from '@testing-library/react';
import { createStore } from '@nexus-state/core';
import { StoreProvider } from '@nexus-state/react';
import { createForm } from '../../create-form';
import { zodPlugin } from '@nexus-state/form-schema-zod';
import { useField } from '../useField';
import { z } from 'zod';

describe('useField', () => {
  let store: ReturnType<typeof createStore>;
  let form: ReturnType<typeof createForm<{ name: string; email: string }>>;

  const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email(),
  });

  beforeEach(() => {
    store = createStore();
    form = createForm(store, {
      schemaPlugin: zodPlugin, schemaConfig: schema,
      initialValues: { name: '', email: '' },
      onSubmit: () => {},
    });
  });

  const wrapper: WrapperComponent = ({ children }) => (
    <StoreProvider store={store}>{children}</StoreProvider>
  );

  it('должен возвращать field props и field state', () => {
    const { result } = renderHook(() => useField(form, 'name'), { wrapper });

    expect(result.current.field).toBeDefined();
    expect(result.current.field.name).toBe('name');
    expect(result.current.field.value).toBe('');
    expect(result.current.field.onChange).toBeInstanceOf(Function);
    expect(result.current.field.onBlur).toBeInstanceOf(Function);

    expect(result.current.fieldState).toBeDefined();
    expect(result.current.fieldState.error).toBe(null);
    expect(result.current.fieldState.isDirty).toBe(false);
    expect(result.current.fieldState.isTouched).toBe(false);
  });

  it('должен обновлять значение при onChange', () => {
    const { result } = renderHook(() => useField(form, 'name'), { wrapper });

    act(() => {
      result.current.field.onChange({
        target: { value: 'John' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.field.value).toBe('John');
    expect(result.current.fieldState.isDirty).toBe(true);
  });

  it('должен устанавливать touched при onBlur', () => {
    const { result } = renderHook(() => useField(form, 'name'), { wrapper });

    act(() => {
      result.current.field.onBlur();
    });

    expect(result.current.fieldState.isTouched).toBe(true);
  });

  it('должен показывать ошибку валидации', async () => {
    const { result } = renderHook(() => useField(form, 'name'), { wrapper });

    // Устанавливаем невалидное значение
    act(() => {
      result.current.field.onChange({
        target: { value: 'J' }, // Меньше 2 символов
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.field.onBlur();
    });

    // Ждем обновления состояния
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Ошибка должна быть установлена
    expect(result.current.fieldState.error).toBeDefined();
  });

  it('должен иметь стабильную ссылку на onChange', () => {
    const { result, rerender } = renderHook(() => useField(form, 'name'), { wrapper });
    const onChange1 = result.current.field.onChange;

    rerender();
    const onChange2 = result.current.field.onChange;

    expect(onChange1).toBe(onChange2);
  });

  it('должен иметь стабильную ссылку на onBlur', () => {
    const { result, rerender } = renderHook(() => useField(form, 'name'), { wrapper });
    const onBlur1 = result.current.field.onBlur;

    rerender();
    const onBlur2 = result.current.field.onBlur;

    expect(onBlur1).toBe(onBlur2);
  });

  it('должен корректно работать с разными полями', () => {
    const { result: nameResult } = renderHook(() => useField(form, 'name'), { wrapper });
    const { result: emailResult } = renderHook(() => useField(form, 'email'), { wrapper });

    act(() => {
      nameResult.current.field.onChange({
        target: { value: 'John' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(nameResult.current.field.value).toBe('John');
    expect(emailResult.current.field.value).toBe('');
  });

  it('должен бросать ошибку для несуществующего поля', () => {
    expect(() => {
      renderHook(() => useField(form, 'nonexistent' as any), { wrapper });
    }).toThrow('Field "nonexistent" not found in form');
  });
});
