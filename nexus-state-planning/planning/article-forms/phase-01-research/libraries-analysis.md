# Анализ библиотек для управления формами

**Дата:** Март 2026  
**Автор:** @astashkin-a  
**Статус:** ✅ Completed

---

## 📋 Содержание

1. [React Hook Form](#1-react-hook-form)
2. [Formik](#2-formik)
3. [Final Form](#3-final-form)
4. [@nexus-state/form](#4-nexus-stateform)
5. [Сравнительная матрица](#5-сравнительная-матрица)

---

## 1. React Hook Form

**Версия:** 8.x (2026)  
**Размер:** ~12KB (gzip)  
**Лицензия:** MIT  
**Репозиторий:** https://github.com/react-hook-form/react-hook-form

### Философия

«Minimize re-renders, maximize performance» — управление формами с минимальными ререндерами через uncontrolled компоненты.

### Ключевые возможности

- ✅ Uncontrolled подход (меньше ререндеров)
- ✅ Валидация через schema (Yup, Zod, Joi)
- ✅ Встроенная валидация
- ✅ Обработка ошибок
- ✅ Nested fields
- ✅ Form arrays
- ✅ Watch/subscribe к значениям
- ✅ Интеграция с UI библиотеками

### API Overview

#### useForm

```tsx
import { useForm } from 'react-hook-form';

function MyForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
    reset,
    setValue,
    getValues,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
    },
    mode: 'onChange', // 'onBlur', 'onSubmit', 'all'
    reValidateMode: 'onChange',
    resolver: yupResolver(schema), // Для schema validation
  });
  
  const onSubmit = (data) => {
    console.log(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('name', { required: 'Name required' })}
      />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input
        {...register('email', { 
          required: 'Email required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email'
          }
        })}
      />
      {errors.email && <span>{errors.email.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

#### useFieldArray (для массивов)

```tsx
import { useForm, useFieldArray } from 'react-hook-form';

function DynamicForm() {
  const { register, control, handleSubmit } = useForm();
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray({
    control,
    name: 'emails',
  });
  
  return (
    <form>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`emails.${index}.value`)} />
          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      
      <button type="button" onClick={() => append({ value: '' })}>Add</button>
      <button type="button" onClick={() => prepend({ value: '' })}>Prepend</button>
    </form>
  );
}
```

#### watch (подписка на значения)

```tsx
function WatchExample() {
  const { register, watch } = useForm();
  
  // Подписка на одно поле
  const password = watch('password');
  
  // Подписка на несколько полей
  const values = watch(['name', 'email']);
  
  // Подписка на все поля
  const allValues = watch();
  
  // Callback при изменении
  watch((value, { name, type }) => {
    console.log(value, name, type);
  });
  
  return (
    <form>
      <input type="password" {...register('password')} />
      <input type="password" {...register('confirmPassword')} />
      {password !== watch('confirmPassword') && (
        <span>Passwords do not match</span>
      )}
    </form>
  );
}
```

#### Controller (для controlled компонентов)

```tsx
import { Controller } from 'react-hook-form';

function ControlledExample() {
  const { control } = useForm();
  
  return (
    <form>
      <Controller
        name="select"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Select
            {...field}
            error={error}
            options={['Option 1', 'Option 2']}
          />
        )}
      />
    </form>
  );
}
```

### Конфигурация

```tsx
const { register, handleSubmit, formState } = useForm({
  // Значения по умолчанию
  defaultValues: {
    name: '',
    email: '',
  },
  
  // Режим валидации
  mode: 'onBlur', // 'onSubmit', 'onChange', 'onBlur', 'all', 'onTouched'
  
  // Режим повторной валидации
  reValidateMode: 'onChange',
  
  // Resolver для schema validation
  resolver: yupResolver(schema),
  
  // Задержка валидации
  delayError: 200,
  
  // Критерии валидации
  criteriaMode: 'firstError', // 'all' для всех ошибок
  
  // Should use native validation
  shouldUseNativeValidation: false,
  
  // Focus first error on submit
  shouldFocusError: true,
});
```

### Преимущества

| Преимущество | Описание |
|--------------|----------|
| **Производительность** | Минимальные ререндеры |
| **Размер** | ~12KB (меньше Formik) |
| **Гибкость** | Uncontrolled + controlled |
| **Schema integration** | Yup, Zod, Joi, Superstruct |
| **Комьюнити** | Огромное, активное |
| **Документация** | Отличная, с примерами |

### Недостатки

| Недостаток | Описание |
|------------|----------|
| **Uncontrolled по умолчанию** | Не всегда удобно |
| **Сложность для новичков** | Больше концепций |
| **Меньше встроенных фич** | Нужно доустанавливать |

---

## 2. Formik

**Версия:** 2.x (2026)  
**Размер:** ~15KB (gzip)  
**Лицензия:** MIT  
**Репозиторий:** https://github.com/jaredpalmer/formik

### Философия

«Build forms in React, without the tears» — полный набор инструментов для форм с controlled подходом.

### Ключевые возможности

- ✅ Controlled подход
- ✅ Встроенная валидация
- ✅ Schema validation (Yup, Zod)
- ✅ Обработка ошибок
- ✅ Nested fields
- ✅ Form arrays
- ✅ Submission handling
- ✅ Touch tracking

### API Overview

#### useFormik

```tsx
import { useFormik } from 'formik';

function MyForm() {
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
    },
    validate: (values) => {
      const errors = {};
      if (!values.name) {
        errors.name = 'Name required';
      }
      if (!values.email) {
        errors.email = 'Email required';
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
        errors.email = 'Invalid email';
      }
      return errors;
    },
    onSubmit: (values) => {
      console.log(values);
    },
  });
  
  return (
    <form onSubmit={formik.handleSubmit}>
      <input
        name="name"
        value={formik.values.name}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      {formik.touched.name && formik.errors.name && (
        <div>{formik.errors.name}</div>
      )}
      
      <input
        name="email"
        value={formik.values.email}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
      />
      {formik.touched.email && formik.errors.email && (
        <div>{formik.errors.email}</div>
      )}
      
      <button type="submit" disabled={formik.isSubmitting}>
        {formik.isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

#### withFormik (HOC)

```tsx
import { withFormik } from 'formik';

const MyForm = ({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
  <form onSubmit={handleSubmit}>
    <input
      name="name"
      value={values.name}
      onChange={handleChange}
    />
    {touched.name && errors.name && <div>{errors.name}</div>}
    <button type="submit" disabled={isSubmitting}>Submit</button>
  </form>
);

const FormikMyForm = withFormik({
  mapPropsToValues: () => ({ name: '' }),
  validate: (values) => {
    const errors = {};
    if (!values.name) errors.name = 'Required';
    return errors;
  },
  handleSubmit: (values, { setSubmitting }) => {
    console.log(values);
    setSubmitting(false);
  },
})(MyForm);
```

#### Field и Form компоненты

```tsx
import { Formik, Form, Field, ErrorMessage } from 'formik';

function MyForm() {
  return (
    <Formik
      initialValues={{ name: '', email: '' }}
      validate={validate}
      onSubmit={onSubmit}
    >
      {({ isSubmitting }) => (
        <Form>
          <Field name="name" type="text" />
          <ErrorMessage name="name" component="div" />
          
          <Field name="email" type="email" />
          <ErrorMessage name="email" component="div" />
          
          <button type="submit" disabled={isSubmitting}>
            Submit
          </button>
        </Form>
      )}
    </Formik>
  );
}
```

#### FieldArray

```tsx
import { FieldArray } from 'formik';

function DynamicForm() {
  return (
    <Formik initialValues={{ emails: [''] }} onSubmit={onSubmit}>
      {({ values }) => (
        <Form>
          <FieldArray name="emails">
            {({ push, remove }) => (
              <div>
                {values.emails.map((email, index) => (
                  <div key={index}>
                    <Field name={`emails.${index}`} />
                    <button type="button" onClick={() => remove(index)}>
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => push('')}>Add</button>
              </div>
            )}
          </FieldArray>
        </Form>
      )}
    </Formik>
  );
}
```

### Конфигурация

```tsx
const formik = useFormik({
  // Начальные значения
  initialValues: { name: '', email: '' },
  
  // Валидация
  validate: (values) => errors,
  validationSchema: yupSchema, // Schema validation
  
  // Сабмит
  onSubmit: (values, helpers) => {
    // values: значения формы
    // helpers: { setSubmitting, setStatus, setErrors, etc. }
  },
  
  // Initial errors
  initialErrors: {},
  
  // Initial touched
  initialTouched: {},
  
  // Initial status
  initialStatus: {},
  
  // Validate on blur
  validateOnBlur: true,
  
  // Validate on change
  validateOnChange: true,
  
  // Validate on mount
  validateOnMount: false,
  
  // Submit count
  initialSubmitCount: 0,
});
```

### Преимущества

| Преимущество | Описание |
|--------------|----------|
| **Полный набор** | Всё из коробки |
| **Controlled** | Предсказуемое поведение |
| **Комьюнити** | Большое, зрелое |
| **Документация** | Подробная |
| **Стабильность** | Зрелая библиотека |

### Недостатки

| Недостаток | Описание |
|------------|----------|
| **Производительность** | Больше ререндеров |
| **Размер** | ~15KB (больше RHF) |
| **Boilerplate** | Больше кода |
| **Устаревание** | Меньше активных обновлений |

---

## 3. Final Form

**Версия:** 4.x (2026)  
**Размер:** ~6KB (gzip)  
**Лицензия:** MIT  
**Репозиторий:** https://github.com/final-form/final-form

### Философия

«Framework agnostic form state management» — минималистичное управление состоянием форм без привязки к React.

### Ключевые возможности

- ✅ Framework agnostic
- ✅ Подписки на изменения
- ✅ Валидация
- ✅ Async validation
- ✅ Field-level validation
- ✅ Form-level validation
- ✅ Mutators (кастомизация)
- ✅ Plugins

### API Overview

#### createForm

```tsx
import { createForm } from 'final-form';

const form = createForm({
  onSubmit: async (values) => {
    await submitToServer(values);
  },
  validate: (values) => {
    const errors = {};
    if (!values.name) errors.name = 'Required';
    return errors;
  },
});

// Подписка на состояние
form.subscribe((state) => {
  console.log(state.values);
  console.log(state.errors);
  console.log(state.valid);
}, { values: true, errors: true, valid: true });

// Регистрация поля
form.registerField('name', (field) => {
  field.change('John');
}, { value: true });
```

#### React Final Form

```tsx
import { Form, Field } from 'react-final-form';

function MyForm() {
  return (
    <Form
      onSubmit={onSubmit}
      validate={validate}
      render={({ handleSubmit, submitting, pristine, values }) => (
        <form onSubmit={handleSubmit}>
          <Field name="name">
            {({ input, meta }) => (
              <div>
                <input {...input} placeholder="Name" />
                {meta.error && meta.touched && <span>{meta.error}</span>}
              </div>
            )}
          </Field>
          
          <Field name="email">
            {({ input, meta }) => (
              <div>
                <input {...input} type="email" placeholder="Email" />
                {meta.error && meta.touched && <span>{meta.error}</span>}
              </div>
            )}
          </Field>
          
          <button type="submit" disabled={submitting || pristine}>
            Submit
          </button>
        </form>
      )}
    />
  );
}
```

#### Field-level validation

```tsx
<Field
  name="email"
  validate={(value) => {
    if (!value) return 'Required';
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
      return 'Invalid email';
    }
    return undefined;
  }}
  validateFields={[]} // Не валидировать другие поля при изменении
>
  {({ input, meta }) => (
    <input {...input} type="email" />
  )}
</Field>
```

#### Mutators

```tsx
const form = createForm({
  onSubmit,
  mutators: {
    // Кастомный мутатор
    setValue: ([name, value], state, { changeValue }) => {
      changeValue(state, name, () => value);
    },
  },
});

// Использование
form.mutators.setValue('name', 'John');
```

### Преимущества

| Преимущество | Описание |
|--------------|----------|
| **Framework agnostic** | Работает с любым фреймворком |
| **Размер** | ~6KB (минимальный) |
| **Подписки** | Гранулярные подписки |
| **Гибкость** | Кастомные мутаторы |
| **Plugins** | Экосистема плагинов |

### Недостатки

| Недостаток | Описание |
|------------|----------|
| **Меньше абстракций** | Больше кода |
| **Сложность** | Нужно понимать подписки |
| **Меньше примеров** | Меньше комьюнити |

---

## 4. @nexus-state/form

**Версия:** 0.x (2026)  
**Размер:** ~8KB (gzip, оценка)  
**Лицензия:** MIT  
**Репозиторий:** https://github.com/eustatos/nexus-state

### Философия

Интеграция управления формами с атомарной архитектурой Nexus State. Time Travel debugging из коробки.

### Ключевые возможности

- ✅ Atom-based архитектура
- ✅ Time Travel Debugging
- ✅ Валидация через schema
- ✅ Async validation
- ✅ Form arrays
- ✅ Multi-step forms
- ✅ Интеграция с Query
- ✅ Framework-agnostic (React, Vue, Svelte)

### API Overview

#### createFormAtom

```tsx
import { createFormAtom } from '@nexus-state/form';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18),
});

const formAtom = createFormAtom(userSchema, {
  name: '',
  email: '',
  age: 0,
});

// Использование
function MyForm() {
  const [formState, setFormState] = useAtom(formAtom);
  
  const { values, errors, touched, isValid, isSubmitting } = formState;
  
  const handleChange = (field, value) => {
    formAtom.setField(field, value);
  };
  
  const handleSubmit = async () => {
    await formAtom.submit();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={values.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      {errors.name && <span>{errors.name}</span>}
      
      <input
        value={values.email}
        onChange={(e) => handleChange('email', e.target.value)}
      />
      {errors.email && <span>{errors.email}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

#### setField

```tsx
// Установка значения поля
formAtom.setField('name', 'John');

// Установка с валидацией
formAtom.setField('email', 'invalid', { validate: true });

// Установка нескольких полей
formAtom.setFields({ name: 'John', email: 'john@example.com' });
```

#### validate

```tsx
// Валидация всех полей
const isValid = await formAtom.validate();

// Валидация конкретного поля
const fieldValid = await formAtom.validateField('email');

// Валидация при изменении
formAtom.setField('email', 'new@email.com', { validate: true });
```

#### submit

```tsx
const result = await formAtom.submit({
  onSuccess: (data) => {
    console.log('Success:', data);
  },
  onError: (errors) => {
    console.log('Errors:', errors);
  },
});
```

#### reset

```tsx
// Сброс к начальным значениям
formAtom.reset();

// Сброс к конкретным значениям
formAtom.reset({ name: '', email: '' });
```

### Конфигурация

```tsx
const formAtom = createFormAtom(schema, initialValues, {
  // Режим валидации
  validateMode: 'onChange', // 'onBlur', 'onSubmit', 'onChange'
  
  // Debounce для async валидации
  validateDebounce: 300,
  
  // Revalidate при изменении
  reValidateOnChange: true,
  
  // Revalidate при blur
  reValidateOnBlur: true,
  
  // Focus first error on submit
  focusFirstError: true,
  
  // Clear errors on change
  clearErrorOnChange: true,
  
  // Clear error on blur
  clearErrorOnBlur: false,
});
```

### Преимущества

| Преимущество | Описание |
|--------------|----------|
| **Time Travel** | Отладка истории изменений |
| **Framework-agnostic** | React, Vue, Svelte |
| **Atom-based** | Гранулярные подписки |
| **Интеграция** | С Query и другими Nexus State |
| **Размер** | ~8KB (компактный) |

### Недостатки

| Недостаток | Описание |
|------------|----------|
| **Молодой пакет** | Версия 0.x, меньше стабильности |
| **Маленькое комьюнити** | Меньше ресурсов |
| **Документация** | В разработке |

---

## 5. Сравнительная матрица

### Функциональность

| Функция | React Hook Form | Formik | Final Form | @nexus-state/form |
|---------|-----------------|--------|------------|-------------------|
| **Controlled** | ⚠️ Частично | ✅ | ✅ | ✅ |
| **Uncontrolled** | ✅ | ⚠️ Частично | ✅ | ⚠️ Частично |
| **Schema validation** | ✅ | ✅ | ✅ | ✅ |
| **Field-level validation** | ✅ | ✅ | ✅ | ✅ |
| **Form-level validation** | ✅ | ✅ | ✅ | ✅ |
| **Async validation** | ✅ | ✅ | ✅ | ✅ |
| **Form arrays** | ✅ | ✅ | ✅ | ✅ |
| **Nested fields** | ✅ | ✅ | ✅ | ✅ |
| **Multi-step forms** | ⚠️ Вручную | ⚠️ Вручную | ⚠️ Вручную | ✅ Встроенные |
| **Time Travel** | ❌ | ❌ | ❌ | ✅ |
| **Framework-agnostic** | ❌ | ❌ | ✅ | ✅ |
| **DevTools** | ❌ | ❌ | ⚠️ Плагины | ✅ |

### Технические характеристики

| Характеристика | RHF | Formik | Final Form | @nexus-state/form |
|----------------|-----|--------|------------|-------------------|
| **Размер (gzip)** | ~12KB | ~15KB | ~6KB | ~8KB |
| **Версия** | 8.x | 2.x | 4.x | 0.x |
| **Лицензия** | MIT | MIT | MIT | MIT |
| **React 17+** | ✅ | ✅ | ✅ | ✅ |
| **TypeScript** | ✅ | ✅ | ✅ | ✅ |

### DX (Developer Experience)

| Аспект | RHF | Formik | Final Form | @nexus-state/form |
|--------|-----|--------|------------|-------------------|
| **API простота** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Документация** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Комьюнити** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Learning curve** | Средняя | Низкая | Высокая | Средняя |

### Производительность

| Метрика | RHF | Formik | Final Form | @nexus-state/form |
|---------|-----|--------|------------|-------------------|
| **Ререндеры** | Минимум | Средне | Минимум | Минимум |
| **Размер bundle** | Средний | Большой | Маленький | Средний |
| **Первая загрузка** | Быстро | Средне | Быстро | Быстро |

---

## 📚 Источники

1. [React Hook Form Docs](https://react-hook-form.com/)
2. [Formik Docs](https://formik.org/docs/overview)
3. [Final Form Docs](https://final-form.org/docs)
4. [Nexus State Form Docs](../../packages/form/README.md)

---

## 📝 Заметки

- React Hook Form — лучший выбор для производительности
- Formik — зрелый, но устаревающий
- Final Form — минималистичный, framework-agnostic
- @nexus-state/form — перспективный, Time Travel фича
