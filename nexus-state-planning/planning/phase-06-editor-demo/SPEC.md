# Editor Demo Specification

## 📋 Обзор

Демо-приложение текстового редактора для демонстрации возможностей time-travel debugging в Nexus State.

## 🎨 Дизайн-система

### Цветовая палитра

| Назначение | Цвет | Hex | Preview |
|------------|------|-----|---------|
| Primary | Indigo | `#6366F1` | 🟣 |
| Secondary | Violet | `#8B5CF6` | 🟣 |
| Accent | Pink | `#EC4899` | 🩷 |
| Success | Emerald | `#10B981` | 💚 |
| Warning | Amber | `#F59E0B` | 🧡 |
| Danger | Red | `#EF4444` | ❤️ |
| Background | Slate 900 | `#0F172A` | ⬛ |
| Surface | Slate 800 | `#1E293B` | ⬛ |
| Border | Slate 700 | `#334155` | ⬛ |
| Text Primary | Slate 50 | `#F8FAFC` | ⬜ |
| Text Muted | Slate 400 | `#94A3B8` | ⬜ |

### Типографика

```css
/* Заголовки */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;

/* Код / Редактор */
font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

/* Базовый текст */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
```

### Размеры и отступы

```
Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64 px
Border radius: 6px (small), 12px (medium), 20px (large)
Shadows: sm, md, lg, xl (по системе Tailwind)
```

## 🏗️ Архитектура UI

### Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  HEADER (64px)                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ 📝 Editor Demo    [Stats]              [⚙️] [📖] [🐛]      │   │
│  └────────────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────┐  ┌──────────────────┐   │
│  │                                      │  │  SIDEBAR         │   │
│  │         MAIN EDITOR                  │  │  Snapshots       │   │
│  │         AREA                         │  │                  │   │
│  │                                      │  │  ┌────────────┐  │   │
│  │  ┌────────────────────────────────┐  │  │  │ 📝 v15     │  │   │
│  │  │ [Toolbar]                      │  │  │  │ 12:45:32   │  │   │
│  │  ├────────────────────────────────┤  │  │  │ +124 ch    │  │   │
│  │  │ Lorem ipsum dolor sit amet...  │  │  │  └────────────┘  │   │
│  │  │ consectetur adipiscing elit... │  │  │  ┌────────────┐  │   │
│  │  │ ...                            │  │  │  │ 📝 v14     │  │   │
│  │  │                                │  │  │  │ ...        │  │   │
│  │  └────────────────────────────────┘  │  │  └────────────┘  │   │
│  │                                      │  │                  │   │
│  └──────────────────────────────────────┘  └──────────────────┘   │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  TIMELINE BAR (80px)                                               │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  [<<] [◄] ──●──●──●──●──●──  [►] [>>]  [▶ Play]  [⏹]     │   │
│  │       3 / 15 snapshots                                     │   │
│  └────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

## 📦 Компоненты

### Header

**Файл:** `components/Layout/Header.tsx`

**Элементы:**
- Логотип / Название приложения
- Статистика документа (символы, слова, строки)
- Индикатор авто-сохранения
- Кнопки настроек, документации, DevTools

**Атомы:**
```typescript
const headerStatsAtom = atom({
  characters: 0,
  words: 0,
  lines: 0,
  lastSaved: null
}, 'header.stats')
```

### Editor Area

**Файл:** `components/Editor/Editor.tsx`

**Элементы:**
- Тулбар (кнопки форматирования)
- Основная область редактирования
- Индикатор позиции курсора
- Подсветка синтаксиса (опционально)

**Атомы:**
```typescript
const contentAtom = atom('', 'editor.content')
const cursorAtom = atom({ line: 0, col: 0 }, 'editor.cursor')
const selectionAtom = atom(null, 'editor.selection')
const isDirtyAtom = atom(false, 'editor.dirty')
```

### Editor Stats

**Файл:** `components/Editor/EditorStats.tsx`

**Отображение:**
- Количество символов (с пробелами / без)
- Количество слов
- Количество строк
- Время чтения
- Время с последнего сохранения

**Обновление:** Debounce 300ms

### Timeline Slider

**Файл:** `components/Timeline/TimelineSlider.tsx`

**Элементы:**
- Визуальная шкала времени с точками-снимками
- Текущий индикатор позиции
- Кнопки навигации (First, Prev, Next, Last)
- Кнопка Play/Pause для авто-проигрывания
- Слайдер для плавной прокрутки

**Атомы:**
```typescript
const timelinePositionAtom = atom(0, 'timeline.position')
const isPlayingAtom = atom(false, 'timeline.playing')
const timelineSpeedAtom = atom(1000, 'timeline.speed') // ms per snapshot
```

### Timeline Controls

**Файл:** `components/Timeline/TimelineControls.tsx`

**Кнопки:**
- `<< First` — переход к первому снимку
- `◄ Prev` — предыдущий снимок
- `► Next` — следующий снимок
- `>> Last` — переход к последнему снимку
- `▶ Play` — авто-проигрывание истории
- `⏹ Stop` — остановка проигрывания

### Snapshot List

**Файл:** `components/Snapshots/SnapshotList.tsx`

**Элементы:**
- Список всех снимков с группировкой по времени
- Поиск/фильтрация снимков
- Мульти-выбор для сравнения
- Контекстное меню (Restore, Compare, Delete, Export)

**Атомы:**
```typescript
const snapshotsAtom = atom([], 'snapshots.list')
const selectedSnapshotAtom = atom(null, 'snapshots.selected')
const compareModeAtom = atom(false, 'snapshots.compareMode')
```

