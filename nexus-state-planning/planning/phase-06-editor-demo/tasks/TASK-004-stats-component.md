# TASK-004: Компонент статистики редактора (Editor Stats)

## 📋 Описание

Создание компонента отображения статистики редактора: количество символов, слов, строк, время чтения, индикатор сохранения.

## 🎯 Цель

Предоставить пользователю обратную связь о документе в реальном времени и показать статус сохранения снимков time-travel.

## 📦 Технические требования

### Отображаемые метрики

- Количество символов (с пробелами / без)
- Количество слов
- Количество строк
- Время чтения (в минутах)
- Статус последнего сохранения (время / индикатор)

### Обновление

- Debounce 300ms для производительности
- Реактивное обновление через Nexus State

## ✅ Задачи

### 4.1: Создание компонента EditorStats

**src/components/Editor/EditorStats.tsx:**
```typescript
import React from 'react'
import { useAtom } from '@nexus-state/react'
import { statsAtom, lastSavedAtom, isDirtyAtom } from '@/store/atoms'
import { editorStore } from '@/store/store'
import { Clock, Save, Edit3 } from 'lucide-react'
import './EditorStats.css'

export function EditorStats() {
  const stats = useAtom(statsAtom, editorStore)
  const lastSaved = useAtom(lastSavedAtom, editorStore)
  const isDirty = useAtom(isDirtyAtom, editorStore)

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never'
    
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 1000) return 'Just now'
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    
    return new Date(timestamp).toLocaleTimeString()
  }

  const formatReadingTime = (minutes: number) => {
    if (minutes < 1) return '< 1 min'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="editor-stats">
      <div className="stats-group">
        <div className="stat-item">
          <span className="stat-value">{stats.characters.toLocaleString()}</span>
          <span className="stat-label">Characters</span>
        </div>
        
        <div className="stat-divider" />
        
        <div className="stat-item">
          <span className="stat-value">{stats.words.toLocaleString()}</span>
          <span className="stat-label">Words</span>
        </div>
        
        <div className="stat-divider" />
        
        <div className="stat-item">
          <span className="stat-value">{stats.lines.toLocaleString()}</span>
          <span className="stat-label">Lines</span>
        </div>
        
        <div className="stat-divider" />
        
        <div className="stat-item">
          <Clock size={14} className="stat-icon" />
          <span className="stat-value">{formatReadingTime(stats.readingTime)}</span>
          <span className="stat-label">Read</span>
        </div>
      </div>
      
      <div className="stats-save-status">
        {isDirty ? (
          <div className="save-status saving">
            <Edit3 size={14} className="status-icon" />
            <span>Unsaved changes</span>
          </div>
        ) : lastSaved ? (
          <div className="save-status saved">
            <Save size={14} className="status-icon" />
            <span>Saved {formatTime(lastSaved)}</span>
          </div>
        ) : (
          <div className="save-status">
            <span className="text-muted">Not saved yet</span>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 4.2: Стили компонента

**src/components/Editor/EditorStats.css:**
```css
.editor-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}

.stats-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: var(--border);
}

.stat-icon {
  color: var(--primary);
  margin-bottom: 2px;
}

.stats-save-status {
  display: flex;
  align-items: center;
}

