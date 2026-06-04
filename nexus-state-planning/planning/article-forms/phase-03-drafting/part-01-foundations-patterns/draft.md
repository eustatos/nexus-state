# Forms в Nexus State: Часть 1 — Foundations & Patterns

**Статус:** ✅ Complete  
**Целевая длина:** 2000-2500 слов  
**Время чтения:** 8-10 минут

---

## Метаданные для dev.to

**Title:** Forms в Nexus State: Часть 1 — Foundations & Patterns  
**Tags:** react, forms, typescript, webdev  
**Series:** Forms в Nexus State  
**Published:** false

---

## Введение

Если вы когда-либо работали с формами в React, вы знаете, что это может быть настоящей болью. Согласно State of JS 2025, более 60% разработчиков тратят более 20% своего времени на работу с формами, и большинство из них недовольны существующими решениями.

Почему формы так сложны? Потому что они находятся на пересечении трёх типов состояния:
- **UI state** — что пользователь видит и с чем взаимодействует
- **Server state** — данные, которые нужно отправить на сервер
- **Validation state** — правила и ошибки валидации

Добавьте сюда множество edge cases (async validation, cross-field dependencies, multi-step forms), требования к UX (accessibility, performance, error handling), и вы получите один из самых сложных аспектов фронтенд-разработки.

В этой серии статей мы пройдём путь от базовых концепций до продвинутых паттернов управления формами в React и Nexus State. Мы рассмотрим:
- Фундаментальные подходы (Controlled vs Uncontrolled)
- Паттерны валидации (Client, Server, Hybrid)
- Schema-based validation
- Сравнение популярных библиотек
- Advanced patterns (multi-step, dynamic forms, form arrays)
- Form Builder и DSL для валидации

В этой первой части мы сосредоточимся на foundations — базовых концепциях, которые необходимо понимать для эффективной работы с формами.

---

## 1. Controlled vs Uncontrolled

Первое фундаментальное решение, которое вы должны принять при работе с формами в React — использовать Controlled или Uncontrolled подход.

### Controlled Components

В Controlled подходе React state является единственным источником истины для значений полей формы:

```tsx
function ControlledForm() {
  const [email, setEmail] = useState('');
  
  return (
    <input 
      value={email} 
      onChange={(e) => setEmail(e.target.value)} 
    />
  );
}
```

**Как это работает:**
1. Пользователь вводит символ
2. Срабатывает `onChange`
3. Обновляется state через `setEmail`
4. React ререндерит компонент
5. Input получает новое значение из state

**Преимущества:**
- ✅ Полный контроль над значением
- ✅ Мгновенная валидация
- ✅ Легко форматировать ввод (например, маски для телефонов)
- ✅ Простая реализация зависимых полей
- ✅ Идеально для Time Travel debugging

**Недостатки:**
- ❌ Ререндер при каждом изменении
- ❌ Больше бойлерплейта
- ❌ Может быть медленным для больших форм

### Uncontrolled Components

В Uncontrolled подходе DOM является источником истины:

```tsx
function UncontrolledForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = () => {
    console.log(emailRef.current?.value);
  };
  
  return (
    <input ref={emailRef} defaultValue="" />
  );
}
```

**Как это работает:**
1. Пользователь вводит символ
2. Значение сохраняется в DOM
3. React не ререндерится
4. Доступ к значению через ref при необходимости

**Преимущества:**
- ✅ Минимальные ререндеры
- ✅ Меньше кода
- ✅ Лучшая производительность для больших форм
- ✅ Проще интеграция с non-React библиотеками

**Недостатки:**
- ❌ Нет мгновенной валидации
- ❌ Сложнее форматировать ввод
- ❌ Труднее реализовать зависимые поля
- ❌ Сложно для Time Travel debugging

### Сравнительная таблица

| Критерий | Controlled | Uncontrolled |
|----------|------------|--------------|
| Источник истины | React state | DOM |
| Ререндеры | При каждом изменении | Минимальные |
| Валидация | Мгновенная | При submit |
| Time Travel | ✅ Легко | ❌ Сложно |
| Бойлерплейт | Высокий | Низкий |
| Производительность | Ниже | Выше |
| Форматирование ввода | ✅ Легко | ❌ Сложно |

