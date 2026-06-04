# TASK-005: Debounce для снимков (Debounce Snapshots)

## 📋 Описание

Реализация стратегии debounce для автоматического создания снимков time-travel при редактировании текста, чтобы избежать избыточного захвата состояния.

## 🎯 Цель

Оптимизировать создание снимков: захватывать изменения после паузы вводе, но не чаще заданного интервала, с принудительным захватом при длительном непрерывном вводе.

## 📦 Технические требования

### Параметры debounce

```typescript
interface DebounceConfig {
  delay: number           // Задержка после последнего изменения (1000ms)
  maxWait: number         // Максимальное время между снимками (5000ms)
  leading: boolean        // Вызывать сразу при первом изменении
  trailing: boolean       // Вызывать после задержки
}
```

### Метаданные снимка

```typescript
interface SnapshotMetadata {
  action: 'text-edit' | 'paste' | 'delete' | 'bulk-edit'
  timestamp: number
  delta?: {
    added: number
    removed: number
    type: 'insert' | 'delete' | 'replace'
  }
  trigger: 'debounce' | 'maxWait' | 'manual'
}
```

## ✅ Задачи

### 5.1: Утилита debounce с maxWait

**src/utils/debounce.ts:**
```typescript
/**
 * Debounce функция с поддержкой maxWait
 * @param func Функция для вызова
 * @param wait Задержка в мс
 * @param options Опции
 * @returns Debounced функция
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    maxWait?: number
    leading?: boolean
    trailing?: boolean
  } = {}
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  const { maxWait, leading = false, trailing = true } = options
  
  let timeout: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  let lastCallTime: number | null = null
  let lastInvokeTime = 0
  let leadingCalled = false

  if (!wait || wait < 0) {
    throw new Error('wait must be a non-negative number')
  }

  if (maxWait !== undefined && (!maxWait || maxWait < 0)) {
    throw new Error('maxWait must be a non-negative number if provided')
  }

  if (maxWait !== undefined && maxWait < wait) {
    console.warn('maxWait is less than wait, using wait instead')
  }

  const invokeFunc = (time: number) => {
    const args = lastArgs!
    lastArgs = null
    lastInvokeTime = time
    return func(...args)
  }

  const startTimer = (pendingFunc: () => void, delay: number) => {
    return setTimeout(pendingFunc, delay)
  }

  const shouldInvoke = (time: number) => {
    if (lastCallTime === null) {
      return true
    }
    
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime

    // Invoke if:
    // 1. First call
    // 2. Wait time has passed since last call
    // 3. Max wait time has passed (if maxWait is set)
    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      (maxWait !== undefined && timeSinceLastCall >= maxWait) ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    )
  }

  const timerExpired = () => {
    const time = Date.now()
    
    if (shouldInvoke(time)) {
      return trailingInvoke()
    }
    
    // Restart timer with remaining time
    if (lastCallTime !== null) {
      const timeSinceLastCall = time - lastCallTime
      const remaining = wait - timeSinceLastCall
      
      if (maxWait !== undefined) {
        const timeSinceLastInvoke = time - lastInvokeTime
        const maxWaitRemaining = maxWait - timeSinceLastInvoke
        timeout = startTimer(timerExpired, Math.min(remaining, maxWaitRemaining))
      } else {
        timeout = startTimer(timerExpired, remaining)
      }
    }
  }

  const trailingInvoke = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    
    if (trailing && lastArgs) {
      return invokeFunc(Date.now())
    }
    
    lastArgs = null
  }

  return function debounced(this: any, ...args: Parameters<T>) {
    const time = Date.now()
    lastCallTime = time
    lastArgs = args

    const isInvoking = shouldInvoke(time)

    if (isInvoking) {
      if (timeout === null && leading) {
        if (leadingCalled) {
          // Already called leading, skip
        } else {
          leadingCalled = true
          return invokeFunc(time)
        }
      }
      
      if (trailing) {
        if (timeout) {
          clearTimeout(timeout)
        }
        timeout = startTimer(timerExpired, wait)
      }
    } else if (timeout === null && trailing) {
      timeout = startTimer(timerExpired, wait)
    }

    return undefined
  } as (...args: Parameters<T>) => ReturnType<T> | undefined
}

/**
 * Throttle функция (обертка над debounce)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean
    trailing?: boolean
  } = {}
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return debounce(func, wait, {
    ...options,
    leading: options.leading ?? true,
    trailing: options.trailing ?? false,
    maxWait: wait
  })
}
```

