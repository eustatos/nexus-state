# UC-007: Стресс-тест производительности (Performance Stress Test)

## 📋 Описание

Демонстрация работы time-travel при экстремальных нагрузках: быстрое непрерывное введение текста, создание сотен снимков, проверка стабильности и потребления памяти.

## 🎯 Цель

Показать, как Nexus State справляется с высокими нагрузками благодаря оптимизациям: delta-сжатие, debounce, TTL для атомов, эффективное управление памятью.

## 👤 Персона

**Разработчик/Инженер по производительности** — хочет убедиться, что система стабильна при интенсивном использовании.

## 📖 Предусловия

- Приложение запущено
- Включены инструменты разработчика (Performance/Memory tabs)
- Time-travel активен с настройками по умолчанию

## 🔄 Поток

### Сценарий 1: Быстрое непрерывное введение текста

1. **Пользователь активирует "Turbo Type" режим**
   - Автоматическая генерация текста (100+ символов в секунду)
   - Имитация очень быстрого пользователя

2. **Система обрабатывает ввод**
   - Debounce откладывает создание снимков
   - Принудительный снимок каждые 5 секунд (maxWait)
   - Delta-сжатие минимизирует размер

3. **Мониторинг метрик**
   - FPS остается стабильным (>50)
   - Потребление памяти растет медленно
   - Время создания снимка < 50ms

### Сценарий 2: Массовое создание снимков

1. **Пользователь запускает "Snapshot Storm"**
   - Создание 100+ снимков за короткое время
   - Имитация частых изменений состояния

2. **Система управляет историей**
   - `maxHistory` ограничивает количество (например, 100)
   - Старые снимки удаляются автоматически
   - Delta-сжатие экономит память

3. **Проверка стабильности**
   - Навигация по истории работает плавно
   - Восстановление состояния быстрое
   - Нет утечек памяти

### Сценарий 3: Большие документы

1. **Пользователь загружает документ 10K+ символов**
   - Множество абзацев, сложная структура

2. **Выполняются изменения**
   - Редактирование различных частей
   - Создание снимков после каждого изменения

3. **Мониторинг**
   - Размер delta-снимков мал (<1KB)
   - Время восстановления < 100ms
   - Плавная прокрутка редактора

## 🎨 UI Элементы

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚡ Performance Monitor                               [Start] [■] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ FPS         │  │ Memory      │  │ Snapshots   │             │
│  │ 60 ▓▓▓▓▓▓▓▓ │  │ 45 MB       │  │ 127         │             │
│  │             │  │ ▓▓▓▓░░░░░░  │  │ (max: 100)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Snapshot Metrics                                         │   │
│  │                                                          │   │
│  │ Avg capture time:  23 ms                                 │   │
│  │ Avg snapshot size: 312 bytes (delta)                     │   │
│  │ Total history size: 39 KB                                │   │
│  │ GC runs: 3                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Timeline (last 10 snapshots)                             │   │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   │
│  │ 0ms    500ms    1000ms   1500ms   2000ms   2500ms       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Test Controls:                                                 │
│  [▶ Turbo Type] [💾 Snapshot Storm] [📄 Large Doc] [🗑 Clear]  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Техническая реализация

### Атомы мониторинга

```typescript
// store/atoms/performance.ts
import { atom } from '@nexus-state/core'

export interface PerformanceMetrics {
  fps: number
  memory: {
    used: number
    total: number
    percent: number
  }
  snapshots: {
    total: number
    avgSize: number
    totalSize: number
    avgCaptureTime: number
  }
  gc: {
    runs: number
    atomsCollected: number
  }
}

export const performanceMetricsAtom = atom<PerformanceMetrics>({
  fps: 60,
  memory: { used: 0, total: 0, percent: 0 },
  snapshots: { total: 0, avgSize: 0, totalSize: 0, avgCaptureTime: 0 },
  gc: { runs: 0, atomsCollected: 0 }
}, 'performance.metrics')

export const isStressTestRunningAtom = atom(false, 'stressTest.running')
export const stressTestModeAtom = atom<'idle' | 'turboType' | 'storm' | 'largeDoc'>('idle', 'stressTest.mode')
```

### Хук для стресс-теста

