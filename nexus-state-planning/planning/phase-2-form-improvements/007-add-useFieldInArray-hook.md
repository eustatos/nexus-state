# Задача 007: Добавить хук `useFieldInArray` для удобной работы с элементами

## Описание
Добавить хук `useFieldInArray` для реактивной подписки на отдельные поля внутри элементов массива. Упрощает работу со сложными объектами в массивах.

## Проблемы текущей реализации

### Проблема: Нет гранулярной подписки на поля элементов

```typescript
// Текущий подход (много бойлерплейта)
function AddressField({ array, index }) {
  const [items] = useAtom(arrayAtom); // ⚠️ Подписка на весь массив!
  const item = items[index];
  
  return (
    <div>
      <input
        value={item.street}
        onChange={(e) => {
          // ⚠️ Ручное обновление с сохранением остальных полей
          const newItems = [...items];
          newItems[index] = { ...item, street: e.target.value };
          setItems(newItems);
        }}
      />
      <input
        value={item.city}
        onChange={(e) => {
          const newItems = [...items];
          newItems[index] = { ...item, city: e.target.value };
          setItems(newItems);
        }}
      />
    </div>
  );
}
```

### Проблемы
- ❌ Подписка на весь массив вместо конкретного поля
- ❌ Бойлерплейт при обновлении вложенных свойств
- ❌ Нет типобезопасности для ключей объекта
- ❌ Сложно поддерживать консистентность

## Решение

### 1. Создать хук `useFieldInArray`

**Файл:** `packages/form/src/react/useFieldInArray.tsx`

```typescript
import { useMemo, useCallback } from 'react';
import { useAtomValue } from '@nexus-state/react';
import type { FieldArray } from '../types';
import type { ChangeEvent } from 'react';

export interface UseFieldInArrayReturn<TValue> {
  /** Field value */
  value: TValue;
  
  /** Field name (e.g., "addresses[0].street") */
  name: string;
  
  /** Change handler for inputs */
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  
  /** Blur handler */
  onBlur: () => void;
  
  /** Set field value directly */
  setValue: (value: TValue) => void;
  
  /** Field state */
  fieldState: {
    error: string | null;
    isDirty: boolean;
    isTouched: boolean;
    isValidating: boolean;
  };
}

/**
 * Hook for subscribing to individual field within array item
 * 
 * @param array - FieldArray instance
 * @param index - Index of item in array
 * @param key - Key of field within item (for objects) or undefined for primitives
 * @returns Field props and state
 * 
 * @example
 * ```tsx
 * // For objects
 * function AddressField({ array, index }) {
 *   const street = useFieldInArray(array, index, 'street');
 *   const city = useFieldInArray(array, index, 'city');
 *   
 *   return (
 *     <div>
 *       <input {...street} />
 *       <input {...city} />
 *     </div>
 *   );
 * }
 * 
 * // For primitives
 * function TagsField({ array, index }) {
 *   const tag = useFieldInArray(array, index);
 *   return <input {...tag} />;
 * }
 * ```
 */
export function useFieldInArray<
  TItem,
  TKey extends TKeyOfType<TItem, string | number | boolean>
>(
  array: FieldArray<TItem>,
  index: number,
  key?: TKey
): UseFieldInArrayReturn<TKey extends TKeyOfType<TItem, infer V> ? V : TItem> {
  // Get field from array
  const field = array.field(index);
  
  if (!field) {
    throw new Error(`Field at index ${index} not found in array`);
  }
  
  // Get value (primitive or property of object)
  const value = useMemo(() => {
    if (key === undefined) {
      return field.value as TItem;
    }
    return (field.value as any)[key] as any;
  }, [field.value, key]);
  
  // Create field name
  const name = useMemo(() => {
    const baseName = `array[${index}]`;
    return key !== undefined ? `${baseName}.${String(key)}` : baseName;
  }, [index, key]);
  
  // Create stable onChange handler
  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const newValue = e.target.value;
      
      if (key === undefined) {
        // Primitive: set entire value
        field.setValue(newValue as unknown as TItem);
      } else {
        // Object: update specific property
        const currentItem = field.value as Record<string, any>;
        field.setValue({
          ...currentItem,
          [key]: newValue,
        });
      }
    },
    [field, key]
  );
  
  // Create stable onBlur handler
  const onBlur = useCallback(() => {
    field.setTouched(true);
  }, [field]);
  
  // Create setValue handler
  const setValue = useCallback(
    (newValue: any) => {
      if (key === undefined) {
        field.setValue(newValue as TItem);
      } else {
        const currentItem = field.value as Record<string, any>;
        field.setValue({
          ...currentItem,
          [key]: newValue,
        });
      }
    },
    [field, key]
  );
  
  // Get field state
  const fieldState = useMemo(() => ({
    error: field.error,
    isDirty: field.dirty,
    isTouched: field.touched,
    isValidating: false, // TODO: Add validating state to FieldArray
  }), [field.error, field.dirty, field.touched]);
  
  return {
    value,
    name,
    onChange,
    onBlur,
    setValue,
    fieldState,
  };
}

/**
 * Helper type to get keys of specific value type
 */
type TKeyOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];
```

