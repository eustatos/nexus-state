# Task 01: Documentation для Schema Plugins

**Приоритет:** High  
**Оценка:** 2-3 дня  
**Статус:** Todo

---

## Цель

Добавить полноценную документацию (README) для всех schema plugins с примерами использования.

---

## Scope

### 1. @nexus-state/form-schema-zod

**README.md должен содержать:**
- Краткое описание и use cases
- Installation instructions
- Basic usage example
- Advanced examples:
  - Cross-field validation с `.refine()`
  - Async validation
  - Type inference с `InferZodType`
  - Integration с React Hook Form
- API reference
- Troubleshooting

**Пример структуры:**
```markdown
# @nexus-state/form-schema-zod

Zod schema validator plugin for Nexus State forms.

## Installation
\`\`\`bash
npm install @nexus-state/form-schema-zod zod
\`\`\`

## Basic Usage
\`\`\`typescript
import { createForm } from '@nexus-state/form';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
});

const form = createForm(store, {
  schemaType: 'zod',
  schemaConfig: schema,
  initialValues: { username: '', email: '' },
});
\`\`\`

## Advanced Examples
...
```

### 2. @nexus-state/form-schema-yup

Аналогичная структура README с примерами для Yup.

### 3. @nexus-state/form-schema-ajv

README с акцентом на:
- JSON Schema examples
- Custom keywords
- Custom formats
- Enterprise use cases

### 4. @nexus-state/form-schema-dsl

README с примерами:
- Programmatic API
- Built-in validators
- Async validators
- Custom validators
- Composition patterns

---

## Acceptance Criteria

- [ ] README.md создан для каждого plugin
- [ ] Все примеры протестированы и работают
- [ ] Добавлены badges (npm version, coverage)
- [ ] Документация ссылается на main @nexus-state/form docs
- [ ] Добавлены troubleshooting секции

---

## Dependencies

Нет

---

## Notes

- Использовать единый стиль для всех README
- Примеры должны быть copy-paste ready
- Добавить ссылки на статьи из серии Forms
