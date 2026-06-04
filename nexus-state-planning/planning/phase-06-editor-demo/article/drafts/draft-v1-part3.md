# Time-Travel Debugging с Nexus State (Финал)

---

## Шаг 10: Хук useTimeTravel для навигации

Для удобной работы с time-travel создадим кастомный хук.

`src/hooks/useTimeTravel.ts`:

```typescript
import { useCallback, useEffect, useState, useMemo } from 'react'
import { editorTimeTravel } from '@/store/timeTravel'

export interface UseTimeTravelReturn {
  currentPosition: number
  snapshotsCount: number
  canUndo: boolean
  canRedo: boolean
  jumpTo: (index: number) => boolean
  undo: () => boolean
  redo: () => boolean
  jumpToFirst: () => boolean
  jumpToLast: () => boolean
  getHistory: () => ReturnType<typeof editorTimeTravel.getHistory>
}

export function useTimeTravel(): UseTimeTravelReturn {
  // Состояние для принудительного ре-рендера при изменениях
  const [version, setVersion] = useState(0)

  // Получаем историю снимков
  const history = useMemo(() => {
    const h = editorTimeTravel.getHistory()
    void version // Force re-computation when version changes
    return h
  }, [version])

  const snapshotsCount = history.length

  // Получаем текущую позицию из time-travel
  const canUndo = editorTimeTravel.canUndo()
  const canRedo = editorTimeTravel.canRedo()

  // Вычисляем текущую позицию
  const currentPosition = useMemo(() => {
    if (snapshotsCount === 0) return 0
    if (!canUndo) return 0
    if (!canRedo) return snapshotsCount - 1
    return snapshotsCount - 1
  }, [snapshotsCount, canUndo, canRedo])

  /**
   * Переход к конкретному снимку по индексу
   */
  const jumpTo = useCallback((index: number) => {
    console.log('[useTimeTravel.jumpTo] called with index:', index)
    const success = editorTimeTravel.jumpTo(index)
    console.log('[useTimeTravel.jumpTo] result:', success)
    // После jumpTo принудительно обновляем состояние
    setVersion(v => v + 1)
    return success
  }, [])

  /**
   * Переход к предыдущему снимку (undo)
   */
  const undo = useCallback(() => {
    const success = editorTimeTravel.undo()
    setVersion(v => v + 1)
    return success
  }, [])

  /**
   * Переход к следующему снимку (redo)
   */
  const redo = useCallback(() => {
    const success = editorTimeTravel.redo()
    setVersion(v => v + 1)
    return success
  }, [])

  /**
   * Переход к первому снимку
   */
  const jumpToFirst = useCallback(() => {
    return jumpTo(0)
  }, [jumpTo])

  /**
   * Переход к последнему снимку
   */
  const jumpToLast = useCallback(() => {
    return jumpTo(snapshotsCount - 1)
  }, [jumpTo, snapshotsCount])

  // Подписка на изменения в time-travel для авто-обновления
  useEffect(() => {
    const unsubscribeUndo = editorTimeTravel.subscribe('undo', () => {
      setVersion(v => v + 1)
    })

    const unsubscribeRedo = editorTimeTravel.subscribe('redo', () => {
      setVersion(v => v + 1)
    })

    const unsubscribeJump = editorTimeTravel.subscribe('jump', () => {
      setVersion(v => v + 1)
    })

    const unsubscribeSnapshots = editorTimeTravel.subscribeToSnapshots(() => {
      setVersion(v => v + 1)
    })

    return () => {
      unsubscribeUndo?.()
      unsubscribeRedo?.()
      unsubscribeJump?.()
      unsubscribeSnapshots?.()
    }
  }, [])

  return {
    currentPosition,
    snapshotsCount,
    canUndo,
    canRedo,
    jumpTo,
    undo,
    redo,
    jumpToFirst,
    jumpToLast,
    getHistory: useCallback(() => history, [history])
  }
}
```

---

## Шаг 11: Горячие клавиши (Ctrl+Z, Ctrl+Y)

Добавим поддержку горячих клавиш для undo/redo.

`src/hooks/useHotkeys.ts`:

