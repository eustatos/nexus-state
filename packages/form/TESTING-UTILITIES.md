# Testing Utilities

`@nexus-state/form/testing` provides factory functions and helpers for testing forms without the boilerplate.

## Installation

```bash
npm install @nexus-state/form
```

## Quick Start

```typescript
import { createTestForm } from '@nexus-state/form/testing';

// Create form without validation (fast!)
const form = createTestForm({
  initialValues: {
    username: '',
    email: '',
  },
});

// Test form behavior
form.setFieldValue('username', 'john_doe');
expect(form.values.username).toBe('john_doe');
expect(form.isDirty).toBe(true);
```

## API Reference

### `createTestForm(options)`

Creates a form optimized for testing with validation disabled by default.

**Options:**
- `initialValues` - Initial form values
- `disableValidation` - Disable validation (default: `true`)
- `validateOnChange` - Enable validation on change
- `validateOnBlur` - Enable validation on blur
- `store` - Custom store instance

**Example:**
```typescript
const form = createTestForm({
  initialValues: { name: '', email: '' },
  disableValidation: true, // No validation
});
```

### `createTestFormWithValidation(options)`

Creates a form with validation enabled for testing validation logic.

**Options:**
- All options from `createTestForm`
- `validate` - Custom validation function
- `schemaType` - Schema type (e.g., 'zod', 'yup')
- `schemaConfig` - Schema configuration

**Example:**
```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = createTestFormWithValidation({
  initialValues: { email: '', password: '' },
  schemaType: 'zod',
  schemaConfig: schema,
});

form.setFieldValue('email', 'invalid');
await form.validate();

expect(form.errors.email).toBeDefined();
expect(form.isValid).toBe(false);
```

### `waitForValidation(form, timeout?)`

Waits for async validation to complete.

**Parameters:**
- `form` - Form instance to wait for
- `timeout` - Maximum wait time in ms (default: 1000)

**Example:**
```typescript
const form = createTestFormWithValidation({
  initialValues: { username: '' },
  validate: async (values) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return values.username === 'taken' 
      ? { username: 'Username taken' } 
      : null;
  },
});

form.setFieldValue('username', 'taken');

// Wait for async validation
await waitForValidation(form);

expect(form.errors.username).toBe('Username taken');
```

### `waitForFormState(form, condition, message?, timeout?)`

Waits for form state to match a condition.

**Parameters:**
- `form` - Form instance to watch
- `condition` - Predicate function
- `message` - Error message on timeout
- `timeout` - Maximum wait time in ms (default: 1000)

**Example:**
```typescript
await waitForFormState(
  form, 
  state => !state.isSubmitting,
  'Form submission should complete',
  2000
);
```

## Common Patterns

### Testing Form Without Validation

```typescript
import { createTestForm } from '@nexus-state/form/testing';

describe('MyForm', () => {
  it('should update field value', () => {
    const form = createTestForm({
      initialValues: { name: '' },
    });

    form.setFieldValue('name', 'John');
    expect(form.values.name).toBe('John');
  });
});
```

### Testing Validation Logic

```typescript
import { createTestFormWithValidation } from '@nexus-state/form/testing';

describe('Validation', () => {
  it('should validate email format', async () => {
    const form = createTestFormWithValidation({
      initialValues: { email: '' },
      validate: (values) => ({
        email: !values.email.includes('@') ? 'Invalid email' : null,
      }),
    });

    form.setFieldValue('email', 'invalid');
    await form.validate();

    expect(form.errors.email).toBe('Invalid email');
  });
});
```

### Testing with Zod Schema

```typescript
import { z } from 'zod';
import { createTestFormWithValidation } from '@nexus-state/form/testing';

describe('Zod Validation', () => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  it('should validate with Zod', async () => {
    const form = createTestFormWithValidation({
      initialValues: { email: '', password: '' },
      schemaType: 'zod',
      schemaConfig: schema,
    });

    form.setFieldValue('password', 'short');
    await form.validate();

    expect(form.errors.password).toBeDefined();
  });
});
```

### React Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { createTestForm } from '@nexus-state/form/testing';
import { MyForm } from './MyForm';

describe('MyForm Component', () => {
  it('should submit form', async () => {
    const form = createTestForm({
      initialValues: { name: '', email: '' },
    });

    const mockSubmit = vi.fn();
    form.submit = mockSubmit;

    render(<MyForm formAtom={form} />);
    
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'John' },
    });
    
    fireEvent.click(screen.getByText('Submit'));
    
    expect(mockSubmit).toHaveBeenCalled();
  });
});
```

## See Also

- [Full Testing Guide](./TESTING.md)
- [API Documentation](./README.md)
- [Examples](../../examples/)
