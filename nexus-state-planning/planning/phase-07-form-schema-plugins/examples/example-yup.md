# Yup Plugin Example

## Установка

```bash
npm install @nexus-state/form-schema-yup yup
```

## Базовый пример

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import * as yup from 'yup';
import '@nexus-state/form-schema-yup'; // Авто-регистрация

const store = createStore();

const userSchema = yup.object({
  username: yup.string().min(3, 'Username must be at least 3 characters').required(),
  email: yup.string().email('Invalid email address').required(),
  password: yup.string().min(8, 'Password must be at least 8 characters').required(),
  age: yup.number().min(18, 'Must be at least 18 years old').required(),
});

const form = createForm(store, {
  schemaType: 'yup',
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
const schema = yup.object({
  email: yup.string().email().transform((val) => val?.toLowerCase()),
  name: yup.string().transform((val) => val?.trim()),
  age: yup.number().transform((val) => parseInt(val, 10)),
});

const form = createForm(store, {
  schemaType: 'yup',
  schemaConfig: schema,
  initialValues: { email: '', name: '', age: '' },
});

// Values will be transformed during validation
```

## Nested схемы

```typescript
const schema = yup.object({
  user: yup.object({
    profile: yup.object({
      name: yup.string().required(),
      bio: yup.string().max(500),
    }),
    settings: yup.object({
      notifications: yup.boolean(),
      theme: yup.string().oneOf(['light', 'dark']),
    }),
  }),
});

const form = createForm(store, {
  schemaType: 'yup',
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
const schema = yup.object({
  tags: yup.array().of(yup.string().min(1)),
  items: yup.array(
    yup.object({
      name: yup.string().required(),
      price: yup.number().positive(),
    })
  ),
});

const form = createForm(store, {
  schemaType: 'yup',
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
const schema = yup.object({
  username: yup
    .string()
    .min(3, 'Username is too short (minimum 3 characters)')
    .max(20, 'Username is too long (maximum 20 characters)'),
  email: yup.string().email('Please enter a valid email address'),
  password: yup
    .string()
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number'),
});
```

## Асинхронная валидация

```typescript
const schema = yup.object({
  username: yup
    .string()
    .min(3)
    .test(
      'username-available',
      'Username is already taken',
      async (username) => {
        if (!username) return false;
        const response = await fetch(`/api/check-username?username=${username}`);
        const data = await response.json();
        return data.available;
      }
    ),
});
```

## Валидация нескольких полей

```typescript
const schema = yup.object({
  password: yup.string().min(8).required(),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required(),
});
```

## Опциональные поля

```typescript
const schema = yup.object({
  name: yup.string().required(),
  nickname: yup.string(),
  bio: yup.string().nullable(),
  website: yup.string().url(),
});
```

## Значения по умолчанию

```typescript
const schema = yup.object({
  name: yup.string().default('Anonymous'),
  notifications: yup.boolean().default(true),
  theme: yup.string().oneOf(['light', 'dark']).default('light'),
});
```

## OneOf (enum)

```typescript
const schema = yup.object({
  paymentMethod: yup.string().oneOf(['card', 'paypal', 'crypto']).required(),
  amount: yup.number().positive().required(),
});
```

## Matches (regex)

```typescript
const schema = yup.object({
  phone: yup
    .string()
    .matches(/^\+?[\d\s-()]{10,}$/, 'Invalid phone number'),
  zipCode: yup
    .string()
    .matches(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
});
```

## When (условная валидация)

```typescript
const schema = yup.object({
  employmentType: yup.string().oneOf(['employed', 'self-employed', 'unemployed']),
  company: yup.string().when('employmentType', {
    is: 'employed',
    then: (schema) => schema.required('Company name is required'),
    otherwise: (schema) => schema,
  }),
  income: yup.number().when('employmentType', {
    is: (type) => type === 'employed' || type === 'self-employed',
    then: (schema) => schema.required('Income is required').positive(),
    otherwise: (schema) => schema,
  }),
});
```

## Lazy валидация

```typescript
const schema = yup.object({
  items: yup.array().of(
    yup.lazy((value) => {
      if (typeof value === 'string') {
        return yup.string();
      }
      if (typeof value === 'number') {
        return yup.number();
      }
      return yup.mixed();
    })
  ),
});
```

## Полный пример формы регистрации

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import * as yup from 'yup';
import '@nexus-state/form-schema-yup';

const store = createStore();

const registrationSchema = yup.object({
  username: yup
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .required(),
  
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required(),
  
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required(),
  
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required(),
  
  age: yup
    .number()
    .min(18, 'You must be at least 18 years old')
    .required(),
  
  terms: yup
    .boolean()
    .oneOf([true], 'You must accept the terms and conditions')
    .required(),
});

const form = createForm(store, {
  schemaType: 'yup',
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

- [Yup Documentation](https://github.com/jquense/yup)
- [Plugin Source](../../../packages/form-schema-yup/src/index.ts)
