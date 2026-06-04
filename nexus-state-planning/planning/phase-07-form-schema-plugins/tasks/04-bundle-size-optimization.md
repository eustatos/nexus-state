# Task 04: Bundle Size Optimization

**Приоритет:** Medium  
**Оценка:** 2-3 дня  
**Статус:** Todo

---

## Цель

Оптимизировать bundle size для @nexus-state/form-schema-dsl через tree-shaking.

---

## Проблема

Текущий экспорт импортирует все validators:
```typescript
export {
  required,
  minLength,
  maxLength,
  // ... 20+ validators
} from './validators';

export {
  unique,
  exists,
  // ... 10+ async validators
} from './async-validators';
```

Если пользователь использует только `required` и `email`, он всё равно получает весь код.

---

## Решение

### 1. Модульная структура

```
packages/form-schema-dsl/src/
├── index.ts              # Main entry (plugin only)
├── validators/
│   ├── index.ts          # Re-exports all
│   ├── required.ts       # Individual validator
│   ├── email.ts
│   ├── minLength.ts
│   └── ...
├── async-validators/
│   ├── index.ts
│   ├── unique.ts
│   ├── exists.ts
│   └── ...
```

### 2. Package.json exports

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./validators": {
      "types": "./dist/validators/index.d.ts",
      "import": "./dist/validators/index.js"
    },
    "./validators/*": {
      "types": "./dist/validators/*.d.ts",
      "import": "./dist/validators/*.js"
    },
    "./async-validators": {
      "types": "./dist/async-validators/index.d.ts",
      "import": "./dist/async-validators/index.js"
    },
    "./async-validators/*": {
      "types": "./dist/async-validators/*.d.ts",
      "import": "./dist/async-validators/*.js"
    }
  }
}
```

### 3. Usage

```typescript
// Import all (current behavior)
import { required, email } from '@nexus-state/form-schema-dsl/validators';

// Import individual (tree-shakeable)
import { required } from '@nexus-state/form-schema-dsl/validators/required';
import { email } from '@nexus-state/form-schema-dsl/validators/email';

// Import async validators
import { unique } from '@nexus-state/form-schema-dsl/async-validators/unique';
```

---

## Scope

1. **Рефакторинг структуры** (1 день)
   - Создать папки validators/ и async-validators/
   - Разделить validators.ts на отдельные файлы
   - Разделить async-validators.ts на отдельные файлы
   - Создать index.ts для re-exports

2. **Обновить package.json** (0.5 дня)
   - Добавить exports map
   - Настроить TypeScript paths
   - Обновить build config

3. **Тестирование** (0.5 дня)
   - Проверить tree-shaking с webpack/rollup
   - Bundle size analysis
   - Backward compatibility tests

4. **Документация** (1 день)
   - Обновить README с примерами импортов
   - Migration guide
   - Bundle size comparison

---

## Bundle Size Goals

| Scenario | Current | Target |
|----------|---------|--------|
| Import all validators | ~15KB | ~15KB |
| Import 3 validators | ~15KB | ~3KB |
| Import 1 validator | ~15KB | ~1KB |

---

## Acceptance Criteria

- [ ] Validators разделены на отдельные файлы
- [ ] Package.json exports настроен
- [ ] Tree-shaking работает корректно
- [ ] Bundle size уменьшен для partial imports
- [ ] Backward compatibility сохранена
- [ ] Documentation обновлена

---

## Dependencies

Нет

---

## Notes

- Не ломать существующий API (все импорты должны работать)
- Добавить bundle size badge в README
- Рассмотреть использование bundlephobia для мониторинга
