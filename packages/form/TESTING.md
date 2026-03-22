# Testing @nexus-state/form

Комплексное руководство по тестированию форм с использованием `@nexus-state/form/testing`.

## Quick Start

Начните с простого теста формы:

```typescript
import { createTestForm } from '@nexus-state/form/testing';

describe('LoginForm', () => {
  it('должен обновлять значения полей', () => {
    // 1. Создайте тестовую форму
    const form = createTestForm({
      initialValues: {
        email: '',
        password: '',
      },
    });

    // 2. Измените значение поля
    form.setFieldValue('email', 'test@example.com');

    // 3. Проверьте результат
    expect(form.values.email).toBe('test@example.com');
    expect(form.isDirty).toBe(true);
  });
});
```

**Что делает `createTestForm`:**
- ✅ Создаёт изолированный store для тестов
- ✅ Отключает валидацию по умолчанию (быстрые тесты)
- ✅ Сохраняет полную типизацию
- ✅ Не требует моков

---

## Installation

```bash
npm install @nexus-state/form @nexus-state/core
```

Тестовые утилиты импортируются из `@nexus-state/form/testing`:

```typescript
import {
  createTestForm,
  createTestFormWithValidation,
  waitForValidation,
  waitForFormState,
} from '@nexus-state/form/testing';
```

---

## API Reference

### `createTestForm(options)`

Создаёт форму, оптимизированную для тестирования (валидация отключена по умолчанию).

**Параметры:**
- `initialValues` — Начальные значения формы
- `disableValidation` — Отключить валидацию (по умолчанию: `true`)
- `validateOnChange` — Валидация при изменении
- `validateOnBlur` — Валидация при потере фокуса
- `store` — Кастомный store (опционально)

**Пример:**
```typescript
const form = createTestForm({
  initialValues: { name: '', email: '' },
  disableValidation: true, // Без валидации
});
```

---

### `createTestFormWithValidation(options)`

Создаёт форму с включённой валидацией для тестирования логики валидации.

**Параметры:**
- Все параметры из `createTestForm`
- `validate` — Функция синхронной валидации
- `schemaType` — Тип схемы (например, `'zod'`, `'yup'`)
- `schemaConfig` — Конфигурация схемы

**Пример:**
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

---

### `waitForValidation(form, timeout?)`

Ожидает завершения асинхронной валидации.

**Параметры:**
- `form` — Экземпляр формы
- `timeout` — Максимальное время ожидания в мс (по умолчанию: 1000)

**Пример:**
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

// Ждём завершения async-валидации
await waitForValidation(form);

expect(form.errors.username).toBe('Username taken');
```

---

### `waitForFormState(form, condition, message?, timeout?)`

Ожидает, пока состояние формы не совпадёт с условием.

**Параметры:**
- `form` — Экземпляр формы для наблюдения
- `condition` — Функция-предикат
- `message` — Сообщение об ошибке при таймауте
- `timeout` — Максимальное время ожидания в мс (по умолчанию: 1000)

**Пример:**
```typescript
await waitForFormState(
  form,
  state => !state.isSubmitting,
  'Форма должна завершить отправку',
  2000
);
```

---

## Common Patterns

### Testing Form Without Validation

Тестирование формы без валидации (быстрые UI-тесты):

```typescript
import { createTestForm } from '@nexus-state/form/testing';

describe('MyForm', () => {
  it('должен обновлять значение поля', () => {
    const form = createTestForm({
      initialValues: { name: '' },
    });

    form.setFieldValue('name', 'John');
    expect(form.values.name).toBe('John');
  });

  it('должен отмечать форму как грязную', () => {
    const form = createTestForm({
      initialValues: { email: '' },
    });

    expect(form.isDirty).toBe(false);

    form.setFieldValue('email', 'test@example.com');

    expect(form.isDirty).toBe(true);
  });

  it('должен сбрасывать форму', () => {
    const form = createTestForm({
      initialValues: { name: 'Initial' },
    });

    form.setFieldValue('name', 'Changed');
    expect(form.values.name).toBe('Changed');

    form.reset();
    expect(form.values.name).toBe('Initial');
    expect(form.isDirty).toBe(false);
  });
});
```

---

### Testing Validation Logic

#### Sync Validation

```typescript
import { createTestFormWithValidation } from '@nexus-state/form/testing';

