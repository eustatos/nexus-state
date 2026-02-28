# QUERY-006: Implement Optimistic Updates

## 📋 Task Overview

**Priority:** 🟡 Medium  
**Estimated Time:** 8 hours  
**Status:** ⬜ Not Started  
**Assignee:** AI Agent  

---

## 🎯 Objective

Implement optimistic updates pattern with rollback on error for instant UI feedback.

---

## 📦 Affected Components

**Package:** `@nexus-state/query`  
**Files:**
- `packages/query/src/optimisticUpdates.ts` (NEW)
- `packages/query/src/mutationAtom.ts` (NEW)
- `packages/query/src/__tests__/optimisticUpdates.test.ts` (NEW)

---

## 🔍 Current State Analysis

**Findings:**
- Current behavior: UI waits for server response
- Issues: Slow perceived performance
- Root cause: No optimistic updates implemented

---

## ✅ Acceptance Criteria

- [ ] `mutationAtom()` factory function
- [ ] onMutate callback for optimistic update
- [ ] onError callback for rollback
- [ ] onSuccess callback for finalization
- [ ] onSettled callback (always runs)
- [ ] Context passing between callbacks
- [ ] Tests written (≥10 test cases)

---

## 📝 Implementation Steps

### Step 1: Implement Optimistic Mutation

**How:**
```typescript
// src/optimisticUpdates.ts

export type MutationOptions<Data, Variables, Context> = {
  mutationFn: (variables: Variables) => Promise<Data>;
  onMutate?: (variables: Variables) => Promise<Context> | Context;
  onError?: (error: Error, variables: Variables, context: Context) => void | Promise<void>;
  onSuccess?: (data: Data, variables: Variables, context: Context) => void | Promise<void>;
  onSettled?: (data?: Data, error?: Error, variables: Variables, context?: Context) => void | Promise<void>;
};

export async function optimisticMutation<Data, Variables, Context = unknown>(
  options: MutationOptions<Data, Variables, Context>,
  variables: Variables
): Promise<Data> {
  let context: Context | undefined;

  try {
    // 1. Run onMutate (optimistic update)
    if (options.onMutate) {
      context = await options.onMutate(variables);
    }

    // 2. Execute mutation
    const data = await options.mutationFn(variables);

    // 3. On success
    if (options.onSuccess) {
      await options.onSuccess(data, variables, context!);
    }

    // 4. On settled
    if (options.onSettled) {
      await options.onSettled(data, undefined, variables, context);
    }

    return data;
  } catch (error) {
    // 5. On error (rollback)
    if (options.onError && context) {
      await options.onError(error as Error, variables, context);
    }

    // 6. On settled
    if (options.onSettled) {
      await options.onSettled(undefined, error as Error, variables, context);
    }

    throw error;
  }
}
```

---

## 🔗 Related Tasks

- **Depends On:** QUERY-002 (Query Atom), QUERY-003 (Cache)
- **Blocks:** QUERY-009 (Tests)
- **Related:** QUERY-005 (Background Refetch)

---

**Created:** 2026-02-28  
**Estimated Completion:** 2026-03-07  
**Actual Completion:** TBD
