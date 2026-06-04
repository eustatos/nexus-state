# ART-001: Выполнение через E2E тесты

## ✅ Да, E2E тесты можно и нужно использовать!

Это **автоматизирует** процесс и даёт следующие преимущества:

| Преимущество | Описание |
|-------------|----------|
| ⚡ **Скорость** | 5 минут против 2 часов вручную |
| 🔄 **Воспроизводимость** | Можно перезапустить в любой момент |
| 📐 **Консистентность** | Одинаковый размер, качество, ракурс |
| 🤖 **Автоматизация** | Не нужно кликать вручную |
| 📹 **Видео для GIF** | Запись для последующей конвертации |

---

## 🚀 Пошаговая инструкция

### Шаг 1: Подготовка

```bash
# Перейти в директорию демо-приложения
cd apps/demo-editor

# Установить зависимости (если нужно)
pnpm install

# Установить Playwright браузеры
pnpm exec playwright install chromium
```

### Шаг 2: Запуск скриншотов

```bash
# Запустить тесты для скриншотов
pnpm test:e2e:headed article-screenshots
```

**Что происходит:**
- Открывается браузер
- Загружается приложение
- Выполняются сценарии (ввод текста, клики)
- Сохраняются скриншоты

**Результат:**
```
planning/phase-06-editor-demo/article/assets/screenshots/
├── 01-empty-editor.png
├── 02-editor-with-text.png
├── 03-timeline-snapshots.png
├── 04-snapshot-list.png
├── 05-diff-view.png
├── 06-stress-test.png
├── 07-performance-metrics.png
├── 08-undo-action.png
├── 09-timeline-slider.png
└── 10-jump-to-snapshot.png
```

### Шаг 3: Запись видео для GIF

```bash
# Запустить тесты с записью видео
pnpm test:e2e:headed article-gifs
```

**Что происходит:**
- Записывается видео каждого теста
- Сохраняется в `playwright-report/videos/*.webm`

### Шаг 4: Конвертация видео в GIF

```bash
# Запустить скрипт конвертации
pnpm test:e2e:convert-gif
```

**Что происходит:**
- Находит все .webm файлы
- Конвертирует в GIF (FPS=10, 800px ширина)
- Сохраняет с правильными именами

**Результат:**
```
planning/phase-06-editor-demo/article/assets/gifs/
├── 01-creating-snapshot.gif
├── 02-undo-redo.gif
├── 03-timeline-drag.gif
├── 04-jump-to-snapshot.gif
└── 05-autoplay-history.gif
```

---

## 📁 Созданные файлы

### Тесты

| Файл | Назначение |
|------|------------|
| [`e2e/tests/article-screenshots.spec.ts`](./e2e/tests/article-screenshots.spec.ts) | Тесты для скриншотов |
| [`e2e/tests/article-gifs.spec.ts`](./e2e/tests/article-gifs.spec.ts) | Тесты для GIF |

### Скрипты

| Файл | Назначение |
|------|------------|
| [`scripts/convert-videos-to-gif.sh`](./scripts/convert-videos-to-gif.sh) | Конвертация видео в GIF |

### Документация

| Файл | Назначение |
|------|------------|
| [`ART-001-E2E-SCREENSHOTS.md`](./ART-001-E2E-SCREENSHOTS.md) | Подробная инструкция |
| [`ART-001-CHECKLIST.md`](./ART-001-CHECKLIST.md) | Чек-лист выполнения |

---

## 🔧 Команды

```bash
# Только скриншоты
pnpm test:e2e:screenshots

# Только GIF (запись видео)
pnpm test:e2e:gifs

# Конвертация видео в GIF
pnpm test:e2e:convert-gif

# Всё вместе
pnpm test:e2e:screenshots && pnpm test:e2e:gifs && pnpm test:e2e:convert-gif
```

---

## 📊 Тайминг

| Задача | Время |
|--------|-------|
| Запуск скриншотов | 2-3 мин |
| Запуск GIF (запись) | 3-5 мин |
| Конвертация в GIF | 1-2 мин |
| **Итого** | **6-10 мин** |

**Сравнение с ручным режимом:**
- Скриншоты вручную: 30-60 мин
- GIF вручную: 60-90 мин
- **Итого вручную: 90-150 мин**

**Экономия: ~80-140 минут (1.5-2 часа)**

---

## 🐛 Возможные проблемы

### 1. Тесты не находят элементы

**Решение:** Добавить `data-testid` в компоненты

```tsx
// Пример:
<div data-testid="timeline-slider">...</div>
<div data-testid="snapshot-list">...</div>
```

**Или использовать другие селекторы:**
```typescript
const editor = page.locator('textarea')
const snapshot = page.locator('.snapshot-item')
```

### 2. Скриншоты размытые

**Решение:** Установить правильный viewport
```typescript
await page.setViewportSize({ width: 1920, height: 1080 });
```

### 3. ffmpeg не установлен

**Решение:**
```bash
# macOS
brew install ffmpeg

# Windows
choco install ffmpeg

# Linux
sudo apt-get install ffmpeg
```

### 4. Видео не записывается

**Решение:** Проверить настройки Playwright
```typescript
// playwright.config.ts
use: {
  video: 'on',
  recordVideo: { dir: 'playwright-report/videos' }
}
```

---

## ✅ Чек-лист выполнения

- [ ] Запустить `pnpm test:e2e:screenshots`
- [ ] Проверить 10 скриншотов в `assets/screenshots/`
- [ ] Запустить `pnpm test:e2e:gifs`
- [ ] Проверить видео в `playwright-report/videos/`
- [ ] Запустить `pnpm test:e2e:convert-gif`
- [ ] Проверить 5 GIF в `assets/gifs/`
- [ ] Убедиться что все файлы открываются
- [ ] Оптимизировать GIF если нужно

---

## 📁 Итоговая структура

```
apps/demo-editor/
├── e2e/tests/
│   ├── article-screenshots.spec.ts
│   └── article-gifs.spec.ts
├── scripts/
│   └── convert-videos-to-gif.sh
└── playwright-report/
    └── videos/
        └── *.webm

planning/phase-06-editor-demo/article/
├── assets/
│   ├── screenshots/     (10 файлов)
│   └── gifs/            (5 файлов)
├── ART-001-E2E-SCREENSHOTS.md
└── ART-001-CHECKLIST.md
```

---

## 🎯 Рекомендации

1. **Запускать в headed mode** для визуального контроля:
   ```bash
   pnpm test:e2e:headed article-screenshots
   ```

2. **Использовать Chromium** для консистентности:
   ```bash
   pnpm test:e2e --project=chromium article-screenshots
   ```

3. **Добавить data-testid** если элементы не находятся

4. **Проверить размер GIF** — должен быть < 5MB

---

**Готово!** Теперь можно использовать скриншоты и GIF в статье.

Следующий шаг: **[ART-002: Структура статьи](./ART-002-outline.md)**
