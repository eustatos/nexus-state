# Сравнительные таблицы API для форм

**Дата:** Март 2026  
**Статус:** ✅ Completed

---

## 1. API Comparison: Basic Form

| Аспект | React Hook Form | Formik | Final Form | @nexus-state/form |
|--------|-----------------|--------|------------|-------------------|
| **Hook/Function** | `useForm()` | `useFormik()` | `createForm()` | `createFormAtom()` |
| **Initial values** | `defaultValues` | `initialValues` | `initialValues` | `initialValues` |
| **Submit handler** | `handleSubmit(onSubmit)` | `formik.handleSubmit` | `onSubmit` в config | `formAtom.submit()` |
| **Values** | `watch()` / `getValues()` | `formik.values` | `state.values` | `formState.values` |
| **Errors** | `formState.errors` | `formik.errors` | `state.errors` | `formState.errors` |
| **Touched** | `formState.touchedFields` | `formik.touched` | `state.touched` | `formState.touched` |
| **Dirty** | `formState.isDirty` | `formik.dirty` | `state.dirty` | `formState.isDirty` |
| **Valid** | `formState.isValid` | `formik.isValid` | `state.valid` | `formState.isValid` |
| **Submitting** | `formState.isSubmitting` | `formik.isSubmitting` | `state.submitting` | `formState.isSubmitting` |
| **Reset** | `reset()` | `formik.resetForm()` | `form.reset()` | `formAtom.reset()` |
| **Set values** | `setValue(name, value)` | `formik.setValues()` | `form.change()` | `formAtom.setField()` |

### Примеры кода

**React Hook Form:**
```tsx
const { register, handleSubmit, formState } = useForm({
  defaultValues: { name: '', email: '' }
});

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('name', { required: true })} />
  {formState.errors.name && <span>Error</span>}
</form>
```

**Formik:**
```tsx
const formik = useFormik({
  initialValues: { name: '', email: '' },
  onSubmit: (values) => console.log(values),
});

<form onSubmit={formik.handleSubmit}>
  <input name="name" value={formik.values.name} onChange={formik.handleChange} />
  {formik.errors.name && <span>Error</span>}
</form>
```

**@nexus-state/form:**
```tsx
const formAtom = createFormAtom(schema, { name: '', email: '' });
const [formState] = useAtom(formAtom);

<form onSubmit={() => formAtom.submit()}>
  <input value={formState.values.name} onChange={(e) => formAtom.setField('name', e.target.value)} />
  {formState.errors.name && <span>Error</span>}
</form>
```

---

## 2. API Comparison: Validation

| Аспект | React Hook Form | Formik | Final Form | @nexus-state/form |
|--------|-----------------|--------|------------|-------------------|
| **Inline validation** | `register('name', { required: true })` | `validate: (values) => errors` | `validate: (values) => errors` | `schema` в createFormAtom |
| **Schema validation** | `resolver: yupResolver(schema)` | `validationSchema: schema` | `validate` функция | `schema` в createFormAtom |
| **Field-level** | `register('name', { validate: fn })` | `<Field validate={fn}>` | `field.validate` | `schema.field()` |
| **Form-level** | `useForm({ validate: fn })` | `validate: (values) => errors` | `validate: (values) => errors` | `schema` |
| **Async validation** | ✅ (через resolver) | ✅ | ✅ | ✅ |
| **Validate on** | `mode: 'onChange'` | `validateOnChange: true` | `validateOnBlur: true` | `validateMode: 'onChange'` |
| **Manual validate** | `trigger()` | `formik.validateForm()` | `form.validate()` | `formAtom.validate()` |
| **Validate field** | `trigger('name')` | `formik.validateField('name')` | — | `formAtom.validateField('name')` |

### Примеры кода

**React Hook Form:**
```tsx
const { register, trigger } = useForm({
  mode: 'onChange',
  resolver: yupResolver(schema),
});

<input {...register('email', { required: true, pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i })} />

// Manual validation
await trigger('email');
```

**Formik:**
```tsx
const formik = useFormik({
  initialValues: { email: '' },
  validate: (values) => {
    const errors = {};
    if (!values.email) errors.email = 'Required';
    return errors;
  },
  validationSchema: yupSchema,
});

// Manual validation
await formik.validateForm();
await formik.validateField('email');
```

**@nexus-state/form:**
```tsx
const formAtom = createFormAtom(
  z.object({ email: z.string().email() }),
  { email: '' }
);

// Manual validation
await formAtom.validate();
await formAtom.validateField('email');
```

---

## 3. API Comparison: Form Arrays

| Аспект | React Hook Form | Formik | Final Form | @nexus-state/form |
|--------|-----------------|--------|------------|-------------------|
| **Hook/Component** | `useFieldArray()` | `<FieldArray>` | — | `formAtom.addField()` |
| **Add** | `append()` | `push()` | — | `formAtom.addField(index, value)` |
| **Remove** | `remove(index)` | `remove(index)` | — | `formAtom.removeField(index)` |
| **Insert** | `insert(index, value)` | `insert(index, value)` | — | `formAtom.insertField(index, value)` |
| **Move** | `move(from, to)` | — | — | — |
| **Swap** | `swap(index1, index2)` | — | — | — |
| **Prepend** | `prepend(value)` | `unshift(value)` | — | — |
| **Fields** | `fields` array | `formik.values.arrayName` | — | `formState.values.arrayName` |

