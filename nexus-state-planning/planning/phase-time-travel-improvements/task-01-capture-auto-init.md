# Task 01: Авто-инициализация атомов в capture()

## Описание

Реализовать автоматическую инициализацию всех зарегистрированных атомов в `capture()` перед созданием snapshot, чтобы устранить необходимость явного вызова `store.get()` или `store.set()` перед первым `capture()`.

## Проблема

```typescript
const testAtom = atom('initial', 'testAtom');
const controller = new TimeTravelController(store);

controller.capture('init');  // ← Возвращает {} (пусто!)

// Текущий workaround:
store.set(testAtom, 'initial');
controller.capture('init');  // ← Теперь работает: { testAtom: 'initial' }
```

## Решение

Модифицировать метод `capture()` в `TimeTravelController` для автоматической инициализации всех атомов из `atomRegistry`.

### Изменения в коде

**Файл:** `packages/time-travel/src/TimeTravelController.ts`

```typescript
capture(action?: string): void {
  // 1. Авто-инициализация всех атомов из registry
  const allAtoms = atomRegistry.getAll();
  for (const atom of allAtoms.values()) {
    // Вызовет getOrCreateState с initialValue из atom.read()
    // Это безопасно для primitive атомов
    try {
      this.store.get(atom as any);
    } catch (error) {
      // Игнорируем ошибки для computed атомов с отсутствующими зависимостями
      console.warn(
        `[TimeTravelController] Failed to initialize atom during capture:`,
        error
      );
    }
  }

  // 2. Теперь снимаем состояние (все атомы инициализированы)
  const state = this.store.getState();
  
  // ... остальная логика capture
}
```

## Альтернативный подход (опциональный)

Добавить флаг для контроля поведения:

```typescript
interface TimeTravelOptions {
  maxHistory?: number;
  autoInitializeAtoms?: boolean;  // ← Новая опция (default: true)
}

capture(action?: string): void {
  if (this.options.autoInitializeAtoms !== false) {
    // Авто-инициализация
    const allAtoms = atomRegistry.getAll();
    for (const atom of allAtoms.values()) {
      try {
        this.store.get(atom as any);
      } catch (error) {
        // Игнорируем ошибки
      }
    }
  }
  
  const state = this.store.getState();
  // ...
}
```

## Тесты

### 1. Базовый тест авто-инициализации

```typescript
it('should auto-initialize atoms on first capture', () => {
  const testAtom = atom('initial', 'testAtom');
  const controller = new TimeTravelController(store);
  
  // Не вызываем store.set() или store.get()
  controller.capture('init');
  
  const snapshot = controller.getSnapshots()[0];
  expect(snapshot.state).toEqual({ testAtom: 'initial' });
});
```

### 2. Тест с множественными атомами

```typescript
it('should auto-initialize multiple atoms', () => {
  const atom1 = atom('value1', 'atom1');
  const atom2 = atom(42, 'atom2');
  const atom3 = atom(true, 'atom3');
  const controller = new TimeTravelController(store);
  
  controller.capture('init');
  
  const snapshot = controller.getSnapshots()[0];
  expect(snapshot.state).toEqual({
    atom1: 'value1',
    atom2: 42,
    atom3: true
  });
});
```

### 3. Тест с computed атомами

```typescript
it('should handle computed atoms gracefully', () => {
  const baseAtom = atom(10, 'base');
  const computedAtom = atom((get) => get(baseAtom) * 2, 'computed');
  const controller = new TimeTravelController(store);
  
  controller.capture('init');
  
  const snapshot = controller.getSnapshots()[0];
  expect(snapshot.state).toEqual({
    base: 10,
    computed: 20  // ← Computed атом тоже инициализирован
  });
});
```

### 4. Тест с ошибками инициализации

```typescript
it('should continue capture even if some atoms fail to initialize', () => {
  const goodAtom = atom('good', 'goodAtom');
  const badAtom = atom((get) => {
    throw new Error('Initialization error');
  }, 'badAtom');
  const controller = new TimeTravelController(store);
  
  // Не должно бросать ошибку
  expect(() => controller.capture('init')).not.toThrow();
  
  const snapshot = controller.getSnapshots()[0];
  expect(snapshot.state).toEqual({
    goodAtom: 'good'
    // badAtom отсутствует (не смог инициализироваться)
  });
});
```

### 5. Тест обратной совместимости

```typescript
it('should work with explicitly initialized atoms', () => {
  const testAtom = atom('initial', 'testAtom');
  const controller = new TimeTravelController(store);
  
  // Явная инициализация (старый способ)
  store.set(testAtom, 'changed');
  
  controller.capture('init');
  
  const snapshot = controller.getSnapshots()[0];
  expect(snapshot.state).toEqual({
    testAtom: 'changed'  // ← Использует значение из store, не initialValue
  });
});
```

## Критерии приёмки

- ✅ `capture()` инициализирует все атомы из `atomRegistry` перед snapshot
- ✅ Primitive атомы инициализируются с `initialValue`
- ✅ Computed атомы вычисляются при инициализации
- ✅ Ошибки инициализации не прерывают `capture()`
- ✅ Явно инициализированные атомы используют значение из store
- ✅ Все существующие тесты проходят
- ✅ Новые тесты покрывают изменения

## Риски и митигация

### Риск 1: Performance
**Проблема:** Инициализация всех атомов может быть медленной для больших приложений.

**Митигация:**
- Добавить опцию `autoInitializeAtoms` для отключения (если нужно)
- Документировать рекомендации по оптимизации
- Рассмотреть lazy initialization для computed атомов

### Риск 2: Неожиданные side-effects
**Проблема:** Computed атомы могут иметь side-effects при вычислении.

**Митигация:**
- Документировать, что `capture()` может вызвать вычисления
- Рекомендовать pure computed атомы
- Обернуть инициализацию в try-catch

### Риск 3: Circular dependencies
**Проблема:** Computed атомы с циклическими зависимостями могут вызвать бесконечный цикл.

**Митигация:**
- Store уже должен обрабатывать циклические зависимости
- Добавить timeout для инициализации (если нужно)
- Логировать предупреждения

## Связанные задачи

- `task-02-duplicate-warning.md` - Warning при дубликатах имён
- `task-03-documentation.md` - Документация нового поведения
- `task-04-tests.md` - Интеграционные тесты
