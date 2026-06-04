# Фаза 08: Рефакторинг и повышение тестового покрытия @nexus-state/core

## Цель
Повышение тестового покрытия packages/core с **67.84%** до **85%+** с одновременным улучшением архитектуры кода.

## Текущее состояние
- **Покрытие:** 67.84% строк, 85.18% ветвей, 70.67% функций
- **Тестов:** 2484 (все проходят)
- **Проблемных файлов:** 44 файла с покрытием < 50%

## Документы фазы

| Документ | Описание |
|----------|----------|
| [INDEX.md](./INDEX.md) | Индекс всех документов |
| [COVERAGE-ANALYSIS.md](./COVERAGE-ANALYSIS.md) | Детальный анализ текущего покрытия |
| [REFACTORING-PLAN.md](./REFACTORING-PLAN.md) | План рефакторинга больших файлов |
| [PROGRESS-TRACKER.md](./PROGRESS-TRACKER.md) | Отслеживание прогресса выполнения |

## Приоритеты

### Приоритет 1: Файлы с 0% покрытием (критические)
| Файл | Строк | Задача |
|------|-------|--------|
| `time-travel/delta/DeltaAwareHistoryManager.ts` | 308 | [TASK-01](./TASK-01-delta-aware-history-manager-tests.md) |
| `time-travel/delta/SnapshotReconstructor.ts` | 204 | [TASK-02](./TASK-02-snapshot-reconstructor-tests.md) |
| `time-travel/snapshot/snapshot-creator/SnapshotCreator.di.ts` | 157 | TASK-03 |
| `time-travel/tracking/change-detector/AtomChangeDetector.di.ts` | 126 | TASK-04 |
| `time-travel/delta/DeltaSnapshotStorage.ts` | 94 | TASK-05 |
| `time-travel/delta/SnapshotStrategy.ts` | 89 | TASK-06 |
| `time-travel/delta/DeltaAwareHistoryFactory.ts` | 79 | TASK-07 |
| `time-travel/tracking/AtomTrackerFactory.ts` | 97 | TASK-08 |
| `time-travel/tracking/ComputedAtomHandler.ts` | 220 | [TASK-09](./TASK-09-computed-atom-handler-refactor.md) (рефакторинг + тесты) |

### Приоритет 2: Файлы с покрытием < 30%
| Файл | Покрытие | Строк | Задача |
|------|----------|-------|--------|
| `time-travel/delta/compression/factory.ts` | 7.1% | 70 | TASK-10 |
| `time-travel/tracking/StatisticsCollector.ts` | 16.2% | 105 | TASK-11 |
| `time-travel/snapshot/RollbackEngine.ts` | 16.3% | 86 | TASK-12 (рефакторинг) |
| `time-travel/tracking/CleanupScheduler.ts` | 18.4% | 87 | TASK-13 |
| `time-travel/tracking/AtomChangeDetector.ts` | 19.2% | 208 | [TASK-14](./TASK-14-atom-change-detector-refactor.md) (рефакторинг) |
| `time-travel/tracking/TrackingEventManager.ts` | 19.5% | 123 | TASK-15 |
| `time-travel/tracking/AtomEventService.ts` | 21.9% | 73 | TASK-16 |
| `time-travel/tracking/AtomStatsService.ts` | 22.2% | 81 | TASK-17 |
| `time-travel/tracking/AtomCleanupService.ts` | 22.9% | 70 | TASK-18 |
| `time-travel/tracking/AtomTracker.ts` | 26.6% | 290 | [TASK-19](./TASK-19-atom-tracker-refactor.md) (рефакторинг) |

### Приоритет 3: Файлы с покрытием 30-70%
| Файл | Покрытие | Строк | Задача |
|------|----------|-------|--------|
| `time-travel/delta/reconstructor.ts` | 45.1% | 226 | TASK-20 |
| `time-travel/snapshot/RestorationConfig.ts` | 39.6% | 169 | TASK-21 |
| `time-travel/index.ts` | 35.1% | 202 | TASK-22 |
| `time-travel/delta/delta-history-manager.ts` | 58.9% | 428 | [TASK-23](./TASK-23-delta-history-manager-refactor.md) (рефакторинг) |
| `time-travel/comparison/ValueComparator.ts` | 63.6% | 371 | [TASK-24](./TASK-24-value-comparator-refactor.md) (рефакторинг) |
| `store/StoreImpl.ts` | 75.7% | 181 | TASK-25 |

## Требования к выполнению задач

### Для всех задач
- ✅ **strict: true** в TypeScript
- ✅ **SPR (Small Pull Requests)** — каждый PR ≤ 200 строк изменений
- ✅ **TDD подход** — сначала тесты, потом реализация
- ✅ **100% покрытие** для нового кода
- ✅ **Проверка сборки:** `pnpm build`
- ✅ **Проверка линтинга:** `pnpm lint`
- ✅ **Проверка типов:** `pnpm tsc --noEmit`
- ✅ **Запуск тестов:** `pnpm test`

### Для задач с рефакторингом
1. Создать тесты для текущего поведения (characterization tests)
2. Выполнить рефакторинг малыми шагами
3. Убедиться, что все тесты проходят после каждого шага
4. Обновить документацию при изменении API

### Для задач с написанием тестов
1. Покрыть все публичные методы
2. Протестировать граничные случаи
3. Протестировать обработку ошибок
4. Добавить интеграционные тесты при необходимости

## Критерии завершения фазы
- [ ] Покрытие строк ≥ 85%
- [ ] Покрытие функций ≥ 85%
- [ ] Все тесты проходят
- [ ] Сборка без ошибок
- [ ] Линтинг без ошибок
- [ ] Нет TODO в новом коде

## Ссылки
- [INDEX.md](./INDEX.md) — Индекс всех документов
- [COVERAGE-ANALYSIS.md](./COVERAGE-ANALYSIS.md) — Детальный анализ текущего покрытия
- [REFACTORING-PLAN.md](./REFACTORING-PLAN.md) — План рефакторинга больших файлов
- [PROGRESS-TRACKER.md](./PROGRESS-TRACKER.md) — Отслеживание прогресса выполнения
- [TASK-TEMPLATE-refactor.md](./TASK-TEMPLATE-refactor.md) — Шаблон для задач рефакторинга
- [TASK-TEMPLATE-tests.md](./TASK-TEMPLATE-tests.md) — Шаблон для задач написания тестов
