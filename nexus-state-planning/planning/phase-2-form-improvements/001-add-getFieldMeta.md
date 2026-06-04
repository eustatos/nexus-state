# Задача 001: Добавить `getFieldMeta` в Form API

## Описание
Добавить метод `getFieldMeta` в интерфейс Form для получения доступа к метаданным поля (включая атом) для реактивной подписки.

## Проблемы текущей реализации

### Текущий API
```typescript
const field = form.field("name");
// field — это Field (снимок состояния)
// field.value, field.error — обычные значения, не атомы
```

### Проблема
```typescript
// Невозможно подписаться на изменение поля
const CodeField = () => {
  const field = form.field("code");
  
  return <Input value={field.value} onChange={...} />;
  // value не обновляется реактивно!
};
```

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
  
  // ← НОВОЕ
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
  setFieldTouched: <K extends keyof TValues>(name: K, touched: boolean) => void;

  reset: () => void;
  submit: () => Promise<void>;
  validate: () => Promise<boolean>;
}
```

### 2. Реализовать метод

**Файл:** `packages/form/src/create-form.ts`

```typescript
// Helper to get field API
const field = <K extends keyof TValues>(name: K): Field<TValues[K]> => {
  const meta = core.fields.get(name);
  if (!meta) {
    throw new Error(`Field "${String(name)}" not found in form`);
  }

  const fieldState = store.get(meta.atom);

  return {
    value: fieldState.value,
    error: fieldState.error,
    touched: fieldState.touched,
    dirty: fieldState.dirty,

    setValue: (value: TValues[K]) => {
      setFieldValue(store, meta as any, value);
      // ...
    },
    // ...
  };
};

// ← НОВОЕ: Helper to get field metadata
const getFieldMeta = <K extends keyof TValues>(name: K): FieldMeta<TValues[K]> => {
  const meta = core.fields.get(name);
  if (!meta) {
    throw new Error(`Field "${String(name)}" not found in form`);
  }
  return meta as FieldMeta<TValues[K]>;
};

// Return form API
return {
  values: core.getValues(),
  errors: core.getErrors(),
  isValid: core.getIsValid(),
  isDirty: core.getIsDirty(),
  isSubmitting: core.getIsSubmitting(),

  field,
  getFieldMeta, // ← Экспортируем
  fieldArray,

  setFieldValue,
  setFieldError,
  setFieldTouched,
  reset,
  submit,
  validate,
};
```

## Использование

### Пример 1: Реактивная подписка на поле

```typescript
import { useAtomValue } from "@nexus-state/react";
import { dictionaryFormAtom } from "./form";

const CodeField = () => {
  const fieldMeta = dictionaryFormAtom.getFieldMeta("code");
  const state = useAtomValue(fieldMeta.atom);
  
  return (
    <Input
      value={state.value}
      error={state.error}
      onChange={(e) => dictionaryFormAtom.setFieldValue("code", e.target.value)}
    />
  );
};
```

### Пример 2: Кастомный хук

```typescript
export const useDictionaryFormField = <K extends keyof DictionaryFormValues>(
  fieldName: K,
) => {
  const fieldMeta = dictionaryFormAtom.getFieldMeta(fieldName);
  const state = useAtomValue(fieldMeta.atom);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      dictionaryFormAtom.setFieldValue(fieldName, e.target.value);
    },
    [fieldName]
  );

  return {
    field: {
      name: fieldName,
      value: state.value,
      onChange,
    },
    fieldState: {
      error: state.error,
      isDirty: state.dirty,
      isTouched: state.touched,
      isValidating: state.validating,
    },
  };
};
```

## Критерии приемки

- [ ] `getFieldMeta` возвращает `FieldMeta` с атомом
- [ ] Типизация: `<K extends keyof TValues>(name: K) => FieldMeta<TValues[K]>`
- [ ] Бросает ошибку, если поле не найдено
- [ ] Unit тесты на корректность возврата меты
- [ ] Integration тест с реактивной подпиской

## Тесты

### Unit тест

**Файл:** `packages/form/src/__tests__/form-field-meta.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { zodValidator } from '../schema-validation';
import { z } from 'zod';

describe('Form.getFieldMeta', () => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
  });

  const store = createStore();
  const form = createForm(store, {
    schema: zodValidator(schema),
    initialValues: { name: '', email: '' },
  });

  it('должен возвращать FieldMeta для существующего поля', () => {
    const meta = form.getFieldMeta('name');
    
    expect(meta).toBeDefined();
    expect(meta.name).toBe('name');
    expect(meta.atom).toBeDefined();
    expect(meta.initialValue).toBe('');
  });

  it('должен бросать ошибку для несуществующего поля', () => {
    expect(() => form.getFieldMeta('nonexistent' as any)).toThrow(
      'Field "nonexistent" not found in form'
    );
  });

  it('должен возвращать атом для подписки', () => {
    const meta = form.getFieldMeta('name');
    const state = store.get(meta.atom);
    
    expect(state.value).toBe('');
    expect(state.error).toBe(null);
    expect(state.touched).toBe(false);
  });

  it('должен обновлять состояние при изменении поля', () => {
    const meta = form.getFieldMeta('name');
    
    form.setFieldValue('name', 'John');
    const state = store.get(meta.atom);
    
    expect(state.value).toBe('John');
    expect(state.dirty).toBe(true);
  });
});
```

## Влияние на существующий код

**Обратная совместимость:** ✅ Полная

- Новый метод не ломает существующий API
- `field()` продолжает работать как раньше
- `getFieldMeta()` — опциональное дополнение

## Сложность
**Оценка:** Низкая

**Изменения:**
- ~10 строк кода в `create-form.ts`
- ~5 строк в `types.ts`
- ~50 строк тестов

## Приоритет
**Высокий** — требуется для создания `useField` хука

## Ссылки
- Задача 002: `./002-add-useField-hook.md`
- Исходная задача: `../../ppcm-fw-frontend/planning/phase-1-dictionary-ui/tasks/015-refactor-form-with-nexus-state-form.md`
