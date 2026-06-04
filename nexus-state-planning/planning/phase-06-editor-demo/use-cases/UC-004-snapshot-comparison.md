# UC-004: Сравнение версий (Snapshot Comparison)

## 📋 Описание

Демонстрация сравнения двух снимков состояния с визуализацией различий (diff) и статистикой изменений.

## 🎯 Цель

Показать возможности Nexus State по сравнению снимков, визуализации изменений и анализу различий между версиями документа.

## 👤 Персона

**Редактор/Автор** — хочет увидеть, что изменилось между двумя версиями документа, понять масштаб правок.

## 📖 Предусловия

- В истории есть минимум 3 снимка
- Снимки содержат различные состояния текста

## 🔄 Поток

### Сценарий 1: Сравнение двух снимков

1. **Пользователь активирует режим сравнения**
   - Нажимает кнопку "Compare" в сайдбаре
   - Интерфейс переходит в режим multi-select

2. **Пользователь выбирает два снимка**
   - Клик по первому снимку (baseline)
   - Клик по второму снимку (comparison)
   - Система автоматически вычисляет различия

3. **Отображается diff view**
   - Открывается панель сравнения
   - Показываются удаленные (красный) и добавленные (зеленый) фрагменты
   - Отображается статистика изменений

### Сценарий 2: Inline diff

1. **Пользователь выбирает режим "Inline"**
   - Изменения показываются в одном потоке текста
   - Удаленный текст: ~~зачеркнутый красный~~
   - Добавленный текст: **подчеркнутый зеленый**

### Сценарий 3: Split diff

1. **Пользователь выбирает режим "Split"**
   - Две колонки: слева старая версия, справа новая
   - Синхронная прокрутка колонок
   - Подсветка различий в обеих колонках

## 🎨 UI Элементы

```
┌─────────────────────────────────────────────────────────────────┐
│ Compare Snapshots                                    [× Close]  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────────────┐   │
│  │ 📝 v12          │  │ 📝 v15                              │   │
│  │ 12:44:50        │  │ 12:45:32                            │   │
│  │ 1,110 chars     │  │ 1,234 chars                         │   │
│  └─────────────────┘  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│ [Inline] [Split] [Unified]    Stats: +124 / -89 chars          │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Lorem ipsum dolor sit amet, consectetur adipiscing elit.    │ │
│ │                                                             │ │
│ │ - Sed do eiusmod tempor incididunt ut labore et dolore.     │ │
│ │ + Sed do eiusmod tempor incididunt ut labore et dolore      │ │
│ │ + magna aliqua.                                             │ │
│ │                                                             │ │
│ │ - Ut enim ad minim veniam, quis nostrud exercitation.       │ │
│ │ + Ut enim ad minim veniam, quis nostrud exercitation        │ │
│ │   ullamco laboris nisi ut aliquip ex ea commodo.            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Техническая реализация

### Атомы сравнения

```typescript
// store/atoms/comparison.ts
import { atom } from '@nexus-state/core'

export interface ComparisonState {
  isActive: boolean
  baselineId: string | null
  comparisonId: string | null
  mode: 'inline' | 'split' | 'unified'
  result: SnapshotComparison | null
}

export const comparisonAtom = atom<ComparisonState>({
  isActive: false,
  baselineId: null,
  comparisonId: null,
  mode: 'inline',
  result: null
}, 'comparison.state')

export const comparisonStatsAtom = atom(
  (get) => {
    const comparison = get(comparisonAtom)
    if (!comparison.result) return null

    return {
      added: comparison.result.added.length,
      removed: comparison.result.removed.length,
      unchanged: comparison.result.unchanged.length,
      changedPercent: Math.round(
        (comparison.result.added.length + comparison.result.removed.length) /
        comparison.result.unchanged.length * 100
      )
    }
  },
  'comparison.stats'
)
```

### Хук для сравнения

```typescript
// hooks/useSnapshotComparison.ts
import { useState, useCallback, useMemo } from 'react'
import { editorTimeTravel } from '@/store/timeTravel'
import type { Snapshot } from '@nexus-state/core'

export function useSnapshotComparison() {
  const [baseline, setBaseline] = useState<Snapshot | null>(null)
  const [comparison, setComparison] = useState<Snapshot | null>(null)
  const [mode, setMode] = useState<'inline' | 'split' | 'unified'>('inline')

  const compare = useCallback(() => {
    if (!baseline || !comparison) return null

    const result = editorTimeTravel.compareSnapshots(
      baseline,
      comparison,
      {
        ignoreWhitespace: false,
        ignoreCase: false,
        contextLines: 2
      }
    )

    return result
  }, [baseline, comparison])

  const result = useMemo(() => compare(), [compare])

  const selectBaseline = useCallback((snapshot: Snapshot) => {
    setBaseline(snapshot)
    if (comparison) {
      // Auto-compare if both selected
    }
  }, [comparison])

  const selectComparison = useCallback((snapshot: Snapshot) => {
    setComparison(snapshot)
  }, [])

  const reset = useCallback(() => {
    setBaseline(null)
    setComparison(null)
  }, [])

  return {
    baseline,
    comparison,
    mode,
    result,
    setMode,
    selectBaseline,
    selectComparison,
    reset,
    isComparing: baseline !== null && comparison !== null
  }
}
```

### Diff Visualization Component

```typescript
// components/Snapshots/SnapshotDiff.tsx
import { useSnapshotComparison } from '@/hooks/useSnapshotComparison'
import type { DiffChunk } from '@nexus-state/core'

