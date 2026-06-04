# DSL Plugin Example (Advanced)

## Асинхронная валидация

### Проверка уникальности

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import {
  required,
  email,
  unique,
  exists,
  asyncCustom,
  checkPromoCode,
} from '@nexus-state/form-schema-dsl';

const store = createStore();

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    username: [
      required,
      unique(
        'https://api.example.com/check-username',
        'Username is already taken',
        { debounce: 300, cache: true }
      ),
    ],
    email: [
      required,
      email(),
      unique(
        async (value) => {
          const response = await fetch('/api/check-email', {
            method: 'POST',
            body: JSON.stringify({ email: value }),
          });
          const data = await response.json();
          return data.exists;
        },
        'Email is already registered'
      ),
    ],
    inviteCode: [
      required,
      exists(
        'https://api.example.com/check-invite',
        'Invalid or expired invite code'
      ),
    ],
    promoCode: [
      required,
      checkPromoCode(
        'https://api.example.com/validate-promo',
        'Invalid promo code'
      ),
    ],
    customField: [
      asyncCustom(
        async (value) => {
          // Кастомная async логика
          const isValid = await someAsyncCheck(value);
          return isValid ? null : 'Custom validation failed';
        },
        'Validation failed',
        { debounce: 500, retry: 2 }
      ),
    ],
  },
  initialValues: {
    username: '',
    email: '',
    inviteCode: '',
    promoCode: '',
    customField: '',
  },
});
```

## Условная валидация

### Валидация по условию

```typescript
import { required, conditional, email, minLength, pattern } from '@nexus-state/form-schema-dsl';

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    accountType: [required],
    company: [
      conditional(
        (value, allValues) => allValues?.accountType === 'business',
        [required, minLength(2)]
      ),
    ],
    vatId: [
      conditional(
        (value, allValues) => allValues?.accountType === 'business',
        [required, pattern(/^[\w-]+$/)]
      ),
    ],
    firstName: [
      conditional(
        (value, allValues) => allValues?.accountType === 'personal',
        [required]
      ),
    ],
  },
  initialValues: {
    accountType: 'personal',
    company: '',
    vatId: '',
    firstName: '',
  },
});
```

### Валидация с несколькими условиями

```typescript
const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    employmentType: [required],
    company: [
      conditional(
        (value, allValues) => allValues?.employmentType === 'employed',
        [required]
      ),
    ],
    selfEmployedId: [
      conditional(
        (value, allValues) => allValues?.employmentType === 'self-employed',
        [required, pattern(/^\d{10}$/)]
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
  },
  initialValues: {
    employmentType: '',
    company: '',
    selfEmployedId: '',
    income: 0,
  },
});
```

## Кастомные валидаторы

### Синхронный кастомный валидатор

```typescript
import { custom } from '@nexus-state/form-schema-dsl';

// Валидация HEX цвета
const validColor = custom(
  (value) => {
    if (!value) return null;
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    return hexRegex.test(value) ? null : 'Invalid hex color';
  },
  'Invalid color format',
  'color_format'
);

// Валидация кредитной карты (Luhn algorithm)
const creditCard = custom(
  (value) => {
    if (!value) return null;
    const cleaned = value.replace(/[\s-]/g, '');
    
    if (!/^\d+$/.test(cleaned) || cleaned.length < 13 || cleaned.length > 19) {
      return 'Invalid card number';
    }
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0 ? null : 'Invalid card number';
  },
  'Invalid credit card number',
  'credit_card'
);

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    color: [validColor],
    cardNumber: [creditCard],
  },
});
```

### Асинхронный кастомный валидатор

```typescript
import { asyncCustom, withDebounce, withRetry, withTimeout } from '@nexus-state/form-schema-dsl';

// Проверка доступности даты
const checkAvailability = asyncCustom(
  async (value, allValues) => {
    const response = await fetch(`/api/check-availability?date=${value}`);
    const data = await response.json();
    return data.available ? null : 'Date is not available';
  },
  'Date unavailable',
  { debounce: 300, timeout: 5000 }
);

// Проверка сложности пароля на сервере
const checkPasswordStrength = asyncCustom(
  async (value) => {
    const response = await fetch('/api/check-password-strength', {
      method: 'POST',
      body: JSON.stringify({ password: value }),
    });
    const data = await response.json();
    return data.strong ? null : 'Password is too weak';
  },
  'Password too weak',
  { debounce: 500, retry: 2 }
);

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    bookingDate: [checkAvailability],
    password: [checkPasswordStrength],
  },
});
```

## Утилиты для async валидации

### Debounce

```typescript
import { withDebounce } from '@nexus-state/form-schema-dsl';

const asyncValidator = async (value: string) => {
  const response = await fetch(`/api/check?value=${value}`);
  const data = await response.json();
  return data.valid ? null : 'Invalid value';
};

// Debounce 300ms
const debouncedValidator = withDebounce(asyncValidator, 300);

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    field: [asyncCustom(debouncedValidator)],
  },
});
```

### Retry

```typescript
import { withRetry } from '@nexus-state/form-schema-dsl';