---

### 2. Экспортировать хук

**Файл:** `packages/form/src/react/index.ts`

```typescript
export { useForm } from './useForm';
export { useField } from './useField';
export { useFieldArray } from './useFieldArray';
export { useFieldInArray } from './useFieldInArray'; // ← НОВОЕ

export type {
  UseFormOptions,
  UseFormReturn,
  FormState,
  UseFieldReturn,
  UseFieldArrayReturn,
  UseFieldInArrayReturn, // ← Экспортируем тип
  FormContextType,
} from './types';
```

---

## Использование

### Пример 1: Массив объектов с полями

```tsx
import { useFieldArray, useFieldInArray } from "@nexus-state/form/react";

interface Address {
  street: string;
  city: string;
  zip: string;
}

function AddressForm() {
  const { fields, append, remove } = useFieldArray<Address>('addresses', {
    defaultValue: []
  });

  return (
    <div>
      {fields.map((address, index) => (
        <div key={address.id}>
          <AddressFields array={fields} index={index} />
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => append({ street: '', city: '', zip: '' })}>
        Add Address
      </button>
    </div>
  );
}

function AddressFields({ array, index }: { array: any, index: number }) {
  // ✅ Гранулярная подписка на каждое поле!
  const street = useFieldInArray(array, index, 'street');
  const city = useFieldInArray(array, index, 'city');
  const zip = useFieldInArray(array, index, 'zip');

  return (
    <div>
      <input 
        {...street} 
        placeholder="Street"
        className={street.fieldState.error ? 'error' : ''}
      />
      {street.fieldState.error && (
        <span className="error-text">{street.fieldState.error}</span>
      )}
      
      <input 
        {...city} 
        placeholder="City"
        className={city.fieldState.error ? 'error' : ''}
      />
      
      <input 
        {...zip} 
        placeholder="ZIP"
        className={zip.fieldState.error ? 'error' : ''}
      />
    </div>
  );
}
```

---

### Пример 2: Массив примитивов

```tsx
function TagsField() {
  const { fields, append, remove } = useFieldArray<string>('tags', {
    defaultValue: []
  });

  return (
    <div>
      {fields.map((tag, index) => {
        // ✅ Для примитивов key не нужен
        const tagField = useFieldInArray(fields, index);
        
        return (
          <div key={tag.id}>
            <input 
              {...tagField}
              placeholder="Enter tag"
            />
            <button onClick={() => remove(index)}>Remove</button>
          </div>
        );
      })}
      <button onClick={() => append('')}>Add Tag</button>
    </div>
  );
}
```

---

### Пример 3: Сложные вложенные объекты

```tsx
interface Contact {
  id?: string;
  name: string;
  phones: {
    type: 'mobile' | 'work' | 'home';
    number: string;
  }[];
}

function ContactForm() {
  const { fields: contacts } = useFieldArray<Contact>('contacts', {
    defaultValue: []
  });

  return (
    <div>
      {contacts.map((contact, contactIndex) => (
        <div key={contact.id}>
          {/* Поля контакта */}
          <ContactFields contacts={contacts} index={contactIndex} />
          
          {/* Вложенный массив телефонов */}
          <PhoneList contactIndex={contactIndex} />
        </div>
      ))}
    </div>
  );
}

function ContactFields({ contacts, index }: any) {
  const name = useFieldInArray(contacts, index, 'name');
  return <input {...name} placeholder="Name" />;
}

function PhoneList({ contactIndex }: any) {
  const { fields: phones, append } = useFieldArray<Contact['phones'][number]>(
    `contacts[${contactIndex}].phones`,
    { defaultValue: [] }
  );

  return (
    <div>
      {phones.map((phone, phoneIndex) => {
        const type = useFieldInArray(phones, phoneIndex, 'type');
        const number = useFieldInArray(phones, phoneIndex, 'number');
        
        return (
          <div key={phone.id}>
            <select {...type}>
              <option value="mobile">Mobile</option>
              <option value="work">Work</option>
              <option value="home">Home</option>
            </select>
            <input {...number} placeholder="Phone number" />
          </div>
        );
      })}
      <button onClick={() => append({ type: 'mobile', number: '' })}>
        Add Phone
      </button>
    </div>
  );
}
```

