# Task 07: Undo/Redo

**Приоритет:** Medium  
**Оценка:** 3-5 дней  
**Статус:** Todo

---

## Цель

Реализовать Undo/Redo функциональность с Time Travel интеграцией.

---

## Scope

### 1. History Management

```typescript
// packages/form-builder/src/state/history.ts
import { FormSchema } from '../schema/types';

export interface HistoryState {
  past: FormSchema[];
  present: FormSchema;
  future: FormSchema[];
}

export function addToHistory(
  history: HistoryState,
  newSchema: FormSchema
): HistoryState {
  return {
    past: [...history.past, history.present],
    present: newSchema,
    future: [], // Clear future on new action
  };
}

export function undo(history: HistoryState): HistoryState | null {
  if (history.past.length === 0) return null;

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, -1);

  return {
    past: newPast,
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo(history: HistoryState): HistoryState | null {
  if (history.future.length === 0) return null;

  const next = history.future[0];
  const newFuture = history.future.slice(1);

  return {
    past: [...history.past, history.present],
    present: next,
    future: newFuture,
  };
}
```

### 2. Integration с Builder State

```typescript
// packages/form-builder/src/state/builder-atom.ts (updated)
import { atom } from '@nexus-state/core';
import { HistoryState, addToHistory, undo, redo } from './history';

export interface BuilderState {
  history: HistoryState;
  selectedFieldId: string | null;
  isDirty: boolean;
}

export const builderAtom = atom<BuilderState>({
  history: {
    past: [],
    present: {
      id: 'form-1',
      title: 'New Form',
      fields: [],
    },
    future: [],
  },
  selectedFieldId: null,
  isDirty: false,
});

// Updated actions
export const builderActions = {
  addField(field: FieldSchema) {
    builderAtom.update((state) => {
      const newSchema = {
        ...state.history.present,
        fields: [...state.history.present.fields, field],
      };

      return {
        ...state,
        history: addToHistory(state.history, newSchema),
        isDirty: true,
      };
    });
  },

  undo() {
    builderAtom.update((state) => {
      const newHistory = undo(state.history);
      if (!newHistory) return state;

      return {
        ...state,
        history: newHistory,
        isDirty: true,
      };
    });
  },

  redo() {
    builderAtom.update((state) => {
      const newHistory = redo(state.history);
      if (!newHistory) return state;

      return {
        ...state,
        history: newHistory,
        isDirty: true,
      };
    });
  },

  // ... other actions updated similarly
};
```

### 3. UI Controls

```typescript
// packages/form-builder-ui/src/components/HistoryControls.tsx
import { useAtom } from '@nexus-state/react';
import { builderAtom, builderActions } from '@nexus-state/form-builder';

export function HistoryControls() {
  const [state] = useAtom(builderAtom);

  const canUndo = state.history.past.length > 0;
  const canRedo = state.history.future.length > 0;

  return (
    <div className="history-controls">
      <button
        onClick={() => builderActions.undo()}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        ↶ Undo
      </button>
      <button
        onClick={() => builderActions.redo()}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        ↷ Redo
      </button>
      <span className="history-info">
        {state.history.past.length} actions
      </span>
    </div>
  );
}
```

### 4. Keyboard Shortcuts

```typescript
// packages/form-builder-ui/src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';
import { builderActions } from '@nexus-state/form-builder';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        builderActions.undo();
      }

      // Redo: Ctrl+Y (Windows/Linux) or Cmd+Shift+Z (Mac)
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        builderActions.redo();
      }

      // Save: Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Trigger save action
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

### 5. History Timeline (Advanced)

```typescript
// packages/form-builder-ui/src/components/HistoryTimeline.tsx
export function HistoryTimeline() {
  const [state] = useAtom(builderAtom);
  const [showTimeline, setShowTimeline] = useState(false);

  const allStates = [
    ...state.history.past,
    state.history.present,
    ...state.history.future,
  ];

  const currentIndex = state.history.past.length;

  const jumpToState = (index: number) => {
    const diff = index - currentIndex;
    if (diff < 0) {
      // Undo multiple times
      for (let i = 0; i < Math.abs(diff); i++) {
        builderActions.undo();
      }
    } else if (diff > 0) {
      // Redo multiple times
      for (let i = 0; i < diff; i++) {
        builderActions.redo();
      }
    }
  };

  if (!showTimeline) {
    return (
      <button onClick={() => setShowTimeline(true)}>
        Show History Timeline
      </button>
    );
  }

  return (
    <div className="history-timeline">
      <div className="timeline-header">
        <h3>History Timeline</h3>
        <button onClick={() => setShowTimeline(false)}>×</button>
      </div>

      <div className="timeline-list">
        {allStates.map((schema, index) => (
          <div
            key={index}
            className={`timeline-item ${index === currentIndex ? 'current' : ''}`}
            onClick={() => jumpToState(index)}
          >
            <div className="timeline-marker" />
            <div className="timeline-content">
              <div className="timeline-title">{schema.title}</div>
              <div className="timeline-meta">
                {schema.fields.length} fields
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Implementation Plan

1. **History Management** (1 день)
   - History state structure
   - addToHistory, undo, redo functions
   - Integration tests

2. **Builder Integration** (1 день)
   - Update all actions to use history
   - Ensure all mutations go through history
   - Test undo/redo for all operations

3. **UI Controls** (1 день)
   - History controls component
   - Enable/disable states
   - Visual feedback

4. **Keyboard Shortcuts** (0.5 дня)
   - Ctrl+Z / Cmd+Z for undo
   - Ctrl+Y / Cmd+Shift+Z for redo
   - Cross-platform support

5. **History Timeline** (1 день)
   - Timeline visualization
   - Jump to any state
   - Preview states

---

## Acceptance Criteria

- [ ] Undo/Redo работает для всех операций
- [ ] Keyboard shortcuts работают
- [ ] UI controls отображают правильное состояние
- [ ] History timeline позволяет jump to state
- [ ] Performance оптимизирован (не хранить слишком много истории)

---

## Dependencies

- Task 01 (Core Architecture)
- @nexus-state/core

---

## Notes

- Ограничить историю (например, 50 последних действий)
- Рассмотреть debouncing для частых операций
- Добавить visual feedback при undo/redo
