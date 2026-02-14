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

### Метаданные действий

Каждое действие содержит метаданные для улучшенной отладки:

```typescript
interface ActionMetadata {
  atomName: string;
  atomType: string;
  updateType: 'direct' | 'computed';
  customName?: string;
  timestamp: number;
}
```

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

## Создание действий

### Базовое создание действий

```typescript
import { createAction } from '@nexus-state/devtools';

const action = createAction('INCREMENT_COUNTER', 1);
```

### Группировка действий

```typescript
import { createAction, createActionGroup } from '@nexus-state/devtools';

const actions = [
  createAction('SET_LOADING', true),
  createAction('FETCH_DATA'),
  createAction('SET_LOADING', false)
];

const group = createActionGroup(actions, 'DATA_FETCHING');
```

## Конфигурация

### Параметры конфигурации

```typescript
interface DevToolsConfig {
  // Базовые параметры
  name?: string;
  trace?: boolean;
  latency?: number;
  maxAge?: number;
  
  // Расширенные параметры
  trace?: boolean;    // Включить захват стек-трейсов (только в development)
  traceLimit?: number;  // Максимальное количество фреймов (по умолчанию 10)
  actionNaming?: ActionNamingStrategy; // Стратегия именования
  enableGrouping?: boolean;     // Включить группировку действий
  maxGroupSize?: number;         // Максимальный размер группы
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
import { defaultActionNaming, createActionMetadata } from '@nexus-state/devtools';

test('default action naming', () => {
  const metadata = createActionMetadata('counter', 'atom', 'direct');
  const name = defaultActionNaming('counter', metadata);
  expect(name).toBe('ATOM_UPDATE/counter');
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