# Часть 1: Foundations & Patterns

**Целевая длина:** 2000-2500 слов (~8-10 минут чтения)  
**Статус:** 📝 Draft  
**Дата создания:** Март 2026

---

## 🎯 Цели статьи

1. Объяснить фундаментальные концепции управления формами
2. Сравнить подходы Controlled vs Uncontrolled
3. Показать паттерны валидации (Client, Server, Hybrid)
4. Представить schema-based validation
5. Сравнить популярные библиотеки для форм
6. Дать Decision Guide для выбора библиотеки

---

## 📋 Детальная структура

### Введение (200-250 слов)

**Hook 1: Проблема**
- Статистика: 60% разработчиков тратят >20% времени на формы
- Цитата из State of JS 2025: недовольство существующими решениями
- Примеры типичных проблем: валидация, ошибки, производительность

**Hook 2: Почему формы сложны**
- Формы = UI state + Server state + Validation state
- Множество edge cases: async validation, cross-field dependencies
- UX требования: accessibility, performance, error handling

**Thesis**
- Формы требуют особого подхода к state management
- Правильный выбор паттернов и библиотек критичен
- В этой серии: от foundations до advanced patterns

**Что будет в статье**
- Controlled vs Uncontrolled подходы
- Паттерны валидации
- Schema-based validation
- Сравнение библиотек
- Decision guide

---

### 1. Controlled vs Uncontrolled (400-450 слов)

#### 1.1. Определения

**Controlled Components**
```tsx
// Пример из research
const [value, setValue] = useState('');
<input value={value} onChange={(e) => setValue(e.target.value)} />
```

- React state = единственный источник истины
- Каждое изменение → ререндер
- Полный контроль над значением

**Uncontrolled Components**
```tsx
// Пример из research
const inputRef = useRef(null);
<input ref={inputRef} defaultValue="" />
// Доступ: inputRef.current.value
```

- DOM = источник истины
- Минимальные ререндеры
- Доступ через ref

#### 1.2. Сравнительная таблица

| Критерий | Controlled | Uncontrolled |
|----------|------------|--------------|
| Источник истины | React state | DOM |
| Ререндеры | При каждом изменении | Минимальные |
| Валидация | Мгновенная | При submit |
| Time Travel | ✅ Легко | ❌ Сложно |
| Бойлерплейт | Высокий | Низкий |

#### 1.3. Time Travel Perspective

**Почему Controlled идеальны для Time Travel:**
- История изменений в state
- Можно откатить к любому моменту
- Пример с undo/redo

```tsx
// Концептуальный пример
const [history, setHistory] = useState([]);
const undo = () => setValue(history[history.length - 2]);
```

#### 1.4. Когда использовать

**Controlled:**
- Мгновенная валидация
- Зависимые поля
- Форматирование ввода
- Time Travel debugging

**Uncontrolled:**
- Простые формы
- Большие формы (производительность)
- Интеграция с non-React библиотеками
- File inputs

**Ключевой вывод:** Controlled для сложной логики, Uncontrolled для простоты

---

### 2. Validation Patterns (400-450 слов)

#### 2.1. Client-side Validation

**Преимущества:**
- ✅ Мгновенная обратная связь
- ✅ Снижение нагрузки на сервер
- ✅ Работает офлайн

**Недостатки:**
- ❌ Можно обойти (DevTools)
- ❌ Дублирование логики
- ❌ Увеличение bundle size

**Пример:**
```tsx
const validate = (email) => {
  if (!email) return 'Email required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Invalid email format';
  }
  return null;
};
```

#### 2.2. Server-side Validation

**Преимущества:**
- ✅ Единый источник истины
- ✅ Нельзя обойти
- ✅ Доступ к БД (проверка уникальности)

**Недостатки:**
- ❌ Задержка (network latency)
- ❌ Нагрузка на сервер
- ❌ Не работает офлайн

**Пример:**
```tsx
const validateOnServer = async (email) => {
  const response = await fetch('/api/validate-email', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
  return response.json();
};
```

#### 2.3. Hybrid Validation (Best Practice)

**Стратегия:**
1. Client: формат, длина, обязательность
2. Server: уникальность, бизнес-правила

**Пример:**
```tsx
// Client: формат
const formatError = validateEmailFormat(email);
if (formatError) return formatError;

// Server: уникальность
const uniqueError = await checkEmailUnique(email);
return uniqueError;
```

