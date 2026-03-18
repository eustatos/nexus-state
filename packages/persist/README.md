# @nexus-state/persist

> Persistence for Nexus State — LocalStorage, sessionStorage, and custom storage adapters
>
> [![npm version](https://img.shields.io/npm/v/@nexus-state/persist)](https://www.npmjs.com/package/@nexus-state/persist)
> [![npm downloads](https://img.shields.io/npm/dw/@nexus-state/persist)](https://www.npmjs.com/package/@nexus-state/persist)
> [![License](https://img.shields.io/badge/license-MIT-blue)](https://github.com/eustatos/nexus-state/blob/main/LICENSE)

[Documentation](https://nexus-state.website.yandexcloud.net/) • [Repository](https://github.com/eustatos/nexus-state)

---

## 🚀 Quick Start

```javascript
import { persistAtom } from '@nexus-state/persist';
import { useAtomValue } from '@nexus-state/react';

// Persist atom to localStorage
const settingsAtom = persistAtom(
  'settings',
  { theme: 'dark', language: 'en' },
  { storage: 'localStorage' }
);

// Value is automatically loaded from localStorage
// and saved on every change
```

---

## 📦 Installation

```bash
npm install @nexus-state/persist
```

**Required:**
```bash
npm install @nexus-state/core
```

---

## 🔗 See Also

- **Core:** [@nexus-state/core](https://www.npmjs.com/package/@nexus-state/core) — Foundation (atoms, stores)
- **Framework integration:**
  - [@nexus-state/react](https://www.npmjs.com/package/@nexus-state/react) — React hooks
  - [@nexus-state/vue](https://www.npmjs.com/package/@nexus-state/vue) — Vue composables
  - [@nexus-state/svelte](https://www.npmjs.com/package/@nexus-state/svelte) — Svelte stores
- **Related:**
  - [@nexus-state/query](https://www.npmjs.com/package/@nexus-state/query) — Data fetching with caching
  - [@nexus-state/form](https://www.npmjs.com/package/@nexus-state/form) — Form management

**Full ecosystem:** [Nexus State Packages](https://www.npmjs.com/org/nexus-state)

---

## 📄 License

MIT