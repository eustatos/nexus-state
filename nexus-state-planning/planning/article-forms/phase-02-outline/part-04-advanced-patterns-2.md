# Часть 4: Advanced Patterns II

**Целевая длина:** 2500-3000 слов (~10-12 минут чтения)  
**Статус:** 📝 Draft  
**Дата создания:** Март 2026

---

## 🎯 Цели статьи

1. Показать Cross-field Validation (зависимые поля)
2. Реализовать Async Validation с debouncing
3. Объяснить Hybrid Validation (client + server)
4. Научить Form Persistence (auto-save)
5. Интегрировать формы с Query для server state

---

## 📋 Детальная структура

### Введение (150-200 слов)

**Recap Части 3:**
- Multi-step Forms (wizards)
- Dynamic Forms (conditional fields)
- Form Arrays (repeatable fields)

**Переход к валидации и persistence:**
- Базовые паттерны освоены
- Теперь сложная валидация
- Интеграция с server state

**Что будет в статье:**
- Cross-field Validation
- Async Validation + debouncing
- Hybrid Validation
- Form Persistence
- Integration с Query

---

### 1. Cross-field Validation (500-600 слов)

#### 1.1. Что такое Cross-field Validation

**Определение:**
Валидация, где правило зависит от значений нескольких полей

**Use cases:**
- Password и Confirm Password
- Start Date и End Date
- Min Price и Max Price
- Discount и Min Order Amount

#### 1.2. Password Confirmation

**React Hook Form:**
```tsx
function PasswordForm() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    mode: 'onChange'
  });

  const password = watch('password');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
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

      <div>
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
        {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

#### 1.3. Date Range Validation

```tsx
function DateRangeForm() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const startDate = watch('startDate');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="startDate">Start Date</label>
        <input
          id="startDate"
          type="date"
          {...register('startDate', { required: 'Start date required' })}
        />
      </div>

      <div>
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

#### 1.4. Schema-based Cross-field Validation

**Zod:**
```tsx
const schema = z.object({
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
```

