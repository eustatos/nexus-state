# @nexus-state/form-schema-ajv

> **AJV (JSON Schema) validator plugin** for Nexus State forms

[![npm version](https://img.shields.io/npm/v/@nexus-state/form-schema-ajv.svg)](https://www.npmjs.com/package/@nexus-state/form-schema-ajv)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 Overview

AJV plugin integrates [AJV](https://ajv.js.org/) (JSON Schema) validation with Nexus State forms. AJV is the fastest and most popular JSON Schema validator for JavaScript.

**Why JSON Schema / AJV?**
- ✅ Industry standard — widely adopted across languages
- ✅ Declarative — describe what, not how
- ✅ Rich validation — 20+ built-in keywords
- ✅ Custom keywords — extend with your own rules
- ✅ Fast — optimized for performance

---

## 📦 Installation

```bash
npm install @nexus-state/form-schema-ajv ajv
```

**Peer dependencies:**
- `@nexus-state/form` — core form package
- `ajv` — JSON Schema validator

---

## 🚀 Quick Start

### Basic Form with JSON Schema

```tsx
import { createForm } from '@nexus-state/form';
import { useAtom } from '@nexus-state/react';

// Define JSON Schema
const loginSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
  required: ['email', 'password'],
};

// Create form
const loginForm = createForm(store, {
  schemaType: 'ajv',
  schemaConfig: {
    schema: loginSchema,
  },
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

### Schema Configuration

```typescript
interface AjvFormOptions {
  schemaType: 'ajv';
  schemaConfig: AjvSchemaConfig;
  initialValues: Record<string, unknown>;
  defaultValidationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  showErrorsOnTouched?: boolean;
}

interface AjvSchemaConfig {
  schema: object; // JSON Schema object
  ajvOptions?: Options; // AJV options
  keywords?: KeywordDefinition[]; // Custom keywords
  formats?: Record<string, string | RegExp | ((value: string) => boolean)>; // Custom formats
}
```

### AJV Options

```typescript
import { Options } from 'ajv';

const config: AjvSchemaConfig = {
  schema: mySchema,
  ajvOptions: {
    allErrors: true,      // Collect all errors
    useDefaults: true,    // Use default values from schema
    strict: false,        // Less strict mode
  },
};
```

---

## 📝 Examples

### 1. Registration Form

```tsx
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
    age: {
      type: 'number',
      minimum: 18,
      maximum: 120,
    },
    terms: {
      type: 'boolean',
      enum: [true],
    },
  },
  required: ['username', 'email', 'password', 'age', 'terms'],
};
```

### 2. Custom Error Messages

```tsx
const schema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      errorMessage: {
        type: 'Email must be a string',
        format: 'Please enter a valid email address',
      },
    },
    password: {
      type: 'string',
      minLength: 8,
      errorMessage: {
        minLength: 'Password must be at least 8 characters',
      },
    },
  },
  required: ['email', 'password'],
  errorMessage: {
    required: {
      email: 'Email is required',
      password: 'Password is required',
    },
  },
};

// Enable ajv-errors plugin
const config: AjvSchemaConfig = {
  schema,
  keywords: [require('ajv-errors')],
};
```

### 3. Custom Formats

```tsx
import { builtInFormats } from '@nexus-state/form-schema-ajv';

const config: AjvSchemaConfig = {
  schema: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      url: { type: 'string', format: 'uri' },
      uuid: { type: 'string', format: 'uuid' },
      date: { type: 'string', format: 'date' },
      ipv4: { type: 'string', format: 'ipv4' },
    },
  },
  formats: {
    // Override or add custom formats
    phone: /^\+?[1-9]\d{1,14}$/,
    postalCode: /^\d{5}(-\d{4})?$/,
  },
};
```

### 4. Custom Keywords

```tsx
import { createCustomKeyword } from '@nexus-state/form-schema-ajv';

// Create custom "adult" keyword
const adultKeyword = createCustomKeyword({
  keyword: 'adult',
  type: 'number',
  validate: (schema: number, data: number) => data >= schema,
  errors: true,
});