### Примеры кода

**React Hook Form:**
```tsx
const { control, register } = useForm();
const { fields, append, remove } = useFieldArray({
  control,
  name: 'emails',
});

{fields.map((field, index) => (
  <div key={field.id}>
    <input {...register(`emails.${index}.value`)} />
    <button type="button" onClick={() => remove(index)}>Remove</button>
  </div>
))}
<button type="button" onClick={() => append({ value: '' })}>Add</button>
```

**Formik:**
```tsx
<FieldArray name="emails">
  {({ push, remove }) => (
    <div>
      {formik.values.emails.map((email, index) => (
        <div key={index}>
          <Field name={`emails.${index}`} />
          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => push('')}>Add</button>
    </div>
  )}
</FieldArray>
```

---

## 4. API Comparison: Controlled Components

| Аспект | React Hook Form | Formik | Final Form | @nexus-state/form |
|--------|-----------------|--------|------------|-------------------|
| **Component** | `<Controller>` | `<Field>` | `<Field>` | `useAtom(formAtom)` |
| **Render prop** | `render={({ field, fieldState })}` | `children={({ field, form })}` | `children={({ input, meta })}` | — |
| **Value** | `field.value` | `field.value` | `input.value` | `formState.values.name` |
| **OnChange** | `field.onChange` | `field.onChange` | `input.onChange` | `formAtom.setField()` |
| **OnBlur** | `field.onBlur` | `field.onBlur` | `input.onBlur` | `formAtom.setField()` |
| **Error** | `fieldState.error` | `form.errors[name]` | `meta.error` | `formState.errors.name` |

### Примеры кода

**React Hook Form:**
```tsx
<Controller
  name="select"
  control={control}
  render={({ field, fieldState: { error } }) => (
    <Select {...field} error={error} options={options} />
  )}
/>
```

**Formik:**
```tsx
<Field name="select">
  {({ field, form, meta }) => (
    <Select {...field} error={meta.error} options={options} />
  )}
</Field>
```

**@nexus-state/form:**
```tsx
const [formState] = useAtom(formAtom);

<Select
  value={formState.values.select}
  onChange={(value) => formAtom.setField('select', value)}
  error={formState.errors.select}
  options={options}
/>
```

---

## 5. API Comparison: Multi-step Forms

| Аспект | React Hook Form | Formik | Final Form | @nexus-state/form |
|--------|-----------------|--------|------------|-------------------|
| **Built-in support** | ❌ | ❌ | ❌ | ✅ |
| **State management** | `useState` для step | `useState` для step | `useState` для step | `formAtom.setStep()` |
| **Validation per step** | `trigger()` | `validateForm()` | `validate()` | `formAtom.validateStep()` |
| **Progress tracking** | Вручную | Вручную | Вручную | `formState.currentStep` |
| **Data persistence** | Вручную | Вручную | Вручную | Автоматически |

### Примеры кода

**React Hook Form (manual):**
```tsx
const [step, setStep] = useState(1);
const { register, handleSubmit, trigger } = useForm();

const onNext = async () => {
  const isValid = await trigger(['name', 'email']); // Validate step 1 fields
  if (isValid) setStep(step + 1);
};
```

**@nexus-state/form:**
```tsx
const formAtom = createMultiStepForm(schema, {
  step1: { name: '', email: '' },
  step2: { address: '', city: '' },
});

const [formState] = useAtom(formAtom);

// Next step with validation
await formAtom.nextStep();

// Previous step
formAtom.prevStep();

// Go to specific step
formAtom.goToStep(2);
```

---

## 6. API Comparison: Async Validation

| Аспект | React Hook Form | Formik | Final Form | @nexus-state/form |
|--------|-----------------|--------|------------|-------------------|
| **Built-in support** | ✅ | ✅ | ✅ | ✅ |
| **Debounce** | Вручную | Вручную | Вручную | `validateDebounce: 300` |
| **On blur** | `mode: 'onBlur'` | `validateOnBlur: true` | `validateOnBlur: true` | `validateMode: 'onBlur'` |
| **Abort previous** | Вручную | Вручную | Вручную | Автоматически |
| **Loading state** | Вручную | `formik.isSubmitting` | Вручную | `formState.isValidating` |

### Примеры кода

**React Hook Form:**
```tsx
const { register } = useForm({
  mode: 'onBlur',
});

// Custom async validation
const checkUsername = async (value) => {
  const response = await fetch(`/api/check-username?username=${value}`);
  const result = await response.json();
  return result.exists ? 'Username taken' : undefined;
};

<input {...register('username', { validate: checkUsername })} />
```

