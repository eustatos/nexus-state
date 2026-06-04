# DSL Plugin Example

## Установка

DSL плагин встроен в `@nexus-state/form` и не требует дополнительной установки.

```bash
npm install @nexus-state/form
```

## Базовый пример

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import { required, minLength, email } from '@nexus-state/form-schema-dsl';

const store = createStore();

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    username: [required, minLength(3)],
    email: [required, email()],
    password: [required, minLength(8)],
  },
  initialValues: {
    username: '',
    email: '',
    password: '',
  },
  validateOnChange: true,
  validateOnBlur: true,
});

// Access fields
const usernameField = form.field('username');
const emailField = form.field('email');

// Set values
usernameField.setValue('john_doe');
emailField.setValue('john@example.com');

// Validate entire form
const isValid = await form.validate();
console.log('Form is valid:', isValid);
console.log('Errors:', form.errors);
```

## Встроенные валидаторы

### Строковые валидаторы

```typescript
import {
  required,
  minLength,
  maxLength,
  lengthRange,
  length,
  pattern,
  email,
  url,
  phone,
} from '@nexus-state/form-schema-dsl';

const schema = {
  username: [required, minLength(3), maxLength(20)],
  email: [required, email()],
  website: [url()],
  phone: [phone()],
  bio: [maxLength(500)],
  code: [length(6)],
  zipCode: [pattern(/^\d{5}(-\d{4})?$/)],
};
```

### Числовые валидаторы

```typescript
import {
  minValue,
  maxValue,
  valueRange,
  positive,
  negative,
  integer,
} from '@nexus-state/form-schema-dsl';

const schema = {
  age: [minValue(18), maxValue(120)],
  price: [minValue(0), positive()],
  discount: [valueRange(0, 100)],
  quantity: [integer(), minValue(1)],
  balance: [negative()],
};
```

### Валидаторы сравнения

```typescript
import {
  equalTo,
  notEqualTo,
  oneOf,
  notOneOf,
  matchesField,
} from '@nexus-state/form-schema-dsl';

const schema = {
  status: [oneOf(['active', 'inactive', 'pending'])],
  role: [notOneOf(['banned'])],
  confirm: [equalTo('yes', 'Must confirm')],
  passwordConfirm: [matchesField('password', 'Passwords do not match')],
};
```

### Валидаторы массивов

```typescript
import { arrayLength } from '@nexus-state/form-schema-dsl';

const schema = {
  tags: [arrayLength(1, 10)],
  items: [arrayLength(1)],
};
```

## Кастомные валидаторы

```typescript
import { custom } from '@nexus-state/form-schema-dsl';

const schema = {
  username: [
    custom(
      (value) => {
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          return 'Username can only contain letters, numbers, and underscores';
        }
        return null;
      },
      'Invalid username',
      'invalid_username'
    ),
  ],
};
```

## Асинхронные валидаторы

```typescript
import { unique, asyncCustom } from '@nexus-state/form-schema-dsl';

const schema = {
  username: [
    required,
    minLength(3),
    unique('https://api.example.com/check-username', 'Username is already taken'),
  ],
  email: [
    required,
    email(),
    asyncCustom(async (value) => {
      const response = await fetch(`/api/check-email?email=${value}`);
      const data = await response.json();
      return data.registered ? 'Email is already registered' : null;
    }),
  ],
};
```

## Утилиты для async валидации

```typescript
import { withDebounce, withRetry, withTimeout, withOptions } from '@nexus-state/form-schema-dsl';

// Debounce
const debouncedValidator = withDebounce(asyncValidator, 300);

// Retry
const retriedValidator = withRetry(asyncValidator, 3, 1000);

// Timeout
const timeoutValidator = withTimeout(asyncValidator, 5000);

// All options
const optionsValidator = withOptions(asyncValidator, {
  debounce: 300,
  retry: 3,
  timeout: 5000,
  cache: true,
  cacheTTL: 5 * 60 * 1000,
});
```

## Условная валидация

```typescript
import { conditional, required } from '@nexus-state/form-schema-dsl';

const schema = {
  employmentType: [required],
  company: [
    conditional(
      (value, allValues) => allValues?.employmentType === 'employed',
      [required]
    ),
  ],
  income: [
    conditional(
      (value, allValues) => 
        allValues?.employmentType === 'employed' || 
        allValues?.employmentType === 'self-employed',
      [required, minValue(0)]
    ),
  ],
};
```

## Валидация нескольких полей

```typescript
import { matchesField } from '@nexus-state/form-schema-dsl';

const schema = {
  password: [required, minLength(8)],
  confirmPassword: [required, matchesField('password', 'Passwords do not match')],
};
```

## Полный пример формы регистрации

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import {
  required,
  minLength,
  maxLength,
  email,
  matchesField,
  minValue,
  pattern,
  unique,
} from '@nexus-state/form-schema-dsl';

const store = createStore();

const registrationSchema = {
  username: [
    required,
    minLength(3, 'Username must be at least 3 characters'),
    maxLength(20, 'Username must be at most 20 characters'),
    pattern(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    unique('https://api.example.com/check-username', 'Username is already taken'),
  ],
  
  email: [
    required,
    email('Please enter a valid email address'),
  ],
  
  password: [
    required,
    minLength(8, 'Password must be at least 8 characters'),
    pattern(/[A-Z]/, 'Password must contain at least one uppercase letter'),
    pattern(/[0-9]/, 'Password must contain at least one number'),
  ],
  
  confirmPassword: [
    required,
    matchesField('password', 'Passwords do not match'),
  ],
  
  age: [
    required,
    minValue(18, 'You must be at least 18 years old'),
  ],
  
  phone: [
    pattern(/^\+?[\d\s-()]{10,}$/, 'Invalid phone number'),
  ],
};

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: registrationSchema,
  initialValues: {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: 18,
    phone: '',
  },
  validateOnChange: true,
  validateOnBlur: true,
});

// Handle form submission
const submit = async () => {
  const isValid = await form.validate();
  
  if (isValid) {
    // Submit form data
    const values = {
      username: form.field('username').value,
      email: form.field('email').value,
      password: form.field('password').value,
      age: form.field('age').value,
      phone: form.field('phone').value,
    };
    
    await api.register(values);
  }
};
```

## Создание собственных валидаторов

```typescript
import type { DSLRule } from '@nexus-state/form-schema-dsl';

export function creditCard(message?: string): DSLRule {
  const luhnCheck = (num: string): boolean => {
    let sum = 0;
    let isEven = false;

    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  return {
    validate: (value) => {
      if (typeof value !== 'string') return null;
      const cleaned = value.replace(/[\s-]/g, '');
      if (!/^\d+$/.test(cleaned) || cleaned.length < 13 || cleaned.length > 19) {
        return message ?? 'Invalid credit card number';
      }
      if (!luhnCheck(cleaned)) {
        return message ?? 'Invalid credit card number';
      }
      return null;
    },
    code: 'credit_card',
  };
}

// Usage
const schema = {
  cardNumber: [creditCard()],
};
```

## Группированный импорт

```typescript
import * as validators from '@nexus-state/form-schema-dsl';

const schema = {
  username: [validators.required, validators.minLength(3)],
  email: [validators.required, validators.email()],
  password: [validators.required, validators.minLength(8)],
};
```

## См. также

- [DSL Plugin Source](../../../packages/form-schema-dsl/src/index.ts)
- [Built-in Validators](../../../packages/form-schema-dsl/src/validators.ts)
- [Async Validators](../../../packages/form-schema-dsl/src/async-validators.ts)
