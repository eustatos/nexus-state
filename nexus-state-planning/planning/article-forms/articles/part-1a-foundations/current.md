---
title: "Паттерны управления формами: Часть 1A — Foundations"
published: false
description: "Систематизация знаний о формах: Controlled vs Uncontrolled, валидация, ошибки, accessibility. Базовые паттерны для React/Vue/Svelte. Часть 1A из 6."
tags: [webdev, react, javascript, forms]
series: "Forms Patterns"
cover_image: 
canonical_url: 
---

# Паттерны управления формами: Часть 1A — Foundations

**Серия:** Forms Patterns  
**Часть:** 1A из 6  
**Время чтения:** 12 минут  
**Уровень:** От новичка до среднего

---

## Введение

Эта статья систематизирует базовые знания о формах: от управления состоянием до валидации. Здесь нет привязки к конкретной библиотеке — только паттерны, которые проверены на практике.

**Статья отвечает на вопросы:**

| Категория | Вопросы |
|-----------|---------|
| **Требования** | Что обязательно должно быть в форме? |
| **Сценарии** | Какие формы бывают и чем отличаются? |
| **Решения** | Какие паттерны применять в каждом случае? |

**Что вы получите:**

- Поймёте разницу между Controlled и Uncontrolled
- Научитесь строить валидацию без боли
- Узнаете как показывать ошибки правильно
- Изучите обязательные требования ARIA

> **📖 О примерах кода**
>
> Примеры приведены на React, так как это наиболее распространённый фреймворк. Концепции универсальны и применимы к Vue, Svelte и другим фреймворкам.

### 📖 Как использовать эту статью

**Если у вас проблема...**

- **Форма тормозит при вводе** → Часть 2 (Performance)
- **Данные теряются при синхронизации** → Часть 2 (Server State)
- **Пользователи не понимают ошибки** → Часть 1B (Error Handling)
- **Нужна доступность для скринридеров** → Эта статья (Accessibility)
- **Валидация не работает с сервером** → Часть 1B (Hybrid Validation)

---

## 1. Controlled vs Uncontrolled Components

Понимание разницы между Controlled и Uncontrolled компонентами — фундамент для работы с любыми формами. Этот паттерн определяет, как вы будете управлять состоянием полей ввода.

### Теория

#### Концепция

**Controlled Components:**

**Определение:** Компоненты, где значение input контролируется через state.

**Характеристики:**
- Значение хранится в state
- Изменения обрабатываются через onChange
- Источник истины — state

**Uncontrolled Components:**

**Определение:** Компоненты, где значение хранится в DOM.

**Характеристики:**
- Значение хранится в DOM
- Доступ через ref **или** FormData
- Меньше бойлерплейта

**Способы доступа к значению в Uncontrolled:**

```tsx
// Способ 1: useRef — явное чтение
const inputRef = useRef(null);
const value = inputRef.current.value;

// Способ 2: FormData — при сабмите
const handleSubmit = (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const value = formData.get('fieldName');
};

// Способ 3: defaultValue — начальное значение
<input defaultValue="initial" name="fieldName" />
```

**Важно о useRef:**

```tsx
const inputRef = useRef(null);

// ❌ НЕПРАВИЛЬНО: current может быть null при первом рендере
const value = inputRef.current.value; // Ошибка!

// ✅ ПРАВИЛЬНО: Проверка на null
const value = inputRef.current?.value || '';

// ✅ ПРАВИЛЬНО: Использование в событиях
const handleSubmit = () => {
  const value = inputRef.current.value; // ✅ Безопасно после монтирования
};
```

#### Сравнение подходов

| Критерий | Controlled | Uncontrolled |
|----------|------------|--------------|
| **Источник истины** | State | DOM |
| **Бойлерплейт** | Высокий | Низкий |
| **Валидация** | Мгновенная | При сабмите |
| **Производительность** | Ререндер при изменении | Минимальные ререндеры |
| **Time Travel** | ✅ Легко | ❌ Сложно |

**Когда использовать Controlled:**
- Мгновенная валидация
- Зависимые поля
- Форматирование ввода
- Conditional fields

**Когда использовать Uncontrolled:**

| Сценарий | Почему | Пример |
|----------|--------|--------|
| **Формы с 50+ полями** | Меньше ререндеров | Анкета, опрос |
| **Поля не зависят друг от друга** | Проще контроль | Независимые поля |
| **Валидация только при сабмите** | Не нужна мгновенная | Форма обратной связи |
| **Интеграция с библиотеками** | Проще работать с DOM | jQuery плагины, карты |
| **Файловые input** | Работает только через ref | `<input type="file" />` |

---

### Практика

#### Пример 1: Controlled для валидации

```tsx
function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

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
```

#### Пример 2: Uncontrolled через FormData

