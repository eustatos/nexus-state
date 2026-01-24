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
  console.log('allTodosSelector: ids =', ids);
  const todos = ids.map(id => {
    const todo = get(todosFamily(id));
    console.log(`allTodosSelector: todo ${id} =`, todo);
    return todo;
  });
  console.log('allTodosSelector: todos =', todos);
  return todos;
});

let nextId = 1;

export const App = () => {
  const [newTodoText, setNewTodoText] = React.useState('');
  const [todos, setTodos] = React.useState([]);

  // Subscribe to changes in the allTodosSelector
  React.useEffect(() => {
    console.log('Initializing subscription to allTodosSelector');
    // Get initial todos
    const initialTodos = store.get(allTodosSelector);
    console.log('Initial todos:', initialTodos);
    setTodos(initialTodos);
    
    // Subscribe to changes
    const unsubscribe = store.subscribe(allTodosSelector, (newTodos) => {
      console.log('allTodosSelector updated:', newTodos);
      setTodos(newTodos);
    });
    
    // Cleanup subscription
    return () => {
      console.log('Cleaning up subscription');
      unsubscribe();
    };
  }, []); // Пустой массив зависимостей означает, что эффект выполняется только один раз

  const addTodo = () => {
    if (newTodoText.trim()) {
      console.log('Adding todo:', newTodoText);
      const id = nextId++;
      console.log('New todo ID:', id);
      
      // Initialize the todo atom by getting it first
      const todoAtom = todosFamily(id);
      console.log('Created todo atom for ID:', id);
      
      // Get the atom to initialize it in the store
      const initialTodoValue = store.get(todoAtom);
      console.log('Initial todo value:', initialTodoValue);
      
      // Set data for the new todo
      const newTodoData = {
        id,
        text: newTodoText,
        completed: false,
        createdAt: new Date()
      };
      console.log('Setting todo data:', newTodoData);
      store.set(todoAtom, newTodoData);
      
      // Verify the value was set
      const updatedTodoValue = store.get(todoAtom);
      console.log('Updated todo value:', updatedTodoValue);
      
      // Now add new ID to the list
      const currentIds = store.get(todoIdsAtom);
      console.log('Current todo IDs:', currentIds);
      const newIds = [...currentIds, id];
      console.log('New todo IDs:', newIds);
      store.set(todoIdsAtom, newIds);
      
      setNewTodoText('');
      console.log('Todo added successfully');
    }
  };

  const toggleTodo = (id) => {
    console.log('Toggling todo:', id);
    const todoAtom = todosFamily(id);
    // Initialize the atom if it's not already initialized
    store.get(todoAtom);
    const currentTodo = store.get(todoAtom);
    console.log('Current todo:', currentTodo);
    const newTodo = {
      ...currentTodo,
      completed: !currentTodo.completed
    };
    console.log('New todo:', newTodo);
    store.set(todoAtom, newTodo);
  };

  const deleteTodo = (id) => {
    console.log('Deleting todo:', id);
    // Remove ID from the list
    const currentIds = store.get(todoIdsAtom);
    console.log('Current todo IDs:', currentIds);
    const newIds = currentIds.filter(todoId => todoId !== id);
    console.log('New todo IDs:', newIds);
    store.set(todoIdsAtom, newIds);
    // Note: We don't delete the atom itself, just remove it from the list
  };

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