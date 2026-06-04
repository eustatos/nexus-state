# Часть 2: UX & Accessibility

**Целевая длина:** 2000-2500 слов (~8-10 минут чтения)  
**Статус:** 📝 Draft  
**Дата создания:** Март 2026

---

## 🎯 Цели статьи

1. Показать best practices для Error Handling & UX
2. Объяснить требования Accessibility (WAI-ARIA)
3. Научить правильному Keyboard Navigation
4. Оптимизировать Performance форм
5. Дать Production-ready checklist

---

## 📋 Детальная структура

### Введение (150-200 слов)

**Recap Части 1:**
- Controlled vs Uncontrolled подходы
- Validation patterns (Client, Server, Hybrid)
- Schema-based validation
- Сравнение библиотек

**Почему UX и A11y критичны:**
- Статистика: 15% пользователей используют assistive technologies
- Плохой UX форм = потеря конверсии
- Accessibility = не опция, а требование (WCAG 2.1)

**Что будет в статье:**
- Error Handling & UX patterns
- WAI-ARIA атрибуты
- Keyboard Navigation
- Performance optimization
- Production checklist

---

### 1. Error Handling & UX (500-550 слов)

#### 1.1. Типы ошибок

| Тип | Описание | Пример |
|-----|----------|--------|
| Required | Поле обязательно | "Name is required" |
| Format | Неверный формат | "Invalid email format" |
| Range | Вне диапазона | "Age must be 18-120" |
| Length | Неверная длина | "Password min 8 chars" |
| Pattern | Не соответствует паттерну | "Only letters allowed" |
| Unique | Не уникально | "Email already exists" |
| Server | Ошибка сервера | "Service unavailable" |

#### 1.2. Inline Errors (Рекомендуется)

**Преимущества:**
- ✅ Ясно, какое поле ошибочно
- ✅ Не теряется контекст
- ✅ Accessibility-friendly

**Пример:**
```tsx
<div className="form-field">
  <label htmlFor="email">Email</label>
  <input
    id="email"
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
```

#### 1.3. Error Summary

**Когда использовать:**
- Большие формы (>10 полей)
- Множественные ошибки
- После submit

**Пример:**
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

#### 1.4. Timing: Когда показывать ошибки

**onChange (мгновенно):**
- ✅ Для: форматирование, маски
- ❌ Против: раздражает пользователя

**onBlur (после ухода из поля):**
- ✅ Для: большинство валидаций
- ✅ Баланс между UX и feedback

**onSubmit (при отправке):**
- ✅ Для: финальная проверка
- ❌ Против: поздно для feedback

**Best Practice: Комбинированный подход**
```tsx
const [touched, setTouched] = useState({});

// Показывать ошибку только если:
// 1. Поле было touched (onBlur)
// 2. ИЛИ форма была submitted
const showError = (field) => {
  return (touched[field] || isSubmitted) && errors[field];
};
```

#### 1.5. UX Рекомендации

| Рекомендация | Описание |
|--------------|----------|
| **Не показывать ошибки сразу** | Дать пользователю начать ввод |
| **Показывать при blur** | После ухода из поля |
| **Не очищать при начале ввода** | Дать исправить полностью |
| **Очищать при успехе** | Положительное подкрепление |
| **Сохранять значение** | Не заставлять вводить заново |
| **Фокус на первую ошибку** | При submit с ошибками |

---

### 2. Accessibility (WAI-ARIA) (450-500 слов)

#### 2.1. Обязательные атрибуты

**Таблица атрибутов:**

| Атрибут | Значение | Описание |
|---------|----------|----------|
| `htmlFor` / `id` | Связь label и input | Клик на label фокусит input |
| `aria-invalid` | `true`/`false` | Поле невалидно |
| `aria-describedby` | ID элемента | Ссылка на описание/ошибку |
| `aria-required` | `true`/`false` | Поле обязательно |
| `role="alert"` | Для ошибок | Screen reader объявит сразу |

