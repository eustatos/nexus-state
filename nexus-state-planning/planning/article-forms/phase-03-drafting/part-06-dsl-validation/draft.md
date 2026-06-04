# Forms в Nexus State: Часть 6 — DSL для валидации (Финал)

**Статус:** ✅ Complete  
**Целевая длина:** 2500-3000 слов  
**Время чтения:** 10-12 минут

---

## Метаданные для dev.to

**Title:** Forms в Nexus State: Часть 6 — DSL для валидации (Финал)  
**Tags:** react, forms, dsl, typescript  
**Series:** Forms в Nexus State  
**Published:** false

---

## Введение

Мы прошли долгий путь в этой серии статей о формах:
- [Часть 1](../part-01-foundations-patterns/draft.md): Foundations & Patterns
- [Часть 2](../part-02-ux-accessibility/draft.md): UX & Accessibility
- [Часть 3](../part-03-advanced-patterns-1/draft.md): Multi-step, Dynamic, Arrays
- [Часть 4](../part-04-advanced-patterns-2/draft.md): Cross-field, Async, Persistence
- [Часть 5](../part-05-form-builder/draft.md): Form Builder

В этой финальной части мы создадим **DSL (Domain-Specific Language)** для валидации форм — собственный язык для описания правил валидации:
- **Зачем нужен DSL** — проблемы существующих решений
- **DSL Design Principles** — принципы проектирования
- **Syntax Examples** — примеры синтаксиса
- **Parser Implementation** — реализация парсера
- **Error Messages** — человекочитаемые сообщения
- **Composition & Reuse** — переиспользование правил
- **Query Integration** — интеграция с TanStack Query
- **Real-world Examples** — практические примеры

---

## 1. Зачем нужен DSL

Существующие решения (Zod, Yup, Joi) мощные, но имеют недостатки для определённых сценариев.

### Проблемы существующих решений

**1. Сложность для non-developers:**

```typescript
// Zod - требует знания TypeScript
const schema = z.object({
  email: z.string().email().min(5).max(100),
  age: z.number().min(18).max(120)
});
```

**Проблема:** Бизнес-аналитики и product managers не могут редактировать правила.

**2. Verbose синтаксис:**

```typescript
// Yup - много бойлерплейта
const schema = yup.object().shape({
  password: yup.string()
    .required('Password required')
    .min(8, 'Min 8 characters')
    .matches(/[A-Z]/, 'Need uppercase')
    .matches(/[0-9]/, 'Need number')
    .matches(/[!@#$%^&*]/, 'Need special char')
});
```

**Проблема:** Много повторяющегося кода для простых правил.

**3. Сложно хранить в БД:**

```typescript
// Невозможно сохранить в JSON
const schema = z.object({
  email: z.string().refine(async (val) => {
    return await checkUnique(val);
  })
});
```

**Проблема:** Функции нельзя сериализовать в JSON для хранения в БД.

### Решение: Декларативный DSL

```
email: required, email, min:5, max:100
age: required, number, min:18, max:120
password: required, min:8, uppercase, number, special
username: required, min:3, unique:users.username
```

**Преимущества:**
- ✅ Читаемо для non-developers
- ✅ Компактный синтаксис
- ✅ Легко хранить в БД (plain text)
- ✅ Легко редактировать через UI
- ✅ Можно генерировать из Form Builder

---

## 2. DSL Design Principles

При проектировании DSL важно следовать принципам хорошего дизайна языков.

### Принципы

**1. Readability (Читаемость):**
```
# ✅ Хорошо
email: required, email, max:100

# ❌ Плохо
email: req && email() && max(100)
```

**2. Simplicity (Простота):**
```
# ✅ Хорошо
age: number, min:18

# ❌ Плохо
age: type=number AND constraint=min(18)
```

**3. Consistency (Консистентность):**
```
# ✅ Хорошо - единый формат
min:8
max:100
length:10

# ❌ Плохо - разные форматы
min(8)
max=100
length:10
```

**4. Extensibility (Расширяемость):**
```
# Легко добавлять новые правила
email: required, email, custom:checkDomain
```

### Syntax Design

**Базовый формат:**
```
fieldName: rule1, rule2, rule3:param
```

**Компоненты:**
- `fieldName` — имя поля
- `rule` — правило валидации
- `param` — параметр правила (опционально)
- `,` — разделитель правил

**Примеры:**
```
# Простые правила
email: required, email
age: number

# Правила с параметрами
password: min:8, max:100
username: length:5-20

# Множественные параметры
date: between:2020-01-01,2025-12-31
```


---

## 3. Syntax Examples

Рассмотрим примеры синтаксиса DSL для различных сценариев.

### Базовые правила

