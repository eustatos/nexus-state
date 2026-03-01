import React from "react";
import { atom, createStore } from "@nexus-state/core";
import { persist, localStorageStorage } from "@nexus-state/persist";

// Create atoms for different parts of the application state
const userNameAtom = atom("Guest");
const userPreferencesAtom = atom({
  theme: "light",
  language: "en",
  notifications: true,
});
const todoListAtom = atom([]);
const counterAtom = atom(0);

// Create basic store first
const store = createStore();

export const App = () => {
  const [userName, setUserName] = React.useState(() => {
    try {
      return store.get(userNameAtom);
    } catch (error) {
      console.error("Failed to get userName from store:", error);
      return "Guest";
    }
  });

  const [preferences, setPreferences] = React.useState(() => {
    try {
      return store.get(userPreferencesAtom);
    } catch (error) {
      console.error("Failed to get userPreferences from store:", error);
      return {
        theme: "light",
        language: "en",
        notifications: true,
      };
    }
  });

  const [todos, setTodos] = React.useState(() => {
    try {
      return store.get(todoListAtom);
    } catch (error) {
      console.error("Failed to get todoList from store:", error);
      return [];
    }
  });

  const [counter, setCounter] = React.useState(() => {
    try {
      return store.get(counterAtom);
    } catch (error) {
      console.error("Failed to get counter from store:", error);
      return 0;
    }
  });

  const [newTodo, setNewTodo] = React.useState("");
  const [showSavedMessage, setShowSavedMessage] = React.useState(false);
  const [showClearedMessage, setShowClearedMessage] = React.useState(false);
  const [pluginsInitialized, setPluginsInitialized] = React.useState(false);

  // Initialize plugins after component mount
  React.useEffect(() => {
    try {
      // Add persistence plugins to the store
      persist(userNameAtom, {
        key: "userName",
        storage: localStorageStorage,
      })(store);

      persist(userPreferencesAtom, {
        key: "userPreferences",
        storage: localStorageStorage,
      })(store);

      persist(todoListAtom, {
        key: "todoList",
        storage: localStorageStorage,
      })(store);

      persist(counterAtom, {
        key: "counter",
        storage: localStorageStorage,
      })(store);

      // Update state with current values after plugins are initialized
      setUserName(store.get(userNameAtom));
      setPreferences(store.get(userPreferencesAtom));
      setTodos(store.get(todoListAtom));
      setCounter(store.get(counterAtom));

      setPluginsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize persistence plugins:", error);
      setPluginsInitialized(true); // Still set to true to avoid infinite loading
    }
  }, []);

  // Synchronize state with atoms
  React.useEffect(() => {
    if (!pluginsInitialized) return;

    try {
      const unsubscribeName = store.subscribe(userNameAtom, (newValue) => {
        setUserName(newValue);
      });

      const unsubscribePrefs = store.subscribe(
        userPreferencesAtom,
        (newValue) => {
          setPreferences(newValue);
        },
      );

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
    } catch (error) {
      console.error("Failed to subscribe to atoms:", error);
    }
  }, [pluginsInitialized]);

  const handleNameChange = (e) => {
    try {
      store.set(userNameAtom, e.target.value);
    } catch (error) {
      console.error("Failed to set userName:", error);
    }
  };

  const toggleTheme = () => {
    try {
      store.set(userPreferencesAtom, {
        ...preferences,
        theme: preferences.theme === "light" ? "dark" : "light",
      });
    } catch (error) {
      console.error("Failed to toggle theme:", error);
    }
  };

  const toggleNotifications = () => {
    try {
      store.set(userPreferencesAtom, {
        ...preferences,
        notifications: !preferences.notifications,
      });
    } catch (error) {
      console.error("Failed to toggle notifications:", error);
    }
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      try {
        store.set(todoListAtom, [
          ...todos,
          {
            id: Date.now(),
            text: newTodo,
            completed: false,
            createdAt: new Date(),
          },
        ]);
        setNewTodo("");
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2000);
      } catch (error) {
        console.error("Failed to add todo:", error);
      }
    }
  };

  const toggleTodo = (id) => {
    try {
      store.set(
        todoListAtom,
        todos.map((todo) =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo,
        ),
      );
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  const deleteTodo = (id) => {
    try {
      store.set(
        todoListAtom,
        todos.filter((todo) => todo.id !== id),
      );
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const incrementCounter = () => {
    try {
      store.set(counterAtom, counter + 1);
    } catch (error) {
      console.error("Failed to increment counter:", error);
    }
  };

  const decrementCounter = () => {
    try {
      store.set(counterAtom, counter - 1);
    } catch (error) {
      console.error("Failed to decrement counter:", error);
    }
  };

  const resetCounter = () => {
    try {
      store.set(counterAtom, 0);
    } catch (error) {
      console.error("Failed to reset counter:", error);
    }
  };

  const clearAllData = () => {
    try {
      localStorage.removeItem("userName");
      localStorage.removeItem("userPreferences");
      localStorage.removeItem("todoList");
      localStorage.removeItem("counter");
      setShowClearedMessage(true);
      // Reset local state to show cleared data
      store.set(userNameAtom, "Guest");
      store.set(userPreferencesAtom, {
        theme: "light",
        language: "en",
        notifications: true,
      });
      store.set(todoListAtom, []);
      store.set(counterAtom, 0);
      setTimeout(() => setShowClearedMessage(false), 3000);
    } catch (error) {
      console.error("Failed to clear data:", error);
    }
  };

  // Show loading state while initializing plugins
  if (!pluginsInitialized) {
    return (
      <div
        style={{
          padding: "20px",
          fontFamily: "sans-serif",
          maxWidth: "800px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h1>Nexus State Persist Demo</h1>
        <p>Initializing persistence plugins...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1>Nexus State Persist Demo</h1>
      <p>Demonstration of state persistence using localStorage</p>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        <div
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            borderRadius: "5px",
          }}
        >
          <h2>User Information</h2>
          <div style={{ marginBottom: "10px" }}>
            <label>Name: </label>
            <input
              type="text"
              value={userName}
              onChange={handleNameChange}
              style={{ marginLeft: "10px", padding: "5px", width: "200px" }}
            />
          </div>
          <p>Hello, {userName}!</p>
        </div>

        <div
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            borderRadius: "5px",
          }}
        >
          <h2>User Preferences</h2>
          <div style={{ marginBottom: "10px" }}>
            <button onClick={toggleTheme} style={{ marginRight: "10px" }}>
              Theme: {preferences.theme}
            </button>
            <button onClick={toggleNotifications}>
              Notifications: {preferences.notifications ? "On" : "Off"}
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          border: "1px solid #ddd",
          padding: "15px",
          borderRadius: "5px",
        }}
      >
        <h2>Todo List</h2>
        <div style={{ display: "flex", marginBottom: "10px" }}>
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Enter new task"
            style={{ flex: 1, padding: "8px", marginRight: "10px" }}
          />
          <button onClick={addTodo} style={{ padding: "8px 16px" }}>
            Add Task
          </button>
        </div>

        {todos.length === 0 ? (
          <p>No tasks in your list. Add your first task!</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {todos.map((todo) => (
              <li
                key={todo.id}
                style={{
                  padding: "10px",
                  border: "1px solid #eee",
                  marginBottom: "8px",
                  borderRadius: "4px",
                  backgroundColor: todo.completed ? "#f0f0f0" : "white",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    style={{ marginRight: "10px" }}
                  />
                  <span
                    style={{
                      textDecoration: todo.completed ? "line-through" : "none",
                    }}
                  >
                    {todo.text}
                  </span>
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#ff4444",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        style={{
          marginTop: "20px",
          border: "1px solid #ddd",
          padding: "15px",
          borderRadius: "5px",
        }}
      >
        <h2>Counter</h2>
        <p>Current Value: {counter}</p>
        <div>
          <button onClick={incrementCounter} style={{ marginRight: "10px" }}>
            Increment
          </button>
          <button onClick={decrementCounter} style={{ marginRight: "10px" }}>
            Decrement
          </button>
          <button onClick={resetCounter}>Reset</button>
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          backgroundColor: "#ffebee",
          borderRadius: "4px",
        }}
      >
        <h3>Manage Data</h3>
        <div style={{ marginBottom: "15px" }}>
          <p>
            <strong>Test Persistence:</strong> Modify any data on this form,
            then refresh the page to see that your changes are automatically
            saved and restored.
          </p>
          {showSavedMessage && (
            <p style={{ color: "green", marginTop: "10px" }}>
              Task added! Refresh the page to see persistence in action.
            </p>
          )}
        </div>
        <button
          onClick={clearAllData}
          style={{
            backgroundColor: "#ff4444",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Clear All Saved Data
        </button>
        {showClearedMessage && (
          <p style={{ color: "green", marginTop: "10px" }}>
            All data cleared from localStorage! Refresh the page to see default
            values.
          </p>
        )}
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          backgroundColor: "#e8f4fd",
          borderRadius: "4px",
        }}
      >
        <h3>How Persistence Works:</h3>
        <ul>
          <li>
            <strong>Persist Plugin</strong> - Automatically saves atom states to
            localStorage
          </li>
          <li>
            <strong>Automatic Restore</strong> - Data is automatically restored
            when the page loads
          </li>
          <li>
            <strong>Key-based Storage</strong> - Each atom is saved with its
            specified key
          </li>
          <li>
            <strong>JSON Serialization</strong> - Supports any data types that
            can be serialized to JSON
          </li>
          <li>
            <strong>Try It Out</strong> - Change any data on this form, then
            refresh the page to see persistence in action
          </li>
        </ul>
      </div>
    </div>
  );
};
