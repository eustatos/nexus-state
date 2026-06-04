# Examples Index

## Примеры использования плагинов валидации

### Основные плагины

- [Zod Plugin](./example-zod.md) — Валидация с Zod
- [Yup Plugin](./example-yup.md) — Валидация с Yup
- [AJV Plugin](./example-ajv.md) — Валидация с JSON Schema

### DSL Plugin

- [DSL Basic](./example-dsl.md) — Базовые примеры DSL
- [DSL Advanced](./example-dsl-advanced.md) — Продвинутые примеры DSL

### Создание плагинов

- [Custom Plugin](./example-custom-plugin.md) — Создание собственного плагина

## Быстрый старт

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import { z } from 'zod';
import '@nexus-state/form-schema-zod'; // Авто-регистрация

const store = createStore();

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = createForm(store, {
  schemaType: 'zod',
  schemaConfig: schema,
  initialValues: { email: '', password: '' },
  validateOnChange: true,
  validateOnBlur: true,
});

// Access field API
const emailField = form.field('email');

// Set values
emailField.setValue('test@example.com');

// Validate
const isValid = await form.validate();
console.log(form.errors);
```

## Установка плагинов

```bash
# Zod
npm install @nexus-state/form-schema-zod zod

# Yup
npm install @nexus-state/form-schema-yup yup

# AJV
npm install @nexus-state/form-schema-ajv ajv

# DSL (встроенный)
# Не требует установки
```

## Сравнение плагинов

| Плагин | Размер | Sync | Async | Кастомные сообщения | i18n |
|--------|--------|------|-------|---------------------|------|
| Zod    | ~12kb  | ✅   | ✅    | ✅                  | ✅   |
| Yup    | ~14kb  | ✅   | ✅    | ✅                  | ✅   |
| AJV    | ~25kb  | ✅   | ✅    | ✅                  | ✅   |
| DSL    | ~5kb   | ✅   | ✅    | ✅                  | ✅   |

## Выбор плагина

### Zod
- ✅ TypeScript-first
- ✅ Отличная типизация
- ✅ Компактный размер
- ✅ Хорошая производительность

**Используйте когда:** Нужна строгая типизация и вы используете TypeScript.

### Yup
- ✅ Зрелая библиотека
- ✅ Много готовых валидаторов
- ✅ Хорошая документация

**Используйте когда:** Нужна проверенная библиотека с большим сообществом.

### AJV
- ✅ JSON Schema стандарт
- ✅ Очень быстрый
- ✅ Много возможностей

**Используйте когда:** Нужна валидация по JSON Schema стандарту.

### DSL
- ✅ Нет внешних зависимостей
- ✅ Минимальный размер
- ✅ Гибкость

**Используйте когда:** Нужна минимальная зависимость и кастомная логика.

## Дополнительные ресурсы

- [Architecture](../ARCHITECTURE.md) — Архитектура системы
- [Plugin Guide](../PLUGIN-GUIDE.md) — Руководство по созданию плагинов
- [SDK Types](../../../packages/form/src/schema/types.ts) — Типы SDK
- [SDK Registry](../../../packages/form/src/schema/registry.ts) — Реестр плагинов
- [SDK Builder](../../../packages/form/src/schema/builder.ts) — Builder для плагинов
