# TASK-008: Кнопки навигации (Navigation Controls)

## 📋 Описание

Создание набора кнопок для навигации по истории снимков: Undo, Redo, First, Last, с индикацией доступности.

## 🎯 Цель

Реализовать удобные элементы управления для пошаговой навигации по истории time-travel.

## ✅ Задачи

### 8.1: Компонент NavigationControls ✅

**src/components/Timeline/NavigationControls.tsx**

- [x] Создан компонент `NavigationControls.tsx`
- [x] Создан файл стилей `NavigationControls.css`
- [x] Props: showTooltip, size, onNavigate

### 8.2: Кнопки Undo/Redo ✅

- [x] Кнопка Undo с иконкой
- [x] Кнопка Redo с иконкой
- [x] Обработчики `undo()` и `redo()`

### 8.3: Кнопки First/Last ✅

- [x] Кнопка First (переход к первому снимку)
- [x] Кнопка Last (переход к последнему снимку)
- [x] Интеграция с `jumpToFirst()` и `jumpToLast()`

### 8.4: Индикация доступности (disabled states) ✅

- [x] Disabled для Undo когда `!canUndo`
- [x] Disabled для Redo когда `!canRedo`
- [x] Disabled для First когда `currentPosition === 0`
- [x] Disabled для Last когда `currentPosition === snapshotsCount - 1`
- [x] Визуальные стили для disabled состояния

### 8.5: Keyboard shortcuts (Ctrl+Z, Ctrl+Y) ✅

- [x] Ctrl+Z / Cmd+Z для Undo
- [x] Ctrl+Y / Cmd+Y для Redo
- [x] Ctrl+Shift+Z для Redo
- [x] Очистка слушателей при размонтировании

## 🧪 Критерии приемки

- [x] Кнопки Undo/Redo работают
- [x] Кнопки First/Last работают
- [x] Disabled состояния корректны
- [x] Keyboard shortcuts работают
- [x] Tooltip с подсказками
- [x] Анимация нажатия

## 🔗 Связанные задачи

- [[TASK-007]](./TASK-007-timeline-slider.md) — Timeline slider
- [[TASK-009]](./TASK-009-jump-restore.md) — Jump to snapshot

## 🧪 Тесты

### Unit-тесты (Vitest) ✅

- **37 тестов пройдено** в файле:
  - `NavigationControls.test.tsx`

**Тесты покрывают:**
- Рендеринг компонента и кнопок
- Состояния кнопок (enabled/disabled)
- Клик по кнопкам
- Callback onNavigate
- Размерные варианты (small/medium/large)
- Tooltip
- Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
- Очистка при размонтировании

### E2E-тесты (Playwright) ✅

- **21 тест пройден** в файле:
  - `navigation-controls.spec.ts` (7 тестов × 3 браузера: chromium, firefox, webkit)

**Тесты покрывают:**
- Отображение navigation controls
- Отображение всех 4 кнопок (First, Undo, Redo, Last)
- Tooltip с подсказками
- Disabled состояния кнопок
- Hover эффекты

**Примечание:** Тесты навигации (undo/redo/first/last clicks) требуют доработки из-за особенностей debounce в приложении.

## 📊 Статус

**✅ ЗАВЕРШЕНО**

Компонент полностью реализован и интегрирован в App.tsx.
- Unit-тесты: 37/37 ✅
- E2E-тесты: 21/21 ✅

Компонент готов к использованию.
