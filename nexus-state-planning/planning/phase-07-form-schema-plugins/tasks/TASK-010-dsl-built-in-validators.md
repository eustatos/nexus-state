# TASK-010: DSL валидаторы (sync)

## 📋 Описание

Реализация набора встроенных синхронных валидаторов для DSL плагина. Эти валидаторы покрывают 95% типовых сценариев валидации форм.

## 🎯 Цель

Предоставить разработчикам готовые валидаторы для распространённых случаев:
- Required (обязательное поле)
- Min/Max length (длина строки)
- Min/Max value (числовые диапазоны)
- Pattern/Regex (проверка по шаблону)
- Email, URL, Phone (форматы)
- Equal/NotEqual (сравнение)
- In/NotIn (вхождение в набор)
- Custom (кастомный валидатор)

## 📦 Требования к реализации

### Структура пакета

```
packages/form-schema-dsl/
├── src/
│   ├── __tests__/
│   │   └── validators.test.ts    # Тесты валидаторов
│   ├── index.ts                  # Публичный API
│   ├── types.ts                  # DSL типы (из TASK-009)
│   ├── validator.ts              # DSL ядро (из TASK-009)
│   └── validators.ts             # Встроенные валидаторы (НОВЫЙ)
├── package.json
└── tsconfig.json
```

### Встроенные валидаторы

