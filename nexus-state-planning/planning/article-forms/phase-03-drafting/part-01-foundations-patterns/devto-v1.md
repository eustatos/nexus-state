---
title: 'React Forms Deep Dive: Part 1 — Foundations & Core Patterns'
description: 'React forms deep dive: Controlled vs Uncontrolled, validation strategies, and architecture patterns with TypeScript. Part 1 of 6.'
tags: react, forms, typescript, webdev
series: 'React Forms Deep Dive'
canonical_url: https://dev.to/eustatos/react-forms-deep-dive-part-1-foundations-core-patterns
published:
---

> 💡 **Transparency Note**  
> This series includes examples from `@nexus-state/form`, a library I maintain. I include it to demonstrate an atom-based architectural approach, but I recommend evaluating all tools based on your specific project needs. All patterns shown are framework-agnostic and applicable to any solution.

> 🎓 **What you'll learn in this part:**
>
> - The fundamental tradeoffs between Controlled and Uncontrolled components
> - When to use client-side vs. server-side validation (and how to combine them)
> - Why schema-based validation beats imperative code
> - How to choose a form library based on architectural needs, not trends

> 🧪 **Try it yourself:**  
> [Open StackBlitz Demo](https://stackblitz.com/edit/vitejs-vite-nqzdkeqr)

> 🔗 **Series Roadmap:**
>
> | Part  | Topic                                | Status                        |
> | ----- | ------------------------------------ | ----------------------------- |
> | **1** | Foundations & Core Patterns          | ✅ Published ← _you are here_ |
> | **2** | UX, Accessibility & Performance      | 🚧 In Progress                |
> | **3** | Multi-step, Dynamic & Array Patterns | 📅 Planned                    |
> | **4** | Async Validation & Persistence       | 📅 Planned                    |
> | **5** | Building a Visual Form Builder       | 📅 Planned                    |
> | **6** | Creating a Validation DSL (Finale)   | 📅 Planned                    |
>
> 💡 _New parts published weekly. [Follow @eustatos](https://dev.to/eustatos) to get notified!_

## Introduction

If you've ever worked with forms in React, you know they can be surprisingly complex. Forms sit at the intersection of three types of state:

- **UI state** — what the user sees and interacts with
- **Server state** — data to send/receive from the backend
- **Validation state** — rules, errors, and async checks

Add edge cases (async validation, cross-field dependencies, multi-step flows), UX requirements (accessibility, performance, error feedback), and you have one of the most challenging aspects of frontend development.

In this 6-part series, we'll go from foundational concepts to production-ready patterns for building forms in React:

1. **Foundations & Core Patterns** ← you are here
2. UX, Accessibility & Performance
3. Advanced Patterns: Multi-step, Dynamic, Arrays
4. Validation Deep Dive: Async, Cross-field, Persistence
5. Building a Visual Form Builder
6. Creating a Validation DSL (Series Finale)

In this first part, we'll establish the mental models you need: Controlled vs. Uncontrolled components, validation strategies, schema-based approaches, and how to think about library selection.

## 1. Controlled vs. Uncontrolled: The First Decision

The first fundamental choice when building forms in React: should your component be **Controlled** or **Uncontrolled**?

### Controlled Components

In the Controlled approach, React state is the single source of truth for form values:

```tsx
import { useState } from 'react';

function ControlledEmailInput() {
  const [email, setEmail] = useState('');

  return (
    <input
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      aria-label="Email address"
    />
  );
}
```

**How it works:**

1. User types a character
2. `onChange` fires
3. State updates via `setEmail`
4. React re-renders the component
5. Input receives the new value from state

**✅ Advantages:**

- Full control over the value at all times
- Instant validation and formatting
- Easy to implement dependent fields (e.g., password confirmation)
- Ideal for Time Travel debugging and state inspection
- Predictable data flow

**❌ Tradeoffs:**

- Re-renders on every keystroke
- More boilerplate for simple cases
- Can impact performance in large forms (50+ fields)

### Uncontrolled Components

In the Uncontrolled approach, the DOM is the source of truth:

```tsx
import { useRef } from 'react';

function UncontrolledEmailInput() {
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const value = emailRef.current?.value;
    console.log('Submitted:', value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={emailRef} defaultValue="" aria-label="Email address" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

**How it works:**

1. User types a character
2. Value is stored in the DOM
3. React does not re-render
4. Access the value via `ref` when needed (e.g., on submit)

**✅ Advantages:**

- Minimal re-renders → better performance for large forms
- Less boilerplate for simple use cases
- Easier integration with non-React libraries
- Native browser features (autocomplete, spellcheck) work seamlessly

**❌ Tradeoffs:**

- No instant validation or formatting
- Harder to implement dependent field logic
- More complex for Time Travel debugging
- Values must be read imperatively

## 📊 Comparison at a Glance

| Criterion                 | Controlled         | Uncontrolled        |
| ------------------------- | ------------------ | ------------------- |
| Source of truth           | React state        | DOM                 |
| Re-renders                | On every change    | Minimal             |
| Validation timing         | Instant (onChange) | Typically on submit |
| Time Travel debugging     | ✅ Easy            | ❌ Complex          |
| Boilerplate               | Higher             | Lower               |
| Performance (large forms) | Lower              | Higher              |
| Input formatting          | ✅ Easy            | ❌ Manual           |

### When to Use Which

**Choose Controlled when:**

- You need instant validation or formatting (masks, uppercase, etc.)
- Fields depend on each other (e.g., "Confirm Password")
- You want Time Travel debugging or state inspection
- The form is small to medium (< 20 fields)
- You're building a highly interactive UI

**Choose Uncontrolled when:**

- Performance is critical and the form is large (50+ fields)
- You're integrating with non-React code or third-party widgets
- Validation happens only on submit
- You're working with file inputs (always uncontrolled)
- You prefer minimal re-renders and simpler code

> 💡 **Key takeaway:** There's no universally "correct" choice. Controlled components give you power and predictability; Uncontrolled components give you performance and simplicity. Many production forms use a hybrid approach.

## 2. Validation Strategies: Client, Server, and Hybrid

Validation is one of the most critical aspects of form development. There are three primary approaches:

### Client-Side Validation

Validation that runs in the browser before data is sent to the server.

```tsx
function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return null;
}

function EmailField() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    setEmail(value);
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Invalid email format');
    } else {
      setError(null);
    }
  };

  return (
    <div>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => handleChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? 'email-error' : undefined}
      />
      {error && (
        <span id="email-error" className="error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
```

**✅ Pros:**

- Instant feedback → better UX
- Reduces unnecessary server requests
- Works offline
- Lowers server load

**❌ Cons:**

- Can be bypassed via DevTools → never trust client validation alone
- Logic duplication between client and server
- Increases bundle size if validation rules are complex

### Server-Side Validation

Validation that runs on the backend after form submission.

```tsx
async function submitForm(data: FormData) {
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errors = await response.json();
      return { success: false, errors };
    }

    return { success: true };
  } catch (err) {
    return { success: false, errors: { form: 'Network error' } };
  }
}
```

**✅ Pros:**

- Single source of truth → cannot be bypassed
- Access to database (e.g., check email uniqueness)
- Enforces business rules and security policies
- Centralized logic → easier to maintain

**❌ Cons:**

- Network latency → slower feedback
- Server load increases with validation complexity
- Doesn't work offline
- Poor UX if errors are only shown after submit

### Hybrid Validation: The Best Practice

Combine client and server validation for optimal UX and security.

**Strategy:**

1. **Client:** Format, length, required fields → instant feedback
2. **Server:** Uniqueness, business rules, security → authoritative check

```tsx
function HybridEmailValidation() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateFormat = (value: string): string | null => {
    if (!value) return 'Email is required';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value) ? null : 'Invalid email format';
  };

  const checkUniqueness = async (value: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      const data = await response.json();
      return data.available ? null : 'Email already registered';
    } catch {
      return 'Unable to verify email';
    }
  };

  const handleBlur = async () => {
    const formatError = validateFormat(email);
    if (formatError) {
      setError(formatError);
      return;
    }

    setIsValidating(true);
    const serverError = await checkUniqueness(email);
    setError(serverError);
    setIsValidating(false);
  };

  return (
    <div>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={handleBlur}
        aria-invalid={!!error}
        aria-describedby={error ? 'email-error' : undefined}
      />
      {isValidating && <span aria-live="polite">Checking...</span>}
      {error && (
        <span id="email-error" className="error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
```

**Timing Strategy:**

| Trigger    | Client Validation          | Server Validation              |
| ---------- | -------------------------- | ------------------------------ |
| `onChange` | ✅ Format hints (optional) | ❌ Too frequent                |
| `onBlur`   | ✅ Final format check      | ✅ Uniqueness / business rules |
| `onSubmit` | ✅ Full client check       | ✅ Final authoritative check   |

> 💡 **Key takeaway:** Hybrid validation = best of both worlds. Use client-side for instant UX feedback, server-side for security and data integrity. Always validate on the server—client validation is a convenience, not a guarantee.

## 3. Schema-Based Validation: Declarative Over Imperative

Imperative validation (writing `if` statements for each field) quickly becomes unmaintainable. Schema-based validation solves this by describing rules declaratively.

## The Problem with Imperative Validation

```tsx
// ❌ Hard to maintain, no type safety, repetitive
function validateUser(user: User): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!user.name || user.name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.email = 'Invalid email format';
  }

  if (!user.age || user.age < 18) {
    errors.age = 'Must be 18 or older';
  }

  return errors;
}
```

**Problems:**

- Repetitive boilerplate
- No type safety between validation and data structures
- Hard to reuse rules across forms
- Difficult to test in isolation

## The Solution: Declarative Schemas

Describe validation rules once, infer TypeScript types automatically, and reuse across client/server.

### Zod Example

```tsx
import { z } from 'zod';

const userSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long'),

  email: z.string().email('Please enter a valid email address'),

  age: z
    .number()
    .min(18, 'Must be 18 or older')
    .max(120, 'Please enter a valid age'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
});