---

## Критерии приемки

- [ ] Хук экспортируется из `@nexus-state/form/react`
- [ ] Полная типизация с выводом типов из TItem
- [ ] Работа с примитивами (без key)
- [ ] Работа с объектами (с key)
- [ ] Реактивное обновление при изменении поля
- [ ] Стабильные ссылки на handlers (useCallback)
- [ ] Unit тесты с рендерингом
- [ ] Integration тесты с formArray

---

## Тесты

### Unit тест

**Файл:** `packages/form/src/react/__tests__/useFieldInArray.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createStore } from '@nexus-state/core';
import { createForm } from '../../create-form';
import { useFieldArray, useFieldInArray } from '../index';
import { Provider } from '../Provider';

describe('useFieldInArray', () => {
  interface TestItem {
    name: string;
    value: number;
  }

  it('должен возвращать поле для примитива', () => {
    const store = createStore();
    const form = createForm(store, {
      initialValues: { tags: ['tag1', 'tag2'] }
    });

    const { result } = renderHook(
      () => {
        const array = form.fieldArray('tags', '');
        return useFieldInArray(array, 0);
      },
      { wrapper: ({ children }) => <Provider store={store}>{children}</Provider> }
    );

    expect(result.current.value).toBe('tag1');
    expect(result.current.name).toBe('array[0]');
    expect(result.current.onChange).toBeInstanceOf(Function);
  });

  it('должен возвращать поле для свойства объекта', () => {
    const store = createStore();
    const form = createForm(store, {
      initialValues: {
        items: [{ name: 'Item 1', value: 10 }]
      }
    });

    const { result } = renderHook(
      () => {
        const array = form.fieldArray('items', { name: '', value: 0 });
        return useFieldInArray(array, 0, 'name');
      },
      { wrapper: ({ children }) => <Provider store={store}>{children}</Provider> }
    );

    expect(result.current.value).toBe('Item 1');
    expect(result.current.name).toBe('array[0].name');
  });

  it('должен обновлять значение при onChange', () => {
    const store = createStore();
    const form = createForm(store, {
      initialValues: {
        items: [{ name: 'Item 1', value: 10 }]
      }
    });

    const { result } = renderHook(
      () => {
        const array = form.fieldArray('items', { name: '', value: 0 });
        return useFieldInArray(array, 0, 'name');
      },
      { wrapper: ({ children }) => <Provider store={store}>{children}</Provider> }
    );

    act(() => {
      result.current.onChange({
        target: { value: 'Updated' }
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.value).toBe('Updated');
    expect(form.values.items[0].name).toBe('Updated');
  });

  it('должен устанавливать touched при onBlur', () => {
    const store = createStore();
    const form = createForm(store, {
      initialValues: {
        items: [{ name: 'Item 1', value: 10 }]
      }
    });

    const { result } = renderHook(
      () => {
        const array = form.fieldArray('items', { name: '', value: 0 });
        return useFieldInArray(array, 0, 'name');
      },
      { wrapper: ({ children }) => <Provider store={store}>{children}</Provider> }
    );

    act(() => {
      result.current.onBlur();
    });

    const field = result.current;
    expect(field.fieldState.isTouched).toBe(true);
  });

  it('должен иметь стабильную ссылку на onChange', () => {
    const store = createStore();
    const form = createForm(store, {
      initialValues: {
        items: [{ name: 'Item 1', value: 10 }]
      }
    });

    const { result, rerender } = renderHook(
      () => {
        const array = form.fieldArray('items', { name: '', value: 0 });
        return useFieldInArray(array, 0, 'name');
      },
      { wrapper: ({ children }) => <Provider store={store}>{children}</Provider> }
    );

    const onChange1 = result.current.onChange;
    rerender();
    const onChange2 = result.current.onChange;

    expect(onChange1).toBe(onChange2);
  });

  it('должен бросать ошибку для несуществующего индекса', () => {
    const store = createStore();
    const form = createForm(store, {
      initialValues: { items: [] }
    });

    expect(() => {
      const { result } = renderHook(
        () => {
          const array = form.fieldArray('items', { name: '', value: 0 });
          return useFieldInArray(array, 5, 'name');
        },
        { wrapper: ({ children }) => <Provider store={store}>{children}</Provider> }
      );
    }).toThrow('Field at index 5 not found in array');
  });
});
```

