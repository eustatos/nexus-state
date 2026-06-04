# TASK-003: Базовый компонент редактора (Editor Component)

## 📋 Описание

Создание основного компонента текстового редактора на базе `<textarea>` с интеграцией Nexus State для управления состоянием.

## 🎯 Цель

Реализовать полнофункциональный редактор с поддержкой ввода текста, отображения курсора, выделения и синхронизации с состоянием Nexus State.

**Примечание:** Используется нативный `<textarea>` вместо CodeMirror/Monaco для:
- Минимальных зависимостей
- Быстрой загрузки
- Фокуса на демонстрации time-travel
- Стабильной работы E2E тестов

## 📦 Технические требования

### Библиотеки

- **Нативный textarea** — без дополнительных зависимостей
- **@nexus-state/react** — хук useAtomValue/useSetAtom для реактивности

### Функционал

- Ввод и редактирование текста
- Отображение курсора и выделения (нативное)
- Темная тема оформления
- Авто-размеры (flex)
- Отслеживание позиции курсора

## ✅ Задачи

### 3.1: Создание базового компонента SimpleEditor

**src/components/Editor/SimpleEditor.tsx:**
```typescript
import { useAtomValue, useSetAtom } from '@nexus-state/react'
import { contentAtom, cursorAtom } from '@/store/atoms/editor'
import { editorStore } from '@/store/store'

export function SimpleEditor() {
  const content = useAtomValue(contentAtom, editorStore)
  const setContent = useSetAtom(contentAtom, editorStore)
  const setCursor = useSetAtom(cursorAtom, editorStore)
  
  // Реализация через textarea
}
```

### 3.2: Стили редактора

**src/components/Editor/Editor.css:**
- Темная тема
- Monospace шрифт
- Focus styles
- Placeholder styling

### 3.3: Toolbar редактора (опционально)

**src/components/Editor/EditorToolbar.tsx:**
- Кнопки действий (Clear, Copy, etc.)

### 3.4: Интеграция в App

**src/App.tsx:**
- Подключение SimpleEditor

## 🧪 Критерии приемки

- [ ] Редактор отображается корректно
- [ ] Ввод текста работает
- [ ] Курсор отображается и обновляется
- [ ] Выделение текста работает (нативное)
- [ ] Синхронизация с Nexus State работает
- [ ] Темная тема применяется
- [ ] Нет ошибок в консоли
- [ ] TypeScript компилируется без ошибок

## 📁 Зависимости

- [[TASK-001]](./TASK-001-project-setup.md) — Настройка проекта
- [[TASK-002]](./TASK-002-store-atoms.md) — Создание атомов и store

## 🔗 Связанные задачи

- [[TASK-004]](./TASK-004-stats-component.md) — Компонент статистики
- [[TASK-005]](./TASK-005-debounce-snapshots.md) — Debounce для снимков

## 📝 Заметки

- Нативный textarea не требует дополнительных зависимостей
- Для подсветки синтаксиса можно добавить Prism.js позже
- E2E тесты работают стабильнее с нативными элементами
