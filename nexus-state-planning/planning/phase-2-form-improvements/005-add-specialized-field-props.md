# Задача 005: Добавить `inputProps` для разных типов полей

## Описание
Добавить специализированные пропсы (`selectProps`, `switchProps`, `checkboxProps`, `radioProps`) для упрощения интеграции полей формы с различными UI-компонентами.

## Проблемы текущей реализации

### Текущий API

```typescript
const field = form.field("name");

field.inputProps: {
  value: TValue;
  onChange: (value: TValue) => void;
  onBlur: () => void;
};
```

### Проблемы

#### 1. Select компонент
```typescript
// Было (неудобно):
<Select
  value={field.value}
  onChange={(value) => field.inputProps.onChange(value)}
  onBlur={field.inputProps.onBlur}
/>

// Проблема: onChange ожидает React.ChangeEvent, а не значение
```

#### 2. Switch/Checkbox компонент
```typescript
// Было (неудобно):
<Switch
  checked={field.value}
  onChange={(checked) => field.inputProps.onChange(checked)}
/>

// Проблема: 
// - inputProps.value не типизирован как boolean
// - inputProps.onChange ожидает ChangeEvent
```

#### 3. Radio компонент
```typescript
// Было (много бойлерплейта):
<Radio
  checked={field.value === 'option1'}
  onChange={() => field.inputProps.onChange('option1')}
/>
```

## Решение

### 1. Обновить интерфейс Field

**Файл:** `packages/form/src/types.ts`

```typescript
export interface Field<TValue = any> {
  value: TValue;
  error: string | null;
  touched: boolean;
  dirty: boolean;

  setValue: (value: TValue) => void;
  setTouched: (touched: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // ← Универсальные inputProps (существующие)
  inputProps: {
    name: string;
    value: TValue;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur: () => void;
  };

  // ← НОВОЕ: Для Select
  selectProps: {
    name: string;
    value: TValue;
    onChange: (value: TValue) => void;
  };

  // ← НОВОЕ: Для Switch/Checkbox
  switchProps: {
    name: string;
    checked: TValue extends boolean ? TValue : never;
    onChange: (checked: boolean) => void;
  };

  // ← НОВОЕ: Для Checkbox (с indeterminate)
  checkboxProps: {
    name: string;
    checked: boolean;
    indeterminate?: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };

  // ← НОВОЕ: Для Radio
  radioProps: {
    name: string;
    checked: boolean;
    onChange: () => void;
  };
}
```

### 2. Реализовать пропсы

**Файл:** `packages/form/src/create-form.ts`

```typescript
import type { ChangeEvent } from 'react';

// Helper to create field props
const createFieldProps = <K extends keyof TValues>(
  name: K,
  meta: FieldMeta<TValues[K]>
): Field<TValues[K]> => {
  const state = store.get(meta.atom);

  // Универсальные inputProps
  const inputProps = {
    name: name as string,
    value: state.value,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
      setFieldValue(store, meta, value as TValues[K]);
    },
    onBlur: () => setFieldTouched(store, meta, true),
  };

  // Для Select
  const selectProps = {
    name: name as string,
    value: state.value,
    onChange: (value: TValues[K]) => {
      setFieldValue(store, meta, value);
    },
  };

  // Для Switch/Checkbox (boolean значения)
  const switchProps = {
    name: name as string,
    checked: state.value as unknown as boolean,
    onChange: (checked: boolean) => {
      setFieldValue(store, meta, checked as unknown as TValues[K]);
    },
  };

  // Для Checkbox (с поддержкой indeterminate)
  const checkboxProps = {
    name: name as string,
    checked: Boolean(state.value),
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setFieldValue(store, meta, e.target.checked as unknown as TValues[K]);
    },
  };

  // Для Radio
  const radioProps = {
    name: name as string,
    checked: Boolean(state.value),
    onChange: () => {
      setFieldValue(store, meta, state.value);
    },
  };

  return {
    value: state.value,
    error: state.error,
    touched: state.touched,
    dirty: state.dirty,
    setValue: (value: TValues[K]) => setFieldValue(store, meta, value),
    setTouched: (touched: boolean) => setFieldTouched(store, meta, touched),
    setError: (error: string | null) => setFieldError(store, meta, error),
    reset: () => resetField(store, meta),
    inputProps,
    selectProps,
    switchProps,
    checkboxProps,
    radioProps,
  };
};
```

