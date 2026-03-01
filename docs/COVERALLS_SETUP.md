# Настройка Coveralls.io для Nexus State

Этот документ описывает процесс настройки интеграции с Coveralls.io для отслеживания покрытия тестами.

## 📋 Предварительные требования

- Репозиторий на GitHub
- Учётная запись на [Coveralls.io](https://coveralls.io)

## 🔧 Шаг 1: Добавьте репозиторий в Coveralls

1. Перейдите на [coveralls.io](https://coveralls.io)
2. Войдите через **GitHub**
3. Нажмите **ADD REPOS** (или "Add Repositories")
4. Найдите ваш репозиторий `nexus-state` и включите его
5. Скопируйте **repo_token** со страницы репозитория (если требуется)

## 🔐 Шаг 2: Добавьте токен в GitHub Secrets (опционально)

Для публичных репозиториев достаточно `GITHUB_TOKEN`. Для частных репозиториев:

1. В GitHub репозитории перейдите в **Settings → Secrets and variables → Actions**
2. Нажмите **New repository secret**
3. Добавьте секрет:

```
Name: COVERALLS_REPO_TOKEN
Value: <ваш_токен_из_Coveralls>
```

## ✅ Шаг 3: GitHub Actions workflow уже настроен

Файл `.github/workflows/coverage.yml` уже создан и настроен. Он:

- Запускается при `push` и `pull_request` в ветки `main`/`master`
- Устанавливает Node.js 20 и pnpm
- Запускает тесты с покрытием (`pnpm test:coverage`)
- Объединяет отчёты покрытия из всех пакетов monorepo
- Отправляет данные в Coveralls

## 🏷️ Шаг 4: Бейдж уже добавлен в README

Бейдж покрытия уже добавлен в начало `README.md`:

```markdown
[![Coverage Status](https://coveralls.io/repos/github/astashkin-a/nexus-state/badge.svg?branch=main)](https://coveralls.io/github/astashkin-a/nexus-state?branch=main)
```

## 🚀 Шаг 5: Проверка работы

1. Закоммитьте и запушьте изменения:

```bash
git add .
git commit -m "feat: add Coveralls.io integration"
git push
```

2. Перейдите на вкладку **Actions** в GitHub
3. Дождитесь завершения workflow **Tests & Coverage**
4. Проверьте страницу репозитория на coveralls.io

## 📊 Локальная проверка покрытия

```bash
# Запуск тестов с покрытием
pnpm test:coverage

# Объединение отчётов (для monorepo)
pnpm coverage:merge

# Просмотр HTML-отчёта
open coverage/index.html
```

## 📁 Структура файлов

```
nexus-state/
├── .github/
│   └── workflows/
│       └── coverage.yml      # GitHub Actions workflow
├── coverage/                  # Генерируется при запуске тестов
│   └── lcov.info             # Объединённый отчёт
├── packages/
│   ├── core/
│   │   └── coverage/
│   │       └── lcov.info
│   └── ...
├── vitest.config.js          # Настройки покрытия
└── README.md                 # С бейджем Coveralls
```

## ⚙️ Конфигурация vitest

Файл `vitest.config.js` настроен для monorepo:

```javascript
coverage: {
  provider: "v8",
  reporter: ["text", "json", "html", "lcov"],
  include: ["packages/*/src/**/*"],
  exclude: [
    "packages/**/src/**/*.d.ts",
    "**/legacy.ts",
    "**/*.config.*",
    "**/*.test.*",
    "**/*.spec.*",
    "packages/**/dist/**",
    "packages/**/node_modules/**",
  ],
  reportsDirectory: "./coverage",
}
```

## ⚠️ Возможные проблемы и решения

| Проблема | Решение |
|----------|---------|
| `No coverage files found` | Проверьте, что тесты запускаются с `--coverage` |
| `Repo not found` | Убедитесь, что репозиторий активирован на coveralls.io |
| `Permission denied` | Проверьте `COVERALLS_REPO_TOKEN` в secrets |
| Monorepo не работает | Workflow автоматически объединяет lcov файлы |
| Покрытие 0% | Проверьте `include` в vitest.config.js |

## 🔗 Полезные ссылки

- [Официальная документация Coveralls](https://docs.coveralls.io/)
- [Coveralls GitHub Action](https://github.com/marketplace/actions/coveralls)
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)

## 📈 Альтернативы

Если Coveralls не подойдёт, рассмотрите:

### Codecov

```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/lcov.info
    fail_ci_if_error: false
```

Бейдж:
```markdown
[![Codecov](https://codecov.io/gh/astashkin-a/nexus-state/branch/main/graph/badge.svg)](https://codecov.io/gh/astashkin-a/nexus-state)
```

---

**Дата последней актуализации:** 2026-03-01
