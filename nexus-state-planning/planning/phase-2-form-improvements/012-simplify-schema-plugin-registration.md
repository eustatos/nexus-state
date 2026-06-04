# TASK-012: Упростить регистрацию плагинов схем

**Статус:** Pending  
**Приоритет:** Высокий  
**Сложность:** Средняя  
**Оценка времени:** 6-8 часов

---

## 📋 Описание

Устранить проблемы с регистрацией плагинов схем валидации, убрав авто-регистрацию и добавив явную передачу плагинов в `createForm`.

### Проблема

Текущий подход с авто-регистрацией плагинов вызывает проблемы:

1. **Дублирование регистрации**
```typescript
// Плагин регистрируется дважды:
// 1. Авто-регистрация при импорте
import "@nexus-state/form-schema-zod";

// 2. Ручная регистрация в приложении
defaultSchemaRegistry.register("zod", zodPlugin);
```

2. **Неявные зависимости**
```typescript
// Непонятно, почему форма не работает
const form = createForm(store, {
  schemaType: "zod", // ❌ Плагин не зарегистрирован!
  schemaConfig: schema,
});
```

3. **Проблемы с tree-shaking**
```typescript
// Авто-регистрация мешает dead code elimination
import "@nexus-state/form-schema-zod"; // Side effect
```

4. **Сложности с тестированием**
```typescript
// Каждый тест должен регистрировать/очищать registry
beforeEach(() => {
  defaultSchemaRegistry.register('zod', zodPlugin);
});
afterEach(() => {
  defaultSchemaRegistry.clear();
});
```

5. **SSR-проблемы**
```typescript
// Авто-регистрация не работает на сервере
if (typeof globalThis !== 'undefined') {
  // ❌ В Node.js может не сработать
}
```

### Решение

1. **Добавить параметр `schemaPlugin`** в `createForm` для явной передачи плагина
2. **Удалить авто-регистрацию** из всех плагинов
3. **Сохранить обратную совместимость** с `schemaType` + `schemaConfig`

---

## 🎯 Критерии приемки

### Обязательные

- [ ] Добавлен параметр `schemaPlugin` в `FormOptions<TValues>`
- [ ] `createForm` поддерживает передачу плагина напрямую
- [ ] Удалена авто-регистрация из `@nexus-state/form-schema-zod`
- [ ] Удалена авто-регистрация из `@nexus-state/form-schema-yup`
- [ ] Удалена авто-регистрация из `@nexus-state/form-schema-ajv`
- [ ] Удалена авто-регистрация из `@nexus-state/form-schema-dsl`
- [ ] Сохранена обратная совместимость с `schemaType` + `schemaConfig`
- [ ] Написаны тесты для нового API
- [ ] Обновлена документация

### Дополнительные

- [ ] Добавлен тип `SchemaPluginWithMeta` для экспорта
- [ ] Добавлены примеры использования в README
- [ ] Добавлен migration guide

---

## 📐 Технические требования

### 1. Обновить типы

**Файл: `packages/form/src/types.ts`**

```typescript
export interface FormOptions<TValues extends FormValues = FormValues> {
  initialValues?: TValues;
  validate?: FormValidator<TValues>;

  // Существующие параметры (обратная совместимость)
  /** @deprecated Используйте schemaPlugin или schemaType + schemaConfig */
  schema?: SchemaValidator<TValues>;

  /** @deprecated Используйте schemaPlugin для явной передачи */
  schemaType?: string;

  /** @deprecated Используйте schemaPlugin для явной передачи */
  schemaConfig?: unknown;

  // ✅ Новый параметр
  /**
   * Schema plugin for validation
   * 
   * @example
   * ```typescript
   * import { zodPlugin } from '@nexus-state/form-schema-zod';
   * 
   * const form = createForm(store, {
   *   schemaPlugin: zodPlugin,
   *   schemaConfig: z.object({ name: z.string() }),
   * });
   * ```
   */
  schemaPlugin?: SchemaPlugin<unknown, TValues>;

  onSubmit?: (values: TValues) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  defaultValidationMode?: ValidationMode;
  defaultRevalidateMode?: ReValidateMode;
  showErrorsOnTouched?: boolean;
  store?: Store;
}
```

---

### 2. Обновить `createForm`

**Файл: `packages/form/src/create-form.ts`**

```typescript
export function createForm<TValues extends FormValues>(
  store: Store,
  options: FormOptions<TValues>
): Form<TValues> {
  // Validation options
  const validationOptions: ValidationOptions<TValues> = {
    schema: options.schema,
    schemaType: options.schemaType,
    schemaConfig: options.schemaConfig,
    schemaPlugin: options.schemaPlugin, // ✅ Новый параметр
    validate: options.validate,
    validateOnChange: options.validateOnChange,
    validateOnBlur: options.validateOnBlur,
  };

  const validation = createValidation(core, validationOptions);
  // ...
}
```

---

### 3. Обновить `createValidation`

**Файл: `packages/form/src/validation.ts`**

```typescript
export interface ValidationOptions<TValues extends FormValues> {
  schema?: SchemaValidator<TValues>;
  schemaType?: string;
  schemaConfig?: unknown;
  schemaPlugin?: SchemaPlugin<unknown, TValues>; // ✅ Новый параметр
  validate?: FormValidator<TValues>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function createValidation<TValues extends FormValues>(
  core: FormCore<TValues>,
  options: ValidationOptions<TValues>
): ValidationAPI<TValues> {
  let schema: SchemaValidator<TValues> | undefined;

  // ✅ Приоритет: schemaPlugin > schemaType+schemaConfig > schema
  if (options.schemaPlugin && options.schemaConfig) {
    // Создаём валидатор из переданного плагина
    schema = options.schemaPlugin.create(options.schemaConfig);
  } else if (options.schemaType && options.schemaConfig) {
    // Используем registry (обратная совместимость)
    const registry = defaultSchemaRegistry;
    const plugin = registry.get(options.schemaType);
    if (plugin) {
      schema = plugin.create(options.schemaConfig);
    }
  } else if (options.schema) {
    // Прямая передача валидатора
    schema = options.schema;
  }

  // ... остальная логика
}
```

