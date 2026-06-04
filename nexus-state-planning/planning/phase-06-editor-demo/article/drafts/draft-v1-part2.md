# Time-Travel Debugging с Nexus State (Продолжение)

---

## Шаг 5: Интеграция CodeMirror редактора

Теперь создадим компонент редактора с интеграцией CodeMirror 6 и Nexus State.

Создайте файл `src/components/Editor/Editor.tsx`:

```typescript
import React, { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { useAtomValue, useSetAtom } from '@nexus-state/react'
import { contentAtom, cursorAtom, selectionAtom } from '@/store/atoms'
import { editorStore } from '@/store/store'
import { useDebounceSnapshots } from '@/hooks/useDebounceSnapshots'
import './Editor.css'

export function Editor() {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  
  // Чтение содержимого из store
  const content = useAtomValue(contentAtom, editorStore)
  
  // Запись позиции курсора и выделения
  const setCursor = useSetAtom(cursorAtom, editorStore)
  const setSelection = useSetAtom(selectionAtom, editorStore)
  
  // Debounce для создания снимков
  const { captureSnapshot } = useDebounceSnapshots({
    delay: 1000,
    maxWait: 5000
  })

  // Инициализация CodeMirror
  useEffect(() => {
    if (!editorRef.current) return

    // Создаём view
    const view = new EditorView({
      extensions: [
        basicSetup,
        javascript(),
        oneDark,
        EditorView.updateListener.of((update) => {
          // Обновление содержимого
          if (update.docChanged) {
            const newContent = update.state.doc.toString()
            setContent(newContent)
            
            // Создаём снимок с debounce
            captureSnapshot('text-edit', newContent)
          }
          
          // Обновление позиции курсора
          if (update.selectionSet) {
            const pos = update.state.selection.main.head
            const line = update.state.doc.lineAt(pos)
            setCursor({
              line: line.number - 1,
              col: pos - line.from
            })
          }
        })
      ],
      parent: editorRef.current
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, [])

  // Синхронизация внешних изменений
  useEffect(() => {
    if (viewRef.current && content !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: content
        }
      })
    }
  }, [content])

  return (
    <div className="editor-container">
      <div className="editor-header">
        <span className="editor-title">📝 Editor</span>
        <div className="editor-actions">
          <button onClick={() => captureSnapshot('manual-save', content)}>
            💾 Save
          </button>
          <button onClick={() => setContent('')}>
            🗑️ Clear
          </button>
        </div>
      </div>
      <div ref={editorRef} className="editor-content" />
    </div>
  )
}
```

**Ключевые моменты:**

1. **`useAtomValue`** — подписка на изменения contentAtom
2. **`useSetAtom`** — обновление состояния без подписки (оптимизация)
3. **`EditorView.updateListener`** — отслеживание изменений в CodeMirror
4. **`captureSnapshot`** — создание снимка с debounce

**Стили для редактора** (`src/components/Editor/Editor.css`):

```css
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e293b;
  border-radius: 8px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #0f172a;
  border-bottom: 1px solid #334155;
}

.editor-title {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.editor-actions button {
  padding: 4px 12px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.editor-actions button:hover {
  background: #4f46e5;
}

.editor-content {
  flex: 1;
  overflow: auto;
}

.editor-content .cm-editor {
  height: 100%;
  font-size: 14px;
}
```

---

## Шаг 6: Компонент статистики

Создадим компонент для отображения статистики документа в реальном времени.

`src/components/Editor/EditorStats.tsx`:

```typescript
import { useAtomValue } from '@nexus-state/react'
import { computedStatsAtom, isSavingAtom } from '@/store/atoms'
import { editorStore } from '@/store/store'
import { Zap } from 'lucide-react'
import './EditorStats.css'

export function EditorStats() {
  const stats = useAtomValue(computedStatsAtom, editorStore)
  const isSaving = useAtomValue(isSavingAtom, editorStore)

  return (
    <div className="editor-stats">
      <div className="stats-item">
        <span className="stats-label">Символы:</span>
        <span className="stats-value">{stats.characters}</span>
      </div>
      <div className="stats-item">
        <span className="stats-label">Слова:</span>
        <span className="stats-value">{stats.words}</span>
      </div>
      <div className="stats-item">
        <span className="stats-label">Строки:</span>
        <span className="stats-value">{stats.lines}</span>
      </div>
      <div className="stats-item">
        <span className="stats-label">Курсор:</span>
        <span className="stats-value">
          Ln {stats.lines}, Col {stats.characters}
        </span>
      </div>
      {isSaving && (
        <div className="stats-saving">
          <Zap size={12} />
          <span>Сохранение...</span>
        </div>
      )}
    </div>
  )
}
```