// Automatically infer TypeScript type
type UserInput = z.infer<typeof userSchema>;

// Use the schema
const result = userSchema.safeParse(formData);
if (!result.success) {
  console.log(result.error.errors);
}
```

### Yup Example

```tsx
import * as yup from 'yup';

const userSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),

  email: yup
    .string()
    .email('Invalid email format')
    .required('Email is required'),

  age: yup.number().min(18, 'Must be 18 or older').required('Age is required'),
});

// Usage
try {
  await userSchema.validate(formData, { abortEarly: false });
} catch (error) {
  console.log(error.errors);
}
```

### Why Schema-Based Validation Wins

| Benefit             | Description                                         |
| ------------------- | --------------------------------------------------- |
| **Type Safety**     | TypeScript types inferred automatically from schema |
| **Reusability**     | One schema for client + server validation           |
| **Composition**     | Combine and extend schemas easily                   |
| **Maintainability** | Rules are declarative, easy to read and update      |
| **Testing**         | Validate schema logic in isolation from UI          |
| **Error Messages**  | Centralized, customizable, localizable              |

> 💡 **Key takeaway:** Schema-based validation is the modern standard for production forms. It reduces bugs, improves DX, and scales with your application.

## 4. Implementation Strategies: Choosing the Right Tool

There's no single "best" form library. The right choice depends on your project's requirements, team experience, and architectural priorities.

Rather than ranking libraries, let's compare **architectural approaches** they represent:

### Approach 1: Controlled State (Formik-style)

**Philosophy:** "Keep it simple, use React patterns you already know."

```tsx
// Conceptual example
function SimpleForm() {
  const [values, setValues] = useState({ email: '', password: '' });

  const handleChange = (field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form>
      <input
        value={values.email}
        onChange={(e) => handleChange('email', e.target.value)}
      />
    </form>
  );
}
```

**✅ Best for:**

- Simple forms with straightforward logic
- Teams new to React or form libraries
- Projects where bundle size isn't critical

**❌ Considerations:**

- Re-renders on every field change
- More boilerplate for complex validation

### Approach 2: Uncontrolled + Refs (React Hook Form-style)

**Philosophy:** "Minimize re-renders, maximize performance."

```tsx
// Conceptual example
import { useForm } from 'react-hook-form';

