# 🛠️ Developer Guide: `nexus-state`

This guide provides instructions and conventions for contributing to `nexus-state`.

## Prerequisites

- Node.js (\>=18.0.0)
- npm (\>=8.0.0)
- Git

## Setup

1. Clone the repository:

```bash
git clone https://github.com/<your-org>/nexus-state.git
cd nexus-state
```

2. Install dependencies:

```bash
npm install
```

3. Start development in watch mode:

```bash
npm run dev
```

## Project Structure

- `apps/` – Example apps (React, Vue, Vanilla)
- `packages/` – All packages (`core`, `react`, `persist`, etc.)
- `docs/` – Documentation source files
- `scripts/` – Build and utility scripts

## Development Conventions

### 1. Language

All code, comments, documentation, and commit messages must be written in **English**.

### 2. Commits

Use conventional commits:

```
feat: add atom.async
fix: resolve issue with store subscription
docs: update getting started guide
style: format code with prettier
refactor: extract atom logic into utils
test: add tests for computed atoms
chore: bump dependencies
```

### 3. Code Style

- Use TypeScript with strict mode enabled.
- Follow ESLint and Prettier configs provided.
- Write JSDoc-style comments for exported functions/types.

### 4. Testing

- Every feature should have corresponding unit tests.
- Run tests with `npm run test`.

### 5. Documentation

- Document every public API using JSDoc.
- Update documentation in `docs/` if adding new features.
- All documentation must be in English.

## Scripts

- `npm run build` – Build all packages
- `npm run dev` – Watch and rebuild packages
- `npm run test` – Run all tests
- `npm run lint` – Lint all files
- `npm run docs:dev` – Serve documentation locally

## Pull Requests

- Create a branch from `main`.
- Link to relevant issues.
- Include tests and documentation if applicable.
- Request review before merging.

## Versioning

We follow Semantic Versioning (SemVer):

- `MAJOR.MINOR.PATCH`
- Breaking changes increment `MAJOR`.
- New features increment `MINOR`.
- Bug fixes increment `PATCH`.

For releases, use `npm version` and push tags.

---

Если хочешь, могу также подготовить шаблоны для PR и Issue.