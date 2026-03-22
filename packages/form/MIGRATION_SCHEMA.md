# Migration Guide: Schema Validation API (v0.1 → v1.0)

This guide helps you migrate from the deprecated schema validation API to the new plugin-based API.

## What Changed

The old API required manual validator creation or global registry usage. The new API uses **explicit plugin imports** with no global state.

### Benefits of the New API

- ✅ **No global state** - plugins are imported explicitly
- ✅ **Better tree-shaking** - only import what you need
- ✅ **SSR-safe** - no shared state between requests
- ✅ **Type-safe** - full TypeScript inference
- ✅ **Clear dependencies** - see which plugins your code uses

---

## Migration Steps

### 1. Zod Validation

#### Before (Deprecated)

```typescript
// Option A: Direct validator (REMOVED)
import { zodValidator } from '@nexus-state/form';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = createForm(store, {
  schema: zodValidator(schema), // ❌ Removed
  initialValues: { email: '', password: '' },
});
```

#### After (Recommended)

```typescript
import { zodPlugin } from '@nexus-state/form-schema-zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = createForm(store, {
  schemaPlugin: zodPlugin,  // ✅ New API
  schemaConfig: schema,
  initialValues: { email: '', password: '' },
});
```

---

### 2. Yup Validation

#### Before (Deprecated)

```typescript
// Option A: Direct validator (REMOVED)
import { yupValidator } from '@nexus-state/form';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
});

const form = createForm(store, {
  schema: yupValidator(schema), // ❌ Removed
  initialValues: { email: '', password: '' },
});
```

#### After (Recommended)

```typescript
import { yupPlugin } from '@nexus-state/form-schema-yup';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
});

const form = createForm(store, {
  schemaPlugin: yupPlugin,  // ✅ New API
  schemaConfig: schema,
  initialValues: { email: '', password: '' },
});
```

---

### 3. JSON Schema (AJV)

#### Before (Deprecated)

```typescript
// Option A: Registry-based (deprecated but still works)
import { defaultSchemaRegistry } from '@nexus-state/form/schema';
import { ajvPlugin } from '@nexus-state/form-schema-ajv';

defaultSchemaRegistry.register('ajv', ajvPlugin); // ❌ Global state

const form = createForm(store, {
  schemaType: 'ajv',  // ⚠️ Deprecated
  schemaConfig: { schema: myJsonSchema },
  initialValues: { email: '', password: '' },
});
```

#### After (Recommended)

```typescript
import { ajvPlugin } from '@nexus-state/form-schema-ajv';

const form = createForm(store, {
  schemaPlugin: ajvPlugin,  // ✅ New API
  schemaConfig: { schema: myJsonSchema },
  initialValues: { email: '', password: '' },
});
```

---

### 4. DSL Validation

#### Before (Deprecated)

```typescript
// Option A: Registry-based (deprecated but still works)
import { defaultSchemaRegistry } from '@nexus-state/form/schema';
import { dslPlugin } from '@nexus-state/form-schema-dsl';

defaultSchemaRegistry.register('dsl', dslPlugin); // ❌ Global state

const form = createForm(store, {
  schemaType: 'dsl',  // ⚠️ Deprecated
  schemaConfig: {
    email: [required, email],
    password: [required, minLength(8)],
  },
  initialValues: { email: '', password: '' },
});
```

#### After (Recommended)

```typescript
import { dslPlugin } from '@nexus-state/form-schema-dsl';

const form = createForm(store, {
  schemaPlugin: dslPlugin,  // ✅ New API
  schemaConfig: {
    email: [required, email],
    password: [required, minLength(8)],
  },
  initialValues: { email: '', password: '' },
});
```

---

## API Comparison Table

| Feature | Old API (`schema`) | Old API (`schemaType`) | New API (`schemaPlugin`) |
|---------|-------------------|------------------------|--------------------------|
| **Global state** | ❌ No | ✅ Yes (registry) | ❌ No |
| **Tree-shaking** | ⚠️ Partial | ⚠️ Partial | ✅ Full |
| **SSR-safe** | ✅ Yes | ⚠️ No (shared registry) | ✅ Yes |
| **Type inference** | ⚠️ Manual | ⚠️ Manual | ✅ Automatic |
| **Status** | ❌ Removed | ⚠️ Deprecated | ✅ Recommended |

---

## Installation

Make sure you have the schema plugin packages installed:

```bash
# For Zod
npm install @nexus-state/form-schema-zod zod

# For Yup
npm install @nexus-state/form-schema-yup yup

# For JSON Schema
npm install @nexus-state/form-schema-ajv ajv

# For DSL
npm install @nexus-state/form-schema-dsl
```

---

## Troubleshooting

### "Module not found: @nexus-state/form-schema-zod"

Install the package:
```bash
npm install @nexus-state/form-schema-zod
```

### "Property 'schemaPlugin' does not exist"

Update to the latest version of `@nexus-state/form`:
```bash
npm install @nexus-state/form@latest
```

### TypeScript errors with schemaConfig

Make sure your schema matches the plugin type:

```typescript
// Zod
const form = createForm(store, {
  schemaPlugin: zodPlugin,
  schemaConfig: z.object({ /* ... */ }), // Must be Zod schema
});

// Yup
const form = createForm(store, {
  schemaPlugin: yupPlugin,
  schemaConfig: yup.object({ /* ... */ }), // Must be Yup schema
});
```

---

## Need Help?

- 📖 [Documentation](https://nexus-state.website.yandexcloud.net/)
- 🐛 [Report a bug](https://github.com/eustatos/nexus-state/issues)
- 💬 [Discussions](https://github.com/eustatos/nexus-state/discussions)
