# TASK-013: Примеры и демо

## 📋 Описание

Создание набора примеров использования для каждого плагина валидации. Примеры демонстрируют типичные сценарии использования и лучшие практики.

## 🎯 Цель

Предоставить разработчикам готовые примеры для:
- Быстрого старта с каждым плагином
- Понимания возможностей валидации
- Копирования паттернов в свои проекты
- Демонстрации продвинутых сценариев

## 📦 Требования к реализации

### Структура примеров

```
planning/phase-07-form-schema-plugins/examples/
├── README.md                      # Индекс примеров (из TASK-012)
├── example-zod.md                 # Пример с Zod
├── example-yup.md                 # Пример с Yup
├── example-ajv.md                 # Пример с AJV
├── example-dsl-basic.md           # Пример с DSL (базовый)
├── example-dsl-advanced.md        # Пример с DSL (продвинутый)
└── example-custom-plugin.md       # Создание кастомного плагина
```

### example-zod.md

```markdown
# Zod Plugin Example

## Установка

```bash
pnpm add @nexus-state/form @nexus-state/form-schema-zod zod
```

## Базовый пример

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import { zodPlugin } from '@nexus-state/form-schema-zod';
import { z } from 'zod';

// Авто-регистрация плагина происходит при импорте

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const store = createStore();

const form = createForm(store, {
  schemaType: 'zod',
  schemaConfig: loginSchema,
  initialValues: {
    email: '',
    password: '',
  },
  onSubmit: async (values) => {
    console.log('Submitting:', values);
  },
});

// Использование
form.fields.email.onChange('test@example.com');
form.fields.password.onChange('short');

// Проверка валидности
const isValid = form.validate();
console.log(form.errors); // { password: { message: 'Password must be at least 8 characters' } }
```

