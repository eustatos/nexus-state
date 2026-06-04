# Time-Travel Debugging в State Management: Часть 3 — Практическая реализация

> **Серия:** Time-Travel в State Management (Часть 3 из 3)
>
> Пошаговая реализация, интеграции и production-примеры

---

## Введение

В [Части 1](part-1-foundations.md) мы рассмотрели архитектурные паттерны (Command, Snapshot, Delta, Hybrid). В [Части 2](part-2-advanced-final.md) углубились в оптимизацию, сериализацию и производительность.

**В этой части:** реализуем time-travel с нуля, интегрируем с популярными библиотеками и создадим работающие примеры для форм и редакторов.

### Что будем делать:

- ✅ **Реализуем с нуля** — базовый time-travel для любого state management
- ✅ **Интегрируем с React** — хуки для undo/redo
- ✅ **Добавим персистентность** — localStorage + IndexedDB
- ✅ **Создадим примеры** — форма с отменой, текстовый редактор
- ✅ **Настроим DevTools** — визуализация истории

### Требования:

- Базовые знания JavaScript/TypeScript
- Опыт с React (для примеров)
- Node.js 17+ (для `structuredClone`)

---

## Шаг 1: Базовая реализация с нуля

Начнём с простой, но рабочей реализации time-travel.

### 1.1. Создаём хранилище истории

```typescript
// timeTravel.ts

interface Snapshot<T> {
  id: string;
  state: T;
  timestamp: number;
  action?: string;
}

interface TimeTravelOptions {
  maxHistory?: number;      // Максимальная глубина истории
  autoCapture?: boolean;    // Автоматическое создание снимков
}

export class TimeTravel<T> {
  private history: Snapshot<T>[] = [];
  private currentIndex = -1;
  private options: Required<TimeTravelOptions>;

  constructor(options: TimeTravelOptions = {}) {
    this.options = {
      maxHistory: options.maxHistory ?? 50,
      autoCapture: options.autoCapture ?? false,
    };
  }

  /**
   * Создать снимок состояния
   */
  capture(state: T, action?: string): Snapshot<T> {
    // Используем structuredClone для глубокого копирования
    const snapshot: Snapshot<T> = {
      id: crypto.randomUUID(),
      state: structuredClone(state),
      timestamp: Date.now(),
      action,
    };

    // Удаляем "будущее" при новом изменении
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Добавляем снимок
    this.history.push(snapshot);
    this.currentIndex++;

    // Ограничиваем размер истории
    if (this.history.length > this.options.maxHistory) {
      this.history.shift();
      this.currentIndex--;
    }

    return snapshot;
  }

  /**
   * Отменить последнее действие
   */
  undo(): T | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return structuredClone(this.history[this.currentIndex].state);
    }
    return null;
  }

  /**
   * Повторить отменённое действие
   */
  redo(): T | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return structuredClone(this.history[this.currentIndex].state);
    }
    return null;
  }

  /**
   * Перейти к конкретному снимку
   */
  jumpTo(index: number): T | null {
    if (index >= 0 && index < this.history.length) {
      this.currentIndex = index;
      return structuredClone(this.history[index].state);
    }
    return null;
  }

  /**
   * Получить текущий снимок
   */
  getCurrent(): Snapshot<T> | undefined {
    return this.history[this.currentIndex];
  }

  /**
   * Получить всю историю
   */
  getHistory(): Snapshot<T>[] {
    return [...this.history];
  }

  /**
   * Проверить возможность отмены
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Проверить возможность повтора
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Очистить историю
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * Получить статистику
   */
  getStats() {
    return {
      length: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      oldest: this.history[0]?.timestamp,
      newest: this.history[this.history.length - 1]?.timestamp,
    };
  }
}
```

### 1.2. Используем базовую реализацию

