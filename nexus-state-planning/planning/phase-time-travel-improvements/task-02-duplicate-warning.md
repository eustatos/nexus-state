# Task 02: Warning при дублировании имён атомов

## Описание

Добавить предупреждение в консоль при регистрации атома с именем, которое уже используется другим атомом в `atomRegistry`.

## Проблема

```typescript
const atom1 = atom('value1', 'myAtom');
const atom2 = atom('value2', 'myAtom');  // ← То же имя!

atomRegistry.getByName('myAtom');  // ← Вернёт atom1 (первый найденный)
// atom2 существует, но getByName() его не вернёт
```

**Последствия:**
- DevTools может показывать неправильный атом
- Time-travel может работать с неожиданным атомом
- Отладка усложняется

## Решение

Добавить проверку дубликатов в метод `register()` класса `AtomRegistry`.

### Изменения в коде

**Файл:** `packages/core/src/atom-registry.ts`

```typescript
register(atom: { id: symbol; type?: AtomType; read?: unknown; write?: unknown }, name?: string): void {
  const id = atom.id;

  // Handle duplicate registrations gracefully
  if (this.registry.has(id)) {
    // Atom already registered, update metadata if name provided
    if (name) {
      const existingMetadata = this.metadata.get(id);
      if (existingMetadata) {
        this.metadata.set(id, {
          ...existingMetadata,
          name
        });
      }
    }
    return;
  }

  // Generate fallback name if not provided
  const displayName = name || `atom-${++this.counter}`;

  // ← НОВЫЙ КОД: Проверка дубликатов имён
  if (name && this.getByName(name)) {
    console.warn(
      `[nexus-state] Atom with name "${name}" already exists. ` +
      `Using duplicate names may cause issues with DevTools and time-travel. ` +
      `Consider using unique names for all atoms.`
    );
  }

  // Determine atom type - use type property if available, otherwise infer from methods
  let type: AtomType;
  if (atom.type) {
    type = atom.type;
  } else if (atom.read) {
    type = atom.write ? 'writable' : 'computed';
  } else {
    type = 'primitive';
  }

  // Store atom and metadata
  this.registry.set(id, atom);
  this.metadata.set(id, {
    name: displayName,
    createdAt: Date.now(),
    type
  });
}
```

## Альтернативные подходы

### Вариант 1: Строгий режим (throw error)

```typescript
if (name && this.getByName(name)) {
  throw new Error(
    `[nexus-state] Atom with name "${name}" already exists. ` +
    `Atom names must be unique.`
  );
}
```

**Плюсы:** Гарантирует уникальность имён  
**Минусы:** Breaking change, может сломать существующий код

### Вариант 2: Авто-переименование

```typescript
if (name && this.getByName(name)) {
  let suffix = 1;
  let uniqueName = `${name}-${suffix}`;
  while (this.getByName(uniqueName)) {
    suffix++;
    uniqueName = `${name}-${suffix}`;
  }
  console.warn(
    `[nexus-state] Atom name "${name}" already exists. ` +
    `Renamed to "${uniqueName}".`
  );
  displayName = uniqueName;
}
```

**Плюсы:** Автоматически решает проблему  
**Минусы:** Может быть неожиданным для разработчика

### Вариант 3: Опциональная строгость

```typescript
interface AtomRegistryOptions {
  strictNames?: boolean;  // default: false
}

// В register():
if (name && this.getByName(name)) {
  if (this.options.strictNames) {
    throw new Error(`Duplicate atom name: "${name}"`);
  } else {
    console.warn(`Duplicate atom name: "${name}"`);
  }
}
```

**Рекомендация:** Начать с **простого warning** (основной вариант), затем рассмотреть опциональную строгость в будущем.

## Тесты

### 1. Базовый тест warning

```typescript
it('should warn when registering atom with duplicate name', () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
  
  const atom1 = atom('value1', 'duplicateName');
  const atom2 = atom('value2', 'duplicateName');
  
  expect(consoleWarnSpy).toHaveBeenCalledWith(
    expect.stringContaining('Atom with name "duplicateName" already exists')
  );
  
  consoleWarnSpy.mockRestore();
});
```

### 2. Тест без warning для уникальных имён

```typescript
it('should not warn when registering atoms with unique names', () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
  
  const atom1 = atom('value1', 'uniqueName1');
  const atom2 = atom('value2', 'uniqueName2');
  
  expect(consoleWarnSpy).not.toHaveBeenCalled();
  
  consoleWarnSpy.mockRestore();
});
```

### 3. Тест без warning для атомов без имени

```typescript
it('should not warn for atoms without explicit names', () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
  
  const atom1 = atom('value1');  // auto-generated name
  const atom2 = atom('value2');  // auto-generated name
  
  expect(consoleWarnSpy).not.toHaveBeenCalled();
  
  consoleWarnSpy.mockRestore();
});
```

### 4. Тест getByName() с дубликатами

```typescript
it('should return first atom when multiple atoms have same name', () => {
  const atom1 = atom('value1', 'shared');
  const atom2 = atom('value2', 'shared');
  
  const found = atomRegistry.getByName('shared');
  
  // Должен вернуть первый зарегистрированный
  expect(found).toBe(atom1);
  expect(found).not.toBe(atom2);
});
```

### 5. Интеграционный тест с time-travel

```typescript
it('should work correctly with time-travel despite duplicate names', () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
  
  const atom1 = atom('initial1', 'shared');
  const atom2 = atom('initial2', 'shared');
  
  const store = createStore();
  const controller = new TimeTravelController(store);
  
  store.set(atom1, 'changed1');
  store.set(atom2, 'changed2');
  
  controller.capture('snapshot');
  
  const snapshot = controller.getSnapshots()[0];
  
  // Оба атома должны быть в snapshot (по id, не по имени)
  expect(Object.keys(snapshot.state).length).toBe(2);
  
  consoleWarnSpy.mockRestore();
});
```

## Критерии приёмки

- ✅ Warning выводится при регистрации атома с дублирующимся именем
- ✅ Warning не выводится для уникальных имён
- ✅ Warning не выводится для атомов без явного имени
- ✅ `getByName()` продолжает работать (возвращает первый найденный)
- ✅ Функциональность не нарушена (backward compatible)
- ✅ Все существующие тесты проходят
- ✅ Новые тесты покрывают изменения

## Документация

Добавить в README секцию "Best Practices":

```markdown
### Atom Naming Best Practices

**Use unique names for all atoms:**
```typescript
// ✅ Good
const userAtom = atom(null, 'user');
const settingsAtom = atom({}, 'settings');

// ❌ Bad - duplicate names
const atom1 = atom('value1', 'data');
const atom2 = atom('value2', 'data');  // ← Warning!
```

**Why unique names matter:**
- DevTools relies on names to display atoms
- Time-travel uses names for snapshot serialization
- Debugging is easier with descriptive, unique names

**Note:** If you see a warning about duplicate atom names, consider:
1. Using more specific names (e.g., `userData`, `settingsData`)
2. Adding prefixes/namespaces (e.g., `auth/user`, `ui/theme`)
3. Reviewing your atom organization
```

## Связанные задачи

- `task-01-capture-auto-init.md` - Авто-инициализация в capture()
- `task-03-documentation.md` - Обновление документации
- `task-04-tests.md` - Интеграционные тесты
