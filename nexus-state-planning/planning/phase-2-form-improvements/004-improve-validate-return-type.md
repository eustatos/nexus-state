# Задача 004: Улучшить `validate()` для возврата ошибок

## Описание
Изменить метод `validate()` для возврата объекта `{ valid: boolean, errors: FormErrors }` вместо простого `boolean`. Это упростит обработку ошибок валидации и устранит необходимость в отдельном вызове `form.errors`.

## Проблемы текущей реализации

### Текущий API

```typescript
const isValid = await dictionaryFormAtom.validate();
// isValid — boolean

// Где ошибки? Нужно отдельно получать:
if (!isValid) {
  const errors = dictionaryFormAtom.errors;
  console.log(errors);
}
```

### Проблемы
- ❌ Два вызова для получения полной информации (`validate()` + `errors`)
- ❌ Неочевидный API (почему `validate()` не возвращает ошибки?)
- ❌ Race condition при асинхронной валидации
- ❌ Несоответствие лучшим практикам (см. Zod, Yup, VeeValidate)

## Решение

### 1. Обновить интерфейс Form

**Файл:** `packages/form/src/types.ts`

```typescript
// ← НОВОЕ: Результат валидации
export interface ValidateResult<TValues extends FormValues> {
  valid: boolean;
  errors: FormErrors<TValues>;
}

export interface Form<TValues extends FormValues = FormValues> {
  values: TValues;
  errors: FormErrors<TValues>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;

  field: <K extends keyof TValues>(name: K) => Field<TValues[K]>;
  getFieldMeta: <K extends keyof TValues>(name: K) => FieldMeta<TValues[K]>;

  fieldArray: <K extends keyof TValues>(
    name: K,
    defaultItem: TValues[K] extends Array<infer U> ? U : never
  ) => TValues[K] extends Array<infer U> ? FieldArray<U> : never;

  setFieldValue: <K extends keyof TValues>(name: K, value: TValues[K]) => void;
  setFieldError: <K extends keyof TValues>(
    name: K,
    error: string | null
  ) => void;
  setFieldErrors: (errors: Partial<Record<keyof TValues, string | null>>) => void;
  setFieldTouched: <K extends keyof TValues>(name: K, touched: boolean) => void;

  reset: () => void;
  submit: () => Promise<void>;
  
  // ← ИЗМЕНЕНИЕ: Возвращает ValidateResult вместо boolean
  validate: () => Promise<ValidateResult<TValues>>;
}
```

### 2. Обновить реализацию

**Файл:** `packages/form/src/validation.ts`

```typescript
import { FormCore } from './core';
import { FormErrors, FormValues, ValidateResult } from './types';

/**
 * Validate all fields and return result with errors
 */
export async function validateAll<TValues extends FormValues>(
  core: FormCore<TValues>,
  validation: ValidationAPI<TValues>
): Promise<ValidateResult<TValues>> {
  // Run validation
  await validation.validateAll();
  
  // Get errors
  const errors = core.getErrors();
  const valid = Object.keys(errors).length === 0;
  
  // Return both valid flag and errors
  return { valid, errors };
}
```

**Файл:** `packages/form/src/create-form.ts`

```typescript
// Update validate method
const validate = async (): Promise<ValidateResult<TValues>> => {
  const result = await validation.validateAll();
  return result;
};

// Return form API
return {
  // ...
  validate, // ← Теперь возвращает ValidateResult
  // ...
};
```

## Использование

### Пример 1: Базовая валидация

```typescript
// Было:
const isValid = await form.validate();
if (!isValid) {
  const errors = form.errors;
  console.log(errors);
}

// Стало:
const { valid, errors } = await form.validate();
if (!valid) {
  console.log(errors); // ← Сразу доступны
}
```

### Пример 2: Обработка с setFieldErrors

```typescript
const handleSubmit = async () => {
  const { valid, errors } = await dictionaryFormAtom.validate();
  
  if (!valid) {
    // Устанавливаем ошибки на поля
    dictionaryFormAtom.setFieldErrors(errors);
    return;
  }
  
  await saveOrCreate(dictionaryFormAtom.values);
};
```

### Пример 3: Частичная валидация

```typescript
const handleSubmit = async () => {
  const { valid, errors } = await form.validate();
  
  if (!valid) {
    // Логируем только определенные ошибки
    if (errors.email) {
      console.error('Email error:', errors.email);
    }
    if (errors.password) {
      console.error('Password error:', errors.password);
    }
    
    form.setFieldErrors(errors);
    return;
  }
  
  // Отправка...
};
```

### Пример 4: Кастомная логика после валидации

```typescript
const handleSubmit = async () => {
  const { valid, errors } = await form.validate();
  
  if (!valid) {
    // Находим первое поле с ошибкой для фокуса
    const firstErrorField = Object.keys(errors)[0] as keyof FormValues;
    focusField(firstErrorField);
    
    form.setFieldErrors(errors);
    return;
  }
  
  // Отправка...
};
```

## Критерии приемки

