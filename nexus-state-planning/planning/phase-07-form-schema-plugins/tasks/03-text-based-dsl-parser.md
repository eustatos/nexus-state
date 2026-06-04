# Task 03: Text-based DSL Parser

**Приоритет:** High  
**Оценка:** 5-7 дней  
**Статус:** Todo

---

## Цель

Реализовать text-based DSL parser для декларативного описания валидации форм (как в Части 6 статьи).

---

## Текущее состояние

Сейчас DSL работает только programmatically:
```typescript
const schema: DSLSchema = {
  username: [required, minLength(3), unique('users', 'username')],
  email: [required, email],
};
```

---

## Целевой синтаксис

```
# User Registration Form
username: required, min:3, max:20, unique:users.username
email: required, email, unique:users.email
password: required, min:8, uppercase, lowercase, number, special
confirmPassword: required, same:password

# Optional fields
bio: max:500
website: url, protocol:https
```

---

## Scope

### 1. Tokenizer

```typescript
enum TokenType {
  FIELD_NAME = 'FIELD_NAME',
  COLON = 'COLON',
  RULE = 'RULE',
  PARAM = 'PARAM',
  COMMA = 'COMMA',
  NEWLINE = 'NEWLINE',
  COMMENT = 'COMMENT',
}

interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

function tokenize(input: string): Token[];
```

### 2. Parser

```typescript
interface ParsedSchema {
  fields: FieldValidation[];
}

interface FieldValidation {
  fieldName: string;
  rules: ValidationRule[];
}

interface ValidationRule {
  name: string;
  params?: string[];
}

function parse(tokens: Token[]): ParsedSchema;
```

### 3. Validator Generator

```typescript
function generateValidator(schema: ParsedSchema): DSLSchema;
```

### 4. API

```typescript
// packages/form-schema-dsl/src/parser.ts
export function parseDSL(dsl: string): DSLSchema;

// Usage
const dsl = `
username: required, min:3
email: required, email
`;

const schema = parseDSL(dsl);
const form = createForm(store, {
  schemaType: 'dsl',
  schemaConfig: schema,
});
```

---

## Syntax Features

### Базовые правила
```
fieldName: rule1, rule2, rule3
```

### Правила с параметрами
```
password: min:8, max:100
age: between:18,120
```

### Комментарии
```
# This is a comment
username: required  # inline comment
```

### Composition (опционально)
```
@email: required, email, max:100
@password: required, min:8, uppercase, number

userEmail: @email
userPassword: @password
```

---

## Implementation Plan

1. **Tokenizer** (1-2 дня)
   - Разбор строк на токены
   - Обработка комментариев
   - Error handling с line/column

2. **Parser** (2-3 дня)
   - AST generation
   - Syntax validation
   - Error messages

3. **Validator Generator** (1-2 дня)
   - Mapping rules → validators
   - Parameter parsing
   - Integration с существующими validators

4. **Tests** (1 день)
   - Unit tests для tokenizer
   - Unit tests для parser
   - Integration tests
   - Error cases

5. **Documentation** (1 день)
   - Syntax reference
   - Examples
   - Migration guide

---

## Acceptance Criteria

- [ ] Tokenizer работает корректно
- [ ] Parser генерирует валидный AST
- [ ] Validator generator создаёт DSLSchema
- [ ] Все существующие validators поддерживаются
- [ ] Error messages понятные и полезные
- [ ] 100% test coverage
- [ ] Documentation complete
- [ ] Examples в README

---

## Dependencies

- Task 01 (Documentation)

---

## Notes

- Начать с простого синтаксиса, добавлять фичи постепенно
- Composition (@email) можно добавить в v2
- Важно: хорошие error messages с line/column
- Рассмотреть использование существующих parser libraries (chevrotain, nearley)
