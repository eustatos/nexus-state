# @nexus-state/forms - Roadmap

> **Form state management package - Type-safe forms with atomic state**

---

## 📦 Package Overview

**Current Version:** Not yet released  
**Status:** Planning phase  
**Target First Release:** Q3 2026  
**Maintainer:** Nexus State Team  
**Last Updated:** 2026-02-26

### Purpose
Powerful form state management built on Nexus State atoms, providing type-safe forms with validation, field-level control, and excellent DX.

### Dependencies
- `@nexus-state/core`: workspace:*
- Validation libraries: Optional (zod, yup, joi)

---

## 🎯 Vision

### Why Build This?

**Problem:** Existing form libraries:
- Complex API (react-hook-form, Formik)
- Poor TypeScript inference
- Heavy bundle size
- Framework-specific

**Solution:** Nexus Forms
- Simple atom-based API
- Perfect TypeScript inference
- Lightweight (<3KB core)
- Framework-agnostic

### Core Principles
1. **Atomic fields** - Each field is an atom
2. **Type-safe** - Full TypeScript inference
3. **Composable** - Fields, validation, submission
4. **Framework agnostic** - Works with any framework
5. **Granular** - Only re-render changed fields

---

## 🗓️ Roadmap by Version

---

## v0.1.0 - Alpha Release

**Target:** July 31, 2026  
**Focus:** Core form functionality

### Goals
- Field atoms with basic validation
- Form state management
- Type-safe field definitions
- Controlled/uncontrolled modes

### Features

#### 📝 Form Atoms

```typescript
import { formAtom, fieldAtom } from '@nexus-state/forms';

// Define form schema
type LoginForm = {
  email: string;
  password: string;
  rememberMe: boolean;
};

// Create form
const loginForm = formAtom<LoginForm>({
  initialValues: {
    email: '',
    password: '',
    rememberMe: false
  },
  
  // Field-level validation
  validate: {
    email: (value) => {
      if (!value) return 'Email is required';
      if (!value.includes('@')) return 'Invalid email';
    },
    password: (value) => {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be 8+ characters';
    }
  }
});

// Usage in React
function LoginForm() {
  const form = useForm(loginForm);
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input
        {...form.field('email')}
        placeholder="Email"
      />
      {form.errors.email && <span>{form.errors.email}</span>}
      
      <input
        {...form.field('password')}
        type="password"
        placeholder="Password"
      />
      {form.errors.password && <span>{form.errors.password}</span>}
      
      <label>
        <input
          {...form.field('rememberMe')}
          type="checkbox"
        />
        Remember me
      </label>
      
      <button type="submit" disabled={!form.isValid || form.isSubmitting}>
        Login
      </button>
    </form>
  );
}
```

#### 🎯 Individual Field Atoms

```typescript
// Granular control - each field is an atom
const emailField = fieldAtom({
  name: 'email',
  initialValue: '',
  validate: (value) => {
    if (!value.includes('@')) return 'Invalid email';
  }
});

const passwordField = fieldAtom({
  name: 'password',
  initialValue: '',
  validate: (value) => {
    if (value.length < 8) return 'Too short';
  }
});

// Compose into form
const loginForm = formAtom({
  fields: {
    email: emailField,
    password: passwordField
  }
});

// Usage - only re-renders on email change
function EmailInput() {
  const field = useField(emailField);
  return <input {...field} />;
}
```

#### ✅ Form State

```typescript
type FormState<Values> = {
  // Values
  values: Values;
  initialValues: Values;
  
  // Errors
  errors: Partial<Record<keyof Values, string>>;
  
  // Touched
  touched: Partial<Record<keyof Values, boolean>>;
  
  // Dirty
  dirty: Partial<Record<keyof Values, boolean>>;
  isDirty: boolean;
  
  // Validation
  isValid: boolean;
  isValidating: boolean;
  
  // Submission
  isSubmitting: boolean;
  submitCount: number;
  
  // Metadata
  isModified: boolean;
};
```