- [ ] `validate()` возвращает `{ valid, errors }`
- [ ] Обратная совместимость через проверку типа
- [ ] Unit тесты на возврат ошибок
- [ ] Integration тесты с обработкой ошибок
- [ ] Документация обновления (breaking change)
- [ ] Migration guide

## Тесты

### Unit тест

**Файл:** `packages/form/src/__tests__/form-validate-return.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';
import { zodValidator } from '../schema-validation';
import { z } from 'zod';

describe('Form.validate return type', () => {
  const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
  });

  const store = createStore();
  const form = createForm(store, {
    schema: zodValidator(schema),
    initialValues: { name: '', email: '' },
  });

  it('должен возвращать объект с valid и errors', async () => {
    const result = await form.validate();

    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('errors');
    expect(typeof result.valid).toBe('boolean');
    expect(typeof result.errors).toBe('object');
  });

  it('должен возвращать valid=true при успешной валидации', async () => {
    form.setFieldValue('name', 'John');
    form.setFieldValue('email', 'john@example.com');

    const result = await form.validate();

    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  it('должен возвращать valid=false и ошибки при неудаче', async () => {
    form.setFieldValue('name', 'J'); // Меньше 2 символов
    form.setFieldValue('email', 'invalid');

    const result = await form.validate();

    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe('Name must be at least 2 characters');
    expect(result.errors.email).toBe('Invalid email');
  });

  it('должен возвращать правильные сообщения ошибок', async () => {
    form.setFieldValue('name', '');
    form.setFieldValue('email', '');

    const result = await form.validate();

    expect(result.errors.name).toContain('required');
    expect(result.errors.email).toContain('required');
  });
});
```

### Migration тест

**Файл:** `packages/form/src/__tests__/form-validate-migration.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('Form.validate migration', () => {
  it('должен поддерживать проверку на boolean (обратная совместимость)', async () => {
    const result = await form.validate();
    
    // Старый код может проверять на boolean
    if (typeof result === 'boolean') {
      // Старый API
      expect(result).toBe(false);
    } else {
      // Новый API
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    }
  });
});
```

## Влияние на существующий код

### ⚠️ Breaking Change

**Тип изменения:** Мажорное обновление версии (v1.x → v2.0)

**Причина:** Изменение возвращаемого типа метода

### Миграция

#### Вариант 1: Обновление кода (рекомендуется)

```diff
- const isValid = await form.validate();
- if (!isValid) {
+ const { valid, errors } = await form.validate();
+ if (!valid) {
-   const errors = form.errors;
    console.log(errors);
  }
```

#### Вариант 2: Адаптер для обратной совместимости

```typescript
// Для временной совместимости
const validateLegacy = async (): Promise<boolean> => {
  const result = await form.validate();
  return result.valid;
};

// Использование
const isValid = await validateLegacy();
```

## Зависимости

- ✅ Задача 003: `./003-add-setFieldErrors.md` (для установки ошибок)

## Сложность
**Оценка:** Средняя

**Изменения:**
- ~10 строк в `types.ts` (новый интерфейс)
- ~10 строк в `validation.ts` (обновленная функция)
- ~50 строк тестов
- Документация миграции

## Приоритет
**Средний** — улучшает DX, но требует мажорного обновления

## Преимущества

| Аспект | До | После |
|--------|----|-------|
| **Кол-во вызовов** | 2 (`validate()` + `errors`) | 1 (`validate()`) |
| **Race conditions** | Возможны | Исключены |
| **Согласованность** | ❌ Отличается от Zod/Yup | ✅ Как в Zod/Yup |
| **DX** | Средний | Высокий |

## Сравнение с другими библиотеками

| Библиотека | Возвращает |
|------------|------------|
| **Zod** | `{ success: boolean, error?: ZodError }` |
| **Yup** | `{ valid: boolean, errors?: ValidationError[] }` |
| **VeeValidate** | `{ valid: boolean, errors: string[] }` |
| **React Hook Form** | `boolean` + `errors` через `formState` |
| **@nexus-state/form (до)** | `boolean` |
| **@nexus-state/form (после)** | `{ valid: boolean, errors: FormErrors }` ✅ |

## Roadmap обновления

### v2.0.0 (Breaking)

```typescript
// Основное изменение
validate: () => Promise<boolean>; 
// ↓
validate: () => Promise<ValidateResult<TValues>>;
```

### v2.1.0 (Deprecated)

```typescript
// Добавляем предупреждение для старого кода
const validate = async (): Promise<ValidateResult<TValues>> => {
  const result = await validation.validateAll();
  
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'validate() now returns { valid, errors }. ' +
      'Please update your code.'
    );
  }
  
  return result;
};
```

## Acceptance Criteria

- [ ] `validate()` возвращает `{ valid, errors }`
- [ ] Все тесты проходят
- [ ] Migration guide написан
- [ ] Документация обновлена
- [ ] Версия обновлена до 2.0.0
- [ ] Changelog обновлен

## Ссылки

- Задача 003: `./003-add-setFieldErrors.md`
- Zod: https://github.com/colinhacks/zod
- Yup: https://github.com/jquense/yup
- SemVer: https://semver.org/