## Использование

### Пример 1: Input поле

```tsx
const { field } = useField(form, "name");

// Было:
<Input
  value={field.value}
  onChange={(e) => field.setValue(e.target.value)}
  onBlur={() => field.setTouched(true)}
/>

// Стало:
<Input {...field.inputProps} />
```

### Пример 2: Select поле

```tsx
const { field } = useField(form, "type");

// Было:
<Select
  value={field.value}
  onChange={(value) => field.setValue(value)}
  options={TYPES}
/>

// Стало:
<Select {...field.selectProps} options={TYPES} />
```

### Пример 3: Switch поле

```tsx
const { field } = useField(form, "versioned");

// Было:
<Switch
  checked={field.value}
  onChange={(checked) => field.setValue(checked)}
/>

// Стало:
<Switch {...field.switchProps} />
```

### Пример 4: Checkbox поле

```tsx
const { field } = useField(form, "agree");

// Было:
<Checkbox
  checked={field.value}
  onChange={(e) => field.setValue(e.target.checked)}
/>

// Стало:
<Checkbox {...field.checkboxProps} />
```

### Пример 5: Radio группа

```tsx
const { field } = useField(form, "role");

// Было:
<Radio.Group value={field.value} onChange={(e) => field.setValue(e.target.value)}>
  <Radio value="admin">Admin</Radio>
  <Radio value="user">User</Radio>
</Radio.Group>

// Стало:
<Radio.Group {...field.radioProps}>
  <Radio value="admin">Admin</Radio>
  <Radio value="user">User</Radio>
</Radio.Group>

// Или для单个 Radio:
const adminField = useField(form, "isAdmin");

<Radio 
  {...adminField.radioProps}
  checked={adminField.value === true}
/>
```

## Критерии приемки

- [ ] `inputProps` для текстовых полей (Input, TextArea)
- [ ] `selectProps` для Select
- [ ] `switchProps` для Switch
- [ ] `checkboxProps` для Checkbox
- [ ] `radioProps` для Radio
- [ ] Типизация с проверкой типов (boolean для switch/checkbox)
- [ ] Unit тесты на корректность пропсов
- [ ] Integration тесты с UI-компонентами

## Тесты

### Unit тест

**Файл:** `packages/form/src/__tests__/field-props.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { zodValidator } from '../schema-validation';
import { z } from 'zod';

describe('Field props', () => {
  const schema = z.object({
    name: z.string(),
    type: z.enum(['admin', 'user']),
    active: z.boolean(),
    agree: z.boolean(),
  });

  const store = createStore();
  const form = createForm(store, {
    schema: zodValidator(schema),
    initialValues: {
      name: '',
      type: 'user',
      active: false,
      agree: false,
    },
  });

  describe('inputProps', () => {
    it('должен иметь правильные пропсы для Input', () => {
      const field = form.field('name');

      expect(field.inputProps).toBeDefined();
      expect(field.inputProps.name).toBe('name');
      expect(field.inputProps.value).toBe('');
      expect(field.inputProps.onChange).toBeInstanceOf(Function);
      expect(field.inputProps.onBlur).toBeInstanceOf(Function);
    });

    it('должен обновлять значение при onChange', () => {
      const field = form.field('name');

      field.inputProps.onChange({
        target: { value: 'John' },
      } as React.ChangeEvent<HTMLInputElement>);

      expect(field.value).toBe('John');
    });
  });

  describe('selectProps', () => {
    it('должен иметь правильные пропсы для Select', () => {
      const field = form.field('type');

      expect(field.selectProps).toBeDefined();
      expect(field.selectProps.name).toBe('type');
      expect(field.selectProps.value).toBe('user');
      expect(field.selectProps.onChange).toBeInstanceOf(Function);
    });

    it('должен обновлять значение при onChange', () => {
      const field = form.field('type');

      field.selectProps.onChange('admin');

      expect(field.value).toBe('admin');
    });
  });

  describe('switchProps', () => {
    it('должен иметь правильные пропсы для Switch', () => {
      const field = form.field('active');

      expect(field.switchProps).toBeDefined();
      expect(field.switchProps.name).toBe('active');
      expect(field.switchProps.checked).toBe(false);
      expect(field.switchProps.onChange).toBeInstanceOf(Function);
    });

    it('должен обновлять значение при onChange', () => {
      const field = form.field('active');

      field.switchProps.onChange(true);

      expect(field.value).toBe(true);
    });
  });

  describe('checkboxProps', () => {
    it('должен иметь правильные пропсы для Checkbox', () => {
      const field = form.field('agree');

      expect(field.checkboxProps).toBeDefined();
      expect(field.checkboxProps.name).toBe('agree');
      expect(field.checkboxProps.checked).toBe(false);
    });

    it('должен обновлять значение при onChange', () => {
      const field = form.field('agree');

      field.checkboxProps.onChange({
        target: { checked: true },
      } as React.ChangeEvent<HTMLInputElement>);

      expect(field.value).toBe(true);
    });
  });
});
```

