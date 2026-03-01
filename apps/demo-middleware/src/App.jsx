import React, { useState, useEffect } from 'react';
import { atom, createStore } from '@nexus-state/core';
import { createMiddlewarePlugin } from '@nexus-state/middleware';

// ============================================================================
// Atoms
// ============================================================================

const userNameAtom = atom('', 'userName');
const userAgeAtom = atom(0, 'userAge');
const clickCountAtom = atom(0, 'clickCount');
const validationCountAtom = atom(0, 'validationCount');

// ============================================================================
// Store with Middleware (New API v1.0)
// ============================================================================

const store = createStore();

// Logging middleware - shows new API
const loggingPluginName = createMiddlewarePlugin(userNameAtom, {
  beforeSet: (atom, value) => {
    console.log(`[BEFORE SET] userName: → ${value}`);
    return value;
  },
  afterSet: (atom, value) => {
    console.log(`[AFTER SET] userName: ${value}`);
  }
});

const loggingPluginAge = createMiddlewarePlugin(userAgeAtom, {
  beforeSet: (atom, value) => {
    console.log(`[BEFORE SET] userAge: → ${value}`);
    return value;
  },
  afterSet: (atom, value) => {
    console.log(`[AFTER SET] userAge: ${value}`);
  }
});

const loggingPluginClick = createMiddlewarePlugin(clickCountAtom, {
  afterSet: (atom, value) => {
    console.log(`[AFTER SET] clickCount: ${value}`);
  }
});

// Validation middleware - demonstrates value transformation
const validationPlugin = createMiddlewarePlugin(userAgeAtom, {
  beforeSet: (atom, value) => {
    if (value < 0) {
      console.warn(`[VALIDATION] Age cannot be negative: ${value}, setting to 0`);
      return 0;
    }
    if (value > 150) {
      console.warn(`[VALIDATION] Age cannot exceed 150: ${value}, setting to 150`);
      return 150;
    }
    return value;
  }
});

// Counter for validation triggers
const validationCounterPlugin = createMiddlewarePlugin(userAgeAtom, {
  beforeSet: () => {
    store.set(validationCountAtom, (prev) => prev + 1);
  }
});

// localStorage middleware - demonstrates side effects
const localStoragePluginName = createMiddlewarePlugin(userNameAtom, {
  afterSet: (atom, value) => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    userData.userName = value;
    localStorage.setItem('userData', JSON.stringify(userData));
    console.log(`[STORAGE] Saved userName: ${value}`);
  }
});

const localStoragePluginAge = createMiddlewarePlugin(userAgeAtom, {
  afterSet: (atom, value) => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    userData.userAge = value;
    localStorage.setItem('userData', JSON.stringify(userData));
    console.log(`[STORAGE] Saved userAge: ${value}`);
  }
});

// Apply all plugins
store.applyPlugin(loggingPluginName);
store.applyPlugin(loggingPluginAge);
store.applyPlugin(loggingPluginClick);
store.applyPlugin(validationPlugin);
store.applyPlugin(validationCounterPlugin);
store.applyPlugin(localStoragePluginName);
store.applyPlugin(localStoragePluginAge);

// Load from localStorage on init
const savedData = JSON.parse(localStorage.getItem('userData') || '{}');
if (savedData.userName) store.set(userNameAtom, savedData.userName);
if (savedData.userAge) store.set(userAgeAtom, savedData.userAge);

// ============================================================================
// Example 1: Basic Middleware (Logger)
// ============================================================================

const BasicLoggerExample = () => {
  const [name, setName] = useState(store.get(userNameAtom));

  useEffect(() => {
    const unsubscribe = store.subscribe(userNameAtom, setName);
    return unsubscribe;
  }, []);

  const handleChange = (e) => {
    store.set(userNameAtom, e.target.value);
  };

  return (
    <div style={styles.exampleBox}>
      <h3 style={styles.exampleTitle}>📝 Example 1: Basic Logger Middleware</h3>
      <p style={styles.description}>
        Logging middleware tracks all changes. Open console to see logs.
      </p>
      <div style={styles.inputGroup}>
        <label>Name: </label>
        <input
          type="text"
          value={name}
          onChange={handleChange}
          style={styles.input}
          placeholder="Enter your name"
        />
      </div>
      <div style={styles.valueDisplay}>
        Current value: <strong>{name || '(empty)'}</strong>
      </div>
    </div>
  );
};

