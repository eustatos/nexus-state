# TASK-011: Обновить README.md с документацией по тестированию

**Статус:** Pending  
**Приоритет:** Средний  
**Сложность:** Низкая  
**Оценка времени:** 1 час  
**Зависит от:** TASK-009, TASK-010

---

## 📋 Описание

Обновить основной README.md пакета `@nexus-state/form`, добавив секцию о тестировании со ссылкой на подробную документацию.

### Проблема

- Пользователи не знают о тестовых утилитах
- Testing-документация скрыта в отдельном файле
- Нет quick start для тестирования в основном README

### Решение

Добавить видимую секцию "Testing" в README.md с:
- Кратким введением
- Базовым примером
- Ссылкой на TESTING.md

---

## 🎯 Критерии приемки

### Обязательные

- [ ] Добавлена секция "Testing" в README.md
- [ ] Пример использования `createTestForm()`
- [ ] Ссылка на `TESTING.md` для подробной документации
- [ ] Упоминание основных возможностей:
  - Формы без валидации
  - Формы с валидацией
  - Async-валидация
- [ ] Секция размещена после "Key Features" или перед "API Reference"

### Дополнительные

- [ ] Пример для React Testing Library
- [ ] Таблица сравнения `createTestForm` vs `createTestFormWithValidation`
- [ ] Badge с ссылкой на TESTING.md

---

## 📐 Место для секции

Рекомендуемое расположение в README.md:

```markdown
## 🔥 Key Features

... (существующий контент) ...

---

## 🧪 Testing

@nexus-state/form provides built-in utilities for testing forms without 
the boilerplate.

Quick example:

```typescript
import { createTestForm } from '@nexus-state/form/testing';

// Create form without validation (fast!)
const form = createTestForm({
  initialValues: {
    username: '',
    email: '',
  },
});

// Test form behavior
form.setFieldValue('username', 'john_doe');
expect(form.values.username).toBe('john_doe');
expect(form.isDirty).toBe(true);
```

**Features:**
- ✅ No validation by default (faster tests)
- ✅ Isolated store instances
- ✅ Full TypeScript support
- ✅ Works with React Testing Library, Vitest, Jest

For detailed documentation, see [Testing Guide](./TESTING.md).

---

## 📖 API Reference

... (существующий контент) ...
```

---

## 📝 Содержание секции

### Вариант 1: Минимальный

```markdown
## 🧪 Testing

@nexus-state/form includes testing utilities to simplify form tests.

```typescript
import { createTestForm } from '@nexus-state/form/testing';

const form = createTestForm({
  initialValues: { name: '', email: '' },
});

form.setFieldValue('name', 'John');
expect(form.values.name).toBe('John');
```

See [Testing Guide](./TESTING.md) for more examples.
```

### Вариант 2: Развёрнутый

```markdown
## 🧪 Testing

Testing forms is easy with built-in utilities that require no setup.

### Quick Start

```typescript
import { createTestForm } from '@nexus-state/form/testing';

describe('MyForm', () => {
  it('should update field value', () => {
    const form = createTestForm({
      initialValues: { name: '', email: '' },
    });

    form.setFieldValue('name', 'John');
    expect(form.values.name).toBe('John');
  });
});
```

### Features

| Utility | Description | Use Case |
|---------|-------------|----------|
| `createTestForm()` | Form without validation | UI tests, interaction tests |
| `createTestFormWithValidation()` | Form with validation | Validation logic tests |
| `waitForValidation()` | Wait for async validation | Async validation tests |

### Examples

**Test without validation:**
```typescript
const form = createTestForm({
  initialValues: { username: '' },
});
```

**Test with Zod schema:**
```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

const form = createTestFormWithValidation({
  initialValues: { email: '' },
  schemaType: 'zod',
  schemaConfig: schema,
});
```

For comprehensive documentation, see [Testing Guide](./TESTING.md).
```

### Вариант 3: С React примером

```markdown
## 🧪 Testing

@nexus-state/form provides testing utilities for all scenarios.

### Basic Testing

```typescript
import { createTestForm } from '@nexus-state/form/testing';

const form = createTestForm({
  initialValues: { name: '', email: '' },
});

form.setFieldValue('name', 'John');
expect(form.values.name).toBe('John');
```

### React Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { createTestForm } from '@nexus-state/form/testing';
import { MyForm } from './MyForm';

it('should submit form', async () => {
  const form = createTestForm({
    initialValues: { name: '', email: '' },
  });

  const mockSubmit = vi.fn();
  form.submit = mockSubmit;

  render(<MyForm formAtom={form} />);
  
  fireEvent.click(screen.getByText('Submit'));
  
  expect(mockSubmit).toHaveBeenCalled();
});
```

### Available Utilities

- `createTestForm()` — Fast form without validation
- `createTestFormWithValidation()` — Form with custom validation
- `waitForValidation()` — Wait for async validation

See [Testing Guide](./TESTING.md) for complete documentation.
```

---

## 🔗 Связанные файлы

- `packages/form/README.md` — Основной файл для обновления
- `packages/form/TESTING.md` — Полная документация (TASK-010)

---

## 📚 Ресурсы

- Существующий README: `packages/form/README.md`
- Примеры из других пакетов: `packages/core/README.md`

---

## 🎯 Метрики успеха

- [ ] Секция "Testing" видна в оглавлении README.md
- [ ] Пример кода работает без ошибок
- [ ] Ссылка на TESTING.md активна
- [ ] Добавлено ≥ 2 примеров использования

---

## 📝 Заметки

- Сохранять тот же стиль, что в остальном README
- Использовать существующие цвета/эмодзи
- Не дублировать контент из TESTING.md
- Указывать актуальные версии API
