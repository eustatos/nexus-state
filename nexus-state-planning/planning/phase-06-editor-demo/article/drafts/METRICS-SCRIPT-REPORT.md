# Скрипт для сбора метрик производительности

## Дата: Март 2026

## Созданные файлы

### 1. `apps/demo-editor/src/test/collect-metrics.ts`

**Назначение:** Сбор метрик производительности time-travel

**Экспортируемые функции:**

| Функция | Описание | Возвращает |
|---------|----------|------------|
| `measurePerformance()` | Асинхронно собирает метрики | `Promise<PerformanceMetrics>` |
| `printMetrics(metrics)` | Выводит метрики в консоль | `void` |
| `compareWithTargets(metrics)` | Сравнивает с target | `PerformanceReport` |

**Пример использования:**

```typescript
// Базовое использование
import { measurePerformance, printMetrics } from './src/test/collect-metrics'

const metrics = await measurePerformance()
printMetrics(metrics)

// Вывод:
// ⚡ Performance Metrics
// ⏱️  Avg Capture Time: 32.45ms
// ⏱️  Avg Restore Time: 45.67ms
// 💾 Memory Usage: 28.34MB
```

**Сравнение с целевыми показателями:**

```typescript
import { measurePerformance, compareWithTargets } from './src/test/collect-metrics'

const metrics = await measurePerformance()
const report = compareWithTargets(metrics)

console.log({
  captureTime: `${report.captureTime.actual.toFixed(2)}ms (target: <${report.captureTime.target}ms) ${report.captureTime.passed ? '✅' : '❌'}`,
  restoreTime: `${report.restoreTime.actual.toFixed(2)}ms (target: <${report.restoreTime.target}ms) ${report.restoreTime.passed ? '✅' : '❌'}`,
  memory: `${report.memory.actual.toFixed(2)}MB (target: <${report.memory.target}MB) ${report.memory.passed ? '✅' : '❌'}`,
})
```

---

### 2. `apps/demo-editor/src/test/README.md`

**Назначение:** Документация по использованию скрипта

**Содержание:**
- Быстрый старт
- Примеры использования
- Описание API
- Интеграция с тестами
- Целевые показатели

---

## Изменения в статье

### habr.md (Шаг 15)

**Обновлён раздел "Для воспроизведения тестов":**

```bash
# Откройте консоль браузера (F12) и выполните:
import { measurePerformance, printMetrics } from './src/test/collect-metrics'
const metrics = await measurePerformance()
printMetrics(metrics)

# Или получите подробный отчёт:
import { compareWithTargets } from './src/test/collect-metrics'
const report = compareWithTargets(metrics)
console.log('Capture Time:', report.captureTime.actual.toFixed(2) + 'ms', report.captureTime.passed ? '✅' : '❌')
console.log('Restore Time:', report.restoreTime.actual.toFixed(2) + 'ms', report.restoreTime.passed ? '✅' : '❌')
console.log('Memory:', report.memory.actual.toFixed(2) + 'MB', report.memory.passed ? '✅' : '❌')
```

**Добавлена ссылка на документацию:**
> **Документация:** Полный API и примеры использования см. в `apps/demo-editor/src/test/README.md`.

---

## API

### Интерфейсы

```typescript
export interface PerformanceMetrics {
  avgCaptureTime: number      // среднее время захвата (ms)
  avgRestoreTime: number      // среднее время восстановления (ms)
  memoryMB: number            // потребление памяти (MB)
}

export interface PerformanceReport {
  captureTime: {
    target: number   // 50ms
    actual: number   // фактическое значение
    passed: boolean  // true если < target
  }
  restoreTime: {
    target: number   // 100ms
    actual: number
    passed: boolean
  }
  memory: {
    target: number   // 50MB
    actual: number
    passed: boolean
  }
}
```

### Функции

#### `measurePerformance()`

```typescript
async function measurePerformance(): Promise<PerformanceMetrics>
```

**Описание:** Асинхронно собирает метрики производительности.