## Пример: Регистрация пользователя

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import { z } from 'zod';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

  email: z
    .string()
    .email('Invalid email address'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  confirmPassword: z.string(),

  age: z
    .number()
    .min(18, 'You must be at least 18 years old')
    .max(120, 'Invalid age'),

  terms: z
    .literal(true, {
      errorMap: () => ({ message: 'You must accept the terms and conditions' }),
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const store = createStore();

const form = createForm(store, {
  schemaType: 'zod',
  schemaConfig: registerSchema,
  initialValues: {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: 18,
    terms: false,
  },
});

// Валидация при изменении
form.fields.username.onChange('john_doe');
form.validateField('username');
```

## Пример: Форма с async валидацией

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import { z } from 'zod';

// Функция проверки уникальности
async function checkUsernameUnique(username: string): Promise<boolean> {
  const response = await fetch('/api/check-username', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
  const data = await response.json();
  return !data.exists;
}

// Функция проверки email
async function checkEmailAvailable(email: string): Promise<boolean> {
  const response = await fetch('/api/check-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  return !data.registered;
}

const schema = z.object({
  username: z.string().min(3).superRefine(async (val, ctx) => {
    const isUnique = await checkUsernameUnique(val);
    if (!isUnique) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Username is already taken',
      });
    }
  }),

  email: z.string().email().superRefine(async (val, ctx) => {
    const isAvailable = await checkEmailAvailable(val);
    if (!isAvailable) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email is already registered',
      });
    }
  }),
});

const form = createForm(store, {
  schemaType: 'zod',
  schemaConfig: schema,
  initialValues: { username: '', email: '' },
});
```

## Пример: Динамическая схема

```typescript
import { z } from 'zod';

const baseSchema = z.object({
  email: z.string().email(),
});

const premiumSchema = baseSchema.extend({
  company: z.string().min(1),
  vatId: z.string().min(1),
});

const personalSchema = baseSchema.extend({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

// Использование
const accountType = 'premium'; // или 'personal'
const schema = accountType === 'premium' ? premiumSchema : personalSchema;

const form = createForm(store, {
  schemaType: 'zod',
  schemaConfig: schema,
  initialValues: { email: '' },
});
```

## Пример: Кастомные ошибки

```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters long',
  }),
  age: z.number({
    required_error: 'Age is required',
    invalid_type_error: 'Age must be a number',
  }).min(18, {
    message: 'You must be at least 18 years old',
  }),
});

// Кастомизация через errorMap
const schemaWithCustomErrorMap = z.object({
  email: z.string().email(),
}).passthrough();

const form = createForm(store, {
  schemaType: 'zod',
  schemaConfig: schema,
  initialValues: { email: '', password: '', age: 0 },
});
```

## Продвинутые паттерны

### Валидация массивов

```typescript
const schema = z.object({
  tags: z
    .array(z.string().min(1))
    .min(1, 'At least one tag is required')
    .max(5, 'Maximum 5 tags allowed'),

  items: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().min(1),
  })),
});
```

### Вложенные объекты

```typescript
const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().regex(/^\d{5}$/, 'Invalid ZIP code'),
  country: z.string().min(1),
});

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  address: addressSchema,
  billingAddress: addressSchema.optional(),
});
```

### Union и Discriminated Union

```typescript
const paymentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('card'),
    cardNumber: z.string().regex(/^\d{16}$/),
    expiryDate: z.string().regex(/^\d{2}\/\d{2}$/),
    cvv: z.string().regex(/^\d{3}$/),
  }),
  z.object({
    type: z.literal('paypal'),
    paypalEmail: z.string().email(),
  }),
]);
```

## См. также

- [Zod Documentation](https://zod.dev/)
- [TASK-006](../tasks/TASK-006-zod-plugin.md) — Плагин Zod
```

### example-yup.md

```markdown
# Yup Plugin Example

## Установка

```bash
pnpm add @nexus-state/form @nexus-state/form-schema-yup yup
```

## Базовый пример

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import * as yup from 'yup';

const loginSchema = yup.object({
  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

const store = createStore();

const form = createForm(store, {
  schemaType: 'yup',
  schemaConfig: loginSchema,
  initialValues: {
    email: '',
    password: '',
  },
});

// Валидация
form.validate();
console.log(form.errors);
```

## Пример: Регистрация пользователя

```typescript
import * as yup from 'yup';

const registerSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required'),

  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number'),

  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),

  age: yup
    .number()
    .required('Age is required')
    .min(18, 'You must be at least 18 years old')
    .max(120, 'Invalid age'),

  terms: yup
    .bool()
    .oneOf([true], 'You must accept the terms and conditions'),
});

const form = createForm(store, {
  schemaType: 'yup',
  schemaConfig: registerSchema,
  initialValues: {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: 18,
    terms: false,
  },
});
```

## Пример: Async валидация

```typescript
import * as yup from 'yup';

const schema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3)
    .test(
      'username-unique',
      'Username is already taken',
      async function (value) {
        if (!value) return true;

        const response = await fetch('/api/check-username', {
          method: 'POST',
          body: JSON.stringify({ username: value }),
        });
        const data = await response.json();
        return !data.exists;
      }
    ),

  email: yup
    .string()
    .email()
    .required()
    .test(
      'email-available',
      'Email is already registered',
      async function (value) {
        if (!value) return true;

        const response = await fetch('/api/check-email', {
          method: 'POST',
          body: JSON.stringify({ email: value }),
        });
        const data = await response.json();
        return !data.registered;
      }
    ),
});
```

## Пример: Кастомные тесты

```typescript
import * as yup from 'yup';

// Кастомный валидатор
const creditCardValidator = yup
  .string()
  .test(
    'luhn-check',
    'Invalid credit card number',
    (value) => {
      if (!value) return true;

      // Luhn algorithm
      let sum = 0;
      let isEven = false;

      for (let i = value.length - 1; i >= 0; i--) {
        let digit = parseInt(value[i]);

        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }

        sum += digit;
        isEven = !isEven;
      }

      return sum % 10 === 0;
    }
  );