describe('Sync Validation', () => {
  it('должен валидировать email формат', async () => {
    const form = createTestFormWithValidation({
      initialValues: { email: '' },
      validate: (values) => ({
        email: !values.email.includes('@') ? 'Invalid email' : null,
      }),
    });

    form.setFieldValue('email', 'invalid');
    await form.validate();

    expect(form.errors.email).toBe('Invalid email');
    expect(form.isValid).toBe(false);
  });

  it('должен проходить валидацию с корректными данными', async () => {
    const form = createTestFormWithValidation({
      initialValues: { email: '' },
      validate: (values) => ({
        email: !values.email ? 'Required' : null,
      }),
    });

    form.setFieldValue('email', 'test@example.com');
    await form.validate();

    expect(form.errors.email).toBeNull();
    expect(form.isValid).toBe(true);
  });

  it('должен валидировать несколько полей', async () => {
    const form = createTestFormWithValidation({
      initialValues: { username: '', email: '' },
      validate: (values) => ({
        username: values.username.length < 3 ? 'Min 3 chars' : null,
        email: !values.email.includes('@') ? 'Invalid email' : null,
      }),
    });

    form.setFieldValue('username', 'ab');
    form.setFieldValue('email', 'invalid');
    await form.validate();

    expect(form.errors.username).toBe('Min 3 chars');
    expect(form.errors.email).toBe('Invalid email');
    expect(form.isValid).toBe(false);
  });
});
```

---

#### Async Validation

```typescript
import {
  createTestFormWithValidation,
  waitForValidation,
} from '@nexus-state/form/testing';

describe('Async Validation', () => {
  it('должен проверять уникальность username', async () => {
    const form = createTestFormWithValidation({
      initialValues: { username: '' },
      validate: async (values) => {
        // Имитация API вызова
        await new Promise(resolve => setTimeout(resolve, 200));

        const isTaken = values.username === 'admin';
        return isTaken
          ? { username: 'Username already taken' }
          : null;
      },
    });

    form.setFieldValue('username', 'admin');

    // Ждём завершения async-валидации
    await waitForValidation(form);

    expect(form.errors.username).toBe('Username already taken');
  });

  it('должен проходить валидацию с уникальным username', async () => {
    const form = createTestFormWithValidation({
      initialValues: { username: '' },
      validate: async (values) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return values.username === 'unique' ? null : { username: 'Taken' };
      },
    });

    form.setFieldValue('username', 'unique');
    await waitForValidation(form);

    expect(form.errors.username).toBeNull();
    expect(form.isValid).toBe(true);
  });
});
```

---

#### Schema Validation (Zod)

```typescript
import { z } from 'zod';
import { createTestFormWithValidation } from '@nexus-state/form/testing';

describe('Zod Schema Validation', () => {
  const schema = z.object({
    email: z.string().email('Некорректный email'),
    password: z.string().min(8, 'Минимум 8 символов'),
    age: z.number().min(18, 'Минимум 18 лет'),
  });

  it('должен валидировать по Zod схеме', async () => {
    const form = createTestFormWithValidation({
      initialValues: { email: '', password: '', age: 15 },
      schemaType: 'zod',
      schemaConfig: schema,
    });

    form.setFieldValue('email', 'not-an-email');
    form.setFieldValue('password', 'short');
    await form.validate();

    expect(form.errors.email).toBeDefined();
    expect(form.errors.password).toBe('Минимум 8 символов');
    expect(form.isValid).toBe(false);
  });

  it('должен проходить валидацию с валидными данными', async () => {
    const form = createTestFormWithValidation({
      initialValues: { email: '', password: '', age: 20 },
      schemaType: 'zod',
      schemaConfig: schema,
    });

    form.setFieldValue('email', 'test@example.com');
    form.setFieldValue('password', 'secure123');
    await form.validate();

    expect(form.isValid).toBe(true);
    expect(form.errors).toEqual({});
  });
});
```

---

#### Schema Validation (Yup)

```typescript
import * as yup from 'yup';
import { createTestFormWithValidation } from '@nexus-state/form/testing';

