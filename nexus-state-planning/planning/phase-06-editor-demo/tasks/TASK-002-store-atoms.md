# TASK-002: Создание атомов и store (Store & Atoms)

## 📋 Описание

Создание основных атомов для управления состоянием редактора и настройка time-travel интеграции.

## 🎯 Цель

Реализовать базовую структуру состояния приложения с использованием Nexus State и настроить time-travel для отслеживания изменений.

## 📦 Технические требования

### Атомы

```typescript
// Основные атомы редактора
- contentAtom: string
- cursorAtom: { line: number, col: number }
- selectionAtom: { from: number, to: number } | null
- isDirtyAtom: boolean
- lastSavedAtom: number | null

// Вычисляемые атомы
- statsAtom: { characters, words, lines, readingTime }
- canUndoAtom: boolean
- canRedoAtom: boolean
- snapshotsCountAtom: number
```

## ✅ Задачи

### 2.1: Создание store

**src/store/store.ts:**
```typescript
import { createStore } from '@nexus-state/core'

export const editorStore = createStore()
```

### 2.2: Создание основных атомов

**src/store/atoms/editor.ts:**
```typescript
import { atom } from '@nexus-state/core'

/**
 * Основное содержимое редактора
 */
export const contentAtom = atom('', 'editor.content')

/**
 * Позиция курсора
 */
export const cursorAtom = atom(
  { line: 0, col: 0 },
  'editor.cursor'
)

/**
 * Выделение текста
 */
export const selectionAtom = atom<
  { from: number; to: number } | null
>(null, 'editor.selection')

/**
 * Флаг "грязного" состояния (есть несохраненные изменения)
 */
export const isDirtyAtom = atom(false, 'editor.isDirty')

/**
 * Время последнего сохранения (снимка)
 */
export const lastSavedAtom = atom<number | null>(null, 'editor.lastSaved')
```

### 2.3: Создание вычисляемых атомов (статистика)

**src/store/atoms/stats.ts:**
```typescript
import { atom } from '@nexus-state/core'
import { contentAtom } from './editor'

export interface EditorStats {
  characters: number
  charactersNoSpaces: number
  words: number
  lines: number
  readingTime: number // в минутах
}

/**
 * Статистика редактора (вычисляемый атом)
 */
export const statsAtom = atom<EditorStats>((get) => {
  const content = get(contentAtom)
  
  return {
    characters: content.length,
    charactersNoSpaces: content.replace(/\s/g, '').length,
    words: content.trim() ? content.trim().split(/\s+/).length : 0,
    lines: content.split('\n').length,
    readingTime: Math.ceil(content.length / 200 / 60) // ~200 символов в минуту
  }
}, 'editor.stats')
```

### 2.4: Настройка time-travel

**src/store/timeTravel.ts:**
```typescript
import { SimpleTimeTravel } from '@nexus-state/core'
import { editorStore } from './store'

/**
 * Time-travel конфигурация для редактора
 */
export const editorTimeTravel = new SimpleTimeTravel(editorStore, {
  maxHistory: 100,
  autoCapture: false, // Ручное управление через debounce
  
  // Delta-сжатие для экономии памяти
  deltaSnapshots: {
    enabled: true,
    fullSnapshotInterval: 10,
    maxDeltaChainLength: 20,
    changeDetection: 'deep'
  },
  
  // TTL для атомов
  atomTTL: 300000, // 5 минут
  
  // Настройки отслеживания
  trackingConfig: {
    autoTrack: true,
    trackComputed: true,
    trackWritable: true,
    trackPrimitive: true
  },
  
  // Настройки очистки
  cleanupStrategy: 'lru',
  gcInterval: 60000
})
```

### 2.5: Time-travel хелперы

**src/store/helpers.ts:**
```typescript
import { editorTimeTravel } from './timeTravel'

/**
 * Создать снимок состояния
 */
export function captureSnapshot(action: string, metadata?: any) {
  return editorTimeTravel.capture(action, metadata)
}

/**
 * Перейти к снимку по индексу
 */
export function jumpToSnapshot(index: number) {
  return editorTimeTravel.jumpTo(index)
}

/**
 * Отменить последнее изменение
 */
export function undo() {
  return editorTimeTravel.undo()
}

/**
 * Повторить отмененное изменение
 */
export function redo() {
  return editorTimeTravel.redo()
}

/**
 * Проверить возможность отмены
 */
export function canUndo() {
  return editorTimeTravel.canUndo()
}

/**
 * Проверить возможность повтора
 */
export function canRedo() {
  return editorTimeTravel.canRedo()
}

/**
 * Получить историю снимков
 */
export function getHistory() {
  return editorTimeTravel.getHistory()
}

/**
 * Очистить историю
 */
export function clearHistory() {
  editorTimeTravel.clearHistory()
}
```

### 2.6: Вычисляемые атомы для навигации

**src/store/atoms/navigation.ts:**
```typescript
import { atom } from '@nexus-state/core'
import { editorTimeTravel } from '../timeTravel'

/**
 * Текущая позиция в истории
 */
export const currentPositionAtom = atom(
  (get) => {
    // Получаем текущий индекс из time-travel
    // Это требует дополнительной реализации в SimpleTimeTravel
    const history = editorTimeTravel.getHistory()
    return history.length > 0 ? history.length - 1 : 0
  },
  'timeline.currentPosition'
)

/**
 * Общее количество снимков
 */
export const snapshotsCountAtom = atom(
  (get) => {
    return editorTimeTravel.getHistory().length
  },
  'timeline.snapshotsCount'
)

/**
 * Возможность отмены
 */
export const canUndoAtom = atom(
  (get) => {
    return editorTimeTravel.canUndo()
  },
  'timeline.canUndo'
)

/**
 * Возможность повтора
 */
export const canRedoAtom = atom(
  (get) => {
    return editorTimeTravel.canRedo()
  },
  'timeline.canRedo'
)
```

### 2.7: Экспорт атомов

**src/store/atoms/index.ts:**
```typescript
// Editor atoms
export {
  contentAtom,
  cursorAtom,
  selectionAtom,
  isDirtyAtom,
  lastSavedAtom
} from './editor'

// Stats atoms
export { statsAtom } from './stats'

// Navigation atoms
export {
  currentPositionAtom,
  snapshotsCountAtom,
  canUndoAtom,
  canRedoAtom
} from './navigation'

// Types
export type { EditorStats } from './stats'
```

**src/store/index.ts:**
```typescript
export { editorStore } from './store'
export { editorTimeTravel } from './timeTravel'
export * from './helpers'
export * from './atoms'
```

## 🧪 Критерии приемки

- [ ] Store создается без ошибок
- [ ] Все атомы регистрируются корректно
- [ ] Вычисляемые атомы пересчитываются при изменении зависимостей
- [ ] Time-travel захватывает снимки
- [ ] undo/redo работают
- [ ] canUndo/canRedo возвращают правильные значения

## 📁 Зависимости

- [[TASK-001]](./TASK-001-project-setup.md) — Настройка проекта

## 🔗 Связанные задачи

- [[TASK-003]](./TASK-003-editor-component.md) — Базовый компонент редактора
- [[TASK-004]](./TASK-004-stats-component.md) — Компонент статистики
- [[TASK-005]](./TASK-005-debounce-snapshots.md) — Debounce для снимков

## 📝 Заметки

- Убедиться что @nexus-state/core экспортирует все необходимые типы
- Проверить работу SimpleTimeTravel с текущей версией
- Добавить обработку ошибок при создании снимков
