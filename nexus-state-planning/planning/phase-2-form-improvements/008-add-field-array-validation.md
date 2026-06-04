# Задача 008: Добавить валидацию для FieldArray

## Описание
Добавить поддержку валидации элементов массива: автоматическую валидацию при добавлении/изменении элементов и доступ к ошибкам валидации для каждого элемента.

## Проблемы текущей реализации

### Проблема 1: Нет автоматической валидации при операциях

```typescript
// Текущая реализация
const { append } = useFieldArray('emails', { defaultValue: [] });

append('invalid-email'); // ⚠️ Валидация не запускается
// Ошибка не устанавливается, пользователь не видит проблему
```

### Проблема 2: Нет доступа к ошибкам элементов

```typescript
// Нет способа получить ошибки конкретного элемента
const { fields } = useFieldArray('addresses', { defaultValue: [] });

fields.forEach((address, index) => {
  // ❌ Как получить ошибки для address[index]?
  // form.errors не работает для массивов
});
```

### Проблема 3: Нет валидации всего массива

```typescript
// Нет способа проверить валидность всего массива
const isValid = form.isValid; // ⚠️ Не учитывает ошибки в массивах
```

## Решение

### 1. Обновить типы FieldArray

**Файл:** `packages/form/src/types.ts`

```typescript
export interface FieldArray<TItem = any> extends FieldArrayOperations<TItem> {
  /**
   * Current fields array
   */
  fields: TItem[];

  /**
   * Get field at index
   */
  field(index: number): Field<TItem> | undefined;

  /**
   * Total field count
   */
  length: number;

  // ← НОВОЕ: Валидация
  /**
   * Get errors for all items
   */
  get errors(): Array<Partial<Record<keyof TItem, string | null>>>;

  /**
   * Get error for specific item and field
   */
  getError<K extends keyof TItem>(index: number, field: K): string | null;

  /**
   * Check if specific item is valid
   */
  isValid(index: number): boolean;

  /**
   * Check if all items are valid
   */
  get isvalid(): boolean;
}
```

---

### 2. Обновить getFieldArray с валидацией

**Файл:** `packages/form/src/field-array.ts`

