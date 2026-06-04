# TASK-014: E2E интеграция

## 📋 Описание

Создание набора E2E тестов для проверки полной интеграции плагинной системы валидации с @nexus-state/form.

## 🎯 Цель

Убедиться что все плагины корректно работают в реальных сценариях использования формы.

## 📦 Требования к реализации

### Структура тестов

```
packages/form/src/schema/__tests__/
└── e2e/
    ├── registry.e2e.test.ts       # Тесты реестра
    ├── zod-integration.e2e.test.ts # Zod интеграция
    ├── yup-integration.e2e.test.ts # Yup интеграция
    ├── ajv-integration.e2e.test.ts # AJV интеграция
    └── dsl-integration.e2e.test.ts # DSL интеграция
```

### Пример теста

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '@nexus-state/core';
import { createForm } from '../../create-form';
import { defaultSchemaRegistry } from '../registry';

describe('E2E: Schema Plugin Integration', () => {
  beforeEach(() => {
    defaultSchemaRegistry.clear();
  });

  describe('Registry E2E', () => {
    it('should register and create plugins', async () => {
      const mockPlugin = {
        type: 'mock',
        meta: { name: 'Mock Plugin' },
        create: (schema: any) => ({
          validate: async (values: any) => ({ fieldErrors: {} }),
          validateField: async () => null,
        }),
        supports: () => true,
      };

      defaultSchemaRegistry.register('mock', mockPlugin);

      const validator = defaultSchemaRegistry.create('mock', {});
      expect(validator).toBeDefined();

      const errors = await validator!.validate({});
      expect(errors.fieldErrors).toEqual({});
    });

    it('should throw on duplicate registration', () => {
      const plugin = {
        type: 'dup',
        meta: {},
        create: () => ({ validate: async () => ({ fieldErrors: {} }), validateField: async () => null }),
        supports: () => true,
      };

      defaultSchemaRegistry.register('dup', plugin);

      expect(() => defaultSchemaRegistry.register('dup', plugin)).toThrow();
    });

    it('should return undefined for unknown plugin', () => {
      const validator = defaultSchemaRegistry.create('unknown', {});
      expect(validator).toBeUndefined();
    });
  });

  describe('Form Integration', () => {
    it('should validate with plugin on submit', async () => {
      const mockPlugin = {
        type: 'mock',
        meta: {},
        create: () => ({
          validate: async (values: any) => ({
            fieldErrors: values.invalid ? { name: { message: 'Invalid', code: 'mock' } } : {},
          }),
          validateField: async () => null,
        }),
        supports: () => true,
      };

      defaultSchemaRegistry.register('mock', mockPlugin);

      const store = createStore();
      const form = createForm(store, {
        schemaType: 'mock',
        schemaConfig: {},
        initialValues: { name: '' },
        onSubmit: async (values) => values,
      });

      form.update({ invalid: true });
      await form.submit();

      expect(form.errors.name).toBeDefined();
    });
  });
});
```

## ✅ Критерии приемки

- [ ] E2E тесты для реестра
- [ ] E2E тесты для каждого плагина
- [ ] Тесты интеграции с формой
- [ ] Все тесты проходят
- [ ] Coverage > 85%

## 🔄 Прогресс

- [ ] registry.e2e.test.ts
- [ ] zod-integration.e2e.test.ts
- [ ] yup-integration.e2e.test.ts
- [ ] ajv-integration.e2e.test.ts
- [ ] dsl-integration.e2e.test.ts