```typescript
// packages/form-schema-dsl/src/validators.ts

import type { DSLRule } from './types';

/**
 * Обязательное поле
 *
 * @example
 * ```typescript
 * const schema: DSLSchema = {
 *   username: [required],
 * };
 * ```
 */
export const required: DSLRule = {
  validate: (value) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }
    if (Array.isArray(value) && value.length === 0) {
      return 'At least one item is required';
    }
    return null;
  },
  code: 'required',
};

/**
 * Минимальная длина строки
 *
 * @param min - Минимальная длина
 * @param message - Кастомное сообщение
 *
 * @example
 * ```typescript
 * const schema: DSLSchema = {
 *   password: [minLength(8)],
 * };
 * ```
 */
export function minLength(min: number, message?: string): DSLRule {
  return {
    validate: (value) => {
      if (typeof value !== 'string') {
        return null; // Не строка, пропускаем
      }
      if (value.length < min) {
        return message ?? `Minimum length is ${min} characters`;
      }
      return null;
    },
    code: 'min_length',
  };
}

/**
 * Максимальная длина строки
 *
 * @param max - Максимальная длина
 * @param message - Кастомное сообщение
 */
export function maxLength(max: number, message?: string): DSLRule {
  return {
    validate: (value) => {
      if (typeof value !== 'string') {
        return null;
      }
      if (value.length > max) {
        return message ?? `Maximum length is ${max} characters`;
      }
      return null;
    },
    code: 'max_length',
  };
}

/**
 * Длина строки в диапазоне
 *
 * @param min - Минимальная длина
 * @param max - Максимальная длина
 */
export function lengthRange(min: number, max: number, message?: string): DSLRule {
  return {
    validate: (value) => {
      if (typeof value !== 'string') {
        return null;
      }
      if (value.length < min || value.length > max) {
        return message ?? `Length must be between ${min} and ${max} characters`;
      }
      return null;
    },
    code: 'length_range',
  };
}

/**
 * Точная длина строки
 *
 * @param length - Требуемая длина
 */
export function length(length: number, message?: string): DSLRule {
  return {
    validate: (value) => {
      if (typeof value !== 'string') {
        return null;
      }
      if (value.length !== length) {
        return message ?? `Length must be exactly ${length} characters`;
      }
      return null;
    },
    code: 'length_exact',
  };
}

/**
 * Минимальное значение числа
 *
 * @param min - Минимальное значение
 * @param message - Кастомное сообщение
 */
export function minValue(min: number, message?: string): DSLRule {
  return {
    validate: (value) => {
      if (typeof value !== 'number' || isNaN(value)) {
        return null;
      }
      if (value < min) {
        return message ?? `Minimum value is ${min}`;
      }
      return null;
    },
    code: 'min_value',
  };
}

/**
 * Максимальное значение числа
 *
 * @param max - Максимальное значение
 * @param message - Кастомное сообщение
 */
export function maxValue(max: number, message?: string): DSLRule {
  return {
    validate: (value) => {
      if (typeof value !== 'number' || isNaN(value)) {
        return null;
      }
      if (value > max) {
        return message ?? `Maximum value is ${max}`;
      }
      return null;
    },
    code: 'max_value',
  };
}

/**
 * Число в диапазоне
 *
 * @param min - Минимальное значение
 * @param max - Максимальное значение
 */
export function valueRange(min: number, max: number, message?: string): DSLRule {
  return {
    validate: (value) => {
      if (typeof value !== 'number' || isNaN(value)) {
        return null;
      }
      if (value < min || value > max) {
        return message ?? `Value must be between ${min} and ${max}`;
      }
      return null;
    },
    code: 'value_range',
  };
}

/**
 * Проверка по регулярному выражению
 *
 * @param pattern - Регулярное выражение
 * @param message - Кастомное сообщение
 */
export function pattern(pattern: RegExp, message?: string): DSLRule {
  return {
    validate: (value) => {
      if (typeof value !== 'string') {
        return null;
      }
      if (!pattern.test(value)) {
        return message ?? `Does not match required pattern`;
      }
      return null;
    },
    code: 'pattern',
  };
}

/**
 * Валидация email
 *
 * @param message - Кастомное сообщение
 */
export function email(message?: string): DSLRule {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    validate: (value) => {
      if (typeof value !== 'string') {
        return null;
      }
      if (!emailRegex.test(value)) {
        return message ?? 'Invalid email address';
      }
      return null;
    },
    code: 'email',
  };
}

/**
 * Валидация URL
 *
 * @param message - Кастомное сообщение
 */
export function url(message?: string): DSLRule {
  const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
  return {
    validate: (value) => {
      if (typeof value !== 'string') {
        return null;
      }
      if (!urlRegex.test(value)) {
        return message ?? 'Invalid URL';
      }
      return null;
    },
    code: 'url',
  };
}

/**
 * Валидация телефона (базовая)
 *
 * @param message - Кастомное сообщение
 */
export function phone(message?: string): DSLRule {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return {
    validate: (value) => {
      if (typeof value !== 'string') {
        return null;
      }
      const cleaned = value.replace(/[\s-()]/g, '');
      if (!phoneRegex.test(cleaned) || cleaned.length < 10) {
        return message ?? 'Invalid phone number';
      }
      return null;
    },
    code: 'phone',
  };
}

/**
 * Валидация кредитной карты (Luhn algorithm)
 *
 * @param message - Кастомное сообщение
 */
export function creditCard(message?: string): DSLRule {
  const luhnCheck = (num: string): boolean => {
    let sum = 0;
    let isEven = false;

    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  return {
    validate: (value) => {
      if (typeof value !== 'string') {
        return null;
      }
      const cleaned = value.replace(/[\s-]/g, '');
      if (!/^\d+$/.test(cleaned) || cleaned.length < 13 || cleaned.length > 19) {
        return message ?? 'Invalid credit card number';
      }
      if (!luhnCheck(cleaned)) {
        return message ?? 'Invalid credit card number';
      }
      return null;
    },
    code: 'credit_card',
  };
}

/**
 * Равно указанному значению
 *
 * @param expected - Ожидаемое значение
 * @param message - Кастомное сообщение
 */
export function equalTo(expected: any, message?: string): DSLRule {
  return {
    validate: (value) => {
      if (value !== expected) {
        return message ?? `Value must be equal to ${expected}`;
      }
      return null;
    },
    code: 'equal',
  };
}

/**
 * Не равно указанному значению
 *
 * @param unexpected - Недопустимое значение
 * @param message - Кастомное сообщение
 */
export function notEqualTo(unexpected: any, message?: string): DSLRule {
  return {
    validate: (value) => {
      if (value === unexpected) {
        return message ?? `Value must not be equal to ${unexpected}`;
      }
      return null;
    },
    code: 'not_equal',
  };
}

/**
 * Значение в наборе
 *
 * @param values - Допустимые значения
 * @param message - Кастомное сообщение
 */
export function oneOf(values: any[], message?: string): DSLRule {
  return {
    validate: (value) => {
      if (!values.includes(value)) {
        return message ?? `Value must be one of: ${values.join(', ')}`;
      }
      return null;
    },
    code: 'one_of',
  };
}

/**
 * Значение не в наборе
 *
 * @param values - Недопустимые значения
 * @param message - Кастомное сообщение
 */
export function notOneOf(values: any[], message?: string): DSLRule {
  return {
    validate: (value) => {
      if (values.includes(value)) {
        return message ?? `Value must not be one of: ${values.join(', ')}`;
      }
      return null;
    },
    code: 'not_one_of',
  };
}

/**
 * Положительное число
 */
export function positive(message?: string): DSLRule {
  return {
    validate: (value) => {
      if (typeof value !== 'number' || isNaN(value)) {
        return null;
      }
      if (value <= 0) {
        return message ?? 'Value must be positive';
      }
      return null;
    },
    code: 'positive',
  };
}

/**
 * Отрицательное число
 */
export function negative(message?: string): DSLRule {
  return {
    validate: (value) => {
      if (typeof value !== 'number' || isNaN(value)) {
        return null;
      }
      if (value >= 0) {
        return message ?? 'Value must be negative';
      }
      return null;
    },
    code: 'negative',
  };
}

/**
 * Целое число
 */
export function integer(message?: string): DSLRule {
  return {
    validate: (value) => {
      if (typeof value !== 'number' || isNaN(value)) {
        return null;
      }
      if (!Number.isInteger(value)) {
        return message ?? 'Value must be an integer';
      }
      return null;
    },
    code: 'integer',
  };
}

/**
 * Валидатор для массива
 *
 * @param min - Минимальное количество элементов
 * @param max - Максимальное количество элементов
 */
export function arrayLength(min?: number, max?: number, message?: string): DSLRule {
  return {
    validate: (value) => {
      if (!Array.isArray(value)) {
        return null;
      }
      if (min !== undefined && value.length < min) {
        return message ?? `Minimum ${min} items required`;
      }
      if (max !== undefined && value.length > max) {
        return message ?? `Maximum ${max} items allowed`;
      }
      return null;
    },
    code: 'array_length',
  };
}

/**
 * Кастомный валидатор
 *
 * @param fn - Функция валидации
 * @param message - Сообщение по умолчанию
 * @param code - Код ошибки
 */
export function custom<T = any>(
  fn: (value: T, allValues?: any) => string | null,
  message?: string,
  code?: string
): DSLRule<T> {
  return {
    validate: fn,
    message,
    code: code ?? 'custom',
  };
}

/**
 * Валидация нескольких полей (cross-field validation)
 *
 * @param fieldNames - Имена полей для сравнения
 * @param message - Сообщение об ошибке
 *
 * @example
 * ```typescript
 * const schema: DSLSchema = {
 *   passwordConfirm: [
 *     required,
 *     matchesField('password', 'Passwords do not match'),
 *   ],
 * };
 * ```
 */
export function matchesField(fieldName: string, message?: string): DSLRule {
  return {
    validate: (value, allValues) => {
      if (allValues && fieldName in allValues) {
        if (value !== allValues[fieldName]) {
          return message ?? `Does not match ${fieldName}`;
        }
      }
      return null;
    },
    code: 'field_mismatch',
  };
}

/**
 * Условный валидатор
 *
 * @param condition - Функция условия
 * @param rules - Правила для применения
 *
 * @example
 * ```typescript
 * const schema: DSLSchema = {
 *   company: [
 *     conditional(
 *       (value, allValues) => allValues?.employmentType === 'self-employed',
 *       [required]
 *     ),
 *   ],
 * };
 * ```
 */
export function conditional(
  condition: (value: any, allValues?: any) => boolean,
  rules: DSLRule | DSLRule[]
): DSLRule {
  return {
    validate: (value, allValues) => {
      if (!condition(value, allValues)) {
        return null; // Условие не выполнено, пропускаем
      }

      const rulesArray = Array.isArray(rules) ? rules : [rules];

      for (const rule of rulesArray) {
        const result = rule.validate(value, allValues);
        if (result) {
          return result;
        }
      }

      return null;
    },
    code: 'conditional',
  };
}
```

