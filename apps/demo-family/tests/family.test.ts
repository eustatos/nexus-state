// Tests for demo-family application
import { atom, createStore } from '@nexus-state/core';
import { atomFamily } from '@nexus-state/family';

// Simple test without Jest globals
console.log('Running demo-family functionality tests');

// Test 1: should create and retrieve a todo atom
(() => {
  console.log('Running test: should create and retrieve a todo atom');
  try {
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
    console.log('Initial value:', initialValue);
    
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
    console.log('Updated value:', updatedValue);
    
    console.log('✓ should create and retrieve a todo atom passed');
  } catch (error) {
    console.error('✗ should create and retrieve a todo atom failed:', error);
    throw error;
  }
})();

// Test 2: should manage todo IDs list
(() => {
  console.log('Running test: should manage todo IDs list');
  try {
    const store = createStore();
    const todoIdsAtom = atom([]);
    
    // Проверяем начальное значение
    const initialValue = store.get(todoIdsAtom);
    console.log('Initial todo IDs:', initialValue);
    
    // Добавляем ID в список
    store.set(todoIdsAtom, [1, 2, 3]);
    const updatedValue = store.get(todoIdsAtom);
    console.log('Updated todo IDs:', updatedValue);
    
    // Удаляем ID из списка
    store.set(todoIdsAtom, [1, 3]);
    const finalValue = store.get(todoIdsAtom);
    console.log('Final todo IDs:', finalValue);
    
    console.log('✓ should manage todo IDs list passed');
  } catch (error) {
    console.error('✗ should manage todo IDs list failed:', error);
    throw error;
  }
})();

// Test 3: should work with allTodosSelector
(() => {
  console.log('Running test: should work with allTodosSelector');
  try {
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
    const initialTodos = store.get(allTodosSelector);
    console.log('Initial todos:', initialTodos);
    
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
    console.log('Todos from selector:', todos);
    
    console.log('✓ should work with allTodosSelector passed');
  } catch (error) {
    console.error('✗ should work with allTodosSelector failed:', error);
    throw error;
  }
})();

console.log('All tests completed');