.save-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.save-status.saving {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.save-status.saved {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.status-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.text-muted {
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 768px) {
  .editor-stats {
    flex-direction: column;
    gap: 8px;
    padding: 8px 12px;
  }
  
  .stats-group {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .stat-divider {
    display: none;
  }
}
```

### 4.3: Хук для обновления статуса сохранения

**src/hooks/useSaveStatus.ts:**
```typescript
import { useEffect } from 'react'
import { useAtom } from '@nexus-state/react'
import { isDirtyAtom, lastSavedAtom } from '@/store/atoms'
import { editorTimeTravel } from '@/store/timeTravel'

/**
 * Хук для отслеживания статуса сохранения
 * Обновляет lastSavedAtom при создании снимка time-travel
 */
export function useSaveStatus() {
  const [isDirty, setIsDirty] = useAtom(isDirtyAtom)
  const [lastSaved, setLastSaved] = useAtom(lastSavedAtom)

  useEffect(() => {
    // Подписка на события time-travel
    const unsubscribe = editorTimeTravel.subscribeToSnapshots((snapshot) => {
      setLastSaved(snapshot.timestamp)
      setIsDirty(false)
    })

    return unsubscribe
  }, [setIsDirty, setLastSaved])

  // Пометить как "грязный" при изменении контента
  // Это должно вызываться из компонента редактора
  const markDirty = () => {
    setIsDirty(true)
  }

  return { isDirty, lastSaved, markDirty }
}
```

### 4.4: Интеграция в App

**src/App.tsx:**
```typescript
import './App.css'
import { Editor } from './components/Editor'
import { EditorStats } from './components/Editor/EditorStats'

function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <header className="h-16 border-b border-slate-700 flex items-center px-6">
        <h1 className="text-xl font-bold">📝 Editor Demo</h1>
      </header>
      
      <main className="flex h-[calc(100vh-4rem)]">
        <div className="flex-1 flex flex-col">
          <EditorStats />
          <Editor placeholder="Start typing..." />
        </div>
        
        <aside className="w-80 border-l border-slate-700 p-4">
          <p className="text-slate-400">Snapshots placeholder</p>
        </aside>
      </main>
    </div>
  )
}

export default App
```

### 4.5: Опционально — расширенная статистика

**src/components/Editor/EditorStatsExpanded.tsx:**
```typescript
import React from 'react'
import { useAtom } from '@nexus-state/react'
import { statsAtom } from '@/store/atoms'
import { editorStore } from '@/store/store'
import { BarChart3, Type, AlignLeft } from 'lucide-react'

export function EditorStatsExpanded() {
  const stats = useAtom(statsAtom, editorStore)

  const avgWordLength = stats.words > 0
    ? (stats.charactersNoSpaces / stats.words).toFixed(1)
    : 0

  const avgLineLength = stats.lines > 0
    ? (stats.characters / stats.lines).toFixed(1)
    : 0

  return (
    <div className="editor-stats-expanded">
      <h4 className="stats-title">Detailed Statistics</h4>
      
      <div className="stats-grid">
        <div className="stat-card">
          <Type size={20} className="stat-card-icon" />
          <div className="stat-card-value">{avgWordLength}</div>
          <div className="stat-card-label">Avg word length</div>
        </div>
        
        <div className="stat-card">
          <AlignLeft size={20} className="stat-card-icon" />
          <div className="stat-card-value">{avgLineLength}</div>
          <div className="stat-card-label">Avg line length</div>
        </div>
        
        <div className="stat-card">
          <BarChart3 size={20} className="stat-card-icon" />
          <div className="stat-card-value">{stats.charactersNoSpaces}</div>
          <div className="stat-card-label">Chars (no spaces)</div>
        </div>
      </div>
    </div>
  )
}
```

## 🧪 Критерии приемки

- [ ] Статистика отображается корректно
- [ ] Значения обновляются в реальном времени
- [ ] Debounce работает (нет мерцания)
- [ ] Индикатор сохранения обновляется
- [ ] Адаптивный дизайн для мобильных
- [ ] Нет утечек памяти (подписки отписываются)

## 📁 Зависимости

- [[TASK-001]](./TASK-001-project-setup.md) — Настройка проекта
- [[TASK-002]](./TASK-002-store-atoms.md) — Создание атомов и store
- [[TASK-003]](./TASK-003-editor-component.md) — Базовый компонент редактора

## 🔗 Связанные задачи

- [[TASK-005]](./TASK-005-debounce-snapshots.md) — Debounce для снимков
- [[TASK-006]](./TASK-006-snapshot-list.md) — Список снимков

## 📝 Заметки

- Добавить форматирование для больших чисел (1.2K, 1.5M)
- Опционально: добавить прогресс-бар до следующего снимка
- Рассмотреть возможность кастомизации отображаемых метрик
