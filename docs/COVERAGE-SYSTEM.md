# Система покрытия тестами для пакетов

## Обзор

Этот документ описывает систему измерения и отображения покрытия тестами для каждого пакета в монорепозитории nexus-state.

## Архитектура

### Workflow

#### 1. `coverage-packages.yml` (основной workflow)
Запускает тесты с покрытием для **каждого пакета отдельно** и отправляет отчёты в Coveralls.

**Особенности:**
- ✅ Параллельный запуск для всех пакетов (матрица)
- ✅ Отдельный отчёт для каждого пакета
- ✅ Индивидуальные бейджи в README
- ✅ Таймаут 15 минут на пакет

**Этапы:**
1. **test-coverage** - запуск тестов для каждого пакета параллельно
2. **send-to-coveralls** - отправка отчётов в Coveralls с `flag-name`
3. **coveralls-finished** - завершение параллельных загрузок

#### 2. `coverage.yml` (устаревший)
Помечен как deprecated. Не используется.

### Скрипты

#### `scripts/add-coverage-badges.js`
Автоматически добавляет бейджи покрытия в README файлов пакетов.

**Использование:**
```bash
# Добавить бейджи во все пакеты
pnpm coverage:badges

# Добавить бейдж в конкретный пакет
pnpm coverage:badge core
node scripts/add-coverage-badges.js react
```

#### Новые npm скрипты
```json
{
  "test:coverage:packages": "pnpm --filter \"@nexus-state/*\" test:coverage",
  "coverage:badges": "node scripts/add-coverage-badges.js",
  "coverage:badge": "node scripts/add-coverage-badges.js"
}
```

## Конфигурация покрытия

### vitest.config.js (корневой)
```javascript
coverage: {
  include: ["packages/*/src/**/*.{ts,tsx}"],
  exclude: [
    "apps/**",              // Исключаем приложения
    "**/__tests__/**",      // Исключаем тесты
    "**/__fixtures__/**",   // Исключаем фикстуры
    "**/__benchmarks__/**", // Исключаем бенчмарки
    "**/test-utils.ts",     // Исключаем test-utils
    "**/*.d.ts",            // Исключаем декларации
    // ... другие исключения
  ]
}
```

### vitest.config.ts (в каждом пакете)
Аналогичная конфигурация для консистентности.

## Бейджи в README

### Формат бейджа
```markdown
[![Coverage for {package} package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name={package})](https://coveralls.io/github/eustatos/nexus-state?branch=main)
```

### Примеры
- **core**: `job_name=core`
- **react**: `job_name=react`
- **family**: `job_name=family`

### Расположение в README
Бейдж добавляется после существующих бейджей (npm version, downloads) в описании пакета.

## Поддерживаемые пакеты

| Пакет | Flag Name | Бейдж |
|-------|-----------|-------|
| @nexus-state/core | core | ✅ |
| @nexus-state/react | react | ✅ |
| @nexus-state/family | family | ✅ |
| @nexus-state/async | async | ✅ |
| @nexus-state/devtools | devtools | ✅ |
| @nexus-state/form | form | ✅ |
| @nexus-state/immer | immer | ✅ |
| @nexus-state/middleware | middleware | ✅ |
| @nexus-state/persist | persist | ✅ |
| @nexus-state/query | query | ✅ |
| @nexus-state/svelte | svelte | ✅ |
| @nexus-state/vue | vue | ✅ |
| @nexus-state/web-worker | web-worker | ✅ |

## Локальная разработка

### Запуск покрытия для одного пакета
```bash
# Core package
pnpm --filter @nexus-state/core test:coverage

# React package
pnpm --filter @nexus-state/react test:coverage

# Все пакеты
pnpm test:coverage:packages
```

### Просмотр отчёта
После запуска тестов отчёт доступен в:
```
packages/{package-name}/coverage/lcov.info
packages/{package-name}/coverage/index.html (HTML отчёт)
```

## CI/CD

### Триггеры
- Push в ветки `main`, `master`
- Pull Request в ветки `main`, `master`

### Время выполнения
- **Параллельный режим**: ~10-15 минут (все пакеты одновременно)
- **Последовательный режим**: ~30-40 минут (не используется)

### Артефакты
- Coverage отчёты сохраняются на 1 день
- Используются для отправки в Coveralls

## Coveralls Integration

### Настройка
1. Репозиторий подключён к Coveralls
2. Используется `github-token` для аутентификации
3. Каждый пакет имеет свой `flag-name`

### Просмотр покрытия
- **Все пакеты**: https://coveralls.io/github/eustatos/nexus-state
- **Конкретный пакет**: Выберите flag на странице Coveralls

## Устранение неполадок

### Пакет не отправляет покрытие
1. Проверьте наличие `vitest.config.ts` с настройками coverage
2. Убедитесь, что тесты запускаются с флагом `--coverage`
3. Проверьте путь к `lcov.info`: `packages/{name}/coverage/lcov.info`

### Бейдж не отображается
1. Запустите `pnpm coverage:badges`
2. Проверьте, что `job_name` совпадает с именем пакета
3. Убедитесь, что Coveralls получил отчёт

### Таймаут в CI
- Увеличьте `timeout-minutes` в workflow (сейчас 15)
- Оптимизируйте тесты пакета
- Разделите тесты на несколько jobs

## Миграция со старой системы

### До изменений
```yaml
# Один workflow для всех
- run: pnpm test:coverage  # Запускает всё подряд
- merge coverage files     # Ручное объединение
- send to Coveralls        # Один отчёт для всех
```

### После изменений
```yaml
# Матрица для каждого пакета
- matrix: [core, react, ...]
  run: pnpm --filter test:coverage
- send to Coveralls with flag-name  # Отдельно для каждого
```

### Преимущества
- ✅ Независимые отчёты для каждого пакета
- ✅ Индивидуальные бейджи
- ✅ Параллельный запуск (быстрее)
- ✅ Легче отслеживать регрессии
- ✅ Чёткая принадлежность покрытия

## Поддержка

При возникновении проблем:
1. Проверьте логи CI
2. Запустите локально: `pnpm --filter @nexus-state/{pkg} test:coverage`
3. Проверьте конфигурацию vitest
4. Убедитесь, что `lcov.info` генерируется

## Changelog

### 2026-03-07
- ✅ Создан workflow `coverage-packages.yml`
- ✅ Добавлен скрипт `add-coverage-badges.js`
- ✅ Обновлены README всех пакетов с бейджами
- ✅ Исключены `apps/**` из покрытия
- ✅ Исключены тестовые файлы из покрытия
- ✅ Добавлены таймауты в turbo.json
