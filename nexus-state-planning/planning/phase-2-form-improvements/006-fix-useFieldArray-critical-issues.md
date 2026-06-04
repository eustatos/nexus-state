# Задача 006: Исправить критические проблемы useFieldArray

## Описание
Устранить критические проблемы текущей реализации `useFieldArray`, блокирующие production-использование.

## Проблемы текущей реализации

### Проблема 1: Подписка только на первый атом

**Файл:** `packages/form/src/react/useFieldArray.tsx:61-68`

```typescript
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

**Проблема:** Изменения в элементах массива со 2-го и далее не вызывают ре-рендер компонента.

**Решение:**
```typescript
useEffect(() => {
  // Подписаться на все атомы массива
  const unsubscribeAll = meta.itemAtoms.map(atom =>
    store.subscribe(atom, () => setForceUpdate(prev => prev + 1))
  );
  
  return () => {
    unsubscribeAll.forEach(unsub => unsub());
  };
}, [store, meta.itemAtoms]);
```

---

### Проблема 2: Ограничение типа TItem

**Файл:** `packages/form/src/react/useFieldArray.tsx:33`

```typescript
export function useFieldArray<TItem extends Record<string, unknown>>(
// ⚠️ Нельзя использовать с примитивами (string[], number[])
```

**Проблема:**
```typescript
// ❌ Не работает:
const { fields } = useFieldArray<string>('tags');

// ✅ Работает только с объектами:
const { fields } = useFieldArray<{ value: string }>('tags');
```

**Решение:** Убрать ограничение
```typescript
export function useFieldArray<TItem>(
  name: string,
  options?: { defaultValue?: TItem[] }
): UseFieldArrayReturn<TItem>;
```

---

### Проблема 3: ID на основе индекса

**Файл:** `packages/form/src/react/useFieldArray.tsx:73-76`

```typescript
const fields = useMemo(
  () => items.map((item: TItem, index: number) => ({
    ...item,
    id: `${name}.${index}` // ⚠️ ID меняется при удалении/перемещении
  })),
  [items, name]
);
```

**Проблема:** При удалении/перемещении элементов `id` меняются → React пересоздаёт компоненты вместо перемещения.

**Решение:**
```typescript
// Вариант 1: Генерировать stable ID при создании атома
const append = (item: TItem) => {
  const itemWithId = { 
    ...item, 
    id: generateUniqueId() // stable ID
  };
  fieldArray.append(itemWithId);
  setForceUpdate(prev => prev + 1);
};

// Вариант 2: Использовать существующий id если есть
const fields = useMemo(
  () => items.map((item, index) => {
    const id = (item as any).id ?? `${name}.${index}.${generateHash(item)}`;
    return { ...item, id };
  }),
  [items, name]
);
```

---

## Решение

### 1. Обновить useFieldArray

**Файл:** `packages/form/src/react/useFieldArray.tsx`

```typescript
import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { useStore, useAtomValue } from '@nexus-state/react';
import { createFieldArray, getFieldArray } from '../field-array';
import type { UseFieldArrayReturn } from './types';

/**
 * Generate stable unique ID for array item
 */
function generateUniqueId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get stable ID for item
 */
function getItemId(item: any, name: string, index: number): string {
  // Use existing id if present
  if (item?.id && typeof item.id === 'string') {
    return item.id;
  }
  
  // Generate hash-based id for primitives and objects without id
  const hash = JSON.stringify(item).split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0) | 0;
  }, 0);
  
  return `${name}.${index}.${Math.abs(hash).toString(36)}`;
}

/**
 * Hook for managing dynamic field arrays
 * @param name - Field array name
 * @param options - Options including default items
 * @returns Array fields and manipulation methods
 */