// Кастомный валидатор с параметрами
function minLength(min: number, message: string) {
  return yup.string().test({
    name: 'min-length',
    message,
    test: (value) => {
      if (!value) return true;
      return value.length >= min;
    },
  });
}

const schema = yup.object({
  creditCard: creditCardValidator,
  description: minLength(10, 'Description must be at least 10 characters'),
});
```

## См. также

- [Yup Documentation](https://github.com/jquense/yup)
- [TASK-007](../tasks/TASK-007-yup-plugin.md) — Плагин Yup
```

### example-ajv.md

```markdown
# AJV Plugin Example

## Установка

```bash
pnpm add @nexus-state/form @nexus-state/form-schema-ajv ajv
```

## Базовый пример

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import { ajvPlugin } from '@nexus-state/form-schema-ajv';

const loginSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      errorMessage: 'Invalid email address',
    },
    password: {
      type: 'string',
      minLength: 8,
      errorMessage: 'Password must be at least 8 characters',
    },
  },
  required: ['email', 'password'],
  additionalProperties: false,
};

const store = createStore();

const form = createForm(store, {
  schemaType: 'ajv',
  schemaConfig: loginSchema,
  initialValues: {
    email: '',
    password: '',
  },
});
```

## Пример: Регистрация пользователя

```typescript
const registerSchema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 20,
      pattern: '^[a-zA-Z0-9_]+$',
    },
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
      pattern: '^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).+$',
    },
    confirmPassword: {
      type: 'string',
    },
    age: {
      type: 'integer',
      minimum: 18,
      maximum: 120,
    },
    terms: {
      type: 'boolean',
      const: true,
    },
  },
  required: ['username', 'email', 'password', 'confirmPassword', 'age', 'terms'],
};

// С кастомными сообщенияами
const schemaWithMessages = {
  ...registerSchema,
  errorMessage: {
    required: {
      username: 'Username is required',
      email: 'Email is required',
      password: 'Password is required',
    },
    properties: {
      username: 'Username must be 3-20 characters, letters/numbers/underscore only',
      email: 'Invalid email address',
      password: 'Password must contain uppercase, lowercase, and number',
      age: 'You must be at least 18 years old',
      terms: 'You must accept the terms',
    },
  },
};
```

## Пример: Сложная схема

```typescript
const complexSchema = {
  type: 'object',
  properties: {
    personalInfo: {
      type: 'object',
      properties: {
        firstName: { type: 'string', minLength: 1 },
        lastName: { type: 'string', minLength: 1 },
        dateOfBirth: { type: 'string', format: 'date' },
      },
      required: ['firstName', 'lastName'],
    },
    contactInfo: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        phone: { type: 'string', pattern: '^\\+?[\\d\\s-()]{10,}$' },
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            zipCode: { type: 'string', pattern: '^\\d{5}$' },
            country: { type: 'string' },
          },
          required: ['street', 'city', 'zipCode', 'country'],
        },
      },
      required: ['email'],
    },
    preferences: {
      type: 'object',
      properties: {
        newsletter: { type: 'boolean' },
        notifications: { type: 'boolean' },
        language: { type: 'string', enum: ['en', 'es', 'fr', 'de'] },
      },
    },
  },
  required: ['personalInfo', 'contactInfo'],
};
```

## См. также

- [AJV Documentation](https://ajv.js.org/)
- [JSON Schema](https://json-schema.org/)
- [TASK-008](../tasks/TASK-008-ajv-plugin.md) — Плагин AJV
```

### example-dsl-basic.md

```markdown
# DSL Plugin Example (Basic)

## Установка

```bash
pnpm add @nexus-state/form @nexus-state/form-schema-dsl
```

## Базовый пример

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import { dslPlugin, required, email, minLength } from '@nexus-state/form-schema-dsl';

const store = createStore();

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    email: [required, email()],
    password: [required, minLength(8)],
  },
  initialValues: {
    email: '',
    password: '',
  },
});

