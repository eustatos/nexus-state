# Часть 3: Advanced Patterns I

**Целевая длина:** 2500-3000 слов (~10-12 минут чтения)  
**Статус:** 📝 Draft  
**Дата создания:** Март 2026

---

## 🎯 Цели статьи

1. Показать реализацию Multi-step Forms (wizards)
2. Объяснить Dynamic Forms (conditional fields)
3. Научить работе с Form Arrays (repeatable fields)
4. Сравнить подходы RHF и @nexus-state/form
5. Дать практические примеры для каждого паттерна

---

## 📋 Детальная структура

### Введение (200-250 слов)

**Recap Частей 1-2:**
- Часть 1: Controlled vs Uncontrolled, Validation, Libraries
- Часть 2: Error Handling, Accessibility, Performance

**Переход к Advanced Patterns:**
- Базовые формы освоены
- Теперь сложные сценарии
- Real-world use cases

**Что будет в статье:**
- Multi-step Forms (регистрация, checkout)
- Dynamic Forms (conditional fields)
- Form Arrays (списки email, навыки)
- Примеры с RHF и @nexus-state/form

---

### 1. Multi-step Forms (700-800 слов)

#### 1.1. Что такое Multi-step Forms

**Определение:**
Формы, разделённые на несколько шагов (wizards)

**Use cases:**
- Регистрация пользователя (личные данные → контакты → настройки)
- Оформление заказа (корзина → доставка → оплата)
- Анкетирование (демография → опыт → предпочтения)
- Настройка профиля

**Преимущества:**
- ✅ Меньше когнитивной нагрузки
- ✅ Выше конверсия (не пугает длинной формой)
- ✅ Логическая группировка полей
- ✅ Возможность сохранения прогресса

#### 1.2. Pattern 1: State-based Approach

**Концепция:**
Текущий шаг хранится в React state

**Пример с React Hook Form:**
```tsx
function MultiStepForm() {
  const [step, setStep] = useState(1);
  const { register, handleSubmit, trigger, formState: { errors } } = useForm({
    mode: 'onChange'
  });

  const onNext = async () => {
    // Валидация полей текущего шага
    const fields = step === 1 ? ['name', 'email'] : ['address', 'city'];
    const isValid = await trigger(fields);
    
    if (isValid) {
      setStep(step + 1);
    }
  };

  const onPrev = () => setStep(step - 1);

  const onSubmit = (data) => {
    console.log('Final submit:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ProgressIndicator current={step} total={3} />
      
      {step === 1 && (
        <Step1 register={register} errors={errors} onNext={onNext} />
      )}
      
      {step === 2 && (
        <Step2 register={register} errors={errors} onNext={onNext} onPrev={onPrev} />
      )}
      
      {step === 3 && (
        <Step3 register={register} errors={errors} onPrev={onPrev} />
      )}
    </form>
  );
}
```

**Преимущества:**
- ✅ Простая реализация
- ✅ Полный контроль над навигацией

**Недостатки:**
- ❌ Теряется при refresh
- ❌ Нельзя поделиться ссылкой на шаг

#### 1.3. Pattern 2: URL-based Approach

**Концепция:**
Текущий шаг в URL (hash или query param)

**Пример:**
```tsx
function MultiStepForm() {
  const [searchParams, setSearchParams] = useSearchParams();
  const step = parseInt(searchParams.get('step') || '1');

  const goToStep = (newStep) => {
    setSearchParams({ step: newStep.toString() });
  };

  // ... остальная логика
}
```

**Преимущества:**
- ✅ Сохраняется при refresh
- ✅ Можно поделиться ссылкой
- ✅ История браузера работает

**Недостатки:**
- ❌ Сложнее реализация
- ❌ Нужна валидация доступа к шагам

#### 1.4. Progress Indicator