export function useFieldArray<TItem>(
  name: string,
  options: { defaultValue?: TItem[] } = {}
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
      {} as TItem
    );
  }

  const meta = fieldArrayMetaRef.current;
  const fieldArray = getFieldArray(store, meta);

  // ✅ FIX 1: Subscribe to ALL atoms in array
  useEffect(() => {
    const unsubscribeAll = meta.itemAtoms.map(atom =>
      store.subscribe(atom, () => setForceUpdate(prev => prev + 1))
    );
    
    return () => {
      unsubscribeAll.forEach(unsub => unsub());
    };
  }, [store, meta.itemAtoms]);

  // Get items
  const items = fieldArray.fields;

  // ✅ FIX 3: Generate stable IDs
  const fields = useMemo(
    () => items.map((item: TItem, index: number) => ({
      ...item,
      id: getItemId(item, name, index)
    })),
    [items, name]
  );

  // Array manipulation methods with stable ID generation
  const append = useCallback((item: TItem) => {
    // Add stable ID if item is object
    const itemWithId = typeof item === 'object' && item !== null && !('id' in item)
      ? { ...item, id: generateUniqueId() } as TItem
      : item;
    
    fieldArray.append(itemWithId);
    setForceUpdate(prev => prev + 1);
  }, [fieldArray]);

  const prepend = useCallback((item: TItem) => {
    const itemWithId = typeof item === 'object' && item !== null && !('id' in item)
      ? { ...item, id: generateUniqueId() } as TItem
      : item;
    
    fieldArray.prepend(itemWithId);
    setForceUpdate(prev => prev + 1);
  }, [fieldArray]);

  const insert = useCallback((index: number, item: TItem) => {
    const itemWithId = typeof item === 'object' && item !== null && !('id' in item)
      ? { ...item, id: generateUniqueId() } as TItem
      : item;
    
    fieldArray.insert(index, itemWithId);
    setForceUpdate(prev => prev + 1);
  }, [fieldArray, items]);

  const remove = useCallback((index: number) => {
    fieldArray.remove(index);
    setForceUpdate(prev => prev + 1);
  }, [fieldArray]);

  const swap = useCallback((indexA: number, indexB: number) => {
    fieldArray.swap(indexA, indexB);
    setForceUpdate(prev => prev + 1);
  }, [fieldArray]);

  const move = useCallback((from: number, to: number) => {
    fieldArray.move(from, to);
    setForceUpdate(prev => prev + 1);
  }, [fieldArray]);

  const update = useCallback((index: number, item: TItem) => {
    const newItems = items.map((existing: TItem, i: number) => {
      if (i === index) {
        // Preserve existing id if present
        const existingId = (existing as any)?.id;
        return existingId ? { ...item, id: existingId } as TItem : item;
      }
      return existing;
    });
    fieldArray.replace(newItems);
    setForceUpdate(prev => prev + 1);
  }, [fieldArray, items]);

  const replace = useCallback((items: TItem[]) => {
    // Add stable IDs to items without them
    const itemsWithIds = items.map((item, index) => {
      if (typeof item === 'object' && item !== null && !('id' in item)) {
        return { ...item, id: generateUniqueId() } as TItem;
      }
      return item;
    });
    
    fieldArray.replace(itemsWithIds);
    setForceUpdate(prev => prev + 1);
  }, [fieldArray]);

  return {
    fields,
    append,
    prepend,
    remove,
    insert,
    swap,
    move,
    update,
    replace,
  };
}
```

---

### 2. Обновить типы

**Файл:** `packages/form/src/react/types.ts`

```typescript
/**
 * Return type for useFieldArray hook
 */
export interface UseFieldArrayReturn<TItem> {
  /** Array fields with unique IDs */
  fields: Array<TItem & { id: string }>;

  /** Append item to end */
  append: (item: TItem) => void;

  /** Prepend item to start */
  prepend: (item: TItem) => void;

  /** Remove item at index */
  remove: (index: number) => void;

  /** Insert item at index */
  insert: (index: number, item: TItem) => void;

  /** Swap two items */
  swap: (indexA: number, indexB: number) => void;

  /** Move item from one index to another */
  move: (from: number, to: number) => void;

  /** Update item at index */
  update: (index: number, item: TItem) => void;