```tsx
function ContactForm({ onSubmit }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
    };
    onSubmit(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" defaultValue="" />
      <input name="email" type="email" defaultValue="" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

#### Разбор

**Нюансы:**
- ❌ Не смешивать `value` и `defaultValue`
- ✅ Использовать `key` для динамических полей
- ✅ FormData автоматически кодирует данные

**Перекрёстные ссылки:**
- → Часть 1B: Error Handling _(в подготовке)_
- → Часть 2: Performance Optimization _(в подготовке)_

---

## 2. Validation Patterns

После того как вы определились с подходом к управлению состоянием (Controlled/Uncontrolled), следующий шаг — валидация данных.

### Теория

#### Концепция

**Client-side Validation:**

**Определение:** Валидация выполняется в браузере, без запроса к серверу.

**Преимущества:**
- ✅ Мгновенная обратная связь
- ✅ Снижение нагрузки на сервер
- ✅ Работает офлайн

**Недостатки:**
- ❌ **Можно обойти** — пользователь может отключить JavaScript, изменить код в DevTools или отправить запрос напрямую. **Поэтому server-side валидация обязательна для безопасности.**
- ❌ Дублирование логики с сервером

**Server-side Validation:**

**Определение:** Валидация выполняется на сервере после отправки формы.

**Преимущества:**
- ✅ Единый источник истины
- ✅ Нельзя обойти
- ✅ Доступ к данным БД

**Недостатки:**
- ❌ Задержка (сетевой запрос)
- ❌ Не работает офлайн

**Hybrid Validation:**

**Определение:** Комбинация client-side и server-side валидации.

**Преимущества:**
- ✅ Мгновенная обратная связь для простых правил
- ✅ Надёжность серверной валидации

#### Типы ошибок

**Технические:**

| Тип | Описание | Пример |
|-----|----------|--------|
| **Required** | Поле обязательно | «Name is required» |
| **Format** | Неверный формат | «Invalid email format» |
| **Range** | Вне диапазона | «Age must be 18-120» |
| **Length** | Неверная длина | «Password min 8 chars» |

**Бизнес-правила:**

| Тип | Описание | Пример |
|-----|----------|--------|
| **Business Rule** | Нарушение правила | «Discount exceeds limit» |
| **Permission** | Нет прав | «Cannot approve — no permission» |
| **Unique** | Не уникально | «Email already exists» |

#### Best Practices

| Практика | Описание | Зачем |
|----------|----------|-------|
| **Валидация при изменении** | Для мгновенной обратной связи | UX |
| **Валидация при blur** | Для снижения шума | Меньше ошибок при вводе |
| **Валидация при сабмите** | Обязательно всегда | Финальная проверка |
| **Debouncing** | 300-500ms задержка | Избежание частых запросов |

---

### Практика

#### Пример: Hybrid валидация

```tsx
function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function HybridValidation() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  
  // Client-side: формат
  const validateFormat = (value) => {
    if (!value) return 'Email required';
    if (!isValidEmail(value)) {
      return 'Invalid email format';
    }
    return null;
  };
  
  // Server-side: уникальность
  const validateUnique = useCallback(async (value) => {
    const response = await fetch(`/api/check-email?email=${value}`);
    const result = await response.json();
    return result.exists ? 'Email already exists' : null;
  }, []);
  
  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setError(validateFormat(value));
  };
  
  const handleBlur = useCallback(async () => {
    if (!error && email) {
      const uniqueError = await validateUnique(email);
      setError(uniqueError || null);
    }
  }, [error, email, validateUnique]);
  
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

#### Разбор

**Нюансы:**
- ✅ Debounce для async валидации
- ✅ Не очищать ошибку при начале ввода
- ✅ handleBlur должен быть async для server validation

**Перекрёстные ссылки:**
- → Часть 1B: Error Scenarios _(в подготовке)_
- → Часть 4: DSL для валидации _(в подготовке)_

---

## 3. Error Handling & UX

После определения паттернов валидации, следующий логический шаг — правильное отображение ошибок.

### Теория

#### Отображение ошибок

**Inline Errors (рекомендуется для большинства случаев):**

**Преимущества:**
- ✅ Ясно, какое поле ошибочно
- ✅ Accessibility (aria-invalid)
- ✅ Не теряется контекст

**Summary Errors:**

**Преимущества:**
- ✅ Обзор всех ошибок
- ✅ Ссылки на поля
- ✅ Хорошо для больших форм

#### UX рекомендации

| Рекомендация | Описание |
|--------------|----------|
| **Не показывать ошибки до взаимодействия** | Не пугать пользователя сразу |
| **Не очищать ошибку при начале ввода** | Дать исправить полностью |
| **Очищать при успешной валидации** | Положительное подкрепление |
| **Фокус на первое ошибочное поле** | При сабмите с ошибками |

---

### Практика

#### Пример 1: Inline Errors с accessibility

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

#### Пример 2: Error Summary

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

#### Разбор