### Integration тест

**Файл:** `packages/form/src/__tests__/field-props-integration.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { zodValidator } from '../schema-validation';
import { useField } from '../react/useField';
import { z } from 'zod';

describe('Field props integration', () => {
  const schema = z.object({
    name: z.string(),
    type: z.enum(['admin', 'user']),
    active: z.boolean(),
  });

  function TestForm() {
    const store = createStore();
    const form = createForm(store, {
      schema: zodValidator(schema),
      initialValues: { name: '', type: 'user', active: false },
    });

    function NameField() {
      const { field } = useField(form, 'name');
      return <input data-testid="name" {...field.inputProps} />;
    }

    function TypeField() {
      const { field } = useField(form, 'type');
      return (
        <select data-testid="type" {...field.selectProps}>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      );
    }

    function ActiveField() {
      const { field } = useField(form, 'active');
      return <input type="checkbox" data-testid="active" {...field.switchProps} />;
    }

    return (
      <div>
        <NameField />
        <TypeField />
        <ActiveField />
      </div>
    );
  }

  it('должен рендерить Input с правильными пропами', () => {
    render(<TestForm />);
    
    const input = screen.getByTestId('name');
    expect(input).toHaveValue('');
  });

  it('должен рендерить Select с правильными пропами', () => {
    render(<TestForm />);
    
    const select = screen.getByTestId('type');
    expect(select).toHaveValue('user');
  });

  it('должен рендерить Checkbox с правильными пропами', () => {
    render(<TestForm />);
    
    const checkbox = screen.getByTestId('active');
    expect(checkbox).not.toBeChecked();
  });
});
```

## Влияние на существующий код

### Обратная совместимость
✅ **Полная** — новые пропсы не ломают существующий код

### Миграция

```diff
// Было:
<Input
  value={field.value}
  onChange={(e) => field.setValue(e.target.value)}
  onBlur={() => field.setTouched(true)}
/>

// Стало:
<Input {...field.inputProps} />
```

```diff
// Было:
<Switch
  checked={field.value}
  onChange={(checked) => field.setValue(checked)}
/>

// Стало:
<Switch {...field.switchProps} />
```

## Зависимости

- ✅ Задача 002: `./002-add-useField-hook.md` (для удобного использования)

## Сложность
**Оценка:** Средняя

**Изменения:**
- ~50 строк в `types.ts` (новые интерфейсы)
- ~60 строк в `create-form.ts` (реализация пропсов)
- ~100 строк тестов
- ~30 строк документации

## Приоритет
**Низкий** — улучшает DX, но не критично

## Преимущества

| Аспект | До | После |
|--------|----|-------|
| **Бойлерплейт** | ~5 строк на поле | ~1 строка |
| **Читаемость** | Средняя | Высокая |
| **Типобезопасность** | Ручная | Автоматическая |
| **Консистентность** | Зависит от разработчика | Гарантирована |

## Сравнение с другими библиотеками

| Библиотека | Пропсы для полей |
|------------|------------------|
| **React Hook Form** | `register()` возвращает `{ onChange, onBlur, value, ref }` |
| **Formik** | `<Field component="input" />` или `getFieldProps()` |
| **VeeValidate** | `useField()` возвращает `{ value, onChange, onBlur }` |
| **@nexus-state/form (до)** | Только `inputProps` |
| **@nexus-state/form (после)** | `inputProps`, `selectProps`, `switchProps`, `checkboxProps`, `radioProps` ✅ |

## Ссылки

- Задача 002: `./002-add-useField-hook.md`
- React events: https://react.dev/reference/react-dom/components/common#common-props
- HTML Input types: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