```typescript
import { useEffect } from 'react'
import { useTimeTravel } from './useTimeTravel'

export function useHotkeys() {
  const { undo, redo } = useTimeTravel()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Проверка на модификаторы (Ctrl/Cmd)
      const isModifierPressed = e.ctrlKey || e.metaKey

      // Undo: Ctrl+Z или Cmd+Z
      if (isModifierPressed && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }

      // Redo: Ctrl+Y или Cmd+Shift+Z
      if (
        isModifierPressed && 
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault()
        redo()
      }

      // Jump to first: Ctrl+Home или Cmd+Home
      if (isModifierPressed && e.key === 'Home') {
        e.preventDefault()
        // Можно добавить jumpToFirst()
      }

      // Jump to last: Ctrl+End или Cmd+End
      if (isModifierPressed && e.key === 'End') {
        e.preventDefault()
        // Можно добавить jumpToLast()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [undo, redo])
}
```

**Использование в App.tsx:**

```typescript
import { useHotkeys } from '@/hooks/useHotkeys'

function App() {
  useHotkeys()
  
  return (
    // ... ваш компонент
  )
}
```

---

## Шаг 12: Diff view для сравнения версий

Создадим компонент для визуального сравнения двух версий.

`src/components/Snapshots/SnapshotDiff.tsx`:

```typescript
import { useMemo } from 'react'
import { useSnapshots } from '@/hooks/useSnapshots'
import './SnapshotDiff.css'

interface SnapshotDiffProps {
  beforeIndex: number
  afterIndex: number
}

export function SnapshotDiff({ beforeIndex, afterIndex }: SnapshotDiffProps) {
  const { snapshots } = useSnapshots()

  const diff = useMemo(() => {
    if (beforeIndex >= snapshots.length || afterIndex >= snapshots.length) {
      return null
    }

    const before = snapshots[beforeIndex]
    const after = snapshots[afterIndex]

    // Простая реализация diff для текста
    const beforeText = before.state['editor.content'] || ''
    const afterText = after.state['editor.content'] || ''

    const beforeLines = beforeText.split('\n')
    const afterLines = afterText.split('\n')

    const changes: Array<{
      type: 'unchanged' | 'added' | 'removed'
      line: number
      content: string
    }> = []

    // Упрощённый diff (для демонстрации)
    const maxLength = Math.max(beforeLines.length, afterLines.length)
    for (let i = 0; i < maxLength; i++) {
      const beforeLine = beforeLines[i]
      const afterLine = afterLines[i]

      if (beforeLine === afterLine) {
        changes.push({
          type: 'unchanged',
          line: i + 1,
          content: beforeLine || ''
        })
      } else {
        if (beforeLine !== undefined) {
          changes.push({
            type: 'removed',
            line: i + 1,
            content: beforeLine
          })
        }
        if (afterLine !== undefined) {
          changes.push({
            type: 'added',
            line: i + 1,
            content: afterLine
          })
        }
      }
    }

    return {
      before,
      after,
      changes,
      stats: {
        added: changes.filter(c => c.type === 'added').length,
        removed: changes.filter(c => c.type === 'removed').length
      }
    }
  }, [beforeIndex, afterIndex, snapshots])

  if (!diff) return null

  return (
    <div className="snapshot-diff">
      <div className="diff-header">
        <div className="diff-title">
          Сравнение версий
        </div>
        <div className="diff-stats">
          <span className="stat-added">+{diff.stats.added}</span>
          <span className="stat-removed">-{diff.stats.removed}</span>
        </div>
      </div>
      <div className="diff-content">
        {diff.changes.map((change, i) => (
          <div key={i} className={`diff-line ${change.type}`}>
            <span className="line-number">{change.line}</span>
            <span className="line-prefix">
              {change.type === 'added' ? '+' : change.type === 'removed' ? '-' : ' '}
            </span>
            <span className="line-content">{change.content || ' '}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Стили** (`src/components/Snapshots/SnapshotDiff.css`):

```css
.snapshot-diff {
  display: flex;
  flex-direction: column;
  background: #1e293b;
  border-radius: 8px;
  overflow: hidden;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #0f172a;
  border-bottom: 1px solid #334155;
}

.diff-title {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
}

.diff-stats {
  display: flex;
  gap: 12px;
  font-size: 13px;
}

.stat-added {
  color: #10b981;
}