### 5.2: Хук для debounce снимков

**src/hooks/useDebounceSnapshots.ts:**
```typescript
import { useRef, useCallback, useEffect } from 'react'
import { editorTimeTravel } from '@/store/timeTravel'
import { debounce } from '@/utils/debounce'

interface UseDebounceSnapshotsOptions {
  delay?: number
  maxWait?: number
  enabled?: boolean
}

/**
 * Хук для debounce создания снимков time-travel
 */
export function useDebounceSnapshots(
  options: UseDebounceSnapshotsOptions = {}
) {
  const {
    delay = 1000,
    maxWait = 5000,
    enabled = true
  } = options

  const captureRef = useRef<ReturnType<typeof debounce> | null>(null)

  // Создаем debounced функцию захвата
  useEffect(() => {
    if (!enabled) {
      captureRef.current?.cancel?.()
      captureRef.current = null
      return
    }

    captureRef.current = debounce(
      (action: string, metadata?: any) => {
        const snapshot = editorTimeTravel.capture(action, metadata)
        if (snapshot) {
          console.log('[DebounceSnapshot] Captured:', {
            action,
            id: snapshot.id,
            timestamp: snapshot.timestamp
          })
        }
      },
      delay,
      { maxWait, leading: false, trailing: true }
    )

    return () => {
      captureRef.current?.cancel?.()
      captureRef.current = null
    }
  }, [delay, maxWait, enabled])

  // Функция захвата
  const captureSnapshot = useCallback((
    action: string = 'text-edit',
    metadata?: any
  ) => {
    if (!enabled || !captureRef.current) {
      return
    }
    
    captureRef.current(action, {
      ...metadata,
      trigger: 'debounce'
    })
  }, [enabled])

  // Принудительный захват (игнорирует debounce)
  const forceCapture = useCallback((
    action: string = 'manual-save',
    metadata?: any
  ) => {
    if (!enabled) return
    
    const snapshot = editorTimeTravel.capture(action, {
      ...metadata,
      trigger: 'manual'
    })
    
    if (snapshot) {
      console.log('[ForceCapture] Captured:', {
        action,
        id: snapshot.id
      })
    }
  }, [enabled])

  // Отмена отложенного захвата
  const cancelPending = useCallback(() => {
    captureRef.current?.cancel?.()
  }, [])

  return {
    captureSnapshot,
    forceCapture,
    cancelPending
  }
}
```

### 5.3: Интеграция с редактором