**Accessibility-friendly компонент:**
```tsx
function ProgressIndicator({ current, total }) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="progress-steps">
        {Array.from({ length: total }).map((_, i) => {
          const stepNumber = i + 1;
          const isComplete = stepNumber < current;
          const isCurrent = stepNumber === current;
          
          return (
            <li 
              key={i} 
              className={`step ${isComplete ? 'complete' : ''} ${isCurrent ? 'current' : ''}`}
            >
              <span aria-current={isCurrent ? 'step' : undefined}>
                Step {stepNumber}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

#### 1.5. Validation между шагами

**Стратегия:**
1. Валидировать только поля текущего шага
2. Не пускать дальше при ошибках
3. Сохранять данные между шагами

**Пример:**
```tsx
const stepFields = {
  1: ['name', 'email'],
  2: ['address', 'city', 'zip'],
  3: ['cardNumber', 'cvv']
};

const validateStep = async (step) => {
  const fields = stepFields[step];
  const isValid = await trigger(fields);
  return isValid;
};
```

#### 1.6. @nexus-state/form подход

**Встроенная поддержка multi-step:**
```tsx
const formAtom = createMultiStepForm(schema, {
  step1: { name: '', email: '' },
  step2: { address: '', city: '' },
  step3: { cardNumber: '', cvv: '' }
});

const [formState] = useAtom(formAtom);

// Навигация
await formAtom.nextStep(); // Валидация + переход
formAtom.prevStep();
formAtom.goToStep(2);

// Текущий шаг
console.log(formState.currentStep); // 1, 2, 3
```

**Преимущества:**
- ✅ Встроенная валидация по шагам
- ✅ Автоматическое сохранение данных
- ✅ Time Travel для всей истории

#### 1.7. API Comparison Table (из research)

| Аспект | RHF | @nexus-state/form |
|--------|-----|-------------------|
| Built-in support | ❌ | ✅ |
| State management | useState для step | formAtom.setStep() |
| Validation per step | trigger(fields) | formAtom.validateStep() |
| Progress tracking | Вручную | formState.currentStep |
| Data persistence | Вручную | Автоматически |

---

### 2. Dynamic Forms (600-700 слов)

#### 2.1. Что такое Dynamic Forms

**Определение:**
Формы, где поля показываются/скрываются в зависимости от значений других полей

**Use cases:**
- Анкеты с условными вопросами
- Настройка продукта (опции зависят от выбора)
- Кастомизация заказа
- Фильтры поиска

#### 2.2. Pattern 1: Conditional Rendering

**Простой пример:**
```tsx
function DynamicForm() {
  const { register, watch } = useForm();
  const vehicleType = watch('vehicleType');

  return (
    <form>
      <select {...register('vehicleType')}>
        <option value="">Select type</option>
        <option value="car">Car</option>
        <option value="boat">Boat</option>
        <option value="motorcycle">Motorcycle</option>
      </select>

      {(vehicleType === 'car' || vehicleType === 'motorcycle') && (
        <div>
          <label>Number of wheels</label>
          <input type="number" {...register('wheels', { required: true })} />
        </div>
      )}

      {vehicleType === 'boat' && (
        <div>
          <label>Length (feet)</label>
          <input type="number" {...register('length')} />
        </div>
      )}
    </form>
  );
}
```

#### 2.3. Pattern 2: Schema-driven

**Концепция:**
Описание условий в схеме

**Пример:**
```tsx
const formSchema = {
  fields: [
    {
      name: 'vehicleType',
      type: 'select',
      options: ['car', 'boat', 'motorcycle']
    },
    {
      name: 'wheels',
      type: 'number',
      visible: (values) => ['car', 'motorcycle'].includes(values.vehicleType),
      required: (values) => ['car', 'motorcycle'].includes(values.vehicleType)
    },
    {
      name: 'length',
      type: 'number',
      visible: (values) => values.vehicleType === 'boat'
    }
  ]
};

