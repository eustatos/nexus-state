# Часть 6: DSL для валидации

**Целевая длина:** 2500-3000 слов (~10-12 минут чтения)  
**Статус:** 📝 Draft  
**Дата создания:** Март 2026

---

## 🎯 Цели статьи

1. Объяснить зачем нужен DSL для валидации
2. Показать принципы дизайна DSL
3. Реализовать Parser (Lexer, Parser, AST)
4. Создать user-friendly error messages
5. Показать композицию и переиспользование схем
6. Интегрировать с Query для API validation
7. Дать real-world примеры
8. Подвести итоги всей серии

---

## 📋 Детальная структура

### Введение (200-250 слов)

**Recap всей серии:**
- Части 1-2: Foundations, UX, Accessibility, Performance
- Части 3-4: Advanced Patterns, Validation, Persistence, Query
- Часть 5: Form Builder

**Финальная тема: DSL для валидации**
- Зачем создавать свой DSL
- Преимущества перед существующими решениями
- Интеграция с Nexus State ecosystem

**Что будет в статье:**
- DSL Design Principles
- Syntax Examples
- Parser Implementation
- Error Messages
- Composition & Reuse
- Query Integration
- Real-world Examples
- Итоги серии

---

### 1. Зачем нужен DSL (400-450 слов)

#### 1.1. Проблемы существующих решений

**Zod:**
```typescript
// Многословно для сложных правил
z.string()
  .min(8, 'Min 8 characters')
  .regex(/[A-Z]/, 'Need uppercase')
  .regex(/[0-9]/, 'Need number')
  .regex(/[!@#$%^&*]/, 'Need special char')
```

**Yup:**
```typescript
// Похожие проблемы
yup.string()
  .min(8)
  .matches(/[A-Z]/)
  .matches(/[0-9]/)
  .matches(/[!@#$%^&*]/)
```

**Проблемы:**
- ❌ Многословность
- ❌ Сложно читать
- ❌ Трудно поддерживать
- ❌ Нет естественного языка

#### 1.2. Преимущества DSL

**Концепция:**
Декларативный язык, близкий к естественному

**Пример DSL:**
```
password: string
  length 8..128
  contains uppercase, lowercase, digit, special
  not common
```

**Преимущества:**
- ✅ Читаемость (близко к естественному языку)
- ✅ Краткость
- ✅ Легко поддерживать
- ✅ Можно использовать non-developers
- ✅ Единый синтаксис для client + server

#### 1.3. Use Cases

**1. API Schema Validation:**
```
POST /api/users
  body:
    email: string email unique
    password: string length 8..128 contains uppercase, digit
    age: number 18..120
```

**2. Form Validation:**
```
form ContactForm:
  name: string length 2..50 required
  email: string email required
  message: string length 10..1000
```

**3. Configuration Validation:**
```
config AppConfig:
  port: number 1024..65535 default 3000
  host: string default "localhost"
  debug: boolean default false
```

---

### 2. DSL Design Principles (400-450 слов)

#### 2.1. Readability First

**Принцип:**
Код должен читаться как естественный язык

**Примеры:**
```
// ✅ Хорошо: читается естественно
email: string email required

// ❌ Плохо: слишком технично
email: String().email().required()
```

#### 2.2. Conciseness

**Принцип:**
Минимум синтаксического шума

**Примеры:**
```
// ✅ Хорошо: кратко
age: number 18..120

// ❌ Плохо: многословно
age: number min(18) max(120)
```

#### 2.3. Consistency

**Принцип:**
Единообразный синтаксис для всех типов

**Примеры:**
```
// Все типы следуют одному паттерну
name: string length 2..50
age: number 18..120
email: string email
active: boolean
```

#### 2.4. Extensibility

**Принцип:**
Легко добавлять новые валидаторы

**Пример:**
```
// Кастомный валидатор
username: string length 3..20 alphanumeric unique

// Определение кастомного валидатора
validator alphanumeric:
  pattern /^[a-zA-Z0-9]+$/
  message "Only letters and numbers allowed"
```

#### 2.5. Syntax Design

**Базовая структура:**
```
<field_name>: <type> <validators> <modifiers>
```

**Типы:**
- `string` — строка
- `number` — число
- `boolean` — булево
- `date` — дата
- `array` — массив
- `object` — объект

