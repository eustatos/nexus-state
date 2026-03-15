# Text-based DSL Example

This example demonstrates the text-based DSL parser for form validation.

## Features

- Declarative schema definition
- Human-readable syntax
- Comments support
- All built-in validators
- Async validation (unique)
- Cross-field validation (same:password)

## DSL Syntax

```
# Comment
fieldName: rule1, rule2:param, rule3
```

## Running the Example

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

## DSL Schema

The schema is defined as a simple text string:

```typescript
const registrationDSL = `
username: required, min:3, max:20, alphanumeric, unique:users.username
email: required, email, unique:users.email
password: required, min:8, uppercase, lowercase, number, special
confirmPassword: required, same:password
age: required, minvalue:18, maxvalue:120
terms: required, equals:true
`;

const { schema, errors } = parseDSL(registrationDSL);
```

## Available Rules

### String Validators
- `required` - Field is required
- `min:n` - Minimum length
- `max:n` - Maximum length
- `email` - Email format
- `url` - URL format
- `pattern:regex` - Regex pattern
- `alphanumeric` - Alphanumeric only

### Number Validators
- `minvalue:n` - Minimum value
- `maxvalue:n` - Maximum value
- `integer` - Must be integer
- `positive` - Must be positive
- `negative` - Must be negative

### Cross-field Validators
- `same:field` - Must match another field
- `equals:value` - Must equal value

### Async Validators
- `unique:table.field` - Check uniqueness

### Character Validators
- `uppercase` - Must contain uppercase
- `lowercase` - Must contain lowercase
- `number` - Must contain number
- `special` - Must contain special character

## Learn More

- [DSL Parser Documentation](../../src/parser.ts)
- [Nexus State Form Documentation](https://nexus-state.dev/)
