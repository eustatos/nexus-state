# AJV Plugin Example

## Установка

```bash
npm install @nexus-state/form-schema-ajv ajv
```

## Базовый пример

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import '@nexus-state/form-schema-ajv'; // Авто-регистрация

const store = createStore();

const userSchema = {
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 3 },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 },
    age: { type: 'number', minimum: 18 },
  },
  required: ['username', 'email', 'password', 'age'],
};

const form = createForm(store, {
  schemaType: 'ajv',
  schemaConfig: {
    schema: userSchema,
  },
  initialValues: {
    username: '',
    email: '',
    password: '',
    age: 0,
  },
  validateOnChange: true,
  validateOnBlur: true,
});

// Access fields
const usernameField = form.field('username');
const emailField = form.field('email');

// Set values
usernameField.setValue('john_doe');
emailField.setValue('john@example.com');

// Validate entire form
const isValid = await form.validate();
console.log('Form is valid:', isValid);
console.log('Errors:', form.errors);
```

## С кастомными форматами

```typescript
const form = createForm(store, {
  schemaType: 'ajv',
  schemaConfig: {
    schema: {
      type: 'object',
      properties: {
        website: { type: 'string', format: 'uri' },
        ip: { type: 'string', format: 'ipv4' },
        uuid: { type: 'string', format: 'uuid' },
      },
    },
    formats: {
      uri: /^[hH][tT][tT][pP][sS]?:\/\//,
      ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    },
  },
  initialValues: {
    website: '',
    ip: '',
    uuid: '',
  },
});
```

## Nested схемы

```typescript
const schema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            bio: { type: 'string', maxLength: 500 },
          },
          required: ['name'],
        },
        settings: {
          type: 'object',
          properties: {
            notifications: { type: 'boolean' },
            theme: { type: 'string', enum: ['light', 'dark'] },
          },
        },
      },
    },
  },
};

const form = createForm(store, {
  schemaType: 'ajv',
  schemaConfig: { schema },
  initialValues: {
    user: {
      profile: { name: '', bio: '' },
      settings: { notifications: true, theme: 'light' },
    },
  },
});

// Errors will be mapped to dot notation:
// form.errors['user.profile.name']
// form.errors['user.settings.theme']
```

## Валидация массивов

```typescript
const schema = {
  type: 'object',
  properties: {
    tags: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
      minItems: 1,
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'number', minimum: 0 },
        },
        required: ['name', 'price'],
      },
    },
  },
};

const form = createForm(store, {
  schemaType: 'ajv',
  schemaConfig: { schema },
  initialValues: {
    tags: [''],
    items: [{ name: '', price: -1 }],
  },
});

// Array errors: form.errors['tags.0']
// Nested array errors: form.errors['items.0.price']
```

## Кастомные сообщения об ошибках

```typescript
const schema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 20,
    },
    email: {
      type: 'string',
      format: 'email',
    },
  },
  required: ['username', 'email'],
};

const form = createForm(store, {
  schemaType: 'ajv',
  schemaConfig: {
    schema,
    ajvOptions: {
      allErrors: true,
    },
  },
  // ...
});

// AJV error messages are generated automatically based on the schema
```

## Асинхронная валидация

AJV сам по себе синхронный, но вы можете добавить async валидацию через DSL:

```typescript
import { asyncCustom } from '@nexus-state/form-schema-dsl';

const schema = {
  username: [
    { validate: (v) => (v?.length >= 3 ? null : 'Too short') },
    asyncCustom(async (value) => {
      const response = await fetch(`/api/check-username?username=${value}`);
      const data = await response.json();
      return data.available ? null : 'Username is already taken';
    }),
  ],
};
```

## Валидация нескольких полей

```typescript
const schema = {
  type: 'object',
  properties: {
    password: { type: 'string', minLength: 8 },
    confirmPassword: { type: 'string' },
  },
  required: ['password', 'confirmPassword'],
};

// Cross-field validation requires custom logic
// Use DSL plugin for this scenario
```

## Опциональные поля

```typescript
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    nickname: { type: 'string' },
    bio: { type: ['string', 'null'] },
    website: { type: 'string', format: 'uri' },
  },
  required: ['name'],
};
```

## Значения по умолчанию

```typescript
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', default: 'Anonymous' },
    notifications: { type: 'boolean', default: true },
    theme: { type: 'string', enum: ['light', 'dark'], default: 'light' },
  },
};

const form = createForm(store, {
  schemaType: 'ajv',
  schemaConfig: {
    schema,
    ajvOptions: {
      useDefaults: true,
    },
  },
  initialValues: {},
});
```

## Enum валидация

```typescript
const schema = {
  type: 'object',
  properties: {
    paymentMethod: {
      type: 'string',
      enum: ['card', 'paypal', 'crypto'],
    },
    status: {
      type: 'string',
      enum: ['draft', 'published', 'archived'],
    },
  },
  required: ['paymentMethod', 'status'],
};
```

## Pattern валидация

```typescript
const schema = {
  type: 'object',
  properties: {
    phone: {
      type: 'string',
      pattern: '^\\+?[\\d\\s-()]{10,}$',
    },
    zipCode: {
      type: 'string',
      pattern: '^\\d{5}(-\\d{4})?$',
    },
    hexColor: {
      type: 'string',
      pattern: '^#[0-9A-Fa-f]{6}$',
    },
  },
};
```

## Условная валидация (if/then/else)

```typescript
const schema = {
  type: 'object',
  properties: {
    employmentType: {
      type: 'string',
      enum: ['employed', 'self-employed', 'unemployed'],
    },
    company: { type: 'string' },
    income: { type: 'number' },
  },
  required: ['employmentType'],
  if: {
    properties: {
      employmentType: { const: 'employed' },
    },
  },
  then: {
    required: ['company'],
    properties: {
      income: { type: 'number', minimum: 0 },
    },
  },
  else: {
    properties: {
      income: { type: 'number' },
    },
  },
};
```

## Полный пример формы регистрации

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import '@nexus-state/form-schema-ajv';

const store = createStore();

const registrationSchema = {
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
    },
    confirmPassword: {
      type: 'string',
    },
    age: {
      type: 'number',
      minimum: 18,
    },
    terms: {
      type: 'boolean',
      const: true,
    },
  },
  required: ['username', 'email', 'password', 'confirmPassword', 'age', 'terms'],
};

const form = createForm(store, {
  schemaType: 'ajv',
  schemaConfig: {
    schema: registrationSchema,
    ajvOptions: {
      allErrors: true,
      useDefaults: true,
    },
  },
  initialValues: {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: 18,
    terms: false,
  },
  validateOnChange: true,
  validateOnBlur: true,
});

// Handle form submission
const submit = async () => {
  const isValid = await form.validate();
  
  if (isValid) {
    // Submit form data
    const values = {
      username: form.field('username').value,
      email: form.field('email').value,
      password: form.field('password').value,
      age: form.field('age').value,
      terms: form.field('terms').value,
    };
    
    await api.register(values);
  }
};
```

## См. также

- [AJV Documentation](https://ajv.js.org/)
- [JSON Schema Specification](https://json-schema.org/)
- [Plugin Source](../../../packages/form-schema-ajv/src/index.ts)