```typescript
import { atom, Store } from '@nexus-state/core';
import type {
  FieldArray,
  FieldArrayMeta,
  Field,
  FieldState,
  FieldMeta,
  FormErrors,
} from './types';
import {
  createField,
  setFieldValue,
  setFieldTouched,
  setFieldError,
  resetField,
} from './field';
import { validateField } from './validation';

/**
 * Create field array metadata with validation support
 */
export function createFieldArray<TItem>(
  store: Store,
  name: string,
  initialItems: TItem[],
  defaultItem: TItem,
  options?: {
    validate?: (value: TItem) => string | null;
  }
): FieldArrayMeta<TItem> {
  const itemAtoms = initialItems.map((item, index) => {
    const fieldMeta = createField(store, `${name}[${index}]`, {
      initialValue: item,
      validate: options?.validate,
    });
    return fieldMeta.atom;
  });

  return {
    name,
    itemAtoms,
    defaultItem,
    validate: options?.validate,
  };
}

/**
 * Get field array API with validation
 */
export function getFieldArray<TItem>(
  store: Store,
  meta: FieldArrayMeta<TItem>
): FieldArray<TItem> {
  const getFields = (): TItem[] => {
    return meta.itemAtoms.map(atom => store.get(atom).value);
  };

  const getFieldMeta = (index: number): FieldMeta<TItem> | undefined => {
    const atom = meta.itemAtoms[index];
    if (!atom) return undefined;

    return {
      atom,
      name: `${meta.name}[${index}]`,
      initialValue: meta.defaultItem,
      validate: meta.validate,
    };
  };

  const field = (index: number): Field<TItem> | undefined => {
    const fieldMeta = getFieldMeta(index);
    if (!fieldMeta) return undefined;

    const fieldState = store.get(fieldMeta.atom);

    return {
      value: fieldState.value,
      error: fieldState.error,
      touched: fieldState.touched,
      dirty: fieldState.dirty,

      setValue: (value: TItem) => {
        setFieldValue(store, fieldMeta, value);
        // ← Автоматическая валидация при изменении
        if (fieldMeta.validate) {
          validateField(store, fieldMeta);
        }
      },

      setTouched: (touched: boolean) => {
        setFieldTouched(store, fieldMeta, touched);
      },

      setError: (error: string | null) => {
        setFieldError(store, fieldMeta, error);
      },

      reset: () => {
        resetField(store, fieldMeta);
      },

      inputProps: {
        value: fieldState.value,
        onChange: (value: TItem) => {
          setFieldValue(store, fieldMeta, value);
          // ← Автоматическая валидация при изменении
          if (fieldMeta.validate) {
            validateField(store, fieldMeta);
          }
        },
        onBlur: () => {
          setFieldTouched(store, fieldMeta, true);
        }
      }
    };
  };

  // ← НОВОЕ: Получить ошибки для всех элементов
  const getErrors = (): Array<Partial<Record<keyof TItem, string | null>>> => {
    return meta.itemAtoms.map(atom => {
      const state = store.get(atom);
      return {
        [meta.name]: state.error,
      } as Partial<Record<keyof TItem, string | null>>;
    });
  };

  // ← НОВОЕ: Получить ошибку для конкретного поля элемента
  const getError = <K extends keyof TItem>(
    index: number,
    fieldKey: K
  ): string | null => {
    const fieldMeta = getFieldMeta(index);
    if (!fieldMeta) return null;

    const state = store.get(fieldMeta.atom);
    
    // Для примитивов возвращаем общую ошибку
    if (typeof state.value !== 'object' || state.value === null) {
      return state.error;
    }
    
    // Для объектов пытаемся получить ошибку конкретного поля
    // (требуется дополнительная логика для вложенных объектов)
    return state.error;
  };

  // ← НОВОЕ: Проверить валидность элемента
  const isValid = (index: number): boolean => {
    const fieldMeta = getFieldMeta(index);
    if (!fieldMeta) return true;

    const state = store.get(fieldMeta.atom);
    return state.error === null;
  };

  // ← НОВОЕ: Проверить валидность всего массива
  const getIsValid = (): boolean => {
    return meta.itemAtoms.every(atom => {
      const state = store.get(atom);
      return state.error === null;
    });
  };

  // Array operations with validation
  const append = (item: TItem): void => {
    const newAtom = createField(
      store,
      `${meta.name}[${meta.itemAtoms.length}]`,
      { 
        initialValue: item,
        validate: meta.validate,
      }
    ).atom;

    meta.itemAtoms.push(newAtom);
    
    // ← Автоматическая валидация нового элемента
    if (meta.validate) {
      const fieldMeta: FieldMeta<TItem> = {
        atom: newAtom,
        name: `${meta.name}[${meta.itemAtoms.length - 1}]`,
        initialValue: meta.defaultItem,
        validate: meta.validate,
      };
      validateField(store, fieldMeta);
    }
  };

  const prepend = (item: TItem): void => {
    const newAtom = createField(
      store,
      `${meta.name}[0]`,
      { 
        initialValue: item,
        validate: meta.validate,
      }
    ).atom;

    meta.itemAtoms.unshift(newAtom);
    updateFieldNames(meta);
    
    // ← Автоматическая валидация
    if (meta.validate) {
      validateField(store, {
        atom: newAtom,
        name: `${meta.name}[0]`,
        initialValue: meta.defaultItem,
        validate: meta.validate,
      });
    }
  };

  const insert = (index: number, item: TItem): void => {
    const newAtom = createField(
      store,
      `${meta.name}[${index}]`,
      { 
        initialValue: item,
        validate: meta.validate,
      }
    ).atom;

    meta.itemAtoms.splice(index, 0, newAtom);
    updateFieldNames(meta);
    
    // ← Автоматическая валидация
    if (meta.validate) {
      validateField(store, {
        atom: newAtom,
        name: `${meta.name}[${index}]`,
        initialValue: meta.defaultItem,
        validate: meta.validate,
      });
    }
  };

  const remove = (index: number): void => {
    if (index < 0 || index >= meta.itemAtoms.length) {
      return;
    }

    meta.itemAtoms.splice(index, 1);
    updateFieldNames(meta);
  };

  const swap = (indexA: number, indexB: number): void => {
    if (
      indexA < 0 || indexA >= meta.itemAtoms.length ||
      indexB < 0 || indexB >= meta.itemAtoms.length
    ) {
      return;
    }

    const temp = meta.itemAtoms[indexA];
    meta.itemAtoms[indexA] = meta.itemAtoms[indexB];
    meta.itemAtoms[indexB] = temp;
  };

  const move = (from: number, to: number): void => {
    if (
      from < 0 || from >= meta.itemAtoms.length ||
      to < 0 || to >= meta.itemAtoms.length
    ) {
      return;
    }

    const [item] = meta.itemAtoms.splice(from, 1);
    meta.itemAtoms.splice(to, 0, item);
  };

  const replace = (items: TItem[]): void => {
    // Clear existing
    meta.itemAtoms.length = 0;

    // Add new items
    items.forEach((item, index) => {
      const newAtom = createField(
        store,
        `${meta.name}[${index}]`,
        { 
          initialValue: item,
          validate: meta.validate,
        }
      ).atom;

      meta.itemAtoms.push(newAtom);
      
      // ← Автоматическая валидация
      if (meta.validate) {
        validateField(store, {
          atom: newAtom,
          name: `${meta.name}[${index}]`,
          initialValue: meta.defaultItem,
          validate: meta.validate,
        });
      }
    });
  };

  const clear = (): void => {
    meta.itemAtoms.length = 0;
  };

  return {
    get fields() {
      return getFields();
    },
    get length() {
      return meta.itemAtoms.length;
    },

    field,
    append,
    prepend,
    insert,
    remove,
    swap,
    move,
    replace,
    clear,
    
    // ← НОВОЕ: Валидация
    get errors() {
      return getErrors();
    },
    getError,
    isValid,
    get isvalid() {
      return getIsValid();
    },
  };
}

/**
 * Update field names after array mutation
 */
function updateFieldNames<TItem>(_meta: FieldArrayMeta<TItem>): void {
  // Field names are used for debugging/devtools
  // The actual atoms don't need renaming
}
```

