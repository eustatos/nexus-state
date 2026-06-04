# UC-003: Навигация Undo/Redo (Timeline Navigation)

## 📋 Описание

Демонстрация навигации по истории снимков с помощью кнопок Undo/Redo и timeline slider.

## 🎯 Цель

Показать базовые возможности time-travel: перемещение между снимками, восстановление состояния, визуальную индикацию позиции.

## 👤 Персона

**Пользователь, исследующий историю** — хочет вернуться к предыдущей версии документа или просмотреть историю изменений.

## 📖 Предусловия

- В редакторе есть текст
- В истории есть минимум 5 снимков
- Текущая позиция — последний снимок

## 🔄 Поток

### Сценарий 1: Пошаговое перемещение (Undo)

1. **Пользователь нажимает кнопку "◄ Prev"**
   - Система проверяет `canUndo()`
   - Выполняется переход к предыдущему снимку
   - Содержимое редактора обновляется
   - Индикатор позиции смещается влево

2. **Пользователь продолжает нажимать "Prev"**
   - Каждый шаг перемещает на один снимок назад
   - Кнопка "Prev" становится неактивной при достижении начала
   - Кнопка "Next" активируется

### Сценарий 2: Переход к началу/концу

1. **Пользователь нажимает "<< First"**
   - Мгновенный переход к первому снимку
   - Редактор показывает начальное состояние
   - Индикатор позиции на начале timeline

2. **Пользователь нажимает ">> Last"**
   - Переход к последнему снимку
   - Восстановление актуального состояния

### Сценарий 3: Drag slider

1. **Пользователь перетаскивает ползунок timeline**
   - Плавная прокрутка истории
   - Предпросмотр состояния при перетаскивании (опционально)
   - "Прилипание" к точкам-снимкам

## 🎨 UI Элементы

```
┌──────────────────────────────────────────────────────────────┐
│ Timeline Controls                                            │
│                                                              │
│  [<< First] [◄ Prev]  ──●──●──●──●──●──  [Next ►] [>> Last] │
│                        1  2 (3) 4  5                         │
│                                                              │
│  Current: 3 of 15 snapshots                                  │
│  [▶ Play] [⏹ Stop]  Speed: [───●───] 500ms                  │
└──────────────────────────────────────────────────────────────┘
```

## 🔧 Техническая реализация

### Атомы навигации

```typescript
// store/atoms/timeline.ts
import { atom } from '@nexus-state/core'

export const currentPositionAtom = atom(0, 'timeline.currentPosition')
export const isPlayingAtom = atom(false, 'timeline.playing')
export const playbackSpeedAtom = atom(1000, 'timeline.speed')

export const canUndoAtom = atom(
  (get) => {
    const timeTravel = getTimeTravel() // Получаем экземпляр
    return timeTravel.canUndo()
  },
  'timeline.canUndo'
)

export const canRedoAtom = atom(
  (get) => {
    const timeTravel = getTimeTravel()
    return timeTravel.canRedo()
  },
  'timeline.canRedo'
)

export const totalSnapshotsAtom = atom(
  (get) => {
    const timeTravel = getTimeTravel()
    return timeTravel.getHistory().length
  },
  'timeline.total'
)
```

### Хук для навигации

```typescript
// hooks/useTimelineNavigation.ts
import { useState, useEffect, useCallback } from 'react'
import { editorTimeTravel } from '@/store/timeTravel'

export function useTimelineNavigation() {
  const [position, setPosition] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1000)

  const history = editorTimeTravel.getHistory()
  const total = history.length

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= total) return false
    
    const success = editorTimeTravel.jumpTo(index)
    if (success) {
      setPosition(index)
    }
    return success
  }, [total])

  const undo = useCallback(() => {
    const success = editorTimeTravel.undo()
    if (success) {
      setPosition(prev => prev - 1)
    }
    return success
  }, [])

  const redo = useCallback(() => {
    const success = editorTimeTravel.redo()
    if (success) {
      setPosition(prev => prev + 1)
    }
    return success
  }, [])

  const goToFirst = useCallback(() => {
    return goTo(0)
  }, [goTo])

  const goToLast = useCallback(() => {
    return goTo(total - 1)
  }, [goTo, total])

  // Авто-проигрывание
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      if (!editorTimeTravel.canRedo()) {
        setIsPlaying(false)
        return
      }
      redo()
    }, speed)

    return () => clearInterval(interval)
  }, [isPlaying, speed, redo])

  return {
    position,
    total,
    isPlaying,
    speed,
    canUndo: editorTimeTravel.canUndo(),
    canRedo: editorTimeTravel.canRedo(),
    goTo,
    undo,
    redo,
    goToFirst,
    goToLast,
    setIsPlaying,
    setSpeed
  }
}
```