#### 🔄 Form Methods

```typescript
type FormActions<Values> = {
  // Get/Set
  getValue<K extends keyof Values>(field: K): Values[K];
  setValue<K extends keyof Values>(field: K, value: Values[K]): void;
  setValues(values: Partial<Values>): void;
  
  // Errors
  setError<K extends keyof Values>(field: K, error: string): void;
  clearErrors(): void;
  
  // Touched
  setTouched<K extends keyof Values>(field: K, touched: boolean): void;
  
  // Reset
  reset(): void;
  resetField<K extends keyof Values>(field: K): void;
  
  // Validation
  validate(): Promise<boolean>;
  validateField<K extends keyof Values>(field: K): Promise<boolean>;
  
  // Submission
  handleSubmit(onSubmit: (values: Values) => void | Promise<void>): (e: Event) => void;
};
```

---

## v0.2.0 - Validation & Schema

**Target:** September 30, 2026  
**Focus:** Advanced validation and schema integration

### Features

#### 🎯 Schema Validation

```typescript
import { z } from 'zod';

// Zod schema
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be 8+ characters'),
  rememberMe: z.boolean()
});

// Create form from schema
const loginForm = formAtom({
  schema: loginSchema,
  initialValues: {
    email: '',
    password: '',
    rememberMe: false
  }
});

// TypeScript types inferred from schema!
type LoginFormValues = z.infer<typeof loginSchema>;
```

#### 📋 Validation Strategies

```typescript
const form = formAtom({
  schema: mySchema,
  
  validation: {
    // When to validate
    mode: 'onChange', // or 'onBlur' | 'onSubmit' | 'all'
    
    // Revalidate after submit
    reValidateMode: 'onChange',
    
    // Validate on mount
    validateOnMount: false,
    
    // Debounce validation
    debounce: 300, // ms
    
    // Async validation
    async: true
  }
});
```

#### 🔗 Cross-Field Validation

```typescript
const registrationForm = formAtom({
  initialValues: {
    password: '',
    confirmPassword: ''
  },
  
  // Cross-field validation
  validate: (values) => {
    const errors: any = {};
    
    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords must match';
    }
    
    return errors;
  }
});
```

#### ⏱️ Async Validation

```typescript
const usernameField = fieldAtom({
  name: 'username',
  initialValue: '',
  
  // Async validation
  validate: async (value) => {
    if (!value) return 'Username is required';
    
    // Check if username exists
    const available = await checkUsernameAvailable(value);
    if (!available) {
      return 'Username already taken';
    }
  },
  
  // Debounce async validation
  validateDebounce: 500
});

// Shows validation state
function UsernameInput() {
  const field = useField(usernameField);
  
  return (
    <div>
      <input {...field.input} />
      {field.isValidating && <Spinner />}
      {field.error && <span>{field.error}</span>}
    </div>
  );
}
```

---

## v1.0.0 - Production Ready

**Target:** December 31, 2026  
**Focus:** Enterprise features and integrations

### Features

#### 🎨 Field Arrays

```typescript
const todoForm = formAtom({
  initialValues: {
    todos: [
      { id: 1, text: 'Buy milk', done: false }
    ]
  }
});

// Field array helpers
function TodoList() {
  const todos = useFieldArray(todoForm, 'todos');
  
  return (
    <div>
      {todos.fields.map((field, index) => (
        <div key={field.id}>
          <input {...todos.field(index, 'text')} />
          <input {...todos.field(index, 'done')} type="checkbox" />
          <button onClick={() => todos.remove(index)}>Remove</button>
        </div>
      ))}
      
      <button onClick={() => todos.append({ text: '', done: false })}>
        Add Todo
      </button>
    </div>
  );
}
```

#### 🏗️ Nested Forms