### Time Travel Perspective

Одно из ключевых преимуществ Controlled подхода — возможность Time Travel debugging. Поскольку вся история изменений хранится в state, вы можете легко откатиться к любому предыдущему состоянию:

```tsx
function FormWithHistory() {
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  
  const handleChange = (newValue: string) => {
    setHistory([...history, value]);
    setValue(newValue);
  };
  
  const undo = () => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setValue(previous);
      setHistory(history.slice(0, -1));
    }
  };
  
  return (
    <>
      <input value={value} onChange={(e) => handleChange(e.target.value)} />
      <button onClick={undo} disabled={history.length === 0}>
        Undo
      </button>
    </>
  );
}
```

Это особенно полезно в @nexus-state/form, где Time Travel встроен из коробки.

### Когда использовать каждый подход

**Используйте Controlled когда:**
- Нужна мгновенная валидация
- Есть зависимые поля (например, password confirmation)
- Требуется форматирование ввода (маски, uppercase)
- Нужен Time Travel debugging
- Форма небольшая (< 20 полей)

**Используйте Uncontrolled когда:**
- Форма большая (> 20 полей)
- Производительность критична
- Нужна интеграция с non-React библиотеками
- Валидация только при submit
- File inputs (они всегда uncontrolled)

**Ключевой вывод:** Controlled для сложной логики и Time Travel, Uncontrolled для производительности и простоты.

---

## 2. Validation Patterns

Валидация — один из самых важных аспектов работы с формами. Существует три основных подхода: client-side, server-side и hybrid.

### Client-side Validation

Client-side валидация выполняется в браузере до отправки данных на сервер.

**Преимущества:**
- ✅ Мгновенная обратная связь пользователю
- ✅ Снижение нагрузки на сервер
- ✅ Работает офлайн
- ✅ Лучший UX

**Недостатки:**
- ❌ Можно обойти через DevTools
- ❌ Дублирование логики (client + server)
- ❌ Увеличение bundle size

**Пример:**

