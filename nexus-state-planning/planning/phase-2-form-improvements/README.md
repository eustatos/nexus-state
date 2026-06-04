# Phase 2: Form API Improvements

## Описание
Улучшение API @nexus-state/form для лучшей React-интеграции, эргономики и производительности.

## Контекст
В процессе рефакторинга DictionaryForm (ppcm-fw-frontend) были выявлены следующие проблемы:

1. **Отсутствие реактивного хука `useField`** — нет способа подписаться на изменение конкретного поля
2. **`field()` возвращает снимок, а не атом** — компоненты не перерисовываются реактивно
3. **Нет доступа к `FieldMeta`** — невозможно создать кастомные хуки с подпиской
4. **Отсутствие массовых операций для ошибок** — неудобно обрабатывать ошибки сервера
5. **`validate()` возвращает только boolean** — нет доступа к ошибкам после валидации
6. **`useFieldArray` требует доработок** — критические проблемы с подпиской и типами
7. **Нет валидации для массивов** — необходима для production-форм
8. **Отсутствие тестовых утилит** — пользователи испытывают трудности с тестированием форм

---

## Задачи

### 001 — Добавить `getFieldMeta` в Form API

**Проблема:**
```typescript
// Нет доступа к FieldMeta для подписки
const field = form.field("name");
// field — это Field (снимок), не атом
```

**Решение:**
```typescript
// packages/form/src/types.ts
export interface Form<TValues extends FormValues> {
  // ...существующие
  getFieldMeta: <K extends keyof TValues>(name: K) => FieldMeta<TValues[K]>;
}

// packages/form/src/create-form.ts
const field = <K extends keyof TValues>(name: K): Field<TValues[K]> => {
  const meta = core.fields.get(name);
  // ...
};

const getFieldMeta = <K extends keyof TValues>(name: K): FieldMeta<TValues[K]> => {
  const meta = core.fields.get(name);
  if (!meta) {
    throw new Error(`Field "${String(name)}" not found`);
  }
  return meta as FieldMeta<TValues[K]>;
};

return {
  // ...
  field,
  getFieldMeta,
};
```

**Использование:**
```typescript
// apps/app/src/pages/admin/dictionaries/form.ts
const fieldMeta = dictionaryFormAtom.getFieldMeta("code");
const value = useAtomValue(fieldMeta.atom); // ← Реактивная подписка!
```

**Критерии приемки:**
- [ ] `getFieldMeta` возвращает `FieldMeta` с атомом
- [ ] Типизация: `<K extends keyof TValues>(name: K) => FieldMeta<TValues[K]>`
- [ ] Бросает ошибку, если поле не найдено
- [ ] Тесты на корректность возврата меты

**Сложность:** Низкая  
**Приоритет:** Высокий

---

### 002 — Добавить хук `useField` в @nexus-state/form/react

**Проблема:**
```typescript
// 40 строк бойлерплейта на каждое поле
export const useDictionaryFormField = <K extends keyof DictionaryFormValues>(
  fieldName: K,
) => {
  const field = useMemo(
    () => dictionaryFormAtom.field(fieldName),
    [fieldName],
  );
  // ...
};
```

**Решение:**
```typescript
// packages/form/src/react/useField.tsx
import { useMemo, useCallback } from 'react';
import { useAtomValue } from '@nexus-state/react';
import type { Form } from '../types';

export function useField<TValues extends FormValues, K extends keyof TValues>(
  form: Form<TValues>,
  fieldName: K
): {
  field: {
    name: K;
    value: TValues[K];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur: () => void;
  };
  fieldState: {
    error: string | null;
    isDirty: boolean;
    isTouched: boolean;
    isValidating: boolean;
  };
} {
  const fieldMeta = useMemo(
    () => form.getFieldMeta(fieldName),
    [form, fieldName]
  );
  
  const state = useAtomValue(fieldMeta.atom);
  
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      form.setFieldValue(fieldName, e.target.value);
    },
    [form, fieldName]
  );
  
  const onBlur = useCallback(() => {
    form.setFieldTouched(fieldName, true);
  }, [form, fieldName]);
  
  return {
    field: {
      name: fieldName,
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

**Использование:**
```typescript
// Было:
const { field, fieldState } = useDictionaryFormField("code");

// Стало:
import { useField } from "@nexus-state/form/react";