.stat-removed {
  color: #ef4444;
}

.diff-content {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  overflow: auto;
  max-height: 400px;
}

.diff-line {
  display: flex;
  padding: 2px 0;
}

.diff-line.unchanged {
  background: transparent;
}

.diff-line.added {
  background: rgba(16, 185, 129, 0.1);
}

.diff-line.removed {
  background: rgba(239, 68, 68, 0.1);
}

.line-number {
  width: 40px;
  text-align: right;
  padding-right: 8px;
  color: #64748b;
  user-select: none;
}

.line-prefix {
  width: 20px;
  text-align: center;
  user-select: none;
}

.diff-line.added .line-prefix {
  color: #10b981;
}

.diff-line.removed .line-prefix {
  color: #ef4444;
}

.line-content {
  flex: 1;
  white-space: pre;
  color: #f8fafc;
}
```

---

## Шаг 13: Производительность и бенчмарки

Измерим производительность нашей реализации time-travel.

### Метрики производительности

Для сбора метрик создадим тестовый скрипт:

```typescript
// src/test/collect-metrics.ts
import { editorTimeTravel } from '@/store/timeTravel'

export async function measurePerformance() {
  const results = {
    snapshotCapture: [] as number[],
    snapshotRestore: [] as number[],
    memory: [] as number[]
  }

  // Измерение времени захвата
  for (let i = 0; i < 10; i++) {
    const start = performance.now()
    editorTimeTravel.capture(`test-${i}`)
    const end = performance.now()
    results.snapshotCapture.push(end - start)
  }

  // Измерение времени восстановления
  const history = editorTimeTravel.getHistory()
  for (let i = 0; i < history.length; i++) {
    const start = performance.now()
    editorTimeTravel.jumpTo(i)
    const end = performance.now()
    results.snapshotRestore.push(end - start)
  }

  // Память
  if (performance.memory) {
    results.memory.push(performance.memory.usedJSHeapSize / 1024 / 1024)
  }

  return {
    avgCaptureTime: results.snapshotCapture.reduce((a, b) => a + b) / results.snapshotCapture.length,
    avgRestoreTime: results.snapshotRestore.reduce((a, b) => a + b) / results.snapshotRestore.length,
    memoryMB: results.memory[0] || 0
  }
}
```

### Результаты бенчмарков

Для получения точных результатов необходимо провести тестирование. Вот целевые показатели:

| Метрика | Target | Метод измерения |
|---------|--------|-----------------|
| Время захвата снимка | < 50ms | `performance.now()` до/после `capture()` |
| Время восстановления | < 100ms | `performance.now()` до/после `jumpTo()` |
| Размер снимка (delta) | < 1KB | Сравнение размеров JSON |
| Потребление памяти | < 50MB | `performance.memory.usedJSHeapSize` |
| FPS при анимации | 60 | Chrome DevTools Performance |

**Для измерения выполните:**

```bash
# Откройте демо-приложение
pnpm dev --workspace=demo-editor