```tsx
function validateEmail(email: string): string | null {
  if (!email) {
    return 'Email обязателен';
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Неверный формат email';
  }
  
  return null;
}

function EmailForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (value: string) => {
    setEmail(value);
    setError(validateEmail(value));
  };
  
  return (
    <div>
      <input 
        value={email} 
        onChange={(e) => handleChange(e.target.value)}
        aria-invalid={!!error}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

### Server-side Validation

Server-side валидация выполняется на сервере после отправки данных.

**Преимущества:**
- ✅ Единый источник истины
- ✅ Нельзя обойти
- ✅ Доступ к БД (проверка уникальности)
- ✅ Безопасность

**Недостатки:**
- ❌ Задержка (network latency)
- ❌ Нагрузка на сервер
- ❌ Не работает офлайн
- ❌ Хуже UX

**Пример:**

```tsx
async function validateEmailOnServer(email: string): Promise<string | null> {
  try {
    const response = await fetch('/api/validate-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    return data.error || null;
  } catch (error) {
    return 'Ошибка проверки email';
  }
}
```

### Hybrid Validation (Best Practice)

Hybrid подход комбинирует client и server валидацию для оптимального баланса UX и безопасности.

**Стратегия:**
1. **Client:** формат, длина, обязательность (мгновенно)
2. **Server:** уникальность, бизнес-правила (async)

**Пример:**

```tsx
function HybridEmailValidation() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const handleBlur = async () => {
    // Сначала client validation
    const clientError = validateEmail(email);
    if (clientError) {
      setError(clientError);
      return;
    }
    
    // Затем server validation
    setIsValidating(true);
    const serverError = await validateEmailOnServer(email);
    setError(serverError);
    setIsValidating(false);
  };
  
  return (
    <div>
      <input 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={handleBlur}
      />
      {isValidating && <span>Проверка...</span>}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

**Timing стратегия:**
- **onChange:** Client validation (формат) — мгновенно
- **onBlur:** Server validation (уникальность) — после ухода из поля
- **onSubmit:** Финальная проверка всего

**Ключевой вывод:** Hybrid validation = лучший UX + надёжность + безопасность.

---

## 3. Schema-based Validation

Императивная валидация (как в примерах выше) быстро становится неуправляемой в больших формах. Schema-based подход решает эту проблему.

### Проблемы императивной валидации

```tsx
// Много бойлерплейта
function validateUser(user: User): Errors {
  const errors: Errors = {};
  
  if (!user.name) errors.name = 'Name required';
  if (user.name && user.name.length < 2) errors.name = 'Name too short';
  
  if (!user.email) errors.email = 'Email required';
  if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.email = 'Invalid email';
  }
  
  if (!user.age) errors.age = 'Age required';
  if (user.age && user.age < 18) errors.age = 'Must be 18+';
  
  // ... ещё 20 полей
  
  return errors;
}
```

**Проблемы:**
- Много повторяющегося кода
- Сложно поддерживать
- Нет type safety
- Трудно переиспользовать

### Решение: Декларативные схемы

Schema-based validation описывает правила декларативно:

**Zod пример:**

```tsx
import { z } from 'zod';

const userSchema = z.object({
  name: z.string()
    .min(2, 'Имя слишком короткое')
    .max(50, 'Имя слишком длинное'),
  
  email: z.string()
    .email('Неверный формат email'),
  
  age: z.number()
    .min(18, 'Должно быть 18+')
    .max(120, 'Неверный возраст'),
  
  password: z.string()
    .min(8, 'Минимум 8 символов')
    .regex(/[A-Z]/, 'Нужна заглавная буква')
    .regex(/[0-9]/, 'Нужна цифра')
    .regex(/[!@#$%^&*]/, 'Нужен спецсимвол')
});

// Type inference из схемы!
type User = z.infer<typeof userSchema>;

// Использование
const result = userSchema.safeParse(formData);
if (!result.success) {
  console.log(result.error.errors);
}
```

**Yup пример:**

```tsx
import * as yup from 'yup';

const userSchema = yup.object({
  name: yup.string()
    .min(2, 'Имя слишком короткое')
    .required('Имя обязательно'),
  
  email: yup.string()
    .email('Неверный формат email')
    .required('Email обязателен'),
  
  age: yup.number()
    .min(18, 'Должно быть 18+')
    .required('Возраст обязателен')
});

// Использование
try {
  await userSchema.validate(formData, { abortEarly: false });
} catch (error) {
  console.log(error.errors);
}
```

### Преимущества Schema-based Validation

| Преимущество | Описание |
|--------------|----------|
| **Type Safety** | TypeScript types автоматически из схемы |
| **Reusability** | Одна схема для client + server |
| **Composition** | Комбинирование и расширение схем |
| **Error Messages** | Кастомизация сообщений об ошибках |
| **Maintainability** | Легко читать и поддерживать |
| **Testing** | Легко тестировать схемы отдельно |

**Ключевой вывод:** Schema-based validation — стандарт для production приложений.


---

## 4. Библиотеки: Сравнение

Существует множество библиотек для работы с формами в React. Рассмотрим четыре самых популярных и сравним их подходы.

### React Hook Form

**Философия:** "Minimize re-renders, maximize performance"

React Hook Form использует uncontrolled подход для минимизации ререндеров и максимизации производительности.

**Ключевые особенности:**
- Uncontrolled подход (ref-based)
- Минимальные ререндеры
- ~12KB gzip
- Schema validation через resolvers
- Огромное комьюнити и экосистема
- Отличная документация

**Базовый пример:**

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

function LoginForm() {
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Login</button>
    </form>
  );
}
```

**Когда использовать:**
- Производительность критична
- Большие формы (>20 полей)
- Нужна гибкость и контроль
- Важна зрелая экосистема

### Formik

**Философия:** "Build forms in React, without the tears"

Formik — одна из первых популярных библиотек для форм в React. Использует controlled подход.

**Ключевые особенности:**
- Controlled подход
- ~15KB gzip
- Зрелая библиотека (но устаревающая)
- Простой и понятный API
- Хорошая документация

**Базовый пример:**

```tsx
import { useFormik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required()
});

