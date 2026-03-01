# Расширенные возможности DevTools

## Именование действий

DevTools предоставляет гибкую систему именования действий для улучшения отладки.

### Стратегии именования

```typescript
import { devTools } from '@nexus-state/devtools';

// Автоматическое именование (по умолчанию)
const plugin = devTools({
  actionNaming: 'auto' // ATOM_UPDATE/atomName
});

// Пользовательские стратегии именования
const plugin = devTools({
  actionNaming: (atom, value) => {
    if (typeof value === 'number') {
      return `INCREMENT_${atom.toString()}`;
    }
    return `UPDATE_${atom.toString()}`;
  }
});
```

### Метаданные действий (DEV-003-C)

Каждое действие содержит метаданные для улучшенной отладки. Используйте типобезопасный билдер с fluent API:

```typescript
import { createActionMetadata } from '@nexus-state/devtools';

// Базовые поля
const meta = createActionMetadata()
  .type('user/SET_NAME')
  .atomName('user')
  .timestamp(Date.now())
  .source('DevToolsPlugin')
  .stackTrace('at set...')  // при trace: true
  .groupId('batch-1')       // для группировки
  .build();

// Пользовательские поля (type-safe)
interface CustomMeta { requestId: string; retries: number; }
const custom = createActionMetadata<CustomMeta>()
  .type('api/CALL')
  .atomName('api')
  .set('requestId', 'req-1')
  .set('retries', 2)
  .build();
```

Базовый интерфейс метаданных: `type`, `timestamp`, `source`, `atomName`, `stackTrace?`, `groupId?`; к нему можно добавлять произвольные поля через `.set()` или `.merge()`.

## Захват стек-трейсов

В режиме разработки можно включить захват стек-трейсов для действий.

### Конфигурация

```typescript
import { devTools } from '@nexus-state/devtools';

const plugin = devTools({
  trace: true,       // Включить захват стек-трейсов (только в development)
  traceLimit: 10,   // Максимальное количество фреймов (по умолчанию 10)
});
```

### Оптимизация производительности

Захват стек-трейсов оптимизирован для минимального влияния на производительность:

- Захват только в режиме разработки
- Ленивая генерация стек-трейсов
- Настраиваемая глубина захвата
- Полное исключение кода в production сборках

## Группировка действий (батчи)

Связанные обновления можно объединять в один «батч» в DevTools через группировку.

### Через плагин (startBatch / endBatch)

```typescript
import { devTools } from '@nexus-state/devtools';

const plugin = devTools({ actionGroupOptions: { flushAfterMs: 100, maxGroupSize: 50 } });
plugin.apply(store);

plugin.startBatch('form-submit');
store.set(formAtom, data);
store.set(loadingAtom, false);
plugin.endBatch('form-submit');  // в DevTools отобразится один сгруппированный action
```

### Программная группировка (createActionGrouper)

```typescript
import { createActionMetadata, createActionGrouper } from '@nexus-state/devtools';

const grouper = createActionGrouper({ flushAfterMs: 100, maxGroupSize: 10 });
const groupId = 'batch-1';

grouper.startGroup(groupId);
grouper.add(createActionMetadata().type('a/SET').atomName('a').groupId(groupId).build());
grouper.add(createActionMetadata().type('b/SET').atomName('b').groupId(groupId).build());
const result = grouper.endGroup(groupId);
// result.type === "Batch (2 updates)", result.count === 2, result.metadata.atomNames
```

## Конфигурация

### Параметры конфигурации

```typescript
interface DevToolsConfig {
  // Базовые параметры
  name?: string;
  trace?: boolean;
  traceLimit?: number;  // Глубина стек-трейса (по умолчанию 10)
  latency?: number;
  maxAge?: number;

  // Именование и метаданные
  actionNamingStrategy?: ActionNamingStrategyType | ActionNamingStrategy;
  showAtomNames?: boolean;
  atomNameFormatter?: (atom: BasicAtom, defaultName: string) => string;

  // Группировка действий (DEV-003-C)
  actionGroupOptions?: {
    flushAfterMs?: number;   // Таймаут авто-сброса группы (по умолчанию 100)
    maxGroupSize?: number;   // Макс. размер группы до авто-сброса (по умолчанию 50)
    onFlush?: (result: ActionGroupResult) => void;
  };
}
```

### Глобальная конфигурация

```typescript
import { 
  getDevToolsConfig, 
  updateDevToolsConfig, 
  resetDevToolsConfig 
} from '@nexus-state/devtools';

// Получить текущую конфигурацию
const config = getDevToolsConfig();

// Обновить конфигурацию
updateDevToolsConfig({
  trace: true,
  traceLimit: 15
});

// Сбросить к значениям по умолчанию
resetDevToolsConfig();
```

## Интеграция с DevTools браузера

Расширенные функции автоматически интегрируются с Redux DevTools Extension:

1. Имена действий отображаются в панели DevTools
2. Стек-трейсы доступны при включении соответствующей опции
3. Группировка действий улучшает навигацию по истории

## Тестирование

### Unit тесты

```typescript
import { createActionMetadata, createActionGrouper } from '@nexus-state/devtools';

test('metadata builder and grouping', () => {
  const meta = createActionMetadata()
    .type('counter/INCREMENT')
    .atomName('counter')
    .build();
  expect(meta.type).toBe('counter/INCREMENT');
  expect(meta.atomName).toBe('counter');

  const grouper = createActionGrouper({ maxGroupSize: 10 });
  grouper.startGroup('g1');
  grouper.add(createActionMetadata().type('a/SET').atomName('a').groupId('g1').build());
  const result = grouper.endGroup('g1');
  expect(result?.count).toBe(1);
});
```

### Performance тесты

Производительность проверяется с помощью специализированных тестов:

- Накладные расходы < 1ms на действие
- Отсутствие кода стек-трейсов в production сборках
- Оптимизация для массовых операций

## Best Practices

1. Используйте стратегии именования для улучшения читаемости
2. Включайте захват стек-трейсов только в режиме разработки
3. Настройте глубину захвата в зависимости от сложности приложения
4. Используйте группировку для связанных действий
5. Не забывайте сбрасывать конфигурацию в production