const { field, fieldState } = useField(dictionaryFormAtom, "code");
```

**Критерии приемки:**
- [ ] Хук экспортируется из `@nexus-state/form/react`
- [ ] Полная типизация с выводом типов из Form
- [ ] Реактивное обновление при изменении поля
- [ ] Стабильные ссылки на handlers (useCallback)
- [ ] Тесты с рендерингом и изменением значений

**Сложность:** Средняя  
**Приоритет:** Высокий

---

### 003 — Добавить `setFieldErrors` для массовых ошибок

**Проблема:**
```typescript
// Обработка ошибок сервера — 10 строк бойлерплейта
Object.entries(validationErrors).forEach(([field, message]) => {
  dictionaryFormAtom.setFieldError(field as keyof DictionaryFormValues, message);
});
```

**Решение:**
```typescript
// packages/form/src/types.ts
export interface Form<TValues extends FormValues> {
  // ...существующие
  setFieldErrors: (errors: Partial<Record<keyof TValues, string | null>>) => void;
}

// packages/form/src/create-form.ts
const setFieldErrors = (errors: Partial<Record<keyof TValues, string | null>>) => {
  Object.entries(errors).forEach(([key, error]) => {
    const meta = core.fields.get(key as keyof TValues);
    if (meta) {
      setFieldError(store, meta, error);
    }
  });
};

