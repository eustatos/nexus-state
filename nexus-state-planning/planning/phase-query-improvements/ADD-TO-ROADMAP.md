# Добавление фазы Query Improvements в MASTER-ROADMAP.md

## Предлагаемые изменения

### Обновить таблицу фаз

Добавить новую фазу после Phase 03:

```markdown
| Phase | Focus | Duration | Status | Priority |
|-------|-------|----------|--------|----------|
| **Phase 00** | Core Stabilization | 3 weeks | 🟡 31% | 🔴 Critical |
| **Phase 01** | Code Quality | 2 weeks | ⬜ 0% | 🔴 Critical |
| **Phase 02** | Architecture | 2 weeks | ⬜ 0% | 🟡 Medium |
| **Phase 03** | **Ecosystem** | **6 weeks** | ⬜ 0% | 🔴 **CRITICAL** |
| **Phase 03B** | **Query Improvements** | **2 weeks** | ⬜ 0% | 🟡 **High** |
| **Phase 04** | Documentation | 2 weeks | ⬜ 0% | 🟡 High |
| **Phase 05** | v1.0 Release | 1 week | ⬜ 0% | 🔴 Critical |
```

### Добавить секцию Phase 03B

Вставить после секции Phase 03:

```markdown
### Phase 03B: Query Improvements (Weeks 7-8)

**Goal:** Улучшить эргономику @nexus-state/query для соответствия TanStack Query

**Status:** ⬜ Not Started

**Key Deliverables:**
- [ ] QUERY-001: Автоматический вывод TVariables из mutationFn
- [ ] QUERY-002: Axios хелперы (unwrapAxiosResponse, axiosMapper)
- [ ] QUERY-003: Улучшение документации по типизации
- [ ] QUERY-004: Перегрузки функций для useMutation/useQuery

**Blockers:** Phase 03 (Query package)

**Dependencies:** 
- ✅ Анализ проблемы завершён
- ⏳ Требуется стабильная версия Query package

**Estimated Effort:** 14-20 часов

**Success Metrics:**
- 90% мутаций работают без явной типизации
- Время на написание мутации сократилось на 30%
- Количество вопросов по типизации в issue уменьшилось
```

### Обновить Critical Path

Добавить в секцию "Should-Have":

```markdown
### Should-Have (Important)

1. **Phase 02:** Architecture improvements
2. **Phase 03B:** Query Improvements ← НОВОЕ
3. **Phase 04:** Documentation
```

### Обновить Timeline

Добавить в детальную временную шкалу:

```
April 2026
┌─────────┬─────────┬─────────┬─────────┐
│ Week 1  │ Week 2  │ Week 3  │ Week 4  │
│ Phase02 │ Phase02 │ Phase03 │ Phase03 │
│         │         │ Query   │ Query   │
└─────────┴─────────┴─────────┴─────────┘

May 2026
┌─────────┬─────────┬─────────┬─────────┐
│ Week 1  │ Week 2  │ Week 3  │ Week 4  │
│ Phase03B│ Phase03B│ Phase03 │ Phase03 │
│ Query   │ Query   │ Forms   │ Forms   │
│ Improve │ Improve │         │         │
└─────────┴─────────┴─────────┴─────────┘
```

## Файлы для обновления

1. `planning/MASTER-ROADMAP.md` - Основная дорожная карта
2. `planning/INDEX.md` - Индекс планирования
3. `planning/phase-query-improvements/README.md` - ✅ Уже создан
4. `planning/phase-query-improvements/INDEX.md` - ✅ Уже создан
5. `planning/phase-query-improvements/001-*.md` - ✅ Уже создан
6. `planning/phase-query-improvements/002-*.md` - ✅ Уже создан
7. `planning/phase-query-improvements/003-*.md` - ✅ Уже создан
8. `planning/phase-query-improvements/004-*.md` - ✅ Уже создан

## Следующие шаги

1. ✅ Создать фазу и задачи (ВЫПОЛНЕНО)
2. ⏳ Обновить MASTER-ROADMAP.md
3. ⏳ Начать выполнение Задачи 001 (автоматический вывод типов)
