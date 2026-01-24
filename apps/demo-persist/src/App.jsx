import React from 'react';
import { atom, createStore } from '@nexus-state/core';
import { persist, localStorageStorage } from '@nexus-state/persist';

// Create atoms for different parts of the application state
const userNameAtom = atom('Guest');
const userPreferencesAtom = atom({
  theme: 'light',
  language: 'en',
  notifications: true
});
const todoListAtom = atom([]);
const counterAtom = atom(0);

// Create store with persistence plugins
const store = createStore([
  persist(userNameAtom, {
    key: 'userName',
    storage: localStorageStorage
  }),
  persist(userPreferencesAtom, {
    key: 'userPreferences',
    storage: localStorageStorage
  }),
  persist(todoListAtom, {
    key: 'todoList',
    storage: localStorageStorage
  }),
  persist(counterAtom, {
    key: 'counter',
    storage: localStorageStorage
  })
]);

export const App = () => {
  const [userName, setUserName] = React.useState(store.get(userNameAtom));
  const [preferences, setPreferences] = React.useState(store.get(userPreferencesAtom));
  const [todos, setTodos] = React.useState(store.get(todoListAtom));
  const [counter, setCounter] = React.useState(store.get(counterAtom));
  const [newTodo, setNewTodo] = React.useState('');
  const [showSavedMessage, setShowSavedMessage] = React.useState(false);
  const [showClearedMessage, setShowClearedMessage] = React.useState(false);

  // Synchronize state with atoms
  React.useEffect(() => {
    const unsubscribeName = store.subscribe(userNameAtom, (newValue) => {
      setUserName(newValue);
    });
    
    const unsubscribePrefs = store.subscribe(userPreferencesAtom, (newValue) => {
      setPreferences(newValue);
    });
    
    const unsubscribeTodos = store.subscribe(todoListAtom, (newValue) => {
      setTodos(newValue);
    });
    
    const unsubscribeCounter = store.subscribe(counterAtom, (newValue) => {
      setCounter(newValue);
    });
    
    return () => {
      unsubscribeName();
      unsubscribePrefs();
      unsubscribeTodos();
      unsubscribeCounter();
    };
  }, []);

  const handleNameChange = (e) => {
    store.set(userNameAtom, e.target.value);
  };

  const toggleTheme = () => {
    store.set(userPreferencesAtom, {
      ...preferences,
      theme: preferences.theme === 'light' ? 'dark' : 'light'
    });
  };

  const toggleNotifications = () => {
    store.set(userPreferencesAtom, {
      ...preferences,
      notifications: !preferences.notifications
    });
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      store.set(todoListAtom, [
        ...todos,
        {
          id: Date.now(),
          text: newTodo,
          completed: false,
          createdAt: new Date()
        }
      ]);
      setNewTodo('');
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 2000);
    }
  };

  const toggleTodo = (id) => {
    store.set(todoListAtom, todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    store.set(todoListAtom, todos.filter(todo => todo.id !== id));
  };

  const incrementCounter = () => {
    store.set(counterAtom, counter + 1);
  };

  const decrementCounter = () => {
    store.set(counterAtom, counter - 1);
  };

  const resetCounter = () => {
    store.set(counterAtom, 0);
  };

  const clearAllData = () => {
    localStorage.removeItem('userName');
    localStorage.removeItem('userPreferences');
    localStorage.removeItem('todoList');
    localStorage.removeItem('counter');
    setShowClearedMessage(true);
    // Reset local state to show cleared data
    setUserName('Guest');
    setPreferences({
      theme: 'light',
      language: 'en',
      notifications: true
    });
    setTodos([]);
    setCounter(0);
    setTimeout(() => setShowClearedMessage(false), 3000);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Nexus State Persist Demo</h1>
      <p>Demonstration of state persistence using localStorage</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h2>User Information</h2>
          <div style={{ marginBottom: '10px' }}>
            <label>Name: </label>
            <input 
              type="text" 
              value={userName} 
              onChange={handleNameChange}
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            />
          </div>
          <p>Hello, {userName}!</p>
        </div>
        
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h2>User Preferences</h2>
          <div style={{ marginBottom: '10px' }}>
            <button onClick={toggleTheme} style={{ marginRight: '10px' }}>
              Theme: {preferences.theme}
            </button>
            <button onClick={toggleNotifications}>
              Notifications: {preferences.notifications ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
        <h2>Todo List</h2>
        <div style={{ display: 'flex', marginBottom: '10px' }}>
          <input 
            type="text" 
            value={newTodo} 
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Enter new task"
            style={{ flex: 1, padding: '8px', marginRight: '10px' }}
          />
          <button onClick={addTodo} style={{ padding: '8px 16px' }}>
            Add Task
          </button>
        </div>
        
        {todos.length === 0 ? (
          <p>No tasks in your list. Add your first task!</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {todos.map(todo => (
              <li 
                key={todo.id} 
                style={{ 
                  padding: '10px', 
                  border: '1px solid #eee', 
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
      
      <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
        <h2>Counter</h2>
        <p>Current Value: {counter}</p>
        <div>
          <button onClick={incrementCounter} style={{ marginRight: '10px' }}>
            Increment
          </button>
          <button onClick={decrementCounter} style={{ marginRight: '10px' }}>
            Decrement
          </button>
          <button onClick={resetCounter}>
            Reset
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
        <h3>Manage Data</h3>
        <div style={{ marginBottom: '15px' }}>
          <p><strong>Test Persistence:</strong> Modify any data on this form, then refresh the page to see that your changes are automatically saved and restored.</p>
          {showSavedMessage && (
            <p style={{ color: 'green', marginTop: '10px' }}>
              Task added! Refresh the page to see persistence in action.
            </p>
          )}
        </div>
        <button onClick={clearAllData} style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', cursor: 'pointer' }}>
          Clear All Saved Data
        </button>
        {showClearedMessage && (
          <p style={{ color: 'green', marginTop: '10px' }}>
            All data cleared from localStorage! Refresh the page to see default values.
          </p>
        )}
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
        <h3>How Persistence Works:</h3>
        <ul>
          <li><strong>Persist Plugin</strong> - Automatically saves atom states to localStorage</li>
          <li><strong>Automatic Restore</strong> - Data is automatically restored when the page loads</li>
          <li><strong>Key-based Storage</strong> - Each atom is saved with its specified key</li>
          <li><strong>JSON Serialization</strong> - Supports any data types that can be serialized to JSON</li>
          <li><strong>Try It Out</strong> - Change any data on this form, then refresh the page to see persistence in action</li>
        </ul>
      </div>
    </div>
  );
};