export function SnapshotDiff() {
  const { baseline, comparison, mode, result, setMode } = useSnapshotComparison()

  if (!result) return null

  return (
    <div className="snapshot-diff-modal">
      <div className="diff-header">
        <div className="snapshot-info">
          <h3>{baseline?.metadata?.action || 'Baseline'}</h3>
          <span className="time">{formatDateTime(baseline?.timestamp)}</span>
          <span className="chars">{baseline?.state?.content?.length} chars</span>
        </div>

        <div className="diff-modes">
          <button
            className={mode === 'inline' ? 'active' : ''}
            onClick={() => setMode('inline')}
          >
            Inline
          </button>
          <button
            className={mode === 'split' ? 'active' : ''}
            onClick={() => setMode('split')}
          >
            Split
          </button>
          <button
            className={mode === 'unified' ? 'active' : ''}
            onClick={() => setMode('unified')}
          >
            Unified
          </button>
        </div>

        <div className="snapshot-info comparison">
          <h3>{comparison?.metadata?.action || 'Comparison'}</h3>
          <span className="time">{formatDateTime(comparison?.timestamp)}</span>
          <span className="chars">{comparison?.state?.content?.length} chars</span>
        </div>
      </div>

      <div className="diff-stats">
        <span className="added">+{result.added.length} chars</span>
        <span className="removed">-{result.removed.length} chars</span>
        <span className="unchanged">{result.unchanged.length} unchanged</span>
      </div>

      <div className={`diff-view ${mode}`}>
        {mode === 'split' ? (
          <SplitDiffView result={result} />
        ) : mode === 'unified' ? (
          <UnifiedDiffView result={result} />
        ) : (
          <InlineDiffView result={result} />
        )}
      </div>
    </div>
  )
}
```

### Inline Diff Renderer

```typescript
// components/Snapshots/InlineDiffView.tsx
import type { SnapshotComparison } from '@nexus-state/core'

export function InlineDiffView({ result }: { result: SnapshotComparison }) {
  return (
    <div className="inline-diff">
      {result.chunks.map((chunk, index) => (
        <div key={index} className={`diff-chunk ${chunk.type}`}>
          {chunk.type === 'added' && (
            <span className="diff-added">{chunk.text}</span>
          )}
          {chunk.type === 'removed' && (
            <span className="diff-removed">
              <del>{chunk.text}</del>
            </span>
          )}
          {chunk.type === 'unchanged' && (
            <span className="diff-unchanged">{chunk.text}</span>
          )}
        </div>
      ))}
    </div>
  )
}
```

### Split Diff Renderer

```typescript
// components/Snapshots/SplitDiffView.tsx
import { useState, useRef } from 'react'
import type { SnapshotComparison } from '@nexus-state/core'

export function SplitDiffView({ result }: { result: SnapshotComparison }) {
  const [scrollSync, setScrollSync] = useState(true)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)

  const handleScroll = (source: 'left' | 'right') => (e: UIEvent) => {
    if (!scrollSync) return

    const target = e.target as HTMLDivElement
    const other = source === 'left' ? rightRef.current : leftRef.current

    if (other) {
      other.scrollTop = target.scrollTop
      other.scrollLeft = target.scrollLeft
    }
  }

  return (
    <div className="split-diff">
      <div className="sync-toggle">
        <label>
          <input
            type="checkbox"
            checked={scrollSync}
            onChange={(e) => setScrollSync(e.target.checked)}
          />
          Sync scroll
        </label>
      </div>

      <div className="split-panels">
        <div
          ref={leftRef}
          className="diff-panel old"
          onScroll={handleScroll('left')}
        >
          <div className="panel-header">Before</div>
          <pre className="diff-content">
            {result.originalText}
          </pre>
        </div>

        <div
          ref={rightRef}
          className="diff-panel new"
          onScroll={handleScroll('right')}
        >
          <div className="panel-header">After</div>
          <pre className="diff-content">
            {result.modifiedText}
          </pre>
        </div>
      </div>
    </div>
  )
}
```

### Snapshot Comparator Integration

```typescript
// time-travel/comparison/SnapshotComparator.ts (существующий)
// Использование в SimpleTimeTravel:

export class SimpleTimeTravel {
  // ... existing code ...

  compareSnapshots(
    a: Snapshot | string,
    b: Snapshot | string,
    options?: Partial<ComparisonOptions>
  ): SnapshotComparison {
    const snapshotA = typeof a === 'string' ? this.getSnapshotById(a) : a
    const snapshotB = typeof b === 'string' ? this.getSnapshotById(b) : b

    if (!snapshotA || !snapshotB) {
      throw new Error('Invalid snapshot reference')
    }

    return this.snapshotComparator.compare(snapshotA, snapshotB, options)
  }
}
```

## 📊 Ожидаемые результаты

| Метрика | Значение |
|---------|----------|
| Время вычисления diff (1000 chars) | < 50ms |
| Время вычисления diff (10000 chars) | < 200ms |
| Плавность прокрутки split view | 60 FPS |
| Точность синхронизации скролла | < 10ms задержка |

## ✅ Критерии приемки

- [ ] Выбор двух снимков для сравнения
- [ ] Три режима отображения (Inline, Split, Unified)
- [ ] Корректная подсветка добавленного/удаленного
- [ ] Статистика изменений отображается
- [ ] Синхронная прокрутка в split режиме
- [ ] Закрытие сравнения возвращает к обычному виду

## 🔗 Связанные use case'ы

- [[UC-002]](./UC-002.md) — Массовое редактирование
- [[UC-005]](./UC-005.md) — Jump to Snapshot
- [[UC-009]](./UC-009.md) — Экспорт diff

## 📝 Заметки

- Использовать существующий `SnapshotComparator` из Nexus State
- Оптимизировать для больших документов (>10K символов)
- Добавить возможность копирования diff
