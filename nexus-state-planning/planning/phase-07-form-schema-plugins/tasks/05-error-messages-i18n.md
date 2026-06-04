# Task 05: Error Messages i18n

**Приоритет:** Low  
**Оценка:** 3-4 дня  
**Статус:** Todo

---

## Цель

Добавить поддержку локализации error messages для всех schema plugins.

---

## Scope

### 1. i18n Infrastructure

```typescript
// packages/form/src/i18n/types.ts
export interface I18nConfig {
  locale: string;
  messages: Record<string, string | ((params: any) => string)>;
  fallbackLocale?: string;
}

export interface I18nManager {
  setLocale(locale: string): void;
  getLocale(): string;
  t(key: string, params?: Record<string, any>): string;
  addMessages(locale: string, messages: Record<string, string>): void;
}

// packages/form/src/i18n/manager.ts
export function createI18nManager(config: I18nConfig): I18nManager;
```

### 2. Default Messages

```typescript
// packages/form/src/i18n/locales/en.ts
export const en = {
  'validation.required': 'This field is required',
  'validation.email': 'Invalid email format',
  'validation.minLength': 'Minimum length is {{min}} characters',
  'validation.maxLength': 'Maximum length is {{max}} characters',
  'validation.pattern': 'Invalid format',
  'validation.unique': 'Already exists',
  // ... more messages
};

// packages/form/src/i18n/locales/ru.ts
export const ru = {
  'validation.required': 'Это поле обязательно',
  'validation.email': 'Неверный формат email',
  'validation.minLength': 'Минимальная длина {{min}} символов',
  'validation.maxLength': 'Максимальная длина {{max}} символов',
  'validation.pattern': 'Неверный формат',
  'validation.unique': 'Уже существует',
  // ... more messages
};
```

### 3. Integration с Validators

```typescript
// packages/form-schema-dsl/src/validators/minLength.ts
import { i18n } from '@nexus-state/form/i18n';

export function minLength(min: number, message?: string): DSLRule {
  return {
    validate: (value) => {
      if (typeof value !== 'string') return null;
      if (value.length < min) {
        return message ?? i18n.t('validation.minLength', { min });
      }
      return null;
    },
    code: 'min_length',
  };
}
```

### 4. Form-level Configuration

```typescript
import { createForm } from '@nexus-state/form';
import { createI18nManager } from '@nexus-state/form/i18n';
import { ru } from '@nexus-state/form/i18n/locales/ru';

const i18n = createI18nManager({
  locale: 'ru',
  messages: ru,
  fallbackLocale: 'en',
});

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: schema,
  i18n, // Pass i18n manager
});
```

---

## Supported Locales (Initial)

- English (en) - default
- Russian (ru)
- Spanish (es)
- French (fr)
- German (de)
- Chinese (zh)

---

## Implementation Plan

1. **i18n Infrastructure** (1 день)
   - Create I18nManager
   - Message interpolation
   - Fallback logic

2. **Default Locales** (1 день)
   - English messages
   - Russian messages
   - Other locales (community can contribute)

3. **Integration** (1 день)
   - Update all validators
   - Update schema plugins
   - Form-level configuration

4. **Tests** (0.5 дня)
   - i18n manager tests
   - Locale switching tests
   - Fallback tests

5. **Documentation** (0.5 дня)
   - i18n guide
   - Custom locale guide
   - Examples

---

## Acceptance Criteria

- [ ] I18nManager реализован
- [ ] Default locales (en, ru) добавлены
- [ ] Все validators используют i18n
- [ ] Form-level configuration работает
- [ ] Tests покрывают все сценарии
- [ ] Documentation complete
- [ ] Examples в README

---

## Dependencies

Нет

---

## Notes

- Использовать простой подход (без внешних библиотек)
- Поддержка pluralization опционально (v2)
- Community contributions для других языков
- Рассмотреть интеграцию с react-i18next для React apps