```typescript
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zip: z.string()
});

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  address: addressSchema,
  billingAddress: addressSchema
});

const userForm = formAtom({
  schema: userSchema,
  initialValues: {
    name: '',
    email: '',
    address: { street: '', city: '', zip: '' },
    billingAddress: { street: '', city: '', zip: '' }
  }
});

// Nested field access
function AddressFields({ prefix }: { prefix: 'address' | 'billingAddress' }) {
  const form = useForm(userForm);
  
  return (
    <div>
      <input {...form.field(`${prefix}.street`)} placeholder="Street" />
      <input {...form.field(`${prefix}.city`)} placeholder="City" />
      <input {...form.field(`${prefix}.zip`)} placeholder="ZIP" />
    </div>
  );
}
```

#### 🎯 Conditional Fields

```typescript
const paymentForm = formAtom({
  initialValues: {
    paymentMethod: 'card' as 'card' | 'paypal',
    cardNumber: '',
    paypalEmail: ''
  },
  
  // Conditional validation
  validate: (values) => {
    const errors: any = {};
    
    if (values.paymentMethod === 'card' && !values.cardNumber) {
      errors.cardNumber = 'Card number required';
    }
    
    if (values.paymentMethod === 'paypal' && !values.paypalEmail) {
      errors.paypalEmail = 'PayPal email required';
    }
    
    return errors;
  }
});

// Conditional rendering
function PaymentForm() {
  const form = useForm(paymentForm);
  const paymentMethod = form.values.paymentMethod;
  
  return (
    <div>
      <select {...form.field('paymentMethod')}>
        <option value="card">Credit Card</option>
        <option value="paypal">PayPal</option>
      </select>
      
      {paymentMethod === 'card' && (
        <input {...form.field('cardNumber')} placeholder="Card Number" />
      )}
      
      {paymentMethod === 'paypal' && (
        <input {...form.field('paypalEmail')} placeholder="PayPal Email" />
      )}
    </div>
  );
}
```

#### 📤 Submission Handling

```typescript
const form = formAtom({
  initialValues: { /* ... */ },
  
  onSubmit: async (values, helpers) => {
    try {
      await api.submitForm(values);
      helpers.reset();
      toast.success('Form submitted!');
    } catch (error) {
      helpers.setErrors({
        _form: 'Submission failed'
      });
    }
  },
  
  // Transform before submit
  transformBeforeSubmit: (values) => ({
    ...values,
    date: values.date.toISOString()
  })
});
```

#### 🔄 Auto-save

```typescript
const draftForm = formAtom({
  initialValues: { /* ... */ },
  
  // Auto-save to localStorage
  autoSave: {
    enabled: true,
    storage: 'localStorage',
    key: 'draft-form',
    debounce: 1000, // Save after 1s of inactivity
    
    onSave: (values) => {
      console.log('Draft saved', values);
    },
    
    onRestore: (values) => {
      console.log('Draft restored', values);
    }
  }
});
```

---

## v1.1.0 - Advanced Features

**Target:** Q1 2027  
**Focus:** DX improvements and integrations

### Features

#### 🎨 Form Wizard (Multi-Step)

```typescript
const wizardForm = wizardFormAtom({
  steps: [
    {
      name: 'personal',
      schema: z.object({
        firstName: z.string(),
        lastName: z.string()
      })
    },
    {
      name: 'contact',
      schema: z.object({
        email: z.string().email(),
        phone: z.string()
      })
    },
    {
      name: 'review',
      schema: z.object({
        terms: z.boolean().refine(v => v === true)
      })
    }
  ],
  
  initialValues: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    terms: false
  }
});

function Wizard() {
  const wizard = useWizard(wizardForm);
  
  return (
    <div>
      {wizard.currentStep === 'personal' && <PersonalStep />}
      {wizard.currentStep === 'contact' && <ContactStep />}
      {wizard.currentStep === 'review' && <ReviewStep />}
      
      <div>
        <button 
          onClick={wizard.previous} 
          disabled={wizard.isFirstStep}
        >
          Previous
        </button>
        
        <button 
          onClick={wizard.next}
          disabled={!wizard.currentStepValid}
        >
          {wizard.isLastStep ? 'Submit' : 'Next'}
        </button>
      </div>
      
      <Progress value={wizard.progress} />
    </div>
  );
}
```

