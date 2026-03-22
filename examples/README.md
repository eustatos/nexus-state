# Nexus State Examples

Real-world, copy-pasteable examples demonstrating Nexus State packages working together.

## 📦 Examples

### EX-001: Authentication Flow

**Packages:** `@nexus-state/core`, `@nexus-state/react`, `@nexus-state/query`, `@nexus-state/persist`

Complete authentication flow with:
- JWT token persistence in localStorage
- Login/logout functionality
- Protected user profile component
- Loading and error states

**Run:**
```bash
cd examples/auth
pnpm install
pnpm dev
```

**Features:**
- `persistAtom` for token storage
- `useMutation` for auth actions
- Derived atom for user state
- Mock auth service

---

### EX-002: E-Commerce Cart

**Packages:** `@nexus-state/core`, `@nexus-state/react`, `@nexus-state/persist`

Full shopping cart implementation with:
- Product catalog
- Add/remove items
- Quantity updates
- Cart total calculation
- Persistent cart storage

**Run:**
```bash
cd examples/ecommerce-cart
pnpm install
pnpm dev
```

**Features:**
- `persistAtom` for cart persistence
- Computed atoms for totals
- Store actions for cart operations
- Product grid with add-to-cart

---

### EX-003: Dashboard with Real-Time Updates

**Packages:** `@nexus-state/core`, `@nexus-state/react`, `@nexus-state/query`

Real-time dashboard demonstrating:
- Live statistics updates
- Recent orders table
- Notifications system
- Simulated WebSocket updates

**Run:**
```bash
cd examples/dashboard
pnpm install
pnpm dev
```

**Features:**
- `batch` updates for efficiency
- Computed/derived atoms
- Real-time data simulation
- Stats cards with trends

---

### EX-004: Multi-Step Form Wizard

**Packages:** `@nexus-state/core`, `@nexus-state/react`, `@nexus-state/form`, `zod`

Multi-step form with validation:
- Personal information step
- Address step
- Preferences step
- Review and submit
- Form validation with Zod

**Run:**
```bash
cd examples/form-wizard
pnpm install
pnpm dev
```

**Features:**
- Zod schema validation
- Step-by-step navigation
- Form state management
- Review before submit
- Success confirmation

---

## 🚀 Quick Start

All examples are standalone Vite + React applications. Each example:

1. Has its own `package.json` with all dependencies
2. Uses npm packages from registry (not relative paths)
3. Can be run independently
4. Is ready for StackBlitz/CodeSandbox import

### Running Any Example

```bash
cd examples/<example-name>
pnpm install    # or npm install
pnpm dev        # or npm run dev
```

### Import to StackBlitz

1. Open [StackBlitz](https://stackblitz.com/)
2. Click "Import Project"
3. Paste the GitHub URL or upload files
4. Install dependencies and run

---

## 📊 Packages Demonstrated

| Package | Examples |
|---------|----------|
| `@nexus-state/core` | All |
| `@nexus-state/react` | All |
| `@nexus-state/query` | Auth, Dashboard |
| `@nexus-state/persist` | Auth, Cart |
| `@nexus-state/form` | Wizard |

---

## 📋 Example Quality Checklist

- [x] Complete imports (no missing dependencies)
- [x] TypeScript types included
- [x] Error handling shown
- [x] Loading states shown
- [x] Comments explain key parts
- [x] Copy-paste runs without errors
- [x] Follows best practices
- [x] Shows multiple packages together
- [x] Realistic data/models

---

## 🎯 Example Tiers

| Tier | Description | Time | Examples |
|------|-------------|------|----------|
| Tier 1 | Quick Start | 30 sec | Counter (in docs) |
| Tier 2 | Integration | 5 min | Auth, Cart, Wizard |
| Tier 3 | Real-World | 30 min | Dashboard |

---

## 🔗 Related

- [Nexus State Documentation](https://nexus-state.website.yandexcloud.net/)
- [GitHub Repository](https://github.com/eustatos/nexus-state)
- [npm packages](https://www.npmjs.com/search?q=%40nexus-state)
