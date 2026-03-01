# Contributing to Nexus State

Thank you for your interest in contributing to Nexus State! This document provides guidelines and information for contributors.

## Code of Conduct

Please read and follow our [Code of Conduct](./code-of-conduct.md).

## How Can I Contribute?

### Reporting Bugs

- Use the GitHub issue tracker
- Provide detailed steps to reproduce
- Include environment information (OS, Node.js version, etc.)
- Include error messages and stack traces

### Suggesting Features

- Use the GitHub issue tracker
- Provide clear description of the feature
- Explain the use case and benefits
- Consider providing example API usage

### Contributing Code

1. Fork the repository
2. Create a branch for your feature or fix
3. Make your changes
4. Write tests for your changes
5. Ensure all tests pass
6. Update documentation if needed
7. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 16 or higher
- pnpm (package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/nexus-state/nexus-state.git
cd nexus-state

# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test -- path/to/test.ts
```

### Running Examples

```bash
# List available examples
pnpm dev
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Follow TypeScript best practices
- Use strict mode
- Add type annotations for all public APIs

### Formatting

- Use Prettier for code formatting
- Follow existing code style
- Use 2-space indentation
- Use semicolons

### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for classes and types
- Use uppercase for constants
- Use descriptive names

## Documentation

### API Documentation

All public APIs should be documented with JSDoc comments:

```typescript
/**
 * Creates a new atom with an initial value.
 * @param initialValue - The initial value for the atom
 * @param name - Optional name for the atom for DevTools
 * @returns The created atom
 */
export function atom<T>(initialValue: T, name?: string): Atom<T>;
```

### Code Examples

All code examples in documentation should:

- Be copy-paste runnable
- Use current best practices
- Include necessary imports
- Handle errors appropriately

## Pull Requests

### PR Guidelines

- Include a clear description of changes
- Reference related issues
- Include tests for new functionality
- Update documentation as needed
- Ensure all tests pass
- Follow code style guidelines

### PR Process

1. Create a branch for your changes
2. Submit a pull request
3. Address review comments
4. Wait for approval and merge

## Community

### Getting Help

- Join our [Discord community](https://discord.gg/nexus-state)
- Check our [GitHub Discussions](https://github.com/nexus-state/nexus-state/discussions)
- Read the [documentation](https://nexus-state.dev)

### Giving Feedback

- Open an issue with the `feedback` label
- Join our Discord and share your thoughts
- Use GitHub discussions for longer-form feedback

## Recognition

We value all contributions and recognize contributors in:

- The project README
- Release notes
- Community channels

## Questions?

If you have questions about contributing, please:

- Join our Discord community
- Open an issue with the `question` label
- Contact maintainers directly

Thank you for contributing to Nexus State! 🎉
