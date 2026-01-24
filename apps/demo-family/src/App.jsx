import React from 'react';
import { atom, createStore } from '@nexus-state/core';
import { atomFamily } from '@nexus-state/family';

// Create store
const store = createStore();

// Create atom family for managing todo items
const todosFamily = atomFamily((id) => atom({
  id,
  text: '',
  completed: false,
  createdAt: new Date()
}));

// Create atom for storing list of todo IDs
const todoIdsAtom = atom([]);

// Create selector for getting all todos
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
      // Add new ID to the list
      store.set(todoIdsAtom, [...store.get(todoIdsAtom), id]);
      // Set data for the new todo
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
    // Remove ID from the list
    store.set(todoIdsAtom, store.get(todoIdsAtom).filter(todoId => todoId !== id));
    // Remove todo atom (optional)
  };

  const todos = store.get(allTodosSelector);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Nexus State Family Demo</h1>
      <p>Demonstration of working with atom families for managing data collections</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Add New Todo</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="Enter todo text"
            style={{ flex: 1, padding: '8px' }}
          />
          <button onClick={addTodo} style={{ padding: '8px 16px' }}>
            Add
          </button>
        </div>
      </div>
      
      <div>
        <h2>Todo List ({todos.length})</h2>
        {todos.length === 0 ? (
          <p>No todos. Add your first todo!</p>
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
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
        <h3>How it works:</h3>
        <ul>
          <li><strong>atomFamily</strong> creates atoms on demand with unique keys</li>
          <li>Each todo is stored in a separate atom identified by ID</li>
          <li>todoIdsAtom stores the list of all active todo IDs</li>
          <li>allTodosSelector collects all todos into one array for display</li>
        </ul>
      </div>
    </div>
  );
};