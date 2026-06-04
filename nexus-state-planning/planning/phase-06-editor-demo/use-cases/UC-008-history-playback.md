# UC-008: Авто-проигрывание истории (History Playback)

## 📋 Описание

Демонстрация автоматического проигрывания истории снимков с настраиваемой скоростью, паузами и контролем воспроизведения.

## 🎯 Цель

Показать плавную анимацию перехода между состояниями, возможность просмотра эволюции документа как "видео" изменений.

## 👤 Персона

**Презентатор/Обучающий** — хочет продемонстрировать историю изменений документа в формате плавной анимации, показать процесс создания контента.

## 📖 Предусловия

- В истории есть минимум 5 снимков
- Timeline отображает все снимки
- Контроллер воспроизведения доступен

## 🔄 Поток

### Сценарий 1: Базовое проигрывание

1. **Пользователь нажимает кнопку "Play" (▶)**
   - Проигрывание начинается с текущей позиции
   - Движение вперед к последнему снимку
   - Плавные переходы между состояниями

2. **Проигрывание продолжается**
   - Каждый снимок отображается заданный интервал (например, 1 секунда)
   - Визуальная индикация текущей позиции
   - Кнопка меняется на "Pause" (⏸)

3. **Достигнут конец истории**
   - Проигрывание автоматически останавливается
   - Кнопка возвращается в состояние "Play"
   - Позиция остается на последнем снимке

### Сценарий 2: Настройка скорости

1. **Пользователь регулирует скорость воспроизведения**
   - Slider от 200ms (быстро) до 3000ms (медленно)
   - Изменение применяется немедленно
   - Текущая скорость отображается цифрами

2. **Проигрывание продолжается с новой скоростью**
   - Плавное изменение темпа
   - Без рывков и скачков

### Сценарий 3: Пауза и возобновление

1. **Пользователь нажимает "Pause" во время проигрывания**
   - Проигрывание немедленно останавливается
   - Текущее состояние сохраняется
   - Кнопка меняется на "Resume" (▶)

2. **Пользователь нажимает "Resume"**
   - Проигрывание продолжается с позиции паузы
   - Скорость сохраняется

### Сценарий 4: Зацикленное проигрывание

1. **Пользователь включает режим "Loop" (🔁)**
   - После достижения конца история начинается сначала
   - Бесконечное проигрывание

2. **Пользователь останавливает проигрывание**
   - Кнопка "Stop" (⏹) возвращает к начальной позиции
   - Или "Pause" останавливает на текущей

## 🎨 UI Элементы

```
┌─────────────────────────────────────────────────────────────────┐
│ Timeline Playback Controls                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [<< First] [◄ Prev]  ──●──●──●──●──●──  [Next ►] [>> Last]    │
│                        1  2 (3) 4  5                            │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [⏮] [▶ Play] [⏸ Pause] [⏹ Stop] [🔁 Loop]               │  │
│  │                                                           │  │
│  │  Speed: [────●────────] 1000ms                            │  │
│  │         200ms          3000ms                              │  │
│  │                                                           │  │
│  │  Progress: ████████████░░░░░░░░░░ 45%                     │  │
│  │  Playing: 7 of 15 snapshots                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Техническая реализация

### Атомы воспроизведения

```typescript
// store/atoms/playback.ts
import { atom } from '@nexus-state/core'

export interface PlaybackState {
  isPlaying: boolean
  isPaused: boolean
  isLooping: boolean
  currentPosition: number
  speed: number  // ms per snapshot
  direction: 'forward' | 'backward'
}

export const playbackStateAtom = atom<PlaybackState>({
  isPlaying: false,
  isPaused: false,
  isLooping: false,
  currentPosition: 0,
  speed: 1000,
  direction: 'forward'
}, 'playback.state')