**Timing:**
- Client validation: onChange (мгновенно)
- Server validation: onBlur (после ухода из поля)

**Ключевой вывод:** Hybrid = лучший UX + надёжность

---

### 3. Schema-based Validation (300-350 слов)

#### 3.1. Зачем нужны схемы

**Проблемы императивной валидации:**
- Много бойлерплейта
- Сложно поддерживать
- Нет type safety

**Решение: декларативные схемы**
- Описание правил в одном месте
- Type inference из схемы
- Переиспользование

#### 3.2. Zod Example

```tsx
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18+'),
  password: z.string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Need uppercase')
    .regex(/[0-9]/, 'Need number')
});

type User = z.infer<typeof userSchema>;
```

#### 3.3. Yup Example

```tsx
import * as yup from 'yup';

const userSchema = yup.object({
  name: yup.string().min(2).required(),
  email: yup.string().email().required(),
  age: yup.number().min(18).required()
});
```

#### 3.4. Преимущества

| Преимущество | Описание |
|--------------|----------|
| Type Safety | TypeScript types из схемы |
| Reusability | Одна схема для client + server |
| Composition | Комбинирование схем |
| Error Messages | Кастомизация сообщений |

**Ключевой вывод:** Schema-based validation = стандарт для production

---

### 4. Библиотеки: Сравнение (500-550 слов)

#### 4.1. React Hook Form

**Философия:** "Minimize re-renders, maximize performance"

**Ключевые особенности:**
- Uncontrolled подход (меньше ререндеров)
- ~12KB gzip
- Schema validation через resolvers
- Огромное комьюнити

**Пример:**
```tsx
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});

<input {...register('email', { required: true })} />
```

**Когда использовать:**
- Производительность критична
- Большие формы
- Нужна гибкость

#### 4.2. Formik

**Философия:** "Build forms in React, without the tears"

**Ключевые особенности:**
- Controlled подход
- ~15KB gzip
- Зрелая библиотека (но устаревающая)
- Простой API

**Пример:**
```tsx
const formik = useFormik({
  initialValues: { email: '' },
  validationSchema: yupSchema,
  onSubmit: (values) => console.log(values)
});

<input 
  name="email" 
  value={formik.values.email} 
  onChange={formik.handleChange} 
/>
```

**Когда использовать:**
- Простые формы
- Нужна стабильность
- Команда знакома с Formik

#### 4.3. Final Form

**Философия:** "Framework agnostic form state management"

**Ключевые особенности:**
- Framework-agnostic
- ~6KB gzip (самый маленький)
- Подписки на изменения
- Минималистичный

**Пример:**
```tsx
<Form onSubmit={onSubmit}>
  {({ handleSubmit }) => (
    <form onSubmit={handleSubmit}>
      <Field name="email">
        {({ input, meta }) => (
          <input {...input} />
        )}
      </Field>
    </form>
  )}
</Form>
```

**Когда использовать:**
- Минимальный bundle size
- Framework-agnostic проект
- Нужна гибкость подписок

#### 4.4. @nexus-state/form

**Философия:** "Atom-based forms with Time Travel"

**Ключевые особенности:**
- Atom-based архитектура
- Time Travel из коробки
- ~8KB gzip
- Framework-agnostic (React, Vue, Svelte)
- Multi-step forms встроенные

**Пример:**
```tsx
const formAtom = createFormAtom(schema, initialValues);
const [formState] = useAtom(formAtom);

<input 
  value={formState.values.email}
  onChange={(e) => formAtom.setField('email', e.target.value)}
/>
```

**Когда использовать:**
- Нужен Time Travel
- Сложные формы (multi-step, dynamic)
- Интеграция с Nexus State ecosystem

#### 4.5. Comparison Tables

**Таблица 1: API Comparison (из research)**

| Аспект | RHF | Formik | Final Form | @nexus-state/form |
|--------|-----|--------|------------|-------------------|
| Hook/Function | useForm() | useFormik() | createForm() | createFormAtom() |
| Initial values | defaultValues | initialValues | initialValues | initialValues |
| Submit | handleSubmit() | formik.handleSubmit | onSubmit | formAtom.submit() |
| Errors | formState.errors | formik.errors | state.errors | formState.errors |

