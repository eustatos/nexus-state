# UC-001: Базовое редактирование текста (Basic Text Editing)

## 📋 Описание

Демонстрация базовой функциональности редактора с автоматическим созданием снимков состояния при вводе текста.

## 🎯 Цель

Показать, как Nexus State автоматически отслеживает изменения состояния и создает снимки для time-travel.

## 👤 Персона

**Начинающий разработчик** — хочет понять основы работы с редактором и time-travel.

## 📖 Предусловия

- Приложение запущено
- Редактор пуст или содержит начальный текст
- Time-travel включен с `autoCapture: false` (ручное управление через debounce)

## 🔄 Поток

### Основной сценарий

1. **Пользователь начинает ввод текста**
   - Система отображает символы в редакторе
   - Статистика (символы, слова) обновляется в реальном времени
   - Индикатор "Dirty" показывает несохраненное состояние

2. **Срабатывает debounce (1 секунда после последнего ввода)**
   - Система создает снимок состояния
   - Снимок добавляется в историю time-travel
   - В сайдбаре появляется новая запись
   - Timeline обновляется с новой точкой

3. **Пользователь продолжает ввод**
   - Процесс повторяется для каждой серии изменений

### Альтернативный сценарий: Быстрый ввод

1. Пользователь быстро вводит текст (< 100ms между символами)
2. Debounce сбрасывается при каждом нажатии
3. Снимок создается только после паузы
4. ИЛИ принудительно через `maxWait: 5000ms`

## 🎨 UI Элементы

```
┌────────────────────────────────────────────┐
│ 📊 1,234 chars | 234 words | 12 lines     │
│ ⏱️ Saving... → ✓ Saved                    │
├────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │
│ │ Lorem ipsum dolor sit amet, consectetur│ │
│ │ adipiscing elit. Sed do eiusmod tempor │ │
│ │ [CURSOR]                               │ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
├────────────────────────────────────────────┤
│ Timeline: ●────●────●────●────●───         │
│           1    2    3    4    5   (6)      │
└────────────────────────────────────────────┘
```

## 🔧 Техническая реализация

### Атомы

```typescript
// packages/core/src/atoms/editor.ts
import { atom } from '@nexus-state/core'

export const contentAtom = atom('', 'editor.content')
export const cursorAtom = atom({ line: 0, col: 0 }, 'editor.cursor')
export const selectionAtom = atom(null, 'editor.selection')

export const statsAtom = atom(
  (get) => {
    const content = get(contentAtom)
    return {
      characters: content.length,
      charactersNoSpaces: content.replace(/\s/g, '').length,
      words: content.trim() ? content.trim().split(/\s+/).length : 0,
      lines: content.split('\n').length
    }
  },
  'editor.stats'
)
```

### Time-Travel Setup

```typescript
// store/timeTravel.ts
import { SimpleTimeTravel } from '@nexus-state/core'

export const editorTimeTravel = new SimpleTimeTravel(store, {
  maxHistory: 100,
  autoCapture: false,
  deltaSnapshots: { enabled: true }
})
```

### Debounce Capture

```typescript
// hooks/useEditorSnapshots.ts
import { debounce } from 'lodash-es'
import { useCallback, useRef } from 'react'

export function useEditorSnapshots() {
  const captureRef = useRef(
    debounce((action: string, metadata?: any) => {
      editorTimeTravel.capture(action, metadata)
    }, 1000, { maxWait: 5000 })
  )

  const captureSnapshot = useCallback((action: string, metadata?: any) => {
    captureRef.current(action, metadata)
  }, [])

  return { captureSnapshot }
}
```

### Компонент редактора

```typescript
// components/Editor/Editor.tsx
import { useAtom } from '@nexus-state/react'
import { contentAtom, statsAtom } from '@/store/atoms'
import { useEditorSnapshots } from '@/hooks/useEditorSnapshots'

export function Editor() {
  const [content, setContent] = useAtom(contentAtom)
  const stats = useAtom(statsAtom)
  const { captureSnapshot } = useEditorSnapshots()

  const handleChange = useCallback((newContent: string) => {
    setContent(newContent)
    captureSnapshot('text-edit', {
      delta: calculateDelta(content, newContent),
      stats
    })
  }, [setContent, captureSnapshot])

  return (
    <textarea
      value={content}
      onChange={(e) => handleChange(e.target.value)}
      className="editor-textarea"
    />
  )
}
```

## 📊 Ожидаемые результаты

| Метрика | Значение |
|---------|----------|
| Задержка снимка | 1000ms после последнего ввода |
| Принудительный снимок | Каждые 5000ms при непрерывном вводе |
| Размер снимка (delta) | ~100-500 bytes |
| Время создания снимка | < 30ms |

## ✅ Критерии приемки

- [ ] Снимки создаются автоматически после паузы вводе
- [ ] Статистика обновляется в реальном времени
- [ ] В сайдбаре отображается история снимков
- [ ] Timeline показывает текущую позицию
- [ ] Плавная работа без задержек UI

## 🔗 Связанные use case'ы

- [[UC-002]](./UC-002.md) — Массовое редактирование (вставка)
- [[UC-003]](./UC-003.md) — Undo/Redo навигация
- [[UC-007]](./UC-007.md) — Стресс-тест производительности

## 📝 Заметки

- Важно показать разницу между "грязным" и "сохраненным" состоянием
- Debounce должен быть заметен визуально (индикатор "Saving...")
- Delta-сжатие особенно эффективно для этого сценария
