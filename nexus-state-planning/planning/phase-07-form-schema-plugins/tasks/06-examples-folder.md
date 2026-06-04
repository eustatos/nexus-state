# Task 06: Examples Folder

**Приоритет:** Medium  
**Оценка:** 2-3 дня  
**Статус:** Todo

---

## Цель

Создать папку с примерами для каждого schema plugin.

---

## Структура

```
packages/form-schema-zod/
├── examples/
│   ├── basic/
│   │   ├── index.tsx
│   │   ├── package.json
│   │   └── README.md
│   ├── async-validation/
│   │   ├── index.tsx
│   │   ├── package.json
│   │   └── README.md
│   ├── cross-field/
│   │   ├── index.tsx
│   │   ├── package.json
│   │   └── README.md
│   └── README.md

packages/form-schema-yup/
├── examples/
│   └── ... (аналогично)

packages/form-schema-ajv/
├── examples/
│   └── ... (аналогично)

packages/form-schema-dsl/
├── examples/
│   ├── basic/
│   ├── async-validation/
│   ├── custom-validators/
│   ├── composition/
│   └── README.md
```

---

## Scope

### 1. Zod Examples

**basic/**
```tsx
import { createForm } from '@nexus-state/form';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  age: z.number().min(18).max(120),
});

function RegistrationForm() {
  const { register, handleSubmit, formState } = useForm({
    schemaType: 'zod',
    schemaConfig: schema,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('username')} />
      {formState.errors.username && <span>{formState.errors.username}</span>}
      {/* ... */}
    </form>
  );
}
```

**async-validation/**
```tsx
const schema = z.object({
  username: z.string().refine(async (val) => {
    const response = await fetch(`/api/check-username?username=${val}`);
    const data = await response.json();
    return data.available;
  }, 'Username already taken'),
});
```

**cross-field/**
```tsx
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

### 2. Yup Examples

Аналогичные примеры для Yup.

### 3. AJV Examples

**basic/**
```tsx
const schema = {
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 3, maxLength: 20 },
    email: { type: 'string', format: 'email' },
    age: { type: 'number', minimum: 18, maximum: 120 },
  },
  required: ['username', 'email', 'age'],
};
```

**custom-keywords/**
```tsx
const adultKeyword = createCustomKeyword({
  keyword: 'adult',
  type: 'number',
  validate: (schema, age) => age >= schema,
});

const schema = {
  type: 'object',
  properties: {
    age: { type: 'number', adult: 18 },
  },
};
```

### 4. DSL Examples

**basic/**
```tsx
import { required, minLength, email } from '@nexus-state/form-schema-dsl';

const schema: DSLSchema = {
  username: [required, minLength(3)],
  email: [required, email],
};
```

**async-validation/**
```tsx
import { required, email, unique } from '@nexus-state/form-schema-dsl';

const schema: DSLSchema = {
  username: [required, minLength(3), unique('users', 'username', { debounce: 500 })],
  email: [required, email, unique('users', 'email', { debounce: 500 })],
};
```

**custom-validators/**
```tsx
import { custom } from '@nexus-state/form-schema-dsl';

const strongPassword = custom(
  (value) => {
    if (!/[A-Z]/.test(value)) return 'Need uppercase';
    if (!/[0-9]/.test(value)) return 'Need number';
    if (!/[!@#$%^&*]/.test(value)) return 'Need special char';
    return null;
  },
  'strong_password'
);

const schema: DSLSchema = {
  password: [required, minLength(8), strongPassword],
};
```

---

## Implementation Plan

1. **Create structure** (0.5 дня)
   - Create examples/ folders
   - Setup package.json for each example
   - Configure TypeScript

2. **Write examples** (1.5 дня)
   - Basic examples for each plugin
   - Advanced examples
   - README for each example

3. **Test examples** (0.5 дня)
   - Ensure all examples run
   - Fix any issues
   - Add run scripts

4. **Documentation** (0.5 дня)
   - Main examples/README.md
   - Links from plugin README
   - Contribution guide

---

## Acceptance Criteria

- [ ] Examples folder создан для каждого plugin
- [ ] Все примеры работают и протестированы
- [ ] README для каждого примера
- [ ] Run scripts настроены
- [ ] Documentation обновлена

---

## Dependencies

- Task 01 (Documentation)

---

## Notes

- Примеры должны быть self-contained (можно запустить отдельно)
- Использовать реальные use cases
- Добавить CodeSandbox links для online demo