export const playbackProgressAtom = atom(
  (get) => {
    const playback = get(playbackStateAtom)
    const timeTravel = getTimeTravel()
    const total = timeTravel.getHistory().length
    
    return {
      current: playback.currentPosition,
      total,
      percent: total > 0 ? (playback.currentPosition / total) * 100 : 0
    }
  },
  'playback.progress'
)
```

### Хук для воспроизведения

```typescript
// hooks/usePlayback.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { editorTimeTravel } from '@/store/timeTravel'

interface UsePlaybackOptions {
  defaultSpeed?: number
  minSpeed?: number
  maxSpeed?: number
}

export function usePlayback(options: UsePlaybackOptions = {}) {
  const {
    defaultSpeed = 1000,
    minSpeed = 200,
    maxSpeed = 3000
  } = options

  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [speed, setSpeed] = useState(defaultSpeed)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [position, setPosition] = useState(0)

  const intervalRef = useRef<number | null>(null)
  const historyLengthRef = useRef(0)

  // Update history length ref
  useEffect(() => {
    const updateHistoryLength = () => {
      historyLengthRef.current = editorTimeTravel.getHistory().length
    }
    
    updateHistoryLength()
    const unsubscribe = editorTimeTravel.subscribe(() => {
      updateHistoryLength()
    })
    
    return unsubscribe
  }, [])

  const jumpTo = useCallback((index: number) => {
    if (index < 0 || index >= historyLengthRef.current) return false
    
    const success = editorTimeTravel.jumpTo(index)
    if (success) {
      setPosition(index)
    }
    return success
  }, [])

  const step = useCallback(() => {
    const currentHistoryLength = historyLengthRef.current
    
    if (direction === 'forward') {
      if (position >= currentHistoryLength - 1) {
        // Reached end
        if (isLooping) {
          jumpTo(0)
          return
        } else {
          // Stop playback
          setIsPlaying(false)
          setIsPaused(false)
          return
        }
      }
      jumpTo(position + 1)
    } else {
      // Backward direction
      if (position <= 0) {
        if (isLooping) {
          jumpTo(currentHistoryLength - 1)
          return
        } else {
          setIsPlaying(false)
          setIsPaused(false)
          return
        }
      }
      jumpTo(position - 1)
    }
  }, [position, direction, isLooping, jumpTo])

  const play = useCallback(() => {
    if (isPlaying) return
    
    setIsPlaying(true)
    setIsPaused(false)
  }, [isPlaying])

  const pause = useCallback(() => {
    if (!isPlaying) return
    
    setIsPaused(true)
    setIsPlaying(false)
  }, [isPlaying])

  const resume = useCallback(() => {
    if (!isPaused) return
    
    setIsPaused(false)
    setIsPlaying(true)
  }, [isPaused])

  const stop = useCallback(() => {
    setIsPlaying(false)
    setIsPaused(false)
    jumpTo(0)
  }, [jumpTo])

  const toggleLoop = useCallback(() => {
    setIsLooping(prev => !prev)
  }, [])

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause()
    } else if (isPaused) {
      resume()
    } else {
      play()
    }
  }, [isPlaying, isPaused, play, pause, resume])

  const setPlaybackSpeed = useCallback((newSpeed: number) => {
    const clamped = Math.max(minSpeed, Math.min(maxSpeed, newSpeed))
    setSpeed(clamped)
  }, [minSpeed, maxSpeed])

  const setPlaybackDirection = useCallback((newDirection: 'forward' | 'backward') => {
    setDirection(newDirection)
  }, [])

  // Playback interval effect
  useEffect(() => {
    if (isPlaying && !isPaused) {
      intervalRef.current = window.setInterval(() => {
        step()
      }, speed)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPlaying, isPaused, speed, step])

  // Sync with external position changes
  useEffect(() => {
    const handleHistoryChange = () => {
      // Update position if changed externally
      const currentIndex = editorTimeTravel.getHistory().length - 1
      // This is simplified - would need actual current index tracking
    }

    const unsubscribe = editorTimeTravel.subscribe(handleHistoryChange)
    return unsubscribe
  }, [])

  return {
    isPlaying,
    isPaused,
    isLooping,
    speed,
    direction,
    position,
    total: historyLengthRef.current,
    play,
    pause,
    resume,
    stop,
    toggleLoop,
    togglePlayPause,
    setPlaybackSpeed,
    setPlaybackDirection,
    jumpTo
  }
}
```

### Playback Controls Component

```typescript
// components/Timeline/PlaybackControls.tsx
import { usePlayback } from '@/hooks/usePlayback'

