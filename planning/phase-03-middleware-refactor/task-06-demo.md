# Task 06: Demo Application

**Phase:** 03 - Middleware Refactoring  
**Priority:** Low  
**Estimated Time:** 1 hour  
**Status:** 📋 Pending

---

## Objective

Create or update demo application to showcase middleware functionality and new plugin-based API.

---

## Tasks

### 6.1 Review Existing Demo

- [ ] Check `apps/demo-middleware/` existence
- [ ] Review current implementation
- [ ] Identify what needs updating

### 6.2 Update/Create Demo

- [ ] Implement new API examples
- [ ] Show multiple middleware composition
- [ ] Add logging/visualization
- [ ] Add interactive controls

### 6.3 Add Documentation

- [ ] Add README for demo
- [ ] Document what each example shows
- [ ] Add instructions to run

### 6.4 Integration

- [ ] Add to main demo navigation
- [ ] Update demo list in documentation
- [ ] Test in development mode

---

## Deliverables

1. **Demo Application** (`apps/demo-middleware/`):
   - Working demo with new API
   - Multiple examples

2. **Demo README** (`apps/demo-middleware/README.md`):
   - Setup instructions
   - Feature documentation

---

## Files to Create/Modify

```
apps/demo-middleware/
├── src/
│   ├── App.tsx           # Main demo component
│   ├── examples/
│   │   ├── Basic.tsx     # Basic middleware example
│   │   ├── Chain.tsx     # Middleware chain example
│   │   └── Logger.tsx    # Logger middleware example
│   └── main.tsx
├── package.json
└── README.md
```

---

## Acceptance Criteria

- [ ] Demo runs without errors
- [ ] Shows new API usage
- [ ] Multiple examples provided
- [ ] Documentation complete
- [ ] Added to demo navigation

---

## Demo Examples

### Example 1: Basic Middleware

```typescript
// Logging middleware
const loggingPlugin = createMiddlewarePlugin(countAtom, {
  beforeSet: (atom, value) => {
    console.log(`Setting ${atom.id} to ${value}`);
    return value;
  },
  afterSet: (atom, value) => {
    console.log(`Set complete: ${value}`);
  }
});

store.applyPlugin(loggingPlugin);
```

### Example 2: Validation Middleware

```typescript
// Validation middleware
const validationPlugin = createMiddlewarePlugin(ageAtom, {
  beforeSet: (atom, value) => {
    if (value < 0 || value > 150) {
      throw new Error('Age must be between 0 and 150');
    }
    return value;
  }
});

store.applyPlugin(validationPlugin);
```

### Example 3: Middleware Chain

```typescript
// Multiple middleware on same atom
store.applyPlugin(
  createMiddlewarePlugin(countAtom, {
    beforeSet: (atom, value) => {
      console.log('Middleware 1:', value);
      return value;
    }
  })
);

store.applyPlugin(
  createMiddlewarePlugin(countAtom, {
    beforeSet: (atom, value) => {
      console.log('Middleware 2:', value);
      return value * 2;
    }
  })
);
```

---

## Demo Features

- [ ] Interactive counter
- [ ] Real-time logging panel
- [ ] Middleware configuration UI
- [ ] Error display
- [ ] Reset functionality

---

**Created:** 2026-03-01  
**Owner:** TBD