describe('Yup Schema Validation', () => {
  const schema = yup.object({
    email: yup.string().email('Некорректный email').required(),
    password: yup.string().min(8, 'Минимум 8 символов').required(),
  });

  it('должен валидировать по Yup схеме', async () => {
    const form = createTestFormWithValidation({
      initialValues: { email: '', password: '' },
      schemaType: 'yup',
      schemaConfig: schema,
    });

    form.setFieldValue('email', 'invalid');
    form.setFieldValue('password', 'short');
    await form.validate();

    expect(form.errors.email).toBeDefined();
    expect(form.errors.password).toBeDefined();
  });
});
```

---

### Testing Form Submission

```typescript
import { createTestForm } from '@nexus-state/form/testing';

describe('Form Submission', () => {
  it('должен вызывать onSubmit с данными формы', async () => {
    const mockSubmit = vi.fn().mockResolvedValue({ success: true });

    const form = createTestForm({
      initialValues: { email: '', password: '' },
    });

    // Устанавливаем обработчик отправки
    form.handleSubmit(async (values) => {
      await mockSubmit(values);
    });

    // Заполняем форму
    form.setFieldValue('email', 'test@example.com');
    form.setFieldValue('password', 'password123');

    // Отправляем
    await form.handleSubmit(async (values) => {
      await mockSubmit(values);
    })({ preventDefault: () => {} } as React.FormEvent);

    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('должен устанавливать isSubmitting во время отправки', async () => {
    let submitResolve: (value: unknown) => void;
    const submitPromise = new Promise(resolve => {
      submitResolve = resolve;
    });

    const form = createTestForm({
      initialValues: { name: '' },
    });

    form.handleSubmit(async () => {
      expect(form.isSubmitting).toBe(true);
      await submitPromise;
    })({ preventDefault: () => {} } as React.FormEvent);

    // Завершаем отправку
    submitResolve!({ success: true });

    // Ждём обновления состояния
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(form.isSubmitting).toBe(false);
  });
});
```

---

### Testing Field Arrays

```typescript
import { createTestForm } from '@nexus-state/form/testing';

describe('Field Arrays', () => {
  it('должен добавлять элементы в массив', () => {
    const form = createTestForm({
      initialValues: { items: [] as string[] },
    });

    const array = form.fieldArray('items', '');

    array.append('Item 1');
    array.append('Item 2');

    expect(form.values.items).toEqual(['Item 1', 'Item 2']);
    expect(form.isDirty).toBe(true);
  });

  it('должен удалять элементы из массива', () => {
    const form = createTestForm({
      initialValues: { items: ['A', 'B', 'C'] },
    });

    const array = form.fieldArray('items', '');

    array.remove(1); // Удаляем 'B'

    expect(form.values.items).toEqual(['A', 'C']);
  });

  it('должен перемещать элементы', () => {
    const form = createTestForm({
      initialValues: { items: ['First', 'Second', 'Third'] },
    });

    const array = form.fieldArray('items', '');

    array.move(0, 2); // Перемещаем 'First' в конец

    expect(form.values.items).toEqual(['Second', 'Third', 'First']);
  });

  it('должен работать с объектами в массиве', () => {
    interface Skill {
      name: string;
      level: number;
    }

    const form = createTestForm({
      initialValues: { skills: [] as Skill[] },
    });

    const array = form.fieldArray('skills', { name: '', level: 1 });

    array.append({ name: 'React', level: 5 });
    array.append({ name: 'TypeScript', level: 4 });

    expect(form.values.skills).toHaveLength(2);
    expect(form.values.skills[0].name).toBe('React');

    // Обновляем элемент
    array.update(0, { name: 'React', level: 6 });
    expect(form.values.skills[0].level).toBe(6);
  });
});
```

---

## Framework Examples

### React + Testing Library

#### Basic Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { createTestForm } from '@nexus-state/form/testing';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('должен рендерить поля формы', () => {
    const form = createTestForm({
      initialValues: { email: '', password: '' },
    });

    render(<LoginForm formAtom={form} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('должен обновлять значения при вводе', () => {
    const form = createTestForm({
      initialValues: { email: '', password: '' },
    });

    render(<LoginForm formAtom={form} />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(form.values.email).toBe('test@example.com');
  });

  it('должен показывать ошибки валидации', async () => {
    const form = createTestFormWithValidation({
      initialValues: { email: '' },
      validate: (values) => ({
        email: !values.email ? 'Email required' : null,
      }),
    });

    render(<LoginForm formAtom={form} />);

    const submitButton = screen.getByText('Войти');
    fireEvent.click(submitButton);

    expect(await screen.findByText('Email required')).toBeInTheDocument();
  });
});
```

---

#### Testing Submission

```typescript
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { createTestForm } from '@nexus-state/form/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginForm } from './LoginForm';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('LoginForm Submission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должен отправлять форму на сервер', async () => {
    const form = createTestForm({
      initialValues: { email: '', password: '' },
    });

    // Мок мутации
    const mockMutate = vi.fn().mockResolvedValue({ success: true });
    vi.mock('./hooks/useLogin', () => ({
      useLogin: () => ({ mutateAsync: mockMutate, isPending: false }),
    }));

    render(<LoginForm formAtom={form} />, { wrapper: createWrapper() });

    // Заполняем форму
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Отправляем
    fireEvent.click(screen.getByText('Войти'));

    // Проверяем вызов API
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('должен показывать ошибки сервера', async () => {
    const form = createTestForm({
      initialValues: { email: '', password: '' },
    });

    const mockMutate = vi.fn().mockRejectedValue({
      validationErrors: {
        email: 'Email already registered',
      },
    });

    vi.mock('./hooks/useLogin', () => ({
      useLogin: () => ({ mutateAsync: mockMutate, isPending: false }),
    }));

    render(<LoginForm formAtom={form} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByText('Войти'));

    await waitFor(() => {
      expect(screen.getByText(/Email already registered/i)).toBeInTheDocument();
    });
  });

  it('должен блокировать кнопку во время отправки', async () => {
    const form = createTestForm({
      initialValues: { email: '', password: '' },
    });

    let submitResolve: (value: unknown) => void;
    const submitPromise = new Promise(resolve => {
      submitResolve = resolve;
    });

    const mockMutate = vi.fn().mockImplementation(async () => {
      await submitPromise;
      return { success: true };
    });

    vi.mock('./hooks/useLogin', () => ({
      useLogin: () => ({ mutateAsync: mockMutate, isPending: false }),
    }));

    render(<LoginForm formAtom={form} />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByText('Войти'));

    // Кнопка должна быть заблокирована
    expect(screen.getByText('Войти')).toBeDisabled();

    // Завершаем отправку
    submitResolve!({ success: true });
  });
});
```

---

#### Testing with React Hook Form Migration

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { createTestForm } from '@nexus-state/form/testing';
import { MigrationForm } from './MigrationForm';

describe('Migration from React Hook Form', () => {
  it('должен работать как замена React Hook Form', () => {
    const form = createTestForm({
      initialValues: { name: '', email: '' },
    });

    render(<MigrationForm formAtom={form} />);

    // API похож на React Hook Form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'John' },
    });

    expect(form.values.name).toBe('John');
  });
});
```

---

### Vue + Vue Test Utils

```typescript
import { mount } from '@vue/test-utils';
import { createTestForm } from '@nexus-state/form/testing';
import { defineComponent, h } from 'vue';
import LoginForm from './LoginForm.vue';