**Валидаторы:**
- `length <min>..<max>` — длина строки
- `<min>..<max>` — диапазон чисел
- `email` — email формат
- `url` — URL формат
- `pattern <regex>` — регулярное выражение
- `contains <items>` — содержит элементы
- `unique` — уникальность

**Модификаторы:**
- `required` — обязательное поле
- `optional` — опциональное поле
- `default <value>` — значение по умолчанию

---

### 3. Syntax Examples (500-550 слов)

#### 3.1. Basic Types

```
// String
name: string required
bio: string optional
username: string length 3..20 required

// Number
age: number 18..120 required
price: number 0..1000000 default 0
rating: number 1..5

// Boolean
active: boolean default true
verified: boolean required

// Date
birthDate: date required
createdAt: date default now
```

#### 3.2. String Validators

```
// Email
email: string email required

// URL
website: string url optional

// Pattern
phone: string pattern /^\+?[1-9]\d{1,14}$/ required

// Length
password: string length 8..128 required

// Contains
password: string contains uppercase, lowercase, digit, special

// Enum
status: string enum "pending", "active", "inactive" default "pending"
```

#### 3.3. Number Validators

```
// Range
age: number 18..120 required
price: number 0..1000000

// Integer
quantity: number integer 1..100

// Positive/Negative
balance: number positive
temperature: number -273.15..
```

#### 3.4. Array Validators

```
// Array of strings
tags: array<string> length 1..10

// Array of numbers
scores: array<number> length 5 each 0..100

// Array of objects
users: array<User> length 1..100
```

#### 3.5. Object Validators

```
// Nested object
address: object {
  street: string required
  city: string required
  zip: string pattern /^\d{5}$/ required
  country: string default "USA"
}

// Reference to another schema
user: User required
```

#### 3.6. Complex Example

```
schema UserRegistration:
  // Personal info
  firstName: string length 2..50 required
  lastName: string length 2..50 required
  email: string email unique required
  
  // Credentials
  password: string length 8..128 required
    contains uppercase, lowercase, digit, special
    not common
  confirmPassword: string equals password required
  
  // Profile
  age: number 18..120 required
  bio: string length 0..500 optional
  avatar: string url optional
  
  // Preferences
  newsletter: boolean default false
  notifications: object {
    email: boolean default true
    push: boolean default false
  }
  
  // Terms
  acceptTerms: boolean equals true required
```

---

### 4. Parser Implementation (600-650 слов)

#### 4.1. Architecture

```
Source Code → Lexer → Tokens → Parser → AST → Validator
```

#### 4.2. Lexer (Tokenization)

**Цель:**
Преобразовать текст в токены

**Типы токенов:**
```typescript
enum TokenType {
  IDENTIFIER = 'IDENTIFIER',
  COLON = 'COLON',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  KEYWORD = 'KEYWORD',
  OPERATOR = 'OPERATOR',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  COMMA = 'COMMA',
  NEWLINE = 'NEWLINE',
  EOF = 'EOF'
}

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}
```

**Lexer Implementation:**
```typescript
class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(input: string) {
    this.input = input;
  }

  nextToken(): Token {
    this.skipWhitespace();

    if (this.isAtEnd()) {
      return this.makeToken(TokenType.EOF, '');
    }

    const char = this.peek();

    // Identifiers and keywords
    if (this.isAlpha(char)) {
      return this.identifier();
    }

    // Numbers
    if (this.isDigit(char)) {
      return this.number();
    }

    // Strings
    if (char === '"' || char === "'") {
      return this.string();
    }

    // Single-character tokens
    switch (char) {
      case ':': return this.makeToken(TokenType.COLON, this.advance());
      case ',': return this.makeToken(TokenType.COMMA, this.advance());
      case '(': return this.makeToken(TokenType.LPAREN, this.advance());
      case ')': return this.makeToken(TokenType.RPAREN, this.advance());
      case '{': return this.makeToken(TokenType.LBRACE, this.advance());
      case '}': return this.makeToken(TokenType.RBRACE, this.advance());
      case '\n': 
        this.line++;
        this.column = 1;
        return this.makeToken(TokenType.NEWLINE, this.advance());
    }

    throw new Error(`Unexpected character: ${char}`);
  }

  private identifier(): Token {
    const start = this.position;
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }
    const value = this.input.substring(start, this.position);
    const type = this.isKeyword(value) ? TokenType.KEYWORD : TokenType.IDENTIFIER;
    return this.makeToken(type, value);
  }

  // ... other methods
}
```