// ============================================================================
// Example 2: Validation Middleware
// ============================================================================

const ValidationExample = () => {
  const [age, setAge] = useState(store.get(userAgeAtom));
  const [validationCount, setValidationCount] = useState(store.get(validationCountAtom));

  useEffect(() => {
    const unsubscribeAge = store.subscribe(userAgeAtom, setAge);
    const unsubscribeCount = store.subscribe(validationCountAtom, setValidationCount);
    return () => {
      unsubscribeAge();
      unsubscribeCount();
    };
  }, []);

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value) || 0;
    store.set(userAgeAtom, newValue);
  };

  return (
    <div style={styles.exampleBox}>
      <h3 style={styles.exampleTitle}>🛡️ Example 2: Validation Middleware</h3>
      <p style={styles.description}>
        Validates age is between 0 and 150. Invalid values are auto-corrected.
      </p>
      <div style={styles.inputGroup}>
        <label>Age: </label>
        <input
          type="number"
          value={age}
          onChange={handleChange}
          style={styles.input}
          min="0"
          max="150"
        />
      </div>
      <div style={styles.valueDisplay}>
        Current value: <strong style={age < 0 || age > 150 ? styles.error : styles.success}>{age}</strong>
      </div>
      <div style={styles.infoBox}>
        Validation triggered: <strong>{validationCount}</strong> times
      </div>
      <p style={styles.hint}>Try entering: -5, 200, or 999</p>
    </div>
  );
};

// ============================================================================
// Example 3: Middleware Chain
// ============================================================================

const MiddlewareChainExample = () => {
  const [count, setCount] = useState(store.get(clickCountAtom));

  useEffect(() => {
    const unsubscribe = store.subscribe(clickCountAtom, setCount);
    return unsubscribe;
  }, []);

  const increment = () => {
    store.set(clickCountAtom, (prev) => prev + 1);
  };

  const decrement = () => {
    store.set(clickCountAtom, (prev) => prev - 1);
  };

  const reset = () => {
    store.set(clickCountAtom, 0);
  };

  return (
    <div style={styles.exampleBox}>
      <h3 style={styles.exampleTitle}>⛓️ Example 3: Middleware Chain</h3>
      <p style={styles.description}>
        Multiple middleware on same atom execute in order.
      </p>
      <div style={styles.counterDisplay}>
        Count: <strong style={styles.counterValue}>{count}</strong>
      </div>
      <div style={styles.buttonGroup}>
        <button onClick={increment} style={styles.button}>+1</button>
        <button onClick={decrement} style={styles.button}>-1</button>
        <button onClick={reset} style={{...styles.button, ...styles.resetButton}}>Reset</button>
      </div>
      <div style={styles.infoBox}>
        <p>Applied middleware:</p>
        <ul style={styles.middlewareList}>
          <li>1️⃣ Logging (afterSet)</li>
          <li>2️⃣ Validation Counter (beforeSet)</li>
        </ul>
      </div>
    </div>
  );
};

// ============================================================================
// Example 4: Plugin Disposal (New Feature!)
// ============================================================================

