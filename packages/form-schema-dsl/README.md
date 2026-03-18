# @nexus-state/form-schema-dsl

> **Custom DSL schema validator** for Nexus State forms

[![npm version](https://img.shields.io/npm/v/@nexus-state/form-schema-dsl.svg)](https://www.npmjs.com/package/@nexus-state/form-schema-dsl)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 When to Use DSL

### ✅ Choose DSL if you need:

| Use Case | Why DSL |
|----------|---------|
| **Simple syntax** | Easy to read and write |
| **Composable rules** | Combine validators easily |
| **Async support** | Debouncing, retry, cache built-in |
| **Lightweight** | Minimal bundle size |

### ❌ Use alternatives if:

| Use Case | Better Alternative |
|----------|-------------------|
| **Rich ecosystem** | [@nexus-state/form-schema-zod](https://www.npmjs.com/package/@nexus-state/form-schema-zod) |
| **Mature library** | [@nexus-state/form-schema-yup](https://www.npmjs.com/package/@nexus-state/form-schema-yup) |
| **JSON Schema standard** | [@nexus-state/form-schema-ajv](https://www.npmjs.com/package/@nexus-state/form-schema-ajv) |

---

## 🎯 Overview

DSL plugin provides a custom Domain-Specific Language for form validation in Nexus State. It offers a simple, declarative way to define validation rules without the complexity of full schema libraries.

**Why DSL?**
- ✅ Simple syntax — easy to read and write
- ✅ Composable — combine rules easily
- ✅ Async support — debouncing, retry, cache built-in
- ✅ Lightweight — minimal bundle size
- ✅ Extensible — create custom validators

---

## 📦 Installation

```bash
npm install @nexus-state/form-schema-dsl
```

**Peer dependencies:**
- `@nexus-state/form` — core form package

---

## 🚀 Quick Start

### Basic Form with DSL

```tsx
import { createForm } from '@nexus-state/form';
import { useAtom } from '@nexus-state/react';
import { createStore } from '@nexus-state/core';
import { required, minLength, email } from '@nexus-state/form-schema-dsl';

const store = createStore();

// Define schema
const loginSchema = {
  email: [required, email],
  password: [required, minLength(8)],
};

// Create form
const loginForm = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: loginSchema,
  initialValues: {
    email: '',
    password: '',
  },
});

// Use in component
function LoginForm() {
  const [form] = useAtom(loginForm);

  const handleSubmit = async () => {
    const result = await loginForm.submit();
    if (result.success) {
      console.log('Success:', result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={form.values.email}
        onChange={(e) => loginForm.setField('email', e.target.value)}
      />
      {form.errors.email && <span>{form.errors.email}</span>}

      <input
        type="password"
        value={form.values.password}
        onChange={(e) => loginForm.setField('password', e.target.value)}
      />
      {form.errors.password && <span>{form.errors.password}</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

---

## 📖 API Reference

### DSL Schema

```typescript
interface DSLSchema<TValues = Record<string, unknown>> {
  [fieldName: string]: DSLRule | DSLRule[];
}

interface DSLRule<TValue = any> {
  validate: (value: TValue, allValues: Record<string, unknown>) => string | null | Promise<string | null>;
  code?: string;
  message?: string;
  options?: {
    debounce?: number;
    retry?: number;
    timeout?: number;
  };
}
```

### Schema Configuration

```typescript
interface DSLFormOptions {
  schemaType: 'dsl';
  schemaConfig: DSLSchema;
  initialValues: Record<string, unknown>;
  defaultValidationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  showErrorsOnTouched?: boolean;
}
```

---

## 📝 Examples

### 1. Registration Form

```tsx
import {
  required,
  minLength,
  maxLength,
  email,
  pattern,
} from '@nexus-state/form-schema-dsl';

const registrationSchema = {
  username: [required, minLength(3), maxLength(20), pattern(/^[a-zA-Z0-9_]+$/)],
  email: [required, email],
  password: [required, minLength(8)],
  age: [required, minValue(18), maxValue(120)],
  terms: [required, equalTo(true)],
};
```

### 2. Async Validation (Uniqueness Check)

```tsx
import { required, minLength, email, unique } from '@nexus-state/form-schema-dsl';

const registrationSchema = {
  username: [
    required,
    minLength(3),
    unique('users', 'username', {
      debounce: 500,  // Wait 500ms after typing
      retry: 2,       // Retry on network error
      timeout: 5000,  // 5 second timeout
    }),
  ],
  email: [
    required,
    email,
    unique('users', 'email', {
      debounce: 500,
    }),
  ],
};
```

### 3. Custom Validators

```tsx
import { custom } from '@nexus-state/form-schema-dsl';

const strongPassword = custom(
  (value) => {
    if (!/[A-Z]/.test(value)) return 'Need uppercase letter';
    if (!/[a-z]/.test(value)) return 'Need lowercase letter';
    if (!/[0-9]/.test(value)) return 'Need number';
    if (!/[!@#$%^&*]/.test(value)) return 'Need special character';
    return null;
  },
  'strong_password'
);

const schema = {
  password: [required, minLength(8), strongPassword],
};
```

### 4. Cross-field Validation

```tsx
import { required, minLength, equalTo } from '@nexus-state/form-schema-dsl';

const passwordSchema = {
  password: [required, minLength(8)],
  confirmPassword: [required, equalTo('password')], // Must match 'password' field
};
```

### 5. Conditional Validation

```tsx
import { required, conditional, matchesField } from '@nexus-state/form-schema-dsl';

const schema = {
  needsShipping: [],
  shippingAddress: [
    conditional({
      field: 'needsShipping',
      operator: 'equals',
      value: true,
      then: [required],
    }),
  ],
};
```

### 6. Phone Number Validation

```tsx
import { required, phone } from '@nexus-state/form-schema-dsl';

const schema = {
  phone: [required, phone('US')], // US phone format
};

// Or with custom pattern
import { pattern } from '@nexus-state/form-schema-dsl';

const schema = {
  phone: [required, pattern(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')],
};
```

### 7. URL Validation

```tsx
import { required, url } from '@nexus-state/form-schema-dsl';

const schema = {
  website: [url], // Optional URL
  portfolio: [required, url('https')], // Required HTTPS URL
};
```

### 8. Credit Card Validation

```tsx
import { required, creditCard } from '@nexus-state/form-schema-dsl';

const schema = {
  cardNumber: [required, creditCard],
};
```

### 9. Array Length Validation

```tsx
import { required, arrayLength } from '@nexus-state/form-schema-dsl';

const schema = {
  skills: [required, arrayLength(1, 10)], // 1-10 skills
};
```

### 10. One Of / Not One Of

```tsx
import { oneOf, notOneOf } from '@nexus-state/form-schema-dsl';

const schema = {
  role: [oneOf(['admin', 'user', 'guest'])],
  status: [notOneOf(['banned', 'deleted'])],
};
```

---

## 🔧 Built-in Validators

### String Validators

| Validator | Description | Example |
|-----------|-------------|---------|
| `required` | Field is required | `[required]` |
| `minLength(n)` | Minimum string length | `[minLength(3)]` |
| `maxLength(n)` | Maximum string length | `[maxLength(100)]` |
| `length(n)` | Exact string length | `[length(5)]` |
| `lengthRange(min, max)` | Length range | `[lengthRange(3, 20)]` |
| `pattern(regex, message?)` | Regex pattern | `[pattern(/^[a-z]+$/)]` |
| `email` | Email format | `[email]` |
| `url(protocol?)` | URL format | `[url('https')]` |
| `phone(country?)` | Phone format | `[phone('US')]` |

### Number Validators

| Validator | Description | Example |
|-----------|-------------|---------|
| `minValue(n)` | Minimum value | `[minValue(18)]` |
| `maxValue(n)` | Maximum value | `[maxValue(120)]` |
| `valueRange(min, max)` | Value range | `[valueRange(1, 10)]` |
| `positive` | Must be positive | `[positive]` |
| `negative` | Must be negative | `[negative]` |
| `integer` | Must be integer | `[integer]` |

### Boolean Validators

| Validator | Description | Example |
|-----------|-------------|---------|
| `equalTo(value)` | Must equal value | `[equalTo(true)]` |
| `notEqualTo(value)` | Must not equal value | `[notEqualTo(false)]` |

### Array Validators

| Validator | Description | Example |
|-----------|-------------|---------|
| `arrayLength(min, max?)` | Array length | `[arrayLength(1, 10)]` |

### Selection Validators

| Validator | Description | Example |
|-----------|-------------|---------|
| `oneOf(values)` | Must be one of values | `[oneOf(['a', 'b'])]` |
| `notOneOf(values)` | Must not be any of values | `[notOneOf(['x', 'y'])]` |

### Cross-field Validators

| Validator | Description | Example |
|-----------|-------------|---------|
| `equalTo(field)` | Must equal another field | `[equalTo('password')]` |
| `matchesField(field)` | Must match another field | `[matchesField('password')]` |
| `conditional(config)` | Conditional validation | See below |

### Async Validators

| Validator | Description | Example |
|-----------|-------------|---------|
| `unique(table, field, options?)` | Check uniqueness | `[unique('users', 'email')]` |
| `exists(table, field, options?)` | Check existence | `[exists('users', 'id')]` |
| `asyncCustom(fn, options?)` | Custom async validator | See below |

---

## 🔧 Advanced Usage

### Conditional Validation

```tsx
import { conditional, required } from '@nexus-state/form-schema-dsl';

const schema = {
  needsShipping: [],
  shippingAddress: [
    conditional({
      field: 'needsShipping',
      operator: 'equals',
      value: true,
      then: [required],
    }),
  ],
};
```

### Custom Async Validator

```tsx
import { asyncCustom } from '@nexus-state/form-schema-dsl';

const promoCodeValidator = asyncCustom(
  async (value) => {
    const response = await fetch(`/api/check-promo?code=${value}`);
    const data = await response.json();
    return data.valid ? null : 'Invalid promo code';
  },
  {
    debounce: 500,
    retry: 2,
    timeout: 5000,
  }
);

const schema = {
  promoCode: [required, promoCodeValidator],
};
```

### Combining Validators

```tsx
import { required, minLength, maxLength, pattern } from '@nexus-state/form-schema-dsl';

const schema = {
  username: [
    required,
    minLength(3),
    maxLength(20),
    pattern(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
  ],
};
```

### Custom Error Messages

```tsx
import { minLength } from '@nexus-state/form-schema-dsl';

const schema = {
  password: [
    minLength(8, 'Password must be at least 8 characters long'),
  ],
};
```

---

## ⚠️ Troubleshooting

### Issue: "validateField always returns null"

**Explanation:** DSL validators require all values for cross-field validation. The plugin's `validateField` method returns `null` and relies on full `validate()` for proper validation.

**Solution:** Use `form.validate()` instead of field-level validation.

### Issue: Async validator not working

**Solution:** Ensure your validator returns a Promise:

```tsx
// ✅ Correct
const validator = asyncCustom(async (value) => {
  const result = await checkValue(value);
  return result ? null : 'Error';
});

// ❌ Wrong
const validator = asyncCustom((value) => {
  checkValue(value); // Missing return and async
});
```

### Issue: Conditional validation not triggering

**Solution:** Ensure the conditional field name matches exactly:

```tsx
// ✅ Correct
conditional({
  field: 'needsShipping', // Must match field name exactly
  operator: 'equals',
  value: true,
  then: [required],
});

// ❌ Wrong
conditional({
  field: 'needShipping', // Typo - doesn't match
  // ...
});
```

---

## 📚 Resources

- [Nexus State Form Documentation](https://nexus-state.dev/)
- [GitHub Repository](https://github.com/eustatos/nexus-state)

---

## 🔗 See Also

- **Core:** [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) — Foundation (atoms, stores)
- **Forms:**
  - [@nexus-state/form](https://www.npmjs.com/package/@nexus-state/form) — Form management
  - [@nexus-state/form-schema-zod](https://www.npmjs.com/package/@nexus-state/form-schema-zod) — Zod validation
  - [@nexus-state/form-schema-yup](https://www.npmjs.com/package/@nexus-state/form-schema-yup) — Yup validation
  - [@nexus-state/form-schema-ajv](https://www.npmjs.com/package/@nexus-state/form-schema-ajv) — JSON Schema validation
- **Framework integration:**
  - [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react) — React hooks

**Full ecosystem:** [Nexus State Packages](https://www.npmjs.com/org/nexus-state)

---

## 📄 License

MIT © Nexus State Contributors
