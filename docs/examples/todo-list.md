# Todo List Example

A todo list example demonstrating more advanced usage of Nexus State.

## Core Implementation

```javascript
import { atom, createStore } from '@nexus-state/core';

const todosAtom = atom([]);
const store = createStore();

// Add a todo
const addTodo = (text) => {
  store.set(todosAtom, (prev) => [
    ...prev,
    { id: Date.now(), text, completed: false }
  ]);
};

// Toggle todo completion
const toggleTodo = (id) => {
  store.set(todosAtom, (prev) =>
    prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  );
};

// Remove a todo
const removeTodo = (id) => {
  store.set(todosAtom, (prev) =>
    prev.filter(todo => todo.id !== id)
  );
};
```

## React Implementation

```jsx
import { useAtom } from '@nexus-state/react';

function TodoList() {
  const [todos, setTodos] = useAtom(todosAtom);
  
  const addTodo = (text) => {
    setTodos(prev => [
      ...prev,
      { id: Date.now(), text, completed: false }
    ]);
  };
  
  const toggleTodo = (id) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };
  
  const removeTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };
  
  return (
    <div>
      <TodoForm onAdd={addTodo} />
      <ul>
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggleTodo}
            onRemove={removeTodo}
          />
        ))}
      </ul>
    </div>
  );
}
```