---

### 3. Обновить useFieldArray с опциями валидации

**Файл:** `packages/form/src/react/useFieldArray.tsx`

```typescript
export interface UseFieldArrayOptions<TItem> {
  defaultValue?: TItem[];
  validate?: (value: TItem) => string | null;
  validateOnAppend?: boolean;
  validateOnChange?: boolean;
}

export function useFieldArray<TItem>(
  name: string,
  options: UseFieldArrayOptions<TItem> = {}
): UseFieldArrayReturn<TItem> {
  const store = useStore();
  const fieldArrayMetaRef = useRef<ReturnType<typeof createFieldArray<TItem>> | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Create field array meta once
  if (!fieldArrayMetaRef.current) {
    fieldArrayMetaRef.current = createFieldArray<TItem>(
      store,
      name,
      options.defaultValue ?? [],
      {} as TItem,
      { validate: options.validate } // ← Передаем валидатор
    );
  }

  // ... rest of implementation
}
```

---

## Использование

### Пример 1: Валидация примитивов

```typescript
import { useFieldArray } from "@nexus-state/form/react";

function EmailsField() {
  const { fields, append, remove, errors, isValid } = useFieldArray<string>('emails', {
    defaultValue: [],
    validate: (email) => {
      if (!email) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return 'Invalid email format';
      }
      return null;
    },
    validateOnAppend: true,
  });

  return (
    <div>
      {fields.map((email, index) => (
        <div key={fields[index].id}>
          <input
            value={email}
            onChange={(e) => update(index, e.target.value)}
            placeholder="Email"
          />
          {/* ← Доступ к ошибке */}
          {errors[index] && (
            <span className="error">{errors[index]}</span>
          )}
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => append('')}>Add Email</button>
      
      {/* ← Статус валидности всего массива */}
      {!isValid && <p className="error">Please fix all email errors</p>}
    </div>
  );
}
```