**Таблица 2: Bundle Size (из research)**

| Библиотека | Размер (gzip) |
|------------|---------------|
| Final Form | ~6KB |
| @nexus-state/form | ~8KB |
| React Hook Form | ~12KB |
| Formik | ~15KB |

**Таблица 3: Features Matrix (из research)**

| Функция | RHF | Formik | Final Form | @nexus-state/form |
|---------|-----|--------|------------|-------------------|
| Schema validation | ✅ | ✅ | ✅ | ✅ |
| Form arrays | ✅ | ✅ | ❌ | ✅ |
| Multi-step | ⚠️ Manual | ⚠️ Manual | ⚠️ Manual | ✅ Built-in |
| Time Travel | ❌ | ❌ | ❌ | ✅ |
| Framework-agnostic | ❌ | ❌ | ✅ | ✅ |

---

### 5. Decision Guide (300-350 слов)

#### 5.1. По сценарию использования

**Производительность важна:**
→ React Hook Form
- Минимальные ререндеры
- Uncontrolled подход

**Простые формы:**
→ Formik
- Простой API
- Быстрый старт

**Минимальный bundle:**
→ Final Form
- ~6KB gzip
- Framework-agnostic

**Time Travel нужен:**
→ @nexus-state/form
- Единственный с этой фичей
- DevTools из коробки

**Сложные формы (multi-step, dynamic):**
→ @nexus-state/form или React Hook Form
- Встроенная поддержка vs гибкость

**Framework-agnostic:**
→ Final Form или @nexus-state/form
- Работают с любым фреймворком

#### 5.2. По размеру команды

**Большая команда:**
→ React Hook Form
- Огромное комьюнити
- Много примеров и решений

**Маленькая команда / стартап:**
→ @nexus-state/form
- Меньше бойлерплейта
- Быстрая разработка

#### 5.3. По опыту команды

**Новички в React:**
→ Formik
- Простой, понятный API
- Много туториалов

**Опытные разработчики:**
→ React Hook Form или @nexus-state/form
- Больше контроля
- Продвинутые фичи

#### 5.4. Рекомендация для Nexus State

**Если используете Nexus State:**
→ @nexus-state/form
- Бесшовная интеграция
- Единая архитектура
- Time Travel для всего приложения

**Если нет:**
→ React Hook Form
- Лучший баланс производительности и DX
- Зрелая экосистема

---

### 6. Заключение (150-200 слов)

#### Ключевые выводы

1. **Controlled vs Uncontrolled:**
   - Controlled для сложной логики и Time Travel
   - Uncontrolled для производительности

2. **Validation:**
   - Hybrid подход = best practice
   - Schema-based validation = стандарт

3. **Библиотеки:**
   - RHF: производительность
   - Formik: простота
   - Final Form: минимализм
   - @nexus-state/form: Time Travel + advanced features

4. **Выбор библиотеки:**
   - Зависит от требований проекта
   - Нет универсального решения
   - Decision guide поможет выбрать

#### Что дальше

В **Части 2** мы рассмотрим:
- Error Handling & UX best practices
- Accessibility (WAI-ARIA)
- Keyboard Navigation
- Performance Patterns
- Production-ready checklist

#### Ссылки

- [React Hook Form Docs](https://react-hook-form.com/)
- [Formik Docs](https://formik.org/)
- [Final Form Docs](https://final-form.org/)
- [Nexus State Forms](../../packages/form/README.md)
- [Time Travel Part 1](../../article-time-travel/part-01.md) — Controlled components & state

---

## 📊 Метрики

**Целевые показатели для dev.to:**
- Время чтения: 8-10 минут
- Engagement rate: >75%
- Reactions: >50
- Comments: >10

**SEO ключевые слова:**
- React forms
- Form validation
- Controlled vs Uncontrolled
- React Hook Form
- Form state management
- Schema validation

---

## ✅ Чек-лист перед публикацией

- [ ] Все примеры кода проверены и работают
- [ ] Comparison tables актуальны
- [ ] Ссылки на другие части серии добавлены
- [ ] Перекрёстные ссылки на Time Travel серию
- [ ] SEO оптимизация (title, description, tags)
- [ ] Вычитка на опечатки
- [ ] Проверка длины (2000-2500 слов)
- [ ] Cover image подготовлен
- [ ] dev.to series настроена
