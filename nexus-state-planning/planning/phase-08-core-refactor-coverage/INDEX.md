# Индекс документов фазы 08

## Основные документы

| Документ | Описание |
|----------|----------|
| [README.md](./README.md) | Обзор фазы, цели, приоритеты |
| [COVERAGE-ANALYSIS.md](./COVERAGE-ANALYSIS.md) | Детальный анализ текущего покрытия |
| [REFACTORING-PLAN.md](./REFACTORING-PLAN.md) | План рефакторинга больших файлов |
| [PROGRESS-TRACKER.md](./PROGRESS-TRACKER.md) | Отслеживание прогресса выполнения |

## Задачи на рефакторинг

| ID | Задача | Файл | Строк | Покрытие |
|----|--------|------|-------|----------|
| [TASK-09](./TASK-09-computed-atom-handler-refactor.md) | ComputedAtomHandler | 220 | 14.5% → 90% |
| [TASK-14](./TASK-14-atom-change-detector-refactor.md) | AtomChangeDetector | 208 | 19.2% → 90% |
| [TASK-19](./TASK-19-atom-tracker-refactor.md) | AtomTracker | 290 | 26.6% → 90% |
| [TASK-23](./TASK-23-delta-history-manager-refactor.md) | DeltaHistoryManager | 428 | 58.9% → 90% |
| [TASK-24](./TASK-24-value-comparator-refactor.md) | ValueComparator | 371 | 63.6% → 90% |

## Задачи на написание тестов

| ID | Задача | Файл | Строк | Покрытие |
|----|--------|------|-------|----------|
| [TASK-01](./TASK-01-delta-aware-history-manager-tests.md) | DeltaAwareHistoryManager | 308 | 0% → 90% |
| [TASK-02](./TASK-02-snapshot-reconstructor-tests.md) | SnapshotReconstructor | 204 | 0% → 90% |

## Шаблоны

| Шаблон | Использование |
|--------|---------------|
| [TASK-TEMPLATE-refactor.md](./TASK-TEMPLATE-refactor.md) | Для задач рефакторинга |
| [TASK-TEMPLATE-tests.md](./TASK-TEMPLATE-tests.md) | Для задач написания тестов |

---

## Быстрый старт

### 1. Выбрать задачу
Открыть [PROGRESS-TRACKER.md](./PROGRESS-TRACKER.md) и выбрать задачу со статусом ⏳ Pending

### 2. Изучить задачу
Открыть файл задачи (TASK-XX) и изучить план

### 3. Начать выполнение
Следовать шагам из задачи, отмечать прогресс

### 4. Завершить задачу
- Обновить [PROGRESS-TRACKER.md](./PROGRESS-TRACKER.md)
- Создать PR
- Пометить задачу как ✅ Completed

---

## Чеклист качества

Для каждой задачи:

### Перед началом
- [ ] Изучён код
- [ ] Созданы characterization tests (для рефакторинга)
- [ ] Зафиксировано текущее покрытие

### Во время работы
- [ ] SPR ≤ 200 строк на PR
- [ ] strict: true (никаких `any`)
- [ ] TDD подход

### После завершения
- [ ] `pnpm build` — успешно
- [ ] `pnpm lint` — без ошибок
- [ ] `pnpm tsc --noEmit` — без ошибок
- [ ] `pnpm test` — все тесты проходят
- [ ] Покрытие ≥ 90%

---

## Контакты

Вопросы и обсуждения в канале #nexus-state-dev