**Нюансы:**
- ✅ `role="alert"` для скринридеров
- ✅ `aria-invalid` для валидации
- ✅ Уникальные ID для всех элементов

**Перекрёстные ссылки:**
- → Часть 4: Accessibility _(в подготовке)_
- → Часть 5: Error Scenarios _(в подготовке)_

---

## 4. Accessibility (WAI-ARIA)

Понимание доступности форм критично для создания инклюзивных интерфейсов.

### Теория

#### Обязательные атрибуты

| Атрибут | Значение | Описание |
|---------|----------|----------|
| `htmlFor` / `id` | Связь label и input | Клик на label фокусит input |
| `aria-invalid` | `true`/`false` | Поле невалидно |
| `aria-describedby` | ID элемента | Ссылка на описание/ошибку |
| `aria-required` | `true`/`false` | Поле обязательно |
| `role="alert"` | Для ошибок | Screen reader объявит сразу |

#### Keyboard Navigation

| Клавиша | Действие |
|---------|----------|
| `Tab` | Следующее поле |
| `Shift+Tab` | Предыдущее поле |
| `Enter` | Отправка формы |
| `Space` | Чекбокс/радио |
| `Arrow keys` | Радио кнопки, select |

#### Focus Management

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

### Практика

#### Пример: Доступная форма

```tsx
<form aria-labelledby="form-title">
  <h2 id="form-title">Contact Information</h2>
  
  <div className="form-field">
    <label htmlFor="name">
      Name <span aria-hidden="true">*</span>
    </label>
    <input
      id="name"
      name="name"
      required
      aria-required="true"
    />
  </div>
  
  <div className="form-field">
    <label htmlFor="email">Email</label>
    <input
      id="email"
      name="email"
      type="email"
      aria-invalid={!!emailError}
      aria-describedby={emailError ? 'email-error' : 'email-hint'}
    />
    {emailError && (
      <span id="email-error" role="alert">{emailError}</span>
    )}
  </div>
</form>
```

#### Разбор

**Нюансы:**
- ✅ `aria-hidden="true"` для декоративных элементов
- ✅ Уникальные ID для всех элементов

**Перекрёстные ссылки:**
- → [MDN ARIA Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)

---

## Заключение

### Ключевые выводы

1. **Controlled vs Uncontrolled**
   - Controlled для валидации и зависимых полей
   - Uncontrolled для простых и больших форм
   - **Доступ через ref или FormData**

2. **Validation Patterns**
   - Hybrid validation — лучший UX
   - **Client-side можно обойти** — server-side обязателен
   - Технические + Бизнес-ошибки

3. **Error Handling**
   - Inline errors с accessibility
   - UX рекомендации важны

4. **Accessibility**
   - Обязательные атрибуты
   - Keyboard navigation

### Что дальше

**Продолжение серии:**

- **[Часть 1B: Error Handling & Advanced Validation](#)** _(скоро)_ — серверная валидация, сценарии ошибок
- **[Часть 2: Advanced Architecture](#)** _(скоро)_ — Server State vs Form State, синхронизация, оптимизация
- **[Часть 3: Form Builder](#)** _(скоро)_ — визуальный конструктор форм
- **[Часть 4: DSL для валидации](#)** _(скоро)_ — декларативная валидация
- **[Часть 5: Error Scenarios](#)** _(скоро)_ — продвинутые сценарии обработки ошибок

**Если у вас сейчас проблема...**

| Проблема | Читайте |
|----------|---------|
| Форма тормозит при вводе | Часть 2 (Performance) |
| Данные теряются при синхронизации | Часть 2 (Server State) |
| Сервер возвращает ошибки валидации | Часть 1B (Server Validation) |
| Нужна сложная валидация | Часть 4 (DSL) |

---

## Продолжение серии

**Следующая часть:** [Часть 1B: Error Handling & Advanced Validation](#) _(скоро)_

**Серия «Forms Patterns»:**
1. ✅ **Часть 1A: Foundations** (текущая)
2. ⏳ Часть 1B: Error Handling & Advanced Validation _(скоро)_
3. ⏳ Часть 2: Advanced Architecture _(скоро)_
4. ⏳ Часть 3: Form Builder _(скоро)_
5. ⏳ Часть 4: DSL для валидации _(скоро)_
6. ⏳ Часть 5: Error Scenarios _(скоро)_

**Паттерны:** Framework-agnostic

---

## Источники

1. **[WAI-ARIA Forms](https://www.w3.org/WAI/ARIA/apg/patterns/form/)** — Accessibility требования
2. **[React Forms Documentation](https://react.dev/learn/forms)** — Controlled vs Uncontrolled
3. **[Patterns.dev - Forms](https://www.patterns.dev/)** — Validation Patterns
4. **[MDN ARIA Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)** — Полное руководство
5. **[Web.dev Forms](https://web.dev/learn/forms/)** — Error Handling & UX
