# Zod Plugin Example

## Установка

```bash
npm install @nexus-state/form-schema-zod zod
```

## Базовый пример

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import { z } from 'zod';
import '@nexus-state/form-schema-zod'; // Авто-регистрация

const store = createStore();

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  age: z.number().min(18, 'Must be at least 18 years old'),
});

const form = createForm(store, {
  schemaType: 'zod',
  schemaConfig: userSchema,
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

## Валидация с трансформацией

```typescript
const schema = z.object({
  email: z.string().email().transform((val) => val.toLowerCase()),
  name: z.string().transform((val) => val.trim()),
  age: z.string().transform((val) => parseInt(val, 10)),
});

const form = createForm(store, {
  schemaType: 'zod',
  schemaConfig: schema,
  initialValues: { email: '', name: '', age: '' },
});

// Values will be transformed during validation
```

##Nested схемы

```typescript
const schema = z.object({
  user: z.object({
    profile: z.object({
      name: z.string().min(1),
      bio: z.string().max(500),
    }),
    settings: z.object({
      notifications: z.boolean(),
      theme: z.enum(['light', 'dark']),
    }),
  }),
});

const form = createForm(store, {
  schemaType: 'zod',
  schemaConfig: schema,
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
const schema = z.object({
  tags: z.array(z.string().min(1)),
  items: z.array(
    z.object({
      name: z.string(),
      price: z.number().positive(),
    })
  ),
});

const form = createForm(store, {
  schemaType: 'zod',
  schemaConfig: schema,
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
const schema = z.object({
  username: z
    .string()
    .min(3, 'Username is too short (minimum 3 characters)')
    .max(20, 'Username is too long (maximum 20 characters)'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
```

## Асинхронная валидация

```typescript
const schema = z.object({
  username: z.string().min(3).refine(
    async (username) => {
      const response = await fetch(`/api/check-username?username=${username}`);
      const data = await response.json();
      return data.available;
    },
    { message: 'Username is already taken' }
  ),
});
```

## Валидация нескольких полей

```typescript
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
);
```

## Опциональные поля

```typescript
const schema = z.object({
  name: z.string(),
  nickname: z.string().optional(),
  bio: z.string().nullable(),
  website: z.string().url().optional(),
});
```

## Значения по умолчанию

```typescript
const schema = z.object({
  name: z.string().default('Anonymous'),
  notifications: z.boolean().default(true),
  theme: z.enum(['light', 'dark']).default('light'),
});
```

## Union типы

```typescript
const schema = z.object({
  paymentMethod: z.union([
    z.literal('card'),
    z.literal('paypal'),
    z.literal('crypto'),
  ]),
  amount: z.number().positive(),
});
```

## Discriminated Union

```typescript
const schema = z.object({
  type: z.literal('user'),
  name: z.string(),
  email: z.string().email(),
});

const companySchema = z.object({
  type: z.literal('company'),
  name: z.string(),
  taxId: z.string(),
});

const combinedSchema = z.discriminatedUnion('type', [schema, companySchema]);
```

## Полный пример формы регистрации

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import { z } from 'zod';
import '@nexus-state/form-schema-zod';

const store = createStore();

const registrationSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  email: z
    .string()
    .email('Please enter a valid email address'),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  
  confirmPassword: z.string(),
  
  age: z
    .number()
    .min(18, 'You must be at least 18 years old'),
  
  terms: z
    .literal(true, {
      errorMap: () => ({ message: 'You must accept the terms and conditions' }),
    }),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Passwords do not match', path: ['confirmPassword'] }
);

const form = createForm(store, {
  schemaType: 'zod',
  schemaConfig: registrationSchema,
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

- [Zod Documentation](https://zod.dev/)
- [Plugin Source](../../../packages/form-schema-zod/src/index.ts)
