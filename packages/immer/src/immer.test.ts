// Tests for @nexus-state/immer
import { describe, expect, it, beforeEach } from 'vitest';
import { createStore, atom, Atom } from '@nexus-state/core';
import { immerAtom, setImmer, createImmerStore, produce, setAutoFreeze } from '../index';
import { enableMapSet } from 'immer';

// Enable Map and Set support in Immer
enableMapSet();

describe('immerAtom', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should create an atom with initial value', () => {
    const userAtom = immerAtom({ name: 'John' }, store);
    expect(store.get(userAtom)).toEqual({ name: 'John' });
  });

  it('should create an atom with a name', () => {
    const userAtom = immerAtom({ name: 'John' }, store, { name: 'user' });
    expect(store.get(userAtom)).toEqual({ name: 'John' });
  });

  it('should work with primitive values', () => {
    const countAtom = immerAtom(0, store);
    expect(store.get(countAtom)).toBe(0);
  });

  it('should work with arrays', () => {
    const itemsAtom = immerAtom([1, 2, 3], store);
    expect(store.get(itemsAtom)).toEqual([1, 2, 3]);
  });

  it('should work with nested objects', () => {
    const configAtom = immerAtom({
      app: {
        name: 'MyApp',
        settings: {
          theme: 'dark',
          notifications: true
        }
      }
    }, store);
    
    expect(store.get(configAtom)).toEqual({
      app: {
        name: 'MyApp',
        settings: {
          theme: 'dark',
          notifications: true
        }
      }
    });
  });

  it('should store the atom-store mapping', () => {
    const userAtom = immerAtom({ name: 'John' }, store);
    setImmer(userAtom, (draft) => {
      draft.name = 'Jane';
    });
    expect(store.get(userAtom)).toEqual({ name: 'Jane' });
  });

  it('should throw error when setImmer is called on non-immer atom', () => {
    const regularAtom = atom({ name: 'John' });
    
    expect(() => {
      setImmer(regularAtom, (draft) => {
        draft.name = 'Jane';
      });
    }).toThrow('Store not found for atom');
  });
});

describe('setImmer', () => {
  let store: ReturnType<typeof createStore>;
  let userAtom: ReturnType<typeof immerAtom<{ name: string; age: number }>>;

  beforeEach(() => {
    store = createStore();
    userAtom = immerAtom({ name: 'John', age: 30 }, store);
  });

  it('should update nested properties', () => {
    setImmer(userAtom, (draft) => {
      draft.name = 'Jane';
    });
    expect(store.get(userAtom)).toEqual({ name: 'Jane', age: 30 });
  });

  it('should update multiple properties', () => {
    setImmer(userAtom, (draft) => {
      draft.name = 'Jane';
      draft.age = 25;
    });
    expect(store.get(userAtom)).toEqual({ name: 'Jane', age: 25 });
  });

  it('should work with array mutations', () => {
    const itemsAtom = immerAtom([1, 2, 3], store);
    
    setImmer(itemsAtom, (draft) => {
      draft.push(4);
    });
    expect(store.get(itemsAtom)).toEqual([1, 2, 3, 4]);
  });

  it('should work with array splice', () => {
    const itemsAtom = immerAtom([1, 2, 3, 4], store);
    
    setImmer(itemsAtom, (draft) => {
      draft.splice(1, 2);
    });
    expect(store.get(itemsAtom)).toEqual([1, 4]);
  });

  it('should work with array find and modify', () => {
    const todosAtom = immerAtom([
      { id: 1, text: 'Learn React', completed: false },
      { id: 2, text: 'Learn Immer', completed: false }
    ], store);
    
    setImmer(todosAtom, (draft) => {
      const todo = draft.find(t => t.id === 1);
      if (todo) todo.completed = true;
    });
    
    expect(store.get(todosAtom)).toEqual([
      { id: 1, text: 'Learn React', completed: true },
      { id: 2, text: 'Learn Immer', completed: false }
    ]);
  });

  it('should work with object property deletion', () => {
    const dataAtom = immerAtom<{
      users: Record<string, string>
    }>({
      users: { '1': 'John', '2': 'Jane' }
    }, store);
    
    setImmer(dataAtom, (draft) => {
      delete draft.users['1'];
    });
    
    expect(store.get(dataAtom)).toEqual({
      users: { '2': 'Jane' }
    });
  });

  it('should create new reference on update', () => {
    const before = store.get(userAtom);
    
    setImmer(userAtom, (draft) => {
      draft.name = 'Jane';
    });
    
    const after = store.get(userAtom);
    expect(before).not.toBe(after);
  });

  it('should preserve unchanged nested references', () => {
    const configAtom = immerAtom({
      app: { name: 'MyApp' },
      settings: { theme: 'dark' }
    }, store);
    
    const before = store.get(configAtom);
    
    setImmer(configAtom, (draft) => {
      draft.app.name = 'NewApp';
    });
    
    const after = store.get(configAtom);
    expect(before.app).not.toBe(after.app);
    expect(before.settings).toBe(after.settings); // Unchanged
  });

  it('should handle function-style updates via produce', () => {
    const countAtom = immerAtom(0, store);
    
    setImmer(countAtom, (draft) => {
      draft = draft + 5;
    });
    
    // Note: For primitive values, you need to return the new value
    // or use direct assignment. This test shows the limitation.
    expect(store.get(countAtom)).toBe(0); // Unchanged because draft reassignment doesn't work
  });

  it('should handle direct primitive updates', () => {
    const countAtom = immerAtom({ value: 0 }, store);
    
    setImmer(countAtom, (draft) => {
      draft.value += 5;
    });
    
    expect(store.get(countAtom).value).toBe(5);
  });

  it('should handle deeply nested updates', () => {
    const deepAtom = immerAtom({
      level1: {
        level2: {
          level3: {
            value: 'original'
          }
        }
      }
    }, store);
    
    setImmer(deepAtom, (draft) => {
      draft.level1.level2.level3.value = 'updated';
    });
    
    expect(store.get(deepAtom).level1.level2.level3.value).toBe('updated');
  });
});