```typescript
// hooks/useStressTest.ts
import { useState, useCallback, useRef, useEffect } from 'react'
import { editorTimeTravel } from '@/store/timeTravel'

interface StressTestStats {
  snapshotsCreated: number
  avgCaptureTime: number
  maxCaptureTime: number
  totalTextLength: number
  startTime: number
}

export function useStressTest() {
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<'idle' | 'turboType' | 'storm' | 'largeDoc'>('idle')
  const [stats, setStats] = useState<StressTestStats | null>(null)
  
  const intervalRef = useRef<number | null>(null)
  const captureTimesRef = useRef<number[]>([])

  const generateRandomText = (length: number): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,.!?;:'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const startTurboType = useCallback(() => {
    setIsRunning(true)
    setMode('turboType')
    captureTimesRef.current = []

    const startTime = Date.now()
    let snapshotsCreated = 0

    intervalRef.current = window.setInterval(() => {
      const startCapture = Date.now()
      
      // Simulate fast typing by appending text
      const randomText = generateRandomText(Math.floor(Math.random() * 50) + 10)
      // This would integrate with the editor's content atom
      
      editorTimeTravel.capture('turbo-type', {
        delta: { added: randomText.length, removed: 0 }
      })
      
      const captureTime = Date.now() - startCapture
      captureTimesRef.current.push(captureTime)
      snapshotsCreated++

      // Update stats every second
      if (snapshotsCreated % 10 === 0) {
        const avgTime = captureTimesRef.current.reduce((a, b) => a + b, 0) / captureTimesRef.current.length
        const maxTime = Math.max(...captureTimesRef.current)
        
        setStats({
          snapshotsCreated,
          avgCaptureTime: avgTime,
          maxCaptureTime: maxTime,
          totalTextLength: snapshotsCreated * 30, // Approximate
          startTime
        })
      }
    }, 100) // 10 updates per second
  }, [])

  const startSnapshotStorm = useCallback(() => {
    setIsRunning(true)
    setMode('storm')
    captureTimesRef.current = []

    const startTime = Date.now()
    let snapshotsCreated = 0

    const runStorm = async () => {
      for (let i = 0; i < 100; i++) {
        const startCapture = Date.now()
        
        editorTimeTravel.capture(`storm-${i}`, {
          test: true,
          index: i
        })
        
        const captureTime = Date.now() - startCapture
        captureTimesRef.current.push(captureTime)
        snapshotsCreated++

        // Small delay to prevent blocking
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      const avgTime = captureTimesRef.current.reduce((a, b) => a + b, 0) / captureTimesRef.current.length
      const maxTime = Math.max(...captureTimesRef.current)
      
      setStats({
        snapshotsCreated,
        avgCaptureTime: avgTime,
        maxCaptureTime: maxTime,
        totalTextLength: 0,
        startTime
      })
      
      setIsRunning(false)
      setMode('idle')
    }

    runStorm()
  }, [])

  const stopTest = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRunning(false)
    setMode('idle')
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    isRunning,
    mode,
    stats,
    startTurboType,
    startSnapshotStorm,
    stopTest
  }
}
```

### Performance Monitor Component