#### 🎯 Form Context & Dependencies

```typescript
// Form depends on other atoms
const userAtom = atom<User | null>(null);

const profileForm = formAtom({
  initialValues: (get) => {
    const user = get(userAtom);
    return {
      name: user?.name ?? '',
      email: user?.email ?? '',
      bio: user?.bio ?? ''
    };
  },
  
  // Re-initialize when user changes
  reinitializeOnChange: [userAtom]
});
```

#### 🔌 Third-Party Integrations

```typescript
// React Hook Form adapter
import { toReactHookForm } from '@nexus-state/forms/react-hook-form';

const rhfForm = toReactHookForm(nexusForm);
// Use with react-hook-form APIs

// Formik adapter
import { toFormik } from '@nexus-state/forms/formik';

const formikForm = toFormik(nexusForm);
// Use with Formik APIs
```

---

## v2.0.0 - Next Generation

**Target:** Q3 2027  
**Status:** Vision / Exploration

### Potential Features

#### 🤖 AI-Powered Forms

```typescript
const smartForm = formAtom({
  initialValues: { /* ... */ },
  
  ai: {
    // Auto-complete suggestions
    autoComplete: true,
    
    // Smart validation messages
    smartErrors: true,
    
    // Predict user intent
    predictIntent: true
  }
});

// AI suggests:
// - Email format corrections
// - Address auto-complete
// - Phone number formatting
// - Field pre-fill based on context
```

#### 📊 Form Analytics

```typescript
const form = formAtom({
  initialValues: { /* ... */ },
  
  analytics: {
    trackFocus: true,
    trackChanges: true,
    trackErrors: true,
    trackSubmission: true,
    
    onAnalytics: (event) => {
      // Send to analytics service
      analytics.track(event);
    }
  }
});

// Analytics events:
// - Field focus time
// - Validation errors
// - Submission attempts
// - Drop-off points
```

---

## 🚫 Non-Goals

### Will NOT Support
- ❌ Visual form builder (separate tool)
- ❌ Backend validation (client-side only)
- ❌ File uploads (use separate library)
- ❌ Rich text editors (use separate library)

### Design Principles
1. **Atoms first** - Fields are atoms
2. **Type-safe** - Perfect TypeScript inference
3. **Granular** - Only re-render changed fields
4. **Composable** - Mix and match primitives
5. **Framework agnostic** - Works everywhere

---

## 📊 Success Metrics

### Quality Gates

#### v1.0.0
- [ ] <3KB bundle size (core)
- [ ] 95%+ test coverage
- [ ] Full TypeScript support
- [ ] Zero re-render overhead
- [ ] Comprehensive documentation

#### v1.5.0
- [ ] <2.5KB bundle size
- [ ] Form wizard support
- [ ] Field arrays working
- [ ] Schema validation (zod, yup, joi)

#### v2.0.0
- [ ] AI-powered features
- [ ] Form analytics
- [ ] 99%+ test coverage

---

## 🎯 Comparison with Alternatives

| Feature | Nexus Forms | React Hook Form | Formik | Final Form |
|---------|-------------|-----------------|--------|------------|
| Framework Agnostic | ✅ | ❌ | ❌ | ❌ |
| Atomic Fields | ✅ | ❌ | ❌ | ❌ |
| Bundle Size | ~3KB | ~9KB | ~13KB | ~5KB |
| TypeScript | ✅ | ✅ | ✅ | ✅ |
| Schema Validation | ✅ | ✅ | ✅ | ❌ |
| Field Arrays | ✅ | ✅ | ✅ | ✅ |

---

**Roadmap Owner:** Forms Team  
**Review Cadence:** Monthly  
**Next Review:** 2026-07-01
