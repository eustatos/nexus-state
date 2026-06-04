# TASK-001: Настройка проекта (Project Setup)

## 📋 Описание

Настройка нового React + Vite проекта для демо-приложения редактора с необходимой инфраструктурой и зависимостями.

## 🎯 Цель

Создать рабочую основу для разработки демо-приложения с настроенными инструментами сборки, линтинга и стилизации.

## 📦 Технические требования

### Стек технологий

```json
{
  "framework": "React 18+",
  "bundler": "Vite 5+",
  "styling": "Tailwind CSS 3+",
  "icons": "Lucide React",
  "editor": "CodeMirror 6",
  "state": "@nexus-state/core + @nexus-state/react",
  "utils": "lodash-es (debounce)"
}
```

## ✅ Задачи

### 1.1: Инициализация проекта

```bash
# Создать структуру приложения
pnpm create vite@latest demo-editor --template react-ts

# Установить зависимости
cd demo-editor
pnpm install
```

**Ожидаемый результат:**
- Рабочий Vite проект
- TypeScript настроен
- Базовая структура файлов

### 1.2: Установка зависимостей

```bash
# Nexus State (локальные пакеты)
pnpm add @nexus-state/core @nexus-state/react

# Tailwind CSS
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# CodeMirror 6
pnpm add @codemirror/state @codemirror/view @codemirror/lang-basic @codemirror/theme-one-dark

# Icons
pnpm add lucide-react

# Utils
pnpm add lodash-es
pnpm add -D @types/lodash-es
```

### 1.3: Настройка Tailwind CSS

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#EC4899',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        surface: '#1E293B',
        border: '#334155',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', system-ui, sans-serif;
  }
}
```

### 1.4: Настройка TypeScript

**tsconfig.json:**
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
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 1.5: Настройка алиасов

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 1.6: Базовая структура проекта

```
apps/demo-editor/
├── src/
│   ├── components/
│   │   ├── Editor/
│   │   ├── Timeline/
│   │   ├── Snapshots/
│   │   └── Layout/
│   ├── store/
│   │   ├── atoms.ts
│   │   └── timeTravel.ts
│   ├── hooks/
│   ├── utils/
│   ├── styles/
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

### 1.7: Базовый App компонент

**src/App.tsx:**
```typescript
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <header className="h-16 border-b border-slate-700 flex items-center px-6">
        <h1 className="text-xl font-bold">📝 Editor Demo</h1>
      </header>
      
      <main className="flex h-[calc(100vh-4rem)]">
        <div className="flex-1 p-6">
          <p className="text-slate-400">Editor placeholder</p>
        </div>
        
        <aside className="w-80 border-l border-slate-700 p-4">
          <p className="text-slate-400">Snapshots placeholder</p>
        </aside>
      </main>
    </div>
  )
}

export default App
```

## 🧪 Критерии приемки

- [ ] `pnpm install` выполняется без ошибок
- [ ] `pnpm dev` запускает dev server
- [ ] Tailwind CSS работает (проверить классы)
- [ ] TypeScript компилируется без ошибок
- [ ] Алиасы `@/` работают
- [ ] Базовый layout отображается корректно

## 📁 Зависимости

- Нет (первая задача)

## 🔗 Связанные задачи

- [[TASK-002]](./TASK-002-store-atoms.md) — Создание атомов и store
- [[TASK-003]](./TASK-003-editor-component.md) — Базовый компонент редактора

## 📝 Заметки

- Использовать локальные пакеты @nexus-state/* из монорепозитория
- Настроить link на локальные пакеты если нужно
- Добавить `.nvmrc` с версией Node.js
