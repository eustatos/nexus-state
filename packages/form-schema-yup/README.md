# @nexus-state/form-schema-yup

> **Yup schema validator plugin** for Nexus State forms

[![npm version](https://img.shields.io/npm/v/@nexus-state/form-schema-yup.svg)](https://www.npmjs.com/package/@nexus-state/form-schema-yup)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 When to Use Yup

### ✅ Choose Yup if you need:

| Use Case | Why Yup |
|----------|---------|
| **Mature ecosystem** | Battle-tested in production, large community |
| **Simple API** | Chainable validators, easy to learn |
| **Transform support** | Coerce and transform values |
| **Async validation** | Built-in async test support |

### ❌ Use alternatives if:

| Use Case | Better Alternative |
|----------|-------------------|
| **TypeScript-first** | [@nexus-state/form-schema-zod](https://www.npmjs.com/package/@nexus-state/form-schema-zod) |
| **JSON Schema standard** | [@nexus-state/form-schema-ajv](https://www.npmjs.com/package/@nexus-state/form-schema-ajv) |
| **Simple DSL** | [@nexus-state/form-schema-dsl](https://www.npmjs.com/package/@nexus-state/form-schema-dsl) |

---

## 🎯 Overview

Yup plugin integrates [Yup](https://github.com/jquense/yup) schema validation with Nexus State forms. Yup is a simple and powerful schema builder for value parsing and validation.

**Why Yup?**
- ✅ Simple API — chainable validators
- ✅ Mature library — battle-tested in production
- ✅ Transform support — coerce and transform values
- ✅ Async validation — built-in async test support
- ✅ Custom messages — flexible error customization

---

## 📦 Installation

```bash
npm install @nexus-state/form-schema-yup yup
```

**Peer dependencies:**
- `@nexus-state/form` — core form package
- `yup` — schema validation library

---

## 🚀 Quick Start

### Basic Form with Yup

```tsx
import { createForm } from '@nexus-state/form';
import { createStore } from '@nexus-state/core';
import * as yup from 'yup';
import { yupPlugin } from '@nexus-state/form-schema-yup';

const store = createStore();

// Define schema
const loginSchema = yup.object({
  email: yup.string().email('Invalid email format').required(),
  password: yup.string().min(8, 'Password must be at least 8 characters').required(),
});

// Create form with Yup plugin
const loginForm = createForm(store, {
  schemaPlugin: yupPlugin,
  schemaConfig: loginSchema,
  initialValues: {
    email: '',
    password: '',
  },
});

// Validate form
const isValid = await loginForm.validate();
if (isValid) {
  console.log('Form is valid!');
} else {
  console.log('Errors:', loginForm.errors);
}
```

---

## 📖 API Reference

### Schema Configuration

```typescript
interface YupFormOptions<TSchema extends yup.AnySchema> {
  schemaType: 'yup';
  schemaConfig: TSchema;
  initialValues: yup.InferType<TSchema>;
  defaultValidationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  showErrorsOnTouched?: boolean;
}
```

### Type Inference

```typescript
import * as yup from 'yup';
import type { InferYupType } from '@nexus-state/form-schema-yup';

const schema = yup.object({
  name: yup.string(),
  age: yup.number(),
  email: yup.string().email(),
});

// Automatically infer type
type FormData = InferYupType<typeof schema>;
// Equivalent to:
// type FormData = {
//   name: string;
//   age: number;
//   email: string;
// };
```

---

## 📝 Examples

### 1. Registration Form

```tsx
import * as yup from 'yup';

const registrationSchema = yup.object({
  username: yup
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .required('Username is required'),

  email: yup
    .string()
    .email('Invalid email format')
    .required('Email is required'),

  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain an uppercase letter')
    .matches(/[a-z]/, 'Password must contain a lowercase letter')
    .matches(/[0-9]/, 'Password must contain a number')
    .required('Password is required'),

  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], "Passwords don't match")
    .required('Please confirm your password'),

  age: yup
    .number()
    .min(18, 'You must be at least 18 years old')
    .required('Age is required'),

  terms: yup
    .boolean()
    .oneOf([true], 'You must accept the terms')
    .required(),
});
```

### 2. Optional Fields

```tsx
import * as yup from 'yup';

const profileSchema = yup.object({
  // Required fields
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  
  // Optional fields
  bio: yup.string().max(500, 'Bio must be less than 500 characters'),
  website: yup.string().url('Invalid URL').nullable(),
  phone: yup.string().matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').nullable(),
});
```

### 3. Nested Objects

```tsx
import * as yup from 'yup';

const addressSchema = yup.object({
  street: yup.string().required(),
  city: yup.string().required(),
  state: yup.string().length(2).required(),
  zip: yup.string().matches(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').required(),
});

const userSchema = yup.object({
  name: yup.string().required(),
  email: yup.string().email().required(),
  address: addressSchema.required(),
});
```

### 4. Arrays

```tsx
import * as yup from 'yup';

const skillsSchema = yup.object({
  skills: yup
    .array(
      yup.object({
        name: yup.string().required(),
        level: yup.number().min(1).max(5).required(),
      })
    )
    .min(1, 'At least one skill is required')
    .required(),
});
```

### 5. Transform and Default Values

```tsx
import * as yup from 'yup';

const transformSchema = yup.object({
  // Trim whitespace
  username: yup.string().transform((val) => val?.trim()).min(3),
  
  // Transform to lowercase
  email: yup.string().transform((val) => val?.toLowerCase()).email(),
  
  // Transform string to number
  age: yup.string().transform((val) => parseInt(val, 10)).min(18),
  
  // Default value
  newsletter: yup.boolean().default(false),
});
```

### 6. Async Validation

```tsx
import * as yup from 'yup';

const uniqueEmailSchema = yup.object({
  email: yup
    .string()
    .email()
    .required()
    .test(
      'is-unique',
      'Email is already registered',
      async (value) => {
        if (!value) return true; // Let required handle empty
        const response = await fetch(`/api/check-email?email=${value}`);
        const data = await response.json();
        return data.available;
      }
    ),
});
```

---

## 🔧 Advanced Usage

### Custom Error Messages

```tsx
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().email('Please enter a valid email address'),
  password: yup.string().min(8, 'Password must be at least 8 characters long'),
});
```

### Custom Tests

```tsx
import * as yup from 'yup';

const passwordSchema = yup.object({
  password: yup.string().test(
    'strong-password',
    'Password must contain uppercase, lowercase, number, and special character',
    (value) => {
      if (!value) return false;
      const hasUppercase = /[A-Z]/.test(value);
      const hasLowercase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecial = /[!@#$%^&*]/.test(value);
      return hasUppercase && hasLowercase && hasNumber && hasSpecial;
    }
  ),
});
```

### Using References

```tsx
import * as yup from 'yup';

const schema = yup.object({
  password: yup.string().min(8).required(),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], "Passwords don't match")
    .required(),
});
```

### Lazy Validation

```tsx
import * as yup from 'yup';

const schema = yup.object({
  role: yup.string().oneOf(['admin', 'user', 'guest']).required(),
  permissions: yup.lazy((value) => {
    if (value === 'admin') {
      return yup.array().min(1, 'Admin must have at least one permission');
    }
    return yup.array();
  }),
});
```

---

## ⚠️ Troubleshooting

### Issue: "validateField always returns null"

**Explanation:** Yup's `validateAt` requires all values for context. The plugin's `validateField` method currently returns `null` and relies on full `validate()` for proper validation.

**Solution:** Use `form.validate()` instead of field-level validation.

### Issue: Type inference not working

**Solution:** Ensure you're using `yup.InferType`:

```tsx
// ✅ Correct
import * as yup from 'yup';
const schema = yup.object({ /* ... */ });
type FormData = yup.InferType<typeof schema>;

// ❌ Wrong
type FormData = typeof schema;
```

### Issue: Async test not running

**Solution:** Ensure your test function returns a Promise:

```tsx
// ✅ Correct
yup.string().test('unique', 'Error', async (value) => {
  const result = await checkUnique(value);
  return result;
});

// ❌ Wrong
yup.string().test('unique', 'Error', (value) => {
  checkUnique(value); // Missing return and async
});
```

---

## 📚 Resources

- [Yup Documentation](https://github.com/jquense/yup)
- [Nexus State Form Documentation](https://nexus-state.dev/)
- [GitHub Repository](https://github.com/eustatos/nexus-state)

---

## 🔗 See Also

- **Core:** [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) — Foundation (atoms, stores)
- **Forms:**
  - [@nexus-state/form](https://www.npmjs.com/package/@nexus-state/form) — Form management
  - [@nexus-state/form-schema-zod](https://www.npmjs.com/package/@nexus-state/form-schema-zod) — Zod validation
  - [@nexus-state/form-builder-react](https://www.npmjs.com/package/@nexus-state/form-builder-react) — Visual form builder
- **Framework integration:**
  - [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react) — React hooks

**Full ecosystem:** [Nexus State Packages](https://www.npmjs.com/org/nexus-state)

---

## 📄 License

MIT © Nexus State Contributors