#### 2.2. Пример доступной формы

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

#### 2.3. Screen Readers

**Что объявляет screen reader:**
1. Label текст
2. Тип поля (text, email, password)
3. Обязательность (aria-required)
4. Текущее значение
5. Описание (aria-describedby)
6. Статус валидности (aria-invalid)
7. Ошибки (role="alert")

**Best Practices:**
- Всегда связывать label с input
- Использовать семантические HTML элементы
- Добавлять aria-* атрибуты для дополнительного контекста
- Тестировать с реальными screen readers (NVDA, JAWS, VoiceOver)

---

### 3. Keyboard Navigation (350-400 слов)

#### 3.1. Стандартные клавиши

| Клавиша | Действие |
|---------|----------|
| `Tab` | Следующее поле |
| `Shift+Tab` | Предыдущее поле |
| `Enter` | Отправка формы |
| `Space` | Чекбокс/радио |
| `Arrow keys` | Радио кнопки, select |
| `Esc` | Закрыть модал/dropdown |

#### 3.2. Focus Management

**Автоматический фокус на первую ошибку:**
```tsx
const handleSubmit = (e) => {
  e.preventDefault();

  if (errors.length > 0) {
    // Найти первое поле с ошибкой
    const firstErrorField = document.querySelector('[aria-invalid="true"]');
    if (firstErrorField) {
      firstErrorField.focus();
    }
  }
};
```

**Focus trap для модальных форм:**
```tsx
useEffect(() => {
  if (isModalOpen) {
    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement.focus();

    const handleTab = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab);
    return () => modal.removeEventListener('keydown', handleTab);
  }
}, [isModalOpen]);
```

#### 3.3. Tab Order

**Правильный порядок:**
1. Логический порядок (сверху вниз, слева направо)
2. Без пропусков
3. Без циклов

**Управление tabindex:**
- `tabindex="0"` — в естественном порядке
- `tabindex="-1"` — программный фокус, но не в Tab order
- `tabindex="1+"` — избегать (нарушает естественный порядок)

---

### 4. Performance Patterns (450-500 слов)

#### 4.1. Проблема: Ререндеры

**Controlled формы → ререндер при каждом изменении:**
```tsx
// Каждый keystroke = ререндер всей формы
const [values, setValues] = useState({ name: '', email: '', bio: '' });
```

**Измерение:**
```tsx
// React DevTools Profiler
// Или
console.time('render');
// ... render logic
console.timeEnd('render');
```

#### 4.2. Решение 1: Uncontrolled подход

**React Hook Form:**
```tsx
const { register } = useForm();
// Минимальные ререндеры
<input {...register('name')} />
```

#### 4.3. Решение 2: Debouncing

**Для async validation:**
```tsx
import { useDebouncedCallback } from 'use-debounce';

const debouncedValidate = useDebouncedCallback(
  async (value) => {
    const result = await validateOnServer(value);
    setError(result.error);
  },
  300 // 300ms задержка
);

const handleChange = (e) => {
  const value = e.target.value;
  setValue(value);
  debouncedValidate(value);
};
```

#### 4.4. Решение 3: Мемоизация

**Мемоизация компонентов полей:**
```tsx
const FormField = React.memo(({ name, value, onChange, error }) => {
  return (
    <div>
      <input value={value} onChange={onChange} />
      {error && <span>{error}</span>}
    </div>
  );
});
```

#### 4.5. Решение 4: Atom-based state

**@nexus-state/form:**
```tsx
// Каждое поле = отдельный atom
// Изменение одного поля не ререндерит другие
const formAtom = createFormAtom(schema, initialValues);
```

#### 4.6. Benchmarks

**Таблица производительности (1000 полей):**

| Подход | Ререндеры | Время (ms) |
|--------|-----------|------------|
| Controlled (naive) | 1000 | 450ms |
| Controlled + memo | 1 | 50ms |
| Uncontrolled (RHF) | 1 | 30ms |
| Atom-based | 1 | 35ms |