### Обновление index.ts

```typescript
// packages/form-schema-dsl/src/index.ts

// Экспорт ядра (из TASK-009)
export { dslPlugin, compileRule, compileSchema } from './validator';
export type { DSLSchema, DSLRule, CompiledDSLRule, CompiledDSLSchema } from './types';

// Экспорт валидаторов
export {
  required,
  minLength,
  maxLength,
  lengthRange,
  length,
  minValue,
  maxValue,
  valueRange,
  pattern,
  email,
  url,
  phone,
  creditCard,
  equalTo,
  notEqualTo,
  oneOf,
  notOneOf,
  positive,
  negative,
  integer,
  arrayLength,
  custom,
  matchesField,
  conditional,
} from './validators';

// Группированный экспорт
export * as validators from './validators';
```

## 🧪 Тестирование

### Требования
- **Coverage**: > 90% (branches > 85%)
- **Фреймворк**: Vitest

### Файлы тестов

```
packages/form-schema-dsl/src/__tests__/validators.test.ts
```

### Сценарии для тестирования

```typescript
import { describe, it, expect } from 'vitest';
import {
  required,
  minLength,
  maxLength,
  lengthRange,
  length,
  minValue,
  maxValue,
  valueRange,
  pattern,
  email,
  url,
  phone,
  creditCard,
  equalTo,
  notEqualTo,
  oneOf,
  notOneOf,
  positive,
  negative,
  integer,
  arrayLength,
  custom,
  matchesField,
  conditional,
} from '../validators';

describe('Built-in Validators', () => {
  describe('required', () => {
    it('should fail for empty string', async () => {
      const error = await required.validate('');
      expect(error).toBe('This field is required');
    });

    it('should fail for null', async () => {
      const error = await required.validate(null);
      expect(error).toBe('This field is required');
    });

    it('should fail for undefined', async () => {
      const error = await required.validate(undefined);
      expect(error).toBe('This field is required');
    });

    it('should fail for empty array', async () => {
      const error = await required.validate([]);
      expect(error).toBe('At least one item is required');
    });

    it('should pass for non-empty value', async () => {
      const error = await required.validate('test');
      expect(error).toBeNull();
    });

    it('should pass for non-empty array', async () => {
      const error = await required.validate([1, 2]);
      expect(error).toBeNull();
    });

    it('should pass for zero', async () => {
      const error = await required.validate(0);
      expect(error).toBeNull();
    });

    it('should pass for false', async () => {
      const error = await required.validate(false);
      expect(error).toBeNull();
    });
  });

  describe('minLength', () => {
    it('should fail for string shorter than min', async () => {
      const error = await minLength(5).validate('abc');
      expect(error).toBe('Minimum length is 5 characters');
    });

    it('should pass for string with min length', async () => {
      const error = await minLength(3).validate('abc');
      expect(error).toBeNull();
    });

    it('should pass for longer string', async () => {
      const error = await minLength(3).validate('abcdef');
      expect(error).toBeNull();
    });

    it('should skip non-string values', async () => {
      const error = await minLength(3).validate(123);
      expect(error).toBeNull();
    });

    it('should use custom message', async () => {
      const error = await minLength(5, 'Too short!').validate('abc');
      expect(error).toBe('Too short!');
    });
  });

  describe('maxLength', () => {
    it('should fail for string longer than max', async () => {
      const error = await maxLength(5).validate('abcdef');
      expect(error).toBe('Maximum length is 5 characters');
    });

    it('should pass for string with max length', async () => {
      const error = await maxLength(5).validate('abcde');
      expect(error).toBeNull();
    });

    it('should pass for shorter string', async () => {
      const error = await maxLength(5).validate('abc');
      expect(error).toBeNull();
    });
  });

  describe('lengthRange', () => {
    it('should fail for string shorter than min', async () => {
      const error = await lengthRange(3, 5).validate('ab');
      expect(error).toBeDefined();
    });

    it('should fail for string longer than max', async () => {
      const error = await lengthRange(3, 5).validate('abcdef');
      expect(error).toBeDefined();
    });

    it('should pass for string in range', async () => {
      const error = await lengthRange(3, 5).validate('abcd');
      expect(error).toBeNull();
    });
  });

  describe('minValue', () => {
    it('should fail for number less than min', async () => {
      const error = await minValue(10).validate(5);
      expect(error).toBe('Minimum value is 10');
    });

    it('should pass for number equal to min', async () => {
      const error = await minValue(10).validate(10);
      expect(error).toBeNull();
    });

    it('should pass for number greater than min', async () => {
      const error = await minValue(10).validate(15);
      expect(error).toBeNull();
    });

    it('should skip non-number values', async () => {
      const error = await minValue(10).validate('test');
      expect(error).toBeNull();
    });
  });

  describe('maxValue', () => {
    it('should fail for number greater than max', async () => {
      const error = await maxValue(10).validate(15);
      expect(error).toBe('Maximum value is 10');
    });

    it('should pass for number equal to max', async () => {
      const error = await maxValue(10).validate(10);
      expect(error).toBeNull();
    });

    it('should pass for number less than max', async () => {
      const error = await maxValue(10).validate(5);
      expect(error).toBeNull();
    });
  });

  describe('pattern', () => {
    it('should fail for non-matching string', async () => {
      const error = await pattern(/^[A-Z]+$/).validate('abc');
      expect(error).toBeDefined();
    });

    it('should pass for matching string', async () => {
      const error = await pattern(/^[A-Z]+$/).validate('ABC');
      expect(error).toBeNull();
    });
  });

  describe('email', () => {
    it('should fail for invalid email', async () => {
      const error = await email().validate('invalid');
      expect(error).toBe('Invalid email address');
    });

    it('should pass for valid email', async () => {
      const error = await email().validate('test@example.com');
      expect(error).toBeNull();
    });

    it('should pass for email with subdomain', async () => {
      const error = await email().validate('test@mail.example.com');
      expect(error).toBeNull();
    });
  });

  describe('url', () => {
    it('should fail for invalid url', async () => {
      const error = await url().validate('not-a-url');
      expect(error).toBe('Invalid URL');
    });

    it('should pass for http url', async () => {
      const error = await url().validate('http://example.com');
      expect(error).toBeNull();
    });

    it('should pass for https url', async () => {
      const error = await url().validate('https://example.com/path?query=1');
      expect(error).toBeNull();
    });
  });

  describe('phone', () => {
    it('should fail for short phone number', async () => {
      const error = await phone().validate('123');
      expect(error).toBeDefined();
    });

    it('should pass for valid phone number', async () => {
      const error = await phone().validate('+1 (555) 123-4567');
      expect(error).toBeNull();
    });

    it('should pass for phone without country code', async () => {
      const error = await phone().validate('5551234567');
      expect(error).toBeNull();
    });
  });

  describe('creditCard', () => {
    it('should fail for invalid card number', async () => {
      const error = await creditCard().validate('1234567890123456');
      expect(error).toBeDefined();
    });

    it('should pass for valid card number (test)', async () => {
      // Test Visa number
      const error = await creditCard().validate('4111111111111111');
      expect(error).toBeNull();
    });

    it('should fail for too short number', async () => {
      const error = await creditCard().validate('123456');
      expect(error).toBeDefined();
    });
  });

  describe('equalTo', () => {
    it('should fail for non-equal value', async () => {
      const error = await equalTo('expected').validate('different');
      expect(error).toBeDefined();
    });

    it('should pass for equal value', async () => {
      const error = await equalTo('expected').validate('expected');
      expect(error).toBeNull();
    });
  });

  describe('oneOf', () => {
    it('should fail for value not in list', async () => {
      const error = await oneOf(['a', 'b', 'c']).validate('d');
      expect(error).toBeDefined();
    });

    it('should pass for value in list', async () => {
      const error = await oneOf(['a', 'b', 'c']).validate('b');
      expect(error).toBeNull();
    });
  });

  describe('matchesField', () => {
    it('should fail when fields do not match', async () => {
      const error = await matchesField('password', 'Passwords do not match')
        .validate('password123', { password: 'password456' });
      expect(error).toBe('Passwords do not match');
    });

    it('should pass when fields match', async () => {
      const error = await matchesField('password')
        .validate('password123', { password: 'password123' });
      expect(error).toBeNull();
    });

    it('should pass when allValues is undefined', async () => {
      const error = await matchesField('password')
        .validate('value', undefined);
      expect(error).toBeNull();
    });
  });

  describe('conditional', () => {
    it('should skip validation when condition is false', async () => {
      const error = await conditional(
        (v, all) => all?.type === 'premium',
        [required]
      ).validate('', { type: 'free' });
      expect(error).toBeNull();
    });

    it('should validate when condition is true', async () => {
      const error = await conditional(
        (v, all) => all?.type === 'premium',
        [required]
      ).validate('', { type: 'premium' });
      expect(error).toBe('This field is required');
    });

    it('should work with array of rules', async () => {
      const error = await conditional(
        (v) => true,
        [required, minLength(5)]
      ).validate('abc', {});
      expect(error).toBe('Minimum length is 5 characters');
    });
  });

  describe('custom', () => {
    it('should use custom validation function', async () => {
      const validator = custom((v) => v === 'valid' ? null : 'Not valid');

      const error1 = await validator.validate('valid');
      expect(error1).toBeNull();

      const error2 = await validator.validate('invalid');
      expect(error2).toBe('Not valid');
    });

    it('should support custom message', async () => {
      const validator = custom(
        (v) => v === 'valid' ? null : 'Error',
        'Custom message'
      );

      const error = await validator.validate('invalid');
      expect(error).toBe('Custom message');
    });
  });

  describe('positive', () => {
    it('should fail for zero', async () => {
      const error = await positive().validate(0);
      expect(error).toBeDefined();
    });

    it('should fail for negative number', async () => {
      const error = await positive().validate(-5);
      expect(error).toBeDefined();
    });

    it('should pass for positive number', async () => {
      const error = await positive().validate(5);
      expect(error).toBeNull();
    });
  });

  describe('integer', () => {
    it('should fail for float', async () => {
      const error = await integer().validate(3.14);
      expect(error).toBeDefined();
    });

    it('should pass for integer', async () => {
      const error = await integer().validate(5);
      expect(error).toBeNull();
    });
  });

  describe('arrayLength', () => {
    it('should fail for array with too few items', async () => {
      const error = await arrayLength(3).validate([1, 2]);
      expect(error).toBeDefined();
    });

    it('should pass for array with enough items', async () => {
      const error = await arrayLength(2).validate([1, 2, 3]);
      expect(error).toBeNull();
    });

    it('should fail for array with too many items', async () => {
      const error = await arrayLength(undefined, 3).validate([1, 2, 3, 4]);
      expect(error).toBeDefined();
    });

    it('should skip non-array values', async () => {
      const error = await arrayLength(2).validate('not-array');
      expect(error).toBeNull();
    });
  });
});
```