export function PlaybackControls() {
  const {
    isPlaying,
    isPaused,
    isLooping,
    speed,
    position,
    total,
    play,
    pause,
    stop,
    toggleLoop,
    togglePlayPause,
    setPlaybackSpeed
  } = usePlayback()

  const progress = total > 0 ? (position / total) * 100 : 0

  return (
    <div className="playback-controls">
      {/* Main playback buttons */}
      <div className="playback-buttons">
        <button
          onClick={() => {/* Jump to first */}}
          disabled={position === 0}
          title="Go to first"
        >
          <Icon SkipBack />
        </button>

        <button
          onClick={togglePlayPause}
          disabled={total === 0}
          title={isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play'}
          className="play-button"
        >
          {isPlaying ? <Icon Pause /> : isPaused ? <Icon Play /> : <Icon Play />}
        </button>

        <button
          onClick={stop}
          disabled={position === 0 && !isPlaying}
          title="Stop"
        >
          <Icon Stop />
        </button>

        <button
          onClick={toggleLoop}
          className={isLooping ? 'active' : ''}
          title="Loop playback"
        >
          <Icon Repeat />
        </button>
      </div>

      {/* Speed control */}
      <div className="speed-control">
        <label>Speed:</label>
        <input
          type="range"
          min="200"
          max="3000"
          step="100"
          value={speed}
          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
          disabled={isPlaying}
        />
        <span className="speed-value">{speed}ms</span>
        <span className="speed-label">
          ({speed <= 500 ? 'Fast' : speed <= 1500 ? 'Normal' : 'Slow'})
        </span>
      </div>

      {/* Progress indicator */}
      <div className="playback-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="progress-text">
          {position} of {total} snapshots ({progress.toFixed(0)}%)
        </span>
      </div>
    </div>
  )
}
```

### CSS для playback controls

```css
/* components/Timeline/PlaybackControls.css */
.playback-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--surface);
  border-radius: 12px;
}

.playback-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.playback-buttons button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background);
  border: 2px solid var(--border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.playback-buttons button:hover:not(:disabled) {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
  transform: scale(1.1);
}

.playback-buttons button.play-button {
  width: 56px;
  height: 56px;
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.playback-buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.playback-buttons button.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.speed-control input[type="range"] {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--border);
  appearance: none;
}

.speed-control input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
}

.speed-control input[type="range"]:disabled {
  opacity: 0.5;
}

.speed-value {
  min-width: 60px;
  text-align: right;
  font-weight: bold;
}

.speed-label {
  color: var(--text-muted);
  font-size: 12px;
}

.playback-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}
```

## 📊 Ожидаемые результаты

| Метрика | Значение |
|---------|----------|
| Плавность анимации | 60 FPS |
| Точность интервала | ±50ms |
| Задержка реакции на паузу | < 100ms |
| Плавность изменения скорости | Мгновенно |

## ✅ Критерии приемки

- [ ] Кнопка Play запускает проигрывание
- [ ] Кнопка Pause останавливает без сброса позиции
- [ ] Кнопка Stop возвращает к началу
- [ ] Loop режим работает корректно
- [ ] Регулировка скорости применяется
- [ ] Progress bar отображается точно
- [ ] Анимация плавная без рывков

## 🔗 Связанные use case'ы

- [[UC-003]](./UC-003.md) — Undo/Redo навигация
- [[UC-005]](./UC-005.md) — Jump to Snapshot
- [[UC-007]](./UC-007.md) — Стресс-тест

## 📝 Заметки

- Добавить reverse playback (воспроизведение назад)
- Keyboard shortcuts (Space для pause/play)
- Picture-in-picture режим для презентаций
