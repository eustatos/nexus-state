# @nexus-state/form

> **Forms for complex applications** — with DevTools, atomic architecture, and full type safety

[![npm version](https://img.shields.io/npm/v/@nexus-state/form.svg)](https://www.npmjs.com/package/@nexus-state/form)
> [![Coverage for form package](https://coveralls.io/repos/github/eustatos/nexus-state/badge.svg?branch=main&job_name=form)](https://coveralls.io/github/eustatos/nexus-state?branch=main)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-17+-61dafb.svg)](https://react.dev/)

---

## 🎯 When to Choose @nexus-state/form

### ✅ Perfect for:

| Scenario | Why |
|----------|--------|
| **Forms with 50+ fields** | Atomic architecture = minimal re-renders |
| **Complex validation** | Async validation with debouncing, retry, cache out of the box |
| **Enterprise applications** | DevTools for debugging, audit trail of changes |
| **Cross-framework projects** | Single core for React, Vue, Svelte |
| **High-performance UIs** | Granular updates, no unnecessary renders |

### ❌ Not suitable for:

- Simple forms (login, contact) → use **React Hook Form**
- Prototypes and MVPs → pick something lighter
- Server-side forms (Next.js Server Actions) → trend is server validation

---

## 🚀 Quick Start

### Installation

```bash
npm install @nexus-state/form @nexus-state/core @nexus-state/react
```

### Basic Example (React)

```tsx
import { useForm } from '@nexus-state/form/react';
import { required, email, minLength } from '@nexus-state/form';

interface RegisterForm {
  username: string;
  email: string;
  password: string;
}

function RegistrationForm() {
  const { register, handleSubmit, formState } = useForm<RegisterForm>({
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
    mode: 'onBlur',              // Validate on blur
    showErrorsOnTouched: true,   // Show errors after touch
  });

  const onSubmit = async (data) => {
    await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('username', { validators: [required, minLength(3)] })}
        placeholder="Username"
      />
      {formState.errors.username && (
        <span className="error">{formState.errors.username}</span>
      )}

      <input
        {...register('email', { validators: [required, email] })}
        placeholder="Email"
      />
      {formState.errors.email && (
        <span className="error">{formState.errors.email}</span>
      )}

      <input
        type="password"
        {...register('password', { validators: [required, minLength(8)] })}
        placeholder="Password"
      />
      {formState.errors.password && (
        <span className="error">{formState.errors.password}</span>
      )}

      <button type="submit" disabled={!formState.isValid}>
        Register
      </button>
    </form>
  );
}
```

---

## 🔥 Key Features

### 1. DevTools Integration 🛠️

Debug forms in **Redux DevTools** — see every change, validation, stack trace:

```typescript
import { createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';
import { useForm } from '@nexus-state/form/react';

const store = createStore();

// Apply DevTools plugin
const devtools = devTools({
  name: 'My App Forms',
  trace: true,          // Stack trace for every change
  maxAge: 100,          // Keep last 100 actions
});

devtools.apply(store);

// Now in Redux DevTools you can see:
// ✅ Every field change
// ✅ When validation triggered
// ✅ Validation errors
// ✅ Time-travel to previous states
```

**Benefit:** Debugging complex forms takes minutes instead of hours.

---

### 2. Async Validation Out of the Box 🌐

Uniqueness checks, API validation with debouncing, retry, cache:

```tsx
import { createField } from '@nexus-state/form';
import { useField } from '@nexus-state/form/react';

function UsernameField() {
  const { field, fieldState } = useField('username', {
    initialValue: '',
    validators: [required],
    asyncValidators: [{
      validate: async (value) => {
        const response = await fetch(`/api/check-username?username=${value}`);
        const { available } = await response.json();
        return available ? null : 'Username already taken';
      },
      options: {
        debounce: 500,    // Wait 500ms after last keystroke
        cache: true,      // Cache results
        retry: 2,         // 2 retries on network error
        timeout: 5000,    // 5 second timeout
      }
    }],
    validateOn: 'onChange',
  });

  return (
    <div>
      <input {...field} />
      {fieldState.validating && <span>Checking...</span>}
      {fieldState.error && <span className="error">{fieldState.error}</span>}
    </div>
  );
}
```

**Built-in:**
- ✅ Debouncing (don't spam API on every keystroke)
- ✅ Caching (don't request same value twice)
- ✅ Retry logic (recover from network errors)
- ✅ Timeout (protect from slow responses)

---

### 3. Flexible Validation Triggers 🎯

Control when validation runs:

```tsx
const form = useForm({
  mode: 'onBlur',           // First validation on blur
  reValidateMode: 'onChange', // After error — validate on every change
  showErrorsOnTouched: true,  // Show errors only after touch
});

// UX example:
// 1. User types — errors hidden
// 2. Loses focus — show errors
// 3. Starts fixing — validate on the fly (fast feedback)
```

**Modes:**
- `'onChange'` — validate on every change
- `'onBlur'` — validate on blur
- `'onSubmit'` — validate only on submit

---

### 4. Dynamic Field Arrays 📋

Add, remove, reorder fields:

```tsx
import { useFieldArray } from '@nexus-state/form/react';

interface Skill { name: string; level: number }

function SkillsForm() {
  const { fields, append, remove, move } = useFieldArray<Skill>('skills', {
    defaultValue: [{ name: '', level: 1 }],
  });

  return (
    <div>
      {fields.map((skill, index) => (
        <div key={skill.id}>
          <input value={skill.name} onChange={...} />
          <button onClick={() => remove(index)}>Remove</button>
          <button onClick={() => move(index, index - 1)}>↑</button>
          <button onClick={() => move(index, index + 1)}>↓</button>
        </div>
      ))}
      <button onClick={() => append({ name: '', level: 1 })}>
        Add Skill
      </button>
    </div>
  );
}
```

**Methods:** `append`, `prepend`, `remove`, `insert`, `swap`, `move`, `update`, `replace`

---

### 5. Full TypeScript Support 🎯

Type inference out of the box:

```tsx
interface User {
  name: string;
  age: number;
  email: string;
}

const { register, handleSubmit } = useForm<User>();

register('name');    // ✅ OK
register('age');     // ✅ OK
register('invalid'); // ❌ TypeScript error: Property 'invalid' does not exist

handleSubmit((data) => {
  // data is typed as User
  console.log(data.name);  // ✅
  console.log(data.age);   // ✅
});
```

---

## 📊 Comparison with Alternatives

| Feature | @nexus-state/form | React Hook Form | Formik | Redux Form |
|---------|-------------------|-----------------|--------|------------|
| **DevTools** | ✅ Redux DevTools | ❌ | ❌ | ✅ |
| **Async validation** | ✅ Out of box | ⚠️ Manual | ⚠️ Manual | ⚠️ Manual |
| **Debouncing** | ✅ Built-in | ❌ | ❌ | ❌ |
| **Retry logic** | ✅ Built-in | ❌ | ❌ | ❌ |
| **Validation triggers** | ✅ onChange/blur/submit | ⚠️ Limited | ⚠️ Limited | ⚠️ Limited |
| **Performance (50+ fields)** | 🟢 Excellent | 🟢 Excellent | 🟡 Medium | 🔴 Slow |
| **Cross-framework** | ✅ React/Vue/Svelte | ❌ React only | ❌ React only | ❌ React only |
| **Bundle size** | 🟡 ~15KB | 🟢 ~7KB | 🟡 ~14KB | 🔴 ~25KB |
| **Learning curve** | 🟡 Medium | 🟢 Low | 🟢 Low | 🔴 High |

---

## 🏗️ Architecture

### Atomic Approach

Each field is a separate atom. Subscribe only to needed changes:

```typescript
// Traditional approach (React Hook Form, Formik)
// Single state for entire form → re-render all fields when one changes

// @nexus-state/form
// Each field is separate atom → re-render only changed field

const usernameField = createField(store, 'username', { ... });
const emailField = createField(store, 'email', { ... });

// Changing username doesn't trigger re-render of email field
```

**Result:** Performance doesn't degrade on forms with 100+ fields.

---

## 📚 API Reference

### useForm

```typescript
const {
  register,           // Register field
  handleSubmit,       // Submit handler
  formState,          // Form state
  reset,              // Reset form
  setValue,           // Set field value
  getValue,           // Get field value
  setError,           // Set field error
  clearErrors,        // Clear errors
  trigger,            // Manual validation
} = useForm<FormValues>({
  defaultValues: { ... },
  mode: 'onBlur',
  reValidateMode: 'onChange',
  showErrorsOnTouched: true,
});
```

### useField

```typescript
const {
  field,              // Props for input
  fieldState,         // Field state
  helpers,            // Helpers
} = useField('name', {
  initialValue: '',
  validators: [required],
  asyncValidators: [...],
  validateOn: 'onBlur',
  showErrorsOnTouched: true,
});
```

### useFieldArray

```typescript
const {
  fields,             // Array of fields
  append, prepend,    // Add items
  remove, insert,     // Remove/insert
  swap, move,         // Reorder
  update, replace,    // Update
} = useFieldArray<Item>('items', {
  defaultValue: [],
});
```

---

## 🎯 Usage Examples

### Enterprise Form (100+ fields)

```tsx
import { useForm } from '@nexus-state/form/react';
import { devTools } from '@nexus-state/devtools';

// Enable DevTools for debugging
const store = createStore();
devTools({ trace: true, maxAge: 200 }).apply(store);

function LoanApplicationForm() {
  const { register, handleSubmit, formState } = useForm<LoanApplication>({
    mode: 'onBlur',
    showErrorsOnTouched: true,
  });

  // 100+ fields without performance degradation
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Personal info section */}
      <input {...register('firstName')} />
      <input {...register('lastName')} />
      {/* ... 98 more fields */}
    </form>
  );
}
```

**Why @nexus-state/form:**
- DevTools for debugging complex logic
- Performance on 100+ fields
- Audit trail of changes

---

### Form with Async Validation

```tsx
function RegistrationForm() {
  const { register, handleSubmit } = useForm({
    defaultValues: { username: '', email: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('username', {
          validators: [required, minLength(3)],
          asyncValidators: [{
            validate: async (v) => {
              const res = await fetch(`/api/check?username=${v}`);
              return res.available ? null : 'Taken';
            },
            options: { debounce: 500, cache: true }
          }]
        })}
      />
      
      <input
        {...register('email', {
          validators: [required, email],
          asyncValidators: [{
            validate: async (v) => {
              const res = await fetch(`/api/check?email=${v}`);
              return res.available ? null : 'Registered';
            },
            options: { debounce: 500 }
          }]
        })}
      />
    </form>
  );
}
```

**Why @nexus-state/form:**
- Built-in debouncing (don't spam API)
- Caching (don't request same value twice)
- Retry on network errors

---

### Dynamic Form (Form Builder)

```tsx
function FormBuilder() {
  const { fields, append, remove } = useFieldArray<FormField>('fields', {
    defaultValue: [],
  });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input value={field.label} onChange={...} />
          <select value={field.type}>
            <option value="text">Text</option>
            <option value="number">Number</option>
          </select>
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => append({ label: '', type: 'text' })}>
        Add Field
      </button>
    </div>
  );
}
```

**Why @nexus-state/form:**
- Simple array manipulation
- Each field is separate atom
- Easy to add validation

---

## ⚠️ When NOT to Use

### Simple Forms

```tsx
// ❌ Overkill for login form
const { register } = useForm({ ... });

// ✅ Better with React Hook Form
import { useForm } from 'react-hook-form';
```

### Server-side Validation

```tsx
// ❌ If all validation is on server (Next.js Server Actions)
// ✅ Use server actions + Zod schemas
```

### Prototypes

```tsx
// ❌ For 2-day MVP
// ✅ Pick something simpler (Formik, react-hook-form)
```

---

## 🔧 Integrations

### Zod Schemas

```tsx
import { z } from 'zod';
import { zodValidator } from '@nexus-state/form';

const schema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
});

const form = useForm({
  schema: zodValidator(schema),
});
```

### Yup Schemas

```tsx
import * as yup from 'yup';
import { yupValidator } from '@nexus-state/form';

const schema = yup.object({
  username: yup.string().min(3).required(),
  email: yup.string().email().required(),
});

const form = useForm({
  schema: yupValidator(schema),
});
```

---

## 📦 Bundle Size

| Package | Size (minified) | Gzip |
|---------|-----------------|------|
| Core | ~8KB | ~3KB |
| React hooks | ~4KB | ~2KB |
| Utils | ~3KB | ~1KB |
| **Total** | **~15KB** | **~6KB** |

---

## 🤝 Contributing

Welcome:
- ✅ Bug reports
- ✅ Feature requests
- ✅ Pull requests
- ✅ Documentation

---

## 📄 License

MIT © Nexus State Contributors

---

## 🔗 Links

- [Documentation](https://nexus-state.website.yandexcloud.net/)
- [Redux DevTools Integration](https://github.com/reduxjs/redux-devtools)
- [Nexus State Core](https://github.com/eustatos/nexus-state/tree/main/packages/core)
- [Examples](https://github.com/eustatos/nexus-state/tree/main/packages/form/examples)
