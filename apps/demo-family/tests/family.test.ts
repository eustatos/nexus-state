// Tests for demo-family application
import { atom, createStore } from '@nexus-state/core';
import { atomFamily } from '@nexus-state/family';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('demo-family functionality', () => {
  it('should create and retrieve a todo atom', () => {
    const store = createStore();
    const todosFamily = atomFamily((id) => atom({
      id,
      text: '',
      completed: false,
      createdAt: new Date()
    }));
    
    const todoAtom = todosFamily(1);
    
    // Инициализируем атом в хранилище
    const initialValue = store.get(todoAtom);
    expect(initialValue).toEqual({
      id: 1,
      text: '',
      completed: false,
      createdAt: expect.any(Date)
    });
    
    // Устанавливаем значение для атома
    const todoData = {
      id: 1,
      text: 'Test todo',
      completed: false,
      createdAt: new Date()
    };
    store.set(todoAtom, todoData);
    
    // Проверяем, что значение установлено правильно
    const updatedValue = store.get(todoAtom);
    expect(updatedValue).toEqual(todoData);
  });

  it('should manage todo IDs list', () => {
    const store = createStore();
    const todoIdsAtom = atom([]);
    
    // Проверяем начальное значение
    expect(store.get(todoIdsAtom)).toEqual([]);
    
    // Добавляем ID в список
    store.set(todoIdsAtom, [1, 2, 3]);
    expect(store.get(todoIdsAtom)).toEqual([1, 2, 3]);
    
    // Удаляем ID из списка
    store.set(todoIdsAtom, [1, 3]);
    expect(store.get(todoIdsAtom)).toEqual([1, 3]);
  });

  it('should work with allTodosSelector', () => {
    const store = createStore();
    
    // Создаем атомы для теста
    const todoIdsAtom = atom([]);
    const todosFamily = atomFamily((id) => atom({
      id,
      text: '',
      completed: false,
      createdAt: new Date()
    }));
    
    // Создаем селектор
    const allTodosSelector = atom((get) => {
      const ids = get(todoIdsAtom);
      return ids.map(id => get(todosFamily(id)));
    });
    
    // Проверяем, что селектор возвращает пустой массив для пустого списка ID
    expect(store.get(allTodosSelector)).toEqual([]);
    
    // Добавляем ID в список
    store.set(todoIdsAtom, [1, 2]);
    
    // Инициализируем атомы
    store.get(todosFamily(1));
    store.get(todosFamily(2));
    
    // Устанавливаем значения для атомов
    store.set(todosFamily(1), {
      id: 1,
      text: 'First todo',
      completed: false,
      createdAt: new Date()
    });
    
    store.set(todosFamily(2), {
      id: 2,
      text: 'Second todo',
      completed: true,
      createdAt: new Date()
    });
    
    // Проверяем, что селектор возвращает правильные значения
    const todos = store.get(allTodosSelector);
    expect(todos).toHaveLength(2);
    expect(todos[0]).toEqual({
      id: 1,
      text: 'First todo',
      completed: false,
      createdAt: expect.any(Date)
    });
    expect(todos[1]).toEqual({
      id: 2,
      text: 'Second todo',
      completed: true,
      createdAt: expect.any(Date)
    });
  });
});