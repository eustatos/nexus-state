# Отчёт о внесении изменений в статью

## Дата: Март 2026

## Причина изменений

При анализе реального приложения `apps/demo-editor` было обнаружено, что оно **не использует CodeMirror**, как описано в статье, а работает с простым `textarea`.

## Внесённые изменения

### 1. Обновление зависимостей (Шаг 1)

**Было:**
```bash
pnpm add @codemirror/state @codemirror/view @codemirror/lang-javascript @codemirror/theme-one-dark
```

**Стало:**
```bash
pnpm add lucide-react
# CodeMirror удалён из зависимостей
```

### 2. Обновление структуры атомов (Шаг 2)

**Было:** Единый файл `src/store/atoms.ts`

**Стало:** Модульная структура:
```
src/store/atoms/
├── editor.ts    // contentAtom, cursorAtom, selectionAtom, isDirtyAtom, isSavingAtom, lastSavedAtom
└── stats.ts     // statsAtom (вычисляемый)
```

### 3. Упрощение создания store (Шаг 3)

**Было:**
```typescript
export const editorStore = createStore({
  atoms: [contentAtom, cursorAtom, ...]
})
```

**Стало:**
```typescript
export const editorStore = createStore()
// Атомы регистрируются автоматически при использовании
```

### 4. Обновление useDebounceSnapshots (Шаг 5)

**Изменения:**
- Используется кастомная утилита `debounce` вместо `lodash-es`
- Добавлена функция `calculateDelta` для вычисления изменений
- Добавлен `previousContentRef` для отслеживания предыдущего контента
- Добавлены методы `forceCapture`, `resetPreviousContent`

### 5. Замена CodeMirror на textarea (Шаг 6)

**Было:** Компонент `Editor.tsx` с CodeMirror 6 (~150 строк)

**Стало:** Компонент `SimpleEditor.tsx` с textarea (~80 строк)

**Ключевые отличия:**
- Убран `EditorView` и его lifecycle
- Упрощена обработка изменений
- Добавлен `handleSelect` для обновления позиции курсора

### 6. Обновление EditorStats (Шаг 7)

**Изменения:**
- Добавлен вычисляемый `statsAtom` с `readingTime`
- Обновлён UI с иконками Lucide
- Добавлен форматированный вывод времени чтения

### 7. Добавление helpers.ts

Новый файл с обёртками для time-travel:
- `captureSnapshot()`
- `jumpToSnapshot()`
- `undo()`, `redo()`
- `canUndo()`, `canRedo()`
- `getHistory()`, `clearHistory()`
- `checkDeltaThreshold()` — проверка больших изменений

### 8. Обновление примечаний

**Добавлено:**
- Примечание о том, что в демо используется `textarea`
- Ссылка на возможность интеграции CodeMirror для продакшена
- Указание версий зависимостей

## Файлы для согласования

### В статье (draft-v2-final.md):
- ✅ Шаг 1: Настройка проекта
- ✅ Шаг 2: Создание атомов
- ✅ Шаг 3: Создание store
- ✅ Шаг 5: Debounce для снимков
- ✅ Шаг 6: Компонент редактора
- ✅ Шаг 7: Компонент статистики
- ✅ Добавлен раздел о helpers.ts

### В реальном приложении (apps/demo-editor):
- ✅ `src/store/atoms/editor.ts` — соответствует
- ✅ `src/store/atoms/stats.ts` — соответствует
- ✅ `src/store/store.ts` — соответствует
- ✅ `src/store/timeTravel.ts` — соответствует
- ✅ `src/store/helpers.ts` — соответствует
- ✅ `src/hooks/useDebounceSnapshots.ts` — соответствует
- ✅ `src/components/Editor/SimpleEditor.tsx` — соответствует
- ✅ `src/components/Editor/EditorStats.tsx` — соответствует

## Evergreen-улучшения (дополнительно)

Помимо исправлений по CodeMirror, были внесены следующие улучшения для повышения "вечнозелёности" статьи:

1. **Дисклеймер о паттернах** — акцент на фундаментальных концепциях, а не только API
2. **Раздел "Альтернативные подходы"** — примеры на Redux, Zustand, Jotai
3. **Методология бенчмарков** — вместо конкретных цифр
4. **Разделение теории/практики** — явное выделение вечнозелёных частей
5. **Даты обращения** — ко всем внешним источникам
6. **Web Archive** — инструкция по восстановлению ссылок

## Итоговая оценка соответствия

| Компонент | Статья | Реальное приложение | Статус |
|-----------|--------|---------------------|--------|
| Editor компонент | textarea | textarea | ✅ Соответствует |
| Атомы | editor.ts, stats.ts | editor.ts, stats.ts | ✅ Соответствует |
| Store | createStore() | createStore() | ✅ Соответствует |
| TimeTravel | SimpleTimeTravel | SimpleTimeTravel | ✅ Соответствует |
| Debounce hook | custom debounce | custom debounce | ✅ Соответствует |
| Helpers | captureSnapshot, etc. | captureSnapshot, etc. | ✅ Соответствует |

## Рекомендации

1. **Перед публикацией:** Проверить, что демо-приложение запускается и работает
2. **Для скриншотов:** Использовать актуальный UI из apps/demo-editor
3. **Для демо:** Развернуть apps/demo-editor на Vercel/Netlify

## Файлы

- **Статья:** `planning/phase-06-editor-demo/article/drafts/draft-v2-final.md`
- **Демо:** `apps/demo-editor/`