### Компонент Timeline Controls

```typescript
// components/Timeline/TimelineControls.tsx
import { useTimelineNavigation } from '@/hooks/useTimelineNavigation'

export function TimelineControls() {
  const {
    position,
    total,
    isPlaying,
    speed,
    canUndo,
    canRedo,
    undo,
    redo,
    goToFirst,
    goToLast,
    setIsPlaying,
    setSpeed
  } = useTimelineNavigation()

  return (
    <div className="timeline-controls">
      <button
        onClick={goToFirst}
        disabled={!canUndo}
        title="Jump to first snapshot"
      >
        <Icon ChevronsLeft />
      </button>

      <button
        onClick={undo}
        disabled={!canUndo}
        title="Undo (previous snapshot)"
      >
        <Icon ChevronLeft />
      </button>

      <div className="timeline-info">
        <span>{position + 1} of {total}</span>
      </div>

      <button
        onClick={redo}
        disabled={!canRedo}
        title="Redo (next snapshot)"
      >
        <Icon ChevronRight />
      </button>

      <button
        onClick={goToLast}
        disabled={!canRedo}
        title="Jump to last snapshot"
      >
        <Icon ChevronsRight />
      </button>

      <div className="playback-controls">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={!canRedo && !isPlaying}
        >
          <Icon {isPlaying ? Pause : Play} />
        </button>

        <input
          type="range"
          min="200"
          max="3000"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          title="Playback speed"
        />
        <span className="speed-label">{speed}ms</span>
      </div>
    </div>
  )
}
```

### Timeline Slider Component

```typescript
// components/Timeline/TimelineSlider.tsx
import { useTimelineNavigation } from '@/hooks/useTimelineNavigation'

export function TimelineSlider() {
  const { position, total, goTo } = useTimelineNavigation()
  const history = editorTimeTravel.getHistory()

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = Number(e.target.value)
    goTo(newIndex)
  }

  return (
    <div className="timeline-slider">
      <input
        type="range"
        min="0"
        max={total - 1}
        value={position}
        onChange={handleSliderChange}
        className="slider"
        step="1"
      />

      <div className="snapshot-points">
        {history.map((snapshot, index) => (
          <div
            key={snapshot.id}
            className={`point ${index === position ? 'active' : ''} ${snapshot.metadata?.action}`}
            onClick={() => goTo(index)}
            title={`${snapshot.metadata?.action}\n${formatTime(snapshot.timestamp)}`}
          />
        ))}
      </div>
    </div>
  )
}
```

## 📊 Ожидаемые результаты

| Действие | Время выполнения | Визуальный отклик |
|----------|------------------|-------------------|
| Undo/Redo (кнопка) | < 50ms | Мгновенное обновление |
| Jump to First/Last | < 100ms | Мгновенное обновление |
| Drag slider | 60 FPS | Плавная прокрутка |
| Playback | По интервалу | Плавная анимация |

## ✅ Критерии приемки

- [ ] Кнопки Undo/Redo работают корректно
- [ ] Кнопки First/Last перемещают к краям истории
- [ ] Slider позволяет плавно перемещаться
- [ ] Индикатор позиции обновляется
- [ ] Кнопки disabled когда недоступны
- [ ] Авто-проигрывание работает плавно

## 🔗 Связанные use case'ы

- [[UC-001]](./UC-001.md) — Базовое редактирование
- [[UC-005]](./UC-005.md) — Jump to Snapshot по клику
- [[UC-008]](./UC-008.md) — Авто-проигрывание истории

## 📝 Заметки

- Важно показать мгновенную реакцию UI
- Анимация переходов улучшает восприятие
- Keyboard shortcuts улучшают UX (Ctrl+Z, Ctrl+Y)
