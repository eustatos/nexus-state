# Phase 06: Editor Demo Application

## 🎯 Цель

Создание современного демо-приложения для демонстрации возможностей time-travel debugging в Nexus State на примере текстового редактора.

## 📋 Описание

Приложение представляет собой полнофункциональный текстовый редактор с встроенной системой time-travel, которая позволяет:
- Просматривать историю изменений документа
- Возвращаться к любым предыдущим версиям
- Сравнивать разные версии документа
- Демонстрировать мощь Nexus State DevTools

## 🎨 Дизайн-система

### Стиль
- **Минимализм**: Чистый интерфейс без визуального шума
- **Современность**: Градиенты, тени, скругления
- **Функциональность**: Все элементы имеют четкое назначение

### Цветовая палитра
```
Primary:     #6366F1 (Indigo)
Secondary:   #8B5CF6 (Violet)
Accent:      #EC4899 (Pink)
Success:     #10B981 (Emerald)
Warning:     #F59E0B (Amber)
Danger:      #EF4444 (Red)
Background:  #0F172A (Slate 900)
Surface:     #1E293B (Slate 800)
Border:      #334155 (Slate 700)
Text:        #F8FAFC (Slate 50)
Text Muted:  #94A3B8 (Slate 400)
```

### Типографика
- Заголовки: Inter / SF Pro Display
- Код: JetBrains Mono / Fira Code
- Текст: Inter / System UI

## 🏗️ Архитектура приложения

```
┌─────────────────────────────────────────────────────────────────┐
│                         Header Bar                               │
│  [📊 Stats: 1,234 chars | 234 words]  [⏱️ Auto-save: 3s]        │
├─────────────────────────────────────────────────────────────────┤
│                          │                                      │
│     ┌────────────────────┴──────────────────────────────────┐   │
│     │              Main Editor Area                          │   │
│     │  ┌─────────────────────────────────────────────────┐   │   │
│     │  │  Lorem ipsum dolor sit amet...                  │   │   │
│     │  │  [Cursor blinking]                               │   │   │
│     │  │                                                  │   │   │
│     │  └─────────────────────────────────────────────────┘   │   │
│     └───────────────────────────────────────────────────────────┘
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Timeline Slider: ◄──●────────●────────●────────●────────●──►  │
│  [<< First] [◄ Prev]  [3/15]  [Next ►] [Last >>] [Play ▶]      │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar: Snapshots (15)                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📝 v15 - "Function update"        12:45:32  [+124 chars]│   │
│  │ 📝 v14 - "Paragraph added"        12:45:28  [+512 chars]│   │
│  │ 📝 v13 - "Text deleted"           12:45:15  [-89 chars] │   │
│  │ 📝 v12 - "Initial draft"          12:44:50  [1,234 chars]│  │
│  │ ...                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│  [Compare] [Restore] [Export] [Delete Selected]                │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Технические требования

### Стек
- **Framework**: React 18+ (Vite)
- **Styling**: Tailwind CSS + CSS Modules
- **Icons**: Lucide React / Heroicons
- **Editor**: CodeMirror 6 / Monaco Editor
- **State**: @nexus-state/core + @nexus-state/react

### Интеграция с Nexus State
```typescript
// Основные атомы
const contentAtom = atom('', 'editor.content')
const cursorAtom = atom({ line: 0, col: 0 }, 'editor.cursor')
const selectionAtom = atom(null, 'editor.selection')
const historyAtom = atom([], 'editor.history')

// Time-travel конфигурация
const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 100,
  autoCapture: false,  // Ручное управление
  deltaSnapshots: { enabled: true },
  atomTTL: 60000,  // 1 минута
})

// Debounced snapshot capture
const debouncedCapture = debounce((action: string) => {
  timeTravel.capture(action)
}, 1000)
```

## 📁 Структура проекта

```
apps/demo-editor/
├── src/
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── Editor.tsx
│   │   │   ├── EditorToolbar.tsx
│   │   │   └── EditorStats.tsx
│   │   ├── Timeline/
│   │   │   ├── TimelineSlider.tsx
│   │   │   ├── TimelineControls.tsx
│   │   │   └── TimelineItem.tsx
│   │   ├── Snapshots/
│   │   │   ├── SnapshotList.tsx
│   │   │   ├── SnapshotItem.tsx
│   │   │   └── SnapshotDiff.tsx
│   │   └── Layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── MainLayout.tsx
│   ├── store/
│   │   ├── atoms.ts
│   │   ├── timeTravel.ts
│   │   └── selectors.ts
│   ├── hooks/
│   │   ├── useEditor.ts
│   │   ├── useTimeTravel.ts
│   │   └── useSnapshots.ts
│   ├── utils/
│   │   ├── diff.ts
│   │   ├── debounce.ts
│   │   └── formatters.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── editor.css
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## 📊 Метрики успеха

- [ ] Время загрузки < 2s
- [ ] Плавность анимаций 60fps
- [ ] Захват снимка < 50ms
- [ ] Восстановление состояния < 100ms
- [ ] Lighthouse score > 90

## 🚀 Этапы реализации

1. **Setup** — настройка проекта, базовые компоненты
2. **Editor Core** — интеграция редактора, атомы
3. **Time Travel** — подключение time-travel, снимки
4. **UI/UX** — таймлайн, сайдбар, статистика
5. **Advanced Features** — сравнение, экспорт, демо-сценарии
6. **Polish** — анимации, оптимизация, документация

## 📁 Структура документов

```
planning/phase-06-editor-demo/
├── README.md                    # Этот файл
├── SPEC.md                      # Подробная спецификация
├── ADDITIONAL-USE-CASES.md      # Дополнительные сценарии
├── tasks/
│   ├── README.md                # Индекс задач
│   ├── TASK-001-project-setup.md
│   ├── TASK-002-store-atoms.md
│   ├── TASK-003-editor-component.md
│   ├── TASK-004-stats-component.md
│   ├── TASK-005-debounce-snapshots.md
│   ├── TASK-006-snapshot-list.md
│   ├── TASK-007-timeline-slider.md
│   ├── TASK-008-navigation-controls.md
│   ├── TASK-009-jump-restore.md
│   ├── TASK-010-comparison-feature.md
│   ├── TASK-011-export-import.md
│   ├── TASK-012-playback-feature.md
│   ├── TASK-013-performance-monitor.md
│   ├── TASK-014-stress-tests.md
│   ├── TASK-015-polish-animations.md
│   └── TASK-016-documentation.md
└── use-cases/
    ├── README.md                # Индекс use case'ов
    ├── UC-001-basic-text-editing.md
    ├── UC-002-bulk-operations.md
    ├── UC-003-undo-redo-navigation.md
    ├── UC-004-snapshot-comparison.md
    ├── UC-005-jump-to-snapshot.md
    ├── UC-006-export-import.md
    ├── UC-007-performance-stress-test.md
    └── UC-008-history-playback.md
```

## 🔗 Связанные документы

- [SPEC.md](./SPEC.md) — Подробная спецификация
- [ADDITIONAL-USE-CASES.md](./ADDITIONAL-USE-CASES.md) — Дополнительные сценарии
- [tasks/](./tasks/) — Каталог задач
- [use-cases/](./use-cases/) — Каталог use case'ов
