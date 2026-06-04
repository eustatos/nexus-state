# Задача 002: Добавить хук `useField` в @nexus-state/form/react

## Описание
Добавить встроенный React хук `useField` для удобной подписки на поля формы с автоматическим управлением состоянием и handlers.

## Проблемы текущей реализации

### Текущий подход (кастомный хук)

```typescript
// apps/app/src/pages/admin/dictionaries/form.ts
export const useDictionaryFormField = <K extends keyof DictionaryFormValues>(
  fieldName: K,
) => {
  const field = useMemo(
    () => dictionaryFormAtom.field(fieldName),
    [fieldName],
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      dictionaryFormAtom.setFieldValue(fieldName, e.target.value);
    },
    [fieldName],
  );

  // ... ~40 строк бойлерплейта
};
```

### Проблемы
- ❌ 40+ строк бойлерплейта на каждую форму
- ❌ Дублирование кода между проектами
- ❌ Нет стандартного решения в библиотеке
- ❌ Сложно поддерживать консистентность

## Решение

### 1. Создать хук `useField`

**Файл:** `packages/form/src/react/useField.tsx`

```typescript
import { useMemo, useCallback } from 'react';
import { useAtomValue } from '@nexus-state/react';
import type { Form, FieldMeta } from '../types';
import type { ChangeEvent } from 'react';

export interface UseFieldReturn<TValue> {
  field: {
    name: string;
    value: TValue;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur: () => void;
  };
  fieldState: {
    error: string | null;
    isDirty: boolean;
    isTouched: boolean;
    isValidating: boolean;
  };
}

/**
 * Hook for subscribing to form field changes
 * 
 * @param form - Form instance
 * @param fieldName - Field name to subscribe to
 * @returns Field props and state
 * 
 * @example
 * ```tsx
 * function NameField() {
 *   const { field, fieldState } = useField(form, "name");
 * 
 *   return (
 *     <div>
 *       <input {...field} />
 *       {fieldState.error && <span>{fieldState.error}</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useField<
  TValues extends Record<string, any>,
  K extends keyof TValues
>(
  form: Form<TValues>,
  fieldName: K
): UseFieldReturn<TValues[K]> {
  // Get field metadata (stable reference via useMemo)
  const fieldMeta = useMemo(
    () => form.getFieldMeta(fieldName),
    [form, fieldName]
  );

  // Subscribe to field state changes
  const state = useAtomValue(fieldMeta.atom);

  // Create stable onChange handler
  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      form.setFieldValue(fieldName, e.target.value);
    },
    [form, fieldName]
  );

  // Create stable onBlur handler
  const onBlur = useCallback(() => {
    form.setFieldTouched(fieldName, true);
  }, [form, fieldName]);

  return {
    field: {
      name: fieldName as string,
      value: state.value,
      onChange,
      onBlur,
    },
    fieldState: {
      error: state.error,
      isDirty: state.dirty,
      isTouched: state.touched,
      isValidating: state.validating,
    },
  };
}
```

### 2. Экспортировать хук

**Файл:** `packages/form/src/react/index.ts`

```typescript
export { useForm } from './useForm';
export { useField } from './useField'; // ← НОВОЕ
export { useFieldArray } from './useFieldArray';

export type {
  UseFormOptions,
  UseFormReturn,
  FormState,
  UseFieldReturn, // ← Экспортируем тип
  UseFieldArrayReturn,
  FormContextType,
} from './types';
```

## Использование

### Пример 1: Базовое использование

```tsx
import { useField } from "@nexus-state/form/react";

function NameField() {
  const { field, fieldState } = useField(form, "name");

  return (
    <FormControl label="Name" error={fieldState.error}>
      <input {...field} />
    </FormControl>
  );
}
```

### Пример 2: Замена кастомного хука

```tsx
// Было (кастомный хук):
import { useDictionaryFormField } from "../form";

const CodeField = () => {
  const { field, fieldState } = useDictionaryFormField("code");
  return <Input {...field} error={fieldState.error} />;
};

// Стало (встроенный хук):
import { useField } from "@nexus-state/form/react";

const CodeField = () => {
  const { field, fieldState } = useField(dictionaryFormAtom, "code");
  return <Input {...field} error={fieldState.error} />;
};
```

### Пример 3: Select поле

```tsx
function TypeField() {
  const { field, fieldState } = useField(form, "type");

  return (
    <Select
      name={field.name}
      value={field.value}
      onChange={(value) => field.onChange({ target: { value } })}
      error={fieldState.error}
      options={TYPES}
    />
  );
}
```

### Пример 4: Switch/Checkbox поле

```tsx
function VersionedField() {
  const { field, fieldState } = useField(form, "versioned");

  return (
    <Switch
      checked={field.value}
      onChange={(checked) => field.onChange({ target: { value: checked } })}
      error={fieldState.error}
    />
  );
}
```

## Критерии приемки

- [ ] Хук экспортируется из `@nexus-state/form/react`
- [ ] Полная типизация с выводом типов из Form
- [ ] Реактивное обновление при изменении поля
- [ ] Стабильные ссылки на handlers (useCallback)
- [ ] Unit тесты с рендерингом
- [ ] Integration тесты с формой
- [ ] Документация с примерами

## Тесты

### Unit тест

**Файл:** `packages/form/src/react/__tests__/useField.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createStore } from '@nexus-state/core';
import { createForm } from '../../create-form';
import { zodValidator } from '../../schema-validation';
import { useField } from '../useField';
import { z } from 'zod';

