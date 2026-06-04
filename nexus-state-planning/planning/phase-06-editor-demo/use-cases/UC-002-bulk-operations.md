# UC-002: Массовое редактирование (Bulk Operations)

## 📋 Описание

Демонстрация работы time-travel при массовых операциях редактирования: вставка большого текста, find & replace, мульти-курсор.

## 🎯 Цель

Показать, как Nexus State обрабатывает крупные изменения состояния и оптимизирует снимки через delta-сжатие.

## 👤 Персона

**Опытный пользователь** — работает с большими документами, использует продвинутые функции редактирования.

## 📖 Предусловия

- В редакторе есть текст для редактирования
- В сайдбаре уже есть несколько снимков

## 🔄 Поток

### Сценарий 1: Вставка большого текста

1. **Пользователь копирует текст из внешнего источника**
   - Объем: 1000-5000 символов
   - Формат: plain text или rich text

2. **Пользователь вставляет текст (Ctrl+V)**
   - Система фиксирует изменение
   - Запускается debounce timer
   - Статистика обновляется скачкообразно

3. **Создается снимок**
   - Тип: `bulk-insert`
   - Delta: показывает разницу между состояниями
   - Metadata: количество вставленных символов

### Сценарий 2: Find & Replace

1. **Пользователь открывает панель Find & Replace**
   - Вводит поисковый запрос
   - Вводит текст замены

2. **Пользователь выбирает "Replace All"**
   - Система находит все совпадения
   - Выполняет замену
   - Создается один снимок для всей операции

3. **Снимок содержит**
   - Тип: `find-replace`
   - Количество замен
   - Общий объем изменений

### Сценарий 3: Удаление большого фрагмента

1. **Пользователь выделяет большой фрагмент**
   - Выделение: 500+ символов

2. **Пользователь нажимает Delete**
   - Текст удаляется
   - Создается снимок с меткой `bulk-delete`

## 🎨 UI Элементы

```
┌─────────────────────────────────────────────────────────┐
│ Find & Replace Panel                                    │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Find:    "lorem"                          [×] [⚙️]  │ │
│ │ Replace: "ipsum"                           [✓] [⚙️] │ │
│ │                                                     │ │
│ │ Found 23 matches                                    │ │
│ │ [Replace] [Replace All] [Close]                     │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ 📊 +1,234 chars (5,678 total) | ⚡ Bulk operation       │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Техническая реализация

### Атомы для Find & Replace

```typescript
// store/atoms/findReplace.ts
import { atom } from '@nexus-state/core'

export const findQueryAtom = atom('', 'editor.find.query')
export const replaceTextAtom = atom('', 'editor.replace.text')
export const findMatchesAtom = atom(
  (get) => {
    const content = get(contentAtom)
    const query = get(findQueryAtom)
    if (!query) return []
    
    const regex = new RegExp(escapeRegex(query), 'g')
    const matches = []
    let match
    
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        text: match[0]
      })
    }
    
    return matches
  },
  'editor.find.matches'
)

export const isFindPanelOpenAtom = atom(false, 'editor.find.isOpen')
```

### Bulk Operation Handler

```typescript
// hooks/useBulkOperations.ts
import { useCallback } from 'react'
import { contentAtom } from '@/store/atoms'
import { editorTimeTravel } from '@/store/timeTravel'

