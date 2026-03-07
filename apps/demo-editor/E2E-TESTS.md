# E2E Testing Guide

## 📋 Обзор

E2E тесты для демо-приложения редактора используют Playwright для тестирования полного функционала приложения.

## 🚀 Быстрый старт

```bash
# Установить зависимости
pnpm install

# Установить браузеры Playwright
pnpm exec playwright install

# Запустить все тесты
pnpm test:e2e

# Запустить тесты в режиме UI (интерактивный)
pnpm test:e2e:ui

# Запустить тесты в браузере (не headless)
pnpm test:e2e:headed

# Запустить с отладкой
pnpm test:e2e:debug

# Показать отчет
pnpm test:e2e:report
```

## 📁 Структура тестов

```
e2e/
├── tests/
│   ├── basic.spec.ts        # Базовые тесты загрузки
│   ├── editor.spec.ts       # Тесты редактирования
│   ├── time-travel.spec.ts  # Тесты time-travel
│   └── toolbar.spec.ts      # Тесты toolbar
└── playwright.config.ts     # Конфигурация Playwright
```

## 📝 Описание тестов

### Basic Tests (`basic.spec.ts`)
- Загрузка приложения
- Отображение header
- Отображение редактора
- Отображение sidebar
- Отображение toolbar кнопок
- Применение темной темы

### Editor Tests (`editor.spec.ts`)
- Ввод текста
- Вставка текста
- Выделение текста
- Обновление позиции курсора
- Undo/Redo клавиатурные сокращения
- Подсветка синтаксиса

### Time-Travel Tests (`time-travel.spec.ts`)
- Отображение snapshots sidebar
- Создание снимков при вводе
- Восстановление состояния
- Отслеживание нескольких снимков

### Toolbar Tests (`toolbar.spec.ts`)
- Клик по кнопкам toolbar
- Tooltip при наведении
- Наличие всех кнопок

## 🔧 Конфигурация

### Playwright Config

Расположение: `playwright.config.ts`

```typescript
{
  testDir: "./tests",
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],
  use: {
    baseURL: "http://localhost:3005",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3005",
    reuseExistingServer: !process.env.CI,
  },
}
```

## 📊 Запуск тестов

### Все тесты
```bash
pnpm test:e2e
```

### Конкретный тест
```bash
pnpm test:e2e e2e/tests/basic.spec.ts
```

### Конкретный браузер
```bash
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit
```

### Конкретный тест (по названию)
```bash
pnpm test:e2e --grep "should load the application"
```

### Headed режим (с браузером)
```bash
pnpm test:e2e:headed
```

### Debug режим
```bash
pnpm test:e2e:debug
```

### UI режим (интерактивный)
```bash
pnpm test:e2e:ui
```

## 📈 Отчеты

После запуска тестов HTML отчет доступен по команде:
```bash
pnpm test:e2e:report
```

Отчет открывается в браузере автоматически.

## 🔍 Отладка

### Playwright Inspector
```bash
pnpm test:e2e:debug
```

### Trace Viewer
```bash
# После прогона тестов с trace
pnpm exec playwright show-trace trace.zip
```

### VS Code Extension

Установите расширение "Playwright Test for VSCode" для:
- Запуска тестов из IDE
- Пошаговой отладки
- Просмотра trace

## 🎯 Написание новых тестов

### Шаблон теста

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should do something", async ({ page }) => {
    // Arrange
    const editor = page.locator(".cm-content");
    await editor.click();

    // Act
    await editor.type("Hello");

    // Assert
    await expect(editor).toContainText("Hello");
  });
});
```

### Полезные селекторы

```typescript
// CodeMirror редактор
page.locator(".cm-content")
page.locator(".cm-editor")
page.locator(".cm-gutters")

// Toolbar кнопки
page.getByTitle("Bold")
page.getByTitle("Italic")

// Текст
page.getByText("Snapshots")
```

### Ожидания

```typescript
// Видимость
await expect(element).toBeVisible()
await expect(element).not.toBeVisible()

// Текст
await expect(element).toContainText("text")
await expect(element).toHaveText("exact text")

// Состояние
await expect(element).toBeEnabled()
await expect(element).toBeDisabled()
await expect(element).toHaveClass(/class-name/)
```

## 🚨 CI/CD Интеграция

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📝 Best Practices

1. **Используйте `beforeEach`** для навигации к странице
2. **Используйте data-testid** для стабильных селекторов
3. **Избегайте hard-coded waits** - используйте ожидания Playwright
4. **Группируйте связанные тесты** в `test.describe`
5. **Используйте page objects** для сложных тестов
6. **Делайте тесты независимыми** друг от друга

## 🔗 Ссылки

- [Playwright Documentation](https://playwright.dev)
- [Playwright Test](https://playwright.dev/docs/test-intro)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Test Assertions](https://playwright.dev/docs/test-assertions)