const flakyValidator = async (value: string) => {
  const response = await fetch('/api/check', {
    method: 'POST',
    body: JSON.stringify({ value }),
  });
  const data = await response.json();
  return data.valid ? null : 'Invalid';
};

// Retry 3 times with 1 second delay
const retriedValidator = withRetry(flakyValidator, 3, 1000);

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    field: [asyncCustom(retriedValidator)],
  },
});
```

### Timeout

```typescript
import { withTimeout } from '@nexus-state/form-schema-dsl';

const slowValidator = async (value: string) => {
  const response = await fetch('/api/slow-check', {
    method: 'POST',
    body: JSON.stringify({ value }),
  });
  const data = await response.json();
  return data.valid ? null : 'Invalid';
};

// Timeout after 5 seconds
const timeoutValidator = withTimeout(slowValidator, 5000);

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    field: [asyncCustom(timeoutValidator)],
  },
});
```

### Комбинированные опции

```typescript
import { withOptions } from '@nexus-state/form-schema-dsl';

const robustValidator = withOptions(
  async (value: string) => {
    const response = await fetch('/api/check', {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
    const data = await response.json();
    return data.valid ? null : 'Invalid';
  },
  {
    debounce: 300,
    retry: 3,
    timeout: 5000,
    cache: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
  }
);

const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    field: [asyncCustom(robustValidator)],
  },
});
```

## Полный пример: Форма заказа

```typescript
import { createStore } from '@nexus-state/core';
import { createForm } from '@nexus-state/form';
import {
  required,
  email,
  minLength,
  pattern,
  minValue,
  conditional,
  unique,
  asyncCustom,
} from '@nexus-state/form-schema-dsl';

const store = createStore();

const orderForm = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: {
    // Контактная информация
    email: [
      required,
      email('Invalid email address'),
      unique('https://api.example.com/check-email', 'Email already registered'),
    ],
    phone: [
      required,
      pattern(/^\+?[\d\s-()]{10,}$/, 'Invalid phone number'),
    ],
    
    // Тип заказа
    orderType: [required],
    
    // Доставка (только для физических товаров)
    shippingAddress: [
      conditional(
        (value, allValues) => allValues?.orderType === 'physical',
        [required, minLength(5)]
      ),
    ],
    shippingCity: [
      conditional(
        (value, allValues) => allValues?.orderType === 'physical',
        [required]
      ),
    ],
    shippingZip: [
      conditional(
        (value, allValues) => allValues?.orderType === 'physical',
        [required, pattern(/^\d{5}$/, 'Invalid ZIP code')]
      ),
    ],
    
    // Оплата
    paymentMethod: [required],
    cardNumber: [
      conditional(
        (value, allValues) => allValues?.paymentMethod === 'card',
        [
          required,
          asyncCustom(
            async (value) => {
              const response = await fetch('/api/validate-card', {
                method: 'POST',
                body: JSON.stringify({ cardNumber: value }),
              });
              const data = await response.json();
              return data.valid ? null : 'Invalid card number';
            },
            'Card validation failed',
            { debounce: 500 }
          ),
        ]
      ),
    ],
    
    // Промокод
    promoCode: [
      asyncCustom(
        async (value) => {
          if (!value) return null;
          const response = await fetch('/api/validate-promo', {
            method: 'POST',
            body: JSON.stringify({ code: value }),
          });
          const data = await response.json();
          return data.valid ? null : 'Invalid promo code';
        },
        'Invalid promo code'
      ),
    ],
    
    // Сумма заказа
    amount: [
      required,
      minValue(1, 'Amount must be at least 1'),
    ],
  },
  initialValues: {
    email: '',
    phone: '',
    orderType: 'physical',
    shippingAddress: '',
    shippingCity: '',
    shippingZip: '',
    paymentMethod: 'card',
    cardNumber: '',
    promoCode: '',
    amount: 0,
  },
  validateOnChange: true,
  validateOnBlur: true,
});

// Handle submission
const submitOrder = async () => {
  const isValid = await orderForm.validate();
  
  if (isValid) {
    const values = {
      email: orderForm.field('email').value,
      phone: orderForm.field('phone').value,
      orderType: orderForm.field('orderType').value,
      shippingAddress: orderForm.field('shippingAddress').value,
      shippingCity: orderForm.field('shippingCity').value,
      shippingZip: orderForm.field('shippingZip').value,
      paymentMethod: orderForm.field('paymentMethod').value,
      cardNumber: orderForm.field('cardNumber').value,
      promoCode: orderForm.field('promoCode').value,
      amount: orderForm.field('amount').value,
    };
    
    await api.submitOrder(values);
  }
};
```

## См. также

- [TASK-011](../tasks/TASK-011-dsl-async-validators.md) — DSL валидаторы (async)
- [DSL Plugin Source](../../../packages/form-schema-dsl/src/async-validators.ts)
