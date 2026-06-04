# Forms в Nexus State: Часть 4 — Advanced Patterns II

**Статус:** ✅ Complete  
**Целевая длина:** 2500-3000 слов  
**Время чтения:** 10-12 минут

---

## Метаданные для dev.to

**Title:** Forms в Nexus State: Часть 4 — Advanced Patterns II  
**Tags:** react, forms, validation, typescript  
**Series:** Forms в Nexus State  
**Published:** false

---

## Введение

В предыдущих частях мы прошли путь от foundations до первой части advanced patterns:
- [Часть 1](../part-01-foundations-patterns/draft.md): Controlled vs Uncontrolled, Validation, Libraries
- [Часть 2](../part-02-ux-accessibility/draft.md): Error Handling, Accessibility, Performance
- [Часть 3](../part-03-advanced-patterns-1/draft.md): Multi-step Forms, Dynamic Forms, Form Arrays

В этой четвёртой части мы продолжим изучение advanced patterns, фокусируясь на валидации и persistence:
- **Cross-field Validation** — валидация зависимых полей
- **Async Validation** — проверка на сервере с debouncing
- **Hybrid Validation** — комбинация client и server
- **Form Persistence** — auto-save и восстановление данных
- **Integration с TanStack Query** — работа с server state

---

## 1. Cross-field Validation

Cross-field validation — это валидация, где правило зависит от значений нескольких полей одновременно.

### Что такое Cross-field Validation

**Определение:**
Валидация, где правило проверки одного поля зависит от значений других полей.

**Use cases:**
- **Password Confirmation:** password должен совпадать с confirmPassword
- **Date Range:** endDate должна быть после startDate
- **Price Range:** maxPrice должна быть больше minPrice
- **Conditional Required:** поле обязательно только если другое поле заполнено
- **Discount Rules:** скидка доступна только при минимальной сумме заказа

### Password Confirmation

Классический пример cross-field validation:

```tsx
import { useForm } from 'react-hook-form';

function PasswordForm() {
  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors } 
  } = useForm({
    mode: 'onChange'
  });

  const password = watch('password');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password', {
            required: 'Password required',
            minLength: {
              value: 8,
              message: 'Min 8 characters'
            }
          })}
        />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword', {
            required: 'Please confirm password',
            validate: (value) => 
              value === password || 'Passwords do not match'
          })}
        />
        {errors.confirmPassword && (
          <span>{errors.confirmPassword.message}</span>
        )}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Date Range Validation

```tsx
function DateRangeForm() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const startDate = watch('startDate');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-field">
        <label htmlFor="startDate">Start Date</label>
        <input
          id="startDate"
          type="date"
          {...register('startDate', { required: 'Start date required' })}
        />
        {errors.startDate && <span>{errors.startDate.message}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="endDate">End Date</label>
        <input
          id="endDate"
          type="date"
          {...register('endDate', {
            required: 'End date required',
            validate: (value) => {
              if (!startDate) return true;
              return new Date(value) >= new Date(startDate) || 
                'End date must be after start date';
            }
          })}
        />
        {errors.endDate && <span>{errors.endDate.message}</span>}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Schema-based Cross-field Validation

**Zod:**

```tsx
import { z } from 'zod';

// Password confirmation
const passwordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Date range
const dateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string()
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"]
});

// Price range
const priceRangeSchema = z.object({
  minPrice: z.number().min(0),
  maxPrice: z.number().min(0)
}).refine((data) => data.maxPrice >= data.minPrice, {
  message: "Max price must be greater than min price",
  path: ["maxPrice"]
});
```

### Complex Business Rules

```tsx
const orderSchema = z.object({
  subtotal: z.number().min(0),
  discount: z.number().min(0).max(100),
  minOrderForDiscount: z.number().min(0)
}).refine((data) => {
  // Если есть скидка, проверяем минимальную сумму
  if (data.discount > 0) {
    return data.subtotal >= data.minOrderForDiscount;
  }
  return true;
}, {
  message: "Order total must meet minimum for discount",
  path: ["discount"]
});

// Conditional required
const addressSchema = z.object({
  needsShipping: z.boolean(),
  shippingAddress: z.string().optional()
}).refine((data) => {
  // Адрес обязателен только если нужна доставка
  if (data.needsShipping) {
    return !!data.shippingAddress && data.shippingAddress.length > 0;
  }
  return true;
}, {
  message: "Shipping address required when shipping is needed",
  path: ["shippingAddress"]
});
```

### Best Practices

**1. Используйте watch() для доступа к другим полям:**

```tsx
const password = watch('password');
const startDate = watch('startDate');
```

**2. Проверяйте существование зависимых значений:**

```tsx
validate: (value) => {
  if (!startDate) return true; // Не валидируем если зависимое поле пустое
  return new Date(value) >= new Date(startDate) || 'Error message';
}
```

**3. Используйте schema refine() для сложных правил:**

```tsx
.refine((data) => {
  // Сложная бизнес-логика
  return condition;
}, {
  message: "Error message",
  path: ["fieldName"] // Поле, к которому привязать ошибку
});
```


---

## 2. Async Validation

Async validation — это валидация, требующая асинхронных операций, обычно запросов к серверу.

### Что такое Async Validation

**Определение:**
Валидация, которая выполняется асинхронно, обычно с запросом к серверу.

**Use cases:**
- **Проверка уникальности:** username, email
- **Проверка доступности:** доменное имя, URL slug
- **Валидация промокода**
- **Проверка существования:** user ID, product SKU
- **Бизнес-правила:** кредитный лимит, остаток на складе

### Базовый пример

```tsx
// Mock API
const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  const response = await fetch(`/api/check-username?username=${username}`);
  const data = await response.json();
  return data.available;
};

function UsernameForm() {
  const { register, formState: { errors } } = useForm({
    mode: 'onBlur'
  });

  return (
    <form>
      <input
        {...register('username', {
          required: 'Username required',
          minLength: { value: 3, message: 'Min 3 characters' },
          validate: async (value) => {
            const available = await checkUsernameAvailability(value);
            return available || 'Username is taken';
          }
        })}
      />
      {errors.username && <span>{errors.username.message}</span>}
    </form>
  );
}
```

### Проблема: Слишком много запросов

**Без debouncing:**
- Каждый keystroke = API request
- Перегрузка сервера
- Плохой UX (мигающие ошибки)
- Лишние расходы на API calls

### Решение: Debouncing

```tsx
import { useDebouncedCallback } from 'use-debounce';

function UsernameFormWithDebounce() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const debouncedValidate = useDebouncedCallback(
    async (value: string) => {
      if (value.length < 3) {
        setError('Min 3 characters');
        return;
      }

      setIsValidating(true);
      try {
        const available = await checkUsernameAvailability(value);
        setError(available ? null : 'Username is taken');
      } finally {
        setIsValidating(false);
      }
    },
    300 // 300ms задержка
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    debouncedValidate(value);
  };

  return (
    <div>
      <input value={username} onChange={handleChange} />
      {isValidating && <span>Checking...</span>}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

### Abort Previous Requests

**Проблема:**
Старые запросы могут вернуться после новых (race condition).

**Решение: AbortController**

```tsx
function UsernameFormWithAbort() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const validateUsername = async (value: string) => {
    // Отменяем предыдущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Создаём новый controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `/api/check-username?username=${value}`,
        { signal: abortControllerRef.current.signal }
      );
      const data = await response.json();
      return data.available;
    } catch (error) {
      if (error.name === 'AbortError') {
        // Запрос был отменён, игнорируем
        return true;
      }
      throw error;
    }
  };

  // ... rest of component
}
```

### @nexus-state/form подход

```tsx
const formAtom = createFormAtom(
  z.object({
    username: z.string().refine(async (value) => {
      const response = await fetch(`/api/check-username?username=${value}`);
      const data = await response.json();
      return data.available;
    }, 'Username is taken')
  }),
  { username: '' },
  {
    validateDebounce: 300,
    validateMode: 'onBlur'
  }
);