#### 4.3. Parser (AST Generation)

**AST Nodes:**
```typescript
interface ASTNode {
  type: string;
}

interface SchemaNode extends ASTNode {
  type: 'Schema';
  name: string;
  fields: FieldNode[];
}

interface FieldNode extends ASTNode {
  type: 'Field';
  name: string;
  fieldType: TypeNode;
  validators: ValidatorNode[];
  modifiers: ModifierNode[];
}

interface TypeNode extends ASTNode {
  type: 'Type';
  name: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  generic?: TypeNode; // For array<T>
}

interface ValidatorNode extends ASTNode {
  type: 'Validator';
  name: string;
  args: any[];
}
```

**Parser Implementation:**
```typescript
class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): SchemaNode {
    return this.schema();
  }

  private schema(): SchemaNode {
    this.consume(TokenType.KEYWORD, 'schema');
    const name = this.consume(TokenType.IDENTIFIER).value;
    this.consume(TokenType.COLON);
    
    const fields: FieldNode[] = [];
    while (!this.isAtEnd() && !this.check(TokenType.EOF)) {
      fields.push(this.field());
    }

    return {
      type: 'Schema',
      name,
      fields
    };
  }

  private field(): FieldNode {
    const name = this.consume(TokenType.IDENTIFIER).value;
    this.consume(TokenType.COLON);
    
    const fieldType = this.typeNode();
    const validators: ValidatorNode[] = [];
    const modifiers: ModifierNode[] = [];

    // Parse validators and modifiers
    while (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
      if (this.match(TokenType.KEYWORD)) {
        const keyword = this.previous().value;
        if (keyword === 'required' || keyword === 'optional') {
          modifiers.push({ type: 'Modifier', name: keyword });
        } else {
          validators.push(this.validator(keyword));
        }
      }
    }

    return {
      type: 'Field',
      name,
      fieldType,
      validators,
      modifiers
    };
  }

  // ... other methods
}
```

#### 4.4. Code Generation

**Генерация Zod схемы:**
```typescript
function generateZodSchema(ast: SchemaNode): string {
  const fields = ast.fields.map(field => {
    let validation = `z.${field.fieldType.name}()`;
    
    // Add validators
    field.validators.forEach(validator => {
      switch (validator.name) {
        case 'length':
          validation += `.min(${validator.args[0]}).max(${validator.args[1]})`;
          break;
        case 'email':
          validation += `.email()`;
          break;
        case 'pattern':
          validation += `.regex(${validator.args[0]})`;
          break;
      }
    });
    
    // Add modifiers
    const isOptional = field.modifiers.some(m => m.name === 'optional');
    if (isOptional) {
      validation += `.optional()`;
    }
    
    return `  ${field.name}: ${validation}`;
  }).join(',\n');

  return `
const ${ast.name} = z.object({
${fields}
});
`;
}
```

---

### 5. Error Messages (350-400 слов)

#### 5.1. User-friendly Messages

**Плохо:**
```
Error at line 5: Unexpected token 'number'
```

**Хорошо:**
```
Validation Error in UserSchema at line 5:
  age: number 18.120
              ^
Expected '..' for range, got '.'

Did you mean: age: number 18..120
```

#### 5.2. Implementation

```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number,
    public suggestion?: string
  ) {
    super(message);
  }

  format(source: string): string {
    const lines = source.split('\n');
    const errorLine = lines[this.line - 1];
    const pointer = ' '.repeat(this.column - 1) + '^';
    
    let formatted = `Validation Error at line ${this.line}:\n`;
    formatted += `  ${errorLine}\n`;
    formatted += `  ${pointer}\n`;
    formatted += `${this.message}\n`;
    
    if (this.suggestion) {
      formatted += `\nDid you mean: ${this.suggestion}`;
    }
    
    return formatted;
  }
}
```

#### 5.3. Localization

```typescript
const messages = {
  en: {
    required: 'This field is required',
    email: 'Invalid email format',
    length: 'Must be between {min} and {max} characters'
  },
  ru: {
    required: 'Это поле обязательно',
    email: 'Неверный формат email',
    length: 'Должно быть от {min} до {max} символов'
  }
};

function getErrorMessage(
  key: string,
  locale: string,
  params?: Record<string, any>
): string {
  let message = messages[locale][key] || messages.en[key];
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value);
    });
  }
  
  return message;
}
```