describe('LoginForm (Vue)', () => {
  it('должен рендерить поля формы', () => {
    const form = createTestForm({
      initialValues: { email: '', password: '' },
    });

    const wrapper = mount(LoginForm, {
      props: {
        formAtom: form,
      },
    });

    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
  });

  it('должен обновлять значения при вводе', async () => {
    const form = createTestForm({
      initialValues: { email: '' },
    });

    const wrapper = mount(LoginForm, {
      props: {
        formAtom: form,
      },
    });

    const emailInput = wrapper.find('input[type="email"]');
    await emailInput.setValue('test@example.com');

    expect(form.values.email).toBe('test@example.com');
  });
});
```

---

### Svelte + Testing Library

```typescript
import { render, screen, fireEvent } from '@testing-library/svelte';
import { createTestForm } from '@nexus-state/form/testing';
import LoginForm from './LoginForm.svelte';

describe('LoginForm (Svelte)', () => {
  it('должен рендерить поля формы', () => {
    const form = createTestForm({
      initialValues: { email: '', password: '' },
    });

    render(LoginForm, { formAtom: form });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('должен обновлять значения при вводе', async () => {
    const form = createTestForm({
      initialValues: { email: '' },
    });

    render(LoginForm, { formAtom: form });

    const emailInput = screen.getByLabelText(/email/i);
    await fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(form.values.email).toBe('test@example.com');
  });
});
```

---

## Best Practices

### ✅ Do's

**Используйте `createTestForm` для UI тестов**

```typescript
// ✅ Правильно — быстрая форма без валидации
const form = createTestForm({
  initialValues: { name: '' },
});
```

**Используйте `createTestFormWithValidation` для тестов валидации**

```typescript
// ✅ Правильно — тестирование логики валидации
const form = createTestFormWithValidation({
  schemaType: 'zod',
  schemaConfig: mySchema,
});
```

**Изолируйте тесты**

```typescript
// ✅ Правильно — новая форма для каждого теста
describe('MyForm', () => {
  it('test 1', () => {
    const form = createTestForm(/* ... */);
    // ...
  });

  it('test 2', () => {
    const form = createTestForm(/* ... */); // Независимый инстанс
    // ...
  });
});
```

**Ждите async-валидацию**

```typescript
// ✅ Правильно
form.setFieldValue('email', 'test@example.com');
await waitForValidation(form);
expect(form.isValid).toBe(true);
```

**Мокайте API вызовы**

```typescript
// ✅ Правильно — мок внешних зависимостей
vi.mock('./api', () => ({
  checkUsername: vi.fn().mockResolvedValue({ available: true }),
}));
```

**Используйте типизированные initial values**

```typescript
// ✅ Правильно — полная типизация
interface MyFormValues {
  username: string;
  email: string;
  age: number;
}

const form = createTestForm<MyFormValues>({
  initialValues: {
    username: '',
    email: '',
    age: 0,
  },
});
```

---

### ❌ Don'ts

**Не используйте production-схемы в UI тестах**

```typescript
// ❌ Неправильно — медленно, лишняя сложность
const form = createTestForm({
  schemaType: 'zod',
  schemaConfig: productionSchema, // Избегать в UI тестах
});

// ✅ Правильно
const form = createTestForm({
  initialValues: { /* ... */ }, // Без валидации для UI тестов
});
```

**Не переиспользуйте формы между тестами**

```typescript
// ❌ Неправильно — формы могут пересекаться
let sharedForm: Form;

beforeEach(() => {
  sharedForm = createTestForm(/* ... */);
});

// ✅ Правильно — создавайте заново в каждом тесте
it('test', () => {
  const form = createTestForm(/* ... */);
});
```

**Не забывайте ждать async-валидацию**

```typescript
// ❌ Неправильно — проверка до завершения валидации
form.setFieldValue('username', 'admin');
expect(form.errors.username).toBe('Taken'); // Может не сработать!

// ✅ Правильно
form.setFieldValue('username', 'admin');
await waitForValidation(form);
expect(form.errors.username).toBe('Taken');
```

**Не тестируйте implementation details**

```typescript
// ❌ Неправильно — тестирование внутренней реализации
expect(form.store.getState()).toHaveProperty('fields.email');

// ✅ Правильно — тестирование публичного API
expect(form.values.email).toBe('test@example.com');
```

---

## Troubleshooting

### Ошибка: "Cannot read property 'atom' of undefined"

**Проблема:** Поле не найдено в форме

**Решение:**
```typescript
// Убедитесь, что имя поля существует в initialValues
const form = createTestForm({
  initialValues: {
    email: '', // ✅ Поле объявлено
  },
});

form.field('email'); // Работает

form.field('phone'); // ❌ Ошибка — поля нет в initialValues
```

---

### Ошибка: Валидация не срабатывает

**Проблема:** Валидация отключена по умолчанию

**Решение:**
```typescript
// Используйте createTestFormWithValidation
const form = createTestFormWithValidation({
  validate: (values) => ({
    email: !values.email ? 'Required' : null,
  }),
});
```

---

### Ошибка: Тесты выполняются медленно

**Проблема:** Async-валидация замедляет тесты

**Решение:**
```typescript
// Отключите валидацию для UI тестов
const form = createTestForm({
  disableValidation: true,
  validateOnChange: false,
  validateOnBlur: false,
});

// Или используйте mock для async-валидации
vi.spyOn(Date, 'now').mockReturnValue(0);
```

---

### Ошибка: "Validation did not complete within 1000ms"

**Проблема:** Async-валидация зависла

**Решение:**
```typescript
// Увеличьте timeout
await waitForValidation(form, 3000);

// Или проверьте, что mock возвращает Promise
vi.mock('./api', () => ({
  checkUsername: vi.fn().mockResolvedValue({ available: true }),
}));
```

---

### Ошибка: "Form is already submitting"

**Проблема:** Попытка отправить форму во время текущей отправки

**Решение:**
```typescript
// Дождитесь завершения предыдущей отправки
await waitForFormState(
  form,
  state => !state.isSubmitting,
  'Предыдущая отправка должна завершиться'
);

// Или сбросьте состояние
form.reset({ force: true });
```

---

### FAQ

**Q: Можно ли использовать `createTestForm` в production?**

A: Технически да, но не рекомендуется. Утилиты созданы для тестов и могут не учитывать edge cases production-кода.

---

**Q: Как тестировать формы с field arrays?**

A: Используйте `createTestForm` + методы `fieldArray`:

```typescript
const form = createTestForm({
  initialValues: { items: [] as string[] },
});

const array = form.fieldArray('items', '');
array.append('new item');
expect(form.values.items).toEqual(['new item']);
```

---

**Q: Как тестировать кастомные хуки форм?**

A: Создавайте форму в хуке и тестируйте через `renderHook`:

```typescript
import { renderHook } from '@testing-library/react';
import { createTestForm } from '@nexus-state/form/testing';
import { useMyForm } from './useMyForm';

const { result } = renderHook(() => useMyForm());
expect(result.form.values.name).toBe('');
```

---

**Q: Как тестировать формы с зависимостями между полями?**

A: Используйте кастомную валидацию:

```typescript
const form = createTestFormWithValidation({
  initialValues: { password: '', confirmPassword: '' },
  validate: (values) => ({
    confirmPassword:
      values.password !== values.confirmPassword
        ? 'Passwords do not match'
        : null,
  }),
});

form.setFieldValue('password', 'secret123');
form.setFieldValue('confirmPassword', 'different');
await form.validate();

expect(form.errors.confirmPassword).toBe('Passwords do not match');
```

---

**Q: Как мокать schema validators?**

A: Создайте тестовую схему с предсказуемым поведением:

```typescript
const mockSchema = {
  parseAsync: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
  // или для ошибок:
  parseAsync: vi.fn().mockRejectedValue(
    new ZodError([{ message: 'Invalid', path: ['email'] }])
  ),
};

const form = createTestFormWithValidation({
  schemaType: 'zod',
  schemaConfig: mockSchema,
});
```

---

## Migration Guide

### From React Hook Form

```typescript
// React Hook Form
import { useForm } from 'react-hook-form';

const { register, handleSubmit, formState } = useForm({
  defaultValues: { name: '' },
});

// @nexus-state/form
import { createTestForm } from '@nexus-state/form/testing';

const form = createTestForm({
  initialValues: { name: '' },
});

// Эквивалент register
form.setFieldValue('name', 'John');

// Эквивалент handleSubmit
form.handleSubmit(async (values) => {
  // ...
});

// Эквивалент formState
form.values; // значения
form.errors; // ошибки
form.isValid; // валидность
```

---

### From Formik

```typescript
// Formik
import { useFormik } from 'formik';

const formik = useFormik({
  initialValues: { name: '' },
  onSubmit: (values) => { /* ... */ },
});

// @nexus-state/form
import { createTestForm } from '@nexus-state/form/testing';

const form = createTestForm({
  initialValues: { name: '' },
});

// Эквивалент handleChange
form.setFieldValue('name', 'John');

// Эквивалент handleSubmit
form.handleSubmit(async (values) => {
  // ...
});

// Эквивалент errors
form.errors;
```

---

## See Also

- [API Documentation](./README.md)
- [Testing Utilities Source](./src/testing/index.ts)
- [Examples](../../examples/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/intro/)