describe('immerAtom with complex types', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should work with Map-like objects', () => {
    const mapAtom = immerAtom({
      items: new Map([['key1', 'value1']])
    }, store);
    
    setImmer(mapAtom, (draft) => {
      draft.items.set('key2', 'value2');
    });
    
    const result = store.get(mapAtom);
    expect(result.items.get('key1')).toBe('value1');
    expect(result.items.get('key2')).toBe('value2');
  });

  it('should work with Date objects', () => {
    const dateAtom = immerAtom({
      createdAt: new Date('2024-01-01')
    }, store);
    
    setImmer(dateAtom, (draft) => {
      draft.createdAt = new Date('2024-12-01');
    });
    
    expect(store.get(dateAtom).createdAt).toEqual(new Date('2024-12-01'));
  });

  it('should work with union types', () => {
    const stateAtom = immerAtom<{ status: 'loading' | 'success' | 'error'; data?: string }>({
      status: 'loading'
    }, store);
    
    setImmer(stateAtom, (draft) => {
      draft.status = 'success';
      draft.data = 'Loaded!';
    });
    
    expect(store.get(stateAtom)).toEqual({
      status: 'success',
      data: 'Loaded!'
    });
  });
});

describe('createImmerStore', () => {
  it('should return the store', () => {
    const store = createStore();
    const result = createImmerStore(store);
    expect(result).toBe(store);
  });

  it('should not modify store behavior', () => {
    const store = createStore();
    const atom1 = atom(0);
    
    createImmerStore(store);
    
    store.set(atom1, 5);
    expect(store.get(atom1)).toBe(5);
  });
});

describe('produce re-export', () => {
  it('should export produce from immer', () => {
    const state = { count: 0 };
    const newState = produce(state, (draft) => {
      draft.count += 1;
    });
    
    expect(newState).toEqual({ count: 1 });
    expect(newState).not.toBe(state);
  });
});

describe('setAutoFreeze re-export', () => {
  it('should export setAutoFreeze from immer', () => {
    // Should not throw
    expect(() => setAutoFreeze(true)).not.toThrow();
    expect(() => setAutoFreeze(false)).not.toThrow();
  });
});

describe('integration with core features', () => {
  it('should work with computed atoms', () => {
    const store = createStore();
    const baseAtom = immerAtom({ count: 0 }, store);
    const computedAtom = atom((get: (a: Atom<{ count: number }>) => { count: number }) => get(baseAtom as Atom<{ count: number }>).count * 2);
    
    expect(store.get(computedAtom)).toBe(0);
    
    setImmer(baseAtom, (draft) => {
      draft.count = 5;
    });
    
    expect(store.get(computedAtom)).toBe(10);
  });

  it('should work with multiple stores', () => {
    const store1 = createStore();
    const store2 = createStore();
    
    const atom1 = immerAtom({ value: 0 }, store1);
    const atom2 = immerAtom({ value: 0 }, store2);
    
    setImmer(atom1, (draft) => {
      draft.value = 10;
    });
    
    setImmer(atom2, (draft) => {
      draft.value = 20;
    });
    
    expect(store1.get(atom1).value).toBe(10);
    expect(store2.get(atom2).value).toBe(20);
  });

  it('should work with atom names for debugging', () => {
    const store = createStore();
    const userAtom = immerAtom({ name: 'John' }, store, { name: 'user' });
    
    setImmer(userAtom, (draft) => {
      draft.name = 'Jane';
    });
    
    expect(store.get(userAtom)).toEqual({ name: 'Jane' });
  });
});

describe('error handling', () => {
  it('should handle errors in updater function', () => {
    const store = createStore();
    const userAtom = immerAtom({ name: 'John' }, store);
    
    expect(() => {
      setImmer(userAtom, () => {
        throw new Error('Test error');
      });
    }).toThrow('Test error');
    
    // State should be unchanged
    expect(store.get(userAtom)).toEqual({ name: 'John' });
  });

  it('should handle null values', () => {
    const store = createStore();
    const nullableAtom = immerAtom<{ value: string | null }>({ value: 'initial' }, store);
    
    setImmer(nullableAtom, (draft) => {
      draft.value = null;
    });
    
    expect(store.get(nullableAtom)).toEqual({ value: null });
  });

  it('should handle undefined values', () => {
    const store = createStore();
    const optionalAtom = immerAtom<{ value?: string }>({ value: 'initial' }, store);
    
    setImmer(optionalAtom, (draft) => {
      draft.value = undefined;
    });
    
    expect(store.get(optionalAtom)).toEqual({ value: undefined });
  });
});