// Автоматически:
// - Debouncing
// - Abort previous requests
// - Loading state (formState.isValidating)
```

### Best Practices

**1. Debounce delay:**
- 300-500ms для большинства случаев
- 500-1000ms для дорогих операций

**2. Timing:**
- `onBlur` для async validation (не onChange)
- Показывать loading indicator

**3. Error handling:**
- Обрабатывать network errors
- Показывать понятные сообщения

**4. Caching:**
- Кешировать результаты для повторных проверок

```tsx
const cache = new Map<string, boolean>();

const checkWithCache = async (username: string) => {
  if (cache.has(username)) {
    return cache.get(username);
  }
  
  const result = await checkUsernameAvailability(username);
  cache.set(username, result);
  return result;
};
```


---

## 3. Hybrid Validation

Hybrid validation — это комбинация client-side и server-side валидации для оптимального баланса UX и безопасности.

### Best Practice подход

**Стратегия:**
1. **Client:** формат, длина, обязательность (мгновенно)
2. **Server:** уникальность, бизнес-правила (async)

### Пример: Email Registration

```tsx
function EmailRegistrationForm() {
  const { register, formState: { errors } } = useForm({
    mode: 'onBlur'
  });

  return (
    <form>
      <input
        type="email"
        {...register('email', {
          // Client validation (мгновенно)
          required: 'Email required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email format'
          },
          // Server validation (async)
          validate: async (value) => {
            const response = await fetch('/api/check-email', {
              method: 'POST',
              body: JSON.stringify({ email: value })
            });
            const data = await response.json();
            return data.available || 'Email already registered';
          }
        })}
      />
      {errors.email && <span>{errors.email.message}</span>}
    </form>
  );
}
```

### Timing Strategy

| Timing | Client Validation | Server Validation |
|--------|-------------------|-------------------|
| **onChange** | ✅ Формат | ❌ Слишком часто |
| **onBlur** | ✅ Финальная проверка | ✅ После ухода из поля |
| **onSubmit** | ✅ Всё | ✅ Финальная проверка |

---

## 4. Form Persistence

Form persistence — это сохранение данных формы для предотвращения потери при refresh или закрытии страницы.

### Зачем нужна Persistence

**Use cases:**
- Длинные формы (анкеты, заявки)
- Предотвращение потери данных
- Восстановление после refresh
- Draft functionality

### localStorage Strategy

```tsx
function PersistentForm() {
  const STORAGE_KEY = 'form-draft';
  
  const { register, watch, setValue } = useForm({
    defaultValues: () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { name: '', email: '' };
    }
  });

  const formValues = watch();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formValues));
    }, 1000); // Debounce 1 секунда

    return () => clearTimeout(timeoutId);
  }, [formValues]);

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <form>
      <input {...register('name')} />
      <input {...register('email')} />
      <button type="submit">Submit</button>
      <button type="button" onClick={clearDraft}>Clear Draft</button>
    </form>
  );
}
```

### Auto-save с индикатором

```tsx
function AutoSaveForm() {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  const formValues = watch();

  useEffect(() => {
    setSaveStatus('unsaved');
    
    const timeoutId = setTimeout(async () => {
      setSaveStatus('saving');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formValues));
      
      setSaveStatus('saved');
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formValues]);

  return (
    <div>
      <form>...</form>
      <div className="save-status">
        {saveStatus === 'saved' && '✓ Saved'}
        {saveStatus === 'saving' && '⏳ Saving...'}
        {saveStatus === 'unsaved' && '• Unsaved changes'}
      </div>
    </div>
  );
}
```

### Confirm перед потерей данных

```tsx
function FormWithConfirm() {
  const { formState: { isDirty } } = useForm();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
}
```

---

## 5. Integration с TanStack Query

TanStack Query (React Query) — мощный инструмент для работы с server state. Интеграция с формами критична для real-world приложений.

### Pattern 1: Load → Edit → Submit

```tsx
function EditUserForm({ userId }: { userId: string }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  });

  const { mutate: updateUser } = useMutation({
    mutationFn: (data: User) => updateUserAPI(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user', userId]);
    }
  });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (user) {
      reset(user);
    }
  }, [user, reset]);

  const onSubmit = (data: User) => {
    updateUser(data);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      <input {...register('email')} />
      <button type="submit">Save</button>
    </form>
  );
}
```

### Pattern 2: Optimistic Updates

```tsx
function OptimisticForm({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: updateUserAPI,
    onMutate: async (newData) => {
      await queryClient.cancelQueries(['user', userId]);
      const previousUser = queryClient.getQueryData(['user', userId]);
      queryClient.setQueryData(['user', userId], newData);
      return { previousUser };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(['user', userId], context?.previousUser);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['user', userId]);
    }
  });
}
```

---

## Заключение

В этой четвёртой части мы освоили продвинутые паттерны валидации и persistence:

### Ключевые выводы

**1. Cross-field Validation:**
- watch() для доступа к зависимым полям
- Schema refine() для сложных правил
- Проверка существования зависимых значений

**2. Async Validation:**
- Debouncing обязателен (300-500ms)
- AbortController для отмены запросов
- onBlur для timing
- Caching для оптимизации

**3. Hybrid Validation:**
- Client для формата (мгновенно)
- Server для уникальности (async)
- Best practice подход

**4. Form Persistence:**
- localStorage для drafts
- Auto-save с debouncing
- Confirm перед потерей данных

**5. Query Integration:**
- Load → Edit → Submit pattern
- Optimistic updates
- Invalidation после submit

### Что дальше

**Часть 5: Form Builder** (следующая неделя)
- Schema-driven Architecture
- Drag-and-Drop интерфейс
- Component Registry
- Live Preview
- Export to Code
- Undo/Redo с Time Travel

**Часть 6: DSL для валидации** (финал)
- Создание собственного DSL
- Parser Implementation
- Query Integration
- Real-world Examples
- Итоги всей серии

### Полезные ссылки

**Документация:**
- [React Hook Form Async Validation](https://react-hook-form.com/advanced-usage#AsyncValidation)
- [TanStack Query](https://tanstack.com/query/latest)
- [use-debounce](https://github.com/xnimorz/use-debounce)

**Другие части серии:**
- [Часть 1: Foundations & Patterns](../part-01-foundations-patterns/draft.md)
- [Часть 2: UX & Accessibility](../part-02-ux-accessibility/draft.md)
- [Часть 3: Advanced Patterns I](../part-03-advanced-patterns-1/draft.md)
- [Query Series](../../article-query/) — Server state management

**Обратная связь:**
Буду рад вашим комментариям и вопросам! Пишите в комментариях или в [GitHub Issues](https://github.com/eustatos/nexus-state/issues).

---

**Предыдущая статья:** [Часть 3: Advanced Patterns I](../part-03-advanced-patterns-1/draft.md)  
**Следующая статья:** [Часть 5: Form Builder](../part-05-form-builder/draft.md)

