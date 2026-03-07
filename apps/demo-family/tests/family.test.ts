// Tests for demo-family application
import { describe, it, expect } from "vitest";
import { atom, createStore } from "@nexus-state/core";
import { atomFamily } from "@nexus-state/family";

describe("atomFamily", () => {
  it("should create and retrieve a todo atom", () => {
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

    // Инициализируем атом в хранилище
    const initialValue = store.get(todoAtom);
    expect(initialValue).toEqual({
      id: 1,
      text: "",
      completed: false,
      createdAt: expect.any(Date),
    });

    // Устанавливаем значение для атома
    const todoData = {
      id: 1,
      text: "Test todo",
      completed: false,
      createdAt: new Date(),
    };
    store.set(todoAtom, todoData);

    // Проверяем, что значение установлено правильно
    const updatedValue = store.get(todoAtom);
    expect(updatedValue).toEqual(todoData);
  });

  it("should manage todo IDs list", () => {
    const store = createStore();
    const todoIdsAtom = atom<number[]>([]);

    // Проверяем начальное значение
    const initialValue = store.get(todoIdsAtom);
    expect(initialValue).toEqual([]);

    // Добавляем ID в список
    store.set(todoIdsAtom, [1, 2, 3]);
    const updatedValue = store.get(todoIdsAtom);
    expect(updatedValue).toEqual([1, 2, 3]);

    // Удаляем ID из списка
    store.set(todoIdsAtom, [1, 3]);
    const finalValue = store.get(todoIdsAtom);
    expect(finalValue).toEqual([1, 3]);
  });

  it("should work with allTodosSelector", () => {
    const store = createStore();

    // Создаем атомы для теста
    const todoIdsAtom = atom<number[]>([]);
    const todosFamily = atomFamily((id) =>
      atom({
        id,
        text: "",
        completed: false,
        createdAt: new Date(),
      }),
    );

    // Создаем селектор
    const allTodosSelector = atom((get) => {
      const ids = get(todoIdsAtom);
      return ids.map((id) => {
        const todo = get(todosFamily(id));
        return todo;
      });
    });

    // Проверяем, что селектор возвращает пустой массив для пустого списка ID
    const initialTodos = store.get(allTodosSelector);
    expect(initialTodos).toEqual([]);

    // Сначала устанавливаем значения для атомов
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

    // Добавляем ID в список
    store.set(todoIdsAtom, [1, 2]);

    // Проверяем, что селектор возвращает правильные значения
    const todos = store.get(allTodosSelector);
    expect(todos).toHaveLength(2);
    expect(todos[0]).toEqual(expect.objectContaining({
      id: 1,
      text: "First todo",
      completed: false,
    }));
    expect(todos[1]).toEqual(expect.objectContaining({
      id: 2,
      text: "Second todo",
      completed: true,
    }));
  });
});