**Стили** (`src/components/Editor/EditorStats.css`):

```css
.editor-stats {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  background: #0f172a;
  border-top: 1px solid #334155;
  font-size: 12px;
  color: #94a3b8;
}

.stats-item {
  display: flex;
  gap: 4px;
}

.stats-label {
  color: #64748b;
}

.stats-value {
  color: #f8fafc;
  font-weight: 500;
}

.stats-saving {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #10b981;
  margin-left: auto;
}
```

---

## Шаг 7: Timeline slider для навигации

Один из ключевых компонентов для time-travel — визуальный timeline для навигации по истории.

`src/components/Timeline/TimelineSlider.tsx`:

```typescript
import { useState, useCallback, useEffect } from 'react'
import { useTimeTravel } from '@/hooks/useTimeTravel'
import './TimelineSlider.css'

interface TimelineSliderProps {
  height?: number
  showLabels?: boolean
}

export function TimelineSlider({ height = 64, showLabels = true }: TimelineSliderProps) {
  const { currentPosition, snapshotsCount, jumpTo } = useTimeTravel()
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    const slider = e.currentTarget
    const rect = slider.getBoundingClientRect()
    const x = e.clientX - rect.left
    const position = Math.round((x / rect.width) * (snapshotsCount - 1))
    jumpTo(Math.max(0, Math.min(snapshotsCount - 1, position)))
  }, [snapshotsCount, jumpTo])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const slider = document.querySelector('.timeline-slider')
    if (!slider) return
    const rect = (slider as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const position = Math.round((x / rect.width) * (snapshotsCount - 1))
    jumpTo(Math.max(0, Math.min(snapshotsCount - 1, position)))
  }, [isDragging, snapshotsCount, jumpTo])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const progress = snapshotsCount > 0 
    ? (currentPosition / (snapshotsCount - 1)) * 100 
    : 0

  return (
    <div 
      className="timeline-slider"
      style={{ height }}
      onMouseDown={handleMouseDown}
    >
      {/* Прогресс бар */}
      <div 
        className="timeline-progress"
        style={{ width: `${progress}%` }}
      />
      
      {/* Точки снимков */}
      <div className="timeline-dots">
        {Array.from({ length: snapshotsCount }).map((_, i) => (
          <div
            key={i}
            className={`timeline-dot ${i === currentPosition ? 'active' : ''}`}
            style={{ left: `${(i / (snapshotsCount - 1)) * 100}%` }}
          />
        ))}
      </div>
      
      {/* Индикатор текущей позиции */}
      <div 
        className="timeline-indicator"
        style={{ left: `${progress}%` }}
      />
      
      {showLabels && (
        <div className="timeline-labels">
          <span className="timeline-label">
            {snapshotsCount > 0 ? currentPosition + 1 : 0} / {snapshotsCount}
          </span>
        </div>
      )}
    </div>
  )
}
```

**Стили** (`src/components/Timeline/TimelineSlider.css`):

```css
.timeline-slider {
  position: relative;
  background: #1e293b;
  border-top: 1px solid #334155;
  cursor: pointer;
  user-select: none;
}

.timeline-progress {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  transition: width 0.1s;
}

.timeline-dots {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
}

.timeline-dot {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: #64748b;
  border-radius: 50%;
  transition: background 0.2s;
}

.timeline-dot.active {
  background: #f8fafc;
  box-shadow: 0 0 8px rgba(248, 250, 252, 0.5);
}

.timeline-indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #f8fafc;
  transform: translateX(-50%);
  pointer-events: none;
}

.timeline-labels {
  position: absolute;
  bottom: 4px;
  right: 8px;
  font-size: 11px;
  color: #94a3b8;
}
```

---

## Шаг 8: Кнопки навигации (Undo/Redo)

Добавим кнопки для навигации по истории.

`src/components/Timeline/NavigationControls.tsx`:

