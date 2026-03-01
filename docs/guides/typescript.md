# TypeScript Guide

Learn how to use Nexus State with TypeScript for type-safe state management.

## Basic Setup

### Install TypeScript

```bash
npm install --save-dev typescript
```

### Configure TypeScript

Create a `tsconfig.json` file in your project root:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Type Inference

### Atom Type Inference

Nexus State provides excellent type inference for atoms:

```typescript
import { atom } from '@nexus-state/core';

// Type is inferred as PrimitiveAtom<number>
const countAtom = atom(0, 'count');

// Type is inferred as PrimitiveAtom<string>
const nameAtom = atom('John', 'name');

// Type is inferred as ComputedAtom<number>
const doubleCountAtom = atom((get) => get(countAtom) * 2, 'doubleCount');

// Type is inferred as WritableAtom<User>
interface User {
  name: string;
  age: number;
}

const userAtom = atom(
  (): User => ({ name: '', age: 0 }),
  (get, set, update) => {
    set(userAtom, { ...get(userAtom), ...update });
  },
  'user',
);
```

### Store Type Inference

```typescript
import { createEnhancedStore } from '@nexus-state/core';

// Store type is automatically inferred
const store = createEnhancedStore();

// Type is inferred from the atom
const value = store.get(countAtom); // number
```

## Working with Complex Types

### Typed Atoms

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
}

const userAtom = atom<User | null>(null, 'user');

// Type is User | null
const user = store.get(userAtom);
```

### Enum Types

```typescript
enum Theme {
  Light = 'light',
  Dark = 'dark'
}

const themeAtom = atom<Theme>(Theme.Light, 'theme');
```

### Union Types

```typescript
type Status = 'idle' | 'loading' | 'success' | 'error';

const statusAtom = atom<Status>('idle', 'status');
```

### Generics

```typescript
function createListAtom<T>(initialValue: T[] = []) {
  return atom<T[]>(initialValue, 'list');
}

const numberListAtom = createListAtom<number>([1, 2, 3]);
const stringListAtom = createListAtom<string>(['a', 'b', 'c']);
```

## Framework-Specific TypeScript

### React

```typescript
import { useAtom } from '@nexus-state/react';

interface User {
  id: string;
  name: string;
}

const userAtom = atom<User | null>(null, 'user');

function UserProfile() {
  // Type is correctly inferred
  const [user, setUser] = useAtom(userAtom);
  
  // TypeScript knows user is User | null
  if (!user) {
    return <div>No user selected</div>;
  }
  
  return (
    <div>
      <h2>{user.name}</h2>
    </div>
  );
}
```

### Vue

```typescript
import { useAtom } from '@nexus-state/vue';

interface Product {
  id: number;
  name: string;
  price: number;
}

const cartAtom = atom<Product[]>([], 'cart');

export default {
  setup() {
    // Type is correctly inferred
    const cart = useAtom(cartAtom);
    
    const total = computed(() => 
      cart.value.reduce((sum, item) => sum + item.price, 0)
    );
    
    return { cart, total };
  }
};
```

### Svelte

```typescript
import { useAtom } from '@nexus-state/svelte';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const todosAtom = atom<Todo[]>([], 'todos');

let todos = useAtom(todosAtom);

// TypeScript knows todos is Todo[]
$: completedCount = todos.filter(t => t.completed).length;
```

## Advanced Type Features

### Mapped Types

```typescript
type Primitive = string | number | boolean | undefined | null;

type Atoms<T> = {
  [P in keyof T]: Atom<T[P]>;
};

interface AppState {
  count: number;
  name: string;
  isActive: boolean;
}

const appAtoms: Atoms<AppState> = {
  count: atom(0, 'count'),
  name: atom('John', 'name'),
  isActive: atom(true, 'isActive')
};
```

### Conditional Types

```typescript
type AtomValue<T> = T extends Atom<infer V> ? V : T;

function getValue<T>(atomOrValue: T | Atom<T>): AtomValue<T> {
  if (typeof (atomOrValue as Atom<T>).read === 'function') {
    return store.get(atomOrValue as Atom<T>);
  }
  return atomOrValue as AtomValue<T>;
}
```

### Utility Types

```typescript
// Use TypeScript utility types with Nexus State

// Make all properties of an atom's value optional
type OptionalAtomValue<T> = Partial<AtomValue<T>>;

// Extract the value type from an atom
type ExtractAtomValue<T extends Atom> = T extends Atom<infer V> ? V : never;

// Create a read-only version of an atom's value
type ReadOnlyAtomValue<T> = Readonly<AtomValue<T>>;
```

## Best Practices

### 1. Use Strict Mode

Enable strict mode in your TypeScript configuration for better type safety.

### 2. Define Types for Complex State

```typescript
interface User {
  id: string;
  profile: {
    name: string;
    email: string;
    avatar?: string;
  };
  settings: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}
```

### 3. Use Type Guards

```typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'profile' in value &&
    'settings' in value
  );
}
```

### 4. Leverage Type Inference

Let TypeScript infer types when possible:

```typescript
// Good - Type is inferred
const countAtom = atom(0, 'count');

// Better - Explicit type annotation when needed
const countAtom = atom<number>(0, 'count');
```

### 5. Use Generics for Reusable Components

```typescript
function createAsyncAtom<T>(
  fetcher: () => Promise<T>,
  initialValue: T | null = null,
) {
  return atom<T | null>(initialValue, 'async-data');
}
```

## Common Patterns

### Form State

```typescript
interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const formAtom = atom<FormState>({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
}, 'form');

// Validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### API State

```typescript
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

const apiAtom = atom<ApiState<User>>({
  data: null,
  loading: false,
  error: null
}, 'api');
```

### Modal State

```typescript
interface ModalState {
  isOpen: boolean;
  content: React.ReactNode;
  onClose?: () => void;
}

const modalAtom = atom<ModalState>({
  isOpen: false,
  content: null
}, 'modal');
```

## Troubleshooting

### Type Not Inferred Correctly

If TypeScript can't infer the type correctly, provide an explicit type annotation:

```typescript
// Instead of
const atom = atom(() => ({ name: '' }));

// Use
const atom = atom<Profile>(() => ({ name: '' }));
```

### Circular Dependencies

Use TypeScript's `declare module` for circular dependencies:

```typescript
// types.d.ts
declare module '@nexus-state/core' {
  interface Atom<T> {
    // Add custom properties
    metadata?: Record<string, unknown>;
  }
}
```

## Next Steps

- [Best Practices Guide](../guides/best-practices.md)
- [Performance Guide](../performance/index.md)
- [API Reference](../api/)
