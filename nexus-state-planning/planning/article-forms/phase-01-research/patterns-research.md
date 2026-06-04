# Исследование паттернов управления формами

**Дата:** Март 2026  
**Автор:** @astashkin-a  
**Статус:** ✅ Completed

---

## 📋 Содержание

1. [Controlled vs Uncontrolled Components](#1-controlled-vs-uncontrolled-components)
2. [Validation Patterns](#2-validation-patterns)
3. [Error Handling & UX](#3-error-handling--ux)
4. [Accessibility (WAI-ARIA)](#4-accessibility-wai-aria)
5. [Multi-step Forms](#5-multi-step-forms)
6. [Dynamic Forms](#6-dynamic-forms)
7. [Form Arrays](#7-form-arrays)
8. [Cross-field Validation](#8-cross-field-validation)
9. [Async Validation](#9-async-validation)
10. [Form Builder Architecture](#10-form-builder-architecture)
11. [DSL для валидации](#11-dsl-для-валидации)

---

## 1. Controlled vs Uncontrolled Components

### Что такое Controlled Components

**Определение:**
Компоненты, где значение input контролируется через React state.

**Характеристики:**
- Значение хранится в React state
- Изменения обрабатываются через onChange
- React — «единственный источник истины»

**Пример:**
```tsx
function ControlledForm() {
  const [value, setValue] = useState('');
  
  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
```

### Что такое Uncontrolled Components

**Определение:**
Компоненты, где значение хранится в DOM, а не в React state.

**Характеристики:**
- Значение хранится в DOM
- Доступ через ref
- Меньше бойлерплейта

**Пример:**
```tsx
function UncontrolledForm() {
  const inputRef = useRef(null);
  
  const handleSubmit = () => {
    console.log(inputRef.current.value);
  };
  
  return (
    <input
      ref={inputRef}
      defaultValue=""
    />
  );
}
```

### Сравнение подходов

| Критерий | Controlled | Uncontrolled |
|----------|------------|--------------|
| **Источник истины** | React state | DOM |
| **Бойлерплейт** | Высокий | Низкий |
| **Валидация** | Мгновенная | При сабмите |
| **Производительность** | Ререндер при каждом изменении | Минимальные ререндеры |
| **Интеграция с non-React** | Сложная | Простая |
| **Time Travel** | ✅ Легко | ❌ Сложно |

### Когда использовать Controlled

| Сценарий | Почему |
|----------|--------|
| Мгновенная валидация | Нужно значение при каждом изменении |
| Зависимые поля | Одно поле зависит от другого |
| Форматирование ввода | Маски, форматирование |
| Conditional fields | Показ/скрытие по условию |
| Time Travel | Нужна история изменений |

### Когда использовать Uncontrolled

| Сценарий | Почему |
|----------|--------|
| Простые формы | Минимум бойлерплейта |
| Большие формы | Избегание лишних ререндеров |
| Интеграция с библиотеками | jQuery плагины и т.д. |
| Файловые input | File API работает через ref |

### Best Practices

```tsx
// ✅ Хорошо: Controlled для валидации
function EmailForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (!isValidEmail(value)) {
      setError('Invalid email');
    } else {
      setError(null);
    }
  };
  
  return (
    <div>
      <input value={email} onChange={handleChange} />
      {error && <span className="error">{error}</span>}
    </div>
  );
}

// ✅ Хорошо: Uncontrolled для простых форм
function SearchForm({ onSearch }) {
  const inputRef = useRef(null);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(inputRef.current.value);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="" />
      <button type="submit">Search</button>
    </form>
  );
}

// ❌ Плохо: Смешивание value и defaultValue
<input value={value} defaultValue="" /> // Warning!
```

### Time Travel Perspective

**Controlled компоненты идеальны для Time Travel:**

```tsx
// История изменений сохраняется в state
const [history, setHistory] = useState([]);
const [currentIndex, setCurrentIndex] = useState(-1);

const handleChange = (e) => {
  const value = e.target.value;
  const newHistory = history.slice(0, currentIndex + 1);
  newHistory.push(value);
  setHistory(newHistory);
  setCurrentIndex(newHistory.length - 1);
};

// Undo
const undo = () => {
  if (currentIndex > 0) {
    setCurrentIndex(currentIndex - 1);
    setValue(history[currentIndex - 1]);
  }
};
```

---

## 2. Validation Patterns

### Client-side Validation

**Определение:**
Валидация выполняется в браузере, без запроса к серверу.

**Преимущества:**
- ✅ Мгновенная обратная связь
- ✅ Снижение нагрузки на сервер
- ✅ Работает офлайн

**Недостатки:**
- ❌ Можно обойти
- ❌ Дублирование логики с сервером
- ❌ Увеличение размера bundle

**Пример:**
```tsx
function ClientValidation() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  
  const validate = (value) => {
    if (!value) return 'Email required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email format';
    }
    return null;
  };
  
  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setError(validate(value));
  };
  
  return (
    <div>
      <input value={email} onChange={handleChange} />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

### Server-side Validation

**Определение:**
Валидация выполняется на сервере после отправки формы.

**Преимущества:**
- ✅ Единый источник истины
- ✅ Нельзя обойти
- ✅ Доступ к данным БД

**Недостатки:**
- ❌ Задержка (сетевой запрос)
- ❌ Нагрузка на сервер
- ❌ Не работает офлайн

**Пример:**
```tsx
function ServerValidation() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [validating, setValidating] = useState(false);
  
  const validate = async (value) => {
    setValidating(true);
    try {
      const response = await fetch('/api/validate-email', {
        method: 'POST',
        body: JSON.stringify({ email: value }),
      });
      const result = await response.json();
      setError(result.error);
    } finally {
      setValidating(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await validate(email);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      {validating && <span>Validating...</span>}
      {error && <span className="error">{error}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Hybrid Validation

**Определение:**
Комбинация client-side и server-side валидации.

**Преимущества:**
- ✅ Мгновенная обратная связь для простых правил
- ✅ Надёжность серверной валидации
- ✅ Проверка уникальности на сервере

**Пример:**
```tsx
function HybridValidation() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  
  // Client-side: формат
  const validateFormat = (value) => {
    if (!value) return 'Email required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email format';
    }
    return null;
  };
  
  // Server-side: уникальность
  const validateUnique = async (value) => {
    const response = await fetch(`/api/check-email?email=${value}`);
    const result = await response.json();
    return result.exists ? 'Email already exists' : null;
  };
  
  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    const formatError = validateFormat(value);
    setError(formatError);
  };
  
  const handleBlur = async () => {
    if (!error) {
      const uniqueError = await validateUnique(email);
      setError(uniqueError);
    }
  };
  
  return (
    <div>
      <input 
        value={email} 
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

### Schema-based Validation

**Определение:**
Валидация по декларативной схеме.

**Библиотеки:**
- Yup
- Zod
- Joi
- Yup

**Пример (Zod):**
```tsx
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name too short'),
  age: z.number().min(18, 'Must be 18+'),
});

function SchemaValidation() {
  const [formData, setFormData] = useState({ email: '', name: '', age: 0 });
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    try {
      userSchema.parse({ ...formData, [name]: value });
      setErrors({ ...errors, [name]: null });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors({ ...errors, [name]: err.errors[0].message });
      }
    }
  };
  
  return (
    <form>
      <input name="email" value={formData.email} onChange={handleChange} />
      {errors.email && <span>{errors.email}</span>}
      
      <input name="name" value={formData.name} onChange={handleChange} />
      {errors.name && <span>{errors.name}</span>}
      
      <input name="age" type="number" value={formData.age} onChange={handleChange} />
      {errors.age && <span>{errors.age}</span>}
    </form>
  );
}
```

### Best Practices

| Практика | Описание |
|----------|----------|
| **Валидация при изменении** | Для мгновенной обратной связи |
| **Валидация при blur** | Для снижения шума |
| **Валидация при сабмите** | Обязательно всегда |
| **Debouncing** | Для async валидации (300-500ms) |
| **Сохранение ошибок** | Не очищать при каждом изменении |

---

## 3. Error Handling & UX

### Типы ошибок форм

| Тип | Описание | Пример |
|-----|----------|--------|
| **Required** | Поле обязательно | «Name is required» |
| **Format** | Неверный формат | «Invalid email format» |
| **Range** | Вне диапазона | «Age must be 18-120» |
| **Length** | Неверная длина | «Password min 8 chars» |
| **Pattern** | Не соответствует паттерну | «Only letters allowed» |
| **Unique** | Не уникально | «Email already exists» |
| **Server** | Ошибка сервера | «Service unavailable» |

### Отображение ошибок

#### Inline Errors (рекомендуется)

```tsx
<div className="form-field">
  <label htmlFor="email">Email</label>
  <input 
    id="email"
    value={email}
    onChange={handleChange}
    aria-invalid={!!error}
    aria-describedby={error ? 'email-error' : undefined}
  />
  {error && (
    <span id="email-error" className="error" role="alert">
      {error}
    </span>
  )}
</div>
```

**Преимущества:**
- ✅ Ясно, какое поле ошибочно
- ✅ Accessibility (aria-invalid)
- ✅ Не теряется контекст

#### Summary Errors

```tsx
{errors.length > 0 && (
  <div className="error-summary" role="alert">
    <h2>Please fix {errors.length} errors</h2>
    <ul>
      {errors.map((err) => (
        <li key={err.field}>
          <a href={`#${err.field}`}>{err.message}</a>
        </li>
      ))}
    </ul>
  </div>
)}
```

**Преимущества:**
- ✅ Обзор всех ошибок
- ✅ Ссылки на поля
- ✅ Хорошо для больших форм

### UX рекомендации

| Рекомендация | Описание |
|--------------|----------|
| **Не показывать ошибки до взаимодействия** | Не пугать пользователя сразу |
| **Показывать при blur** | После того как пользователь ушёл из поля |
| **Не очишать ошибку при начале ввода** | Дать исправить полностью |
| **Очищать при успешной валидации** | Положительное подкрепление |
| **Сохранять значение при ошибке** | Не заставлять вводить заново |
| **Фокус на первое ошибочное поле** | При сабмите с ошибками |

### Accessibility

```tsx
// ✅ Хорошо: Полная accessibility
<div className="form-field">
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    value={email}
    onChange={handleChange}
    aria-invalid={!!error}
    aria-describedby={error ? 'email-error' : 'email-hint'}
  />
  <span id="email-hint" className="hint">
    We'll never share your email
  </span>
  {error && (
    <span id="email-error" className="error" role="alert">
      {error}
    </span>
  )}
</div>

// ❌ Плохо: Без accessibility
<div>
  <input value={email} onChange={handleChange} />
  {error && <span style={{color: 'red'}}>{error}</span>}
</div>
```

---

## 4. Accessibility (WAI-ARIA)

### Обязательные атрибуты

| Атрибут | Значение | Описание |
|---------|----------|----------|
| `htmlFor` / `id` | Связь label и input | Клик на label фокусит input |
| `aria-invalid` | `true`/`false` | Поле невалидно |
| `aria-describedby` | ID элемента | Ссылка на описание/ошибку |
| `aria-required` | `true`/`false` | Поле обязательно |
| `role="alert"` | Для ошибок | Screen reader объявит сразу |

### Пример доступной формы

```tsx
<form aria-labelledby="form-title">
  <h2 id="form-title">Contact Information</h2>
  
  {/* Required field */}
  <div className="form-field">
    <label htmlFor="name">
      Name <span aria-hidden="true">*</span>
    </label>
    <input
      id="name"
      name="name"
      required
      aria-required="true"
      value={name}
      onChange={handleChange}
    />
  </div>
  
  {/* Field with error */}
  <div className="form-field">
    <label htmlFor="email">Email</label>
    <input
      id="email"
      name="email"
      type="email"
      aria-invalid={!!emailError}
      aria-describedby={emailError ? 'email-error' : 'email-hint'}
      value={email}
      onChange={handleChange}
    />
    <span id="email-hint">We'll never share your email</span>
    {emailError && (
      <span id="email-error" role="alert">{emailError}</span>
    )}
  </div>
  
  {/* Field with description */}
  <div className="form-field">
    <label htmlFor="password">Password</label>
    <input
      id="password"
      name="password"
      type="password"
      aria-describedby="password-requirements"
      value={password}
      onChange={handleChange}
    />
    <ul id="password-requirements">
      <li>At least 8 characters</li>
      <li>One uppercase letter</li>
      <li>One number</li>
    </ul>
  </div>
</form>
```

### Keyboard Navigation

| Клавиша | Действие |
|---------|----------|
| `Tab` | Следующее поле |
| `Shift+Tab` | Предыдущее поле |
| `Enter` | Отправка формы |
| `Space` | Чекбокс/радио |
| `Arrow keys` | Радио кнопки, select |

### Focus Management

```tsx
// Фокус на первое ошибочное поле при сабмите
const handleSubmit = (e) => {
  e.preventDefault();
  
  if (errors.length > 0) {
    const firstErrorField = document.querySelector('[aria-invalid="true"]');
    if (firstErrorField) {
      firstErrorField.focus();
    }
  }
};
```

---

## 5. Multi-step Forms

### Что такое Multi-step Forms

**Определение:**
Формы, разделённые на несколько шагов (wizards).

**Use cases:**
- Регистрация пользователя
- Оформление заказа
- Анкетирование
- Настройка профиля

### Паттерны реализации

#### Pattern 1: State-based

```tsx
function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  
  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);
  
  const renderStep = () => {
    switch (step) {
      case 1: return <Step1 data={formData} onNext={handleNext} />;
      case 2: return <Step2 data={formData} onNext={handleNext} onPrev={handlePrev} />;
      case 3: return <Step3 data={formData} onPrev={handlePrev} />;
      default: return null;
    }
  };
  
  return (
    <div>
      <Progress current={step} total={3} />
      {renderStep()}
    </div>
  );
}
```

#### Pattern 2: URL-based

```tsx
function MultiStepForm() {
  const [step, setStep] = useState(
    parseInt(window.location.hash.replace('#step-', '')) || 1
  );
  
  const goToStep = (newStep) => {
    window.location.hash = `step-${newStep}`;
    setStep(newStep);
  };
  
  // ... остальная логика
}
```

**Преимущества:**
- ✅ Можно обновить страницу
- ✅ Можно поделиться ссылкой
- ✅ История в браузере

### Progress Indicator

```tsx
function Progress({ current, total }) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="progress-steps">
        {Array.from({ length: total }).map((_, i) => (
          <li key={i} className={i + 1 <= current ? 'complete' : 'incomplete'}>
            <span aria-current={i + 1 === current ? 'step' : undefined}>
              Step {i + 1}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

### Validation между шагами

```tsx
const handleNext = async () => {
  const stepErrors = validateStep(step, formData);
  
  if (stepErrors.length > 0) {
    setErrors(stepErrors);
    return;
  }
  
  // Сохранить состояние шага
  await saveStepData(step, formData);
  setStep(step + 1);
};
```

### Best Practices

| Практика | Описание |
|----------|----------|
| **Показывать прогресс** | Пользователь должен видеть, сколько осталось |
| **Валидировать перед переходом** | Не пускать дальше с ошибками |
| **Сохранять данные между шагами** | Не терять введённое |
| **Разрешать возврат** | Можно вернуться и исправить |
| **Показывать сводку в конце** | Подтверждение перед отправкой |

---

## 6. Dynamic Forms

### Что такое Dynamic Forms

**Определение:**
Формы, где поля показываются/скрываются в зависимости от значений других полей.

**Use cases:**
- Анкеты с условными вопросами
- Настройка продукта
- Кастомизация заказа

### Паттерны реализации

#### Pattern 1: Conditional Rendering

```tsx
function DynamicForm() {
  const [vehicleType, setVehicleType] = useState('');
  const [showWheels, setShowWheels] = useState(false);
  
  useEffect(() => {
    setShowWheels(vehicleType === 'car' || vehicleType === 'motorcycle');
  }, [vehicleType]);
  
  return (
    <form>
      <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
        <option value="">Select type</option>
        <option value="car">Car</option>
        <option value="boat">Boat</option>
        <option value="motorcycle">Motorcycle</option>
      </select>
      
      {showWheels && (
        <div>
          <label>Number of wheels</label>
          <input type="number" name="wheels" />
        </div>
      )}
    </form>
  );
}
```

#### Pattern 2: Schema-driven

```tsx
const formSchema = {
  fields: [
    { name: 'vehicleType', type: 'select', options: ['car', 'boat', 'motorcycle'] },
    { 
      name: 'wheels', 
      type: 'number',
      visible: (values) => ['car', 'motorcycle'].includes(values.vehicleType)
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
        if (field.visible && !field.visible(values)) return null;
        return <Field key={field.name} field={field} value={values[field.name]} />;
      })}
    </form>
  );
}
```

### Best Practices

| Практика | Описание |
|----------|----------|
| **Плавные переходы** | Анимация появления/исчезновения |
| **Сохранение значений** | Не терять данные при скрытии |
| **Валидация видимых полей** | Не валидировать скрытые |
| **Доступность** | aria-hidden для скрытых полей |

---

## 7. Form Arrays

### Что такое Form Arrays

**Определение:**
Поля, которые можно добавлять/удалять динамически (repeatable fields).

**Use cases:**
- Несколько email адресов
- Список навыков
- Достижения
- Опыт работы

### Паттерны реализации

#### Pattern 1: Array in State

```tsx
function FormArray() {
  const [emails, setEmails] = useState(['']);
  
  const addEmail = () => {
    setEmails([...emails, '']);
  };
  
  const removeEmail = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };
  
  const updateEmail = (index, value) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };
  
  return (
    <div>
      {emails.map((email, index) => (
        <div key={index} className="email-field">
          <input
            value={email}
            onChange={(e) => updateEmail(index, e.target.value)}
            placeholder={`Email ${index + 1}`}
          />
          {emails.length > 1 && (
            <button type="button" onClick={() => removeEmail(index)}>
              Remove
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={addEmail}>Add Email</button>
    </div>
  );
}
```

#### Pattern 2: Unique IDs

```tsx
function FormArrayWithIds() {
  const [items, setItems] = useState([
    { id: generateId(), value: '' }
  ]);
  
  const addItem = () => {
    setItems([...items, { id: generateId(), value: '' }]);
  };
  
  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  const updateItem = (id, value) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, value } : item
    ));
  };
  
  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>
          <input
            value={item.value}
            onChange={(e) => updateItem(item.id, e.target.value)}
          />
          <button type="button" onClick={() => removeItem(item.id)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={addItem}>Add</button>
    </div>
  );
}
```

### Best Practices

| Практика | Описание |
|----------|----------|
| **Уникальные ключи** | Не использовать index как key |
| **Минимум 1 элемент** | Не удалять последний |
| **Валидация каждого** | Валидировать каждое поле |
| **Нумерация** | Показывать номер элемента |

---

## 8. Cross-field Validation

### Что такое Cross-field Validation

**Определение:**
Валидация, где правило зависит от значений нескольких полей.

**Use cases:**
- Пароль и подтверждение пароля
- Дата начала и дата окончания
- Скидка и минимальная сумма

### Паттерны реализации

#### Pattern 1: Dependent Validation

```tsx
function PasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (confirm && password !== confirm) {
      setError('Passwords do not match');
    } else {
      setError(null);
    }
  }, [password, confirm]);
  
  return (
    <form>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm Password"
      />
      {error && <span className="error">{error}</span>}
    </form>
  );
}
```

#### Pattern 2: Date Range

```tsx
function DateRangeForm() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (startDate && endDate) {
      if (new Date(endDate) < new Date(startDate)) {
        setError('End date must be after start date');
      } else {
        setError(null);
      }
    }
  }, [startDate, endDate]);
  
  return (
    <form>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        min={startDate}
      />
      {error && <span className="error">{error}</span>}
    </form>
  );
}
```

### Best Practices

| Практика | Описание |
|----------|----------|
| **Валидация при изменении обоих** | Не показывать ошибку пока оба не заполнены |
| **Ограничение второго поля** | min/max для дат |
| **Ясные сообщения** | «End date must be after start date» |
| **Очистка при изменении** | Сбросить ошибку при исправлении |

---

## 9. Async Validation

### Что такое Async Validation

**Определение:**
Валидация, требующая запроса к серверу.

**Use cases:**
- Проверка уникальности email
- Проверка доступности username
- Валидация промокода
- Проверка адреса

### Паттерны реализации

#### Pattern 1: Debounced Validation

```tsx
function AsyncValidation() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [validating, setValidating] = useState(false);
  
  const debouncedValidate = useMemo(
    () => debounce(async (value) => {
      setValidating(true);
      try {
        const response = await fetch(`/api/check-username?username=${value}`);
        const result = await response.json();
        setError(result.exists ? 'Username taken' : null);
      } finally {
        setValidating(false);
      }
    }, 500),
    []
  );
  
  useEffect(() => {
    if (username.length > 2) {
      debouncedValidate(username);
    }
  }, [username, debouncedValidate]);
  
  return (
    <div>
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      {validating && <span>Checking...</span>}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

#### Pattern 2: On Blur Validation

```tsx
function OnBlurValidation() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [validated, setValidated] = useState(false);
  
  const validate = async (value) => {
    const response = await fetch(`/api/check-email?email=${value}`);
    const result = await response.json();
    setError(result.exists ? 'Email exists' : null);
    setValidated(true);
  };
  
  const handleBlur = () => {
    if (email && !validated) {
      validate(email);
    }
  };
  
  return (
    <div>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={handleBlur}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

### Best Practices

| Практика | Описание |
|----------|----------|
| **Debouncing** | 300-500ms задержка |
| **Валидация при blur** | Не при каждом изменении |
| **Индикатор загрузки** | Показывать «Checking...» |
| **Кэширование** | Не запрашивать повторно то же значение |
| **Отмена предыдущего запроса** | AbortController для race conditions |

---

## 10. Form Builder Architecture

### Что такое Form Builder

**Определение:**
Визуальный инструмент для создания форм без кода.

**Компоненты:**
- Палитра компонентов
- Canvas для размещения
- Панель свойств
- Preview
- Экспорт кода

### Архитектурные паттерны

#### Pattern 1: Schema-driven

```tsx
// Schema представляет форму
const formSchema = {
  id: 'contact-form',
  fields: [
    { type: 'text', name: 'name', label: 'Name', required: true },
    { type: 'email', name: 'email', label: 'Email', required: true },
    { type: 'textarea', name: 'message', label: 'Message' }
  ]
};

// Рендерер форм
function FormRenderer({ schema }) {
  return (
    <form>
      {schema.fields.map((field) => (
        <Field key={field.name} {...field} />
      ))}
    </form>
  );
}
```

#### Pattern 2: Component Registry

```tsx
// Реестр компонентов
const componentRegistry = {
  text: TextField,
  email: EmailField,
  textarea: TextAreaField,
  select: SelectField,
  checkbox: CheckboxField,
  radio: RadioField,
};

// Динамический рендеринг
function DynamicField({ type, ...props }) {
  const Component = componentRegistry[type];
  return Component ? <Component {...props} /> : null;
}
```

### Drag-and-Drop

```tsx
import { DndProvider, useDrag, useDrop } from 'react-dnd';

function DraggableField({ field, index, moveField }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'FIELD',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: 'FIELD',
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveField(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });
  
  return (
    <div ref={(node) => drag(drop(node))} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <Field {...field} />
    </div>
  );
}
```

### Live Preview

```tsx
function FormBuilder() {
  const [schema, setSchema] = useState(initialSchema);
  const [previewMode, setPreviewMode] = useState('edit');
  
  return (
    <div className="builder">
      <div className="toolbar">
        <button onClick={() => setPreviewMode('edit')}>Edit</button>
        <button onClick={() => setPreviewMode('preview')}>Preview</button>
      </div>
      
      <div className="canvas">
        {previewMode === 'edit' ? (
          <EditableForm schema={schema} onChange={setSchema} />
        ) : (
          <PreviewForm schema={schema} />
        )}
      </div>
      
      <div className="properties">
        <PropertyPanel schema={schema} onChange={setSchema} />
      </div>
    </div>
  );
}
```

### Export to Code

```tsx
function exportToCode(schema) {
  return `
import { useForm } from '@nexus-state/form';

function GeneratedForm() {
  const { register, handleSubmit } = useForm({
    schema: {
      ${schema.fields.map(f => `${f.name}: { type: '${f.type}', required: ${f.required} }`).join(',\n      ')}
    }
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      ${schema.fields.map(f => `
      <input {...register('${f.name}')} placeholder="${f.label}" />
      `).join('')}
    </form>
  );
}
`;
}
```

---

## 11. DSL для валидации

### Что такое DSL

**Определение:**
Предметно-ориентированный язык для описания правил валидации.

**Преимущества:**
- ✅ Декларативный синтаксис
- ✅ Читаемость
- ✅ Переиспользование
- ✅ Композиция

### Примеры существующих DSL

#### Yup

```tsx
import * as yup from 'yup';

const schema = yup.object({
  name: yup.string().required().min(2),
  email: yup.string().email().required(),
  age: yup.number().min(18).max(120),
});
```

#### Zod

```tsx
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18).max(120),
});
```

### Проектирование собственного DSL

#### Синтаксис

```javascript
// Шаблонные строки
const schema = formSchema`
  user {
    name: string.required.min(2).max(50)
    email: email.required.validate.server
    age: number.min(18).max(120)
    settings {
      notifications: boolean.default(true)
      theme: enum('light', 'dark').default('light')
    }
  }
`;

// Или функциональный
const schema = formSchema({
  user: {
    name: string().required().min(2).max(50),
    email: email().required().validateServer(),
    age: number().min(18).max(120),
    settings: {
      notifications: boolean().default(true),
      theme: enum('light', 'dark').default('light'),
    },
  },
});
```

#### Parser Architecture

```
Input (DSL) → Lexer → Tokens → Parser → AST → Validator
```

```tsx
// Lexer
function tokenize(dsl) {
  const tokens = [];
  // ... токенизация
  return tokens;
}

// Parser
function parse(tokens) {
  const ast = { type: 'schema', fields: [] };
  // ... парсинг
  return ast;
}

// Validator Generator
function generateValidator(ast) {
  return (data) => {
    // ... валидация
    return { valid: true, errors: [] };
  };
}
```

### Composition & Reuse

```tsx
// Базовые валидаторы
const emailValidator = string().email();
const requiredEmail = emailValidator.required();

// Композиция
const userSchema = formSchema({
  email: requiredEmail,
  name: string().required(),
});

// Наследование
const baseSchema = formSchema({
  id: number().required(),
  createdAt: date().default(Date.now),
});

const userSchema = baseSchema.extend({
  name: string().required(),
  email: email().required(),
});
```

### Integration with Query

```tsx
// Валидация по API schema
const userSchema = formSchema({
  name: string().required(),
  email: email().required(),
  // Валидация по данным из API
  country: string().validate.from('/api/countries'),
});

// Генерация формы из API schema
const formSchema = await generateFormSchema('/api/user-schema');
```

---

## 📚 Источники

1. [React Forms Documentation](https://react.dev/learn/forms)
2. [WAI-ARIA Forms](https://www.w3.org/WAI/ARIA/apg/patterns/form/)
3. [Patterns.dev - Forms](https://www.patterns.dev/)
4. [React Hook Form Docs](https://react-hook-form.com/)
5. [Formik Docs](https://formik.org/)
6. [Yup Documentation](https://github.com/jquense/yup)
7. [Zod Documentation](https://zod.dev/)

---

## 📝 Заметки

- Controlled компоненты идеальны для Time Travel
- Hybrid validation — лучший UX
- Accessibility критична для форм
- Form Builder требует schema-driven подход
- DSL должен быть простым и читаемым