```
# Обязательное поле
name: required

# Email
email: required, email

# Число с диапазоном
age: required, number, min:18, max:120

# Строка с длиной
username: required, min:3, max:20

# Опциональное поле
bio: max:500
```

### Сложные правила

```
# Password с множественными требованиями
password: required, min:8, uppercase, lowercase, number, special

# URL
website: url, protocol:https

# Дата
birthdate: required, date, before:today

# Телефон
phone: required, phone:US

# Кредитная карта
card: required, creditCard
```

### Cross-field Validation

```
# Password confirmation
password: required, min:8
confirmPassword: required, same:password

# Date range
startDate: required, date
endDate: required, date, after:startDate

# Conditional required
needsShipping: boolean
shippingAddress: requiredIf:needsShipping, min:10
```

### Async Validation

```
# Проверка уникальности
email: required, email, unique:users.email
username: required, min:3, unique:users.username

# Проверка существования
userId: required, exists:users.id
productSku: required, exists:products.sku

# Custom async
promoCode: required, async:validatePromoCode
```

### Composition

```
# Переиспользуемые правила
@email: required, email, max:100
@password: required, min:8, uppercase, number, special

# Использование
userEmail: @email
userPassword: @password
adminEmail: @email
```

---

## 4. Parser Implementation

Реализуем парсер для нашего DSL.

### Tokenizer

```typescript
enum TokenType {
  FIELD_NAME = 'FIELD_NAME',
  COLON = 'COLON',
  RULE = 'RULE',
  PARAM = 'PARAM',
  COMMA = 'COMMA',
  NEWLINE = 'NEWLINE'
}

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const lines = input.split('\n');
  
  lines.forEach((line, lineIndex) => {
    // Пропускаем комментарии и пустые строки
    if (line.trim().startsWith('#') || line.trim() === '') {
      return;
    }
    
    // Разбиваем на field name и rules
    const [fieldName, rulesStr] = line.split(':').map(s => s.trim());
    
    if (!fieldName || !rulesStr) {
      throw new Error(`Invalid syntax at line ${lineIndex + 1}`);
    }
    
    tokens.push({
      type: TokenType.FIELD_NAME,
      value: fieldName,
      line: lineIndex + 1,
      column: 0
    });
    
    tokens.push({
      type: TokenType.COLON,
      value: ':',
      line: lineIndex + 1,
      column: fieldName.length
    });
    
    // Разбиваем rules
    const rules = rulesStr.split(',').map(r => r.trim());
    
    rules.forEach((rule, ruleIndex) => {
      const [ruleName, param] = rule.split(':').map(s => s.trim());
      
      tokens.push({
        type: TokenType.RULE,
        value: ruleName,
        line: lineIndex + 1,
        column: 0 // Упрощено
      });
      
      if (param) {
        tokens.push({
          type: TokenType.PARAM,
          value: param,
          line: lineIndex + 1,
          column: 0
        });
      }
      
      if (ruleIndex < rules.length - 1) {
        tokens.push({
          type: TokenType.COMMA,
          value: ',',
          line: lineIndex + 1,
          column: 0
        });
      }
    });
    
    tokens.push({
      type: TokenType.NEWLINE,
      value: '\n',
      line: lineIndex + 1,
      column: line.length
    });
  });
  
  return tokens;
}
```

### Parser

```typescript
interface ValidationRule {
  name: string;
  param?: string;
}

interface FieldValidation {
  fieldName: string;
  rules: ValidationRule[];
}

interface ParsedSchema {
  fields: FieldValidation[];
}

function parse(tokens: Token[]): ParsedSchema {
  const fields: FieldValidation[] = [];
  let currentField: FieldValidation | null = null;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    switch (token.type) {
      case TokenType.FIELD_NAME:
        if (currentField) {
          fields.push(currentField);
        }
        currentField = {
          fieldName: token.value,
          rules: []
        };
        break;
        
      case TokenType.RULE:
        if (!currentField) {
          throw new Error(`Rule without field at line ${token.line}`);
        }
        
        const nextToken = tokens[i + 1];
        const param = nextToken?.type === TokenType.PARAM 
          ? nextToken.value 
          : undefined;
        
        currentField.rules.push({
          name: token.value,
          param
        });
        
        if (param) {
          i++; // Пропускаем PARAM token
        }
        break;
        
      case TokenType.NEWLINE:
        if (currentField) {
          fields.push(currentField);
          currentField = null;
        }
        break;
    }
  }
  
  if (currentField) {
    fields.push(currentField);
  }
  
  return { fields };
}
```

### Validator Generator

