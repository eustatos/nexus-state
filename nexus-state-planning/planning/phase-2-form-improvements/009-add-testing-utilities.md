# TASK-009: Добавить @nexus-state/form/testing entry point

**Статус:** Pending  
**Приоритет:** Высокий  
**Сложность:** Средняя  
**Оценка времени:** 4-6 часов

---

## 📋 Описание

Создать специализированный entry point `@nexus-state/form/testing` с утилитами для упрощения тестирования форм.

### Проблема

Пользователи библиотеки испытывают трудности при тестировании форм:
- Нет стандартных тестовых утилит
- Каждый проект реализует свои factory-функции
- Сложности с отключением валидации в тестах
- Дублирование кода тестовых хелперов

### Решение

Предоставить готовые тестовые утилиты:
- `createTestForm()` — форма без валидации для быстрых тестов
- `createTestFormWithValidation()` — форма с кастомной валидацией
- `waitForValidation()` — хелпер для ожидания async-валидации

---

## 🎯 Критерии приемки

### Обязательные

- [ ] Создан файл `packages/form/src/testing/index.ts`
- [ ] Экспортируется функция `createTestForm<TValues>(options)`
- [ ] Экспортируется функция `createTestFormWithValidation<TValues>(options)`
- [ ] Экспортируется функция `waitForValidation(form, timeout?)`
- [ ] Добавлен entry point в `package.json`:
  ```json
  "./testing": {
    "types": "./dist/testing/index.d.ts",
    "import": "./dist/testing/index.js",
    "require": "./dist/testing/index.js"
  }
  ```
- [ ] Все функции полностью типизированы
- [ ] Написаны unit-тесты для всех утилит
- [ ] Покрытие тестами ≥ 90%

### Дополнительные

- [ ] Экспортируется `createStore` для удобства
- [ ] Тип `CreateTestFormOptions<TValues>` документирован
- [ ] Примеры использования в JSDoc

---

## 📐 Технические требования

### Структура файлов

```
packages/form/
├── src/
│   └── testing/
│       ├── index.ts           # Основной файл
│       └── __tests__/
│           └── index.test.ts  # Тесты
├── package.json               # Обновить exports
└── TESTING.md                 # Документация (TASK-010)
```

### API функций

#### `createTestForm<TValues>(options)`

```typescript
interface CreateTestFormOptions<TValues extends FormValues> 
  extends Partial<Omit<FormOptions<TValues>, 'initialValues' | 'onSubmit'>> {
  initialValues?: Partial<TValues>;
  disableValidation?: boolean;
  store?: Store;
}

function createTestForm<TValues extends FormValues>(
  options?: CreateTestFormOptions<TValues>
): Form<TValues>;
```

**Поведение:**
- Создаёт новый `createStore()` если не предоставлен
- Отключает валидацию по умолчанию (`disableValidation: true`)
- Устанавливает `onSubmit: async () => {}` (no-op)
- Сохраняет типизацию через generics

#### `createTestFormWithValidation<TValues>(options)`

```typescript
function createTestFormWithValidation<TValues extends FormValues>(
  options: Omit<CreateTestFormOptions<TValues>, 'disableValidation'> & {
    validate?: FormOptions<TValues>['validate'];
    schemaType?: string;
    schemaConfig?: any;
  }
): Form<TValues>;
```

**Поведение:**
- Создаёт форму с включённой валидацией
- Поддерживает `validate`, `schemaType`, `schemaConfig`
- Для тестирования логики валидации

#### `waitForValidation(form, timeout?)`

```typescript
async function waitForValidation(
  form: Form<any>,
  timeout?: number
): Promise<void>;
```

**Поведение:**
- Ждёт завершения async-валидации всех полей
- Polling каждые 50ms
- Timeout по умолчанию 1000ms
- Бросает ошибку при превышении timeout

---

## 📝 Примеры использования

### Базовый тест без валидации

```typescript
import { createTestForm } from '@nexus-state/form/testing';

describe('MyForm', () => {
  it('должен обновлять значение поля', () => {
    const form = createTestForm({
      initialValues: { name: '', email: '' },
    });

    form.setFieldValue('name', 'John');
    expect(form.values.name).toBe('John');
    expect(form.isDirty).toBe(true);
  });
});
```

### Тест с валидацией

```typescript
import { createTestFormWithValidation } from '@nexus-state/form/testing';
import { z } from 'zod';

describe('Form Validation', () => {
  it('должен валидировать email', async () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const form = createTestFormWithValidation({
      initialValues: { email: '' },
      schemaType: 'zod',
      schemaConfig: schema,
    });

    form.setFieldValue('email', 'invalid');
    await form.validate();
    
    expect(form.errors.email).toBeDefined();
  });
});
```

### Тест async-валидации

```typescript
import { 
  createTestFormWithValidation, 
  waitForValidation 
} from '@nexus-state/form/testing';

describe('Async Validation', () => {
  it('должен ждать завершения валидации', async () => {
    const form = createTestFormWithValidation({
      initialValues: { username: '' },
      validate: async (values) => {
        await new Promise(r => setTimeout(r, 200));
        return values.username === 'taken' 
          ? { username: 'Username taken' } 
          : null;
      },
    });

    form.setFieldValue('username', 'taken');
    await waitForValidation(form);
    
    expect(form.errors.username).toBe('Username taken');
  });
});
```

### React компонент тест

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { createTestForm } from '@nexus-state/form/testing';
import { DictionaryForm } from './DictionaryForm';

describe('DictionaryForm', () => {
  it('должен отправлять форму', async () => {
    const form = createTestForm({
      initialValues: { 
        code: '', 
        name: '',
        type: 'SIMPLE' as const,
      },
    });

    const mockSubmit = vi.fn().mockResolvedValue({});
    form.submit = mockSubmit;

    render(<DictionaryForm formAtom={form} open onClose={() => {}} />);
    
    fireEvent.change(screen.getByLabelText('Код'), {
      target: { value: 'TEST_CODE' },
    });
    
    fireEvent.click(screen.getByText('Создать'));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
  });
});
```

---

## 🔗 Зависимости

### Блокирует
- TASK-010: Документация по тестированию

### Зависит от
- ✅ `createForm()` — существует
- ✅ `createStore()` — существует в @nexus-state/core
- ✅ Типы `Form`, `FormValues`, `FormOptions` — существуют

---

## 📚 Ресурсы

- [Testing Library](https://testing-library.com/)
- [Vitest](https://vitest.dev/)
- Существующие тесты: `packages/form/src/__tests__/`

---

## 🎯 Метрики успеха

- [ ] Время написания тестов сократилось на 30%
- [ ] Уменьшение бойлерплейта в тестах на 50%
- [ ] Покрытие тестами утилит ≥ 90%
- [ ] Документация понятна новым пользователям

---

## 📝 Заметки

- Утилиты не должны попадать в production bundle
- Важно сохранить полную типизацию
- Избегать глобального состояния в утилитах
- Поддерживать все режимы валидации
