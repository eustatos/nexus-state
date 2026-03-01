# Refactored DevTools Architecture

## Обзор

Этот документ описывает рефакторированную архитектуру DevTools плагина, которая разделяет монолитный класс `DevToolsPlugin` на отдельные компоненты с четкими ответственностями.

## Проблемы исходной архитектуры

Исходный класс `DevToolsPlugin` (~600 строк кода) нарушал принцип единственной ответственности (SRP):

1. **Настройка и конфигурация**
2. **Подключение к DevTools API**
3. **Сериализация состояния** (лайтовая и полная)
4. **Обработка сообщений от DevTools**
5. **Группировка действий** (batching)
6. **Именование действий** (action naming)
7. **Отслеживание стека вызовов**
8. **Работа с атомами через registry**
9. **Полинг для fallback режима**

## Новая архитектура

### Компоненты

#### 1. **DevToolsConnector**
- **Ответственность**: Управление подключением к Redux DevTools extension
- **Методы**: `connect()`, `disconnect()`, `send()`, `init()`, `subscribe()`
- **Преимущества**: Изоляция логики подключения, возможность тестирования в изоляции

#### 2. **StateSerializer** (уже существовал)
- **Ответственность**: Сериализация и десериализация состояния
- **Методы**: `serialize()`, `deserialize()`, `serializeLazy()`, `exportState()`
- **Преимущества**: Переиспользование, поддержка ленивой сериализации

#### 3. **ActionNamingSystem** (уже существовал)
- **Ответственность**: Генерация имен действий для DevTools
- **Методы**: `getName()`, стратегии именования (auto, simple, pattern, custom)
- **Преимущества**: Гибкая конфигурация, расширяемость

#### 4. **MessageHandler**
- **Ответственность**: Обработка команд от DevTools (time travel, import/export)
- **Методы**: `handle()`, `jumpToState()`, `importState()`
- **Преимущества**: Централизованная обработка сообщений, интеграция с CommandHandler

#### 5. **StackTraceService**
- **Ответственность**: Захват и форматирование стектрейсов
- **Методы**: `capture()`, `format()`, `formatForDevTools()`
- **Преимущества**: Изоляция сложной логики работы со стектрейсами

#### 6. **AtomNameResolver**
- **Ответственность**: Разрешение имен атомов для отображения в DevTools
- **Методы**: `getName()`, `formatName()`, `getNameWithMetadata()`
- **Преимущества**: Конфигурируемое форматирование, интеграция с atom registry

#### 7. **PollingService**
- **Ответственность**: Fallback polling для stores без metadata support
- **Методы**: `start()`, `stop()`, `isRunning()`, `getStats()`
- **Преимущества**: Управление интервалами, статистика, возможность отладки

#### 8. **DevToolsPluginRefactored** (координатор)
- **Ответственность**: Координация работы всех компонентов
- **Методы**: `apply()`, `startBatch()`, `endBatch()`, `exportState()`, `dispose()`
- **Преимущества**: Четкая координация, управление жизненным циклом

### Диаграмма зависимостей

```
DevToolsPluginRefactored
    ├── DevToolsConnector
    ├── StateSerializer
    ├── ActionNamingSystem
    ├── MessageHandler
    │   └── CommandHandler (существующий)
    ├── StackTraceService
    ├── AtomNameResolver
    ├── PollingService
    ├── BatchUpdater (существующий)
    ├── ActionGrouper (существующий)
    └── SnapshotMapper (существующий)
```

## Преимущества новой архитектуры

### 1. **Лучшее соответствие SRP**
Каждый класс имеет одну четкую ответственность, что упрощает понимание и поддержку.

### 2. **Упрощение тестирования**
Компоненты можно тестировать изолированно, без необходимости мокировать множество зависимостей.

### 3. **Улучшенная читаемость**
Код организован по функциональности, что упрощает навигацию и понимание.

### 4. **Гибкость конфигурации**
Можно отключать ненужные компоненты или настраивать их независимо.

### 5. **Переиспользование**
Компоненты можно использовать в других частях приложения или в других проектах.

### 6. **Более легкое сопровождение**
Изменения локализованы в конкретных компонентах, что снижает риск побочных эффектов.

### 7. **Упрощение отладки**
Проще отследить проблемы в конкретном компоненте.

### 8. **Более чистые интерфейсы**
Меньше связанности между компонентами, четкие API.

## Миграция с старой архитектуры

