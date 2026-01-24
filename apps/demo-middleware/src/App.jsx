import React from 'react';
import { atom, createStore } from '@nexus-state/core';
import { middleware } from '@nexus-state/middleware';

// Create atoms
const userNameAtom = atom('');
const userAgeAtom = atom(0);
const clickCountAtom = atom(0);

// Create logging middleware
const loggingMiddleware = middleware(userNameAtom, {
  afterSet: (atom, newValue) => {
    console.log(`[LOG] Atom userName changed to`, newValue);
  }
});

const loggingMiddlewareAge = middleware(userAgeAtom, {
  afterSet: (atom, newValue) => {
    console.log(`[LOG] Atom userAge changed to`, newValue);
  }
});

const loggingMiddlewareClick = middleware(clickCountAtom, {
  afterSet: (atom, newValue) => {
    console.log(`[LOG] Atom clickCount changed to`, newValue);
  }
});

// Create validation middleware
const validationMiddleware = middleware(userAgeAtom, {
  beforeSet: (atom, newValue) => {
    if (newValue < 0 || newValue > 150) {
      console.warn(`[VALIDATION] Invalid value: ${newValue}. Value must be between 0 and 150.`);
      // Return current value to cancel the change
      return atom.get();
    }
    return newValue;
  }
});

// Create localStorage middleware
const localStorageMiddlewareUserName = middleware(userNameAtom, {
  afterSet: (atom, newValue) => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    userData.userName = newValue;
    localStorage.setItem('userData', JSON.stringify(userData));
    console.log(`[STORAGE] Saved to localStorage:`, userData);
  }
});

const localStorageMiddlewareUserAge = middleware(userAgeAtom, {
  afterSet: (atom, newValue) => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    userData.userAge = newValue;
    localStorage.setItem('userData', JSON.stringify(userData));
    console.log(`[STORAGE] Saved to localStorage:`, userData);
  }
});

// Create store with middleware
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

  // Synchronize state with atoms
  React.useEffect(() => {
    const unsubscribeName = store.subscribe(userNameAtom, (newValue) => {
      setName(newValue);
    });
    
    const unsubscribeAge = store.subscribe(userAgeAtom, (newValue) => {
      setAge(newValue);
    });
    
    const unsubscribeClick = store.subscribe(clickCountAtom, (newValue) => {
      // Update click counter state
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
      <p>Demonstration of working with middleware for atoms</p>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h2>User Management</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>Name: </label>
          <input 
            type="text" 
            value={name} 
            onChange={handleNameChange}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </div>
        <div>
          <label>Age: </label>
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
        <h2>Click Counter</h2>
        <p>Value: {clickCount}</p>
        <button onClick={handleIncrementClick} style={{ marginRight: '10px' }}>
          Increment
        </button>
        <button onClick={handleDecrementClick} style={{ marginRight: '10px' }}>
          Decrement
        </button>
        <button onClick={handleResetClick}>
          Reset
        </button>
      </div>
      
      <div style={{ padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
        <h3>Middleware in action:</h3>
        <ul>
          <li><strong>Logging Middleware</strong> - logs all atom changes to the console</li>
          <li><strong>Validation Middleware</strong> - validates age (0-150)</li>
          <li><strong>LocalStorage Middleware</strong> - saves name and age to localStorage</li>
        </ul>
        <p>Open the developer console to see the middleware in action.</p>
        <p>Try entering an invalid age (less than 0 or greater than 150) to see validation in action.</p>
      </div>
    </div>
  );
};