return {
  // ...
  setFieldErrors,
};
```

**Использование:**
```typescript
// Было:
try {
  await saveOrCreate(dictionaryFormAtom.values);
} catch (error: any) {
  if (error.validationErrors) {
    Object.entries(error.validationErrors).forEach(([field, message]) => {
      dictionaryFormAtom.setFieldError(field as keyof DictionaryFormValues, message);
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

**Критерии приемки:**
- [ ] Массовая установка ошибок за один вызов
- [ ] Игнорирование несуществующих полей
- [ ] Поддержка `null` для сброса ошибок
- [ ] Тесты на установку нескольких ошибок

**Сложность:** Низкая  
**Приоритет:** Средний

---

### 004 — Улучшить `validate()` для возврата ошибок

**Проблема:**
```typescript
const isValid = await dictionaryFormAtom.validate();
// isValid — boolean
// Где ошибки? Нужно отдельно получать dictionaryFormAtom.errors
```

**Решение:**
```typescript
// packages/form/src/types.ts
export interface ValidateResult<TValues extends FormValues> {
  valid: boolean;
  errors: FormErrors<TValues>;
}

export interface Form<TValues extends FormValues> {
  // ...существующие
  validate: () => Promise<ValidateResult<TValues>>;
}

// packages/form/src/validation.ts
export async function validateAll<TValues extends FormValues>(
  core: FormCore<TValues>,
  validation: ValidationAPI<TValues>
): Promise<ValidateResult<TValues>> {
  await validation.validateAll();
  
  const errors = core.getErrors();
  const valid = Object.keys(errors).length === 0;
  
  return { valid, errors };
}
```

**Использование:**
```typescript
// Было:
const isValid = await dictionaryFormAtom.validate();
if (!isValid) {
  const errors = dictionaryFormAtom.errors;
  console.log(errors);
}

// Стало:
const { valid, errors } = await dictionaryFormAtom.validate();
if (!valid) {
  console.log(errors); // ← Сразу доступны
}
```

**Критерии приемки:**
- [ ] `validate()` возвращает `{ valid, errors }`
- [ ] Обратная совместимость (проверка на boolean)
- [ ] Тесты на возврат ошибок
- [ ] Документация обновления (breaking change)

**Сложность:** Средняя  
**Приоритет:** Средний  
**Примечание:** Breaking change — требует мажорного обновления версии

---

### 005 — Добавить `inputProps` для разных типов полей

**Проблема:**
```typescript
// inputProps не подходит для Select, Switch, Checkbox
field.inputProps: {
  value: TValue;
  onChange: (value: TValue) => void;
  onBlur: () => void;
};

// Для Select нужно:
<Select value={field.value} onChange={field.setValue} />

// Для Switch:
<Switch checked={field.value} onChange={field.setValue} />
```

**Решение:**
```typescript
// packages/form/src/types.ts
export interface Field<TValue = any> {
  // ...существующие
  
  // Универсальные inputProps
  inputProps: {
    name: string;
    value: TValue;
    onChange: (value: TValue) => void;
    onBlur: () => void;
  };
  
  // Для Select
  selectProps: {
    name: string;
    value: TValue;
    onChange: (value: TValue) => void;
  };
  
  // Для Switch/Checkbox
  switchProps: {
    name: string;
    checked: TValue extends boolean ? TValue : never;
    onChange: (checked: boolean) => void;
  };
  
  // Для Radio
  radioProps: {
    name: string;
    checked: boolean;
    onChange: () => void;
  };
}

// packages/form/src/create-form.ts
const createFieldProps = <K extends keyof TValues>(
  name: K,
  meta: FieldMeta<TValues[K]>
) => {
  const state = store.get(meta.atom);
  
  return {
    inputProps: {
      name: name as string,
      value: state.value,
      onChange: (value: TValues[K]) => setFieldValue(store, meta, value),
      onBlur: () => setFieldTouched(store, meta, true),
    },
    selectProps: {
      name: name as string,
      value: state.value,
      onChange: (value: TValues[K]) => setFieldValue(store, meta, value),
    },
    switchProps: {
      name: name as string,
      checked: state.value as unknown as boolean,
      onChange: (checked: boolean) => setFieldValue(store, meta, checked as unknown as TValues[K]),
    },
    // ...
  };
};
```

**Использование:**
```typescript
// Было:
<Switch checked={field.value} onChange={field.setValue} />

// Стало:
<Switch {...field.switchProps} />

<Select {...field.selectProps} options={options} />

<Input {...field.inputProps} />
```

**Критерии приемки:**
- [ ] `inputProps` для текстовых полей
- [ ] `selectProps` для Select
- [ ] `switchProps` для Switch/Checkbox
- [ ] Типизация с проверкой типов (boolean для switch)
- [ ] Тесты на корректность пропсов

**Сложность:** Средняя
**Приоритет:** Низкий

---

### 006 — Исправить критические проблемы `useFieldArray`

**Проблема:**
```typescript
// Подписка только на первый атом
useEffect(() => {
  if (meta.itemAtoms.length > 0) {
    const unsubscribe = store.subscribe(meta.itemAtoms[0], () => {
      setForceUpdate((prev: number) => prev + 1);
    });
    return unsubscribe;
  }
  return undefined;
}, [store, meta.itemAtoms]);
```

**Решение:**
```typescript
// Подписка на ВСЕ атомы в массиве
useEffect(() => {
  const unsubscribeAll = meta.itemAtoms.map(atom =>
    store.subscribe(atom, () => setForceUpdate(prev => prev + 1))
  );
  
  return () => {
    unsubscribeAll.forEach(unsub => unsub());
  };
}, [store, meta.itemAtoms]);
```

**Использование:**
```typescript
// ✅ Теперь работает с примитивами!
const { fields, append, remove } = useFieldArray<string>('tags', {
  defaultValue: []
});

// ✅ Stable ID для React keys
{fields.map((tag, index) => (
  <div key={tag.id}> {/* ID не зависит от индекса */}
    <input value={tag} readOnly />
    <button onClick={() => remove(index)}>Remove</button>
  </div>
))}
```

**Критерии приемки:**
- [ ] Подписка на все атомы в массиве
- [ ] Работа с примитивами (string[], number[])
- [ ] Stable ID для элементов (не зависит от индекса)
- [ ] Сохранение ID при update/replace
- [ ] Unit тесты на подписку
- [ ] Integration тесты с ре-рендером

**Сложность:** Средняя
**Приоритет:** Критический

---

### 007 — Добавить хук `useFieldInArray` для гранулярной подписки

**Проблема:**
```typescript
// Много бойлерплейта на каждое поле в объекте
function AddressField({ array, index }) {
  const item = array.fields[index];
  
  return (
    <input
      value={item.street}
      onChange={(e) => {
        const newItems = [...array.fields];
        newItems[index] = { ...item, street: e.target.value };
        array.update(index, newItems[index]);
      }}
    />
  );
}
```

**Решение:**
```typescript
// packages/form/src/react/useFieldInArray.tsx
export function useFieldInArray<TItem, TKey extends keyof TItem>(
  array: FieldArray<TItem>,
  index: number,
  key: TKey
): UseFieldInArrayReturn<TItem[TKey]> {
  // Гранулярная подписка на конкретное поле!
  return {
    value,
    name,
    onChange,
    onBlur,
    setValue,
    fieldState,
  };
}
```

**Использование:**
```typescript
import { useFieldArray, useFieldInArray } from "@nexus-state/form/react";

function AddressForm() {
  const { fields } = useFieldArray<Address>('addresses', { defaultValue: [] });

  return (
    {fields.map((address, index) => (
      <div key={address.id}>
        {/* ✅ Гранулярная подписка на каждое поле! */}
        <input {...useFieldInArray(fields, index, 'street')} />
        <input {...useFieldInArray(fields, index, 'city')} />
      </div>
    ))}
  );
}
```

**Критерии приемки:**
- [ ] Хук экспортируется из `@nexus-state/form/react`
- [ ] Полная типизация с выводом типов
- [ ] Работа с примитивами (без key) и объектами (с key)
- [ ] Реактивное обновление при изменении поля
- [ ] Стабильные ссылки на handlers
- [ ] Unit тесты с рендерингом

**Сложность:** Средняя
**Приоритет:** Высокий

---

### 008 — Добавить валидацию для FieldArray

**Проблема:**
```typescript
// Нет автоматической валидации при добавлении
const { append } = useFieldArray('emails', { defaultValue: [] });
append('invalid-email'); // ⚠️ Валидация не запускается

// Нет доступа к ошибкам элементов
const { fields } = useFieldArray('addresses', { defaultValue: [] });
// ❌ Как получить ошибки для fields[index]?
```

**Решение:**
```typescript
// packages/form/src/types.ts
export interface FieldArray<TItem = any> {
  // ...существующие
  
  // ← НОВОЕ: Валидация
  get errors(): Array<Partial<Record<keyof TItem, string | null>>>;
  getError: <K extends keyof TItem>(index: number, field: K) => string | null;
  isValid: (index: number) => boolean;
  get isvalid(): boolean;
}

// packages/form/src/field-array.ts
export function getFieldArray<TItem>(
  store: Store,
  meta: FieldArrayMeta<TItem>,
  options?: { validate?: (value: TItem) => string | null }
): FieldArray<TItem> {
  // Автоматическая валидация при append/prepend/insert
  // Доступ к ошибкам через getError(index, field)
}
```

**Использование:**
```typescript
const { 
  fields, append, remove, 
  errors, isValid, getError 
} = useFieldArray<string>('emails', {
  defaultValue: [],
  validate: (email) => {
    if (!email) return 'Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Invalid email';
    }
    return null;
  },
  validateOnAppend: true,
});

// ✅ Автоматическая валидация при добавлении
append('test@example.com');

// ✅ Доступ к ошибкам
{errors.map((error, i) => (
  error && <span key={i}>{error}</span>
))}

// ✅ Проверка валидности всего массива
{!isValid && <p>Please fix all errors</p>}
```

**Критерии приемки:**
- [ ] Автоматическая валидация при append/prepend/insert
- [ ] Автоматическая валидация при изменении элемента
- [ ] `getErrors()` возвращает ошибки всех элементов
- [ ] `getError(index, field)` возвращает ошибку конкретного поля
- [ ] `isValid(index)` проверяет валидность элемента
- [ ] `isvalid` проверяет валидность всего массива
- [ ] Поддержка кросс-валидации между элементами
- [ ] Unit тесты на валидацию

**Сложность:** Высокая
**Приоритет:** Высокий

---

## Roadmap

### Спринт 1 (Неделя 1-2)
- [ ] 001 — Добавить `getFieldMeta` в Form API
- [ ] 002 — Добавить хук `useField`

### Спринт 2 (Неделя 3-4)
- [ ] 003 — Добавить `setFieldErrors`
- [ ] 004 — Улучшить `validate()` (breaking change)

### Спринт 3 (Неделя 5-6)
- [ ] 005 — Добавить `inputProps` для разных типов
- [ ] 006 — Исправить критические проблемы `useFieldArray`

### Спринт 4 (Неделя 7-8)
- [ ] 007 — Добавить хук `useFieldInArray`
- [ ] 008 — Добавить валидацию для FieldArray
- [ ] Документация всех изменений
- [ ] Примеры использования

---

## Testing Plan

### Unit тесты
- [ ] `getFieldMeta` возвращает правильную мету
- [ ] `useField` хук перерисовывается при изменении поля
- [ ] `setFieldErrors` устанавливает несколько ошибок
- [ ] `validate()` возвращает ошибки
- [ ] `useFieldArray` подписывается на все атомы
- [ ] `useFieldInArray` гранулярная подписка
- [ ] FieldArray валидация

### Integration тесты
- [ ] Форма с `useField` обновляется реактивно
- [ ] Ошибки сервера отображаются на полях
- [ ] Валидация работает корректно
- [ ] FieldArray с валидацией
- [ ] `useFieldInArray` с complex objects

### E2E тесты
- [ ] Полный цикл создания/редактирования
- [ ] Обработка ошибок API
- [ ] Динамические списки с валидацией

---

## Migration Guide

### Для пользователей @nexus-state/form

#### Обновление до v2.0

**1. Обновление `validate()`:**
```diff
- const isValid = await form.validate();
+ const { valid, errors } = await form.validate();
```

**2. Использование `useField`:**
```diff
// Было (кастомный хук):
const { field, fieldState } = useCustomField(form, "name");

// Стало:
import { useField } from "@nexus-state/form/react";
const { field, fieldState } = useField(form, "name");
```

**3. Обработка ошибок сервера:**
```diff
- Object.entries(errors).forEach(([field, message]) => {
-   form.setFieldError(field, message);
- });
+ form.setFieldErrors(errors);
```

---

## Acceptance Criteria для фазы

- [ ] Все 8 задач реализованы
- [ ] Unit тесты покрывают 90%+ нового кода
- [ ] Integration тесты проходят
- [ ] Документация обновлена
- [ ] Migration guide написан
- [ ] Примеры использования добавлены
- [ ] Версия обновлена до 2.0.0 (breaking changes)
- [ ] Опубликовано в npm

---

## Summary

### Реализованные задачи

| № | Задача | Приоритет | Сложность | Статус |
|---|--------|-----------|-----------|--------|
| 001 | `getFieldMeta` в Form API | Высокий | Низкая | ⬜ |
| 002 | `useField` хук | Высокий | Средняя | ⬜ |
| 003 | `setFieldErrors` | Средний | Низкая | ⬜ |
| 004 | `validate()` return type | Средний | Средняя | ⬜ |
| 005 | Специализированные `*Props` | Низкий | Средняя | ⬜ |
| 006 | Исправить `useFieldArray` | Критический | Средняя | ⬜ |
| 007 | `useFieldInArray` хук | Высокий | Средняя | ⬜ |
| 008 | Валидация FieldArray | Высокий | Высокая | ⬜ |
| 009 | Testing utilities | Высокий | Средняя | ✅ |
| 010 | Testing documentation | Высокий | Низкая | ⬜ |
| 011 | Update README with testing | Средний | Низкая | ⬜ |
| 012 | Упростить регистрацию плагинов схем | Высокий | Средняя | ⬜ |

### Итоговые метрики

- **Всего задач:** 12
- **Критические:** 1 (006)
- **Высокий приоритет:** 7 (001, 002, 007, 008, 009, 010, 012)
- **Средний приоритет:** 3 (003, 004, 011)
- **Низкий приоритет:** 1 (005)
- **Реализовано:** 1 (009)

### Ожидаемые улучшения

| Метрика | До | После | Улучшение |
|---------|----|-------|-----------|
| **Бойлерплейт на поле** | ~40 строк | ~5 строк | -87% |
| **Бойлерплейт на поле в массиве** | ~15 строк | ~3 строки | -80% |
| **Подписка на массив** | На первый элемент | На все элементы | ✅ |
| **Валидация массивов** | ❌ Отсутствует | ✅ Полная | ✅ |
| **Типобезопасность** | Частичная | Полная | ✅ |
| **Время написания тестов** | Бойлерплейт | Готовые утилиты | -50% |
| **Документация тестов** | Разрозненная | Единый GUIDE | ✅ |
| **Регистрация плагинов** | Неявная + side effects | Явная + чистая | ✅ |
| **Tree-shaking** | Частичный | Полный | ✅ |
| **SSR-совместимость** | Ограниченная | Полная | ✅ |

---

## Ссылки

- Исходная задача: `ppcm-fw-frontend/planning/phase-1-dictionary-ui/tasks/015-refactor-form-with-nexus-state-form.md`
- Документация: https://github.com/eustatos/nexus-state
- Статья: https://dev.to/eustatos/react-forms-deep-dive-part-1-foundations-core-patterns-2lb5
