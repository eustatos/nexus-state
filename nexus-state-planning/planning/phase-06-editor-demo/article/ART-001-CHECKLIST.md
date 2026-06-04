# ART-001: Чек-лист выполнения

**Статус:** ⬜ В процессе  
**Прогресс:** 0%

**Метод:** ✅ E2E тесты (автоматизировано)

---

## 📸 1. Скриншоты интерфейса (E2E тесты)

**Цель:** 10 скриншотов высокого качества

**Запуск:**
```bash
cd apps/demo-editor
pnpm test:e2e:headed article-screenshots
```

**Файл:** `e2e/tests/article-screenshots.spec.ts`

- [ ] 01-empty-editor.png — Пустой редактор
- [ ] 02-editor-with-text.png — Редактор с текстом
- [ ] 03-timeline-snapshots.png — Timeline с снимками
- [ ] 04-snapshot-list.png — Список снимков в сайдбаре
- [ ] 05-diff-view.png — Diff view (сравнение версий)
- [ ] 06-stress-test.png — Stress test в действии
- [ ] 07-performance-metrics.png — Метрики производительности
- [ ] 08-undo-action.png — Undo действие
- [ ] 09-timeline-slider.png — Timeline slider
- [ ] 10-jump-to-snapshot.png — Jump to snapshot

**Путь:** `planning/phase-06-editor-demo/article/assets/screenshots/`

---

## 🎬 2. GIF-анимации (E2E тесты с записью)

**Цель:** 5 GIF-анимаций

**Запуск:**
```bash
cd apps/demo-editor
pnpm test:e2e:headed article-gifs
```

**Файл:** `e2e/tests/article-gifs.spec.ts`

**Конвертация:**
```bash
# FFmpeg
for video in playwright-report/videos/*.webm; do
  ffmpeg -i "$video" -vf "fps=10,scale=800:-1" "${video%.webm}.gif"
done
```

- [ ] 01-creating-snapshot.gif — Создание снимка (ввод текста)
- [ ] 02-undo-redo.gif — Undo/Redo навигация
- [ ] 03-timeline-drag.gif — Drag timeline slider
- [ ] 04-jump-to-snapshot.gif — Jump to snapshot
- [ ] 05-autoplay-history.gif — Autoplay истории

**Путь:** `planning/phase-06-editor-demo/article/assets/gifs/`

---

## 🎬 2. GIF-анимации

**Цель:** 6+ GIF-анимаций

- [ ] 01-creating-snapshot.gif — Создание снимка (ввод текста)
- [ ] 02-undo-redo.gif — Undo/Redo навигация
- [ ] 03-timeline-drag.gif — Drag timeline slider
- [ ] 04-jump-to-snapshot.gif — Jump to snapshot
- [ ] 05-autoplay-history.gif — Autoplay истории
- [ ] 06-diff-update.gif — Diff view обновление

**Инструменты:**
- Запись: OBS Studio / Loom
- Конвертация: https://ezgif.com/video-to-gif
- Оптимизация: gifsicle

**Требования:**
- Длительность: 3-15 сек
- FPS: 10
- Размер: < 5MB

---

## 📊 3. Метрики производительности

**Цель:** 6+ метрик

- [ ] Время захвата снимка (target: < 50ms)
- [ ] Время восстановления (target: < 100ms)
- [ ] Размер снимка (delta) (target: < 1KB)
- [ ] Потребление памяти (target: < 50MB)
- [ ] FPS при анимации (target: 60)
- [ ] Время загрузки приложения (target: < 2s)

**Инструмент:**
```bash
# Запустить демо
cd apps/demo-editor
pnpm dev

# В консоли браузера выполнить:
# apps/demo-editor/src/test/collect-metrics.ts
```

**Результат сохранить:**
`planning/phase-06-editor-demo/article/metrics/performance-results.json`

---

## 💻 4. Примеры кода

**Цель:** 6+ примеров