// Валидация
form.validate();
```

## Пример: Регистрация

```typescript
import {
  required,
  minLength,
  maxLength,
  email,
  pattern,
  minValue,
  oneOf,
  matchesField,
} from '@nexus-state/form-schema-dsl';

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    username: [
      required,
      minLength(3, 'Username must be at least 3 characters'),
      maxLength(20, 'Username must be at most 20 characters'),
      pattern(/^[a-zA-Z0-9_]+$/, 'Invalid username format'),
    ],
    email: [
      required,
      email('Invalid email address'),
    ],
    password: [
      required,
      minLength(8, 'Password must be at least 8 characters'),
      pattern(/[A-Z]/, 'Password must contain uppercase letter'),
      pattern(/[a-z]/, 'Password must contain lowercase letter'),
      pattern(/[0-9]/, 'Password must contain number'),
    ],
    confirmPassword: [
      required,
      matchesField('password', 'Passwords do not match'),
    ],
    age: [
      required,
      minValue(18, 'You must be at least 18 years old'),
    ],
    accountType: [
      required,
      oneOf(['personal', 'business'], 'Invalid account type'),
    ],
    terms: [
      required,
      oneOf([true], 'You must accept the terms'),
    ],
  },
  initialValues: {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: 18,
    accountType: 'personal',
    terms: false,
  },
});
```

## См. также

- [TASK-009](../tasks/TASK-009-dsl-plugin-core.md) — DSL плагин (ядро)
- [TASK-010](../tasks/TASK-010-dsl-built-in-validators.md) — DSL валидаторы (sync)
```

### example-dsl-advanced.md

```markdown
# DSL Plugin Example (Advanced)

## Async валидация

```typescript
import {
  required,
  email,
  unique,
  exists,
  asyncCustom,
  checkPromoCode,
} from '@nexus-state/form-schema-dsl';

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    username: [
      required,
      unique(
        'https://api.example.com/check-username',
        'Username is already taken',
        { debounce: 300, cache: true }
      ),
    ],
    email: [
      required,
      email(),
      unique(
        async (value) => {
          const response = await fetch('/api/check-email', {
            method: 'POST',
            body: JSON.stringify({ email: value }),
          });
          const data = await response.json();
          return data.exists;
        },
        'Email is already registered'
      ),
    ],
    inviteCode: [
      required,
      exists(
        'https://api.example.com/check-invite',
        'Invalid or expired invite code'
      ),
    ],
    promoCode: [
      required,
      checkPromoCode(
        'https://api.example.com/validate-promo',
        'Invalid promo code'
      ),
    ],
    customField: [
      asyncCustom(
        async (value) => {
          // Кастомная async логика
          const isValid = await someAsyncCheck(value);
          return isValid ? null : 'Custom validation failed';
        },
        'Validation failed',
        { debounce: 500, retry: 2 }
      ),
    ],
  },
  initialValues: {
    username: '',
    email: '',
    inviteCode: '',
    promoCode: '',
    customField: '',
  },
});
```

## Условная валидация

```typescript
import { required, conditional, email, minLength } from '@nexus-state/form-schema-dsl';

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    accountType: [required],
    company: [
      conditional(
        (value, allValues) => allValues?.accountType === 'business',
        [required, minLength(2)]
      ),
    ],
    vatId: [
      conditional(
        (value, allValues) => allValues?.accountType === 'business',
        [required, pattern(/^[\w-]+$/)]
      ),
    ],
    firstName: [
      conditional(
        (value, allValues) => allValues?.accountType === 'personal',
        [required]
      ),
    ],
  },
  initialValues: {
    accountType: 'personal',
    company: '',
    vatId: '',
    firstName: '',
  },
});
```

## Кастомные валидаторы

```typescript
import { custom, asyncCustom } from '@nexus-state/form-schema-dsl';

// Синхронный кастомный валидатор
const validColor = custom(
  (value) => {
    if (!value) return null;
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    return hexRegex.test(value) ? null : 'Invalid hex color';
  },
  'Invalid color format',
  'color_format'
);

