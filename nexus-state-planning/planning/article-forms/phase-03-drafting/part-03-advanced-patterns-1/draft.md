# Forms в Nexus State: Часть 3 — Advanced Patterns I

**Статус:** ✅ Complete  
**Целевая длина:** 2500-3000 слов  
**Время чтения:** 10-12 минут

---

## Метаданные для dev.to

**Title:** Forms в Nexus State: Часть 3 — Advanced Patterns I  
**Tags:** react, forms, typescript, patterns  
**Series:** Forms в Nexus State  
**Published:** false

---

## Введение

В [первой части](../part-01-foundations-patterns/draft.md) мы изучили фундаментальные концепции: Controlled vs Uncontrolled подходы, паттерны валидации, schema-based validation и сравнили популярные библиотеки.

Во [второй части](../part-02-ux-accessibility/draft.md) мы освоили UX и Accessibility: error handling, WAI-ARIA атрибуты, keyboard navigation и performance optimization.

Теперь пришло время перейти к **Advanced Patterns** — сложным паттернам, которые встречаются в real-world приложениях:
- **Multi-step Forms** (wizards) — формы, разделённые на несколько шагов
- **Dynamic Forms** — формы с условными полями
- **Form Arrays** — повторяющиеся группы полей

Эти паттерны критичны для сложных приложений: регистрация пользователей, оформление заказов, анкетирование, настройка профилей.

---

## 1. Multi-step Forms

Multi-step forms (или wizards) — это формы, разделённые на несколько шагов. Они улучшают UX для длинных форм, снижая когнитивную нагрузку.

### Что такое Multi-step Forms

**Определение:**
Форма, разделённая на логические шаги, где пользователь заполняет один шаг за раз.

**Use cases:**
- **Регистрация:** личные данные → контакты → настройки
- **Checkout:** корзина → доставка → оплата
- **Анкетирование:** демография → опыт → предпочтения
- **Настройка:** базовые настройки → продвинутые → подтверждение

**Преимущества:**
- ✅ Меньше когнитивной нагрузки (не пугает длинной формой)
- ✅ Выше конверсия (пользователи не бросают форму)
- ✅ Логическая группировка полей
- ✅ Возможность сохранения прогресса
- ✅ Валидация по шагам

### Pattern 1: State-based Approach

Текущий шаг хранится в React state.

**React Hook Form пример:**

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Схемы для каждого шага
const step1Schema = z.object({
  name: z.string().min(2),
  email: z.string().email()
});

const step2Schema = z.object({
  address: z.string().min(5),
  city: z.string().min(2),
  zip: z.string().regex(/^\d{5}$/)
});

const step3Schema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/),
  cvv: z.string().regex(/^\d{3,4}$/)
});

function MultiStepForm() {
  const [step, setStep] = useState(1);
  const { 
    register, 
    handleSubmit, 
    trigger, 
    formState: { errors } 
  } = useForm({
    mode: 'onChange'
  });

  // Валидация текущего шага
  const validateStep = async () => {
    const fields = {
      1: ['name', 'email'],
      2: ['address', 'city', 'zip'],
      3: ['cardNumber', 'cvv']
    }[step];
    
    return await trigger(fields);
  };

  const onNext = async () => {
    const isValid = await validateStep();
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
        <Step2 
          register={register} 
          errors={errors} 
          onNext={onNext} 
          onPrev={onPrev} 
        />
      )}
      
      {step === 3 && (
        <Step3 register={register} errors={errors} onPrev={onPrev} />
      )}
    </form>
  );
}

// Компонент шага
function Step1({ register, errors, onNext }) {
  return (
    <div className="step">
      <h2>Step 1: Personal Information</h2>
      
      <div className="form-field">
        <label htmlFor="name">Name</label>
        <input 
          id="name"
          {...register('name', { required: 'Name is required' })} 
        />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input 
          id="email"
          type="email"
          {...register('email', { required: 'Email is required' })} 
        />
        {errors.email && <span className="error">{errors.email.message}</span>}
      </div>

      <button type="button" onClick={onNext}>
        Next →
      </button>
    </div>
  );
}
```

**Преимущества:**
- ✅ Простая реализация
- ✅ Полный контроль над навигацией
- ✅ Легко добавлять условную логику

**Недостатки:**
- ❌ Теряется при refresh
- ❌ Нельзя поделиться ссылкой на конкретный шаг
- ❌ Нет истории браузера

### Pattern 2: URL-based Approach

Текущий шаг хранится в URL (query param или hash).

**Пример с React Router:**

```tsx
import { useSearchParams } from 'react-router-dom';

