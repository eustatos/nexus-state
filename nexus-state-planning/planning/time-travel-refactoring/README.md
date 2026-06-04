# Time-Travel Refactoring Plan

## Цель

Выделить time-travel функциональность из `@nexus-state/core` в отдельные пакеты для уменьшения размера core с 3.9 MB до 500 KB (87% экономии).

## Текущая ситуация

- **@nexus-state/core**: 3.9 MB (time-travel = 3.4 MB / 87%)
- **@nexus-state/devtools**: 2.3 MB (зависит от core)
- **19 пакетов** зависят от core и вынуждены тащить time-travel

## Целевая архитектура

```
@nexus-state/core (~500 KB)
└── Базовый state management

@nexus-state/undo-redo (~150 KB)
└── User-facing undo/redo для форм и редакторов

@nexus-state/time-travel (~2.8 MB)
└── Advanced time-travel для DevTools

@nexus-state/devtools (~1.5 MB)
└── Redux DevTools интеграция
```

## Результаты

| Use Case | Сейчас | После | Экономия |
|----------|--------|-------|----------|
| Простой store | 3.9 MB | 500 KB | 87% |
| Формы с undo | 3.9 MB | 650 KB | 83% |
| DevTools (dev) | 6.2 MB | 4.8 MB | 23% |

## Фазы

1. [Фаза 1: Создание @nexus-state/undo-redo](./phase-1-undo-redo/README.md)
2. [Фаза 2: Создание @nexus-state/time-travel](./phase-2-time-travel/README.md)
3. [Фаза 3: Рефакторинг @nexus-state/core](./phase-3-core-cleanup/README.md)
4. [Фаза 4: Рефакторинг @nexus-state/devtools](./phase-4-devtools-refactor/README.md)
5. [Фаза 5: Миграция зависимых пакетов](./phase-5-migration/README.md)
6. [Фаза 6: Документация и релиз](./phase-6-documentation/README.md)

## Оценка времени

- **Фаза 1**: 1-2 дня
- **Фаза 2**: 1 день
- **Фаза 3**: 1 день
- **Фаза 4**: 1 день
- **Фаза 5**: 1 день
- **Фаза 6**: 1 день

**Итого**: 6-7 дней

## Breaking Changes

- Импорты time-travel изменятся: `@nexus-state/core/time-travel` → `@nexus-state/time-travel`
- Backward compatibility через re-exports (deprecated)
- Migration guide для пользователей