```typescript
// Пример использования
const timeTravel = new TimeTravel({ maxHistory: 50 });

// Начальное состояние
const initialState = { count: 0, name: 'Test' };
timeTravel.capture(initialState, 'INIT');

// Изменения
timeTravel.capture({ count: 1, name: 'Test' }, 'INCREMENT');
timeTravel.capture({ count: 2, name: 'Test' }, 'INCREMENT');

// Отмена
const previous = timeTravel.undo();
console.log(previous); // { count: 1, name: 'Test' }

// Повтор
const next = timeTravel.redo();
console.log(next); // { count: 2, name: 'Test' }

// Статистика
console.log(timeTravel.getStats());
// { length: 3, currentIndex: 2, canUndo: true, canRedo: false }
```

---

## Шаг 2: Интеграция с React

Создадим хуки для удобной работы с time-travel в React.

### 2.1. Хук useTimeTravel

```typescript
// hooks/useTimeTravel.ts

import { useState, useCallback, useRef } from 'react';
import { TimeTravel } from '../timeTravel';

export function useTimeTravel<T>(initialState: T, options?: { maxHistory?: number }) {
  const [state, setState] = useState<T>(initialState);
  const timeTravelRef = useRef(new TimeTravel<T>(options));
  const [, forceUpdate] = useState(0);

  // Инициализация
  if (timeTravelRef.current.getHistory().length === 0) {
    timeTravelRef.current.capture(initialState, 'INIT');
  }

  // Установить состояние
  const set = useCallback((newState: T | ((prev: T) => T), action?: string) => {
    setState(prev => {
      const actual = typeof newState === 'function' 
        ? (newState as (p: T) => T)(prev) 
        : newState;
      
      timeTravelRef.current.capture(actual, action);
      forceUpdate(n => n + 1);
      return actual;
    });
  }, []);

  // Отмена
  const undo = useCallback(() => {
    const previous = timeTravelRef.current.undo();
    if (previous) {
      setState(previous);
      forceUpdate(n => n + 1);
      return true;
    }
    return false;
  }, []);

  // Повтор
  const redo = useCallback(() => {
    const next = timeTravelRef.current.redo();
    if (next) {
      setState(next);
      forceUpdate(n => n + 1);
      return true;
    }
    return false;
  }, []);

  // Переход к снимку
  const jumpTo = useCallback((index: number) => {
    const snapshot = timeTravelRef.current.jumpTo(index);
    if (snapshot) {
      setState(snapshot);
      forceUpdate(n => n + 1);
      return true;
    }
    return false;
  }, []);

  // Горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state,
    set,
    undo,
    redo,
    jumpTo,
    canUndo: timeTravelRef.current.canUndo(),
    canRedo: timeTravelRef.current.canRedo(),
    history: timeTravelRef.current.getHistory(),
    stats: timeTravelRef.current.getStats(),
  };
}
```

### 2.2. Пример использования в компоненте

```typescript
// components/Counter.tsx

import React from 'react';
import { useTimeTravel } from '../hooks/useTimeTravel';

interface CounterState {
  count: number;
  label: string;
}

export function Counter() {
  const { state, set, undo, redo, canUndo, canRedo, history } = useTimeTravel<CounterState>(
    { count: 0, label: 'Counter' },
    { maxHistory: 50 }
  );

  return (
    <div className="counter">
      <h2>{state.label}: {state.count}</h2>
      
      <div className="buttons">
        <button onClick={() => set(s => ({ ...s, count: s.count - 1 }), 'DECREMENT')}>
          -
        </button>
        <button onClick={() => set(s => ({ ...s, count: s.count + 1 }), 'INCREMENT')}>
          +
        </button>
      </div>

      <div className="time-travel">
        <button onClick={undo} disabled={!canUndo}>
          ↶ Undo
        </button>
        <button onClick={redo} disabled={!canRedo}>
          ↷ Redo
        </button>
      </div>

      <div className="history">
        <h3>История ({history.length} снимков)</h3>
        {history.map((snapshot, index) => (
          <button
            key={snapshot.id}
            onClick={() => set(history[index].state, `JUMP_TO_${index}`)}
          >
            {snapshot.action || 'CHANGE'} — {new Date(snapshot.timestamp).toLocaleTimeString()}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## Шаг 3: Интеграция с Zustand

Добавим time-travel в Zustand store через middleware.

### 3.1. Создаём middleware

```typescript
// middleware/withTimeTravel.ts

