# Schema Plugin Examples

This folder contains working examples for all Nexus State form schema plugins.

## Examples by Plugin

### @nexus-state/form-schema-zod

| Example | Description | Link |
|---------|-------------|------|
| Basic | Basic form with email and password validation | [./zod/basic](./zod/basic/) |
| Async Validation | Uniqueness check with debouncing | [./zod/async-validation](./zod/async-validation/) |
| Cross-field | Password confirmation | [./zod/cross-field](./zod/cross-field/) |

### @nexus-state/form-schema-yup

| Example | Description | Link |
|---------|-------------|------|
| Basic | Basic form with Yup validation | [./yup/basic](./yup/basic/) |
| Async Validation | Async test with uniqueness check | [./yup/async-validation](./yup/async-validation/) |
| Custom Test | Custom validation test | [./yup/custom-test](./yup/custom-test/) |

### @nexus-state/form-schema-ajv

| Example | Description | Link |
|---------|-------------|------|
| Basic | JSON Schema basic validation | [./ajv/basic](./ajv/basic/) |
| Custom Keywords | Custom keyword validation | [./ajv/custom-keywords](./ajv/custom-keywords/) |
| Custom Formats | Custom format validation | [./ajv/custom-formats](./ajv/custom-formats/) |

### @nexus-state/form-schema-dsl

| Example | Description | Link |
|---------|-------------|------|
| Basic | Basic DSL validation | [./dsl/basic](./dsl/basic/) |
| Async Validation | Unique username/email check | [./dsl/async-validation](./dsl/async-validation/) |
| Custom Validators | Custom validator functions | [./dsl/custom-validators](./dsl/custom-validators/) |
| Text-based DSL | Text-based DSL parser example | [./dsl/text-based](./dsl/text-based/) |

## Running Examples

Each example is a standalone project. To run an example:

```bash
cd packages/form-schema-zod/examples/basic
pnpm install
pnpm dev
```

## Contributing

Contributions welcome! Please follow these guidelines:

1. Keep examples focused and minimal
2. Include a README.md with instructions
3. Use TypeScript
4. Include comments for complex logic
5. Test your example before submitting

## CodeSandbox

All examples are available on CodeSandbox for online editing:

- [Zod Basic](https://codesandbox.io/s/nexus-state-zod-basic)
- [Yup Basic](https://codesandbox.io/s/nexus-state-yup-basic)
- [DSL Basic](https://codesandbox.io/s/nexus-state-dsl-basic)

## License

MIT © Nexus State Contributors