### Snapshot Item

**Файл:** `components/Snapshots/SnapshotItem.tsx`

**Отображение:**
- Иконка типа изменения
- Название действия / описания
- Временная метка
- Дельта изменений (+/- символы)
- Индикатор текущего состояния

**Структура:**
```tsx
<div className="snapshot-item {selected} {current}">
  <div className="icon">{icon}</div>
  <div className="content">
    <div className="title">{action}</div>
    <div className="meta">
      <span className="time">{time}</span>
      <span className="delta {positive|negative}">{delta}</span>
    </div>
  </div>
  <div className="indicator">{indicator}</div>
</div>
```

### Snapshot Diff

**Файл:** `components/Snapshots/SnapshotDiff.tsx`

**Режимы:**
- Inline — изменения в строке
- Split — две колонки (было / стало)
- Unified — единый дифф

**Подсветка:**
- Добавленный текст: зеленый фон
- Удаленный текст: красный фон
- Измененный текст: комбинация

## 🔧 Time-Travel Интеграция

### Конфигурация

```typescript
import { createStore, SimpleTimeTravel } from '@nexus-state/core'

const store = createStore()

const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 100,
  autoCapture: false,  // Ручное управление для debounce
  deltaSnapshots: {
    enabled: true,
    fullSnapshotInterval: 10,
    maxDeltaChainLength: 20
  },
  atomTTL: 300000,  // 5 минут
  trackingConfig: {
    autoTrack: true,
    trackComputed: true
  }
})
```

### Debounce Strategy

```typescript
import { debounce } from 'lodash-es'

const CAPTURE_DELAY = 1000  // 1 секунда после последнего изменения

const debouncedCapture = debounce(
  (action: string) => {
    timeTravel.capture(action)
  },
  CAPTURE_DELAY,
  { maxWait: 5000 }  // Принудительный захват каждые 5 секунд
)

// Вызов при изменении контента
editor.on('change', () => {
  debouncedCapture('text-edit')
})
```

### Snapshot Metadata

```typescript
interface SnapshotMetadata {
  action: string           // 'text-edit' | 'paste' | 'delete' | 'format'
  timestamp: number        // Date.now()
  delta?: {
    added: number          // Добавлено символов
    removed: number        // Удалено символов
    type: 'insert' | 'delete' | 'replace'
  }
  cursor?: {
    line: number
    col: number
  }
  stats?: {
    characters: number
    words: number
    lines: number
  }
}
```

## 🎬 Сценарии демонстрации

### Сценарий 1: Базовое редактирование
1. Пользователь вводит текст
2. Через 1 секунду создается снимок
3. В сайдбаре появляется новая запись
4. Timeline обновляется

### Сценарий 2: Undo/Redo
1. Пользователь делает несколько изменений
2. Нажимает кнопку "Prev" на timeline
3. Содержимое редактора откатывается
4. Визуальная индикация позиции

### Сценарий 3: Jump to Snapshot
1. Пользователь кликает на снимок в списке
2. Мгновенный переход к состоянию
3. Подсветка изменений (diff)

### Сценарий 4: Сравнение версий
1. Выбор двух снимков (multi-select)
2. Открытие diff view
3. Визуальное отображение различий

### Сценарий 5: Авто-проигрывание
1. Нажатие кнопки "Play"
2. Плавная прокрутка истории
3. Остановка по клику

### Сценарий 6: Стресс-тест
1. Быстрый ввод текста (100+ символов в секунду)
2. Демонстрация работы debounce
3. Показ дельта-сжатия в статистике

## 📊 Метрики производительности

| Метрика | Цель | Максимум |
|---------|------|----------|
| Время захвата снимка | < 30ms | 50ms |
| Время восстановления | < 50ms | 100ms |
| Debounce задержка | 1000ms | 2000ms |
| FPS при анимации | 60 | 30 |
| Размер снимка (delta) | < 1KB | 10KB |
| Потребление памяти | < 50MB | 100MB |

## 🔌 Расширения

### Плагины (опционально)

1. **Markdown Preview** — предпросмотр Markdown
2. **Syntax Highlighting** — подсветка кода
3. **Minimap** — мини-карта документа
4. **Collaborative** — индикаторы совместного редактирования
5. **Export Formats** — экспорт в PDF, DOCX, HTML

### Интеграции

1. **Redux DevTools** — полная интеграция
2. **LocalStorage** — персистентность между перезагрузками
3. **Share URL** — shareable ссылки на состояния

## 📱 Адаптивность

### Breakpoints

```
Mobile:     < 640px   (одна колонка, скрытый сайдбар)
Tablet:     640-1024px (две колонки, компактный сайдбар)
Desktop:    > 1024px  (полный layout)
```

### Mobile Layout

```
┌─────────────────────┐
│ Header (compact)    │
├─────────────────────┤
│                     │
│   Editor Area       │
│                     │
├─────────────────────┤
│ Timeline (minimal)  │
├─────────────────────┤
│ [≡ Snapshots]       │  ← Drawer
└─────────────────────┘
```

## ♿ Доступность

- Keyboard navigation (Tab, Arrow keys, Shortcuts)
- Screen reader support (ARIA labels)
- Focus indicators
- High contrast mode
- Reduced motion option

## 🧪 Тестирование

### Unit Tests
- Компоненты (Vitest + React Testing Library)
- Атомы и селекторы
- Утилиты (diff, formatters)

### Integration Tests
- Time-travel flow
- Snapshot creation/restoration
- Timeline navigation

### E2E Tests
- Полные сценарии использования
- Производительность
- Кросс-браузерность