# В консоли браузера выполните:
import { measurePerformance } from './test/collect-metrics'
const metrics = await measurePerformance()
console.table(metrics)
```

### Сравнение с альтернативами

| Библиотека | Time-Travel | Bundle Size | Примечание |
|------------|-------------|-------------|------------|
| **Nexus State** | ✅ Built-in | ~4KB | Delta-сжатие |
| Redux + DevTools | ✅ Plugin | ~13KB | Требуется настройка |
| Zustand | ❌ | ~1KB | Нет встроенного |
| Jotai | ❌ | ~12KB | Нет встроенного |

**Преимущество Nexus State:** встроенный time-travel с delta-сжатием для эффективного использования памяти.

### Рекомендации по оптимизации

1. **Используйте debounce для частых изменений**
   ```typescript
   const { captureSnapshot } = useDebounceSnapshots({
     delay: 1000,  // 1 секунда
     maxWait: 5000 // 5 секунд максимум
   })
   ```

2. **Включайте delta-сжатие**
   ```typescript
   deltaSnapshots: {
     enabled: true,
     fullSnapshotInterval: 10
   }
   ```

3. **Ограничивайте maxHistory**
   ```typescript
   maxHistory: 100  // или меньше для мобильных
   ```

4. **Используйте atomTTL для очистки**
   ```typescript
   atomTTL: 300000  // 5 минут
   ```

---

## Заключение

Time-travel debugging перестал быть экзотикой — это must-have инструмент для современной разработки. Но есть важный нюанс.

### От отладки к пользовательской функциональности

Традиционно time-travel воспринимается как **инструмент отладки** для разработчиков — как Redux DevTools. Однако пользователи современных приложений ожидают гораздо большего:

- **Ctrl+Z** работает в любом редакторе
- **История версий** доступна в Figma и Google Docs
- **Сравнение версий** — стандарт для профессиональных инструментов

Мы считаем, что **формы — это следующий рубеж**. Пользователи, которые работают с Figma и Google Docs, ожидают того же от форм: возможности отменить ошибку, просмотреть историю изменений, экспериментировать без страха.

**Nexus State** делает time-travel доступным не как инструмент отладки, а как **пользовательскую функциональность** — такую же, как в Figma или Google Docs.

### Что вы узнали

В этой статье мы:

1. **Изучили типичные проблемы отладки**
   - Анализ GitHub issues популярных библиотек
   - Типичные проблемы: async, race conditions, tracking
   - Ожидания пользователей: jump-to-version, названия действий, дельта

2. **Создали редактор с time-travel**
   - Настроили Nexus State и SimpleTimeTravel
   - Реализовали debounce для оптимизации
   - Добавили визуальный timeline и список снимков
   - Поддержали горячие клавиши (Ctrl+Z, Ctrl+Y)

3. **Измерили производительность**
   - Целевые показатели: < 50ms захват, < 100ms восстановление
   - Delta-сжатие уменьшает размер снимков
   - Методы измерения и оптимизации

### Когда использовать Nexus State

**Подходит:**
- ✅ Нужен встроенный time-travel debugging
- ✅ **User-facing time-travel** (как в Figma)
- ✅ Framework-agnostic решение (React, Vue, Svelte)
- ✅ Важен размер бандла (~4KB)
- ✅ Нужна атомная архитектура

**Не подходит:**
- ❌ Нужен только простой store без истории
- ❌ Требуется максимальная производительность для частых обновлений (рассмотрите Zustand)
- ❌ Уже используете Redux с DevTools и не нужен user-facing time-travel

### Следующие шаги

1. **Попробуйте демо-приложение**
   - [Editor Demo](https://demo-editor.nexus-state.dev/)
   - Поиграйте с undo/redo, timeline slider
   - Оцените user experience

2. **Изучите документацию**
   - [Nexus State Docs](https://nexus-state.dev/)
   - [GitHub Repository](https://github.com/eustatos/nexus-state)

3. **Внедрите в свой проект**
   ```bash
   npm install @nexus-state/core @nexus-state/react
   ```

4. **Поделитесь опытом**
   - [GitHub Discussions](https://github.com/eustatos/nexus-state/discussions)
   - [Telegram чат](https://t.me/nexus_state)

### Полезные ссылки

- [Nexus State GitHub](https://github.com/eustatos/nexus-state)
- [Документация](https://nexus-state.dev/)
- [Демо-приложение](https://demo-editor.nexus-state.dev/)
- [Исходный код демо](https://github.com/eustatos/nexus-state/tree/main/apps/demo-editor)

**Источники для ожидания пользователей:**

- [Figma Version History](https://help.figma.com/hc/en-us/articles/4404664585495)
- [Google Docs Version History](https://support.google.com/docs/answer/190843)
- [VS Code Timeline](https://code.visualstudio.com/updates/v1_39)
- [Photoshop History Panel](https://helpx.adobe.com/photoshop/using/history-panel.html)
- [Undo/Redo стандарты (Windows)](https://learn.microsoft.com/en-us/windows/win32/uxguide/inter-undo)
- [Undo/Redo стандарты (macOS)](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo)

---

## Об авторе

**Nexus State Team** — разработчики, создающие framework-agnostic библиотеку управления состоянием с встроенным time-travel debugging.

[GitHub](https://github.com/eustatos/nexus-state) | [Документация](https://nexus-state.dev/) | [Telegram](https://t.me/nexus_state)

---

*Статья опубликована в рамках проекта Nexus State. Исследование ART-000 проведено в Март 2026.*