// Асинхронный кастомный валидатор
const checkAvailability = asyncCustom(
  async (value, allValues) => {
    const response = await fetch(`/api/check-availability?date=${value}`);
    const data = await response.json();
    return data.available ? null : 'Date is not available';
  },
  'Date unavailable',
  { debounce: 300, timeout: 5000 }
);

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    color: [required, validColor],
    bookingDate: [required, checkAvailability],
  },
});
```

## См. также

- [TASK-011](../tasks/TASK-011-dsl-async-validators.md) — DSL валидаторы (async)
```

### example-custom-plugin.md

```markdown
# Creating a Custom Plugin

## Введение

Создание собственного плагина для @nexus-state/form.

## Пример: Простой плагин

```typescript
// my-validator-plugin.ts
import { createSchemaPlugin } from '@nexus-state/form/schema';
import type { ValidationErrors, FieldError } from '@nexus-state/form/schema';

export interface SimpleRule {
  validate: (value: any) => string | null;
  message?: string;
}

export interface SimpleSchema {
  [field: string]: SimpleRule | SimpleRule[];
}

export const simplePlugin = createSchemaPlugin<SimpleSchema>({
  type: 'simple',

  meta: {
    name: 'my-simple-validator',
    version: '1.0.0',
  },

  create(schema) {
    return {
      async validate(values): Promise<ValidationErrors> {
        const errors: ValidationErrors = { fieldErrors: {} };

        for (const [field, rules] of Object.entries(schema)) {
          const rulesArray = Array.isArray(rules) ? rules : [rules];
          const value = values[field];

          for (const rule of rulesArray) {
            const result = rule.validate(value);
            if (result) {
              errors.fieldErrors[field] = {
                message: rule.message ?? result,
                code: 'simple_error',
              };
              break;
            }
          }
        }

        return errors;
      },

      async validateField(field, value): Promise<FieldError | null> {
        const rules = schema[field];
        if (!rules) return null;

        const rulesArray = Array.isArray(rules) ? rules : [rules];

        for (const rule of rulesArray) {
          const result = rule.validate(value);
          if (result) {
            return {
              message: rule.message ?? result,
              code: 'simple_error',
            };
          }
        }

        return null;
      },
    };
  },

  supports(schema) {
    if (!schema || typeof schema !== 'object') return false;
    // Проверка что все значения - правила или массивы правил
    for (const value of Object.values(schema)) {
      if (Array.isArray(value)) {
        if (!value.every((r) => r && typeof r === 'object' && 'validate' in r)) {
          return false;
        }
      } else if (!('validate' in value)) {
        return false;
      }
    }
    return true;
  },
});

// Использование
const form = createForm(store, {
  schemaType: 'simple',
  schemaConfig: {
    name: {
      validate: (v) => (v ? null : 'Name is required'),
      message: 'Please enter your name',
    },
  },
  initialValues: { name: '' },
});
```

## См. также

- [PLUGIN-GUIDE.md](../PLUGIN-GUIDE.md) — Руководство по созданию плагинов
```

## 📁 Зависимости

- [[TASK-012]](./TASK-012-documentation.md) — Документация

## ✅ Критерии приемки

- [ ] example-zod.md создан
- [ ] example-yup.md создан
- [ ] example-ajv.md создан
- [ ] example-dsl-basic.md создан
- [ ] example-dsl-advanced.md создан
- [ ] example-custom-plugin.md создан
- [ ] Все примеры кода рабочие
- [ ] Примеры покрывают основные сценарии
- [ ] Прогресс отмечен в [tasks/README.md](./README.md)

## 📝 Заметки

- Примеры должны быть реалистичными
- Показывать лучшие практики
- Включать как базовые, так и продвинутые сценарии

## 🔄 Прогресс

- [ ] example-zod.md написан
- [ ] example-yup.md написан
- [ ] example-ajv.md написан
- [ ] example-dsl-basic.md написан
- [ ] example-dsl-advanced.md написан
- [ ] example-custom-plugin.md написан
- [ ] Финальная проверка примеров
