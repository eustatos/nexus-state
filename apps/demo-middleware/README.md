# Middleware Demo Application

Interactive demonstration of the new `@nexus-state/middleware` v1.0 plugin-based API.

## Quick Start

```bash
# From project root
pnpm install

# Run demo
cd apps/demo-middleware
pnpm dev
```

Then open http://localhost:5173 in your browser.

## Features Demonstrated

### Example 1: Basic Logger Middleware

Shows how to create simple logging middleware that tracks all state changes.

**Key concepts:**
- `beforeSet` hook - logs before value changes
- `afterSet` hook - logs after value changes
- Basic plugin application

**Code:**
```javascript
const loggingPlugin = createMiddlewarePlugin(userNameAtom, {
  beforeSet: (atom, value) => {
    console.log(`[BEFORE] Setting to: ${value}`);
    return value;
  },
  afterSet: (atom, value) => {
    console.log(`[AFTER] Set to: ${value}`);
  }
});

store.applyPlugin(loggingPlugin);
```

---

### Example 2: Validation Middleware

Demonstrates value validation and transformation.

**Key concepts:**
- Value validation in `beforeSet`
- Auto-correction of invalid values
- Tracking validation attempts

**Code:**
```javascript
const validationPlugin = createMiddlewarePlugin(ageAtom, {
  beforeSet: (atom, value) => {
    if (value < 0) return 0;
    if (value > 150) return 150;
    return value;
  }
});
```

**Try it:**
- Enter negative numbers (auto-corrected to 0)
- Enter numbers > 150 (auto-corrected to 150)
- Watch console for validation logs

---

### Example 3: Middleware Chain

Shows multiple middleware working together on the same atom.

**Key concepts:**
- Multiple plugins on single atom
- Execution order (application order)
- Combined effects

**Applied middleware:**
1. Logging (afterSet) - logs changes
2. Validation Counter (beforeSet) - counts validations

**Code:**
```javascript
store.applyPlugin(loggingPlugin);
store.applyPlugin(counterPlugin);

// Execution order: logging → counter
```

---

### Example 4: Plugin Disposal (NEW!)

Demonstrates the new plugin disposal feature in v1.0.

**Key concepts:**
- Creating disposable plugins
- Cleaning up middleware
- Runtime plugin management

**Code:**
```javascript
const disposablePlugin = createMiddlewarePlugin(tempAtom, {
  beforeSet: (atom, value) => value * 2
});

store.applyPlugin(disposablePlugin);

// Later, when no longer needed:
disposablePlugin.dispose();
```

**Try it:**
1. Click "+1" - value doubles (plugin active)
2. Click "Dispose Plugin" - disables doubling
3. Click "+1" again - value no longer doubles

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Demo Application                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Logger    │  │ Validation  │  │   Chain     │     │
│  │  Example    │  │   Example   │  │   Example   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │        Plugin Disposal Example (NEW!)           │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│              @nexus-state/middleware v1.0               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  createMiddlewarePlugin() - New Primary API     │   │
│  │  - Plugin hooks (onSet, afterSet)               │   │
│  │  - Plugin disposal support                      │   │
│  │  - Predictable execution order                  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Middleware Applied

| Middleware | Atom | Hooks | Purpose |
|------------|------|-------|---------|
| Logging (Name) | userName | beforeSet, afterSet | Console logging |
| Logging (Age) | userAge | beforeSet, afterSet | Console logging |
| Logging (Click) | clickCount | afterSet | Console logging |
| Validation | userAge | beforeSet | Age validation (0-150) |
| Validation Counter | validationCount | beforeSet | Count validations |
| localStorage (Name) | userName | afterSet | Persist to storage |
| localStorage (Age) | userAge | afterSet | Persist to storage |

## New API vs Legacy API

### New API (v1.0) - Recommended

```javascript
import { createMiddlewarePlugin } from '@nexus-state/middleware';

const plugin = createMiddlewarePlugin(atom, {
  beforeSet: (atom, value) => value,
  afterSet: (atom, value) => {}
});

store.applyPlugin(plugin);
```

### Legacy API (v0.x) - Deprecated

```javascript
import { middleware } from '@nexus-state/middleware';

const store = createStore([
  middleware(atom, {
    beforeSet: (atom, value) => value,
    afterSet: (atom, value) => {}
  })
]);
```

See [MIGRATION.md](../../packages/middleware/MIGRATION.md) for details.

## Files Structure

```
apps/demo-middleware/
├── src/
│   ├── App.jsx           # Main demo with all examples
│   └── main.jsx          # React entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md             # This file
```

## Dependencies

- React 18
- Vite 4
- @nexus-state/core (workspace)
- @nexus-state/middleware (workspace)
- @nexus-state/react (workspace)

## Scripts

```bash
# Development mode
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Troubleshooting

### Console logs not showing

Open browser DevTools console (F12) to see middleware logs.

### localStorage not persisting

Ensure your browser allows localStorage. Some private/incognito modes block it.

### Validation not working

Check that you're modifying the `userAge` atom, not other atoms.

## Related Documentation

- [Middleware Package README](../../packages/middleware/README.md)
- [Migration Guide](../../packages/middleware/MIGRATION.md)
- [Core Package Documentation](../../packages/core/README.md)

## License

MIT
