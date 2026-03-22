import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, WrapperComponent } from '@testing-library/react';
import { createStore } from '@nexus-state/core';
import { StoreProvider } from '@nexus-state/react';
import { useFieldArray } from '../useFieldArray';

describe('useFieldArray - Critical Issues Fix', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  const wrapper: WrapperComponent = ({ children }) => (
    <StoreProvider store={store}>{children}</StoreProvider>
  );

  describe('Fix 1: Subscription to all atoms', () => {
    it('должен работать с пустым массивом', () => {
      const { result } = renderHook(
        () => useFieldArray<string>('empty', { defaultValue: [] }),
        { wrapper }
      );

      expect(result.current.fields).toHaveLength(0);
    });

    it('должен добавлять и изменять элементы', () => {
      const { result } = renderHook(
        () => useFieldArray<string>('tags', { defaultValue: ['tag1'] }),
        { wrapper }
      );

      expect(result.current.fields).toHaveLength(1);

      // Add another item
      act(() => {
        result.current.append('tag2');
      });

      expect(result.current.fields).toHaveLength(2);
    });
  });

  describe('Fix 2: Support for primitives', () => {
    it('должен работать с массивом строк', () => {
      const { result } = renderHook(
        () => useFieldArray<string>('tags', { defaultValue: [] }),
        { wrapper }
      );

      act(() => {
        result.current.append('tag1');
      });

      expect(result.current.fields).toHaveLength(1);
      // Для примитивов fields возвращают { id, value }
      expect((result.current.fields[0] as any).value).toBe('tag1');
      expect(result.current.fields[0].id).toBeDefined();
    });

    it('должен работать с массивом чисел', () => {
      const { result } = renderHook(
        () => useFieldArray<number>('numbers', { defaultValue: [] }),
        { wrapper }
      );

      act(() => {
        result.current.append(42);
        result.current.append(100);
      });

      expect(result.current.fields).toHaveLength(2);
      // Для примитивов fields возвращают { id, value }
      expect((result.current.fields[0] as any).value).toBe(42);
      expect((result.current.fields[1] as any).value).toBe(100);
    });

    it('должен работать с массивом объектов', () => {
      interface Item {
        name: string;
      }

      const { result } = renderHook(
        () => useFieldArray<Item>('items', { defaultValue: [] }),
        { wrapper }
      );

      act(() => {
        result.current.append({ name: 'Item 1' });
      });

      expect(result.current.fields).toHaveLength(1);
      expect(result.current.fields[0].name).toBe('Item 1');
    });
  });

  describe('Fix 3: Stable IDs', () => {
    it('должен генерировать unique ID для каждого элемента', () => {
      const { result } = renderHook(
        () => useFieldArray<{ name: string }>('items', { defaultValue: [] }),
        { wrapper }
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
    });

    it('должен сохранять ID при удалении элементов', () => {
      const { result } = renderHook(
        () => useFieldArray<{ name: string }>('items', { defaultValue: [] }),
        { wrapper }
      );

      act(() => {
        result.current.append({ name: 'Item 1' });
        result.current.append({ name: 'Item 2' });
        result.current.append({ name: 'Item 3' });
      });

      const id2 = result.current.fields[1].id;

      // Remove first item
      act(() => {
        result.current.remove(0);
      });

      // ID второго элемента не должен измениться
      expect(result.current.fields[0].id).toBe(id2);
    });

    it('должен сохранять ID при перемещении элементов', () => {
      const { result } = renderHook(
        () => useFieldArray<{ name: string }>('items', { defaultValue: [] }),
        { wrapper }
      );

      act(() => {
        result.current.append({ name: 'Item 1' });
        result.current.append({ name: 'Item 2' });
      });

      const id1 = result.current.fields[0].id;
      const id2 = result.current.fields[1].id;

      // Swap items
      act(() => {
        result.current.swap(0, 1);
      });

      // IDs should move with items
      expect(result.current.fields[0].id).toBe(id2);
      expect(result.current.fields[1].id).toBe(id1);
    });

    it('должен использовать существующий id если есть', () => {
      const { result } = renderHook(
        () => useFieldArray<{ id: string; name: string }>('items', { defaultValue: [] }),
        { wrapper }
      );

      act(() => {
        result.current.append({ id: 'custom-id-123', name: 'Item 1' });
      });

      expect(result.current.fields[0].id).toBe('custom-id-123');
    });

    it('должен сохранять id при update', () => {
      const { result } = renderHook(
        () => useFieldArray<{ id?: string; name: string }>('items', { defaultValue: [] }),
        { wrapper }
      );

      act(() => {
        result.current.append({ name: 'Item 1' });
      });

      const originalId = result.current.fields[0].id;

      act(() => {
        result.current.update(0, { name: 'Updated Item' });
      });

      expect(result.current.fields[0].id).toBe(originalId);
      expect(result.current.fields[0].name).toBe('Updated Item');
    });

    it('должен генерировать новые id при replace', () => {
      const { result } = renderHook(
        () => useFieldArray<{ name: string }>('items', { defaultValue: [] }),
        { wrapper }
      );

      act(() => {
        result.current.append({ name: 'Item 1' });
      });

      const originalId = result.current.fields[0].id;

      act(() => {
        result.current.replace([{ name: 'New Item 1' }, { name: 'New Item 2' }]);
      });

      expect(result.current.fields).toHaveLength(2);
      // New items should have new IDs
      expect(result.current.fields[0].id).not.toBe(originalId);
    });
  });

  describe('All methods together', () => {
    it('должен корректно работать со всеми методами', () => {
      interface Item {
        name: string;
      }

      const { result } = renderHook(
        () => useFieldArray<Item>('items', { defaultValue: [] }),
        { wrapper }
      );

      // Append
      act(() => {
        result.current.append({ name: 'Item 1' });
        result.current.append({ name: 'Item 2' });
      });
      expect(result.current.fields).toHaveLength(2);
      expect(result.current.fields[0].name).toBe('Item 1');
      expect(result.current.fields[1].name).toBe('Item 2');

      // Prepend
      act(() => {
        result.current.prepend({ name: 'Item 0' });
      });
      expect(result.current.fields).toHaveLength(3);
      expect(result.current.fields[0].name).toBe('Item 0');

      // Insert
      act(() => {
        result.current.insert(1, { name: 'Item 0.5' });
      });
      expect(result.current.fields).toHaveLength(4);
      expect(result.current.fields[1].name).toBe('Item 0.5');

      // Remove
      act(() => {
        result.current.remove(1);
      });
      expect(result.current.fields).toHaveLength(3);

      // Update
      act(() => {
        result.current.update(0, { name: 'Updated Item 0' });
      });
      expect(result.current.fields[0].name).toBe('Updated Item 0');

      // Swap - проверяем что длины не изменилась
      act(() => {
        result.current.swap(0, 1);
      });
      expect(result.current.fields).toHaveLength(3);

      // Move
      act(() => {
        result.current.move(0, 2);
      });
      expect(result.current.fields).toHaveLength(3);

      // Replace
      act(() => {
        result.current.replace([{ name: 'New Item' }]);
      });
      expect(result.current.fields).toHaveLength(1);
      expect(result.current.fields[0].name).toBe('New Item');
    });
  });
});