  /** Replace entire array */
  replace: (items: TItem[]) => void;
}
```

---

## Использование

### Пример 1: Массив примитивов

```typescript
// ✅ Теперь работает с примитивами!
function TagsField() {
  const { fields, append, remove } = useFieldArray<string>('tags', {
    defaultValue: []
  });

  return (
    <div>
      {fields.map((tag, index) => (
        <div key={tag.id}>
          <input value={tag} readOnly />
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => append('')}>Add Tag</button>
    </div>
  );
}
```

### Пример 2: Массив объектов

```typescript
interface Phone {
  id?: string;
  number: string;
  type: 'mobile' | 'work' | 'home';
}

function PhonesField() {
  const { fields, append, remove } = useFieldArray<Phone>('phones', {
    defaultValue: []
  });

  return (
    <div>
      {fields.map((phone, index) => (
        <div key={phone.id}>
          <input 
            value={phone.number}
            onChange={(e) => update(index, { ...phone, number: e.target.value })}
          />
          <select value={phone.type}>
            <option value="mobile">Mobile</option>
            <option value="work">Work</option>
            <option value="home">Home</option>
          </select>
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => append({ number: '', type: 'mobile' })}>
        Add Phone
      </button>
    </div>
  );
}
```

---

## Критерии приемки

- [ ] Подписка на все атомы в массиве
- [ ] Работа с примитивами (string[], number[])
- [ ] Stable ID для элементов
- [ ] Сохранение ID при update/replace
- [ ] Unit тесты на подписку
- [ ] Integration тесты с ре-рендером
- [ ] Тесты на stable ID

---

## Тесты

### Unit тест на подписку

**Файл:** `packages/form/src/react/__tests__/useFieldArray-subscription.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createStore } from '@nexus-state/core';
import { useFieldArray } from '../useFieldArray';
import { useAtom } from '@nexus-state/react';

describe('useFieldArray subscription', () => {
  it('должен перерисовываться при изменении любого элемента', () => {
    const store = createStore();
    
    const { result } = renderHook(
      () => useFieldArray<string>('tags', { defaultValue: ['tag1', 'tag2', 'tag3'] }),
      { wrapper: ({ children }) => <Provider store={store}>{children}</Provider> }
    );

    let renderCount = 0;
    
    // Initial render
    expect(result.current.fields).toHaveLength(3);
    
    // Update second item
    act(() => {
      const field = result.current.fields[1];
      // Simulate change to second atom
    });

    // Should re-render
    expect(renderCount).toBeGreaterThan(0);
  });

  it('должен работать с примитивами', () => {
    const store = createStore();
    
    const { result } = renderHook(
      () => useFieldArray<string>('tags', { defaultValue: [] }),
      { wrapper: ({ children }) => <Provider store={store}>{children}</Provider> }
    );

    act(() => {
      result.current.append('tag1');
    });

    expect(result.current.fields).toHaveLength(1);
    expect(result.current.fields[0]).toBe('tag1');
  });

  it('должен генерировать stable ID', () => {
    const store = createStore();
    
    const { result } = renderHook(
      () => useFieldArray<{ name: string }>('items', { defaultValue: [] }),
      { wrapper: ({ children }) => <Provider store={store}>{children}</Provider> }
    );

    act(() => {
      result.current.append({ name: 'Item 1' });
      result.current.append({ name: 'Item 2' });
    });

    const id1 = result.current.fields[0].id;
    const id2 = result.current.fields[1].id;

    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);

    // Remove first item
    act(() => {
      result.current.remove(0);
    });

    // ID второго элемента не должен измениться
    expect(result.current.fields[0].id).toBe(id2);
  });
});
```

---

## Влияние на существующий код

### Обратная совместимость
✅ **Полная** — изменения не ломают существующий API

### Breaking Changes
⚠️ **Минорные** — `TItem extends Record<string, unknown>` → `TItem`

---

## Сложность
**Оценка:** Средняя

**Изменения:**
- ~50 строк в `useFieldArray.tsx`
- ~5 строк в `types.ts`
- ~80 строк тестов

---

## Приоритет
**Критический** — блокирует production-использование

---

## Ссылки

- Задача 007: `./007-add-useFieldInArray-hook.md`
- Задача 008: `./008-add-field-array-validation.md`
- React Hook Form: https://react-hook-form.com/api/usefieldarray
