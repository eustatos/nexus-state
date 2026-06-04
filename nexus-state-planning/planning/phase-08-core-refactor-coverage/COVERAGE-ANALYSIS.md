# Анализ тестового покрытия @nexus-state/core

## Общая статистика
```
Statements   : 67.84% (10261/15125)
Branches     : 85.18% (2696/3165)
Functions    : 70.67% (947/1340)
Lines        : 67.84% (10261/15125)
```

## Категории файлов по покрытию

### Категория A: 0% покрытия (44 файла)
Файлы без единого теста. Требуют написания тестов с нуля.

#### Index/Types файлы (низкий приоритет)
- `store/index.ts` — 0/1
- `time-travel/api/index.ts` — 0/1
- `time-travel/api/types.ts` — 0/1
- `time-travel/core/index.ts` — 0/1
- `time-travel/core/types.ts` — 0/1
- `time-travel/delta/index.ts` — 0/1
- `time-travel/delta/reconstructor/index.ts` — 0/1
- `time-travel/delta/reconstructor/types.interfaces.ts` — 0/1
- `time-travel/delta/compression/types.ts` — 0/1
- `time-travel/snapshot/index.ts` — 0/46
- `time-travel/snapshot/constants.ts` — 0/59
- `time-travel/snapshot/types.ts` — 0/10
- `time-travel/snapshot/snapshot-creator/index.ts` — 0/1
- `time-travel/snapshot/snapshot-creator/types.interfaces.ts` — 0/1
- `time-travel/snapshot/snapshot-creator/types.ts` — 0/1
- `time-travel/snapshot/SnapshotSerializer.ts` — 0/1
- `time-travel/tracking/index.ts` — 0/47
- `time-travel/tracking/types/index.ts` — 0/1
- `time-travel/tracking/types/interfaces.ts` — 0/1
- `time-travel/tracking/types/types.ts` — 0/1
- `time-travel/tracking/change-detector/index.ts` — 0/1
- `time-travel/tracking/change-detector/types.interfaces.ts` — 0/1
- `time-travel/tracking/stats-collector/index.ts` — 0/1
- `time-travel/tracking/stats-collector/types.interfaces.ts` — 0/1
- `time-travel/tracking/stats-collector/StatsCollectorFactory.ts` — 0/11
- `time-travel/tracking/stats-collector/StatisticsCollector.di.ts` — 0/59
- `time-travel/types.ts` — 0/1
- `utils/index.ts` — 0/1
- `utils/snapshot-serialization/index.ts` — 0/1
- `utils/snapshot-serialization/types.ts` — 0/1

#### Критические файлы (высокий приоритет)
- `time-travel/delta/DeltaAwareHistoryManager.ts` — 0/308
- `time-travel/delta/SnapshotReconstructor.ts` — 0/204
- `time-travel/snapshot/snapshot-creator/SnapshotCreator.di.ts` — 0/157
- `time-travel/tracking/change-detector/AtomChangeDetector.di.ts` — 0/126
- `time-travel/delta/DeltaSnapshotStorage.ts` — 0/94
- `time-travel/delta/SnapshotStrategy.ts` — 0/89
- `time-travel/delta/DeltaAwareHistoryFactory.ts` — 0/79
- `time-travel/tracking/AtomTrackerFactory.ts` — 0/97
- `time-travel/delta/reconstructor/OptimizedSnapshotReconstructor.ts` — 0/66
- `time-travel/delta/reconstructor/ReconstructorFactory.ts` — 0/21
- `time-travel/snapshot/snapshot-creator/SnapshotCreatorFactory.ts` — 0/25
- `time-travel/core/not-during-time-travel.ts` — 0/19

### Категория B: < 30% покрытия (10 файлов)
Файлы с минимальным покрытием. Требуют значительной работы.

| Файл | Покрытие | Строк | Проблема |
|------|----------|-------|----------|
| `time-travel/delta/compression/factory.ts` | 7.1% | 70 | Нет тестов для большинства стратегий |
| `time-travel/tracking/StatisticsCollector.ts` | 16.2% | 105 | Частичное покрытие методов |
| `time-travel/snapshot/RollbackEngine.ts` | 16.3% | 86 | Сложная логика, нужен рефакторинг |
| `time-travel/tracking/CleanupScheduler.ts` | 18.4% | 87 | Нет тестов для планировщика |
| `time-travel/tracking/AtomChangeDetector.ts` | 19.2% | 208 | Большой класс, нужен рефакторинг |
| `time-travel/tracking/TrackingEventManager.ts` | 19.5% | 123 | Нет тестов для событий |
| `time-travel/tracking/AtomEventService.ts` | 21.9% | 73 | Частичное покрытие |
| `time-travel/tracking/AtomStatsService.ts` | 22.2% | 81 | Частичное покрытие |
| `time-travel/tracking/AtomCleanupService.ts` | 22.9% | 70 | Частичное покрытие |
| `time-travel/tracking/ComputedAtomHandler.ts` | 14.5% | 220 | Сложная логика computed |
| `time-travel/tracking/AtomTracker.ts` | 26.6% | 290 | Большой класс, нужен рефакторинг |

### Категория C: 30-50% покрытия (4 файла)
| Файл | Покрытие | Строк |
|------|----------|-------|
| `time-travel/index.ts` | 35.1% | 202 |
| `utils/snapshot-serialization/advanced/strategy-registry.ts` | 35.6% | 45 |
| `time-travel/snapshot/RestorationConfig.ts` | 39.6% | 169 |
| `time-travel/delta/reconstructor.ts` | 45.1% | 226 |

### Категория D: 50-70% покрытия (5 файлов)
| Файл | Покрытие | Строк |
|------|----------|-------|
| `time-travel/snapshot/RestorationProgressTracker.ts` | 63.4% | 123 |
| `time-travel/comparison/ValueComparator.ts` | 63.6% | 371 |
| `time-travel/delta/delta-history-manager.ts` | 58.9% | 428 |
| `store/StoreImpl.ts` | 75.7% | 181 |
| `time-travel/core/HistoryManager.ts` | 76.6% | 239 |

## Рекомендации по улучшению

### Немедленные действия (Приоритет 1)
1. Написать тесты для критических файлов категории A
2. Для больших файлов (>200 строк) сначала выполнить рефакторинг

### Среднесрочные действия (Приоритет 2)
1. Покрыть тестами категорию B
2. Для файлов с покрытием < 20% рассмотреть рефакторинг

### Долгосрочные действия (Приоритет 3)
1. Довести покрытие категории C и D до 80%+
2. Добавить интеграционные тесты

## Метрики для отслеживания
- Еженедельная цель: +3-5% покрытия
- Минимальное покрытие для нового кода: 90%
- Минимальное покрытие для изменённого кода: 80%