function LoginForm() {
  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema,
    onSubmit: (values) => {
      console.log(values);
    }
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <input
        name="email"
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      {formik.touched.email && formik.errors.email && (
        <span>{formik.errors.email}</span>
      )}
      
      <input
        type="password"
        name="password"
        value={formik.values.password}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      {formik.touched.password && formik.errors.password && (
        <span>{formik.errors.password}</span>
      )}
      
      <button type="submit">Login</button>
    </form>
  );
}
```

**Когда использовать:**
- Простые формы
- Нужна стабильность
- Команда уже знакома с Formik
- Не критична производительность

### Final Form

**Философия:** "Framework agnostic form state management"

Final Form — минималистичная библиотека, не привязанная к React.

**Ключевые особенности:**
- Framework-agnostic (есть адаптеры для React, Vue, Angular)
- ~6KB gzip (самый маленький bundle)
- Подписки на изменения (subscription-based)
- Минималистичный API

**Базовый пример:**

```tsx
import { Form, Field } from 'react-final-form';

function LoginForm() {
  const onSubmit = (values) => {
    console.log(values);
  };

  const validate = (values) => {
    const errors = {};
    if (!values.email) {
      errors.email = 'Required';
    }
    if (!values.password || values.password.length < 8) {
      errors.password = 'Min 8 characters';
    }
    return errors;
  };

  return (
    <Form
      onSubmit={onSubmit}
      validate={validate}
      render={({ handleSubmit }) => (
        <form onSubmit={handleSubmit}>
          <Field name="email">
            {({ input, meta }) => (
              <div>
                <input {...input} type="email" />
                {meta.error && meta.touched && <span>{meta.error}</span>}
              </div>
            )}
          </Field>

          <Field name="password">
            {({ input, meta }) => (
              <div>
                <input {...input} type="password" />
                {meta.error && meta.touched && <span>{meta.error}</span>}
              </div>
            )}
          </Field>

          <button type="submit">Login</button>
        </form>
      )}
    />
  );
}
```

**Когда использовать:**
- Минимальный bundle size критичен
- Framework-agnostic проект
- Нужна гибкость подписок
- Простые требования

### @nexus-state/form

**Философия:** "Atom-based forms with Time Travel"

@nexus-state/form — часть экосистемы Nexus State, использует atom-based архитектуру.

**Ключевые особенности:**
- Atom-based state management
- Time Travel из коробки
- ~8KB gzip
- Framework-agnostic (React, Vue, Svelte)
- Multi-step forms встроенные
- Интеграция с Nexus State ecosystem

**Базовый пример:**

```tsx
import { createFormAtom } from '@nexus-state/form';
import { useAtom } from '@nexus-state/react';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const loginFormAtom = createFormAtom(schema, {
  email: '',
  password: ''
});