---

### Пример 2: Валидация объектов

```typescript
interface Phone {
  type: 'mobile' | 'work' | 'home';
  number: string;
}

function PhonesField() {
  const { fields, append, remove, errors, isValid, getError } = useFieldArray<Phone>('phones', {
    defaultValue: [],
    validate: (phone) => {
      if (!phone.number) return 'Phone number is required';
      if (!/^\d{10}$/.test(phone.number.replace(/\D/g, ''))) {
        return 'Invalid phone number';
      }
      return null;
    },
  });

  return (
    <div>
      {fields.map((phone, index) => (
        <div key={fields[index].id}>
          <select 
            value={phone.type}
            onChange={(e) => update(index, { ...phone, type: e.target.value as Phone['type'] })}
          >
            <option value="mobile">Mobile</option>
            <option value="work">Work</option>
            <option value="home">Home</option>
          </select>
          
          <input
            value={phone.number}
            onChange={(e) => update(index, { ...phone, number: e.target.value })}
            placeholder="Phone number"
          />
          
          {/* ← Доступ к ошибке конкретного элемента */}
          {getError(index, 'number') && (
            <span className="error">{getError(index, 'number')}</span>
          )}
          
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => append({ type: 'mobile', number: '' })}>
        Add Phone
      </button>
    </div>
  );
}
```

---

### Пример 3: Валидация с зависимостями между элементами

```typescript
interface Tag {
  id: string;
  value: string;
}

function TagsField() {
  const { fields, append, remove, errors } = useFieldArray<Tag>('tags', {
    defaultValue: [],
    validate: (tag, allTags) => {
      // ← Доступ ко всем элементам для кросс-валидации
      if (!tag.value) return 'Tag is required';
      
      const duplicates = allTags?.filter(t => t.value === tag.value) || [];
      if (duplicates.length > 1) {
        return 'Duplicate tag';
      }
      
      return null;
    },
  });

  return (
    <div>
      {fields.map((tag, index) => (
        <div key={tag.id}>
          <input
            value={tag.value}
            onChange={(e) => update(index, { ...tag, value: e.target.value })}
            placeholder="Tag"
          />
          {errors[index] && (
            <span className="error">{errors[index]}</span>
          )}
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => append({ id: generateId(), value: '' })}>
        Add Tag
      </button>
    </div>
  );
}
```

---

## Критерии приемки

- [ ] Автоматическая валидация при append/prepend/insert
- [ ] Автоматическая валидация при изменении элемента
- [ ] `getErrors()` возвращает ошибки всех элементов
- [ ] `getError(index, field)` возвращает ошибку конкретного поля
- [ ] `isValid(index)` проверяет валидность элемента
- [ ] `isvalid` проверяет валидность всего массива
- [ ] Поддержка кросс-валидации между элементами
- [ ] Unit тесты на валидацию
- [ ] Integration тесты с формами

---

## Тесты

### Unit тест на валидацию