import { StoreApi, useStore } from 'zustand';
import { TimeTravel } from '../timeTravel';

export function withTimeTravel<T extends object>(
  store: StoreApi<T>,
  options?: { maxHistory?: number }
) {
  const timeTravel = new TimeTravel<T>(options);
  
  // Сохраняем оригинальный setState
  const originalSetState = store.setState;

  // Оборачиваем setState
  store.setState = (partial, replace, action) => {
    const currentState = store.getState();
    
    // Вычисляем новое состояние
    const nextState = typeof partial === 'function'
      ? (partial as (s: T) => T)(currentState)
      : partial;

    // Применяем изменения
    originalSetState(nextState as Partial<T>, replace as any);

    // Создаём снимок (только если не replace)
    if (!replace) {
      timeTravel.capture(store.getState(), action as string);
    }
  };

  // Добавляем методы time-travel
  (store as any).undo = () => {
    const previous = timeTravel.undo();
    if (previous) {
      originalSetState(previous, true);
      return true;
    }
    return false;
  };

  (store as any).redo = () => {
    const next = timeTravel.redo();
    if (next) {
      originalSetState(next, true);
      return true;
    }
    return false;
  };

  (store as any).getHistory = () => timeTravel.getHistory();
  (store as any).canUndo = () => timeTravel.canUndo();
  (store as any).canRedo = () => timeTravel.canRedo();

  return store;
}
```

### 3.2. Используем в store

```typescript
// stores/counterStore.ts

import { createStore } from 'zustand';
import { withTimeTravel } from '../middleware/withTimeTravel';

interface CounterState {
  count: number;
  step: number;
}

interface CounterActions {
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

type CounterStore = CounterState & CounterActions;

// Создаём store
const rawStore = createStore<CounterStore>((set, get) => ({
  count: 0,
  step: 1,
  increment: () => set(state => ({ count: state.count + state.step }), false, 'INCREMENT'),
  decrement: () => set(state => ({ count: state.count - state.step }), false, 'DECREMENT'),
  reset: () => set({ count: 0 }, false, 'RESET'),
}));

// Добавляем time-travel
export const counterStore = withTimeTravel(rawStore, { maxHistory: 50 });

// Хук для использования в компонентах
export function useCounterStore() {
  return useStore(counterStore);
}
```

### 3.3. Компонент с undo/redo

```typescript
// components/CounterWithUndo.tsx

import React from 'react';
import { useCounterStore } from '../stores/counterStore';

export function CounterWithUndo() {
  const { count, step, increment, decrement, reset, undo, redo, canUndo, canRedo } = useCounterStore();

  return (
    <div>
      <h1>Count: {count}</h1>
      <p>Step: {step}</p>

      <div>
        <button onClick={decrement}>-</button>
        <button onClick={increment}>+</button>
        <button onClick={reset}>Reset</button>
      </div>

      <div>
        <button onClick={undo} disabled={!canUndo}>Undo</button>
        <button onClick={redo} disabled={!canRedo}>Redo</button>
      </div>
    </div>
  );
}
```

---

## Шаг 4: Интеграция с Redux

Добавим time-travel через Redux middleware.

### 4.1. Создаём middleware

```typescript
// middleware/reduxTimeTravel.ts

import { Middleware } from '@reduxjs/toolkit';
import { TimeTravel } from '../timeTravel';

export function createTimeTravelMiddleware(maxHistory = 50) {
  const timeTravel = new TimeTravel<any>( { maxHistory });

  const middleware: Middleware = (store) => (next) => (action) => {
    // Пропускаем служебные действия time-travel
    if (action.type === '@@TIME_TRAVEL/RESTORE') {
      return next(action);
    }

    // Выполняем действие
    const result = next(action);
    
    // Создаём снимок состояния
    const state = store.getState();
    timeTravel.capture(state, action.type);

    return result;
  };

  // Добавляем enhancer для доступа к time-travel
  (middleware as any).undo = () => {
    const previous = timeTravel.undo();
    if (previous) {
      store.dispatch({ type: '@@TIME_TRAVEL/RESTORE', payload: previous });
      return true;
    }
    return false;
  };

  (middleware as any).redo = () => {
    const next = timeTravel.redo();
    if (next) {
      store.dispatch({ type: '@@TIME_TRAVEL/RESTORE', payload: next });
      return true;
    }
    return false;
  };

  (middleware as any).getHistory = () => timeTravel.getHistory();

  return middleware;
}
```

### 4.2. Настраиваем store

```typescript
// store/index.ts

import { configureStore } from '@reduxjs/toolkit';
import { createTimeTravelMiddleware } from '../middleware/reduxTimeTravel';
import counterReducer from './counterSlice';

// Создаём middleware
const timeTravelMiddleware = createTimeTravelMiddleware(50);

// Настраиваем store
export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(timeTravelMiddleware),
});