function MultiStepForm() {
  const [searchParams, setSearchParams] = useSearchParams();
  const step = parseInt(searchParams.get('step') || '1');

  const goToStep = (newStep: number) => {
    setSearchParams({ step: newStep.toString() });
  };

  const onNext = async () => {
    const isValid = await validateStep();
    if (isValid) {
      goToStep(step + 1);
    }
  };

  const onPrev = () => goToStep(step - 1);

  // ... rest of component
}
```

**Преимущества:**
- ✅ Сохраняется при refresh
- ✅ Можно поделиться ссылкой на шаг
- ✅ История браузера работает (back/forward)
- ✅ Лучше для SEO

**Недостатки:**
- ❌ Сложнее реализация
- ❌ Нужна валидация доступа к шагам
- ❌ Требует роутинг

### Progress Indicator

Accessibility-friendly индикатор прогресса:

```tsx
function ProgressIndicator({ current, total }: { current: number; total: number }) {
  return (
    <nav aria-label="Form progress">
      <ol className="progress-steps">
        {Array.from({ length: total }).map((_, i) => {
          const stepNumber = i + 1;
          const isComplete = stepNumber < current;
          const isCurrent = stepNumber === current;
          
          return (
            <li 
              key={i} 
              className={`step ${isComplete ? 'complete' : ''} ${isCurrent ? 'current' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="step-number">
                {isComplete ? '✓' : stepNumber}
              </span>
              <span className="step-label">
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

### @nexus-state/form подход

Встроенная поддержка multi-step:

```tsx
import { createMultiStepForm } from '@nexus-state/form';
import { useAtom } from '@nexus-state/react';
import { z } from 'zod';

// Схемы для каждого шага
const schemas = {
  step1: z.object({
    name: z.string().min(2),
    email: z.string().email()
  }),
  step2: z.object({
    address: z.string().min(5),
    city: z.string().min(2)
  }),
  step3: z.object({
    cardNumber: z.string().regex(/^\d{16}$/),
    cvv: z.string().regex(/^\d{3,4}$/)
  })
};

const formAtom = createMultiStepForm(schemas, {
  step1: { name: '', email: '' },
  step2: { address: '', city: '' },
  step3: { cardNumber: '', cvv: '' }
});

function MultiStepForm() {
  const [formState] = useAtom(formAtom);

  const handleNext = async () => {
    const result = await formAtom.nextStep();
    if (!result.success) {
      console.log('Validation errors:', result.errors);
    }
  };

  const handlePrev = () => {
    formAtom.prevStep();
  };

  const handleSubmit = async () => {
    const result = await formAtom.submit();
    if (result.success) {
      console.log('All data:', result.data);
    }
  };

  return (
    <form>
      <ProgressIndicator 
        current={formState.currentStep} 
        total={formState.totalSteps} 
      />
      
      {formState.currentStep === 1 && (
        <Step1 formAtom={formAtom} />
      )}
      
      {formState.currentStep === 2 && (
        <Step2 formAtom={formAtom} />
      )}
      
      {formState.currentStep === 3 && (
        <Step3 formAtom={formAtom} />
      )}
      
      <div className="navigation">
        {formState.currentStep > 1 && (
          <button type="button" onClick={handlePrev}>
            ← Previous
          </button>
        )}
        
        {formState.currentStep < formState.totalSteps ? (
          <button type="button" onClick={handleNext}>
            Next →
          </button>
        ) : (
          <button type="button" onClick={handleSubmit}>
            Submit
          </button>
        )}
      </div>
    </form>
  );
}
```

**Преимущества @nexus-state/form:**
- ✅ Встроенная валидация по шагам
- ✅ Автоматическое сохранение данных между шагами
- ✅ Time Travel для всей истории
- ✅ Меньше бойлерплейта

### API Comparison Table

| Аспект | RHF | @nexus-state/form |
|--------|-----|-------------------|
| Built-in support | ❌ | ✅ |
| State management | useState для step | formAtom.setStep() |
| Validation per step | trigger(fields) | formAtom.validateStep() |
| Progress tracking | Вручную | formState.currentStep |
| Data persistence | Вручную | Автоматически |
| Navigation | Вручную | nextStep()/prevStep() |


---

## 2. Dynamic Forms

Dynamic forms — это формы, где поля показываются или скрываются в зависимости от значений других полей.

### Что такое Dynamic Forms

**Определение:**
Формы с условной логикой, где видимость и валидация полей зависят от пользовательского ввода.

**Use cases:**
- **Анкеты:** "Если да, то опишите подробнее"
- **Настройка продукта:** опции зависят от выбранной модели
- **Фильтры поиска:** дополнительные фильтры по категориям
- **Формы заявок:** разные поля для разных типов заявок

### Pattern 1: Conditional Rendering

Простой подход с условным рендерингом:

```tsx
import { useForm } from 'react-hook-form';

function DynamicForm() {
  const { register, watch } = useForm();
  const vehicleType = watch('vehicleType');
  const hasLicense = watch('hasLicense');

  return (
    <form>
      <div className="form-field">
        <label htmlFor="vehicleType">Vehicle Type</label>
        <select id="vehicleType" {...register('vehicleType')}>
          <option value="">Select type</option>
          <option value="car">Car</option>
          <option value="boat">Boat</option>
          <option value="motorcycle">Motorcycle</option>
        </select>
      </div>

      {/* Условное поле для car и motorcycle */}
      {(vehicleType === 'car' || vehicleType === 'motorcycle') && (
        <div className="form-field">
          <label htmlFor="wheels">Number of wheels</label>
          <input 
            id="wheels"
            type="number" 
            {...register('wheels', { 
              required: 'Number of wheels is required',
              min: { value: 2, message: 'Min 2 wheels' }
            })} 
          />
        </div>
      )}

      {/* Условное поле для boat */}
      {vehicleType === 'boat' && (
        <div className="form-field">
          <label htmlFor="length">Length (feet)</label>
          <input 
            id="length"
            type="number" 
            {...register('length', {
              required: 'Length is required',
              min: { value: 10, message: 'Min 10 feet' }
            })} 
          />
        </div>
      )}

      {/* Вложенная условная логика */}
      <div className="form-field">
        <label>
          <input type="checkbox" {...register('hasLicense')} />
          I have a license
        </label>
      </div>

      {hasLicense && (
        <div className="form-field">
          <label htmlFor="licenseNumber">License Number</label>
          <input 
            id="licenseNumber"
            {...register('licenseNumber', { 
              required: 'License number is required' 
            })} 
          />
        </div>
      )}

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Pattern 2: Schema-driven

Более масштабируемый подход для сложных форм:

```tsx
interface FieldConfig {
  name: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  label: string;
  options?: Array<{ value: string; label: string }>;
  visible?: (values: Record<string, any>) => boolean;
  required?: boolean | ((values: Record<string, any>) => boolean);
  validation?: any;
}

const formSchema: FieldConfig[] = [
  {
    name: 'vehicleType',
    type: 'select',
    label: 'Vehicle Type',
    options: [
      { value: 'car', label: 'Car' },
      { value: 'boat', label: 'Boat' },
      { value: 'motorcycle', label: 'Motorcycle' }
    ],
    required: true
  },
  {
    name: 'wheels',
    type: 'number',
    label: 'Number of wheels',
    visible: (values) => ['car', 'motorcycle'].includes(values.vehicleType),
    required: (values) => ['car', 'motorcycle'].includes(values.vehicleType),
    validation: { min: 2, max: 4 }
  },
  {
    name: 'length',
    type: 'number',
    label: 'Length (feet)',
    visible: (values) => values.vehicleType === 'boat',
    required: (values) => values.vehicleType === 'boat',
    validation: { min: 10 }
  }
];

function SchemaDrivenForm({ schema }: { schema: FieldConfig[] }) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: any) => {
    setValues({ ...values, [name]: value });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    schema.forEach((field) => {
      // Проверяем только видимые поля
      if (field.visible && !field.visible(values)) {
        return;
      }

      // Проверка обязательности
      const isRequired = typeof field.required === 'function' 
        ? field.required(values) 
        : field.required;

      if (isRequired && !values[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }

      // Дополнительная валидация
      if (field.validation && values[field.name]) {
        if (field.validation.min && values[field.name] < field.validation.min) {
          newErrors[field.name] = `Min value is ${field.validation.min}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); validate(); }}>
      {schema.map((field) => {
        // Проверка видимости
        if (field.visible && !field.visible(values)) {
          return null;
        }

        const isRequired = typeof field.required === 'function'
          ? field.required(values)
          : field.required;

        return (
          <div key={field.name} className="form-field">
            <label htmlFor={field.name}>
              {field.label}
              {isRequired && <span className="required">*</span>}
            </label>
            
            {field.type === 'select' ? (
              <select
                id={field.name}
                value={values[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                type={field.type}
                value={values[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
              />
            )}
            
            {errors[field.name] && (
              <span className="error">{errors[field.name]}</span>
            )}
          </div>
        );
      })}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Best Practices

**1. Сохранение значений скрытых полей:**

```tsx
// ✅ Хорошо: сохраняем значение при скрытии
{showField && <input value={value} onChange={onChange} />}

// ❌ Плохо: теряем значение
{showField ? <input value={value} onChange={onChange} /> : null}
```

**2. Валидация только видимых полей:**

```tsx
const validate = (values: FormValues) => {
  const errors: FormErrors = {};
  
  schema.forEach((field) => {
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

**3. Accessibility для скрытых полей:**

```tsx
// Скрытые поля должны быть aria-hidden
<div aria-hidden={!isVisible} style={{ display: isVisible ? 'block' : 'none' }}>
  <input {...register('conditionalField')} />
</div>
```


---

## 3. Form Arrays

Form Arrays — это повторяющиеся группы полей, которые пользователь может добавлять и удалять динамически.

### Что такое Form Arrays

**Определение:**
Поля, которые можно добавлять/удалять динамически (repeatable fields).

**Use cases:**
- **Несколько email адресов**
- **Список навыков**
- **Опыт работы** (компания, должность, период)
- **Образование**
- **Члены команды**
- **Товары в заказе**

### React Hook Form: useFieldArray

**Базовый пример:**

```tsx
import { useForm, useFieldArray } from 'react-hook-form';

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
      <h2>Email Addresses</h2>
      
      {fields.map((field, index) => (
        <div key={field.id} className="array-item">
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
        + Add Email
      </button>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Операции с массивами

**useFieldArray API:**

```tsx
const { 
  fields,    // Массив полей с уникальными id
  append,    // Добавить в конец
  prepend,   // Добавить в начало
  remove,    // Удалить по индексу
  insert,    // Вставить по индексу
  swap,      // Поменять местами
  move       // Переместить
} = useFieldArray({ control, name: 'items' });

// Примеры использования
append({ value: '' });           // Добавить в конец
prepend({ value: '' });          // Добавить в начало
remove(2);                       // Удалить элемент с индексом 2
insert(1, { value: 'new' });     // Вставить на позицию 1
swap(0, 2);                      // Поменять местами 0 и 2
move(0, 2);                      // Переместить с 0 на 2
```

### Сложный пример: Опыт работы

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
  const { register, control, watch, formState: { errors } } = useForm<{
    experience: WorkExperience[]
  }>({
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
      <h2>Work Experience</h2>
      
      {fields.map((field, index) => {
        const isCurrent = watch(`experience.${index}.current`);
        
        return (
          <div key={field.id} className="experience-item">
            <h3>Experience {index + 1}</h3>
            
            <div className="form-field">
              <label htmlFor={`experience.${index}.company`}>Company</label>
              <input
                id={`experience.${index}.company`}
                {...register(`experience.${index}.company`, { 
                  required: 'Company required' 
                })}
              />
              {errors.experience?.[index]?.company && (
                <span className="error">
                  {errors.experience[index]?.company?.message}
                </span>
              )}
            </div>
            
            <div className="form-field">
              <label htmlFor={`experience.${index}.position`}>Position</label>
              <input
                id={`experience.${index}.position`}
                {...register(`experience.${index}.position`, { 
                  required: 'Position required' 
                })}
              />
            </div>
            
            <div className="form-field">
              <label htmlFor={`experience.${index}.startDate`}>Start Date</label>
              <input
                id={`experience.${index}.startDate`}
                type="date"
                {...register(`experience.${index}.startDate`, { 
                  required: 'Start date required' 
                })}
              />
            </div>
            
            <div className="form-field">
              <label>
                <input
                  type="checkbox"
                  {...register(`experience.${index}.current`)}
                />
                Currently working here
              </label>
            </div>
            
            {!isCurrent && (
              <div className="form-field">
                <label htmlFor={`experience.${index}.endDate`}>End Date</label>
                <input
                  id={`experience.${index}.endDate`}
                  type="date"
                  {...register(`experience.${index}.endDate`, { 
                    required: 'End date required' 
                  })}
                />
              </div>
            )}
            
            <div className="form-field">
              <label htmlFor={`experience.${index}.description`}>
                Description
              </label>
              <textarea
                id={`experience.${index}.description`}
                {...register(`experience.${index}.description`)}
                rows={4}
              />
            </div>
            
            {fields.length > 1 && (
              <button type="button" onClick={() => remove(index)}>
                Remove Experience
              </button>
            )}
          </div>
        );
      })}
      
      <button 
        type="button" 
        onClick={() => append({
          company: '',
          position: '',
          startDate: '',
          endDate: '',
          current: false,
          description: ''
        })}
      >
        + Add Experience
      </button>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Best Practices

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

**Почему:** React использует ключи для оптимизации. При использовании index как ключа, удаление элемента из середины массива приводит к неправильному ререндеру.

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

### @nexus-state/form подход

```tsx
import { createFormAtom } from '@nexus-state/form';
import { z } from 'zod';

const schema = z.object({
  emails: z.array(z.object({
    value: z.string().email()
  })).min(1, 'At least one email required')
});

const formAtom = createFormAtom(schema, {
  emails: [{ value: '' }]
});

// Операции
formAtom.addArrayItem('emails', { value: '' });
formAtom.removeArrayItem('emails', index);
formAtom.insertArrayItem('emails', index, { value: '' });
formAtom.moveArrayItem('emails', fromIndex, toIndex);
```

### API Comparison Table

| Операция | RHF | @nexus-state/form |
|----------|-----|-------------------|
| Add | `append()` | `formAtom.addArrayItem()` |
| Remove | `remove(index)` | `formAtom.removeArrayItem(index)` |
| Insert | `insert(index, value)` | `formAtom.insertArrayItem(index, value)` |
| Move | `move(from, to)` | `formAtom.moveArrayItem(from, to)` |
| Swap | `swap(index1, index2)` | — |
| Unique IDs | `field.id` | Автоматически |

---

## Заключение

В этой третьей части мы освоили продвинутые паттерны для форм:

### Ключевые выводы

**1. Multi-step Forms:**
- State-based для простоты
- URL-based для persistence и SEO
- @nexus-state/form для встроенной поддержки
- Progress indicator для UX

**2. Dynamic Forms:**
- Conditional rendering для простых случаев
- Schema-driven для масштабируемости
- Валидировать только видимые поля
- Сохранять значения скрытых полей

**3. Form Arrays:**
- useFieldArray в RHF
- Уникальные ключи (field.id, НЕ index)
- Минимум 1 элемент
- Валидация каждого элемента

**4. Выбор подхода:**
- RHF: максимальная гибкость и контроль
- @nexus-state/form: встроенные фичи, меньше кода

### Что дальше

Мы освоили foundations (Часть 1), UX/Accessibility (Часть 2) и первую часть advanced patterns (Часть 3). В следующих частях:

**Часть 4: Advanced Patterns II** (следующая неделя)
- Cross-field Validation (зависимые поля)
- Async Validation с debouncing
- Hybrid Validation (client + server)
- Form Persistence (auto-save)
- Integration с TanStack Query

**Часть 5: Form Builder**
- Schema-driven Architecture
- Drag-and-Drop интерфейс
- Component Registry
- Live Preview
- Export to Code
- Undo/Redo с Time Travel

**Часть 6: DSL для валидации**
- Создание собственного DSL
- Parser Implementation
- Query Integration
- Real-world Examples

### Полезные ссылки

**Документация:**
- [React Hook Form useFieldArray](https://react-hook-form.com/api/usefieldarray)
- [Multi-step Forms Best Practices](https://www.smashingmagazine.com/2017/05/better-form-design-one-thing-per-page/)

**Другие части серии:**
- [Часть 1: Foundations & Patterns](../part-01-foundations-patterns/draft.md)
- [Часть 2: UX & Accessibility](../part-02-ux-accessibility/draft.md)
- [Query Parts 1-2](../../article-query/) — Server validation

**Обратная связь:**
Буду рад вашим комментариям и вопросам! Пишите в комментариях или в [GitHub Issues](https://github.com/eustatos/nexus-state/issues).

---

**Предыдущая статья:** [Часть 2: UX & Accessibility](../part-02-ux-accessibility/draft.md)  
**Следующая статья:** [Часть 4: Advanced Patterns II](../part-04-advanced-patterns-2/draft.md)

