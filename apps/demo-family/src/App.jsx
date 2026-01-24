import React from 'react';
import { atom, createStore } from '@nexus-state/core';
import { family } from '@nexus-state/family';

// Создаем хранилище
const store = createStore();

// Создаем атом-семью для управления списком задач
const todosFamily = family({
  key: 'todos',
  create: (id) => atom({
    id,
    text: '',
    completed: false,
    createdAt: new Date()
  })
});

// Создаем атом для хранения списка ID задач
const todoIdsAtom = atom([]);

// Создаем селектор для получения всех задач
const allTodosSelector = atom((get) => {
  const ids = get(todoIdsAtom);
  return ids.map(id => get(todosFamily(id)));
});

let nextId = 1;

export const App = () => {
  const [newTodoText, setNewTodoText] = React.useState('');

  const addTodo = () => {
    if (newTodoText.trim()) {
      const id = nextId++;
      // Добавляем новый ID в список
      store.set(todoIdsAtom, [...store.get(todoIdsAtom), id]);
      // Устанавливаем данные для новой задачи
      store.set(todosFamily(id), {
        id,
        text: newTodoText,
        completed: false,
        createdAt: new Date()
      });
      setNewTodoText('');
    }
  };

  const toggleTodo = (id) => {
    const currentTodo = store.get(todosFamily(id));
    store.set(todosFamily(id), {
      ...currentTodo,
      completed: !currentTodo.completed
    });
  };

  const deleteTodo = (id) => {
    // Удаляем ID из списка
    store.set(todoIdsAtom, store.get(todoIdsAtom).filter(todoId => todoId !== id));
    // Удаляем атом задачи (опционально)
  };

  const todos = store.get(allTodosSelector);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Nexus State Family Demo</h1>
      <p>Демонстрация работы с атомами-семьями для управления коллекциями данных</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Добавить новую задачу</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Введите текст задачи"
            style={{ flex: 1, padding: '8px' }}
          />
          <button onClick={addTodo} style={{ padding: '8px 16px' }}>
            Добавить
          </button>
        </div>
      </div>
      
      <div>
        <h2>Список задач ({todos.length})</h2>
        {todos.length === 0 ? (
          <p>Нет задач. Добавьте первую задачу!</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {todos.map(todo => (
              <li 
                key={todo.id} 
                style={{ 
                  padding: '10px', 
                  border: '1px solid #ddd', 
                  marginBottom: '8px', 
                  borderRadius: '4px',
                  backgroundColor: todo.completed ? '#f0f0f0' : 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    style={{ marginRight: '10px' }}
                  />
                  <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                    {todo.text}
                  </span>
                </div>
                <button 
                  onClick={() => deleteTodo(todo.id)}
                  style={{ 
                    padding: '4px 8px', 
                    backgroundColor: '#ff4444', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
        <h3>Как это работает:</h3>
        <ul>
          <li><strong>family</strong> создает атомы по запросу с уникальным ключом</li>
          <li>Каждая задача хранится в отдельном атоме, идентифицируемом по ID</li>
          <li>todoIdsAtom хранит список всех активных ID задач</li>
          <li>allTodosSelector собирает все задачи в один массив для отображения</li>
        </ul>
      </div>
    </div>
  );
};