// Экспортируем типы
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Хуки для использования
import { useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector<RootState>;
```

---

## Шаг 5: Персистентность (localStorage + IndexedDB)

Сохраняем историю между перезагрузками страницы.

### 5.1. localStorage adapter

```typescript
// adapters/localStorageAdapter.ts

interface StorageAdapter<T> {
  save(key: string, data: T): Promise<void>;
  load(key: string): Promise<T | null>;
  remove(key: string): Promise<void>;
}

export class LocalStorageAdapter<T> implements StorageAdapter<T> {
  private maxSize: number;

  constructor(maxSize: number = 5 * 1024 * 1024) { // 5MB
    this.maxSize = maxSize;
  }

  async save(key: string, data: T): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      const size = new Blob([serialized]).size;

      if (size > this.maxSize) {
        console.warn(`Data size (${size} bytes) exceeds limit (${this.maxSize} bytes)`);
        return;
      }

      localStorage.setItem(key, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded');
        // Очищаем старые записи
        this.clearOldest();
      } else {
        throw error;
      }
    }
  }

  async load(key: string): Promise<T | null> {
    try {
      const serialized = localStorage.getItem(key);
      if (!serialized) return null;
      return JSON.parse(serialized) as T;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  private clearOldest(): void {
    // Простая эвристика: удаляем половину истории
    const keys = Object.keys(localStorage).filter(k => k.startsWith('time-travel-'));
    const toRemove = Math.floor(keys.length / 2);
    keys.slice(0, toRemove).forEach(key => localStorage.removeItem(key));
  }
}
```

### 5.2. IndexedDB adapter (для больших данных)

```typescript
// adapters/indexedDBAdapter.ts

export class IndexedDBAdapter<T> implements StorageAdapter<T> {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;

  constructor(dbName: string = 'TimeTravelDB', storeName: string = 'snapshots') {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async save(key: string, data: T): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ id: key, data, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async load(key: string): Promise<T | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.data || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async remove(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
```

### 5.3. Интеграция с TimeTravel

```typescript
// timeTravelWithPersistence.ts

import { TimeTravel, Snapshot } from './timeTravel';
import { StorageAdapter } from './adapters/localStorageAdapter';

export class TimeTravelWithPersistence<T> extends TimeTravel<T> {
  private adapter: StorageAdapter<Snapshot<T>[]>;
  private storageKey: string;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    adapter: StorageAdapter<Snapshot<T>[]>,
    storageKey: string = 'time-travel-history',
    options?: { maxHistory?: number }
  ) {
    super(options);
    this.adapter = adapter;
    this.storageKey = storageKey;
    this.loadFromStorage();
  }

  override capture(state: T, action?: string): Snapshot<T> {
    const snapshot = super.capture(state, action);
    this.debounceSave();
    return snapshot;
  }

  override undo(): T | null {
    const result = super.undo();
    if (result) this.debounceSave();
    return result;
  }

  override redo(): T | null {
    const result = super.redo();
    if (result) this.debounceSave();
    return result;
  }

  private debounceSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveToStorage();
      this.saveTimeout = null;
    }, 1000); // Сохраняем через 1 секунду после последнего изменения
  }

  private async saveToStorage(): Promise<void> {
    try {
      await this.adapter.save(this.storageKey, this.getHistory());
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const history = await this.adapter.load(this.storageKey);
      if (history && history.length > 0) {
        // Восстанавливаем историю
        (this as any).history = history;
        (this as any).currentIndex = history.length - 1;
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  }
}
```

---

## Шаг 6: Production-примеры

### 6.1. Форма с undo/redo

```typescript
// examples/FormWithUndo.tsx

import React, { useState } from 'react';
import { useTimeTravel } from '../hooks/useTimeTravel';

interface FormData {
  name: string;
  email: string;
  age: number;
  bio: string;
}

const initialData: FormData = {
  name: '',
  email: '',
  age: 0,
  bio: '',
};

export function FormWithUndo() {
  const { state, set, undo, redo, canUndo, canRedo, history } = useTimeTravel<FormData>(
    initialData,
    { maxHistory: 20 }
  );

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (!state.name) newErrors.name = 'Name is required';
    if (!state.email.includes('@')) newErrors.email = 'Invalid email';
    if (state.age < 18) newErrors.age = 'Must be 18+';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      alert('Form submitted!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-with-undo">
      <div className="toolbar">
        <button type="button" onClick={undo} disabled={!canUndo}>
          ↶ Undo
        </button>
        <button type="button" onClick={redo} disabled={!canRedo}>
          ↷ Redo
        </button>
        <span className="history-count">
          {history.length} changes
        </span>
      </div>

      <div className="field">
        <label>Name:</label>
        <input
          type="text"
          value={state.name}
          onChange={(e) => set({ ...state, name: e.target.value }, 'EDIT_NAME')}
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>

      <div className="field">
        <label>Email:</label>
        <input
          type="email"
          value={state.email}
          onChange={(e) => set({ ...state, email: e.target.value }, 'EDIT_EMAIL')}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <div className="field">
        <label>Age:</label>
        <input
          type="number"
          value={state.age}
          onChange={(e) => set({ ...state, age: Number(e.target.value) }, 'EDIT_AGE')}
        />
        {errors.age && <span className="error">{errors.age}</span>}
      </div>

      <div className="field">
        <label>Bio:</label>
        <textarea
          value={state.bio}
          onChange={(e) => set({ ...state, bio: e.target.value }, 'EDIT_BIO')}
          rows={5}
        />
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### 6.2. Текстовый редактор с историей версий

```typescript
// examples/TextEditor.tsx

import React, { useCallback, useEffect } from 'react';
import { useTimeTravel } from '../hooks/useTimeTravel';

interface EditorState {
  content: string;
  title: string;
  lastSaved?: number;
}

export function TextEditor() {
  const { state, set, undo, redo, canUndo, canRedo, history, jumpTo } = useTimeTravel<EditorState>(
    { content: '', title: 'Untitled' },
    { maxHistory: 100 }
  );

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.content) {
        localStorage.setItem('editor-draft', state.content);
        set({ ...state, lastSaved: Date.now() }, 'AUTO_SAVE');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [state.content]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('editor-draft');
    if (draft) {
      set({ ...state, content: draft }, 'LOAD_DRAFT');
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 's':
            e.preventDefault();
            set({ ...state, lastSaved: Date.now() }, 'MANUAL_SAVE');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, state]);

  const wordCount = useCallback(() => {
    return state.content.trim().split(/\s+/).filter(Boolean).length;
  }, [state.content]);

  const charCount = useCallback(() => {
    return state.content.length;
  }, [state.content]);

  return (
    <div className="text-editor">
      <header className="editor-header">
        <input
          type="text"
          value={state.title}
          onChange={(e) => set({ ...state, title: e.target.value }, 'EDIT_TITLE')}
          className="title-input"
          placeholder="Document Title"
        />
        
        <div className="editor-actions">
          <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
            ↶
          </button>
          <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
            ↷
          </button>
          <button onClick={() => set({ ...state, lastSaved: Date.now() }, 'SAVE')}>
            💾 Save
          </button>
        </div>

        <div className="editor-stats">
          <span>{wordCount()} words</span>
          <span>{charCount()} characters</span>
          {state.lastSaved && (
            <span>Saved: {new Date(state.lastSaved).toLocaleTimeString()}</span>
          )}
        </div>
      </header>

      <main className="editor-main">
        <textarea
          value={state.content}
          onChange={(e) => set({ ...state, content: e.target.value }, 'EDIT_CONTENT')}
          placeholder="Start writing..."
          className="editor-textarea"
        />
      </main>

      <aside className="history-panel">
        <h3>Version History ({history.length})</h3>
        <div className="history-list">
          {history.slice().reverse().map((snapshot, index) => (
            <button
              key={snapshot.id}
              onClick={() => jumpTo(history.length - 1 - index)}
              className={`history-item ${index === history.length - 1 ? 'current' : ''}`}
            >
              <span className="action">{snapshot.action || 'Change'}</span>
              <span className="time">
                {new Date(snapshot.timestamp).toLocaleString()}
              </span>
              <span className="preview">
                {state.content.slice(0, 50)}...
              </span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
```

---

## Шаг 7: DevTools интеграция

Создадим простое DevTools расширение для просмотра истории.

### 7.1. DevTools компонент

```typescript
// devtools/TimeTravelDevTools.tsx

import React, { useState, useEffect } from 'react';

interface TimeTravelDevToolsProps {
  timeTravel: any;
  onClose: () => void;
}

export function TimeTravelDevTools({ timeTravel, onClose }: TimeTravelDevToolsProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);

  const refresh = () => {
    setHistory(timeTravel.getHistory());
    setCurrentIndex(timeTravel.getStats().currentIndex);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleJumpTo = (index: number) => {
    timeTravel.jumpTo(index);
    refresh();
  };

  const handleExport = () => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-travel-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="time-travel-devtools">
      <header>
        <h3>Time Travel DevTools</h3>
        <button onClick={onClose}>✕</button>
      </header>

      <div className="toolbar">
        <button onClick={() => timeTravel.undo()} disabled={currentIndex === 0}>
          ↶ Undo
        </button>
        <button onClick={() => timeTravel.redo()} disabled={currentIndex === history.length - 1}>
          ↷ Redo
        </button>
        <button onClick={refresh}>🔄 Refresh</button>
        <button onClick={handleExport}>📥 Export</button>
      </div>

      <div className="stats">
        <span>Total: {history.length}</span>
        <span>Current: {currentIndex + 1}</span>
        <span>Can Undo: {currentIndex > 0 ? 'Yes' : 'No'}</span>
        <span>Can Redo: {currentIndex < history.length - 1 ? 'Yes' : 'No'}</span>
      </div>

      <div className="history-list">
        {history.map((snapshot, index) => (
          <div
            key={snapshot.id}
            className={`snapshot-item ${index === currentIndex ? 'current' : ''}`}
            onClick={() => {
              handleJumpTo(index);
              setSelectedSnapshot(snapshot);
            }}
          >
            <div className="snapshot-header">
              <span className="index">#{index + 1}</span>
              <span className="action">{snapshot.action || 'CHANGE'}</span>
              <span className="time">
                {new Date(snapshot.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="snapshot-preview">
              <pre>{JSON.stringify(snapshot.state, null, 2).slice(0, 200)}...</pre>
            </div>
          </div>
        ))}
      </div>

      {selectedSnapshot && (
        <div className="snapshot-detail">
          <h4>Snapshot Details</h4>
          <pre>{JSON.stringify(selectedSnapshot.state, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

### 7.2. Стили для DevTools

```css
/* devtools/TimeTravelDevTools.css */

.time-travel-devtools {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 400px;
  height: 500px;
  background: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #333;
  border-radius: 8px 0 0 0;
  font-family: 'Consolas', monospace;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.time-travel-devtools header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #252526;
  border-bottom: 1px solid #333;
}

.time-travel-devtools .toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #252526;
  border-bottom: 1px solid #333;
}

.time-travel-devtools button {
  background: #0e639c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.time-travel-devtools button:disabled {
  background: #3c3c3c;
  cursor: not-allowed;
}

.time-travel-devtools .stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 8px;
  background: #2d2d30;
  font-size: 12px;
}

.time-travel-devtools .history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.time-travel-devtools .snapshot-item {
  background: #252526;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  cursor: pointer;
}

.time-travel-devtools .snapshot-item.current {
  border-color: #0e639c;
  background: #2d2d30;
}

.time-travel-devtools .snapshot-header {
  display: flex;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 4px;
}

.time-travel-devtools .snapshot-preview pre {
  background: #1e1e1e;
  padding: 8px;
  border-radius: 4px;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-travel-devtools .snapshot-detail {
  border-top: 1px solid #333;
  padding: 12px;
  background: #252526;
  max-height: 200px;
  overflow-y: auto;
}
```

---

## Чек-лист внедрения в production

Используйте этот чек-лист при внедрении time-travel в ваш проект:

### Базовая функциональность

- [ ] Реализовано создание снимков (capture)
- [ ] Работает undo/redo
- [ ] Реализован jumpTo для навигации
- [ ] Ограничение размера истории (maxHistory)
- [ ] Обработка circular references

### Интеграция

- [ ] Интегрировано с вашей state management библиотекой
- [ ] Горячие клавиши (Ctrl+Z / Ctrl+Shift+Z)
- [ ] UI кнопки undo/redo в приложении
- [ ] Индикаторы доступности (disabled когда нечего отменять)

### Персистентность

- [ ] Сохранение в localStorage (для малых данных)
- [ ] Или IndexedDB (для больших данных)
- [ ] Автосохранение с debounce
- [ ] Восстановление после перезагрузки

### Производительность

- [ ] Delta-сжатие для больших состояний
- [ ] Batching для группировки изменений
- [ ] Оптимизированное сравнение (deepEqual)
- [ ] Benchmark тесты пройдены

### UX

- [ ] История версий с названиями
- [ ] Preview изменений (diff view)
- [ ] Экспорт/импорт состояний
- [ ] DevTools для отладки

### Тестирование

- [ ] Unit тесты для core логики
- [ ] Integration тесты с UI
- [ ] Performance тесты
- [ ] E2E тесты сценариев undo/redo

---

## Заключение

Мы прошли путь от базовой реализации до production-ready решения:

1. ✅ **Реализовали с нуля** — универсальный класс TimeTravel
2. ✅ **Интегрировали с React** — хук useTimeTravel
3. ✅ **Добавили Zustand и Redux** — middleware для популярных библиотек
4. ✅ **Настроили персистентность** — localStorage + IndexedDB
5. ✅ **Создали примеры** — форма и текстовый редактор
6. ✅ **DevTools** — инструмент для отладки

### Что дальше?

- **Оптимизируйте** под ваш use case (дельта-сжатие, batching)
- **Добавьте collaboration** (синхронизация между пользователями)
- **Создайте визуальный редактор** истории (timeline, graph view)
- **Интегрируйте с бэкендом** (серверная история версий)

---

## Ресурсы

### Код из статьи

- [Базовая реализация TimeTravel](#)
- [Хук useTimeTravel](#)
- [Zustand middleware](#)
- [Redux middleware](#)
- [Персистентность adapters](#)
- [Примеры (Form, Editor)](#)
- [DevTools компонент](#)

### Ссылки

- [Часть 1: Основы и паттерны](part-1-foundations.md)
- [Часть 2: Производительность](part-2-advanced-final.md)
- [Benchmark код](https://gist.github.com/eustatos/a69ecdeb29f25d5798e1bceaed20cbaf)
- [Nexus State GitHub](https://github.com/astashkin-a/nexus-state)

---

*Это заключительная Часть 3 серии статей о Time-Travel Debugging.*

**Теги:** #javascript #typescript #react #redux #zustand #state-management #time-travel #tutorial