const PluginDisposalExample = () => {
  const [tempValue, setTempValue] = useState(0);
  const [isPluginActive, setIsPluginActive] = useState(true);
  const [disposeCount, setDisposeCount] = useState(0);

  const tempAtom = atom(0, 'tempValue');

  useEffect(() => {
    // Create disposable plugin
    const disposablePlugin = createMiddlewarePlugin(tempAtom, {
      beforeSet: (atom, value) => {
        console.log(`[DISPOSABLE PLUGIN] Value: ${value}`);
        return value * 2; // Double the value
      }
    });

    store.applyPlugin(disposablePlugin);

    // Store dispose function for later use
    window.disposeTempPlugin = () => {
      disposablePlugin.dispose?.();
      setIsPluginActive(false);
      setDisposeCount((prev) => prev + 1);
      console.log('[DISPOSE] Plugin disposed!');
    };

    const unsubscribe = store.subscribe(tempAtom, setTempValue);
    return unsubscribe;
  }, []);

  const handleIncrement = () => {
    store.set(tempAtom, (prev) => prev + 1);
  };

  const handleDispose = () => {
    if (window.disposeTempPlugin) {
      window.disposeTempPlugin();
    }
  };

  return (
    <div style={styles.exampleBox}>
      <h3 style={styles.exampleTitle}>🗑️ Example 4: Plugin Disposal (NEW!)</h3>
      <p style={styles.description}>
        Plugins can be disposed when no longer needed.
      </p>
      <div style={styles.valueDisplay}>
        Value: <strong>{tempValue}</strong>
        {isPluginActive && <span style={styles.activeBadge}> (×2 active)</span>}
      </div>
      <div style={styles.buttonGroup}>
        <button onClick={handleIncrement} style={styles.button}>+1</button>
        <button 
          onClick={handleDispose} 
          disabled={!isPluginActive}
          style={{...styles.button, ...(isPluginActive ? styles.disposeButton : styles.disabledButton)}}
        >
          Dispose Plugin
        </button>
      </div>
      <div style={styles.infoBox}>
        Plugin disposed: <strong>{disposeCount}</strong> times
      </div>
      <p style={styles.hint}>Click "Dispose Plugin" to disable value doubling</p>
    </div>
  );
};

// ============================================================================
// Main App Component
// ============================================================================

export const App = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🔌 Nexus State Middleware Demo</h1>
        <p style={styles.subtitle}>
          Demonstrating the new plugin-based API (v1.0)
        </p>
      </header>

      <div style={styles.featuresBox}>
        <h3>✨ New Features in v1.0:</h3>
        <ul style={styles.featuresList}>
          <li>✅ Plugin hooks architecture (<code>createMiddlewarePlugin</code>)</li>
          <li>✅ Plugin disposal support</li>
          <li>✅ Predictable execution order</li>
          <li>✅ Better TypeScript integration</li>
        </ul>
      </div>

      <main style={styles.main}>
        <BasicLoggerExample />
        <ValidationExample />
        <MiddlewareChainExample />
        <PluginDisposalExample />
      </main>

      <footer style={styles.footer}>
        <p>
          Open browser console to see middleware logs in action.
        </p>
        <p style={styles.version}>
          @nexus-state/middleware v1.0.0
        </p>
      </footer>
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '10px',
  },
  title: {
    margin: '0 0 10px 0',
    color: '#333',
  },
  subtitle: {
    margin: 0,
    color: '#666',
    fontSize: '16px',
  },
  featuresBox: {
    backgroundColor: '#e8f4fd',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px',
  },
  featuresList: {
    margin: '10px 0',
    paddingLeft: '20px',
  },
  main: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  exampleBox: {
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  exampleTitle: {
    margin: '0 0 15px 0',
    fontSize: '18px',
    color: '#333',
  },
  description: {
    color: '#666',
    marginBottom: '15px',
    fontSize: '14px',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  input: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '200px',
  },
  valueDisplay: {
    fontSize: '14px',
    color: '#666',
  },
  counterDisplay: {
    fontSize: '24px',
    textAlign: 'center',
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  counterValue: {
    color: '#667eea',
    fontSize: '32px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '15px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  resetButton: {
    backgroundColor: '#dc3545',
  },
  disposeButton: {
    backgroundColor: '#dc3545',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  infoBox: {
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#666',
  },
  middlewareList: {
    margin: '10px 0',
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#666',
  },
  hint: {
    fontSize: '13px',
    color: '#999',
    fontStyle: 'italic',
    marginTop: '10px',
  },
  activeBadge: {
    backgroundColor: '#28a745',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    marginLeft: '8px',
  },
  success: {
    color: '#28a745',
  },
  error: {
    color: '#dc3545',
  },
  footer: {
    textAlign: 'center',
    marginTop: '40px',
    padding: '20px',
    color: '#666',
    borderTop: '1px solid #e0e0e0',
  },
  version: {
    fontSize: '12px',
    color: '#999',
    marginTop: '10px',
  },
};
