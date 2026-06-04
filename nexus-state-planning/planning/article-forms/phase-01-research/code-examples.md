# Примеры кода для Forms серии

**Дата:** Март 2026  
**Статус:** ✅ Completed

---

## Содержание

1. [Controlled vs Uncontrolled](#01-controlled-vs-uncontrolled)
2. [Validation Patterns](#02-validation-patterns)
3. [Error Handling](#03-error-handling)
4. [Accessibility](#04-accessibility)
5. [Multi-step Forms](#05-multi-step-forms)
6. [Dynamic Forms](#06-dynamic-forms)
7. [Form Arrays](#07-form-arrays)
8. [Cross-field Validation](#08-cross-field-validation)
9. [Async Validation](#09-async-validation)
10. [Form Builder](#10-form-builder)

---

## 01. Controlled vs Uncontrolled

### React Hook Form (Uncontrolled)

```tsx
// src/examples/01-controlled/rhf-uncontrolled.tsx
import { useForm } from 'react-hook-form';

interface FormData {
  name: string;
  email: string;
}

export function RHFUncontrolledForm() {
  const { register, handleSubmit } = useForm<FormData>();
  
  const onSubmit = (data: FormData) => {
    console.log('Submitted:', data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" {...register('name', { required: true })} />
      </div>
      
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" {...register('email', { required: true })} />
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Controlled (React State)

```tsx
// src/examples/01-controlled/controlled.tsx
import { useState } from 'react';

interface FormData {
  name: string;
  email: string;
}

export function ControlledForm() {
  const [values, setValues] = useState<FormData>({ name: '', email: '' });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  const handleChange = (field: keyof FormData, value: string) => {
    setValues({ ...values, [field]: value });
    // Clear error on change
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };
  
  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!values.name) newErrors.name = 'Name required';
    if (!values.email) newErrors.email = 'Email required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      console.log('Submitted:', values);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>
      
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          value={values.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### @nexus-state/form

```tsx
// src/examples/01-controlled/nexus-state-controlled.tsx
import { createFormAtom } from '@nexus-state/form';
import { useAtom } from '@nexus-state/react';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
});

const formAtom = createFormAtom(formSchema, {
  name: '',
  email: '',
});

export function NexusStateControlledForm() {
  const [formState] = useAtom(formAtom);
  const { values, errors, isSubmitting } = formState;
  
  const handleChange = (field: string, value: string) => {
    formAtom.setField(field, value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await formAtom.submit();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>
      
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          value={values.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

---

## 02. Validation Patterns

### Client-side Validation

```tsx
// src/examples/02-validation/client-validation.tsx
import { useForm } from 'react-hook-form';

export function ClientValidationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
  });
  
  const onSubmit = (data: any) => {
    console.log('Submitted:', data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email format',
            },
            minLength: {
              value: 5,
              message: 'Email too short',
            },
            maxLength: {
              value: 50,
              message: 'Email too long',
            },
          })}
        />
        {errors.email && <span className="error">{errors.email.message}</span>}
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Schema Validation (Zod)

```tsx
// src/examples/02-validation/schema-validation.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18 or older').max(120, 'Invalid age'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain number'),
});

type FormData = z.infer<typeof userSchema>;

export function SchemaValidationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userSchema),
    mode: 'onChange',
  });
  
  const onSubmit = (data: FormData) => {
    console.log('Submitted:', data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" {...register('name')} />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </div>
      
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" {...register('email')} />
        {errors.email && <span className="error">{errors.email.message}</span>}
      </div>
      
      <div>
        <label htmlFor="age">Age</label>
        <input id="age" type="number" {...register('age', { valueAsNumber: true })} />
        {errors.age && <span className="error">{errors.age.message}</span>}
      </div>
      
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" {...register('password')} />
        {errors.password && <span className="error">{errors.password.message}</span>}
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### @nexus-state/form Schema Validation

```tsx
// src/examples/02-validation/nexus-schema-validation.tsx
import { createFormAtom } from '@nexus-state/form';
import { useAtom } from '@nexus-state/react';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18 or older').max(120, 'Invalid age'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain number'),
});

const formAtom = createFormAtom(userSchema, {
  name: '',
  email: '',
  age: 0,
  password: '',
});

export function NexusSchemaValidationForm() {
  const [formState] = useAtom(formAtom);
  const { values, errors, isSubmitting } = formState;
  
  const handleChange = (field: string, value: any) => {
    formAtom.setField(field, value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await formAtom.submit();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>
      
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          value={values.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      
      <div>
        <label htmlFor="age">Age</label>
        <input
          id="age"
          type="number"
          value={values.age}
          onChange={(e) => handleChange('age', Number(e.target.value))}
        />
        {errors.age && <span className="error">{errors.age}</span>}
      </div>
      
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={values.password}
          onChange={(e) => handleChange('password', e.target.value)}
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

---

## 03. Error Handling

### Inline Errors

```tsx
// src/examples/03-errors/inline-errors.tsx
import { useForm } from 'react-hook-form';

export function InlineErrorsForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onChange' });
  
  const onSubmit = (data: any) => {
    console.log('Submitted:', data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          {...register('email', { required: 'Email required' })}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : 'email-hint'}
        />
        <span id="email-hint" className="hint">
          We'll never share your email
        </span>
        {errors.email && (
          <span id="email-error" className="error" role="alert">
            {errors.email.message}
          </span>
        )}
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Error Summary

```tsx
// src/examples/03-errors/error-summary.tsx
import { useForm } from 'react-hook-form';

interface Errors {
  name?: string;
  email?: string;
  password?: string;
}

export function ErrorSummaryForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onSubmit' });
  
  const onSubmit = (data: any) => {
    console.log('Submitted:', data);
  };
  
  const errorList = Object.entries(errors).map(([field, error]) => ({
    field,
    message: error?.message as string,
  }));
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errorList.length > 0 && (
        <div className="error-summary" role="alert">
          <h2>Please fix {errorList.length} errors</h2>
          <ul>
            {errorList.map(({ field, message }) => (
              <li key={field}>
                <a href={`#${field}`}>{message}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" {...register('name', { required: 'Name required' })} />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </div>
      
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" {...register('email', { required: 'Email required' })} />
        {errors.email && <span className="error">{errors.email.message}</span>}
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## 04. Accessibility

### Accessible Form

```tsx
// src/examples/04-a11y/accessible-form.tsx
import { useForm } from 'react-hook-form';

export function AccessibleForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onChange' });
  
  const onSubmit = (data: any) => {
    console.log('Submitted:', data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-labelledby="form-title">
      <h2 id="form-title">Contact Information</h2>
      
      <div className="form-field">
        <label htmlFor="name">
          Name <span aria-hidden="true">*</span>
        </label>
        <input
          id="name"
          {...register('name', { required: 'Name required' })}
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <span id="name-error" className="error" role="alert">
            {errors.name.message}
          </span>
        )}
      </div>
      
      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email', {
            required: 'Email required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email format',
            },
          })}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : 'email-hint'}
        />
        <span id="email-hint" className="hint">
          We'll never share your email
        </span>
        {errors.email && (
          <span id="email-error" className="error" role="alert">
            {errors.email.message}
          </span>
        )}
      </div>
      
      <div className="form-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password', {
            required: 'Password required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          })}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : 'password-requirements'}
        />
        <ul id="password-requirements" className="hint">
          <li>At least 8 characters</li>
          <li>One uppercase letter</li>
          <li>One number</li>
        </ul>
        {errors.password && (
          <span id="password-error" className="error" role="alert">
            {errors.password.message}
          </span>
        )}
      </div>
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

---

## 05. Multi-step Forms

### React Hook Form Multi-step

```tsx
// src/examples/05-multi-step/rhf-multi-step.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormData {
  name: string;
  email: string;
  address: string;
  city: string;
  zip: string;
}

export function RHFMultiStepForm() {
  const [step, setStep] = useState(1);
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<FormData>({ mode: 'onChange' });
  
  const onNext = async () => {
    const fields = step === 1 ? ['name', 'email'] : ['address', 'city', 'zip'];
    const isValid = await trigger(fields);
    if (isValid) setStep(step + 1);
  };
  
  const onPrev = () => setStep(step - 1);
  
  const onSubmit = (data: FormData) => {
    console.log('Submitted:', data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="progress">
        Step {step} of 2
      </div>
      
      {step === 1 && (
        <>
          <div>
            <label htmlFor="name">Name</label>
            <input id="name" {...register('name', { required: 'Name required' })} />
            {errors.name && <span className="error">{errors.name.message}</span>}
          </div>
          
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" {...register('email', { required: 'Email required' })} />
            {errors.email && <span className="error">{errors.email.message}</span>}
          </div>
          
          <button type="button" onClick={onNext}>Next</button>
        </>
      )}
      
      {step === 2 && (
        <>
          <div>
            <label htmlFor="address">Address</label>
            <input id="address" {...register('address', { required: 'Address required' })} />
            {errors.address && <span className="error">{errors.address.message}</span>}
          </div>
          
          <div>
            <label htmlFor="city">City</label>
            <input id="city" {...register('city', { required: 'City required' })} />
            {errors.city && <span className="error">{errors.city.message}</span>}
          </div>
          
          <div>
            <label htmlFor="zip">ZIP</label>
            <input id="zip" {...register('zip', { required: 'ZIP required' })} />
            {errors.zip && <span className="error">{errors.zip.message}</span>}
          </div>
          
          <button type="button" onClick={onPrev}>Previous</button>
          <button type="submit">Submit</button>
        </>
      )}
    </form>
  );
}
```

---

## 06. Dynamic Forms

### Conditional Fields

```tsx
// src/examples/06-dynamic/conditional-fields.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

export function DynamicForm() {
  const [showDetails, setShowDetails] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ mode: 'onChange' });
  
  const vehicleType = watch('vehicleType');
  
  useEffect(() => {
    setShowDetails(vehicleType === 'car' || vehicleType === 'motorcycle');
  }, [vehicleType]);
  
  const onSubmit = (data: any) => {
    console.log('Submitted:', data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="vehicleType">Vehicle Type</label>
        <select id="vehicleType" {...register('vehicleType')}>
          <option value="">Select type</option>
          <option value="car">Car</option>
          <option value="boat">Boat</option>
          <option value="motorcycle">Motorcycle</option>
        </select>
      </div>
      
      {showDetails && (
        <div>
          <label htmlFor="wheels">Number of Wheels</label>
          <input
            id="wheels"
            type="number"
            {...register('wheels', {
              required: showDetails ? 'Wheels required' : false,
            })}
          />
          {errors.wheels && <span className="error">{errors.wheels.message}</span>}
        </div>
      )}
      
      {!showDetails && vehicleType === 'boat' && (
        <div>
          <label htmlFor="length">Length (feet)</label>
          <input id="length" type="number" {...register('length')} />
        </div>
      )}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## 07. Form Arrays

### Dynamic Email List

```tsx
// src/examples/07-arrays/dynamic-emails.tsx
import { useForm, useFieldArray } from 'react-hook-form';

interface EmailField {
  value: string;
}

interface FormData {
  emails: EmailField[];
}

export function DynamicEmailsForm() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      emails: [{ value: '' }],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'emails',
  });
  
  const onSubmit = (data: FormData) => {
    console.log('Submitted:', data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        {fields.map((field, index) => (
          <div key={field.id} className="email-field">
            <label htmlFor={`emails.${index}.value`}>
              Email {index + 1}
            </label>
            <input
              id={`emails.${index}.value`}
              {...register(`emails.${index}.value`, {
                required: 'Email required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email',
                },
              })}
            />
            {errors.emails?.[index]?.value && (
              <span className="error">{errors.emails[index]?.value?.message}</span>
            )}
            {fields.length > 1 && (
              <button type="button" onClick={() => remove(index)}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      
      <button type="button" onClick={() => append({ value: '' })}>
        Add Email
      </button>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## 08. Cross-field Validation

### Password Confirmation

```tsx
// src/examples/08-cross-field/password-confirm.tsx
import { useForm } from 'react-hook-form';

interface FormData {
  password: string;
  confirmPassword: string;
}

export function PasswordConfirmForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ mode: 'onChange' });
  
  const password = watch('password');
  
  const onSubmit = (data: FormData) => {
    console.log('Submitted:', data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password', {
            required: 'Password required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          })}
        />
        {errors.password && <span className="error">{errors.password.message}</span>}
      </div>
      
      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) =>
              value === password || 'Passwords do not match',
          })}
        />
        {errors.confirmPassword && (
          <span className="error">{errors.confirmPassword.message}</span>
        )}
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## 09. Async Validation

### Username Availability

```tsx
// src/examples/09-async/username-check.tsx
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';

// Mock API call
const checkUsername = async (username: string): Promise<boolean> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const takenUsernames = ['admin', 'user', 'test'];
  return !takenUsernames.includes(username.toLowerCase());
};

export function UsernameCheckForm() {
  const [isChecking, setIsChecking] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });
  
  const validateUsername = useCallback(async (value: string) => {
    if (!value) return 'Username required';
    if (value.length < 3) return 'Username too short';
    
    setIsChecking(true);
    try {
      const isAvailable = await checkUsername(value);
      return isAvailable || 'Username is taken';
    } finally {
      setIsChecking(false);
    }
  }, []);
  
  const onSubmit = (data: any) => {
    console.log('Submitted:', data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          {...register('username', {
            required: 'Username required',
            minLength: {
              value: 3,
              message: 'Username too short',
            },
            validate: validateUsername,
          })}
        />
        {isChecking && <span className="checking">Checking...</span>}
        {errors.username && (
          <span className="error">{errors.username.message}</span>
        )}
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## 10. Form Builder

### Simple Builder Architecture

```tsx
// src/examples/10-builder/builder-architecture.tsx
import { useState } from 'react';

interface FieldSchema {
  type: 'text' | 'email' | 'number' | 'select';
  name: string;
  label: string;
  required?: boolean;
  options?: string[];
}

interface FormSchema {
  id: string;
  fields: FieldSchema[];
}

// Component Registry
const componentRegistry: Record<string, React.ComponentType<any>> = {
  text: TextField,
  email: EmailField,
  number: NumberField,
  select: SelectField,
};

function TextField({ field, value, onChange, error }: any) {
  return (
    <div>
      <label htmlFor={field.name}>{field.label}</label>
      <input
        id={field.name}
        type="text"
        value={value}
        onChange={(e) => onChange(field.name, e.target.value)}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}

function EmailField({ field, value, onChange, error }: any) {
  return (
    <div>
      <label htmlFor={field.name}>{field.label}</label>
      <input
        id={field.name}
        type="email"
        value={value}
        onChange={(e) => onChange(field.name, e.target.value)}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}

function NumberField({ field, value, onChange, error }: any) {
  return (
    <div>
      <label htmlFor={field.name}>{field.label}</label>
      <input
        id={field.name}
        type="number"
        value={value}
        onChange={(e) => onChange(field.name, Number(e.target.value))}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}

function SelectField({ field, value, onChange, error }: any) {
  return (
    <div>
      <label htmlFor={field.name}>{field.label}</label>
      <select
        id={field.name}
        value={value}
        onChange={(e) => onChange(field.name, e.target.value)}
      >
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <span className="error">{error}</span>}
    </div>
  );
}

// Form Renderer
function FormRenderer({ schema, values, errors, onChange }: any) {
  return (
    <form>
      {schema.fields.map((field) => {
        const Component = componentRegistry[field.type];
        return (
          <Component
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={onChange}
            error={errors[field.name]}
          />
        );
      })}
    </form>
  );
}

// Builder Component
export function FormBuilder() {
  const [schema, setSchema] = useState<FormSchema>({
    id: 'contact-form',
    fields: [
      { type: 'text', name: 'name', label: 'Name', required: true },
      { type: 'email', name: 'email', label: 'Email', required: true },
    ],
  });
  
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleChange = (name: string, value: any) => {
    setValues({ ...values, [name]: value });
  };
  
  return (
    <div className="builder">
      <div className="builder-preview">
        <h3>Preview</h3>
        <FormRenderer
          schema={schema}
          values={values}
          errors={errors}
          onChange={handleChange}
        />
      </div>
      
      <div className="builder-schema">
        <h3>Schema</h3>
        <pre>{JSON.stringify(schema, null, 2)}</pre>
      </div>
    </div>
  );
}
```

---

## 📝 Заметки

- Все примеры готовы для копирования в статью
- Код протестирован на синтаксис
- TypeScript типы включены
- Комментарии добавлены для сложных мест
