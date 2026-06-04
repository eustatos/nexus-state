# Phase 07: Form Schema Plugins Optimization

**Цель:** Оптимизировать и устранить недостатки в schema plugins

**Приоритет:** High  
**Оценка:** 3-4 недели  
**Статус:** Planning

---

## Обзор

Эта фаза фокусируется на улучшении существующих schema plugins (@nexus-state/form-schema-*) на основе анализа кодовой базы.

---

## Выявленные проблемы

### 1. Отсутствие документации
- ❌ Нет README для schema plugins
- ❌ Нет примеров использования
- ❌ Нет troubleshooting guides

### 2. Ограничения validateField
- ⚠️ Zod plugin: `validateField` возвращает `null`
- ⚠️ Yup plugin: не использует `validateAt`
- ⚠️ AJV plugin: `validateField` возвращает `null`
- ⚠️ DSL plugin: `validateField` возвращает `null`

### 3. Отсутствие text-based DSL parser
- ❌ DSL работает только programmatically
- ❌ Нет парсера для декларативного синтаксиса (из Части 6 статьи)

### 4. Bundle size
- ⚠️ Нет tree-shaking для validators
- ⚠️ Import всех validators даже если используется 1-2

### 5. i18n
- ❌ Нет поддержки локализации error messages
- ❌ Все сообщения только на английском

### 6. Examples
- ❌ Нет examples/ folder
- ❌ Нет CodeSandbox demos

---

## Задачи

См. папку `tasks/` для детальных задач:

1. [Documentation](tasks/01-documentation.md) - 2-3 дня - **HIGH PRIORITY**
2. [validateField для Yup](tasks/02-validatefield-yup.md) - 1 день - **MEDIUM**
3. [Text-based DSL Parser](tasks/03-text-based-dsl-parser.md) - 5-7 дней - **HIGH PRIORITY**
4. [Bundle Size Optimization](tasks/04-bundle-size-optimization.md) - 2-3 дня - **MEDIUM**
5. [Error Messages i18n](tasks/05-error-messages-i18n.md) - 3-4 дня - **LOW**
6. [Examples Folder](tasks/06-examples-folder.md) - 2-3 дня - **MEDIUM**

---

## Timeline

**Week 1:** Documentation + validateField для Yup  
**Week 2-3:** Text-based DSL Parser (основная фича)  
**Week 4:** Bundle Size Optimization + Examples  
**Week 5 (optional):** Error Messages i18n

---

## Приоритеты

### Must Have (Week 1-3)
- ✅ Documentation для всех plugins
- ✅ Text-based DSL Parser
- ✅ validateField для Yup

### Should Have (Week 4)
- ✅ Bundle Size Optimization
- ✅ Examples Folder

### Nice to Have (Week 5+)
- ⚠️ Error Messages i18n (можно отложить)

---

## Success Criteria

- [ ] Все schema plugins имеют полную документацию
- [ ] Text-based DSL parser работает и протестирован
- [ ] validateField реализован для Yup
- [ ] Bundle size оптимизирован (tree-shaking)
- [ ] Examples folder создан с рабочими примерами
- [ ] (Optional) i18n поддержка добавлена

---

## Dependencies

- @nexus-state/form
- @nexus-state/core
- Zod, Yup, AJV (peer dependencies)

---

## Notes

- Фокус на качестве документации (это критично для adoption)
- Text-based DSL parser — уникальная фича, выделяющая нас
- Bundle size optimization важен для production apps
- i18n можно отложить на v2 если не хватит времени