```typescript
import { useTimeTravel } from '@/hooks/useTimeTravel'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import './NavigationControls.css'

export function NavigationControls() {
  const { canUndo, canRedo, undo, redo, jumpToFirst, jumpToLast } = useTimeTravel()

  return (
    <div className="navigation-controls">
      <button
        onClick={jumpToFirst}
        disabled={!canUndo}
        title="Первый снимок (Home)"
      >
        <ChevronsLeft size={16} />
      </button>
      <button
        onClick={undo}
        disabled={!canUndo}
        title="Отменить (Ctrl+Z)"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        title="Повторить (Ctrl+Y)"
      >
        <ChevronRight size={16} />
      </button>
      <button
        onClick={jumpToLast}
        disabled={!canRedo}
        title="Последний снимок (End)"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  )
}
```

**Стили** (`src/components/Timeline/NavigationControls.css`):

```css
.navigation-controls {
  display: flex;
  gap: 4px;
}

.navigation-controls button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #334155;
  color: #f8fafc;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.navigation-controls button:hover:not(:disabled) {
  background: #6366f1;
}

.navigation-controls button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
```

---

## Шаг 9: Список снимков в сайдбаре

Создадим компонент для отображения истории снимков.

`src/components/Snapshots/SnapshotList.tsx`:

```typescript
import { useSnapshots } from '@/hooks/useSnapshots'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import './SnapshotList.css'

interface SnapshotListProps {
  onSnapshotSelect?: (index: number) => void
}

export function SnapshotList({ onSnapshotSelect }: SnapshotListProps) {
  const { snapshots, jumpToSnapshot } = useSnapshots()

  const handleSelect = (index: number) => {
    jumpToSnapshot(index)
    onSnapshotSelect?.(index)
  }

  return (
    <div className="snapshot-list">
      <div className="snapshot-header">
        <h3>История ({snapshots.length})</h3>
      </div>
      <div className="snapshot-items">
        {snapshots.slice().reverse().map((snapshot, i) => {
          const originalIndex = snapshots.length - 1 - i
          return (
            <div
              key={snapshot.id}
              className={`snapshot-item ${snapshot.isCurrent ? 'current' : ''}`}
              onClick={() => handleSelect(originalIndex)}
            >
              <div className="snapshot-icon">📝</div>
              <div className="snapshot-content">
                <div className="snapshot-title">
                  {snapshot.metadata.action || 'Изменение'}
                </div>
                <div className="snapshot-meta">
                  <span className="snapshot-time">
                    {formatDistanceToNow(snapshot.metadata.timestamp, {
                      addSuffix: true,
                      locale: ru
                    })}
                  </span>
                  {snapshot.metadata.delta && (
                    <span className={`snapshot-delta ${snapshot.metadata.delta.added > 0 ? 'positive' : 'negative'}`}>
                      {snapshot.metadata.delta.added > 0 ? '+' : ''}
                      {snapshot.metadata.delta.added || snapshot.metadata.delta.removed}
                    </span>
                  )}
                </div>
              </div>
              {snapshot.isCurrent && (
                <div className="snapshot-indicator">●</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Стили** (`src/components/Snapshots/SnapshotList.css`):

```css
.snapshot-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e293b;
}

.snapshot-header {
  padding: 12px 16px;
  border-bottom: 1px solid #334155;
}

.snapshot-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
}

.snapshot-items {
  flex: 1;
  overflow-y: auto;
}

.snapshot-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #334155;
  cursor: pointer;
  transition: background 0.2s;
}

.snapshot-item:hover {
  background: #334155;
}

.snapshot-item.current {
  background: #6366f1;
}

.snapshot-icon {
  font-size: 20px;
}

.snapshot-content {
  flex: 1;
  min-width: 0;
}

.snapshot-title {
  font-size: 13px;
  font-weight: 500;
  color: #f8fafc;
  margin-bottom: 4px;
}

.snapshot-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #94a3b8;
}

.snapshot-delta.positive {
  color: #10b981;
}

.snapshot-delta.negative {
  color: #ef4444;
}

.snapshot-indicator {
  color: #10b981;
  font-size: 12px;
}
```

---

_(Продолжение следует...)_

В следующих разделах:
- Хук useTimeTravel для навигации
- Горячие клавиши (Ctrl+Z, Ctrl+Y)
- Diff view для сравнения версий
- Бенчмарки производительности
- Заключение и рекомендации