**Файл:** `packages/form/src/__tests__/field-array-validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../create-form';

describe('FieldArray validation', () => {
  it('должен валидировать элементы при добавлении', () => {
    const store = createStore();
    const form = createForm(store, {
      initialValues: { emails: [] as string[] },
    });

    const emailsArray = form.fieldArray('emails', '', {
      validate: (email) => {
        if (!email) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return 'Invalid email format';
        }
        return null;
      },
    });

    // Добавляем валидный email
    emailsArray.append('test@example.com');
    expect(emailsArray.isValid(0)).toBe(true);

    // Добавляем невалидный email
    emailsArray.append('invalid');
    expect(emailsArray.isValid(1)).toBe(false);
    expect(emailsArray.getError(1)).toBe('Invalid email format');
  });

  it('должен возвращать ошибки всех элементов', () => {
    const store = createStore();
    const form = createForm(store, {
      initialValues: { emails: ['valid@example.com', 'invalid'] },
    });

    const emailsArray = form.fieldArray('emails', '', {
      validate: (email) => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return 'Invalid email format';
        }
        return null;
      },
    });

    const errors = emailsArray.errors;
    expect(errors[0]).toBeNull();
    expect(errors[1]).toBe('Invalid email format');
  });

  it('должен проверять валидность всего массива', () => {
    const store = createStore();
    const form = createForm(store, {
      initialValues: { emails: ['valid@example.com', 'invalid'] },
    });

    const emailsArray = form.fieldArray('emails', '', {
      validate: (email) => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return 'Invalid email format';
        }
        return null;
      },
    });

    expect(emailsArray.isValid).toBe(false);

    // Исправляем ошибку
    emailsArray.field(1)?.setValue('fixed@example.com');
    expect(emailsArray.isValid).toBe(true);
  });

  it('должен валидировать объекты', () => {
    interface Phone {
      number: string;
      type: string;
    }

    const store = createStore();
    const form = createForm(store, {
      initialValues: { phones: [] as Phone[] },
    });

    const phonesArray = form.fieldArray('phones', { number: '', type: 'mobile' }, {
      validate: (phone) => {
        if (!phone.number) return 'Phone number is required';
        return null;
      },
    });

    phonesArray.append({ number: '', type: 'mobile' });
    expect(phonesArray.isValid(0)).toBe(false);
    expect(phonesArray.getError(0, 'number')).toBe('Phone number is required');

    phonesArray.field(0)?.setValue({ number: '1234567890', type: 'mobile' });
    expect(phonesArray.isValid(0)).toBe(true);
  });

  it('должен поддерживать кросс-валидацию', () => {
    const store = createStore();
    const form = createForm(store, {
      initialValues: { tags: [] as string[] },
    });

    const tagsArray = form.fieldArray('tags', '', {
      validate: (tag, allTags) => {
        if (!allTags) return null;
        
        const duplicates = allTags.filter(t => t === tag);
        if (duplicates.length > 1) {
          return 'Duplicate tag';
        }
        return null;
      },
    });

    tagsArray.append('tag1');
    tagsArray.append('tag1'); // Дубликат

    expect(tagsArray.isValid(1)).toBe(false);
    expect(tagsArray.getError(1)).toBe('Duplicate tag');
  });
});
```

---

## Влияние на существующий код

### Обратная совместимость
✅ **Полная** — валидация опциональна

### API обновления

```typescript
// Было:
const { fields, append } = useFieldArray('emails');

// Стало (с валидацией):
const { fields, append, errors, isValid, getError } = useFieldArray('emails', {
  validate: (email) => {
    if (!email) return 'Required';
    return null;
  }
});
```

---

## Зависимости

- ✅ Задача 006: `./006-fix-useFieldArray-critical-issues.md`
- ✅ Задача 007: `./007-add-useFieldInArray-hook.md`

---

## Сложность
**Оценка:** Высокая

**Изменения:**
- ~80 строк в `field-array.ts`
- ~30 строк в `types.ts`
- ~20 строк в `useFieldArray.tsx`
- ~150 строк тестов

---

## Приоритет
**Высокий** — критично для production-форм

---

## Преимущества

| Аспект | До | После |
|--------|----|-------|
| **Валидация при добавлении** | ❌ Нет | ✅ Автоматически |
| **Доступ к ошибкам** | ❌ Нет | ✅ `getError(index)` |
| **Валидность массива** | ❌ Нет | ✅ `isValid` |
| **Кросс-валидация** | ❌ Нет | ✅ Через callback |

---

## Ссылки

- Задача 006: `./006-fix-useFieldArray-critical-issues.md`
- Задача 007: `./007-add-useFieldInArray-hook.md`
- React Hook Form validation: https://react-hook-form.com/api/useform/formstate
