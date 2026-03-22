# Mutation Typing in @nexus-state/query

## Quick Start

### Basic Example

```typescript
import { useMutation } from '@nexus-state/query';

// Mutation with single argument
const deleteMutation = useMutation<void, Error, number>({
  mutationFn: (id: number) => api.delete(id),
});

// Usage
deleteMutation.mutate(123);
```

### Type Parameters

```typescript
useMutation<TData, TError, TVariables, TContext>
//              ^^^^^^  ^^^^^^  ^^^^^^^^^  ^^^^^^^
//              Data    Error   Variables  Context
```

| Parameter | Description | Example |
|-----------|-------------|---------|
| `TData` | Type of returned data | `Dictionary`, `void`, `number` |
| `TError` | Type of error | `Error`, `AxiosError` |
| `TVariables` | Type of `mutate()` argument | `number`, `{ id: number }` |
| `TContext` | Type of context for optimistic updates | `{ previousData: Dictionary[] }` |

## Usage Scenarios

### 1. Delete (returns void)

```typescript
const deleteMutation = useMutation<void, Error, number>({
  mutationFn: (id: number) => api.delete(id),
});

deleteMutation.mutate(123);
```

### 2. Create (returns created object)

```typescript
interface CreateDictionaryRequest {
  code: string;
  name: string;
}

interface Dictionary {
  id: number;
  code: string;
  name: string;
}

const createMutation = useMutation<Dictionary, Error, CreateDictionaryRequest>({
  mutationFn: (payload) => api.create(payload),
});

createMutation.mutate({ code: 'TEST', name: 'Test' });
```

### 3. Update (complex arguments)

```typescript
interface UpdateDictionaryVars {
  id: number;
  values: Partial<Dictionary>;
}

const updateMutation = useMutation<Dictionary, Error, UpdateDictionaryVars>({
  mutationFn: ({ id, values }) => api.update(id, values),
});

updateMutation.mutate({
  id: 123,
  values: { name: 'New Name' }
});
```

### 4. Mutation without arguments

```typescript
const refreshMutation = useMutation<void, Error>({
  mutationFn: () => api.refresh(),
});

refreshMutation.mutate(); // void argument
```

### 5. Working with AxiosResponse

```typescript
import { unwrapAxiosResponse } from '@nexus-state/query';

// API returns AxiosResponse<Dictionary>
const mutation = useMutation<Dictionary, Error, number>({
  mutationFn: (id) => unwrapAxiosResponse(api.getById(id)),
});
```

### 6. Optimistic updates

```typescript
const deleteMutation = useMutation<void, Error, number, { previousData: Dictionary[] }>({
  mutationFn: (id) => api.delete(id),
  onMutate: async (id) => {
    // Save current data
    const previousData = queryClient.getQueryData<Dictionary[]>('dictionaries');

    // Optimistically delete
    queryClient.setQueryData<Dictionary[]>('dictionaries', old =>
      old?.filter(d => d.id !== id)
    );

    return { previousData };
  },
  onError: (err, id, context) => {
    // Rollback on error
    queryClient.setQueryData('dictionaries', context?.previousData);
  },
});
```

## Comparison with TanStack Query

| Feature | TanStack Query | @nexus-state/query |
|---------|----------------|-------------------|
| Automatic `TVariables` inference | ✅ Yes | ❌ Requires explicit |
| Explicit typing | ✅ Optional | ✅ Required |
| Syntax | `useMutation({ mutationFn })` | `useMutation<TData, TError, TVariables>({...})` |

### Example: TanStack Query vs @nexus-state/query

```typescript
// TanStack Query - automatic inference
const mutation = useMutation({
  mutationFn: (id: number) => api.archive(id),
});
mutation.mutate(123);  // ✅

// @nexus-state/query - explicit typing
const mutation = useMutation<void, Error, number>({
  mutationFn: (id) => api.archive(id),
});
mutation.mutate(123);  // ✅
```

## Common Mistakes

### 1. Forgot `TVariables` type

```typescript
// ❌ WRONG
const mutation = useMutation<void, Error>({
  mutationFn: (id: number) => api.delete(id),
});
mutation.mutate(123);  // Error: expected void

// ✅ CORRECT
const mutation = useMutation<void, Error, number>({
  mutationFn: (id: number) => api.delete(id),
});
mutation.mutate(123);  // OK
```

### 2. Wrong type order

```typescript
// ❌ WRONG (types mixed up)
const mutation = useMutation<number, void, Error>({
  // ...
});

// ✅ CORRECT (TData, TError, TVariables)
const mutation = useMutation<void, Error, number>({
  // ...
});
```

### 3. Forgot to extract data from AxiosResponse

```typescript
// ❌ WRONG
const mutation = useMutation<AxiosResponse<Dictionary>, Error, number>({
  mutationFn: (id) => api.getById(id),
});

// ✅ CORRECT
const mutation = useMutation<Dictionary, Error, number>({
  mutationFn: (id) => unwrapAxiosResponse(api.getById(id)),
});
```

## Migration from TanStack Query

### Step 1: Add explicit types

```diff
- const mutation = useMutation({
+ const mutation = useMutation<void, Error, number>({
    mutationFn: (id: number) => api.delete(id),
  });
```

### Step 2: Update AxiosResponse handling

```diff
+ import { unwrapAxiosResponse } from '@nexus-state/query';

  const mutation = useMutation<Dictionary, Error, number>({
-   mutationFn: (id) => api.getById(id),
+   mutationFn: (id) => unwrapAxiosResponse(api.getById(id)),
  });
```

## Automatic Type Inference (v0.2+)

Starting from version 0.2, `@nexus-state/query` supports automatic type inference from `mutationFn`:

```typescript
// Types are automatically inferred from mutationFn
const mutation = useMutation({
  mutationFn: (id: number) => api.archive(id),
});

// mutate() accepts number automatically
mutation.mutate(123);  // ✅ OK
```

This eliminates the need for explicit type parameters in most cases while maintaining full backward compatibility:

```typescript
// Both styles are supported:

// 1. Automatic inference (recommended)
const mutation1 = useMutation({
  mutationFn: (id: number) => api.archive(id),
});

// 2. Explicit types (for advanced cases)
const mutation2 = useMutation<void, Error, number>({
  mutationFn: (id) => api.archive(id),
});
```

## Additional Resources

- [API Reference: useMutation](../api/useMutation.md)
- [Axios Helpers](./axios-helpers.md)
- [Optimistic Updates](./optimistic-updates.md)