---

### 6. Composition & Reuse (400-450 слов)

#### 6.1. Schema Composition

```
// Base schemas
schema Address:
  street: string required
  city: string required
  zip: string pattern /^\d{5}$/ required

schema ContactInfo:
  email: string email required
  phone: string pattern /^\+?[1-9]\d{1,14}$/ optional

// Composition
schema User:
  name: string required
  address: Address required
  contact: ContactInfo required
```

#### 6.2. Inheritance

```
// Base schema
schema BaseEntity:
  id: string uuid required
  createdAt: date default now
  updatedAt: date default now

// Inheritance
schema User extends BaseEntity:
  email: string email unique required
  name: string required

schema Post extends BaseEntity:
  title: string length 1..200 required
  content: string required
  authorId: string uuid required
```

#### 6.3. Mixins

```
// Mixin
mixin Timestamped:
  createdAt: date default now
  updatedAt: date default now

mixin SoftDeletable:
  deletedAt: date optional

// Usage
schema User with Timestamped, SoftDeletable:
  email: string email required
  name: string required
```

---

### 7. Query Integration (450-500 слов)

#### 7.1. API Schema Validation

```
// API endpoint definition
endpoint POST /api/users:
  request:
    body: UserRegistration
  response:
    success: User
    error: ValidationError

// Automatic validation
const userQuery = createMutation({
  mutationFn: async (data: unknown) => {
    // Автоматическая валидация через DSL
    const validated = await validateDSL(data, UserRegistration);
    return fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(validated)
    });
  }
});
```

#### 7.2. End-to-end Type Safety

```
// Схема определена один раз
schema User:
  email: string email required
  name: string required
  age: number 18..120

// Автоматическая генерация TypeScript types
type User = {
  email: string;
  name: string;
  age: number;
};

// Автоматическая генерация Zod schema
const UserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  age: z.number().min(18).max(120)
});

// Использование в Query
const userQuery = createQuery({
  queryKey: ['user'],
  queryFn: fetchUser,
  schema: UserSchema // Автоматическая валидация response
});
```

#### 7.3. Integration Example

```typescript
// DSL schema
const userSchemaSource = `
schema User:
  email: string email unique required
  password: string length 8..128 required
  age: number 18..120 required
`;

// Parse DSL
const ast = parseDSL(userSchemaSource);

// Generate Zod schema
const zodSchema = generateZodSchema(ast);

// Use in form
const formAtom = createFormAtom(zodSchema, initialValues);

// Use in Query
const createUserMutation = createMutation({
  mutationFn: async (data) => {
    const validated = zodSchema.parse(data);
    return api.createUser(validated);
  }
});
```

---

### 8. Real-world Examples (400-450 слов)

#### 8.1. E-commerce Checkout

```
schema CheckoutForm:
  // Customer info
  email: string email required
  phone: string pattern /^\+?[1-9]\d{1,14}$/ required
  
  // Shipping address
  shippingAddress: object {
    firstName: string length 2..50 required
    lastName: string length 2..50 required
    street: string required
    city: string required
    state: string length 2 required
    zip: string pattern /^\d{5}$/ required
    country: string default "USA"
  }
  
  // Billing (optional, same as shipping by default)
  useSameAddress: boolean default true
  billingAddress: object optional {
    // Same structure as shippingAddress
  }
  
  // Payment
  cardNumber: string pattern /^\d{16}$/ required
  cardExpiry: string pattern /^(0[1-9]|1[0-2])\/\d{2}$/ required
  cardCVV: string pattern /^\d{3,4}$/ required
  
  // Terms
  acceptTerms: boolean equals true required
```

#### 8.2. User Profile

```
schema UserProfile:
  // Basic info
  username: string length 3..20 alphanumeric unique required
  email: string email unique required
  displayName: string length 2..50 required
  
  // Avatar
  avatar: string url optional
  
  // Bio
  bio: string length 0..500 optional
  website: string url optional
  location: string length 0..100 optional
  
  // Social links
  social: object optional {
    twitter: string pattern /^@?[a-zA-Z0-9_]{1,15}$/ optional
    github: string pattern /^[a-zA-Z0-9-]{1,39}$/ optional
    linkedin: string url optional
  }
  
  // Preferences
  theme: string enum "light", "dark", "auto" default "auto"
  language: string enum "en", "ru", "es" default "en"
  notifications: object {
    email: boolean default true
    push: boolean default false
    sms: boolean default false
  }
```