**Formik:**
```tsx
const formik = useFormik({
  validateOnBlur: true,
  validate: async (values) => {
    const errors = {};
    if (values.username) {
      const response = await fetch(`/api/check-username?username=${values.username}`);
      const result = await response.json();
      if (result.exists) errors.username = 'Username taken';
    }
    return errors;
  },
});
```

**@nexus-state/form:**
```tsx
const formAtom = createFormAtom(
  z.object({
    username: z.string().refine(async (value) => {
      const response = await fetch(`/api/check-username?username=${value}`);
      const result = await response.json();
      return !result.exists;
    }, 'Username taken'),
  }),
  { username: '' },
  {
    validateDebounce: 300,
    validateMode: 'onBlur',
  }
);
```

---

## 7. Bundle Size Comparison

| Библиотека | Размер (min) | Размер (gzip) | Dependencies |
|------------|--------------|---------------|--------------|
| **Final Form** | ~15KB | ~6KB | None |
| **@nexus-state/form** | ~25KB | ~8KB | @nexus-state/core |
| **React Hook Form** | ~35KB | ~12KB | None |
| **Formik** | ~45KB | ~15KB | React, lodash |

### Визуализация

```
Размер bundle (gzip):

Final Form:         ██████ 6KB
@nexus-state/form:  ████████ 8KB
React Hook Form:    ████████████ 12KB
Formik:             ███████████████ 15KB
```

---

## 8. Features Matrix

| Функция | React Hook Form | Formik | Final Form | @nexus-state/form |
|---------|-----------------|--------|------------|-------------------|
| **Basic forms** | ✅ | ✅ | ✅ | ✅ |
| **Schema validation** | ✅ | ✅ | ✅ | ✅ |
| **Field-level validation** | ✅ | ✅ | ✅ | ✅ |
| **Async validation** | ✅ | ✅ | ✅ | ✅ |
| **Form arrays** | ✅ | ✅ | ❌ | ✅ |
| **Nested fields** | ✅ | ✅ | ✅ | ✅ |
| **Multi-step forms** | ⚠️ Manual | ⚠️ Manual | ⚠️ Manual | ✅ Built-in |
| **Controlled components** | ⚠️ Controller | ✅ | ✅ | ✅ |
| **Uncontrolled components** | ✅ | ⚠️ Manual | ✅ | ⚠️ Manual |
| **Time Travel** | ❌ | ❌ | ❌ | ✅ |
| **Framework-agnostic** | ❌ | ❌ | ✅ | ✅ |
| **DevTools** | ❌ | ❌ | ⚠️ Plugins | ✅ |
| **Integration with Query** | ⚠️ Manual | ⚠️ Manual | ⚠️ Manual | ✅ Built-in |

---

## 9. Decision Guide

| Сценарий | Рекомендация | Почему |
|----------|--------------|--------|
| **Производительность важна** | React Hook Form | Минимальные ререндеры |
| **Простые формы** | Formik | Простой API |
| **Framework-agnostic** | Final Form / @nexus-state/form | Работает везде |
| **Time Travel нужен** | @nexus-state/form | Единственный с этой фичей |
| **Сложные формы** | React Hook Form | Гибкость, производительность |
| **Multi-step формы** | @nexus-state/form | Встроенная поддержка |
| **Минимальный размер** | Final Form | ~6KB gzip |
| **Большое комьюнити** | React Hook Form | Огромная экосистема |
| **Интеграция с Nexus State** | @nexus-state/form | Бесшовная интеграция |

---

## 10. Learning Curve Comparison

| Уровень | React Hook Form | Formik | Final Form | @nexus-state/form |
|---------|-----------------|--------|------------|-------------------|
| **Beginner** | 2-3 дня | 1 день | 3-5 дней | 2-3 дня |
| **Intermediate** | 1 неделя | 2-3 дня | 1-2 недели | 1 неделя |
| **Advanced** | 2-3 недели | 1 неделя | 2-3 недели | 2-3 недели |

### Сложность концепций

| Концепция | React Hook Form | Formik | Final Form | @nexus-state/form |
|-----------|-----------------|--------|------------|-------------------|
| **Базовая форма** | 🟢 Easy | 🟢 Easy | 🟡 Medium | 🟢 Easy |
| **Валидация** | 🟡 Medium | 🟢 Easy | 🟡 Medium | 🟢 Easy |
| **Form arrays** | 🟡 Medium | 🟢 Easy | ❌ N/A | 🟢 Easy |
| **Controlled** | 🟡 Medium (Controller) | 🟢 Easy | 🟢 Easy | 🟢 Easy |
| **Async validation** | 🟡 Medium | 🟢 Easy | 🟡 Medium | 🟢 Easy |
| **Multi-step** | 🔴 Hard | 🔴 Hard | 🔴 Hard | 🟢 Easy |

---

## 📝 Заметки

- React Hook Form — лучший баланс производительности и DX
- Formik — зрелый, но устаревающий выбор
- Final Form — минималистичный, для framework-agnostic проектов
- @nexus-state/form — перспективный, уникальные фичи (Time Travel, Multi-step)
