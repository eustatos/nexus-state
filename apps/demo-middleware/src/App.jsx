import React from 'react';
import { atom, createStore } from '@nexus-state/core';
import { middleware } from '@nexus-state/middleware';

// Создаем атомы
const userNameAtom = atom('');
const userAgeAtom = atom(0);
const clickCountAtom = atom(0);

// Создаем логгирующий middleware
const loggingMiddleware = middleware(userNameAtom, {
  afterSet: (atom, newValue) => {
    console.log(`[LOG] Атом userName изменен на`, newValue);
  }
});

const loggingMiddlewareAge = middleware(userAgeAtom, {
  afterSet: (atom, newValue) => {
    console.log(`[LOG] Атом userAge изменен на`, newValue);
  }
});

const loggingMiddlewareClick = middleware(clickCountAtom, {
  afterSet: (atom, newValue) => {
    console.log(`[LOG] Атом clickCount изменен на`, newValue);
  }
});

// Создаем middleware для валидации
const validationMiddleware = middleware(userAgeAtom, {
  beforeSet: (atom, newValue) => {
    if (newValue < 0 || newValue > 150) {
      console.warn(`[VALIDATION] Недопустимое значение: ${newValue}. Значение должно быть от 0 до 150.`);
      // Возвращаем текущее значение, чтобы отменить изменение
      return atom.get();
    }
    return newValue;
  }
});

// Создаем middleware для сохранения в localStorage
const localStorageMiddlewareUserName = middleware(userNameAtom, {
  afterSet: (atom, newValue) => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    userData.userName = newValue;
    localStorage.setItem('userData', JSON.stringify(userData));
    console.log(`[STORAGE] Сохранено в localStorage:`, userData);
  }
});

const localStorageMiddlewareUserAge = middleware(userAgeAtom, {
  afterSet: (atom, newValue) => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    userData.userAge = newValue;
    localStorage.setItem('userData', JSON.stringify(userData));
    console.log(`[STORAGE] Сохранено в localStorage:`, userData);
  }
});

// Создаем хранилище с middleware
const store = createStore([
  loggingMiddleware,
  loggingMiddlewareAge,
  loggingMiddlewareClick,
  validationMiddleware,
  localStorageMiddlewareUserName,
  localStorageMiddlewareUserAge
]);

export const App = () => {
  const [name, setName] = React.useState(store.get(userNameAtom));
  const [age, setAge] = React.useState(store.get(userAgeAtom));
  const clickCount = store.get(clickCountAtom);

  // Синхронизируем состояние с атомами
  React.useEffect(() => {
    const unsubscribeName = store.subscribe(userNameAtom, (newValue) => {
      setName(newValue);
    });
    
    const unsubscribeAge = store.subscribe(userAgeAtom, (newValue) => {
      setAge(newValue);
    });
    
    const unsubscribeClick = store.subscribe(clickCountAtom, (newValue) => {
      // Обновляем состояние счетчика кликов
    });
    
    return () => {
      unsubscribeName();
      unsubscribeAge();
      unsubscribeClick();
    };
  }, []);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    store.set(userNameAtom, newName);
  };

  const handleAgeChange = (e) => {
    const newAge = parseInt(e.target.value) || 0;
    store.set(userAgeAtom, newAge);
  };

  const handleIncrementClick = () => {
    const currentCount = store.get(clickCountAtom);
    store.set(clickCountAtom, currentCount + 1);
  };

  const handleDecrementClick = () => {
    const currentCount = store.get(clickCountAtom);
    store.set(clickCountAtom, currentCount - 1);
  };

  const handleResetClick = () => {
    store.set(clickCountAtom, 0);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Nexus State Middleware Demo</h1>
      <p>Демонстрация работы с middleware для атомов</p>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Управление пользователем</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>Имя: </label>
          <input 
            type="text" 
            value={name} 
            onChange={handleNameChange}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </div>
        <div>
          <label>Возраст: </label>
          <input 
            type="number" 
            value={age} 
            onChange={handleAgeChange}
            style={{ marginLeft: '10px', padding: '5px' }}
            min="0"
            max="150"
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>Счетчик кликов</h2>
        <p>Значение: {clickCount}</p>
        <button onClick={handleIncrementClick} style={{ marginRight: '10px' }}>
          Увеличить
        </button>
        <button onClick={handleDecrementClick} style={{ marginRight: '10px' }}>
          Уменьшить
        </button>
        <button onClick={handleResetClick}>
          Сбросить
        </button>
      </div>
      
      <div style={{ padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
        <h3>Middleware в действии:</h3>
        <ul>
          <li><strong>Logging Middleware</strong> - логирует все изменения атомов в консоль</li>
          <li><strong>Validation Middleware</strong> - проверяет допустимость возраста (0-150)</li>
          <li><strong>LocalStorage Middleware</strong> - сохраняет имя и возраст в localStorage</li>
        </ul>
        <p>Откройте консоль разработчика, чтобы увидеть работу middleware.</p>
        <p>Попробуйте ввести недопустимый возраст (меньше 0 или больше 150), чтобы увидеть валидацию в действии.</p>
      </div>
    </div>
  );
};