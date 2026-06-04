# ART-001: Скриншоты и GIF через E2E тесты

## ✅ Преимущества использования E2E тестов

| Метод | Преимущества | Недостатки |
|-------|-------------|------------|
| **E2E тесты** | Автоматизировано, воспроизводимо, консистентно | Требует настройки data-testid |
| **Вручную** | Быстро для 1-2 скриншотов | Трудно повторить, человеческий фактор |

---

## 🚀 Быстрый старт

### Шаг 1: Запустить скриншоты

```bash
cd apps/demo-editor

# Запустить все тесты для скриншотов
pnpm test:e2e article-screenshots

# Или с заголовком (headed mode)
pnpm test:e2e:headed article-screenshots
```

### Шаг 2: Проверить результат

Скриншоты сохраняются в:
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

---

## 🎬 Запись видео для GIF

### Шаг 1: Запустить тесты с записью

```bash
cd apps/demo-editor

# Запустить тесты для записи видео
pnpm test:e2e article-gifs
```

### Шаг 2: Конвертировать видео в GIF

Видео сохраняются в `playwright-report/videos/`

**Конвертация через FFmpeg:**
```bash
# Установить ffmpeg если нет
brew install ffmpeg  # macOS
choco install ffmpeg # Windows

# Конвертировать каждый файл
for video in playwright-report/videos/*.webm; do
  ffmpeg -i "$video" -vf "fps=10,scale=800:-1" "${video%.webm}.gif"
done
```

**Онлайн конвертер:**
1. https://ezgif.com/video-to-gif
2. Загрузить .webm файл
3. Настройки: FPS=10, Scale=800px
4. Скачать GIF

### Шаг 3: Сохранить GIF

```
planning/phase-06-editor-demo/article/assets/gifs/
├── 01-creating-snapshot.gif
├── 02-undo-redo.gif
├── 03-timeline-drag.gif
├── 04-jump-to-snapshot.gif
└── 05-autoplay-history.gif
```

---

## 📝 Обновление тестов

### Проблема: Нет data-testid

Если элементы не имеют `data-testid`, тесты могут не найти их.

**Решение 1: Добавить data-testid в компоненты**

```tsx
// В компонентах добавить:
<div data-testid="timeline-slider">...</div>
<div data-testid="snapshot-list">...</div>
<button data-testid="compare-button">Compare</button>
```

**Решение 2: Использовать другие селекторы**

```typescript
// Вместо data-testid использовать:
const editor = page.locator('textarea')
const timeline = page.locator('[role="slider"]')
const snapshot = page.locator('.snapshot-item')
```

---

## 🔧 Настройка Playwright для скриншотов

### playwright.config.ts

```typescript
export default defineConfig({
  // ... другие настройки
  use: {
    baseURL: 'http://localhost:3005',
    screenshot: 'on', // 'on' | 'off' | 'only-on-failure'
    video: 'on',      // 'on' | 'off' | 'retain-on-failure'
  },
});
```

### Запуск с разными браузерами

```bash
# Chromium (рекомендуется для скриншотов)
pnpm test:e2e --project=chromium article-screenshots

# Все браузеры
pnpm test:e2e article-screenshots
```

---

## 📊 Чек-лист

### Скриншоты (10 шт)

- [ ] 01-empty-editor.png
- [ ] 02-editor-with-text.png
- [ ] 03-timeline-snapshots.png
- [ ] 04-snapshot-list.png
- [ ] 05-diff-view.png
- [ ] 06-stress-test.png
- [ ] 07-performance-metrics.png
- [ ] 08-undo-action.png
- [ ] 09-timeline-slider.png
- [ ] 10-jump-to-snapshot.png

### GIF (5 шт)

- [ ] 01-creating-snapshot.gif
- [ ] 02-undo-redo.gif
- [ ] 03-timeline-drag.gif
- [ ] 04-jump-to-snapshot.gif
- [ ] 05-autoplay-history.gif

---

## ⏱️ Оценка времени

| Задача | E2E тесты | Вручную |
|--------|-----------|---------|
| Скриншоты (10 шт) | 5 мин (запуск) + 10 мин (настройка) | 30-60 мин |
| GIF (5 шт) | 10 мин (запуск) + 15 мин (конвертация) | 60-90 мин |
| **Итого** | **40 мин** | **150 мин** |

**Экономия времени: ~2 часа**

---

## 🐛 Troubleshooting

### Тесты не находят элементы

```typescript
// Добавить waitForTimeout для ожидания рендера
await page.waitForTimeout(2000);

// Или ждать конкретный элемент
await page.waitForSelector('[data-testid="editor"]');
```

### Скриншоты размытые

```typescript
// Убедиться что viewport установлен правильно
await page.setViewportSize({ width: 1920, height: 1080 });

// Использовать fullPage
await page.screenshot({ fullPage: true });
```

### Видео не записывается

```typescript
// Включить запись в тесте
const context = await page.browser().newContext({
  recordVideo: { dir: 'videos/', size: { width: 1280, height: 720 } }
});
```

---

## 📁 Структура файлов

```
apps/demo-editor/
├── e2e/
│   └── tests/
│       ├── article-screenshots.spec.ts  # Тесты для скриншотов
│       └── article-gifs.spec.ts         # Тесты для GIF
├── playwright-report/
│   └── videos/                          # Записанные видео
│       ├── *.webm
│       └── *.gif (после конвертации)
└── ...

planning/phase-06-editor-demo/article/
├── assets/
│   ├── screenshots/                     # Скриншоты из тестов
│   └── gifs/                            # GIF из тестов
└── ...
```

---

## 🎯 Рекомендации

1. **Запускать с headed mode** для визуальной проверки:
   ```bash
   pnpm test:e2e:headed article-screenshots
   ```

2. **Использовать chromium** для консистентности:
   ```bash
   pnpm test:e2e --project=chromium article-screenshots
   ```

3. **Добавить data-testid** в ключевые элементы:
   - Editor textarea
   - Timeline slider
   - Snapshot list
   - Play/Pause buttons

4. **Автоматизировать конвертацию** GIF через скрипт:
   ```bash
   # Создать scripts/convert-to-gif.sh
   ./scripts/convert-to-gif.sh
   ```

---

*Инструкция обновлена: Март 2026*
