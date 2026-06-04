# TASK-010: Документация по тестированию @nexus-state/form

**Статус:** Pending  
**Приоритет:** Высокий  
**Сложность:** Низкая  
**Оценка времени:** 2-3 часа  
**Зависит от:** TASK-009

---

## 📋 Описание

Создать комплексную документацию по тестированию форм с использованием `@nexus-state/form/testing`.

### Проблема

Пользователи не имеют единого руководства по тестированию:
- Примеры разбросаны по README
- Нет лучших практик
- Неясно, как тестировать разные сценарии
- Отсутствие готовых рецептов

### Решение

Создать отдельный файл `TESTING.md` с:
- Quick start для начинающих
- API reference всех утилит
- Рецепты для распространённых сценариев
- Примеры для React/Vue/Svelte

---

## 🎯 Критерии приемки

### Обязательные

- [ ] Создан файл `packages/form/TESTING.md`
- [ ] Секция "Quick Start" с базовыми примерами
- [ ] API reference для всех функций из `@nexus-state/form/testing`
- [ ] Примеры тестирования:
  - [ ] Формы без валидации
  - [ ] Формы с sync-валидацией
  - [ ] Формы с async-валидацией
  - [ ] Формы со schema-валидацией (Zod/Yup)
  - [ ] React компонентов с формами
- [ ] Секция "Best Practices"
- [ ] Секция "Troubleshooting"
- [ ] Ссылка на TESTING.md в README.md

### Дополнительные

- [ ] Примеры для Vue и Svelte
- [ ] Интеграция с React Testing Library
- [ ] Примеры мокания API вызовов
- [ ] Скриншоты/диаграммы (опционально)

---

## 📐 Структура документации

```markdown
# Testing @nexus-state/form

## Quick Start

5-минутное введение с базовым примером

## Installation

Как импортировать тестовые утилиты

## API Reference

### createTestForm()
### createTestFormWithValidation()
### waitForValidation()

## Common Patterns

### Testing Form Without Validation
### Testing Validation Logic
### Testing Async Validation
### Testing Schema Validation (Zod/Yup)
### Testing Form Submission
### Testing Field Arrays

## Framework Examples

### React + Testing Library
### Vue + Vue Test Utils
### Svelte + Testing Library

## Best Practices

### Do's
### Don'ts

## Troubleshooting

### Common Issues
### FAQ

## Migration Guide

### From React Hook Form
### From Formik
```

---

## 📝 Содержание

### Quick Start

```markdown
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
```

### Testing Validation

```markdown
## Testing Validation

### Sync Validation

```typescript
import { createTestFormWithValidation } from '@nexus-state/form/testing';

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
```

### Schema Validation (Zod)

```typescript
import { z } from 'zod';
import { createTestFormWithValidation } from '@nexus-state/form/testing';

const schema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
});

const form = createTestFormWithValidation({
  initialValues: { email: '', password: '' },
  schemaType: 'zod',
  schemaConfig: schema,
});

// Тест валидного значения
form.setFieldValue('email', 'test@example.com');
form.setFieldValue('password', 'secure123');
await form.validate();

expect(form.isValid).toBe(true);
expect(form.errors).toEqual({});

// Тест невалидного значения
form.setFieldValue('password', 'short');
await form.validate();

expect(form.errors.password).toBe('Минимум 8 символов');
```

### Async Validation

```typescript
import { 
  createTestFormWithValidation,
  waitForValidation 
} from '@nexus-state/form/testing';

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
```
```

### React Testing

```markdown
## React Component Testing

### Basic Component Test

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
});
```

### Testing Submission

```typescript
import { 
  render, 
  screen, 
  fireEvent, 
  waitFor 
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

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('LoginForm Submission', () => {
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

    // ... mock setup ...

    render(<LoginForm formAtom={form} />, { wrapper: createWrapper() });
    
    fireEvent.click(screen.getByText('Войти'));
    
    await waitFor(() => {
      expect(screen.getByText(/Email already registered/i))
        .toBeInTheDocument();
    });
  });
});
```
```

### Best Practices

```markdown
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
    const form = createTestForm(...);
    // ...
  });

  it('test 2', () => {
    const form = createTestForm(...); // Независимый инстанс
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
  initialValues: { ... }, // Без валидации для UI тестов
});
```

**Не переиспользуйте формы между тестами**
```typescript
// ❌ Неправильно — формы могут пересекаться
let sharedForm: Form;

beforeEach(() => {
  sharedForm = createTestForm(...);
});

// ✅ Правильно — создавайте заново в каждом тесте
it('test', () => {
  const form = createTestForm(...);
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
```

### Troubleshooting

```markdown
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

### FAQ

**Q: Можно ли использовать `createTestForm` в production?**

A: Технически да, но не рекомендуется. Утилиты созданы для тестов и могут не учитывать edge cases production-кода.

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

**Q: Как тестировать кастомные хуки форм?**

A: Создавайте форму в хуке и тестируйте через renderHook:
```typescript
import { renderHook } from '@testing-library/react';
import { createTestForm } from '@nexus-state/form/testing';
import { useMyForm } from './useMyForm';

const { result } = renderHook(() => useMyForm());
expect(result.form.values.name).toBe('');
```
```
```

---

## 🔗 Интеграция с README

### Обновить секцию "Testing" в README.md

```markdown
## Testing

@nexus-state/form provides comprehensive testing utilities out of the box.

See [Testing Guide](./TESTING.md) for detailed documentation.

Quick example:

```typescript
import { createTestForm } from '@nexus-state/form/testing';

const form = createTestForm({
  initialValues: { name: '', email: '' },
});

form.setFieldValue('name', 'John');
expect(form.values.name).toBe('John');
```
```

---

## 📚 Ресурсы

- [Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
- Существующий README: `packages/form/README.md`

---

## 🎯 Метрики успеха

- [ ] TESTING.md содержит ≥ 10 примеров кода
- [ ] Покрыты все основные сценарии тестирования
- [ ] Секция Troubleshooting решает ≥ 5 частых проблем
- [ ] Ссылка на TESTING.md добавлена в README.md
- [ ] Документация проверена носителем английского (если требуется)

---

## 📝 Заметки

- Использовать тот же стиль, что в README.md
- Добавлять комментарии к сложным примерам
- Избегать устаревших API
- Указывать версии библиотек в примерах