---

### 4. Удалить авто-регистрацию из плагинов

**Файл: `packages/form-schema-zod/src/index.ts`**

```typescript
// ❌ УДАЛИТЬ этот блок:
/*
if (typeof globalThis !== 'undefined') {
  try {
    import('@nexus-state/form/schema').then(({ defaultSchemaRegistry }) => {
      defaultSchemaRegistry.register('zod', zodPlugin);
    });
  } catch {
    // Ignore if registry is unavailable (e.g., in SSR)
  }
}
*/

export default zodPlugin;
```

**Повторить для:**
- `packages/form-schema-yup/src/index.ts`
- `packages/form-schema-ajv/src/index.ts`
- `packages/form-schema-dsl/src/index.ts`

---

## 📝 Примеры использования

### Новый способ (рекомендуемый)

```typescript
import { createForm } from '@nexus-state/form';
import { zodPlugin } from '@nexus-state/form-schema-zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const form = createForm(store, {
  schemaPlugin: zodPlugin, // ✅ Явная передача
  schemaConfig: schema,
  initialValues: {
    email: '',
    password: '',
  },
});
```

### Обратная совместимость

```typescript
import { createForm } from '@nexus-state/form';
import { zodPlugin } from '@nexus-state/form-schema-zod';
import { defaultSchemaRegistry } from '@nexus-state/form/schema';
import { z } from 'zod';

// ✅ Регистрация в главном файле приложения
defaultSchemaRegistry.register('zod', zodPlugin);

const form = createForm(store, {
  schemaType: 'zod', // ✅ Работает как раньше
  schemaConfig: z.object({ name: z.string() }),
  initialValues: { name: '' },
});
```

### Тестирование

```typescript
import { createTestForm } from '@nexus-state/form/testing';
import { zodPlugin } from '@nexus-state/form-schema-zod';
import { z } from 'zod';

// ✅ Без глобального состояния
const form = createTestFormWithValidation({
  schemaPlugin: zodPlugin,
  schemaConfig: z.object({ email: z.string().email() }),
  initialValues: { email: '' },
});

form.setFieldValue('email', 'invalid');
await form.validate();

expect(form.errors.email).toBeDefined();
```

---

## 🔗 Зависимости

### Блокирует
- TASK-013: Обновление документации по валидации

### Зависит от
- ✅ `SchemaPlugin` тип — существует
- ✅ `defaultSchemaRegistry` — существует
- ✅ `createForm` API — существует

---

## 📚 План миграции

### Этап 1: Реализация (4-6 часов)

1. Обновить `types.ts` — добавить `schemaPlugin`
2. Обновить `create-form.ts` — поддержка нового параметра
3. Обновить `validation.ts` — логика с приоритетом
4. Удалить авто-регистрацию из плагинов
5. Написать тесты

### Этап 2: Документация (2-3 часа)

1. Обновить README.md с новыми примерами
2. Добавить migration guide
3. Обновить примеры в пакетах схем

### Этап 3: Публикация

1. Обновить CHANGELOG.md
2. Пометить `schemaType` + `schemaConfig` как deprecated
3. Опубликовать минорную версию (backward compatible)

---

## 🎯 Метрики успеха

- [ ] Все существующие тесты проходят
- [ ] Новые тесты для `schemaPlugin` покрыты ≥ 90%
- [ ] Документация обновлена
- [ ] Migration guide написан
- [ ] Предупреждения о дублировании регистрации устранены
- [ ] Tree-shaking работает корректно (проверить bundle size)

---

## 📝 Заметки

### Breaking Changes

**Нет** — изменения backward compatible.

### Deprecation Warnings

Добавить предупреждения для `schemaType` + `schemaConfig`:

```typescript
if (options.schemaType && options.schemaConfig) {
  console.warn(
    'schemaType + schemaConfig are deprecated. ' +
    'Use schemaPlugin instead: ' +
    'import { zodPlugin } from "@nexus-state/form-schema-zod"; ' +
    'createForm(store, { schemaPlugin: zodPlugin, schemaConfig: schema })'
  );
}
```

### Bundle Size

Ожидаемое улучшение:
- Удаление авто-регистрации: -50-100 байт на плагин
- Лучший tree-shaking: -200-500 байт в production

### SSR

После изменений:
- ✅ Нет side effects при импорте
- ✅ Явная регистрация работает в Node.js
- ✅ Можно регистрировать плагины в entry point

---

## 📋 Чеклист реализации

- [ ] `types.ts` — добавлен `schemaPlugin`
- [ ] `create-form.ts` — поддержка параметра
- [ ] `validation.ts` — логика приоритетов
- [ ] `form-schema-zod` — удалена авто-регистрация
- [ ] `form-schema-yup` — удалена авто-регистрация
- [ ] `form-schema-ajv` — удалена авто-регистрация
- [ ] `form-schema-dsl` — удалена авто-регистрация
- [ ] Тесты для нового API
- [ ] Тесты обратной совместимости
- [ ] Обновлены примеры в README
- [ ] Добавлен migration guide
- [ ] Сборка без ошибок
- [ ] Все тесты проходят
