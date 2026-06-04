# Задача 003: Добавить `setFieldErrors` для массовых ошибок

## Описание
Добавить метод `setFieldErrors` для массовой установки ошибок на поля формы. Упрощает обработку ошибок валидации от сервера.

## Проблемы текущей реализации

### Текущий подход

```typescript
// Обработка ошибок сервера — 10+ строк бойлерплейта
try {
  await saveOrCreate(dictionaryFormAtom.values);
} catch (error: any) {
  if (error.validationErrors) {
    Object.entries(error.validationErrors).forEach(([field, message]) => {
      dictionaryFormAtom.setFieldError(
        field as keyof DictionaryFormValues,
        message as string
      );
    });
  }
}
```

### Проблемы
- ❌ Дублирование кода в каждом `handleSubmit`
- ❌ Нет типобезопасности при маппинге полей
- ❌ Сложно читать и поддерживать
- ❌ Неочевидный паттерн для новых разработчиков

## Решение

### 1. Обновить интерфейс Form

**Файл:** `packages/form/src/types.ts`

```typescript
export interface Form<TValues extends FormValues = FormValues> {
  values: TValues;
  errors: FormErrors<TValues>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;

  field: <K extends keyof TValues>(name: K) => Field<TValues[K]>;
  getFieldMeta: <K extends keyof TValues>(name: K) => FieldMeta<TValues[K]>;

  // Field array support
  fieldArray: <K extends keyof TValues>(
    name: K,
    defaultItem: TValues[K] extends Array<infer U> ? U : never
  ) => TValues[K] extends Array<infer U> ? FieldArray<U> : never;

  setFieldValue: <K extends keyof TValues>(name: K, value: TValues[K]) => void;
  setFieldError: <K extends keyof TValues>(
    name: K,
    error: string | null
  ) => void;
  
  // ← НОВОЕ: Массовая установка ошибок
  setFieldErrors: (errors: Partial<Record<keyof TValues, string | null>>) => void;
  
  setFieldTouched: <K extends keyof TValues>(name: K, touched: boolean) => void;

  reset: () => void;
  submit: () => Promise<void>;
  validate: () => Promise<boolean>;
}
```

### 2. Реализовать метод

**Файл:** `packages/form/src/create-form.ts`

```typescript
// Helper to set single field error
const setFieldError = <K extends keyof TValues>(name: K, error: string | null) => {
  const meta = core.fields.get(name);
  if (meta) {
    setFieldError(store, meta, error);
  }
};

// ← НОВОЕ: Helper to set multiple field errors
const setFieldErrors = (errors: Partial<Record<keyof TValues, string | null>>) => {
  Object.entries(errors).forEach(([key, error]) => {
    const fieldName = key as keyof TValues;
    const meta = core.fields.get(fieldName);
    if (meta) {
      setFieldError(store, meta, error);
    }
    // Игнорируем несуществующие поля — безопасно для частичных ошибок
  });
};

// Return form API
return {
  // ...
  setFieldError,
  setFieldErrors, // ← Экспортируем
  // ...
};
```

## Использование

### Пример 1: Обработка ошибок сервера

```typescript
// Было:
try {
  await saveOrCreate(dictionaryFormAtom.values);
} catch (error: any) {
  if (error.validationErrors) {
    Object.entries(error.validationErrors).forEach(([field, message]) => {
      dictionaryFormAtom.setFieldError(
        field as keyof DictionaryFormValues,
        message as string
      );
    });
  }
}

// Стало:
try {
  await saveOrCreate(dictionaryFormAtom.values);
} catch (error: any) {
  if (error.validationErrors) {
    dictionaryFormAtom.setFieldErrors(error.validationErrors);
  }
}
```

### Пример 2: Сброс всех ошибок

```typescript
// Сброс всех ошибок формы
dictionaryFormAtom.setFieldErrors({
  code: null,
  name: null,
  description: null,
  type: null,
  storageType: null,
  versioned: null,
});

// Или короче:
dictionaryFormAtom.setFieldErrors(
  Object.fromEntries(
    Object.keys(dictionaryFormAtom.values).map(key => [key, null])
  ) as Record<keyof DictionaryFormValues, null>
);
```

### Пример 3: Частичные ошибки

```typescript
// Установка ошибок только на определенные поля
dictionaryFormAtom.setFieldErrors({
  code: "Такой код уже существует",
  name: "Наименование обязательно",
  // Остальные поля не затрагиваются
});
```

### Пример 4: Валидация на основе других полей

