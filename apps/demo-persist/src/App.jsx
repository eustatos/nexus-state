import React from 'react';
import { atom, createStore } from '@nexus-state/core';
import { persistAtom } from '@nexus-state/persist';

// Создаем хранилище
const store = createStore();

// Создаем атомы с персистентностью
const userNameAtom = persistAtom('userName', 'Гость');
const userPreferencesAtom = persistAtom('userPreferences', {
  theme: 'light',
  language: 'ru',
  notifications: true
});
const todoListAtom = persistAtom('todoList', []);
const counterAtom = persistAtom('counter', 0);

export const App = () => {
  const [userName, setUserName] = React.useState(store.get(userNameAtom));
  const [preferences, setPreferences] = React.useState(store.get(userPreferencesAtom));
  const [todos, setTodos] = React.useState(store.get(todoListAtom));
  const [counter, setCounter] = React.useState(store.get(counterAtom));
  const [newTodo, setNewTodo] = React.useState('');

  // Синхронизируем состояние с атомами
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
    localStorage.removeItem('persist:userName');
    localStorage.removeItem('persist:userPreferences');
    localStorage.removeItem('persist:todoList');
    localStorage.removeItem('persist:counter');
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Nexus State Persist Demo</h1>
      <p>Демонстрация персистентности состояния с помощью localStorage</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h2>Пользователь</h2>
          <div style={{ marginBottom: '10px' }}>
            <label>Имя: </label>
            <input 
              type="text" 
              value={userName} 
              onChange={handleNameChange}
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            />
          </div>
          <p>Привет, {userName}!</p>
        </div>
        
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h2>Настройки</h2>
          <div style={{ marginBottom: '10px' }}>
            <button onClick={toggleTheme} style={{ marginRight: '10px' }}>
              Тема: {preferences.theme}
            </button>
            <button onClick={toggleNotifications}>
              Уведомления: {preferences.notifications ? 'Вкл' : 'Выкл'}
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
        <h2>Список задач</h2>
        <div style={{ display: 'flex', marginBottom: '10px' }}>
          <input 
            type="text" 
            value={newTodo} 
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Новая задача"
            style={{ flex: 1, padding: '8px', marginRight: '10px' }}
          />
          <button onClick={addTodo} style={{ padding: '8px 16px' }}>
            Добавить
          </button>
        </div>
        
        {todos.length === 0 ? (
          <p>Нет задач. Добавьте первую задачу!</p>
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
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
        <h2>Счетчик</h2>
        <p>Значение: {counter}</p>
        <div>
          <button onClick={incrementCounter} style={{ marginRight: '10px' }}>
            Увеличить
          </button>
          <button onClick={decrementCounter} style={{ marginRight: '10px' }}>
            Уменьшить
          </button>
          <button onClick={resetCounter}>
            Сбросить
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
        <h3>Очистка данных</h3>
        <button onClick={clearAllData} style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', cursor: 'pointer' }}>
          Очистить все сохраненные данные
        </button>
        <p>После очистки обновите страницу, чтобы увидеть эффект.</p>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
        <h3>Как это работает:</h3>
        <ul>
          <li><strong>persistAtom</strong> автоматически сохраняет состояние в localStorage</li>
          <li>При перезагрузке страницы данные автоматически восстанавливаются</li>
          <li>Каждый атом сохраняется с префиксом "persist:"</li>
          <li>Поддерживаются любые типы данных, которые могут быть сериализованы в JSON</li>
        </ul>
      </div>
    </div>
  );
};