#### 1.5. Complex Business Rules

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
```

---

### 2. Async Validation (600-700 слов)

#### 2.1. Что такое Async Validation

**Определение:**
Валидация, требующая асинхронных операций (обычно server requests)

**Use cases:**
- Проверка уникальности username/email
- Проверка доступности домена
- Валидация промокода
- Проверка существования ресурса

#### 2.2. Базовый пример

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

#### 2.3. Проблема: Слишком много запросов

**Без debouncing:**
- Каждый keystroke = API request
- Перегрузка сервера
- Плохой UX (мигающие ошибки)

#### 2.4. Решение: Debouncing

**Концепция:**
Задержка выполнения функции до окончания ввода

**Реализация:**
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

#### 2.5. Abort Previous Requests

**Проблема:**
Старые запросы могут вернуться после новых

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

#### 2.6. @nexus-state/form подход

**Встроенный debouncing:**
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

#### 2.7. API Comparison Table (из research)

| Аспект | RHF | @nexus-state/form |
|--------|-----|-------------------|
| Built-in support | ✅ | ✅ |
| Debounce | Вручную | validateDebounce: 300 |
| Abort previous | Вручную | Автоматически |
| Loading state | Вручную | formState.isValidating |

---

### 3. Hybrid Validation (400-450 слов)

#### 3.1. Best Practice подход

**Стратегия:**
1. Client: формат, длина, обязательность (мгновенно)
2. Server: уникальность, бизнес-правила (async)

#### 3.2. Пример: Email Registration

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
            // Сначала проверяем формат (уже сделано выше)
            // Затем проверяем уникальность
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

#### 3.3. Timing Strategy

**onChange:**
- ✅ Client validation (формат)
- ❌ Server validation (слишком часто)

**onBlur:**
- ✅ Client validation (финальная проверка)
- ✅ Server validation (после ухода из поля)

**onSubmit:**
- ✅ Client validation (всё)
- ✅ Server validation (финальная проверка)

#### 3.4. Schema-based Hybrid

```tsx
const emailSchema = z.object({
  email: z.string()
    .email('Invalid email format') // Client
    .refine(async (value) => {      // Server
      const response = await fetch('/api/check-email', {
        method: 'POST',
        body: JSON.stringify({ email: value })
      });
      const data = await response.json();
      return data.available;
    }, 'Email already registered')
});
```

---

### 4. Form Persistence (500-550 слов)

#### 4.1. Зачем нужна Persistence

**Use cases:**
- Длинные формы (анкеты, заявки)
- Предотвращение потери данных
- Восстановление после refresh
- Draft functionality

#### 4.2. localStorage Strategy

**Базовая реализация:**
```tsx
function PersistentForm() {
  const STORAGE_KEY = 'form-draft';
  
  const { register, watch, setValue } = useForm({
    defaultValues: () => {
      // Восстановление из localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { name: '', email: '' };
    }
  });

  const formValues = watch();

  // Auto-save при изменении
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

#### 4.3. Auto-save с индикатором

```tsx
function AutoSaveForm() {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  const formValues = watch();

  useEffect(() => {
    setSaveStatus('unsaved');
    
    const timeoutId = setTimeout(async () => {
      setSaveStatus('saving');
      
      // Сохранение
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

#### 4.4. Confirm перед потерей данных

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

  // ... rest of component
}
```

#### 4.5. @nexus-state/form подход

```tsx
const formAtom = createFormAtom(schema, initialValues, {
  persistence: {
    key: 'form-draft',
    storage: localStorage,
    debounce: 1000
  }
});

// Автоматически:
// - Сохранение в localStorage
// - Восстановление при mount
// - Debouncing
// - formState.isSaving
```

---

### 5. Integration с Query (500-600 слов)

#### 5.1. Проблема: Server State + Form State

**Два источника истины:**
- Query: server state (данные с API)
- Form: local state (пользовательский ввод)

**Сценарии:**
- Загрузка данных для редактирования
- Optimistic updates
- Синхронизация после submit

#### 5.2. Pattern 1: Load → Edit → Submit

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

  // Загрузка данных в форму
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

#### 5.3. Pattern 2: Optimistic Updates

```tsx
function OptimisticForm({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: updateUserAPI,
    onMutate: async (newData) => {
      // Отменяем текущие запросы
      await queryClient.cancelQueries(['user', userId]);

      // Сохраняем предыдущее значение
      const previousUser = queryClient.getQueryData(['user', userId]);

      // Optimistic update
      queryClient.setQueryData(['user', userId], newData);

      return { previousUser };
    },
    onError: (err, newData, context) => {
      // Откат при ошибке
      queryClient.setQueryData(['user', userId], context?.previousUser);
    },
    onSettled: () => {
      // Обновление после завершения
      queryClient.invalidateQueries(['user', userId]);
    }
  });

  // ... rest of component
}
```

#### 5.4. Pattern 3: Real-time Sync

```tsx
function SyncedForm({ userId }: { userId: string }) {
  const { data: serverData } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    refetchInterval: 5000 // Обновление каждые 5 секунд
  });

  const { watch, reset, formState: { isDirty } } = useForm();

  useEffect(() => {
    // Обновляем форму только если нет несохранённых изменений
    if (serverData && !isDirty) {
      reset(serverData);
    }
  }, [serverData, isDirty, reset]);

  // ... rest of component
}
```

#### 5.5. @nexus-state/form + Query Integration

```tsx
const userQueryAtom = createQueryAtom({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId)
});

const formAtom = createFormAtom(schema, initialValues, {
  syncWith: userQueryAtom, // Автоматическая синхронизация
  optimisticUpdates: true
});

// Автоматически:
// - Загрузка данных в форму
// - Optimistic updates
// - Синхронизация при изменении server state
// - Conflict resolution
```

---

### 6. Заключение (150-200 слов)

#### Ключевые выводы

1. **Cross-field Validation:**
   - watch() для зависимых полей
   - Schema refine() для сложных правил

2. **Async Validation:**
   - Debouncing обязателен (300-500ms)
   - Abort previous requests
   - onBlur для timing

3. **Hybrid Validation:**
   - Client для формата
   - Server для уникальности
   - Best practice подход

4. **Form Persistence:**
   - localStorage для drafts
   - Auto-save с debouncing
   - Confirm перед потерей данных

5. **Query Integration:**
   - Load → Edit → Submit pattern
   - Optimistic updates
   - Real-time sync

#### Что дальше

В **Части 5** мы рассмотрим:
- Form Builder Architecture
- Drag-and-Drop Interface
- Component Registry
- Live Preview
- Export to Code
- Undo/Redo с Time Travel

#### Ссылки

- [React Hook Form Async Validation](https://react-hook-form.com/advanced-usage#AsyncValidation)
- [TanStack Query Integration](https://tanstack.com/query/latest)
- [Query Part 2](../../article-query/part-02.md) — Async validation
- [Query Part 3](../../article-query/part-03.md) — Integration patterns

---

## 📊 Метрики

**Целевые показатели для dev.to:**
- Время чтения: 10-12 минут
- Engagement rate: >75%
- Reactions: >60
- Comments: >12

**SEO ключевые слова:**
- Cross-field validation
- Async validation React
- Form debouncing
- Form persistence
- React Query forms
- Optimistic updates

---

## ✅ Чек-лист перед публикацией

- [ ] Все примеры кода проверены
- [ ] Comparison tables актуальны
- [ ] Ссылки на Query серию добавлены
- [ ] SEO оптимизация
- [ ] Вычитка
- [ ] Проверка длины (2500-3000 слов)
- [ ] Cover image