```typescript
const handleSubmit = async () => {
  const { valid, errors } = await dictionaryFormAtom.validate();
  
  if (!valid) {
    // Кросс-полевая валидация
    if (form.values.password !== form.values.confirmPassword) {
      dictionaryFormAtom.setFieldErrors({
        confirmPassword: "Пароли не совпадают",
      });
    }
  }
};
```

## Критерии приемки

- [ ] Массовая установка ошибок за один вызов
- [ ] Игнорирование несуществующих полей (без ошибок)
- [ ] Поддержка `null` для сброса ошибок
- [ ] Типизация: `Partial<Record<keyof TValues, string | null>>`
- [ ] Unit тесты на установку нескольких ошибок
- [ ] Integration тест с обработкой ошибок сервера

## Тесты

### Unit тест

**Файл:** `packages/form/src/__tests__/form-setFieldErrors.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { zodValidator } from '../schema-validation';
import { z } from 'zod';

describe('Form.setFieldErrors', () => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    age: z.number().min(18),
  });

  const store = createStore();
  const form = createForm(store, {
    schema: zodValidator(schema),
    initialValues: { name: '', email: '', age: 0 },
  });

  it('должен устанавливать несколько ошибок одновременно', () => {
    form.setFieldErrors({
      name: 'Name is required',
      email: 'Invalid email',
    });

    expect(form.errors.name).toBe('Name is required');
    expect(form.errors.email).toBe('Invalid email');
    expect(form.errors.age).toBeUndefined();
  });

  it('должен игнорировать несуществующие поля', () => {
    expect(() => {
      form.setFieldErrors({
        nonexistent: 'Error' as any,
      });
    }).not.toThrow();
  });

  it('должен сбрасывать ошибки при установке null', () => {
    form.setFieldErrors({
      name: 'Error',
      email: 'Error',
    });

    form.setFieldErrors({
      name: null,
    });

    expect(form.errors.name).toBeNull();
    expect(form.errors.email).toBe('Error');
  });

  it('должен работать с частичными ошибками', () => {
    form.setFieldErrors({
      email: 'Invalid email',
    });

    expect(form.errors.email).toBe('Invalid email');
    expect(form.errors.name).toBeUndefined();
    expect(form.errors.age).toBeUndefined();
  });

  it('должен обновлять isValid после установки ошибок', () => {
    expect(form.isValid).toBe(true);

    form.setFieldErrors({
      name: 'Error',
    });

    expect(form.isValid).toBe(false);
  });
});
```

### Integration тест

**Файл:** `packages/form/src/__tests__/form-server-errors.integration.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { zodValidator } from '../schema-validation';
import { z } from 'zod';

describe('Form server error handling', () => {
  const schema = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
  });

  const mockApi = {
    updateDictionary: vi.fn(),
  };

  it('должен обрабатывать ошибки валидации от сервера', async () => {
    const store = createStore();
    const form = createForm(store, {
      schema: zodValidator(schema),
      initialValues: { code: '', name: '' },
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
    const store = createStore();
    const form = createForm(store, {
      schema: zodValidator(schema),
      initialValues: { code: '', name: '' },
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

    expect(form.errors.code).toBeNull();
    expect(form.errors.name).toBeNull();
  });
});
```

## Влияние на существующий код

### Обратная совместимость
✅ **Полная** — новый метод не ломает существующий код

### Миграция

```diff
// Было:
catch (error: any) {
  if (error.validationErrors) {
    Object.entries(error.validationErrors).forEach(([field, message]) => {
      form.setFieldError(field as keyof FormValues, message);
    });
  }
}

// Стало:
catch (error: any) {
  if (error.validationErrors) {
    form.setFieldErrors(error.validationErrors);
  }
}
```

**Выигрыш:** -8 строк кода на каждый `handleSubmit`

## Зависимости

- ✅ Нет внешних зависимостей
- ✅ Работает с существующим `setFieldError`

## Сложность
**Оценка:** Низкая

**Изменения:**
- ~15 строк кода в `create-form.ts`
- ~5 строк в `types.ts`
- ~80 строк тестов

## Приоритет
**Средний** — улучшает DX, но не критично

## Преимущества

| Аспект | До | После |
|--------|----|-------|
| **Код на обработку ошибок** | ~10 строк | ~3 строки |
| **Читаемость** | Средняя | Высокая |
| **Типобезопасность** | Частичная | Полная |
| **Поддержка** | Сложно | Легко |

## Ссылки

- Задача 004: `./004-improve-validate-return-type.md`
- Исходная задача: `../../ppcm-fw-frontend/planning/phase-1-dictionary-ui/tasks/015-refactor-form-with-nexus-state-form.md`
