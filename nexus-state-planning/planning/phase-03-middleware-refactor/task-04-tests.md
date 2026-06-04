# Task 04: Update Tests

**Phase:** 03 - Middleware Refactoring  
**Priority:** High  
**Estimated Time:** 1-2 hours  
**Status:** 📋 Pending

---

## Objective

Update and expand test suite to cover new plugin-based implementation while ensuring backward compatibility.

---

## Tasks

### 4.1 Rewrite Existing Tests

- [ ] Update tests for new plugin implementation
- [ ] Ensure all original test cases pass
- [ ] Update test descriptions for clarity
- [ ] Remove obsolete test cases

### 4.2 Add Plugin-Specific Tests

- [ ] Test plugin creation
- [ ] Test plugin application to store
- [ ] Test hook execution order
- [ ] Test value transformation chain

### 4.3 Add Composition Tests

- [ ] Test multiple middleware on same atom
- [ ] Test middleware on different atoms
- [ ] Test middleware + other plugins
- [ ] Test middleware chain value flow

### 4.4 Add Backward Compatibility Tests

- [ ] Test legacy API still works
- [ ] Test deprecation warnings
- [ ] Test mixed old/new API usage

### 4.5 Add Performance Tests

- [ ] Benchmark middleware overhead
- [ ] Compare with legacy implementation
- [ ] Test with many middleware
- [ ] Test with high-frequency updates

---

## Deliverables

1. **Updated Test File** (`packages/middleware/src/index.test.ts`):
   - All original tests rewritten
   - New plugin tests
   - Composition tests
   - Compatibility tests

2. **Test Report**:
   - Coverage report
   - Performance benchmarks
   - Known limitations

---

## Test Structure

```typescript
describe('middleware', () => {
  describe('createMiddlewarePlugin', () => {
    // New plugin-based tests
  });
  
  describe('middleware (legacy)', () => {
    // Backward compatibility tests
  });
  
  describe('composition', () => {
    // Multiple middleware tests
  });
  
  describe('performance', () => {
    // Benchmark tests
  });
});
```

---

## Files to Modify

```
packages/middleware/
└── src/
    └── index.test.ts     # Complete rewrite
```

---

## Acceptance Criteria

- [ ] All tests pass
- [ ] Code coverage ≥ 90%
- [ ] No performance regression
- [ ] Edge cases covered
- [ ] Clear test descriptions

---

## Test Cases Checklist

### Basic Functionality

- [ ] `beforeSet` is called before set
- [ ] `afterSet` is called after set
- [ ] `beforeSet` can modify value
- [ ] `afterSet` receives final value
- [ ] Middleware only affects target atom

### Value Transformation

- [ ] Value modification in `beforeSet`
- [ ] Multiple transformations chain correctly
- [ ] Undefined return uses original value
- [ ] Error in `beforeSet` aborts set

### Composition

- [ ] Multiple middleware on one atom
- [ ] Middleware on different atoms
- [ ] Correct execution order
- [ ] No interference between middleware

### Edge Cases

- [ ] Undefined values
- [ ] Null values
- [ ] Object values
- [ ] Function updates
- [ ] Rapid updates

### Backward Compatibility

- [ ] Legacy API works
- [ ] Deprecation warning shown
- [ ] Mixed usage works

---

## Performance Benchmarks

Target metrics:
- Single middleware overhead: < 5%
- Multiple middleware (5): < 20%
- No memory leaks after 1000 operations

---

**Created:** 2026-03-01  
**Owner:** TBD
