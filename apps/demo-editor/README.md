# Demo Editor Application

Text editor with time-travel debugging for demonstrating Nexus State capabilities.

## 🚀 Quick Start

```bash
# Install dependencies (from project root)
pnpm install

# Start dev server
pnpm dev --workspace=demo-editor

# Or directly
cd apps/demo-editor
pnpm dev
```

Application available at: **http://localhost:3005**

---

## 📁 Project Structure

```
apps/demo-editor/
├── .gitignore              # Git ignore rules
├── .nvmrc                  # Node.js version (20+)
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── playwright.config.ts    # Playwright E2E config
├── postcss.config.js       # PostCSS config
├── tailwind.config.js      # Tailwind CSS config
├── tsconfig.json           # TypeScript config
├── tsconfig.node.json      # TypeScript Node config
├── vite.config.ts          # Vite bundler config
├── vitest.config.ts        # Vitest tests config
└── README.md               # This file
│
├── e2e/                    # E2E tests (Playwright)
│   └── tests/
│       ├── basic.spec.ts                    # Basic tests
│       ├── editor.spec.ts                   # Editor tests
│       ├── time-travel.spec.ts              # Time-travel tests
│       ├── toolbar.spec.ts                  # Toolbar tests
│       ├── timeline-slider.spec.ts          # Timeline tests
│       ├── snapshot-list.spec.ts            # Snapshot list tests
│       ├── navigation-controls.spec.ts      # Navigation tests
│       ├── snapshot-navigation.spec.ts      # Snapshot navigation tests
│       ├── debounce-snapshots.spec.ts       # Debounce tests
│       ├── editor-state-restoration.spec.ts # Restoration tests
│       └── time-travel-integration.spec.ts  # Integration tests
│
└── src/                    # Source code
    ├── __tests__/          # Unit tests
    │   ├── store-subscription-jump.test.ts
    │   ├── time-travel-editor-integration.test.tsx
    │   └── time-travel-react-notifications.test.tsx
    ├── components/         # React components
    │   ├── Editor/         # Editor components
    │   ├── Timeline/       # Timeline slider and controls
    │   ├── Snapshots/      # Snapshot list and diff
    │   ├── StressTest/     # Stress test components
    │   └── Layout/         # Layout components
    ├── hooks/              # Custom hooks
    │   ├── useDebounceSnapshots.ts
    │   ├── useExportImport.ts
    │   ├── usePerformanceMetrics.ts
    │   ├── usePlayback.ts
    │   ├── useSnapshotComparison.ts
    │   ├── useSnapshots.ts
    │   ├── useStressTest.ts
    │   └── useTimeTravel.ts
    ├── store/              # Store and atoms
    │   ├── atoms/          # Atoms
    │   ├── helpers.ts      # Helper functions
    │   ├── index.ts        # Exports
    │   ├── store.ts        # Store instance
    │   └── timeTravel.ts   # Time-travel configuration
    ├── styles/             # Global styles
    │   └── globals.css
    ├── test/               # Test utilities
    │   └── setup.ts
    ├── utils/              # Utilities
    │   ├── debounce.ts
    │   └── formatters.ts
    ├── App.tsx             # Main component
    ├── App.css             # App styles
    └── main.tsx            # Entry point
```

---

## 🛠️ Commands

### Development

```bash
# Start dev server
pnpm dev

# Build production version
pnpm build

# Preview production build
pnpm preview
```

### Testing

```bash
# Unit tests (Vitest)
pnpm test

# Unit tests with coverage
pnpm test:coverage

# E2E tests (Playwright)
pnpm test:e2e

# E2E tests with UI
pnpm test:e2e:ui

# E2E tests in headed mode
pnpm test:e2e:headed

# E2E tests with debug
pnpm test:e2e:debug

# E2E tests report
pnpm test:e2e:report
```

### Linting

```bash
# Linting
pnpm lint

# Auto-fix
pnpm lint:fix
```

---

## 📦 Tech Stack

- **Framework:** React 18+
- **Bundler:** Vite 5+
- **Styling:** Tailwind CSS 3+
- **Editor:** CodeMirror 6
- **State Management:** @nexus-state/core + @nexus-state/react
- **Icons:** Lucide React
- **Testing:** Vitest (unit) + Playwright (E2E)

---

## 🎯 Features

- ✏️ Text editor based on CodeMirror 6
- 🕰️ Time-travel debugging with Nexus State
- ⏮️⏭️ Undo/Redo navigation
- 📊 Real-time document statistics
- 📸 Snapshot history
- 🎬 Auto-playback history
- 🧪 Stress test modes (Turbo Type, Snapshot Storm)

---

## 📝 Notes

- Application uses local @nexus-state/* packages from monorepo
- Requires Node.js 20+ (specified in `.nvmrc`)
- Port: 3005

---

## 🔗 Documentation

- [Planning](../../planning/phase-06-editor-demo/README.md)
- [Specification](../../planning/phase-06-editor-demo/SPEC.md)
- [Use Cases](../../planning/phase-06-editor-demo/use-cases/)

---

*Demo application for demonstrating Nexus State Time-Travel Debugging capabilities*