```typescript
type ValidatorFn = (value: any, context?: any) => string | null;

const validators: Record<string, (param?: string) => ValidatorFn> = {
  required: () => (value) => {
    return value ? null : 'This field is required';
  },
  
  email: () => (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Invalid email format';
  },
  
  min: (param) => (value) => {
    if (!value) return null;
    const min = parseInt(param || '0');
    return value.length >= min ? null : `Min ${min} characters`;
  },
  
  max: (param) => (value) => {
    if (!value) return null;
    const max = parseInt(param || '0');
    return value.length <= max ? null : `Max ${max} characters`;
  },
  
  number: () => (value) => {
    if (!value) return null;
    return !isNaN(Number(value)) ? null : 'Must be a number';
  },
  
  unique: (param) => async (value) => {
    if (!value) return null;
    const [table, field] = param!.split('.');
    const exists = await checkUnique(table, field, value);
    return exists ? null : 'Already exists';
  }
};

function generateValidator(schema: ParsedSchema): Record<string, ValidatorFn[]> {
  const result: Record<string, ValidatorFn[]> = {};
  
  schema.fields.forEach((field) => {
    result[field.fieldName] = field.rules.map((rule) => {
      const validatorFactory = validators[rule.name];
      if (!validatorFactory) {
        throw new Error(`Unknown rule: ${rule.name}`);
      }
      return validatorFactory(rule.param);
    });
  });
  
  return result;
}
```

### Usage

```typescript
const dsl = `
email: required, email, max:100
password: required, min:8
age: number, min:18, max:120
`;

// Parse
const tokens = tokenize(dsl);
const schema = parse(tokens);
const validators = generateValidator(schema);

// Validate
async function validateForm(values: Record<string, any>) {
  const errors: Record<string, string> = {};
  
  for (const [field, fieldValidators] of Object.entries(validators)) {
    for (const validator of fieldValidators) {
      const error = await validator(values[field]);
      if (error) {
        errors[field] = error;
        break; // Первая ошибка
      }
    }
  }
  
  return errors;
}
```


---

## 5. Query Integration

Интеграция DSL с TanStack Query для server-side валидации.

```typescript
import { useQuery } from '@tanstack/react-query';

// DSL для async validation
const dsl = `
email: required, email, unique:users.email
username: required, min:3, unique:users.username
`;

// Parse DSL
const schema = parseDSL(dsl);

// Generate query keys
function generateQueryKey(rule: ValidationRule, value: any) {
  if (rule.name === 'unique') {
    const [table, field] = rule.param!.split('.');
    return ['validate', 'unique', table, field, value];
  }
  return null;
}

// Hook для async validation
function useAsyncValidation(fieldName: string, value: any) {
  const field = schema.fields.find(f => f.fieldName === fieldName);
  const asyncRules = field?.rules.filter(r => r.name === 'unique') || [];
  
  const queries = asyncRules.map((rule) => {
    const queryKey = generateQueryKey(rule, value);
    
    return useQuery({
      queryKey,
      queryFn: async () => {
        const [table, field] = rule.param!.split('.');
        const response = await fetch(`/api/validate/unique`, {
          method: 'POST',
          body: JSON.stringify({ table, field, value })
        });
        return response.json();
      },
      enabled: !!value && value.length >= 3,
      staleTime: 5000
    });
  });
  
  return queries;
}

// Usage
function EmailField() {
  const [email, setEmail] = useState('');
  const [uniqueQuery] = useAsyncValidation('email', email);
  
  return (
    <div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      {uniqueQuery.isLoading && <span>Checking...</span>}
      {uniqueQuery.data?.exists && <span>Email already exists</span>}
    </div>
  );
}
```

---

## 6. Real-world Examples

Практические примеры использования DSL в реальных проектах.

### Example 1: User Registration

```
# User Registration Form
email: required, email, max:100, unique:users.email
username: required, min:3, max:20, alphanumeric, unique:users.username
password: required, min:8, uppercase, lowercase, number, special
confirmPassword: required, same:password
age: required, number, min:18, max:120
terms: required, boolean, equals:true
```

### Example 2: E-commerce Checkout

```
# Shipping Information
firstName: required, min:2, max:50
lastName: required, min:2, max:50
email: required, email
phone: required, phone:US

# Address
address: required, min:10, max:200
city: required, min:2, max:100
state: required, length:2
zip: required, regex:^\d{5}(-\d{4})?$

# Payment
cardNumber: required, creditCard
cvv: required, regex:^\d{3,4}$
expiryDate: required, date, after:today
```

### Example 3: Job Application

```
# Personal Info
fullName: required, min:5, max:100
email: required, email, unique:applications.email
phone: required, phone

# Experience
yearsExperience: required, number, min:0, max:50
currentSalary: number, min:0
expectedSalary: number, min:0, greaterThan:currentSalary

# Documents
resume: required, file, mimeType:application/pdf, maxSize:5MB
coverLetter: file, mimeType:application/pdf, maxSize:2MB
```

