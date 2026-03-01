// Tests for @nexus-state/immer
import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { immerAtom, setImmer } from '../index';

describe('immerAtom', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should create an immer atom with initial value', () => {
    const atom = immerAtom({ count: 0 }, store);
    const value = store.get(atom);

    expect(value).toEqual({ count: 0 });
  });

  it('should update nested state immutably using setImmer', () => {
    const userAtom = immerAtom(
      {
        name: 'John',
        address: {
          city: 'Moscow',
          street: 'Tverskaya',
        },
      },
      store,
    );

    setImmer(userAtom, (draft) => {
      draft.address.city = 'Saint Petersburg';
    });

    const value = store.get(userAtom);
    expect(value.address.city).toBe('Saint Petersburg');
    expect(value.name).toBe('John');
  });

  it('should handle array mutations', () => {
    const itemsAtom = immerAtom<string[]>(['apple', 'banana'], store);

    setImmer(itemsAtom, (draft) => {
      draft.push('orange');
    });

    const value = store.get(itemsAtom);
    expect(value).toEqual(['apple', 'banana', 'orange']);
    expect(value.length).toBe(3);
  });

  it('should handle complex nested updates', () => {
    type State = {
      users: Array<{ id: number; name: string; active: boolean }>;
      settings: {
        theme: string;
        notifications: {
          email: boolean;
          push: boolean;
        };
      };
    };

    const stateAtom = immerAtom<State>(
      {
        users: [
          { id: 1, name: 'Alice', active: true },
          { id: 2, name: 'Bob', active: false },
        ],
        settings: {
          theme: 'dark',
          notifications: {
            email: true,
            push: false,
          },
        },
      },
      store,
    );

    setImmer(stateAtom, (draft) => {
      // Update user
      const user = draft.users.find((u) => u.id === 2);
      if (user) {
        user.active = true;
        user.name = 'Bobby';
      }
      // Update nested settings
      draft.settings.notifications.push = true;
      draft.settings.theme = 'light';
    });

    const value = store.get(stateAtom);
    expect(value.users[1]).toEqual({ id: 2, name: 'Bobby', active: true });
    expect(value.settings.theme).toBe('light');
    expect(value.settings.notifications.push).toBe(true);
    expect(value.settings.notifications.email).toBe(true);
  });

  it('should handle primitive values', () => {
    const countAtom = immerAtom(0, store);

    setImmer(countAtom, (draft) => {
      return draft + 5;
    });

    expect(store.get(countAtom)).toBe(5);
  });

  it('should handle delete operations on objects', () => {
    const dataAtom = immerAtom<{ a: number; b?: number; c: number }>(
      { a: 1, b: 2, c: 3 },
      store,
    );

    setImmer(dataAtom, (draft) => {
      delete draft.b;
    });

    const value = store.get(dataAtom);
    expect(value).toEqual({ a: 1, c: 3 });
    expect('b' in value).toBe(false);
  });

  it('should maintain immutability', () => {
    const original = { nested: { value: 1 } };
    const atom = immerAtom(original, store);

    let snapshot: any;
    setImmer(atom, (draft) => {
      snapshot = { ...draft };
      draft.nested.value = 2;
    });

    const currentValue = store.get(atom);
    expect(currentValue.nested.value).toBe(2);
    expect(original.nested.value).toBe(1); // Original should be unchanged
  });
});

describe('setImmer', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('should apply multiple updates correctly', () => {
    const counterAtom = immerAtom({ count: 0, history: [] as number[] }, store);

    setImmer(counterAtom, (draft) => {
      draft.count += 1;
      draft.history.push(draft.count);
    });

    setImmer(counterAtom, (draft) => {
      draft.count += 1;
      draft.history.push(draft.count);
    });

    const value = store.get(counterAtom);
    expect(value.count).toBe(2);
    expect(value.history).toEqual([1, 2]);
  });

  it('should work with optional chaining in drafts', () => {
    type State = {
      user?: {
        profile?: {
          name: string;
        };
      };
    };

    const stateAtom = immerAtom<State>({}, store);

    setImmer(stateAtom, (draft) => {
      // This should not throw even though properties are undefined
      const name = draft.user?.profile?.name;
      expect(name).toBeUndefined();
    });
  });
});
