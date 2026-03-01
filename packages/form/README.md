# @nexus-state/form

Type-safe form management with field-level granularity for Nexus State.

## Features

- ✅ Field-level atoms (granular re-renders)
- ✅ Type-safe with TypeScript
- ✅ Framework-agnostic
- ✅ Simple API
- ⬜ Schema validation (coming soon)
- ⬜ Async validation (coming soon)
- ⬜ Field arrays (coming soon)

## Installation

```bash
npm install @nexus-state/form
```

## Quick Start

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';

const store = createStore();

const form = createForm(store, {
  initialValues: {
    name: '',
    email: '',
    age: 0
  },
  onSubmit: async (values) => {
    console.log(values);
  }
});

// Get field
const nameField = form.field('name');

// Update value
nameField.setValue('John');

// Submit
await form.submit();
```

## API

### `createForm(store, options)`

Creates a form instance with field-level atoms.

**Options:**

- `initialValues` - Initial form values
- `onSubmit` - Submit handler function
- `validate` - Optional form-level validator
- `validateOnChange` - Enable validation on value change
- `validateOnBlur` - Enable validation on field blur

**Returns:**

- `values` - Current form values
- `errors` - Form errors
- `isValid` - Whether form is valid
- `isDirty` - Whether form has been modified
- `isSubmitting` - Whether form is submitting
- `field(name)` - Get field API by name
- `setFieldValue(name, value)` - Set field value
- `setFieldError(name, error)` - Set field error
- `setFieldTouched(name, touched)` - Set field touched state
- `reset()` - Reset form to initial values
- `submit()` - Submit form
- `validate()` - Validate all fields

### Field API

```typescript
const field = form.field('name');

field.value; // Current value
field.error; // Error message
field.touched; // Touched state
field.dirty; // Dirty state

field.setValue('John');
field.setTouched(true);
field.setError('Required');
field.reset();

// For input binding
field.inputProps; // { value, onChange, onBlur }
```

## License

MIT