#### 8.3. Survey Form

```
schema SurveyResponse:
  // Demographics
  age: number 18..120 required
  gender: string enum "male", "female", "other", "prefer-not-to-say" required
  country: string required
  
  // Questions
  satisfaction: number 1..5 required
  recommendation: number 0..10 required
  
  // Open-ended
  feedback: string length 10..1000 required
  suggestions: string length 0..500 optional
  
  // Contact (optional)
  followUp: boolean default false
  contactEmail: string email optional when followUp equals true
```

---

### 9. Заключение: Итоги серии (400-450 слов)

#### 9.1. Что мы изучили

**Часть 1: Foundations & Patterns**
- Controlled vs Uncontrolled подходы
- Validation patterns (Client, Server, Hybrid)
- Schema-based validation
- Сравнение библиотек (RHF, Formik, Final Form, @nexus-state/form)
- Decision Guide

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
- Integration с Query

**Часть 5: Form Builder**
- Schema-driven Architecture
- Drag-and-Drop интерфейс
- Component Registry
- Live Preview
- Export to Code
- Undo/Redo с Time Travel

**Часть 6: DSL для валидации**
- DSL Design Principles
- Parser Implementation
- User-friendly Error Messages
- Composition & Reuse
- Query Integration

#### 9.2. Ключевые выводы

1. **Формы сложны**, но с правильными паттернами управляемы
2. **Controlled подход** идеален для Time Travel и сложной логики
3. **Hybrid validation** (client + server) = best practice
4. **Accessibility** не опция, а требование
5. **Performance** критична для больших форм
6. **@nexus-state/form** предлагает уникальные возможности (Time Travel, multi-step)
7. **DSL** упрощает валидацию и делает её читаемой

#### 9.3. Дальнейшие шаги

**Для изучения:**
- Попробуйте @nexus-state/form в своих проектах
- Экспериментируйте с Form Builder
- Создайте свой DSL для специфичных нужд

**Для практики:**
- Реализуйте multi-step форму
- Добавьте Time Travel debugging
- Интегрируйте формы с Query

**Для углубления:**
- Изучите другие серии: Time Travel, Query
- Исследуйте продвинутые паттерны
- Внесите вклад в Nexus State

#### 9.4. Благодарности

Спасибо за чтение всей серии! Надеюсь, эти статьи помогли вам лучше понять управление формами в React и Nexus State.

#### 9.5. Обратная связь

Буду рад вашим комментариям, вопросам и предложениям:
- GitHub: [nexus-state/issues](https://github.com/eustatos/nexus-state/issues)
- Twitter: [@nexus_state](https://twitter.com/nexus_state)
- Email: feedback@nexus-state.dev

#### Ссылки на всю серию

- [Часть 1: Foundations & Patterns](./part-01.md)
- [Часть 2: UX & Accessibility](./part-02.md)
- [Часть 3: Advanced Patterns I](./part-03.md)
- [Часть 4: Advanced Patterns II](./part-04.md)
- [Часть 5: Form Builder](./part-05.md)
- [Часть 6: DSL для валидации](./part-06.md) ← Вы здесь

#### Другие серии

- [Time Travel Series](../../article-time-travel/)
- [Query Series](../../article-query/)

---

## 📊 Метрики

**Целевые показатели для dev.to:**
- Время чтения: 10-12 минут
- Engagement rate: >80% (финальная статья)
- Reactions: >70
- Comments: >15

**SEO ключевые слова:**
- DSL validation
- Parser implementation
- Form validation DSL
- Schema validation
- Type-safe forms
- API validation

---

## ✅ Чек-лист перед публикацией

- [ ] Все примеры кода проверены
- [ ] Parser implementation работает
- [ ] DSL syntax валиден
- [ ] Ссылки на все части серии добавлены
- [ ] Итоги серии полные
- [ ] SEO оптимизация
- [ ] Вычитка
- [ ] Проверка длины (2500-3000 слов)
- [ ] Cover image (финальный)
- [ ] Благодарности и обратная связь
