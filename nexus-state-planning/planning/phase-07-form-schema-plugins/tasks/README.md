# Tasks Index — Phase 07: Form Schema Plugin System

## 📋 Обзор

Каталог задач для реализации плагинной системы схем валидации в @nexus-state/form.

## 🗂️ Категории задач

- **SDK** — Разработка SDK для плагинов (типы, реестр, builder)
- **INTEGRATION** — Интеграция с ядром form
- **PLUGINS** — Плагины для внешних библиотек (Zod, Yup, AJV)
- **DSL** — Кастомная DSL и встроенные валидаторы
- **DOC** — Документация и примеры

## 📊 Список задач

| ID | Название | Категория | Приоритет | Статус | Сложность |
|----|----------|-----------|-----------|--------|-----------|
| [[TASK-001]](./TASK-001-sdk-types.md) | SDK: Типы и интерфейсы | SDK | 🔴 High | ⬜ Pending | 🟢 Low |
| [[TASK-002]](./TASK-002-sdk-registry.md) | SDK: Реестр плагинов | SDK | 🔴 High | ⬜ Pending | 🟡 Medium |
| [[TASK-003]](./TASK-003-sdk-builder.md) | SDK: Builder для плагинов | SDK | 🟡 Medium | ⬜ Pending | 🟢 Low |
| [[TASK-004]](./TASK-004-sdk-utils.md) | SDK: Утилиты | SDK | 🟢 Low | ⬜ Pending | 🟢 Low |
| [[TASK-005]](./TASK-005-form-integration.md) | Интеграция с createForm | INTEGRATION | 🔴 High | ⬜ Pending | 🟡 Medium |
| [[TASK-006]](./TASK-006-zod-plugin.md) | Плагин Zod | PLUGINS | 🔴 High | ⬜ Pending | 🟢 Low |
| [[TASK-007]](./TASK-007-yup-plugin.md) | Плагин Yup | PLUGINS | 🟡 Medium | ⬜ Pending | 🟢 Low |
| [[TASK-008]](./TASK-008-ajv-plugin.md) | Плагин AJV | PLUGINS | 🟡 Medium | ⬜ Pending | 🟡 Medium |
| [[TASK-009]](./TASK-009-dsl-plugin-core.md) | DSL плагин (ядро) | DSL | 🔴 High | ⬜ Pending | 🟡 Medium |
| [[TASK-010]](./TASK-010-dsl-built-in-validators.md) | DSL валидаторы (sync) | DSL | 🔴 High | ⬜ Pending | 🟢 Low |
| [[TASK-011]](./TASK-011-dsl-async-validators.md) | DSL валидаторы (async) | DSL | 🟡 Medium | ⬜ Pending | 🟡 Medium |
| [[TASK-012]](./TASK-012-documentation.md) | Документация | DOC | 🟡 Medium | ⬜ Pending | 🟢 Low |
| [[TASK-013]](./TASK-013-examples-demo.md) | Примеры и демо | DOC | 🟢 Low | ⬜ Pending | 🟢 Low |
| [[TASK-014]](./TASK-014-e2e-integration.md) | E2E интеграция | TESTING | 🟡 Medium | ⬜ Pending | 🟡 Medium |
| [[TASK-015]](./TASK-015-bundle-size-optimization.md) | Оптимизация bundle | OPTIMIZATION | 🟢 Low | ⬜ Pending | 🟡 Medium |

## 📈 Прогресс

```
Overall Progress: 100% (задачи созданы)

SDK          [██████████] 4/4    (100%) - задачи созданы ✅
INTEGRATION  [██████████] 1/1    (100%) - задача создана ✅
PLUGINS      [██████████] 3/3    (100%) - задачи созданы ✅
DSL          [██████████] 3/3    (100%) - задачи созданы ✅
DOC          [██████████] 2/2    (100%) - задачи созданы ✅
TESTING      [██████████] 1/1    (100%) - задача создана ✅
OPTIMIZATION [██████████] 1/1    (100%) - задача создана ✅

Все 15 задач фазы 07 созданы и готовы к реализации!
```

## 🎯 Критические задачи (MVP)

Эти задачи необходимы для базовой работоспособности:

1. [[TASK-001]](./TASK-001-sdk-types.md) — SDK: Типы и интерфейсы
2. [[TASK-002]](./TASK-002-sdk-registry.md) — SDK: Реестр плагинов
3. [[TASK-005]](./TASK-005-form-integration.md) — Интеграция с createForm
4. [[TASK-006]](./TASK-006-zod-plugin.md) — Плагин Zod (референсная реализация)
5. [[TASK-009]](./TASK-009-dsl-plugin-core.md) — DSL плагин (ядро)
6. [[TASK-010]](./TASK-010-dsl-built-in-validators.md) — DSL валидаторы (sync)

## 📋 Чек-лист готовности задачи

Каждая задача должна содержать:

- [ ] **Описание** — что и зачем делаем
- [ ] **Цель** — критерии завершения
- [ ] **Требования к коду** — стандарты качества
- [ ] **Тесты** — coverage > 90%
- [ ] **Документация** — TSDoc, примеры
- [ ] **Зависимости** — ссылки на другие задачи
- [ ] **Ресурсы** — ссылки на спецификации
- [ ] **Прогресс** — отметки о выполнении

## 🔗 Связанные документы

- [README.md](../README.md) — Обзор фазы
- [ARCHITECTURE.md](../ARCHITECTURE.md) — Архитектура
- [PLUGIN-GUIDE.md](../PLUGIN-GUIDE.md) — Руководство по плагинам

## 📝 Notes

- Все задачи выполняются последовательно (учитывать зависимости)
- Покрытие тестами > 90% обязательно для всех задач
- Отмечать прогресс в [README.md](../README.md#-Прогресс-реализации)
