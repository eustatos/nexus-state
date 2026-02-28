# Testing & Coverage Guide

## Запуск тестов

### Все тесты через Turbo
```bash
npm test
```

### Тесты с покрытием (из корня проекта)
```bash
npm run test:coverage
```

### CI режим
```bash
npm run test:coverage:ci
```

## Структура тестов

Проект использует **Vitest Workspace** для разделения тестов по окружениям:

### Workspaces:

1. **core** (Node.js environment)
   - `@nexus-state/core`
   - `@nexus-state/async`
   - `@nexus-state/devtools`
   - `@nexus-state/family`
   - `@nexus-state/immer`

2. **browser-deps** (jsdom environment)
   - `@nexus-state/middleware` (использует localStorage)
   - `@nexus-state/persist` (использует localStorage/sessionStorage)

3. **react** (jsdom environment)
   - `@nexus-state/react`

4. **svelte** (jsdom environment)
   - `@nexus-state/svelte`

## Конфигурация

- `vitest.config.js` - базовая конфигурация
- `vitest.workspace.ts` - определение workspace с разными окружениями

## Покрытие

### Текущие пороги:
- Lines: 65%
- Functions: 65%
- Branches: 60%
- Statements: 65%

### Исключения из покрытия:
- Тестовые файлы (`*.test.ts`, `*.spec.ts`)
- Фикстуры (`__fixtures__/`)
- Тест-утилиты (`test-utils/`)
- Конфигурационные файлы
- Демо приложения (`apps/`)
- E2E тесты (`e2e/`)
- Документация (`docs/`)

### Отчеты

После запуска `npm run test:coverage` отчеты доступны в:
- `./coverage/index.html` - HTML отчет
- `./coverage/coverage-final.json` - JSON для CI
- `./coverage/lcov.info` - LCOV для интеграции с codecov/coveralls

## Отладка тестов

### Запуск конкретного пакета
```bash
cd packages/core
npm test
```

### Watch mode
```bash
cd packages/core
vitest --watch
```

### Отладка с UI
```bash
vitest --ui
```

## CI/CD Integration

В GitHub Actions используйте:

```yaml
- name: Run tests with coverage
  run: npm run test:coverage:ci

- name: Upload coverage
  uses: codecov/codecov-action@v4
  with:
    directory: ./coverage
```

## Troubleshooting

### Проблема: тесты не находятся
Убедитесь, что запускаете из корня проекта с флагом `--workspace`:
```bash
vitest run --workspace=vitest.workspace.ts
```

### Проблема: localStorage не определен
Проверьте, что пакет использует jsdom окружение в `vitest.workspace.ts`

### Проблема: покрытие показывает 0%
Убедитесь, что:
1. Тесты успешно проходят
2. В workspace указаны правильные `include` паттерны для coverage
3. Запускаете с флагом `--coverage`