const config: AjvSchemaConfig = {
  schema: {
    type: 'object',
    properties: {
      age: {
        type: 'number',
        adult: 18, // Custom keyword
      },
    },
  },
  keywords: [adultKeyword],
};
```

### 5. Default Values

```tsx
const schema = {
  type: 'object',
  properties: {
    newsletter: {
      type: 'boolean',
      default: false,
    },
    role: {
      type: 'string',
      default: 'user',
    },
    preferences: {
      type: 'object',
      default: {
        theme: 'light',
        language: 'en',
      },
    },
  },
};

// With useDefaults: true, defaults are applied during validation
const config: AjvSchemaConfig = {
  schema,
  ajvOptions: {
    useDefaults: true,
  },
};
```

### 6. Conditional Validation

```tsx
const schema = {
  type: 'object',
  properties: {
    needsShipping: { type: 'boolean' },
    shippingAddress: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        zip: { type: 'string' },
      },
      required: ['street', 'city', 'zip'],
    },
  },
  if: {
    properties: {
      needsShipping: { const: true },
    },
  },
  then: {
    required: ['shippingAddress'],
  },
};
```

### 7. Nested Objects

```tsx
const addressSchema = {
  type: 'object',
  properties: {
    street: { type: 'string', minLength: 1 },
    city: { type: 'string', minLength: 1 },
    state: { type: 'string', minLength: 2, maxLength: 2 },
    zip: { type: 'string', pattern: '^\\d{5}(-\\d{4})?$' },
  },
  required: ['street', 'city', 'state', 'zip'],
};

const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    address: addressSchema,
  },
  required: ['name', 'email', 'address'],
};
```

### 8. Arrays

```tsx
const skillsSchema = {
  type: 'object',
  properties: {
    skills: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          level: { type: 'number', minimum: 1, maximum: 5 },
        },
        required: ['name', 'level'],
      },
      minItems: 1,
    },
  },
  required: ['skills'],
};
```

---

## 🔧 Advanced Usage

### Built-in Formats

```typescript
import { builtInFormats } from '@nexus-state/form-schema-ajv';

// Available formats:
// - email
// - uri
// - uuid
// - date
// - date-time
// - time
// - ipv4
// - ipv6
```

### Async Validation

JSON Schema doesn't natively support async validation. For async validation (e.g., uniqueness checks), combine with custom validators:

```tsx
// Use form-level async validation
const form = createForm(store, {
  schemaType: 'ajv',
  schemaConfig: { schema: mySchema },
  asyncValidators: {
    email: async (value) => {
      const response = await fetch(`/api/check-email?email=${value}`);
      const data = await response.json();
      return data.available ? null : 'Email is already registered';
    },
  },
});
```

### Schema Reuse with $ref

```tsx
const schema = {
  $defs: {
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        zip: { type: 'string' },
      },
      required: ['street', 'city', 'zip'],
    },
  },
  type: 'object',
  properties: {
    billingAddress: { $ref: '#/$defs/address' },
    shippingAddress: { $ref: '#/$defs/address' },
  },
};
```

---

## ⚠️ Troubleshooting

### Issue: "validateField always returns null"

**Explanation:** AJV validates the entire schema, not individual fields. The plugin's `validateField` method returns `null` and relies on full `validate()` for proper validation.

**Solution:** Use `form.validate()` instead of field-level validation.

### Issue: Custom formats not working

**Solution:** Register formats in the config:

```tsx
const config: AjvSchemaConfig = {
  schema: mySchema,
  formats: {
    phone: /^\+?[1-9]\d{1,14}$/,
  },
};
```

### Issue: Custom keywords not recognized

**Solution:** Register keywords in the config:

```tsx
const config: AjvSchemaConfig = {
  schema: mySchema,
  keywords: [myCustomKeyword],
};
```

---

## 📚 Resources

- [AJV Documentation](https://ajv.js.org/)
- [JSON Schema Specification](https://json-schema.org/)
- [Nexus State Form Documentation](https://nexus-state.dev/)
- [GitHub Repository](https://github.com/eustatos/nexus-state)

---

## 📄 License

MIT © Nexus State Contributors
