# UC-005: Jump to Snapshot по клику (Click to Restore)

## 📋 Описание

Демонстрация мгновенного восстановления состояния редактора при клике на снимок в списке истории.

## 🎯 Цель

Показать простоту и скорость навигации к любой точке истории через прямой клик по снимку в сайдбаре.

## 👤 Персона

**Пользователь, ищущий конкретную версию** — хочет быстро вернуться к определенной версии документа, которую видит в списке.

## 📖 Предусловия

- В сайдбаре отображается список снимков (минимум 5)
- Каждый снимок имеет визуальную индикацию (иконка, время, дельта)

## 🔄 Поток

### Сценарий 1: Клик по снимку в списке

1. **Пользователь видит список снимков в сайдбаре**
   - Снимки отсортированы по времени (новые сверху)
   - Текущий снимок выделен
   - Каждый снимок показывает краткую информацию

2. **Пользователь кликает на снимок**
   - Визуальный feedback при наведении (hover)
   - Клик вызывает подтверждение (опционально для больших изменений)
   - Система выполняет `jumpTo(index)`

3. **Состояние редактора обновляется**
   - Мгновенное восстановление содержимого
   - Анимация перехода (fade/morph)
   - Индикатор позиции на timeline обновляется
   - Выделение перемещается на выбранный снимок

### Сценарий 2: Клик с подтверждением

1. **Пользователь кликает на снимок с большим delta**
   - Система обнаруживает значительные изменения (>500 символов)
   - Показывает tooltip/modal с подтверждением
   - "Перейти к этой версии? Изменения: +1234 / -567 символов"

2. **Пользователь подтверждает**
   - Выполняется переход
   - Снимок запоминается для быстрого доступа

### Сценарий 3: Double-click для предпросмотра

1. **Пользователь делает double-click по снимку**
   - Открывается preview modal
   - Показывает содержимое снимка без перехода
   - Кнопки "Restore" и "Close"

## 🎨 UI Элементы

```
┌──────────────────────────────────────────────┐
│ 📸 Snapshots (15)               [🔍 Search]  │
├──────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐ │
│ │ 📝 v15          [CURRENT] ✓              │ │
│ │ Function update                          │ │
│ │ 12:45:32        +124 chars               │ │
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │ 📝 v14          ← Hover                  │ │
│ │ Paragraph added                          │ │
│ │ 12:45:28        +512 chars      [●]      │ │
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │ 📝 v13                                   │ │
│ │ Text deleted                             │ │
│ │ 12:45:15        -89 chars                │ │
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │ 📝 v12                                   │ │
│ │ Initial draft                            │ │
│ │ 12:44:50        1,234 chars              │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [Select All] [Compare] [Restore] [Export]   │
└──────────────────────────────────────────────┘
```

## 🔧 Техническая реализация

### Атомы списка снимков

```typescript
// store/atoms/snapshots.ts
import { atom } from '@nexus-state/core'

export interface SnapshotItem {
  id: string
  index: number
  timestamp: number
  action: string
  delta?: {
    added: number
    removed: number
  }
  isCurrent: boolean
  isSelected: boolean
}

export const snapshotsListAtom = atom<SnapshotItem[]>(
  (get) => {
    const timeTravel = getTimeTravel()
    const history = timeTravel.getHistory()
    const currentIndex = timeTravel.getCurrentIndex?.() ?? history.length - 1

    return history.map((snapshot, index) => ({
      id: snapshot.id,
      index,
      timestamp: snapshot.timestamp,
      action: snapshot.metadata?.action || 'Unknown',
      delta: snapshot.metadata?.delta,
      isCurrent: index === currentIndex,
      isSelected: false
    }))
  },
  'snapshots.list'
)

export const selectedSnapshotIndexAtom = atom<number | null>(
  null,
  'snapshots.selected.index'
)
```

### Хук для работы со снимками

```typescript
// hooks/useSnapshots.ts
import { useState, useCallback, useMemo } from 'react'
import { editorTimeTravel } from '@/store/timeTravel'
import type { Snapshot } from '@nexus-state/core'

export function useSnapshots() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const history = useMemo(
    () => editorTimeTravel.getHistory(),
    [] // Refresh через подписку
  )

  const currentIndex = useMemo(
    () => history.length - 1,
    [history.length]
  )

  const jumpToSnapshot = useCallback((index: number): boolean => {
    const success = editorTimeTravel.jumpTo(index)
    if (success) {
      setSelectedIndex(index)
    }
    return success
  }, [])

  const selectSnapshot = useCallback((index: number, snapshotId: string) => {
    if (compareMode) {
      setSelectedIds(prev => {
        if (prev.includes(snapshotId)) {
          return prev.filter(id => id !== snapshotId)
        }
        if (prev.length >= 2) {
          return [prev[1], snapshotId]
        }
        return [...prev, snapshotId]
      })
    } else {
      setSelectedIndex(index)
      jumpToSnapshot(index)
    }
  }, [compareMode, jumpToSnapshot])

  const restoreSnapshot = useCallback((index: number) => {
    return jumpToSnapshot(index)
  }, [jumpToSnapshot])

  const getSnapshotById = useCallback((id: string): Snapshot | null => {
    return editorTimeTravel.getSnapshotById?.(id) || null
  }, [])

  const getSnapshotByIndex = useCallback((index: number): Snapshot | null => {
    return history[index] || null
  }, [history])

  const toggleCompareMode = useCallback(() => {
    setCompareMode(prev => !prev)
    setSelectedIds([])
  }, [])

  return {
    history,
    currentIndex,
    selectedIndex,
    selectedIds,
    compareMode,
    jumpToSnapshot,
    selectSnapshot,
    restoreSnapshot,
    getSnapshotById,
    getSnapshotByIndex,
    toggleCompareMode
  }
}
```

