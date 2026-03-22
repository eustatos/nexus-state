import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { zodPlugin } from '@nexus-state/form-schema-zod';
import { z } from 'zod';

describe('Form server error handling', () => {
  let store: ReturnType<typeof createStore>;
  const schema = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
  });

  const mockApi = {
    updateDictionary: vi.fn(),
  };

  beforeEach(() => {
    store = createStore();
    mockApi.updateDictionary.mockClear();
  });

  it('должен обрабатывать ошибки валидации от сервера', async () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin, schemaConfig: schema,
      initialValues: { code: '', name: '' },
      onSubmit: () => {},
    });

    // Мок API с ошибкой валидации
    mockApi.updateDictionary.mockRejectedValueOnce({
      validationErrors: {
        code: 'Code already exists',
        name: 'Name is too short',
      },
    });

    try {
      await mockApi.updateDictionary('123', form.values);
    } catch (error: any) {
      // Обработка ошибок
      if (error.validationErrors) {
        form.setFieldErrors(error.validationErrors);
      }
    }

    // Проверяем, что ошибки установлены
    expect(form.errors.code).toBe('Code already exists');
    expect(form.errors.name).toBe('Name is too short');
  });

  it('должен очищать ошибки при успешной отправке', async () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin, schemaConfig: schema,
      initialValues: { code: 'ABC', name: 'Test' },
      onSubmit: () => {},
    });

    // Устанавливаем ошибки
    form.setFieldErrors({
      code: 'Old error',
      name: 'Old error',
    });

    // Мок успешного API
    mockApi.updateDictionary.mockResolvedValueOnce({ id: '123' });

    await mockApi.updateDictionary('123', form.values);

    // Очищаем ошибки
    form.setFieldErrors({
      code: null,
      name: null,
    });

    expect(form.errors.code).toBeUndefined();
    expect(form.errors.name).toBeUndefined();
  });

  it('должен поддерживать паттерн try-catch с setFieldErrors', async () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin, schemaConfig: schema,
      initialValues: { code: '', name: '' },
      onSubmit: () => {},
    });

    // Мок API с ошибкой
    mockApi.updateDictionary.mockRejectedValueOnce({
      validationErrors: {
        code: 'Duplicate code',
      },
    });

    const handleSubmit = async () => {
      try {
        await mockApi.updateDictionary('123', form.values);
        return { success: true };
      } catch (error: any) {
        if (error.validationErrors) {
          form.setFieldErrors(error.validationErrors);
        }
        return { success: false, error };
      }
    };

    const result = await handleSubmit();

    expect(result.success).toBe(false);
    expect(form.errors.code).toBe('Duplicate code');
  });

  it('должен позволять сбрасывать все ошибки формы', () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin, schemaConfig: schema,
      initialValues: { code: '', name: '' },
      onSubmit: () => {},
    });

    // Устанавливаем ошибки
    form.setFieldErrors({
      code: 'Error 1',
      name: 'Error 2',
    });

    // Сбрасываем все ошибки
    form.setFieldErrors({
      code: null,
      name: null,
    });

    expect(form.errors.code).toBeUndefined();
    expect(form.errors.name).toBeUndefined();
    expect(form.isValid).toBe(true);
  });

  it('должен поддерживать частичное обновление ошибок', () => {
    const form = createForm(store, {
      schemaPlugin: zodPlugin, schemaConfig: schema,
      initialValues: { code: '', name: '' },
      onSubmit: () => {},
    });

    // Устанавливаем ошибки на все поля
    form.setFieldErrors({
      code: 'Error 1',
      name: 'Error 2',
    });

    // Обновляем только одну ошибку
    form.setFieldErrors({
      code: 'New error',
    });

    expect(form.errors.code).toBe('New error');
    expect(form.errors.name).toBe('Error 2'); // Не изменилась
  });
});