---

### Integration тест

**Файл:** `packages/form/src/react/__tests__/useFieldInArray.integration.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createStore } from '@nexus-state/core';
import { createForm } from '../../create-form';
import { useFieldArray, useFieldInArray } from '../index';
import { Provider } from '../Provider';

describe('useFieldInArray integration', () => {
  interface Address {
    street: string;
    city: string;
  }

  function TestComponent() {
    const store = createStore();
    const form = createForm(store, {
      initialValues: {
        addresses: [{ street: '123 Main St', city: 'NYC' }]
      }
    });

    function AddressFields() {
      const { fields } = useFieldArray<Address>('addresses', {
        street: '',
        city: ''
      });

      return (
        <div>
          {fields.map((address, index) => (
            <div key={address.id} data-testid={`address-${index}`}>
              <AddressItem array={fields} index={index} />
            </div>
          ))}
        </div>
      );
    }

    function AddressItem({ array, index }: any) {
      const street = useFieldInArray(array, index, 'street');
      const city = useFieldInArray(array, index, 'city');

      return (
        <>
          <input
            data-testid={`street-${index}`}
            value={street.value}
            onChange={street.onChange}
            onBlur={street.onBlur}
          />
          <input
            data-testid={`city-${index}`}
            value={city.value}
            onChange={city.onChange}
          />
        </>
      );
    }

    return <AddressFields />;
  }

  it('должен реактивно обновлять поля', () => {
    render(<TestComponent />);

    const streetInput = screen.getByTestId('street-0');
    fireEvent.change(streetInput, { target: { value: '456 Oak Ave' } });

    expect(streetInput).toHaveValue('456 Oak Ave');
  });

  it('должен устанавливать touched при blur', () => {
    render(<TestComponent />);

    const streetInput = screen.getByTestId('street-0');
    fireEvent.blur(streetInput);

    // Проверяем, что touched установлено (через fieldState)
    expect(streetInput).toBeInTheDocument();
  });
});
```

---

## Влияние на существующий код

### Обратная совместимость
✅ **Полная** — новый хук не ломает существующий код

### Миграция

```diff
// Было (ручное управление):
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

// Стало (useFieldInArray):
+import { useFieldInArray } from "@nexus-state/form/react";

function AddressField({ array, index }) {
+  const street = useFieldInArray(array, index, 'street');
+  
+  return <input {...street} />;
}
```

**Выигрыш:** -10 строк бойлерплейта на каждое поле

---

## Зависимости

- ✅ Задача 006: `./006-fix-useFieldArray-critical-issues.md` (требуется стабильный useFieldArray)

---

## Сложность
**Оценка:** Средняя

**Изменения:**
- ~100 строк кода хука
- ~100 строк тестов
- ~30 строк документации

---

## Приоритет
**Высокий** — критично для эргономики работы со сложными формами

---

## Преимущества

| Аспект | До | После |
|--------|----|-------|
| **Бойлерплейт на поле** | ~10 строк | ~1 строка |
| **Подписка** | На весь массив | На конкретное поле |
| **Типобезопасность** | Ручная | Автоматическая |
| **Производительность** | Ре-рендер всего массива | Ре-рендер только изменённого поля |

---

## Сравнение с другими библиотеками

| Библиотека | API для массивов | Гранулярность |
|------------|------------------|---------------|
| **React Hook Form** | `useFieldArray()` + `register()` | ✅ На уровне поля |
| **Formik** | `<FieldArray>` + `<Field name>` | ✅ На уровне поля |
| **VeeValidate** | `useFieldArray()` + `useField()` | ✅ На уровне поля |
| **@nexus-state/form (до)** | `useFieldArray()` + ручной доступ | ❌ На уровне элемента |
| **@nexus-state/form (после)** | `useFieldInArray()` | ✅ На уровне поля |

---

## Ссылки

- Задача 006: `./006-fix-useFieldArray-critical-issues.md`
- Задача 008: `./008-add-field-array-validation.md`
- React Hook Form: https://react-hook-form.com/api/usefieldarray