- [ ] 01-store-setup.ts — Базовая настройка store
- [ ] 02-atoms.ts — Создание атомов
- [ ] 03-time-travel.ts — Time-travel конфигурация
- [ ] 04-debounce.ts — Debounce snapshots хук
- [ ] 05-editor.tsx — Editor компонент с интеграцией
- [ ] 06-timeline.tsx — Timeline slider компонент

**Требования:**
- Рабочий код (протестированный)
- Комментарии для ключевых моментов
- Форматирование: Prettier
- TypeScript strict mode

**Сохранить:**
`planning/phase-06-editor-demo/article/code-examples/`

---

## 🎬 5. Демонстрационные сценарии

**Цель:** 5 протестированных сценариев

- [ ] Базовое редактирование
  - [ ] Ввод текста
  - [ ] Создание снимка
  - [ ] Проверка истории
- [ ] Undo/Redo
  - [ ] Ctrl+Z
  - [ ] Ctrl+Y
  - [ ] Проверка состояния
- [ ] Jump to snapshot
  - [ ] Клик на снимке
  - [ ] Проверка контента
- [ ] Timeline drag
  - [ ] Drag & drop
  - [ ] Плавность
- [ ] Stress test
  - [ ] Быстрый ввод
  - [ ] Проверка метрик

**Сохранить:**
`planning/phase-06-editor-demo/article/demo-scenarios.md`

---

## 📁 6. Диаграммы

**Цель:** 2+ диаграммы

- [ ] 01-architecture.png — Архитектура приложения
- [ ] 02-data-flow.png — Поток данных time-travel
- [ ] 03-snapshot-structure.png — Структура снимка (опционально)

**Инструменты:**
- Mermaid.js: https://mermaid.live/
- Excalidraw: https://excalidraw.com

**Исходники сохранить:**
`planning/phase-06-editor-demo/article/assets/diagrams/*.mmd`

**Экспорт:**
`planning/phase-06-editor-demo/article/assets/diagrams/*.png`

---

## ✅ Критерии приемки

### Минимальные (MVP)
- [ ] 3+ скриншота
- [ ] 2+ GIF
- [ ] 3+ метрики
- [ ] 3+ примера кода
- [ ] 2+ сценария
- [ ] 1+ диаграмма

### Полные
- [ ] 7+ скриншотов ✅
- [ ] 6+ GIF ✅
- [ ] 6+ метрик ✅
- [ ] 6+ примеров кода ✅
- [ ] 5+ сценариев ✅
- [ ] 2+ диаграммы ✅

---

## 📁 Итоговая структура

```
planning/phase-06-editor-demo/article/
├── assets/
│   ├── screenshots/       [7+ файлов]
│   ├── gifs/              [6+ файлов]
│   └── diagrams/          [2+ файлов]
├── code-examples/         [6+ файлов]
├── metrics/
│   └── performance-results.json
├── demo-scenarios.md
└── ART-001-COMPLETION.md
```

---

## 🕐 Трекер времени

| Задача | План | Факт | Статус |
|--------|------|------|--------|
| Скриншоты | 1-2 ч | | ⬜ |
| GIF-анимации | 2-3 ч | | ⬜ |
| Метрики | 1-2 ч | | ⬜ |
| Примеры кода | 2-3 ч | | ⬜ |
| Сценарии | 1-2 ч | | ⬜ |
| Диаграммы | 2-3 ч | | ⬜ |
| **Итого** | **9-15 ч** | | |

---

## 🚀 Быстрый старт (2.5 часа)

Если нужно быстро начать статью:

1. **Скриншоты (30 мин):** 01, 02, 03
2. **GIF (30 мин):** 01, 02
3. **Примеры кода (1 час):** 01, 02, 03
4. **Метрики (30 мин):** базовые

---

## 🔗 Связанные документы

- [ART-001-EXECUTION.md](./ART-001-EXECUTION.md) — Подробная инструкция
- [ART-001-material-collection.md](./ART-001-material-collection.md) — Оригинальная задача
- [research/article-recommendations.md](./research/article-recommendations.md) — Рекомендации для статьи

---

*Чек-лист обновлён: Март 2026*
