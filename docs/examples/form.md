# Forms Example

A form example demonstrating validation and submission handling with Nexus State.

## Core Implementation

```javascript
import { atom, createStore } from '@nexus-state/core';

// Form state
const formAtom = atom({
  values: {
    name: '',
    email: '',
    age: ''
  },
  errors: {},
  isSubmitting: false
});

const store = createStore();

// Form actions
const updateField = (field, value) => {
  const currentForm = store.get(formAtom);
  
  store.set(formAtom, {
    ...currentForm,
    values: {
      ...currentForm.values,
      [field]: value
    },
    // Clear error when user starts typing
    errors: {
      ...currentForm.errors,
      [field]: undefined
    }
  });
};

const validateForm = (values) => {
  const errors = {};
  
  if (!values.name.trim()) {
    errors.name = 'Name is required';
  }
  
  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Email is invalid';
  }
  
  if (values.age && isNaN(values.age)) {
    errors.age = 'Age must be a number';
  }
  
  return errors;
};

const submitForm = async () => {
  const currentForm = store.get(formAtom);
  const errors = validateForm(currentForm.values);
  
  if (Object.keys(errors).length > 0) {
    store.set(formAtom, {
      ...currentForm,
      errors
    });
    return;
  }
  
  // Set submitting state
  store.set(formAtom, {
    ...currentForm,
    isSubmitting: true,
    errors: {}
  });
  
  try {
    // Submit form data
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentForm.values)
    });
    
    // Reset form on success
    store.set(formAtom, {
      values: { name: '', email: '', age: '' },
      errors: {},
      isSubmitting: false
    });
  } catch (error) {
    // Handle submission error
    store.set(formAtom, {
      ...currentForm,
      errors: { submit: 'Failed to submit form' },
      isSubmitting: false
    });
  }
};
```

## React Implementation

```jsx
import { useAtom } from '@nexus-state/react';

function FormExample() {
  const [form, setForm] = useAtom(formAtom);
  
  const handleChange = (e) => {
    updateField(e.target.name, e.target.value);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    submitForm();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Name:</label>
        <input
          type="text"
          name="name"
          value={form.values.name}
          onChange={handleChange}
        />
        {form.errors.name && <span className="error">{form.errors.name}</span>}
      </div>
      
      <div>
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={form.values.email}
          onChange={handleChange}
        />
        {form.errors.email && <span className="error">{form.errors.email}</span>}
      </div>
      
      <div>
        <label>Age:</label>
        <input
          type="number"
          name="age"
          value={form.values.age}
          onChange={handleChange}
        />
        {form.errors.age && <span className="error">{form.errors.age}</span>}
      </div>
      
      {form.errors.submit && <div className="error">{form.errors.submit}</div>}
      
      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

## Async Implementation

```javascript
import { createAsyncOperation } from '@nexus-state/async';

// Create async operation for form submission
const submitFormAsync = createAsyncOperation(async (formData) => {
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  if (!response.ok) {
    throw new Error(`Submission failed: ${response.status}`);
  }
  
  return await response.json();
});

// Enhanced form submission with async operation
const submitFormWithAsync = async () => {
  const currentForm = store.get(formAtom);
  const errors = validateForm(currentForm.values);
  
  if (Object.keys(errors).length > 0) {
    store.set(formAtom, {
      ...currentForm,
      errors
    });
    return;
  }
  
  try {
    // Use async operation for submission
    const result = await submitFormAsync.execute(currentForm.values);
    
    // Reset form on success
    store.set(formAtom, {
      values: { name: '', email: '', age: '' },
      errors: {},
      isSubmitting: false
    });
    
    return result;
  } catch (error) {
    // Handle submission error
    store.set(formAtom, {
      ...currentForm,
      errors: { submit: error.message },
      isSubmitting: false
    });
  }
};
```

## Family Implementation

```javascript
import { createFamily } from '@nexus-state/family';

// Create form state as a family
const formFamily = createFamily({
  values: {
    name: '',
    email: '',
    age: ''
  },
  errors: {},
  isSubmitting: false
});

// Form actions using family
const updateFormField = (field, value) => {
  formFamily.set(`values.${field}`, value);
  
  // Clear error when user starts typing
  if (formFamily.get(`errors.${field}`)) {
    formFamily.set(`errors.${field}`, undefined);
  }
};

const submitFormFamily = async () => {
  const values = formFamily.get('values');
  const errors = validateForm(values);
  
  if (Object.keys(errors).length > 0) {
    formFamily.set('errors', errors);
    return;
  }
  
  // Set submitting state
  formFamily.set('isSubmitting', true);
  formFamily.set('errors', {});
  
  try {
    // Submit form data
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });
    
    // Reset form on success
    formFamily.set('values', { name: '', email: '', age: '' });
    formFamily.set('isSubmitting', false);
  } catch (error) {
    // Handle submission error
    formFamily.set('errors', { submit: 'Failed to submit form' });
    formFamily.set('isSubmitting', false);
  }
};
```

## Immer Implementation

```javascript
import { createImmerStore } from '@nexus-state/immer';

// Create form store with Immer
const formStore = createImmerStore({
  values: {
    name: '',
    email: '',
    age: ''
  },
  errors: {},
  isSubmitting: false
});

// Form actions using Immer
const updateFormFieldImmer = (field, value) => {
  formStore.setState((draft) => {
    draft.values[field] = value;
    
    // Clear error when user starts typing
    if (draft.errors[field]) {
      delete draft.errors[field];
    }
  });
};

const submitFormImmer = async () => {
  const state = formStore.getState();
  const errors = validateForm(state.values);
  
  if (Object.keys(errors).length > 0) {
    formStore.setState((draft) => {
      draft.errors = errors;
    });
    return;
  }
  
  // Set submitting state
  formStore.setState((draft) => {
    draft.isSubmitting = true;
    draft.errors = {};
  });
  
  try {
    // Submit form data
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.values)
    });
    
    // Reset form on success
    formStore.setState((draft) => {
      draft.values = { name: '', email: '', age: '' };
      draft.isSubmitting = false;
    });
  } catch (error) {
    // Handle submission error
    formStore.setState((draft) => {
      draft.errors = { submit: 'Failed to submit form' };
      draft.isSubmitting = false;
    });
  }
};
```