#### 4.7. Best Practices

1. **Используйте Uncontrolled для больших форм**
2. **Debounce async validation (300-500ms)**
3. **Мемоизируйте компоненты полей**
4. **Избегайте inline функций в onChange**
5. **Используйте React DevTools Profiler**

---

### 5. Best Practices Checklist (300-350 слов)

#### 5.1. Validation

- [ ] Client-side validation для формата
- [ ] Server-side validation для уникальности
- [ ] Schema-based validation (Zod/Yup)
- [ ] Async validation с debouncing
- [ ] Cross-field validation где нужно

#### 5.2. Error Handling

- [ ] Inline errors для каждого поля
- [ ] Error summary для больших форм
- [ ] Показывать ошибки после blur
- [ ] Фокус на первую ошибку при submit
- [ ] Сохранять значения при ошибках

#### 5.3. Accessibility

- [ ] Все inputs имеют labels
- [ ] aria-invalid для ошибочных полей
- [ ] aria-describedby для описаний/ошибок
- [ ] aria-required для обязательных полей
- [ ] role="alert" для ошибок
- [ ] Keyboard navigation работает
- [ ] Тестировано с screen reader

#### 5.4. Performance

- [ ] Минимальные ререндеры
- [ ] Debouncing для async validation
- [ ] Мемоизация компонентов
- [ ] Profiling в React DevTools

#### 5.5. UX

- [ ] Loading states для async операций
- [ ] Disabled state для submit button
- [ ] Success feedback после submit
- [ ] Auto-save для длинных форм
- [ ] Confirm перед потерей данных

#### 5.6. Security

- [ ] HTTPS для передачи данных
- [ ] CSRF protection
- [ ] Rate limiting для submit
- [ ] Sanitization пользовательского ввода
- [ ] Не логировать sensitive данные

#### 5.7. Testing

- [ ] Unit tests для validation logic
- [ ] Integration tests для форм
- [ ] E2E tests для критичных форм
- [ ] Accessibility tests (axe-core)
- [ ] Performance tests

---

### 6. Заключение (150-200 слов)

#### Ключевые выводы

1. **Error Handling:**
   - Inline errors + Error summary
   - Показывать после blur
   - Фокус на первую ошибку

2. **Accessibility:**
   - WAI-ARIA атрибуты обязательны
   - Keyboard navigation критична
   - Тестировать с screen readers

3. **Performance:**
   - Uncontrolled для больших форм
   - Debouncing для async validation
   - Мемоизация компонентов

4. **Production Checklist:**
   - Validation + Error Handling + A11y + Performance + UX + Security + Testing

#### Что дальше

В **Части 3** мы рассмотрим:
- Multi-step Forms (wizards)
- Dynamic Forms (conditional fields)
- Form Arrays (repeatable fields)
- Примеры с RHF и @nexus-state/form

#### Ссылки

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [React Hook Form Performance](https://react-hook-form.com/advanced-usage#PerformanceOptimization)
- [Time Travel Part 2](../../article-time-travel/part-02.md) — Performance patterns

---

## 📊 Метрики

**Целевые показатели для dev.to:**
- Время чтения: 8-10 минут
- Engagement rate: >75%
- Reactions: >50
- Comments: >10

**SEO ключевые слова:**
- Form accessibility
- WAI-ARIA forms
- Form error handling
- Form performance
- React forms UX
- Keyboard navigation

---

## ✅ Чек-лист перед публикацией

- [ ] Все примеры кода проверены
- [ ] Accessibility примеры валидны
- [ ] Ссылки на WCAG актуальны
- [ ] Перекрёстные ссылки добавлены
- [ ] SEO оптимизация
- [ ] Вычитка
- [ ] Проверка длины (2000-2500 слов)
- [ ] Cover image