function PerformantForm() {
  const { register, handleSubmit } = useForm();

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email', { required: true })} />
    </form>
  );
}
```

**✅ Best for:**

- Large forms (20+ fields) where performance matters
- Projects prioritizing minimal bundle size
- Teams comfortable with refs and uncontrolled patterns

**❌ Considerations:**

- Slightly steeper learning curve
- Less intuitive for Time Travel debugging

### Approach 3: Atom-Based State (Experimental / Advanced)

**Philosophy:** "Fine-grained reactivity + built-in debugging."

```tsx
// Conceptual example (atom-based architecture)
import { createFormAtom } from '@nexus-state/form';

const formAtom = createFormAtom(schema, { email: '', password: '' });

function AtomForm() {
  const [emailValue] = useAtom(formAtom.fields.email);

  return (
    <input
      value={emailValue}
      onChange={(e) => formAtom.setField('email', e.target.value)}
    />
  );
}
```

**✅ Best for:**

- Complex forms needing deep state inspection
- Projects already using atom-based state management
- Teams building tooling (Form Builders, DevTools, etc.)

**❌ Considerations:**

- Smaller ecosystem, evolving API (pre-v1.0)
- Requires understanding of atomic state concepts

### Quick Comparison

| Aspect                | Controlled              | Uncontrolled | Atom-Based             |
| --------------------- | ----------------------- | ------------ | ---------------------- |
| **Re-renders**        | On every change         | Minimal      | Per-field only         |
| **Learning curve**    | Low                     | Medium       | Medium-High            |
| **Bundle size**       | ~15KB                   | ~7KB         | ~8KB (core)            |
| **Debugging**         | Standard React DevTools | Standard     | Time Travel + DevTools |
| **Ecosystem**         | Mature                  | Large        | Emerging               |
| **Framework support** | React                   | React        | React/Vue/Svelte       |

> 💡 **Key takeaway:** Don't choose a library because it's popular. Choose an architectural approach that matches your needs:
>
> - Need simplicity? → Controlled
> - Need performance? → Uncontrolled
> - Need deep state inspection? → Atom-based

## 5. Decision Guide: How to Choose

Use this framework to evaluate form solutions for your project.

### By Project Requirements

| Requirement                        | Recommended Approach          |
| ---------------------------------- | ----------------------------- |
| Simple login/contact form          | Controlled (minimal setup)    |
| Large data-entry form (50+ fields) | Uncontrolled (performance)    |
| Complex multi-step wizard          | Either + state management     |
| Need Time Travel debugging         | Atom-based or custom solution |
| Framework-agnostic code            | Uncontrolled or atom-based    |
| Maximum bundle size constraints    | Uncontrolled (~7KB)           |

### By Team Experience

| Team Profile             | Recommendation                              |
| ------------------------ | ------------------------------------------- |
| React beginners          | Controlled approach (familiar patterns)     |
| Intermediate React devs  | React Hook Form (balance of power + DX)     |
| Advanced / tooling teams | Evaluate atom-based or build custom         |
| Large team (10+ devs)    | Mature library with strong docs + community |

### By Validation Complexity

| Validation Need            | Strategy                             |
| -------------------------- | ------------------------------------ |
| Format + required only     | Client-side schema (Zod/Yup)         |
| Uniqueness checks          | Hybrid: client format + server async |
| Cross-field rules          | Schema `refine()` + `watch()`        |
| Business rules + DB access | Server-side authoritative validation |

### Production Checklist for Part 1

Before moving to advanced patterns, ensure your foundation includes:

- [ ] Controlled vs. Uncontrolled decision documented
- [ ] Hybrid validation strategy (client + server)
- [ ] Schema-based validation (Zod or Yup)
- [ ] Accessibility attributes (`aria-invalid`, `aria-describedby`)
- [ ] Error timing: validate on blur, not every keystroke
- [ ] TypeScript types inferred from validation schema
- [ ] Library choice justified by project needs, not trends

## Conclusion & What's Next

### Key Takeaways from Part 1

1. **Controlled vs. Uncontrolled** isn't about "right vs. wrong"—it's about tradeoffs. Controlled gives you power; Uncontrolled gives you performance.

2. **Hybrid validation** is the production standard: client-side for instant UX, server-side for security and data integrity.

3. **Schema-based validation** (Zod, Yup) reduces bugs, improves type safety, and scales better than imperative `if` statements.

4. **Library selection** should be driven by architectural needs, not popularity. Evaluate approaches, not just brands.

5. **Accessibility and UX** start at the foundation—`aria-invalid`, proper error timing, and keyboard navigation aren't "nice-to-haves."

### Coming Up in the Series

We've laid the groundwork. Next, we'll build on these foundations:

**Part 2: UX, Accessibility & Performance**  
→ Error handling patterns, WAI-ARIA deep dive, keyboard navigation, performance optimization checklist

**Part 3: Advanced Patterns I**  
→ Multi-step forms (wizards), dynamic/conditional fields, form arrays (repeatable groups)

**Part 4: Validation Deep Dive**  
→ Cross-field validation, async validation with debouncing, form persistence, TanStack Query integration

**Part 5: Building a Form Builder**  
→ Schema-driven architecture, drag-and-drop UI, component registry, export to code

**Part 6: Creating a Validation DSL**  
→ Designing a domain-specific language for validation rules, parser implementation, real-world examples

## Resources & Further Reading

### Documentation

- [React Forms Guide](https://react.dev/learn/forms)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/) • [Yup](https://github.com/jquense/yup)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Tools

- [StackBlitz Demo](https://stackblitz.com/edit/vitejs-vite-nqzdkeqr) — Interactive playground
- [axe-core](https://github.com/dequelabs/axe-core) — Accessibility testing
- [React DevTools Profiler](https://react.dev/learn/react-devtools) — Performance debugging

> 💬 **Feedback welcome!**  
> Found an error? Have a suggestion? Open an issue on [GitHub](https://github.com/eustatos/nexus-state/issues) or leave a comment below. Let's build better forms together.
