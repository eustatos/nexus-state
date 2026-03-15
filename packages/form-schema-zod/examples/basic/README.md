# Zod Basic Example

This example demonstrates basic form validation with Zod schema.

## Features

- Email validation
- Password minimum length
- Real-time error display
- Submit handling

## Running the Example

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

## Code Overview

```typescript
import { z } from 'zod';
import { createForm } from '@nexus-state/form';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginForm = createForm(loginSchema, {
  email: '',
  password: '',
});
```

## Learn More

- [Zod Documentation](https://zod.dev/)
- [Nexus State Form Documentation](https://nexus-state.dev/)
