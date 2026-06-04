# Task 05: Documentation Updates

**Phase:** 03 - Middleware Refactoring  
**Priority:** Medium  
**Estimated Time:** 1 hour  
**Status:** 📋 Pending

---

## Objective

Update all documentation to reflect new plugin-based API and provide clear migration guidance.

---

## Tasks

### 5.1 Update README.md

- [ ] Update introduction with new approach
- [ ] Add new API examples
- [ ] Document legacy API with deprecation notice
- [ ] Add migration guide section
- [ ] Update installation instructions

### 5.2 Add JSDoc Comments

- [ ] Document `createMiddlewarePlugin` function
- [ ] Document `MiddlewareConfig` interface
- [ ] Document all parameters and return types
- [ ] Add usage examples in JSDoc

### 5.3 Create Migration Guide

- [ ] Document breaking changes
- [ ] Provide before/after examples
- [ ] List deprecated APIs
- [ ] Add troubleshooting section

### 5.4 Update Package.json

- [ ] Update version to 1.0.0
- [ ] Add deprecation notice if needed
- [ ] Update keywords

---

## Deliverables

1. **Updated README** (`packages/middleware/README.md`):
   - New API documentation
   - Examples
   - Migration guide

2. **JSDoc Comments** (`packages/middleware/index.ts`):
   - Complete documentation
   - Examples

3. **Migration Guide** (`MIGRATION.md`):
   - Step-by-step migration
   - Code examples

---

## Files to Modify

```
packages/middleware/
├── README.md             # Main documentation
├── MIGRATION.md          # Migration guide (new)
└── index.ts              # JSDoc comments
```

---

## Acceptance Criteria

- [ ] README is comprehensive
- [ ] All public APIs documented
- [ ] Migration guide is clear
- [ ] Examples are working
- [ ] No outdated information

---

## README Structure

```markdown
# @nexus-state/middleware

## Installation

## Quick Start

### New API (Recommended)

### Legacy API (Deprecated)

## API Reference

### createMiddlewarePlugin()

### MiddlewareConfig

### Examples

#### Basic Usage

#### Multiple Middleware

#### Value Transformation

## Migration Guide

## Troubleshooting

## License
```

---

## Migration Guide Content

### Before (v0.x)

```typescript
import { middleware } from '@nexus-state/middleware';

const store = createStore([
  middleware(countAtom, {
    beforeSet: (atom, value) => value
  })
]);
```

### After (v1.x)

```typescript
import { createMiddlewarePlugin } from '@nexus-state/middleware';

const store = createStore();
store.applyPlugin(
  createMiddlewarePlugin(countAtom, {
    beforeSet: (atom, value) => value
  })
);
```

---

**Created:** 2026-03-01  
**Owner:** TBD