## 📁 Зависимости

- [[TASK-009]](./TASK-009-dsl-plugin-core.md) — DSL плагин (ядро)

## 🔗 Связанные задачи

- [[TASK-011]](./TASK-011-dsl-async-validators.md) — DSL валидаторы (async)
- [[TASK-013]](./TASK-013-examples-demo.md) — Примеры и демо

## 📚 Ресурсы

- [Luhn Algorithm](https://en.wikipedia.org/wiki/Luhn_algorithm) — Алгоритм проверки кредитных карт

## ✅ Критерии приемки

- [ ] validators.ts создан с набором валидаторов
- [ ] Все валидаторы экспортируются из index.ts
- [ ] Тесты покрывают > 90% кода
- [ ] TSDoc комментарии для всех валидаторов
- [ ] Примеры использования в TSDoc
- [ ] ESLint без ошибок
- [ ] Прогресс отмечен в [tasks/README.md](./README.md)

## 📝 Заметки

- Валидаторы должны быть чистыми функциями
- Возвращать null для пропуска валидации (не свой тип)
- Поддерживать кастомные сообщения
- Коды ошибок для i18n

## 🔄 Прогресс

- [ ] required валидатор
- [ ] minLength/maxLength/lengthRange валидаторы
- [ ] minValue/maxValue/valueRange валидаторы
- [ ] pattern/email/url/phone валидаторы
- [ ] creditCard валидатор (Luhn)
- [ ] equalTo/notEqualTo/oneOf/notOneOf валидаторы
- [ ] positive/negative/integer валидаторы
- [ ] arrayLength валидатор
- [ ] custom валидатор
- [ ] matchesField (cross-field) валидатор
- [ ] conditional валидатор
- [ ] Написание тестов
- [ ] Достижение coverage > 90%
- [ ] TSDoc документация
- [ ] Финальная проверка