describe('useField', () => {
  const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email(),
  });

  const store = createStore();
  const form = createForm(store, {
    schema: zodValidator(schema),
    initialValues: { name: '', email: '' },
  });

  it('должен возвращать field props и field state', () => {
    const { result } = renderHook(() => useField(form, 'name'));

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
    const { result } = renderHook(() => useField(form, 'name'));

    act(() => {
      result.current.field.onChange({
        target: { value: 'John' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.field.value).toBe('John');
    expect(result.current.fieldState.isDirty).toBe(true);
  });

  it('должен устанавливать touched при onBlur', () => {
    const { result } = renderHook(() => useField(form, 'name'));

    act(() => {
      result.current.field.onBlur();
    });

    expect(result.current.fieldState.isTouched).toBe(true);
  });

  it('должен показывать ошибку валидации', () => {
    const { result } = renderHook(() => useField(form, 'name'));

    // Устанавливаем невалидное значение
    act(() => {
      result.current.field.onChange({
        target: { value: 'J' }, // Меньше 2 символов
      } as React.ChangeEvent<HTMLInputElement>);
      result.current.field.onBlur();
    });

    expect(result.current.fieldState.error).toBe(
      'Name must be at least 2 characters'
    );
  });

  it('должен иметь стабильную ссылку на onChange', () => {
    const { result, rerender } = renderHook(() => useField(form, 'name'));
    const onChange1 = result.current.field.onChange;

    rerender();
    const onChange2 = result.current.field.onChange;

    expect(onChange1).toBe(onChange2);
  });
});
```

### Integration тест

**Файл:** `packages/form/src/react/__tests__/useField.integration.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createStore } from '@nexus-state/core';
import { createForm } from '../../create-form';
import { zodValidator } from '../../schema-validation';
import { useField } from '../useField';
import { z } from 'zod';

describe('useField integration', () => {
  const schema = z.object({
    username: z.string().min(3),
  });

  function TestComponent() {
    const store = createStore();
    const form = createForm(store, {
      schema: zodValidator(schema),
      initialValues: { username: '' },
    });

    function UsernameField() {
      const { field, fieldState } = useField(form, 'username');
      return (
        <div>
          <input data-testid="username" {...field} />
          {fieldState.error && (
            <span data-testid="error">{fieldState.error}</span>
          )}
        </div>
      );
    }

    return <UsernameField />;
  }

  it('должен реактивно обновляться при вводе', () => {
    render(<TestComponent />);

    const input = screen.getByTestId('username');
    fireEvent.change(input, { target: { value: 'john' } });

    expect(input).toHaveValue('john');
  });

  it('должен показывать ошибку при невалидном вводе', () => {
    render(<TestComponent />);

    const input = screen.getByTestId('username');
    fireEvent.change(input, { target: { value: 'jo' } });
    fireEvent.blur(input);

    expect(screen.getByTestId('error')).toHaveTextContent(
      'Required'
    );
  });
});
```

## Влияние на существующий код

### Обратная совместимость
✅ **Полная** — новый хук не ломает существующий код

### Миграция

```diff
// Было (кастомный хук):
-import { useDictionaryFormField } from "../form";
+import { useField } from "@nexus-state/form/react";

-const { field, fieldState } = useDictionaryFormField("code");
+const { field, fieldState } = useField(dictionaryFormAtom, "code");
```

## Зависимости

- ✅ Задача 001: `./001-add-getFieldMeta.md` (требуется `getFieldMeta`)

## Сложность
**Оценка:** Средняя

**Изменения:**
- ~80 строк кода хука
- ~100 строк тестов
- ~20 строк документации

## Приоритет
**Высокий** — критично для эргономики React-разработчиков

## Преимущества

| Аспект | До (кастомный хук) | После (useField) |
|--------|-------------------|------------------|
| **Код на форму** | ~40 строк | ~5 строк |
| **Бойлерплейт** | Высокий | Минимальный |
| **Стандартизация** | ❌ Нет | ✅ Есть |
| **Поддержка** | Сложно | Легко |
| **Документация** | ❌ Нет | ✅ Встроена |

## Ссылки

- Задача 001: `./001-add-getFieldMeta.md`
- `useForm` хук: `packages/form/src/react/useForm.tsx`
- React docs: https://react.dev/reference/react/useCallback