function SchemaDrivenForm({ schema }) {
  const [values, setValues] = useState({});

  return (
    <form>
      {schema.fields.map((field) => {
        // Проверка видимости
        if (field.visible && !field.visible(values)) {
          return null;
        }

        // Проверка обязательности
        const isRequired = field.required 
          ? typeof field.required === 'function' 
            ? field.required(values) 
            : field.required
          : false;

        return (
          <Field 
            key={field.name} 
            field={field} 
            value={values[field.name]}
            required={isRequired}
            onChange={(value) => setValues({ ...values, [field.name]: value })}
          />
        );
      })}
    </form>
  );
}
```

#### 2.4. Best Practices

**1. Сохранение значений скрытых полей:**
```tsx
// ✅ Хорошо: сохраняем значение
{showField && <input value={value} onChange={onChange} />}

// ❌ Плохо: теряем значение при скрытии
{showField ? <input value={value} onChange={onChange} /> : null}
```

**2. Валидация только видимых полей:**
```tsx
const validate = (values) => {
  const errors = {};
  
  schema.fields.forEach((field) => {
    // Валидируем только если поле видимо
    if (!field.visible || field.visible(values)) {
      if (field.required && !values[field.name]) {
        errors[field.name] = 'Required';
      }
    }
  });
  
  return errors;
};
```

**3. Accessibility:**
```tsx
// Скрытые поля должны быть aria-hidden
<div aria-hidden={!isVisible}>
  <input {...register('conditionalField')} />
</div>
```

---

### 3. Form Arrays (700-800 слов)

#### 3.1. Что такое Form Arrays

**Определение:**
Поля, которые можно добавлять/удалять динамически (repeatable fields)

**Use cases:**
- Несколько email адресов
- Список навыков
- Опыт работы (компания, должность, период)
- Образование
- Достижения

#### 3.2. React Hook Form: useFieldArray

**Базовый пример:**
```tsx
function EmailListForm() {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      emails: [{ value: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'emails'
  });

  const onSubmit = (data) => {
    console.log('Emails:', data.emails);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field, index) => (
        <div key={field.id} className="email-field">
          <label htmlFor={`emails.${index}.value`}>
            Email {index + 1}
          </label>
          <input
            id={`emails.${index}.value`}
            {...register(`emails.${index}.value`, {
              required: 'Email required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email'
              }
            })}
          />
          {errors.emails?.[index]?.value && (
            <span className="error">
              {errors.emails[index]?.value?.message}
            </span>
          )}
          {fields.length > 1 && (
            <button type="button" onClick={() => remove(index)}>
              Remove
            </button>
          )}
        </div>
      ))}
      
      <button type="button" onClick={() => append({ value: '' })}>
        Add Email
      </button>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

#### 3.3. Операции с массивами

**useFieldArray API:**
```tsx
const { fields, append, prepend, remove, insert, swap, move } = useFieldArray({
  control,
  name: 'items'
});

// Добавить в конец
append({ value: '' });

// Добавить в начало
prepend({ value: '' });

// Удалить по индексу
remove(2);

// Вставить по индексу
insert(1, { value: 'new' });

// Поменять местами
swap(0, 2);

// Переместить
move(0, 2);
```

#### 3.4. Сложный пример: Опыт работы

```tsx
interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

function WorkExperienceForm() {
  const { register, control, watch } = useForm<{ experience: WorkExperience[] }>({
    defaultValues: {
      experience: [{
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'experience'
  });

  return (
    <form>
      {fields.map((field, index) => {
        const isCurrent = watch(`experience.${index}.current`);
        
        return (
          <div key={field.id} className="experience-item">
            <h3>Experience {index + 1}</h3>
            
            <input
              {...register(`experience.${index}.company`, { required: true })}
              placeholder="Company"
            />
            
            <input
              {...register(`experience.${index}.position`, { required: true })}
              placeholder="Position"
            />
            
            <input
              type="date"
              {...register(`experience.${index}.startDate`, { required: true })}
            />
            
            <label>
              <input
                type="checkbox"
                {...register(`experience.${index}.current`)}
              />
              Currently working here
            </label>
            
            {!isCurrent && (
              <input
                type="date"
                {...register(`experience.${index}.endDate`, { required: true })}
              />
            )}
            
            <textarea
              {...register(`experience.${index}.description`)}
              placeholder="Description"
              rows={4}
            />
            
            {fields.length > 1 && (
              <button type="button" onClick={() => remove(index)}>
                Remove
              </button>
            )}
          </div>
        );
      })}
      
      <button type="button" onClick={() => append({
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      })}>
        Add Experience
      </button>
    </form>
  );
}
```

