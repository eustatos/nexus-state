# TASK-002: SDK — Реестр плагинов

## 📋 Описание

Реализация реестра для регистрации, хранения и управления плагинами схем валидации. Реестр позволяет динамически подключать плагины и создавать валидаторы из схем.

## 🎯 Цель

Создать центральный механизм для:
- Регистрации плагинов по типу (zod, yup, ajv, dsl)
- Проверки доступности плагинов
- Создания экземпляров валидаторов из схем
- Управления жизненным циклом плагинов

## 📦 Требования к реализации

### Файлы для создания

```
packages/form/src/schema/
├── registry.ts           # Реестр плагинов
├── __tests__/
│   └── registry.test.ts  # Тесты реестра
```

### Реализуемые интерфейсы

#### 1. Конфигурация реестра

```typescript
// packages/form/src/schema/registry.ts

import { SchemaPlugin, SchemaValidator, SchemaType } from './types';

/**
 * Конфигурация реестра
 */
export interface SchemaRegistryConfig {
  /** Автоматически регистрировать встроенные плагины */
  autoRegisterBuiltins?: boolean;
  /** Строгий режим (ошибка при регистрации дубликата) */
  strict?: boolean;
}
```

#### 2. Класс SchemaRegistry

```typescript
/**
 * Реестр схем валидации
 * 
 * @example
 * ```typescript
 * const registry = new SchemaRegistry();
 * registry.register('zod', zodPlugin);
 * 
 * const validator = registry.create('zod', myZodSchema);
 * const errors = await validator.validate(values);
 * ```
 */
export class SchemaRegistry {
  private plugins = new Map<SchemaType, SchemaPlugin<any, any>>();
  private readonly config: Required<SchemaRegistryConfig>;

  constructor(config: SchemaRegistryConfig = {}) {
    this.config = {
      autoRegisterBuiltins: true,
      strict: false,
      ...config,
    };

    if (this.config.autoRegisterBuiltins) {
      this.registerBuiltins();
    }
  }

  /**
   * Зарегистрировать плагин
   * @param type - Тип схемы (уникальный ключ)
   * @param plugin - Плагин для регистрации
   * @throws Error если плагин уже зарегистрирован (в strict режиме)
   */
  register<TSchema, TValues extends Record<string, any>>(
    type: SchemaType,
    plugin: SchemaPlugin<TSchema, TValues>
  ): void {
    if (this.plugins.has(type)) {
      if (this.config.strict) {
        throw new Error(`Schema plugin "${type}" is already registered`);
      }
      console.warn(`Schema plugin "${type}" is already registered. Overwriting.`);
    }
    this.plugins.set(type, plugin as SchemaPlugin<any, any>);
  }

  /**
   * Получить плагин по типу
   * @param type - Тип схемы
   * @returns Плагин или null если не найден
   */
  get<TSchema, TValues extends Record<string, any>>(
    type: SchemaType
  ): SchemaPlugin<TSchema, TValues> | null {
    return (this.plugins.get(type) as SchemaPlugin<TSchema, TValues>) ?? null;
  }

  /**
   * Проверить наличие плагина
   * @param type - Тип схемы
   * @returns true если плагин зарегистрирован
   */
  has(type: SchemaType): boolean {
    return this.plugins.has(type);
  }

  /**
   * Создать валидатор из схемы
   * @param type - Тип схемы
   * @param schema - Исходная схема
   * @returns Валидатор или null если плагин не найден
   */
  create<TSchema, TValues extends Record<string, any>>(
    type: SchemaType,
    schema: TSchema
  ): SchemaValidator<TValues> | null {
    const plugin = this.get(type);
    if (!plugin) {
      return null;
    }
    return plugin.create(schema);
  }

  /**
   * Получить все зарегистрированные типы
   * @returns Массив типов схем
   */
  getRegisteredTypes(): SchemaType[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Очистить реестр
   */
  clear(): void {
    // Вызвать dispose для всех плагинов
    for (const plugin of this.plugins.values()) {
      // Если у плагина есть dispose
    }
    this.plugins.clear();
  }

  /**
   * Зарегистрировать встроенные плагины
   * Переопределяется для кастомных наборов плагинов
   */
  protected registerBuiltins(): void {
    // Встроенные плагины регистрируются отдельно
  }

  /**
   * Получить статистику реестра
   */
  getStats(): {
    pluginCount: number;
    types: SchemaType[];
  } {
    return {
      pluginCount: this.plugins.size,
      types: this.getRegisteredTypes(),
    };
  }
}

/**
 * Глобальный реестр по умолчанию
 * 
 * @example
 * ```typescript
 * import { defaultSchemaRegistry } from '@nexus-state/form/schema';
 * 
 * const validator = defaultSchemaRegistry.create('zod', mySchema);
 * ```
 */
export const defaultSchemaRegistry = new SchemaRegistry();
```

## 🧪 Тестирование

### Требования
- **Coverage**: > 90% (branches > 85%)
- **Фреймворк**: Vitest
- **Mocking**: изолировать внешние зависимости

### Файлы тестов

```
packages/form/src/schema/__tests__/
└── registry.test.ts
```

### Сценарии для тестирования

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SchemaRegistry, defaultSchemaRegistry } from '../registry';
import type { SchemaPlugin, SchemaValidator } from '../types';