### Snapshot List Component

```typescript
// components/Snapshots/SnapshotList.tsx
import { useSnapshots } from '@/hooks/useSnapshots'
import { SnapshotItem } from './SnapshotItem'

export function SnapshotList() {
  const { history, currentIndex, selectSnapshot } = useSnapshots()

  return (
    <div className="snapshot-list">
      <div className="list-header">
        <h3>Snapshots ({history.length})</h3>
        <input
          type="text"
          placeholder="Search snapshots..."
          className="search-input"
        />
      </div>

      <div className="list-content">
        {history.slice().reverse().map((snapshot, reverseIndex) => {
          const index = history.length - 1 - reverseIndex
          return (
            <SnapshotItem
              key={snapshot.id}
              snapshot={snapshot}
              index={index}
              isCurrent={index === currentIndex}
              onClick={() => selectSnapshot(index, snapshot.id)}
            />
          )
        })}
      </div>

      <div className="list-actions">
        <button disabled>Select All</button>
        <button disabled>Compare</button>
        <button disabled>Restore</button>
        <button disabled>Export</button>
      </div>
    </div>
  )
}
```

### Snapshot Item Component

```typescript
// components/Snapshots/SnapshotItem.tsx
import { useState } from 'react'
import type { Snapshot } from '@nexus-state/core'

interface SnapshotItemProps {
  snapshot: Snapshot
  index: number
  isCurrent: boolean
  onClick: () => void
}

export function SnapshotItem({ snapshot, index, isCurrent, onClick }: SnapshotItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const delta = snapshot.metadata?.delta

  const getIcon = () => {
    const action = snapshot.metadata?.action || ''
    if (action.includes('insert') || action.includes('add')) return '📝'
    if (action.includes('delete')) return '🗑️'
    if (action.includes('replace')) return '🔄'
    if (action.includes('initial')) return '🌟'
    return '📄'
  }

  const getDeltaDisplay = () => {
    if (!delta) return null
    if (delta.added > 0 && delta.removed > 0) {
      return (
        <span className="delta-mixed">
          <span className="added">+{delta.added}</span>
          <span className="removed">-{delta.removed}</span>
        </span>
      )
    }
    if (delta.added > 0) {
      return <span className="delta-added">+{delta.added} chars</span>
    }
    if (delta.removed > 0) {
      return <span className="delta-removed">-{delta.removed} chars</span>
    }
    return null
  }

  return (
    <div
      className={`snapshot-item ${isCurrent ? 'current' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="item-icon">{getIcon()}</div>

      <div className="item-content">
        <div className="item-title">
          <span>{snapshot.metadata?.action || 'Snapshot'}</span>
          {isCurrent && <span className="current-badge">CURRENT</span>}
        </div>

        <div className="item-meta">
          <span className="item-time">
            {formatTime(snapshot.timestamp)}
          </span>
          {getDeltaDisplay()}
        </div>
      </div>

      {isHovered && !isCurrent && (
        <div className="item-indicator">
          <span className="click-hint">Click to restore</span>
        </div>
      )}
    </div>
  )
}
```

### Анимация перехода

```css
/* components/Snapshots/SnapshotItem.css */
.snapshot-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.snapshot-item:hover {
  background: rgba(99, 102, 241, 0.1);
  transform: translateX(4px);
}

.snapshot-item.current {
  background: rgba(99, 102, 241, 0.2);
  border-left: 3px solid #6366F1;
}

.snapshot-item.current .current-badge {
  background: #6366F1;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  margin-left: 8px;
}

/* Editor transition */
.editor-content {
  transition: opacity 0.2s ease;
}

.editor-content.updating {
  opacity: 0.5;
}
```

## 📊 Ожидаемые результаты

| Метрика | Значение |
|---------|----------|
| Время восстановления | < 50ms |
| Задержка UI feedback | < 10ms |
| Плавность анимации | 60 FPS |

## ✅ Критерии приемки

- [ ] Клик по снимку восстанавливает состояние
- [ ] Визуальный feedback при наведении
- [ ] Текущий снимок выделен
- [ ] Timeline обновляется синхронно
- [ ] Анимация перехода плавная

## 🔗 Связанные use case'ы

- [[UC-003]](./UC-003.md) — Undo/Redo навигация
- [[UC-004]](./UC-004.md) — Сравнение версий
- [[UC-008]](./UC-008.md) — Авто-проигрывание

## 📝 Заметки

- Поддержка keyboard navigation (Arrow keys, Enter)
- Контекстное меню для дополнительных действий
- Быстрый поиск/фильтрация снимков