function LoginForm() {
  const [formState] = useAtom(loginFormAtom);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await loginFormAtom.submit();
    if (result.success) {
      console.log(result.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formState.values.email}
        onChange={(e) => loginFormAtom.setField('email', e.target.value)}
        aria-invalid={!!formState.errors.email}
      />
      {formState.errors.email && <span>{formState.errors.email}</span>}

      <input
        type="password"
        value={formState.values.password}
        onChange={(e) => loginFormAtom.setField('password', e.target.value)}
        aria-invalid={!!formState.errors.password}
      />
      {formState.errors.password && <span>{formState.errors.password}</span>}

      <button type="submit" disabled={formState.isSubmitting}>
        Login
      </button>
    </form>
  );
}
```

**Когда использовать:**
- Нужен Time Travel debugging
- Сложные формы (multi-step, dynamic)
- Интеграция с Nexus State
- Framework-agnostic требования

### Comparison Tables

**Таблица 1: API Comparison**

| Аспект | RHF | Formik | Final Form | @nexus-state/form |
|--------|-----|--------|------------|-------------------|
| Hook/Function | `useForm()` | `useFormik()` | `<Form>` | `createFormAtom()` |
| Initial values | `defaultValues` | `initialValues` | `initialValues` | второй аргумент |
| Register field | `{...register('name')}` | `name` + handlers | `<Field name>` | `setField()` |
| Submit | `handleSubmit()` | `formik.handleSubmit` | `onSubmit` prop | `formAtom.submit()` |
| Errors | `formState.errors` | `formik.errors` | `meta.error` | `formState.errors` |
| Touched | `formState.touchedFields` | `formik.touched` | `meta.touched` | `formState.touched` |

**Таблица 2: Bundle Size**

| Библиотека | Размер (minified + gzip) |
|------------|--------------------------|
| Final Form | ~6KB |
| @nexus-state/form | ~8KB |
| React Hook Form | ~12KB |
| Formik | ~15KB |

**Таблица 3: Features Matrix**

| Функция | RHF | Formik | Final Form | @nexus-state/form |
|---------|-----|--------|------------|-------------------|
| Schema validation | ✅ (через resolvers) | ✅ (Yup) | ⚠️ (вручную) | ✅ (Zod) |
| Form arrays | ✅ `useFieldArray` | ✅ `FieldArray` | ❌ | ✅ встроенные |
| Multi-step | ⚠️ вручную | ⚠️ вручную | ⚠️ вручную | ✅ встроенные |
| Time Travel | ❌ | ❌ | ❌ | ✅ |
| Framework-agnostic | ❌ (только React) | ❌ (только React) | ✅ | ✅ |
| TypeScript | ✅ | ✅ | ✅ | ✅ |
| DevTools | ✅ | ❌ | ❌ | ✅ |

**Таблица 4: Learning Curve**

| Библиотека | Сложность | Время на изучение |
|------------|-----------|-------------------|
| Formik | ⭐⭐ Низкая | 1-2 часа |
| React Hook Form | ⭐⭐⭐ Средняя | 2-4 часа |
| Final Form | ⭐⭐⭐ Средняя | 2-3 часа |
| @nexus-state/form | ⭐⭐⭐⭐ Выше средней | 3-5 часов |


---

## 5. Decision Guide

Выбор библиотеки для форм — важное решение, которое влияет на производительность, DX и поддерживаемость проекта. Вот практическое руководство по выбору.

### По сценарию использования

**Производительность критична (большие формы, >20 полей):**
→ **React Hook Form**
- Uncontrolled подход минимизирует ререндеры
- Отличная производительность даже для форм с 100+ полями
- Проверенное решение для enterprise приложений

**Простые формы (регистрация, логин, контакты):**
→ **Formik**
- Простой и понятный API
- Быстрый старт
- Хорошо подходит для типичных форм

**Минимальный bundle size критичен:**
→ **Final Form**
- Всего ~6KB gzip
- Framework-agnostic (можно использовать с любым фреймворком)
- Подходит для проектов, где каждый килобайт важен

**Time Travel debugging нужен:**
→ **@nexus-state/form**
- Единственная библиотека с встроенным Time Travel
- DevTools из коробки
- Идеально для сложной отладки

**Сложные формы (multi-step, dynamic, conditional):**
→ **@nexus-state/form** или **React Hook Form**
- @nexus-state/form: встроенная поддержка multi-step
- React Hook Form: максимальная гибкость для кастомных решений

**Framework-agnostic проект:**
→ **Final Form** или **@nexus-state/form**
- Оба работают с React, Vue, Svelte
- Final Form более минималистичный
- @nexus-state/form более feature-rich

### По размеру команды

**Большая команда (>10 разработчиков):**
→ **React Hook Form**
- Огромное комьюнити
- Множество примеров и решений на Stack Overflow
- Проверенные best practices
- Легко найти разработчиков с опытом

**Маленькая команда / стартап:**
→ **@nexus-state/form**
- Меньше бойлерплейта = быстрая разработка
- Встроенные фичи (multi-step, Time Travel)
- Не нужно изобретать велосипед

**Средняя команда (5-10 разработчиков):**
→ **React Hook Form** или **Formik**
- Баланс между простотой и возможностями
- Хорошая документация
- Достаточно примеров

### По опыту команды

**Новички в React:**
→ **Formik**
- Самый простой API
- Controlled подход более интуитивен
- Много туториалов для начинающих

**Средний уровень:**
→ **React Hook Form**
- Требует понимания refs и uncontrolled подхода
- Отличная документация помогает освоить
- Стандарт индустрии

**Опытные разработчики:**
→ **React Hook Form** или **@nexus-state/form**
- Больше контроля и гибкости
- Продвинутые фичи (Time Travel, DevTools)
- Можно оптимизировать под специфичные нужды

### Рекомендация для Nexus State

**Если вы уже используете Nexus State:**
→ **@nexus-state/form**
- Бесшовная интеграция с экосистемой
- Единая архитектура для всего приложения
- Time Travel для всего state (не только формы)
- Shared atoms между формами и другими частями приложения

**Если вы не используете Nexus State:**
→ **React Hook Form**
- Лучший баланс производительности и DX
- Зрелая экосистема
- Проверенное решение для production

### Матрица принятия решений

| Критерий | RHF | Formik | Final Form | @nexus-state/form |
|----------|-----|--------|------------|-------------------|
| **Производительность** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Простота изучения** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Bundle size** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Экосистема** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Advanced features** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **TypeScript** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Документация** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

**Ключевой вывод:** Нет универсального решения. Выбор зависит от требований проекта, размера команды и опыта разработчиков.

---

## Заключение

В этой первой части мы рассмотрели фундаментальные концепции управления формами в React:

### Ключевые выводы

**1. Controlled vs Uncontrolled:**
- Controlled для сложной логики, мгновенной валидации и Time Travel
- Uncontrolled для производительности и простоты
- Выбор зависит от требований конкретной формы

**2. Validation Patterns:**
- Client-side для мгновенной обратной связи
- Server-side для безопасности и проверки уникальности
- Hybrid подход = best practice (client формат + server уникальность)

**3. Schema-based Validation:**
- Декларативное описание правил
- Type safety из коробки
- Переиспользование схем
- Стандарт для production приложений

**4. Выбор библиотеки:**
- React Hook Form: производительность и зрелая экосистема
- Formik: простота для начинающих
- Final Form: минимальный bundle size
- @nexus-state/form: Time Travel и advanced features

**5. Decision Guide:**
- Анализируйте требования проекта
- Учитывайте размер и опыт команды
- Нет универсального решения

### Что дальше

Мы заложили фундамент для работы с формами. В следующих частях серии мы углубимся в практические аспекты:

**Часть 2: UX & Accessibility** (следующая неделя)
- Error Handling best practices
- WAI-ARIA атрибуты для accessibility
- Keyboard Navigation
- Performance optimization
- Production-ready checklist

**Часть 3: Advanced Patterns I**
- Multi-step Forms (wizards)
- Dynamic Forms (conditional fields)
- Form Arrays (repeatable fields)

**Часть 4: Advanced Patterns II**
- Cross-field Validation
- Async Validation с debouncing
- Form Persistence (auto-save)
- Integration с TanStack Query

**Часть 5: Form Builder**
- Schema-driven Architecture
- Drag-and-Drop интерфейс
- Live Preview и Export to Code

**Часть 6: DSL для валидации**
- Создание собственного DSL
- Parser Implementation
- Query Integration

### Полезные ссылки

**Документация библиотек:**
- [React Hook Form](https://react-hook-form.com/)
- [Formik](https://formik.org/)
- [Final Form](https://final-form.org/)
- [Zod](https://zod.dev/)
- [Yup](https://github.com/jquense/yup)

**Другие части серии Nexus State:**
- [Time Travel Part 1: Foundations](../../article-time-travel/part-01.md) — Controlled components & state management

**Обратная связь:**
Буду рад вашим комментариям и вопросам! Пишите в комментариях или в [GitHub Issues](https://github.com/eustatos/nexus-state/issues).

---

**Следующая статья:** [Часть 2: UX & Accessibility](../part-02-ux-accessibility/draft.md)