export function useBulkOperations() {
  const [content, setContent] = useAtom(contentAtom)

  const handlePaste = useCallback((text: string) => {
    const oldLength = content.length
    const newContent = content + text
    
    setContent(newContent)
    
    // Создаем снимок с метаданными
    editorTimeTravel.capture('bulk-insert', {
      delta: {
        added: text.length,
        removed: 0,
        type: 'insert'
      },
      stats: {
        characters: newContent.length,
        words: newContent.split(/\s+/).length
      }
    })
  }, [content, setContent])

  const handleReplaceAll = useCallback((search: string, replace: string) => {
    const regex = new RegExp(escapeRegex(search), 'g')
    const matches = (content.match(regex) || []).length
    
    if (matches === 0) return 0
    
    const newContent = content.replace(regex, replace)
    setContent(newContent)
    
    editorTimeTravel.capture('find-replace', {
      delta: {
        added: replace.length * matches,
        removed: search.length * matches,
        type: 'replace',
        replacements: matches
      }
    })
    
    return matches
  }, [content, setContent])

  const handleBulkDelete = useCallback((selection: Selection) => {
    const { from, to } = selection
    const deletedText = content.slice(from, to)
    const newContent = content.slice(0, from) + content.slice(to)
    
    setContent(newContent)
    
    editorTimeTravel.capture('bulk-delete', {
      delta: {
        added: 0,
        removed: deletedText.length,
        type: 'delete'
      }
    })
  }, [content, setContent])

  return { handlePaste, handleReplaceAll, handleBulkDelete }
}
```

### Delta Calculation

```typescript
// utils/delta.ts
export function calculateDelta(oldText: string, newText: string) {
  const added = newText.length - oldText.length
  const removed = oldText.length - newText.length
  
  return {
    added: Math.max(0, added),
    removed: Math.max(0, -added),
    netChange: added,
    type: added > 0 ? 'insert' : added < 0 ? 'delete' : 'replace'
  }
}

export function formatDelta(delta: ReturnType<typeof calculateDelta>) {
  if (delta.type === 'insert') {
    return `+${delta.added} chars`
  } else if (delta.type === 'delete') {
    return `-${delta.removed} chars`
  } else {
    return `±${Math.abs(delta.netChange)} chars`
  }
}
```

### Snapshot Item Component

```typescript
// components/Snapshots/SnapshotItem.tsx
export function SnapshotItem({ snapshot }: SnapshotItemProps) {
  const delta = snapshot.metadata?.delta
  
  const getDeltaIcon = () => {
    if (!delta) return null
    
    if (delta.type === 'insert') {
      return <IconPlus className="text-emerald-500" />
    } else if (delta.type === 'delete') {
      return <IconMinus className="text-red-500" />
    } else if (delta.type === 'replace') {
      return <IconReplace className="text-amber-500" />
    }
  }

  const getDeltaText = () => {
    if (!delta) return null
    
    if (delta.replacements) {
      return `${delta.replacements} replacements`
    }
    
    return formatDelta(delta)
  }

  return (
    <div className="snapshot-item bulk-operation">
      <div className="icon">{getDeltaIcon()}</div>
      <div className="content">
        <div className="title">{snapshot.metadata.action}</div>
        <div className="meta">
          <span className="time">{formatTime(snapshot.timestamp)}</span>
          <span className="delta">{getDeltaText()}</span>
        </div>
      </div>
    </div>
  )
}
```

## 📊 Ожидаемые результаты

| Операция | Объем | Время снимка | Размер delta |
|----------|-------|--------------|--------------|
| Вставка текста | 1000 chars | < 30ms | ~200 bytes |
| Find & Replace | 23 замены | < 50ms | ~500 bytes |
| Удаление | 500 chars | < 20ms | ~100 bytes |

## ✅ Критерии приемки

- [ ] Вставка большого текста создает один снимок
- [ ] Find & Replace группируется как одна операция
- [ ] Metadata снимка содержит информацию об операции
- [ ] Delta-сжатие эффективно для больших изменений
- [ ] UI отображает тип операции (иконка, текст)

## 🔗 Связанные use case'ы

- [[UC-001]](./UC-001.md) — Базовое редактирование
- [[UC-004]](./UC-004.md) — Сравнение версий
- [[UC-006]](./UC-006.md) — Экспорт/Импорт

## 📝 Заметки

- Важно показать эффективность delta-сжатия
- Группировка операций улучшает UX time-travel
- Metadata помогает идентифицировать снимки
