# @nexus-state/form-schema-zod

> **Zod schema validator plugin** for Nexus State forms

[![npm version](https://img.shields.io/npm/v/@nexus-state/form-schema-zod.svg)](https://www.npmjs.com/package/@nexus-state/form-schema-zod)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 When to Use Zod

### ✅ Choose Zod if you need:

| Use Case | Why Zod |
|----------|---------|
| **TypeScript-first** | Automatic type inference from schemas |
| **Zero dependencies** | Lightweight bundle, no external deps |
| **Rich validation** | 20+ built-in validators, transforms |
| **Developer experience** | Best-in-class TypeScript support |

### ❌ Use alternatives if:

| Use Case | Better Alternative |
|----------|-------------------|
| **JSON Schema standard** | [@nexus-state/form-schema-ajv](https://www.npmjs.com/package/@nexus-state/form-schema-ajv) |
| **Simple DSL** | [@nexus-state/form-schema-dsl](https://www.npmjs.com/package/@nexus-state/form-schema-dsl) |
| **Mature ecosystem** | [@nexus-state/form-schema-yup](https://www.npmjs.com/package/@nexus-state/form-schema-yup) |

---

## 🎯 Overview

Zod plugin integrates [Zod](https://zod.dev/) schema validation with Nexus State forms. Zod is a TypeScript-first schema declaration library with zero external dependencies.

**Why Zod?**
- ✅ TypeScript-first — automatic type inference
- ✅ Zero dependencies — lightweight bundle
- ✅ Rich validation — 20+ built-in validators
- ✅ Transform support — parse and transform data
- ✅ Error messages — detailed, customizable errors

---

## 📦 Installation

```bash
npm install @nexus-state/form-schema-zod zod
```

**Peer dependencies:**
- `@nexus-state/form` — core form package
- `zod` — schema validation library

---

## 🚀 Quick Start

### Basic Form with Zod

```tsx
import { createForm } from '@nexus-state/form';
import { createStore } from '@nexus-state/core';
import { z } from 'zod';
import { zodPlugin } from '@nexus-state/form-schema-zod';

const store = createStore();

// Define schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Create form with Zod plugin
const loginForm = createForm(store, {
  schemaPlugin: zodPlugin,
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
interface ZodFormOptions<TSchema extends z.ZodType> {
  schemaType: 'zod';
  schemaConfig: TSchema;
  initialValues: z.infer<TSchema>;
  defaultValidationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  showErrorsOnTouched?: boolean;
}
```

### Type Inference

```typescript
import { z } from 'zod';
import type { InferZodType } from '@nexus-state/form-schema-zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

// Automatically infer type
type FormData = InferZodType<typeof schema>;
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
import { z } from 'zod';
import { createForm } from '@nexus-state/form';
import { createStore } from '@nexus-state/core';

const store = createStore();

const registrationSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

  email: z.string().email('Invalid email format'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),

  confirmPassword: z.string(),

  age: z.number().min(18, 'You must be at least 18 years old'),

  terms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const registrationForm = createForm(store, {
  schemaType: 'zod',
  schemaConfig: registrationSchema,
  initialValues: {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: 0,
    terms: false,
  },
});
```

### 2. Optional Fields

```tsx
import { z } from 'zod';

const profileSchema = z.object({
  // Required fields
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),

  // Optional fields
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
});
```

### 3. Nested Objects

```tsx
import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
});

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  address: addressSchema,
});
```

### 4. Arrays

```tsx
import { z } from 'zod';

const skillsSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string().min(1),
      level: z.number().min(1).max(5),
    })
  ).min(1, 'At least one skill is required'),
});
```

### 5. Transform and Default Values

```tsx
import { z } from 'zod';

const transformSchema = z.object({
  // Trim whitespace
  username: z.string().trim().min(3),

  // Transform to lowercase
  email: z.string().email().transform((val) => val.toLowerCase()),

  // Transform string to number
  age: z.string().transform((val) => parseInt(val, 10)),

  // Default value
  newsletter: z.boolean().default(false),
});
```

### 6. Async Validation (Uniqueness Check)

```tsx
import { z } from 'zod';

const uniqueEmailSchema = z.object({
  email: z.string().email().refine(
    async (email) => {
      const response = await fetch(`/api/check-email?email=${email}`);
      const data = await response.json();
      return data.available;
    },
    { message: 'Email is already registered' }
  ),
});
```

---

## 🔧 Advanced Usage

### Custom Error Messages

```tsx
import { z } from 'zod';

const schema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters long',
  }),
});
```

### Custom Refinements

```tsx
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string().refine((val) => {
    const hasUppercase = /[A-Z]/.test(val);
    const hasLowercase = /[a-z]/.test(val);
    const hasNumber = /[0-9]/.test(val);
    const hasSpecial = /[!@#$%^&*]/.test(val);

    return hasUppercase && hasLowercase && hasNumber && hasSpecial;
  }, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  }),
});
```

### Preprocess Values

```tsx
import { z } from 'zod';

const schema = z.object({
  email: z.string().preprocess((val) => String(val).trim().toLowerCase(), z.string().email()),
  age: z.string().preprocess((val) => parseInt(String(val), 10), z.number().min(18)),
});
```

---

## ⚠️ Troubleshooting

### Issue: "validateField always returns null"

**Explanation:** Zod validates the entire schema, not individual fields. The plugin's `validateField` method returns `null` and relies on full `validate()` for proper validation.

**Solution:** Use `form.validate()` instead of field-level validation.

### Issue: Type inference not working

**Solution:** Ensure you're importing the schema correctly:

```tsx
// ✅ Correct
import { z } from 'zod';
const schema = z.object({ /* ... */ });
type FormData = z.infer<typeof schema>;

// ❌ Wrong
type FormData = typeof schema; // This gives you the schema type, not inferred type
```

### Issue: Async validation not working

**Solution:** Ensure your refine function returns a Promise:

```tsx
// ✅ Correct
z.string().refine(async (val) => {
  const result = await checkUnique(val);
  return result;
});

// ❌ Wrong
z.string().refine((val) => {
  checkUnique(val); // Missing return and async
});
```

---

## 📚 Resources

- [Zod Documentation](https://zod.dev/)
- [Nexus State Form Documentation](https://nexus-state.dev/)
- [GitHub Repository](https://github.com/eustatos/nexus-state)

---

## 🔗 See Also

- **Core:** [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) — Foundation (atoms, stores)
- **Forms:**
  - [@nexus-state/form](https://www.npmjs.com/package/@nexus-state/form) — Form management
  - [@nexus-state/form-schema-yup](https://www.npmjs.com/package/@nexus-state/form-schema-yup) — Yup validation
  - [@nexus-state/form-builder-react](https://www.npmjs.com/package/@nexus-state/form-builder-react) — Visual form builder
- **Framework integration:**
  - [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react) — React hooks

**Full ecosystem:** [Nexus State Packages](https://www.npmjs.com/org/nexus-state)

---

## 📄 License

MIT © Nexus State Contributors