describe('SchemaRegistry', () => {
  let registry: SchemaRegistry;

  beforeEach(() => {
    registry = new SchemaRegistry({ autoRegisterBuiltins: false });
  });

  describe('register()', () => {
    it('should register a plugin successfully', () => {
      const mockPlugin: SchemaPlugin = {
        type: 'mock',
        create: (schema) => ({ validate: () => ({ fieldErrors: {} }) })
      };

      expect(() => registry.register('mock', mockPlugin)).not.toThrow();
      expect(registry.has('mock')).toBe(true);
    });

    it('should throw in strict mode when duplicate registration', () => {
      const strictRegistry = new SchemaRegistry({ strict: true });
      const mockPlugin: SchemaPlugin = { type: 'mock', create: () => ({}) };

      strictRegistry.register('mock', mockPlugin);
      expect(() => strictRegistry.register('mock', mockPlugin))
        .toThrow('already registered');
    });

    it('should warn in non-strict mode when duplicate registration', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockPlugin: SchemaPlugin = { type: 'mock', create: () => ({}) };

      registry.register('mock', mockPlugin);
      registry.register('mock', mockPlugin);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already registered')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('get()', () => {
    it('should return plugin by type', () => {
      const mockPlugin: SchemaPlugin = {
        type: 'mock',
        create: (schema) => ({ validate: () => ({ fieldErrors: {} }) })
      };

      registry.register('mock', mockPlugin);
      const retrieved = registry.get('mock');

      expect(retrieved).toBe(mockPlugin);
    });

    it('should return null for unknown type', () => {
      const result = registry.get('unknown');
      expect(result).toBeNull();
    });
  });

  describe('has()', () => {
    it('should return true for registered plugin', () => {
      registry.register('mock', { type: 'mock', create: () => ({}) });
      expect(registry.has('mock')).toBe(true);
    });

    it('should return false for unknown plugin', () => {
      expect(registry.has('unknown')).toBe(false);
    });
  });

  describe('create()', () => {
    it('should create validator from schema', () => {
      const mockValidator: SchemaValidator = {
        validate: () => ({ fieldErrors: {} })
      };
      const mockPlugin: SchemaPlugin = {
        type: 'mock',
        create: (schema) => mockValidator
      };

      registry.register('mock', mockPlugin);
      const validator = registry.create('mock', { some: 'schema' });

      expect(validator).toBe(mockValidator);
    });

    it('should return null for unknown type', () => {
      const result = registry.create('unknown', {});
      expect(result).toBeNull();
    });
  });

  describe('getRegisteredTypes()', () => {
    it('should return array of registered types', () => {
      registry.register('zod', { type: 'zod', create: () => ({}) });
      registry.register('yup', { type: 'yup', create: () => ({}) });

      const types = registry.getRegisteredTypes();
      expect(types).toEqual(['zod', 'yup']);
    });

    it('should return empty array when no plugins', () => {
      expect(registry.getRegisteredTypes()).toEqual([]);
    });
  });

  describe('clear()', () => {
    it('should remove all plugins', () => {
      registry.register('mock', { type: 'mock', create: () => ({}) });
      registry.clear();
      expect(registry.has('mock')).toBe(false);
    });
  });

  describe('getStats()', () => {
    it('should return correct statistics', () => {
      registry.register('zod', { type: 'zod', create: () => ({}) });
      registry.register('yup', { type: 'yup', create: () => ({}) });

      const stats = registry.getStats();
      expect(stats).toEqual({
        pluginCount: 2,
        types: ['zod', 'yup']
      });
    });
  });
});

describe('defaultSchemaRegistry', () => {
  it('should be instance of SchemaRegistry', () => {
    expect(defaultSchemaRegistry).toBeInstanceOf(SchemaRegistry);
  });
});
```

## 📁 Зависимости

- [[TASK-001]](./TASK-001-sdk-types.md) — SDK: Типы и интерфейсы

## 🔗 Связанные задачи

- [[TASK-003]](./TASK-003-sdk-builder.md) — SDK: Builder (использует реестр)
- [[TASK-005]](./TASK-005-form-integration.md) — Интеграция с createForm (использует реестр)
- [[TASK-006]](./TASK-006-zod-plugin.md) — Плагин Zod (регистрируется в реестре)

## 📚 Ресурсы

- [TypeScript Handbook: Maps](https://www.typescriptlang.org/docs/handbook/2/objects.html#the-unknown-type)
- [MDN: Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [packages/form/src/schema/types.ts](../../../packages/form/src/schema/types.ts) — Типы из TASK-001

## ✅ Критерии приемки

- [ ] Файл `registry.ts` создан с классом SchemaRegistry
- [ ] Реализованы все методы (register, get, has, create, clear, getStats)
- [ ] Глобальный экземпляр `defaultSchemaRegistry` экспортирован
- [ ] TypeScript компилируется без ошибок (strict mode)
- [ ] Тесты покрывают > 90% кода
- [ ] TSDoc комментарии для всех публичных методов
- [ ] ESLint без ошибок
- [ ] Прогресс отмечен в [tasks/README.md](./README.md)

## 📝 Заметки

- Использовать Map для хранения плагинов (O(1) доступ)
- Поддержать strict mode для отлова дубликатов
- Предусмотреть хук для регистрации builtins
- Избегать мутаций после clear()

## 🔄 Прогресс

- [ ] Создание файла `registry.ts`
- [ ] Реализация конструктора и config
- [ ] Метод register() с strict mode
- [ ] Методы get(), has()
- [ ] Метод create() для создания валидаторов
- [ ] Методы getRegisteredTypes(), clear(), getStats()
- [ ] Глобальный экземпляр defaultSchemaRegistry
- [ ] Написание тестов
- [ ] Достижение coverage > 90%
- [ ] TSDoc документация
- [ ] Финальная проверка ESLint