**Процесс:**
1. Создаёт 10 тестовых снимков, измеряет время
2. Восстанавливает каждый снимок, измеряет время
3. Измеряет потребление памяти
4. Возвращает средние значения

**Возвращает:**
```typescript
{
  avgCaptureTime: 32.45,    // ms
  avgRestoreTime: 45.67,    // ms
  memoryMB: 28.34           // MB
}
```

---

#### `printMetrics(metrics)`

```typescript
function printMetrics(metrics: PerformanceMetrics): void
```

**Описание:** Выводит метрики в консоль в читаемом формате.

**Пример вывода:**
```
⚡ Performance Metrics
⏱️  Avg Capture Time: 32.45ms
⏱️  Avg Restore Time: 45.67ms
💾 Memory Usage: 28.34MB

Target values:
  Capture Time: < 50ms
  Restore Time: < 100ms
  Memory: < 50MB
```

---

#### `compareWithTargets(metrics)`

```typescript
function compareWithTargets(metrics: PerformanceMetrics): PerformanceReport
```

**Описание:** Сравнивает метрики с целевыми показателями.

**Целевые показатели:**
- Capture Time: < 50ms
- Restore Time: < 100ms
- Memory: < 50MB

**Возвращает:**
```typescript
{
  captureTime: { target: 50, actual: 32.45, passed: true },
  restoreTime: { target: 100, actual: 45.67, passed: true },
  memory: { target: 50, actual: 28.34, passed: true }
}
```

---

## Интеграция с Vitest

Для автоматических тестов производительности:

```typescript
// src/test/performance.test.ts
import { describe, it, expect } from 'vitest'
import { measurePerformance } from './collect-metrics'

describe('Performance', () => {
  it('should meet capture time target', async () => {
    const metrics = await measurePerformance()
    expect(metrics.avgCaptureTime).toBeLessThan(50)
  })

  it('should meet restore time target', async () => {
    const metrics = await measurePerformance()
    expect(metrics.avgRestoreTime).toBeLessThan(100)
  })

  it('should meet memory target', async () => {
    const metrics = await measurePerformance()
    expect(metrics.memoryMB).toBeLessThan(50)
  })
})
```

---

## Соответствие статье

| Раздел в статье | Реализация | Статус |
|-----------------|------------|--------|
| `measurePerformance()` | ✅ | Соответствует |
| Метрика `snapshotCapture` | ✅ | Соответствует |
| Метрика `snapshotRestore` | ✅ | Соответствует |
| Метрика `memory` | ✅ | Соответствует |
| Целевые показатели | ✅ | Соответствуют |
| Пример использования | ✅ | Соответствует |

---

## Как использовать в демо

### Вариант 1: Быстрый тест

1. Откройте демо-приложение
2. Откройте консоль браузера (F12)
3. Выполните:
   ```typescript
   import { measurePerformance, printMetrics } from './src/test/collect-metrics'
   const metrics = await measurePerformance()
   printMetrics(metrics)
   ```

### Вариант 2: Подробный отчёт

```typescript
import { measurePerformance, compareWithTargets } from './src/test/collect-metrics'

const metrics = await measurePerformance()
const report = compareWithTargets(metrics)

console.table({
  'Capture Time': { actual: report.captureTime.actual.toFixed(2) + 'ms', target: '<50ms', status: report.captureTime.passed ? '✅' : '❌' },
  'Restore Time': { actual: report.restoreTime.actual.toFixed(2) + 'ms', target: '<100ms', status: report.restoreTime.passed ? '✅' : '❌' },
  Memory: { actual: report.memory.actual.toFixed(2) + 'MB', target: '<50MB', status: report.memory.passed ? '✅' : '❌' },
})
```

---

## Файлы

- **Скрипт:** `apps/demo-editor/src/test/collect-metrics.ts`
- **Документация:** `apps/demo-editor/src/test/README.md`
- **Статья:** `planning/phase-06-editor-demo/article/drafts/habr.md` (обновлена)

---

**Статус:** ✅ Готово к использованию
