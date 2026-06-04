# Отчёт о добавлении диаграмм Mermaid в статью

## Дата: Март 2026

## Добавленные диаграммы

### 1. Architecture Diagram (Архитектура решения)

**Местоположение:** После раздела "Структура статьи"

**Тип:** `flowchart TB`

**Описание:** Общая архитектура решения с четырьмя уровнями:
- UI Components (оранжевый) — SimpleEditor, EditorStats, TimelineSlider, SnapshotList
- Custom Hooks (фиолетовый) — useTimeTravel, useDebounceSnapshots, useSnapshots
- Nexus State Store (зелёный) — editorStore, атомы
- Time-Travel System (синий) — SimpleTimeTravel, History Queue, Delta Engine

**Цель:** Показать взаимосвязи между компонентами системы

---

### 2. Snapshot vs Delta Pattern Comparison

**Местоположение:** Шаг 0, после "Ключевые наблюдения"

**Тип:** `flowchart LR`

**Описание:** Сравнение двух паттернов хранения истории:
- **Snapshot Pattern:** Полные копии состояния (10KB каждый)
- **Delta Pattern:** Только изменения (0.3-0.5KB каждое)

**Цель:** Визуально объяснить разницу в потреблении памяти

---

### 3. Sequence Diagram: Debounce Work Flow

**Местоположение:** Шаг 5, после кода useDebounceSnapshots

**Тип:** `sequenceDiagram`

**Участники:**
- Пользователь
- Editor
- useDebounceSnapshots
- Debounce Timer
- TimeTravel

**Описание:** Показывает временную шкалу:
1. Ввод текста → сброс таймера
2. Ожидание 1000ms без событий
3. Создание снимка #1
4. Частый ввод → постоянный сброс
5. maxWait (5000ms) → принудительный снимок #2

**Цель:** Объяснить работу debounce и maxWait

---

### 4. State Diagram: Undo/Redo Transitions

**Местоположение:** Шаг 10, перед кодом TimelineSlider

**Тип:** `stateDiagram-v2`

**Состояния:**
- Empty (нет снимков)
- CanUndo (последняя версия)
- CanUndoRedo (середина истории)
- CanRedo (первая версия)
- JumpToAny (произвольный переход)

**Цель:** Показать доступные действия в каждом состоянии

---

### 5. Flowchart: Snapshot Lifecycle

**Местоположение:** Шаг 15, перед "Методология измерения"

**Тип:** `flowchart TD`

**Поддиаграммы:**
- **Capture (синий):** Создание снимка
  - handleChange → debounce → calculateDelta → сжатие → история → GC
- **Restore (зелёный):** Восстановление
  - undo/jumpTo → поиск → delta/full → применение → UI update

**Таблица временных характеристик:**
| Этап | Время |
|------|-------|
| calculateDelta | < 5ms |
| Сохранение state | < 10ms |
| Delta сжатие | < 15ms |
| Восстановление (full) | < 20ms |
| Восстановление (delta) | < 50ms |

**Цель:** Показать полный путь создания и восстановления снимка

---

## Итоговая статистика

| Диаграмма | Тип | Строк кода | Раздел |
|-----------|-----|------------|--------|
| Architecture | flowchart TB | 40 | Введение |
| Snapshot vs Delta | flowchart LR | 20 | Шаг 0 |
| Debounce Sequence | sequenceDiagram | 35 | Шаг 5 |
| Undo/Redo States | stateDiagram-v2 | 45 | Шаг 10 |
| Snapshot Lifecycle | flowchart TD | 35 | Шаг 15 |
| **Итого** | | **175 строк** | **5 диаграмм** |

## Преимущества добавления диаграмм

1. **Визуализация сложных концепций:**
   - Архитектура становится понятнее с первого взгляда
   - Разница между snapshot и delta очевидна

2. **Улучшение восприятия:**
   - Sequence diagram показывает временные зависимости
   - State diagram объясняет доступные действия

3. **Повышение evergreen-фактора:**
   - Диаграммы не зависят от версий библиотек
   - Концептуальные схемы остаются актуальными годами

4. **Соответствие стандартам Хабра:**
   - Статьи с диаграммами получают больше просмотров
   - Визуальный контент улучшает удержание внимания

## Рекомендации по рендерингу

Для корректного отображения диаграмм на Хабре:

1. **Проверить поддержку Mermaid:**
   - Хабр поддерживает Mermaid через синтаксис ```mermaid
   - Альтернатива: экспортировать как SVG/PNG

2. **Если Mermaid не работает:**
   - Использовать [Mermaid Live Editor](https://mermaid.live/)
   - Экспортировать как SVG
   - Вставить как изображения

3. **Добавить fallback:**
   - Для каждой диаграммы создать PNG-версию
   - Разместить в репозитории GitHub
   - Дать ссылку в статье

## Файлы

- **Статья:** `planning/phase-06-editor-demo/article/drafts/draft-v2-final.md`
- **Отчёт:** `planning/phase-06-editor-demo/article/drafts/MERMAID-DIAGRAMS.md`
