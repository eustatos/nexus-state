// Tests for demo-family application
import { describe, it, expect } from 'vitest';
import { atom, createStore } from "@nexus-state/core";
import { atomFamily } from "@nexus-state/family";

describe('atomFamily', () => {
  it('should create and retrieve a todo atom', () => {
    const store = createStore();
    const todosFamily = atomFamily((id) =>
      atom({
        id,
        text: "",
        completed: false,
        createdAt: new Date(),
      }),
    );

    const todoAtom = todosFamily(1);
    const initialValue = store.get(todoAtom);
    expect(initialValue).toBeDefined();
    expect(initialValue.id).toBe(1);

    const todoData = {
      id: 1,
      text: "Test todo",
      completed: false,
      createdAt: new Date(),
    };
    store.set(todoAtom, todoData);

    const updatedValue = store.get(todoAtom);
    expect(updatedValue.text).toBe("Test todo");
  });

  it('should manage todo IDs list', () => {
    const store = createStore();
    const todoIdsAtom = atom<number[]>([]);

    const initialValue = store.get(todoIdsAtom);
    expect(initialValue).toEqual([]);

    store.set(todoIdsAtom, [1, 2, 3]);
    const updatedValue = store.get(todoIdsAtom);
    expect(updatedValue).toEqual([1, 2, 3]);

    store.set(todoIdsAtom, [1, 3]);
    const finalValue = store.get(todoIdsAtom);
    expect(finalValue).toEqual([1, 3]);
  });

  it('should work with allTodosSelector', () => {
    const store = createStore();
    const todoIdsAtom = atom<number[]>([]);
    const todosFamily = atomFamily((id) =>
      atom({
        id,
        text: "",
        completed: false,
        createdAt: new Date(),
      }),
    );

    const allTodosSelector = atom((get) => {
      const ids = get(todoIdsAtom);
      return ids.map((id) => get(todosFamily(id)));
    });

    const initialTodos = store.get(allTodosSelector);
    expect(initialTodos).toEqual([]);

    store.set(todoIdsAtom, [1, 2]);
    store.get(todosFamily(1));
    store.get(todosFamily(2));

    store.set(todosFamily(1), {
      id: 1,
      text: "First todo",
      completed: false,
      createdAt: new Date(),
    });

    store.set(todosFamily(2), {
      id: 2,
      text: "Second todo",
      completed: true,
      createdAt: new Date(),
    });

    const todos = store.get(allTodosSelector);
    expect(todos).toHaveLength(2);
    expect(todos[0].text).toBe("First todo");
    expect(todos[1].text).toBe("Second todo");
  });
});