```typescript
// components/Performance/PerformanceMonitor.tsx
import { useEffect, useState } from 'react'
import { useStressTest } from '@/hooks/useStressTest'
import { editorTimeTravel } from '@/store/timeTravel'

export function PerformanceMonitor() {
  const { isRunning, mode, stats, startTurboType, startSnapshotStorm, stopTest } = useStressTest()
  const [metrics, setMetrics] = useState({
    fps: 60,
    memory: { used: 0, total: 0 },
    historySize: 0
  })

  // FPS monitoring
  useEffect(() => {
    let lastTime = performance.now()
    let frames = 0
    let fps = 60

    const measureFPS = () => {
      const currentTime = performance.now()
      frames++

      if (currentTime - lastTime >= 1000) {
        fps = frames
        frames = 0
        lastTime = currentTime
      }

      setMetrics(prev => ({ ...prev, fps }))
      requestAnimationFrame(measureFPS)
    }

    const rafId = requestAnimationFrame(measureFPS)
    return () => cancelAnimationFrame(rafId)
  }, [])

  // Memory monitoring (if available)
  useEffect(() => {
    const measureMemory = () => {
      if ('memory' in performance) {
        const mem = (performance as any).memory
        setMetrics(prev => ({
          ...prev,
          memory: {
            used: Math.round(mem.usedJSHeapSize / 1048576),
            total: Math.round(mem.totalJSHeapSize / 1048576)
          }
        }))
      }
    }

    const interval = setInterval(measureMemory, 1000)
    return () => clearInterval(interval)
  }, [])

  // History size monitoring
  useEffect(() => {
    const updateHistorySize = () => {
      const history = editorTimeTravel.getHistory()
      setMetrics(prev => ({
        ...prev,
        historySize: history.length
      }))
    }

    updateHistorySize()
    const interval = setInterval(updateHistorySize, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="performance-monitor">
      <div className="monitor-header">
        <h3>⚡ Performance Monitor</h3>
        <div className="monitor-controls">
          {!isRunning ? (
            <>
              <button onClick={startTurboType}>▶ Turbo Type</button>
              <button onClick={startSnapshotStorm}>💾 Snapshot Storm</button>
            </>
          ) : (
            <button onClick={stopTest} className="stop">■ Stop</button>
          )}
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">FPS</div>
          <div className={`metric-value ${metrics.fps < 30 ? 'warning' : 'good'}`}>
            {metrics.fps}
          </div>
          <div className="metric-bar">
            <div
              className={`bar ${metrics.fps < 30 ? 'warning' : 'good'}`}
              style={{ width: `${(metrics.fps / 60) * 100}%` }}
            />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Memory</div>
          <div className="metric-value">{metrics.memory.used} MB</div>
          <div className="metric-detail">
            {metrics.memory.total > 0
              ? `${Math.round(metrics.memory.used / metrics.memory.total * 100)}% of ${metrics.memory.total} MB`
              : 'N/A'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Snapshots</div>
          <div className="metric-value">{metrics.historySize}</div>
          <div className="metric-detail">max: 100</div>
        </div>
      </div>

      {stats && (
        <div className="stress-test-stats">
          <h4>Stress Test Statistics</h4>
          <div className="stats-grid">
            <div>Snapshots created: {stats.snapshotsCreated}</div>
            <div>Avg capture time: {stats.avgCaptureTime.toFixed(2)} ms</div>
            <div>Max capture time: {stats.maxCaptureTime.toFixed(2)} ms</div>
            <div>Total text: {stats.totalTextLength} chars</div>
            <div>Duration: {((Date.now() - stats.startTime) / 1000).toFixed(1)}s</div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### CSS для мониторинга

```css
/* components/Performance/PerformanceMonitor.css */
.performance-monitor {
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 16px 0;
}

.metric-card {
  background: var(--background);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-primary);
}

.metric-value.good {
  color: var(--success);
}

.metric-value.warning {
  color: var(--warning);
}

.metric-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}

.metric-bar .bar {
  height: 100%;
  transition: width 0.3s ease;
}

.metric-bar .bar.good {
  background: var(--success);
}

.metric-bar .bar.warning {
  background: var(--warning);
}

.stress-test-stats {
  margin-top: 16px;
  padding: 12px;
  background: var(--background);
  border-radius: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 8px;
  font-size: 14px;
}
```

## 📊 Ожидаемые результаты

| Метрика | Цель | Максимум |
|---------|------|----------|
| FPS при нагрузке | 60 | 30 |
| Время захвата снимка | < 30ms | 50ms |
| Потребление памяти (100 снимков) | < 50MB | 100MB |
| Delta размер снимка | < 500 bytes | 2KB |
| Время восстановления | < 50ms | 100ms |

## ✅ Критерии приемки

- [ ] FPS остается стабильным при нагрузке
- [ ] Время захвата снимка < 50ms
- [ ] Память растет линейно, не экспоненциально
- [ ] Delta-сжатие эффективно
- [ ] Навигация по истории плавная
- [ ] Нет утечек памяти при длительном тесте

## 🔗 Связанные use case'ы

- [[UC-001]](./UC-001.md) — Базовое редактирование
- [[UC-002]](./UC-002.md) — Массовое редактирование
- [[UC-011]](./UC-011.md) — Оптимизация памяти

## 📝 Заметки

- Интеграция с Chrome DevTools Performance API
- Возможность экспорта метрик
- Сравнение разных конфигураций time-travel
