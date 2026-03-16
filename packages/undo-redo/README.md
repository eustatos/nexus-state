# @nexus-state/undo-redo

Лёгкий пакет (~150 KB) для user-facing undo/redo функционала в Nexus State.

## Установка

```bash
pnpm add @nexus-state/undo-redo
```

## Основной API

### `createUndoRedo(options?)`

Создаёт экземпляр undo/redo менеджера.

```typescript
import { createUndoRedo } from '@nexus-state/undo-redo';

const undoRedo = createUndoRedo({
  maxLength: 50,           // Максимальная длина истории
  debounce: 300,           // Debounce в мс
  ignoreFields: [],        // Поля для игнорирования
  areEqual: undefined,     // Функция сравнения
});
```

### Методы

```typescript
interface UndoRedo<T> {
  // Основные операции
  push(state: T, metadata?: any): void;
  undo(): T | undefined;
  redo(): T | undefined;

  // Проверки
  canUndo(): boolean;
  canRedo(): boolean;

  // Управление
  clear(): void;
  batch(fn: () => void): void;

  // Состояние
  readonly currentState: T | undefined;
  readonly historyLength: number;
  readonly position: number;

  // События
  on(event: string, listener: Function): void;
  off(event: string, listener: Function): void;

  // Горячие клавиши
  enableKeyboardShortcuts(options?: KeyboardOptions): void;
  disableKeyboardShortcuts(): void;
}
```

## Интеграция с @nexus-state/core

### `withUndoRedo(store, options?)`

Добавляет undo/redo к store.

```typescript
import { createStore } from '@nexus-state/core';
import { withUndoRedo } from '@nexus-state/undo-redo';

const store = createStore();
const undoRedo = withUndoRedo(store, {
  maxLength: 50,
  ignoreAtoms: ['tempData', 'loadingState'],
});

// Использование
store.set(myAtom, newValue);
undoRedo.undo();
undoRedo.redo();
```

### `useUndoRedo()` hook (для React)

```typescript
import { useUndoRedo } from '@nexus-state/undo-redo/react';

function MyComponent() {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </div>
  );
}
```

## Примеры использования

### Пример 1: Простая форма

```typescript
import { atom, createStore } from '@nexus-state/core';
import { withUndoRedo } from '@nexus-state/undo-redo';

const nameAtom = atom('');
const emailAtom = atom('');

const store = createStore();
const undoRedo = withUndoRedo(store, {
  maxLength: 20,
  debounce: 500,
});

// Изменения
store.set(nameAtom, 'John');
store.set(emailAtom, 'john@example.com');

// Undo
undoRedo.undo(); // email вернётся к ''
undoRedo.undo(); // name вернётся к ''

// Redo
undoRedo.redo(); // name станет 'John'
undoRedo.redo(); // email станет 'john@example.com'
```

### Пример 2: Текстовый редактор

```typescript
import { atom, createStore } from '@nexus-state/core';
import { withUndoRedo } from '@nexus-state/undo-redo';

const contentAtom = atom('');

const store = createStore();
const undoRedo = withUndoRedo(store, {
  maxLength: 100,
  debounce: 500,
});

undoRedo.enableKeyboardShortcuts();

// Пользователь печатает
store.set(contentAtom, 'H');
store.set(contentAtom, 'He');
// ...
store.set(contentAtom, 'Hello');
// Через 500ms сохранится состояние "Hello"

// Ctrl+Z
undoRedo.undo(); // content вернётся к предыдущему состоянию
```

### Пример 3: Форма с игнорированием полей

```typescript
const formAtom = atom({
  name: '',
  email: '',
  timestamp: Date.now(),
  errors: {},
});

const undoRedo = withUndoRedo(store, {
  ignoreFields: ['timestamp', 'errors'],
});
```

## API Reference

### `createUndoRedo<T>(options?: UndoRedoOptions)`

Создаёт новый экземпляр undo/redo менеджера.

**Параметры:**

- `options.maxLength` (optional): Максимальная длина истории (по умолчанию: 50)
- `options.debounce` (optional): Debounce в мс (по умолчанию: 0)
- `options.ignoreFields` (optional): Поля для игнорирования при сравнении
- `options.areEqual` (optional): Функция сравнения значений

**Возвращает:** `UndoRedo<T>`

### `withUndoRedo(store, options?)`

Добавляет undo/redo функционал к store.

**Параметры:**

- `store`: Экземпляр store из @nexus-state/core
- `options.maxLength` (optional): Максимальная длина истории
- `options.ignoreAtoms` (optional): Имена atom'ов для игнорирования

**Возвращает:** `UndoRedo<StoreState>`

### `useUndoRedo()` (React Hook)

React хук для удобного использования undo/redo в компонентах.

**Возвращает:**

- `undo`: Функция для отмены последнего действия
- `redo`: Функция для повтора отменённого действия
- `canUndo`: Флаг доступности undo
- `canRedo`: Флаг доступности redo
- `history`: Массив истории изменений

## События

```typescript
undoRedo.on('change', (state) => {
  console.log('State changed:', state);
});

undoRedo.on('undo', (state) => {
  console.log('Undo performed:', state);
});

undoRedo.on('redo', (state) => {
  console.log('Redo performed:', state);
});

undoRedo.on('clear', () => {
  console.log('History cleared');
});
```

## Batch операции

```typescript
undoRedo.batch(() => {
  store.set(nameAtom, 'John');
  store.set(emailAtom, 'john@example.com');
  store.set(ageAtom, 30);
});
// Это считается как ОДНА операция для undo
```

## Горячие клавиши

```typescript
undoRedo.enableKeyboardShortcuts({
  undo: ['ctrl+z', 'meta+z'],
  redo: ['ctrl+y', 'meta+shift+z', 'ctrl+shift+z'],
});

// Отключить
undoRedo.disableKeyboardShortcuts();
```

## License

MIT