#### 3.5. Best Practices

**1. Уникальные ключи (НЕ index):**
```tsx
// ✅ Хорошо: используем field.id
{fields.map((field, index) => (
  <div key={field.id}>...</div>
))}

// ❌ Плохо: используем index
{fields.map((field, index) => (
  <div key={index}>...</div>
))}
```

**2. Минимум 1 элемент:**
```tsx
{fields.length > 1 && (
  <button onClick={() => remove(index)}>Remove</button>
)}
```

**3. Валидация каждого элемента:**
```tsx
{errors.items?.[index]?.value && (
  <span>{errors.items[index]?.value?.message}</span>
)}
```

#### 3.6. @nexus-state/form подход

```tsx
const formAtom = createFormAtom(
  z.object({
    emails: z.array(z.object({
      value: z.string().email()
    }))
  }),
  { emails: [{ value: '' }] }
);

// Операции
formAtom.addField('emails', { value: '' });
formAtom.removeField('emails', index);
formAtom.insertField('emails', index, { value: '' });
```

#### 3.7. API Comparison Table (из research)

| Операция | RHF | @nexus-state/form |
|----------|-----|-------------------|
| Add | append() | formAtom.addField() |
| Remove | remove(index) | formAtom.removeField(index) |
| Insert | insert(index, value) | formAtom.insertField(index, value) |
| Move | move(from, to) | — |
| Swap | swap(index1, index2) | — |

---

### 4. Заключение (200-250 слов)

#### Ключевые выводы

1. **Multi-step Forms:**
   - State-based для простоты
   - URL-based для persistence
   - @nexus-state/form для встроенной поддержки

2. **Dynamic Forms:**
   - Conditional rendering для простых случаев
   - Schema-driven для сложных
   - Валидировать только видимые поля

3. **Form Arrays:**
   - useFieldArray в RHF
   - Уникальные ключи (field.id)
   - Минимум 1 элемент

4. **Выбор подхода:**
   - RHF: гибкость, контроль
   - @nexus-state/form: встроенные фичи, меньше кода

#### Что дальше

В **Части 4** мы рассмотрим:
- Cross-field Validation (зависимые поля)
- Async Validation (debouncing, server checks)
- Hybrid Validation (client + server)
- Form Persistence (auto-save)
- Integration с Query

#### Ссылки

- [React Hook Form useFieldArray](https://react-hook-form.com/api/usefieldarray)
- [Multi-step Forms Best Practices](https://www.smashingmagazine.com/2017/05/better-form-design-one-thing-per-page/)
- [Query Parts 1-2](../../article-query/) — Server validation

---

## 📊 Метрики

**Целевые показатели для dev.to:**
- Время чтения: 10-12 минут
- Engagement rate: >75%
- Reactions: >60
- Comments: >12

**SEO ключевые слова:**
- Multi-step forms
- Form wizard React
- Dynamic forms
- Form arrays
- useFieldArray
- Conditional fields

---

## ✅ Чек-лист перед публикацией

- [ ] Все примеры кода проверены
- [ ] Comparison tables актуальны
- [ ] Ссылки добавлены
- [ ] SEO оптимизация
- [ ] Вычитка
- [ ] Проверка длины (2500-3000 слов)
- [ ] Cover image
