# TASK-015: Оптимизация bundle size

## 📋 Описание

Анализ и оптимизация размера bundle всех пакетов плагинной системы валидации.

## 🎯 Цель

Обеспечить минимальный размер bundle для production:
- Ядро SDK < 2KB (gzip)
- Каждый плагин < 5KB (gzip)
- DSL плагин < 10KB (gzip) со всеми валидаторами

## 📦 Требования к реализации

### Анализ размера

```bash
# Установка анализатора
pnpm add -D rollup-plugin-visualizer

# Анализ form пакета
pnpm build --visualize

# Анализ плагинов
pnpm -r --filter "@nexus-state/form-schema-*" build --visualize
```

### Стратегии оптимизации

#### 1. Tree Shaking

```typescript
// ✅ Правильно: именованные экспорты
export { required, minLength, email } from './validators';

// ❌ Неправильно: default экспорт всего
export default { required, minLength, email };
```

#### 2. Code Splitting

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./validators": {
      "types": "./dist/validators.d.ts",
      "import": "./dist/validators.js"
    },
    "./async-validators": {
      "types": "./dist/async-validators.d.ts",
      "import": "./dist/async-validators.js"
    }
  }
}
```

#### 3. Удаление dev зависимостей

```typescript
// ❌ Неправильно: lodash весь
import { debounce } from 'lodash';

// ✅ Правильно: только нужное
import debounce from 'lodash/debounce';

// ✅ Лучше: своя реализация
function debounce(fn: Function, delay: number) {
  let timeout: any;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
```

#### 4. Минимизация типов

```typescript
// ✅ Правильно: типы только в .d.ts файлах
// TypeScript удалит их при компиляции

// ❌ Неправильно: runtime проверки типов
if (typeof value === 'string') {
  // Избегать в production коде
}
```

### Чек-лист оптимизации

- [ ] Включить minification в tsup/tsc
- [ ] Включить tree shaking в package.json
- [ ] Проверить sideEffects флаг
- [ ] Удалить неиспользуемые импорты
- [ ] Заменить тяжелые зависимости на легкие
- [ ] Использовать code splitting для больших модулей
- [ ] Проверить через bundlephobia.com

### package.json настройки

```json
{
  "sideEffects": false,
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "files": [
    "dist"
  ]
}
```

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  minify: true,
  treeshake: true,
  splitting: true,
  sourcemap: true,
  clean: true,
});
```

### Отчёт о размере

```markdown
## Bundle Size Report

| Package | Raw | Gzip | Brotli |
|---------|-----|------|--------|
| @nexus-state/form (schema/) | 4.2KB | 1.8KB | 1.5KB |
| @nexus-state/form-schema-zod | 3.1KB | 1.2KB | 1.0KB |
| @nexus-state/form-schema-yup | 4.5KB | 1.6KB | 1.3KB |
| @nexus-state/form-schema-ajv | 6.2KB | 2.1KB | 1.8KB |
| @nexus-state/form-schema-dsl | 8.9KB | 3.2KB | 2.8KB |

Цели достигнуты ✅
```

## ✅ Критерии приемки

- [ ] Анализ размера проведён
- [ ] Tree shaking настроен
- [ ] Code splitting реализован
- [ ] sideEffects флаг установлен
- [ ] Minification включён
- [ ] Отчёт о размере создан
- [ ] Цели по размеру достигнуты

## 🔄 Прогресс

- [ ] Анализ текущего размера
- [ ] Настройка tsup
- [ ] Оптимизация импортов
- [ ] Code splitting
- [ ] Финальный отчёт
