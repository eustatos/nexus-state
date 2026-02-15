# DevTools Demo

A comprehensive demonstration application for the Nexus State DevTools package.

## Features

This demo showcases:

- 🔢 Counter with computed values
- ✅ Todo list management
- 📝 User profile with form inputs
- 🚀 Async operations tracking
- 📦 Batch updates
- ⚡ Time travel debugging
- 📝 Action metadata and stack traces

## Usage

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run unit tests
npm test

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

## Project Structure

```
apps/demo-devtools/
├── src/
│   ├── test/
│   │   ├── Counter.test.tsx
│   │   ├── TodoList.test.tsx
│   │   ├── UserProfile.test.tsx
│   │   ├── AsyncDemo.test.tsx
│   │   ├── BatchDemo.test.tsx
│   │   └── Main.test.tsx
│   ├── DevToolsDemo.jsx
│   ├── main.jsx
│   └── index.css
├── tests/
│   └── e2e/
│       └── devtools-demo.spec.ts
├── package.json
├── vite.config.ts
├── playwright.config.ts
└── README.md
```

## Testing

### Unit Tests

Unit tests are written using Vitest and React Testing Library:

```bash
# Run all unit tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### E2E Tests

E2E tests use Playwright:

```bash
# Run E2E tests
npm run test:e2e

# Run in UI mode
npm run test:e2e:ui
```

## Development

The application uses:

- React 18
- Nexus State Core
- Nexus State React
- Nexus State DevTools
- Vitest for unit testing
- Playwright for E2E testing
- Vite for bundling

## DevTools Features Demonstrated

1. **Time Travel**: Navigate through action history and revert to previous states
2. **Batch Updates**: See how multiple updates can be grouped into a single action
3. **Action Metadata**: View stack traces and action details
4. **Async Support**: Track async operations and their states
5. **Atom Names**: See meaningful names for all atoms
6. **Computed Atoms**: Track derived state and dependencies