---

## Заключение всей серии

Мы завершили путешествие по миру форм в React и Nexus State! Давайте подведём итоги всей серии.

### Что мы изучили

**Часть 1: Foundations & Patterns**
- Controlled vs Uncontrolled подходы
- Client, Server, Hybrid validation
- Schema-based validation (Zod, Yup)
- Сравнение библиотек (RHF, Formik, Final Form, @nexus-state/form)

**Часть 2: UX & Accessibility**
- Error Handling best practices
- WAI-ARIA атрибуты
- Keyboard Navigation
- Performance optimization
- Production checklist

**Часть 3: Advanced Patterns I**
- Multi-step Forms (wizards)
- Dynamic Forms (conditional fields)
- Form Arrays (repeatable fields)

**Часть 4: Advanced Patterns II**
- Cross-field Validation
- Async Validation с debouncing
- Hybrid Validation
- Form Persistence (auto-save)
- TanStack Query integration

**Часть 5: Form Builder**
- Schema-driven Architecture
- Drag-and-Drop с @dnd-kit
- Component Registry
- Live Preview
- Export to Code
- Undo/Redo с Time Travel

**Часть 6: DSL для валидации**
- Проблемы существующих решений
- Design Principles для DSL
- Parser Implementation
- Query Integration
- Real-world Examples

### Ключевые выводы

**1. Нет универсального решения:**
- Выбор подхода зависит от требований проекта
- Controlled для сложной логики, Uncontrolled для производительности
- Hybrid validation = best practice

**2. UX и Accessibility критичны:**
- 15% пользователей зависят от assistive technologies
- Keyboard navigation обязательна
- Error handling влияет на конверсию

**3. Advanced patterns решают real-world проблемы:**
- Multi-step для длинных форм
- Dynamic для условной логики
- Form Arrays для повторяющихся данных

**4. Валидация — это искусство:**
- Client для UX, Server для безопасности
- Debouncing для async validation
- Schema-based для maintainability

**5. Инструменты ускоряют разработку:**
- Form Builder для no-code
- DSL для декларативности
- Time Travel для debugging

### Рекомендации для production

**Выбор библиотеки:**
- **React Hook Form** — для большинства проектов (производительность + экосистема)
- **@nexus-state/form** — если нужен Time Travel и advanced features
- **Formik** — для простых форм и команд, знакомых с ним

**Validation стратегия:**
- Client: формат, длина, обязательность (Zod/Yup)
- Server: уникальность, бизнес-правила
- Debouncing: 300-500ms для async

**Accessibility:**
- Используйте checklist из Части 2
- Тестируйте с screen readers
- Keyboard navigation обязательна

**Performance:**
- Uncontrolled для больших форм (>20 полей)
- Мемоизация компонентов
- Lazy validation (только touched поля)

### Что дальше

Формы — это только начало. В экосистеме Nexus State есть ещё много интересного:

**Другие серии статей:**
- **Time Travel** — Undo/Redo patterns
- **Query** — Server state management
- **DevTools** — Debugging и profiling
- **Atoms** — Fine-grained reactivity

**Nexus State Roadmap:**
- Form Builder UI (visual tool)
- DSL Playground (online editor)
- More integrations (Vue, Svelte, Angular)
- Performance optimizations

### Благодарности

Спасибо, что прошли со мной этот путь! Надеюсь, эта серия помогла вам лучше понять формы в React и вдохновила на создание лучших пользовательских интерфейсов.

### Полезные ссылки

**Документация:**
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [@dnd-kit](https://dndkit.com/)
- [WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/)

**Nexus State:**
- [GitHub](https://github.com/eustatos/nexus-state)
- [Documentation](https://nexus-state.dev)
- [Discord Community](https://discord.gg/nexus-state)

**Все части серии:**
- [Часть 1: Foundations & Patterns](../part-01-foundations-patterns/draft.md)
- [Часть 2: UX & Accessibility](../part-02-ux-accessibility/draft.md)
- [Часть 3: Advanced Patterns I](../part-03-advanced-patterns-1/draft.md)
- [Часть 4: Advanced Patterns II](../part-04-advanced-patterns-2/draft.md)
- [Часть 5: Form Builder](../part-05-form-builder/draft.md)
- [Часть 6: DSL для валидации](../part-06-dsl-validation/draft.md) (эта статья)

**Обратная связь:**
Буду рад вашим комментариям и вопросам! Пишите в комментариях или в [GitHub Issues](https://github.com/eustatos/nexus-state/issues).

---

**Предыдущая статья:** [Часть 5: Form Builder](../part-05-form-builder/draft.md)  
**Серия завершена!** 🎉

