# Forms

Handling form state and validation with Nexus State.

## Basic Form Pattern

```javascript
import { atom, createStore } from '@nexus-state/core';

// Form state atoms
const formValuesAtom = atom({
  name: '',
  email: '',
  age: ''
});

const formErrorsAtom = atom({});
const isSubmittingAtom = atom(false);

const store = createStore();

// Form actions
const updateField = (field, value) => {
  const currentValues = store.get(formValuesAtom);
  store.set(formValuesAtom, {
    ...currentValues,
    [field]: value
  });
  
  // Clear error for this field when user starts typing
  const currentErrors = store.get(formErrorsAtom);
  if (currentErrors[field]) {
    store.set(formErrorsAtom, {
      ...currentErrors,
      [field]: undefined
    });
  }
};

const validateField = (field, value) => {
  const errors = {};
  
  if (field === 'name' && !value.trim()) {
    errors.name = 'Name is required';
  }
  
  if (field === 'email') {
    if (!value.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      errors.email = 'Email is invalid';
    }
  }
  
  if (field === 'age') {
    if (value && isNaN(value)) {
      errors.age = 'Age must be a number';
    } else if (value && (parseInt(value) < 0 || parseInt(value) > 150)) {
      errors.age = 'Age must be between 0 and 150';
    }
  }
  
  return errors;
};

const validateForm = (values) => {
  const errors = {};
  
  Object.keys(values).forEach(field => {
    const fieldErrors = validateField(field, values[field]);
    Object.assign(errors, fieldErrors);
  });
  
  return errors;
};

const submitForm = async () => {
  const values = store.get(formValuesAtom);
  const errors = validateForm(values);
  
  if (Object.keys(errors).length > 0) {
    store.set(formErrorsAtom, errors);
    return;
  }
  
  store.set(isSubmittingAtom, true);
  
  try {
    // Submit form data
    await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });
    
    // Reset form on success
    store.set(formValuesAtom, { name: '', email: '', age: '' });
    store.set(formErrorsAtom, {});
  } catch (error) {
    store.set(formErrorsAtom, { submit: 'Failed to submit form' });
  } finally {
    store.set(isSubmittingAtom, false);
  }
};
```

## React Implementation

```jsx
import { useAtom } from '@nexus-state/react';

function FormComponent() {
  const [values, setValues] = useAtom(formValuesAtom);
  const [errors] = useAtom(formErrorsAtom);
  const [isSubmitting] = useAtom(isSubmittingAtom);
  
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
          value={values.name}
          onChange={handleChange}
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>
      
      <div>
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={values.email}
          onChange={handleChange}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      
      <div>
        <label>Age:</label>
        <input
          type="number"
          name="age"
          value={values.age}
          onChange={handleChange}
        />
        {errors.age && <span className="error">{errors.age}</span>}
      </div>
      
      {errors.submit && <div className="error">{errors.submit}</div>}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

## Advanced Form Features

### Field Arrays

```javascript
import { atom, createStore } from '@nexus-state/core';

const formAtom = atom({
  users: [
    { id: 1, name: '', email: '' }
  ]
});

const store = createStore();

const addUser = () => {
  const currentForm = store.get(formAtom);
  const newUser = {
    id: Date.now(),
    name: '',
    email: ''
  };
  
  store.set(formAtom, {
    ...currentForm,
    users: [...currentForm.users, newUser]
  });
};

const removeUser = (userId) => {
  const currentForm = store.get(formAtom);
  store.set(formAtom, {
    ...currentForm,
    users: currentForm.users.filter(user => user.id !== userId)
  });
};

const updateUser = (userId, field, value) => {
  const currentForm = store.get(formAtom);
  store.set(formAtom, {
    ...currentForm,
    users: currentForm.users.map(user =>
      user.id === userId
        ? { ...user, [field]: value }
        : user
    )
  });
};
```