**src/components/Editor/EditorWithSnapshots.tsx:**
```typescript
import React, { useEffect, useRef, useCallback } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { useAtom } from '@nexus-state/react'
import { contentAtom, cursorAtom, lastSavedAtom } from '@/store/atoms'
import { editorStore } from '@/store/store'
import { useDebounceSnapshots } from '@/hooks/useDebounceSnapshots'
import { calculateDelta } from '@/utils/delta'
import './Editor.css'

export function EditorWithSnapshots() {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const previousContentRef = useRef<string>('')
  
  const [content, setContent] = useAtom(contentAtom, editorStore)
  const [cursor, setCursor] = useAtom(cursorAtom, editorStore)
  const [, setLastSaved] = useAtom(lastSavedAtom, editorStore)
  
  const { captureSnapshot, forceCapture } = useDebounceSnapshots({
    delay: 1000,
    maxWait: 5000,
    enabled: true
  })

  // Инициализация редактора
  useEffect(() => {
    if (!containerRef.current) return

    const startState = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        keymap.of([
          {
            key: 'Mod-s',
            run: () => {
              forceCapture('manual-save')
              return true
            }
          }
        ]),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString()
            const oldContent = previousContentRef.current
            
            setContent(newContent)
            
            // Calculate delta
            const delta = calculateDelta(oldContent, newContent)
            
            // Захват снимка с debounce
            captureSnapshot('text-edit', {
              delta,
              stats: {
                characters: newContent.length,
                words: newContent.split(/\s+/).length
              }
            })
            
            previousContentRef.current = newContent
            
            // Update cursor
            const pos = update.state.selection.main.head
            const line = update.state.doc.lineAt(pos)
            setCursor({
              line: line.number - 1,
              col: pos - line.from
            })
          }
        })
      ]
    })

    const view = new EditorView({
      state: startState,
      parent: containerRef.current
    })

    editorViewRef.current = view
    previousContentRef.current = content

    return () => {
      view.destroy()
      editorViewRef.current = null
    }
  }, [])

  return (
    <div className="editor-container">
      <div ref={containerRef} className="editor-view" />
      <div className="editor-hint">
        Press Ctrl+S to save snapshot manually
      </div>
    </div>
  )
}
```

### 5.4: Утилита для расчета delta

**src/utils/delta.ts:**
```typescript
export interface DeltaInfo {
  added: number
  removed: number
  netChange: number
  type: 'insert' | 'delete' | 'replace' | 'empty'
}

/**
 * Вычисляет разницу между старым и новым текстом
 */
export function calculateDelta(oldText: string, newText: string): DeltaInfo {
  if (!oldText && !newText) {
    return { added: 0, removed: 0, netChange: 0, type: 'empty' }
  }
  
  if (!oldText && newText) {
    return { added: newText.length, removed: 0, netChange: newText.length, type: 'insert' }
  }
  
  if (oldText && !newText) {
    return { added: 0, removed: oldText.length, netChange: -oldText.length, type: 'delete' }
  }
  
  const added = newText.length - oldText.length
  const removed = oldText.length - newText.length
  
  // Simple heuristic for type detection
  let type: DeltaInfo['type'] = 'replace'
  if (added > 0 && removed === 0) {
    type = 'insert'
  } else if (removed > 0 && added === 0) {
    type = 'delete'
  }
  
  return {
    added: Math.max(0, added),
    removed: Math.max(0, removed),
    netChange: added,
    type
  }
}

/**
 * Форматирует delta для отображения
 */
export function formatDelta(delta: DeltaInfo): string {
  if (delta.type === 'insert') {
    return `+${delta.added} chars`
  } else if (delta.type === 'delete') {
    return `-${delta.removed} chars`
  } else if (delta.type === 'replace') {
    return `±${Math.abs(delta.netChange)} chars`
  }
  return 'no change'
}
```

## 🧪 Критерии приемки

- [ ] Снимки создаются после паузы в 1 секунду
- [ ] Принудительный захват каждые 5 секунд при непрерывном вводе
- [ ] Ctrl+S создает снимок немедленно
- [ ] Delta вычисляется корректно
- [ ] Метаданные снимка содержат правильную информацию
- [ ] Нет избыточных снимков при быстром вводе

## 📁 Зависимости

- [[TASK-001]](./TASK-001-project-setup.md) — Настройка проекта
- [[TASK-002]](./TASK-002-store-atoms.md) — Создание атомов и store
- [[TASK-003]](./TASK-003-editor-component.md) — Базовый компонент редактора

## 🔗 Связанные задачи

- [[TASK-006]](./TASK-006-snapshot-list.md) — Список снимков
- [[TASK-007]](./TASK-007-timeline-slider.md) — Timeline slider
- [[TASK-013]](./TASK-013-performance-monitor.md) — Монитор производительности

## 📝 Заметки

- Рассмотреть использование lodash.debounce вместо своей реализации
- Добавить визуальный индикатор "pending snapshot"
- Оптимизировать calculateDelta для больших текстов (использовать diff-match-patch)
