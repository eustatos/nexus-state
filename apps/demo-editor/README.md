# Editor Demo - Nexus State Time-Travel

Демо-приложение текстового редактора для демонстрации возможностей time-travel debugging в Nexus State.

## 🚀 Быстрый старт

```bash
# Установить зависимости (из корня проекта)
pnpm install

# Запустить dev сервер
pnpm dev --workspace=demo-editor

# Или напрямую
cd apps/demo-editor
pnpm dev
```

## 📦 Стек технологий

- **Framework**: React 18+
- **Bundler**: Vite 5+
- **Styling**: Tailwind CSS 3+
- **Editor**: CodeMirror 6
- **State Management**: @nexus-state/core + @nexus-state/react
- **Icons**: Lucide React

## 📁 Структура проекта

```
apps/demo-editor/
├── src/
│   ├── components/
│   │   ├── Editor/       # Компоненты редактора
│   │   ├── Timeline/     # Timeline slider и controls
│   │   ├── Snapshots/    # Список снимков
│   │   └── Layout/       # Layout компоненты
│   ├── store/
│   │   ├── atoms.ts      # Nexus State атомы
│   │   └── timeTravel.ts # Time-travel конфигурация
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Утилиты
│   ├── styles/           # Глобальные стили
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## 🎯 Функционал

- ✏️ Текстовый редактор на базе CodeMirror 6
- 🕰️ Time-travel debugging с Nexus State
- 📊 Статистика документа в реальном времени
- 📸 История снимков состояния
- ⏮️⏭️ Undo/Redo навигация
- 🎬 Авто-проигрывание истории

## 🔧 Команды

```bash
# Разработка
pnpm dev

# Сборка
pnpm build

# Предпросмотр сборки
pnpm preview

# Линтинг
pnpm lint
pnpm lint:fix
```

## 📖 Документация

- [Планирование и задачи](../../planning/phase-06-editor-demo/README.md)
- [Спецификация](../../planning/phase-06-editor-demo/SPEC.md)
- [Use Cases](../../planning/phase-06-editor-demo/use-cases/)

## 🎨 Дизайн-система

### Цветовая палитра

| Цвет | Hex | Preview |
|------|-----|---------|
| Primary | `#6366F1` | 🟣 |
| Secondary | `#8B5CF6` | 🟣 |
| Accent | `#EC4899` | 🩷 |
| Success | `#10B981` | 💚 |
| Warning | `#F59E0B` | 🧡 |
| Danger | `#EF4444` | ❤️ |
| Background | `#0F172A` | ⬛ |
| Surface | `#1E293B` | ⬛ |

### Шрифты

- **Sans**: Inter, system-ui
- **Mono**: JetBrains Mono, Fira Code

## 📝 Заметки

- Приложение использует локальные пакеты @nexus-state/* из монорепозитория
- Требуется Node.js 20+ (см. `.nvmrc`)
- Port: 3005