### Постепенный подход

1. **Сначала использовать новые компоненты параллельно**
   - Можно использовать `DevToolsPluginRefactored` рядом с оригинальным `DevToolsPlugin`
   - Постепенно мигрировать использование

2. **Затем заменить основной плагин**
   - Обновить основной файл `devtools-plugin.ts` для использования новой архитектуры
   - Сохранить обратную совместимость API

3. **Наконец, удалить старый код**
   - После полной миграции и тестирования

### Совместимость API

Новый `DevToolsPluginRefactored` предоставляет тот же публичный API:

```typescript
// Старый API
const plugin = new DevToolsPlugin(config);
plugin.apply(store);
plugin.startBatch('group1');
plugin.endBatch('group1');
const exported = plugin.exportState(store);

// Новый API
const plugin = new DevToolsPluginRefactored(config);
plugin.apply(store);
plugin.startBatch('group1');
plugin.endBatch('group1');
const exported = plugin.exportState(store);
```

## Примеры использования

### Использование отдельных компонентов

```typescript
import { 
  StackTraceService,
  AtomNameResolver,
  StateSerializer 
} from './refactored-exports';

// Использование StackTraceService
const traceService = new StackTraceService();
const trace = traceService.capture({ limit: 5 });
if (trace) {
  console.log(traceService.formatForDevTools(trace));
}

// Использование AtomNameResolver
const resolver = new AtomNameResolver({
  showAtomNames: true,
  maxLength: 50,
});
const atomName = resolver.getName(atom);

// Использование StateSerializer
const serializer = new StateSerializer();
const exported = serializer.exportState(state, { source: 'export' });
```

### Кастомная конфигурация

```typescript
import { DevToolsPluginRefactored } from './devtools-plugin-refactored';

const plugin = new DevToolsPluginRefactored({
  name: 'MyApp',
  trace: true,
  traceLimit: 8,
  latency: 150,
  
  // Кастомное именование атомов
  atomNameFormatter: (atom, defaultName) => {
    return `[${atom.id?.toString() || 'unknown'}] ${defaultName}`;
  },
  
  // Ленивая сериализация для больших состояний
  serialization: {
    lazy: true,
    maxDepth: 8,
    maxSerializedSize: 1024 * 1024, // 1MB
  },
});
```

## Производительность

### Улучшения

1. **Tree-shaking**: Компоненты можно импортировать отдельно
2. **Ленивая инициализация**: Сервисы создаются только при необходимости
3. **Инкрементальные обновления**: Ленивая сериализация только измененных ключей
4. **Эффективный polling**: Управляемые интервалы, статистика использования

### Нагрузка

- **Память**: Небольшое увеличение из-за большего количества объектов
- **Производительность**: Незначительное влияние, компенсируется лучшей организацией
- **Bundle size**: Улучшенное tree-shaking может уменьшить размер

## Тестирование

### Unit-тесты

Каждый компонент имеет собственные unit-тесты:

- `StackTraceService` тестирует захват и форматирование стектрейсов
- `AtomNameResolver` тестирует разрешение имен атомов
- `PollingService` тестирует механизм polling
- `MessageHandler` тестирует обработку команд DevTools

### Интеграционные тесты

`DevToolsPluginRefactored` тестирует интеграцию всех компонентов.

## Расширение архитектуры

### Добавление нового компонента

1. Создать новый класс с четкой ответственностью
2. Реализовать интерфейс
3. Интегрировать в `DevToolsPluginRefactored`
4. Добавить тесты
5. Обновить документацию

### Пример: LoggingService

```typescript
class LoggingService {
  constructor(private options: LoggingOptions) {}
  
  log(message: string, level: LogLevel = 'info') {
    if (this.options.enabled && this.shouldLog(level)) {
      console[level](`[DevTools] ${message}`);
    }
  }
  
  private shouldLog(level: LogLevel): boolean {
    return this.options.levels.includes(level);
  }
}
```

## Заключение

Рефакторинг DevTools плагина на отдельные компоненты значительно улучшает:

1. **Поддерживаемость**: Код легче понимать и изменять
2. **Тестируемость**: Компоненты можно тестировать изолированно
3. **Расширяемость**: Легко добавлять новую функциональность
4. **Переиспользование**: Компоненты можно использовать отдельно
5. **Документированность**: Четкие ответственности и интерфейсы

Рекомендуется постепенная миграция с сохранением обратной совместимости.
