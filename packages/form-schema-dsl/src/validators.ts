import type { DSLRule } from './types';

/**
 * Required field validator
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
 * Minimum string length validator
 *
 * @param min - Minimum length
 * @param message - Custom message
 */
export function minLength(min: number, message?: string): DSLRule {
  return {
    validate: (value) => {
      if (typeof value !== 'string') {
        return null;
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
 * Maximum string length validator
 *
 * @param max - Maximum length
 * @param message - Custom message
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
 * String length range validator
 *
 * @param min - Minimum length
 * @param max - Maximum length
 * @param message - Custom message
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
 * Exact string length validator
 *
 * @param length - Required length
 * @param message - Custom message
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
 * Minimum number value validator
 *
 * @param min - Minimum value
 * @param message - Custom message
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
 * Maximum number value validator
 *
 * @param max - Maximum value
 * @param message - Custom message
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
 * Number value range validator
 *
 * @param min - Minimum value
 * @param max - Maximum value
 * @param message - Custom message
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
 * Pattern/regex validator
 *
 * @param pattern - Regular expression
 * @param message - Custom message
 */
export function pattern(pattern: RegExp, message?: string): DSLRule {
  return {
    validate: (value) => {
      if (typeof value !== 'string') {
        return null;
      }
      if (!pattern.test(value)) {
        return message ?? 'Does not match required pattern';
      }
      return null;
    },
    code: 'pattern',
  };
}

/**
 * Email validator
 *
 * @param message - Custom message
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
 * URL validator
 *
 * @param message - Custom message
 */
export function url(message?: string): DSLRule {
  const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
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
 * Phone number validator (basic)
 *
 * @param message - Custom message
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
 * Credit card validator (Luhn algorithm)
 *
 * @param message - Custom message
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
 * Equal to specified value validator
 *
 * @param expected - Expected value
 * @param message - Custom message
 */
export function equalTo(expected: unknown, message?: string): DSLRule {
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
 * Not equal to specified value validator
 *
 * @param unexpected - Disallowed value
 * @param message - Custom message
 */
export function notEqualTo(unexpected: unknown, message?: string): DSLRule {
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
 * Value in set validator
 *
 * @param values - Allowed values
 * @param message - Custom message
 */
export function oneOf(values: unknown[], message?: string): DSLRule {
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
 * Value not in set validator
 *
 * @param values - Disallowed values
 * @param message - Custom message
 */
export function notOneOf(values: unknown[], message?: string): DSLRule {
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
 * Positive number validator
 *
 * @param message - Custom message
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
 * Negative number validator
 *
 * @param message - Custom message
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
 * Integer validator
 *
 * @param message - Custom message
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
 * Array length validator
 *
 * @param min - Minimum items
 * @param max - Maximum items
 * @param message - Custom message
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
 * Custom validator
 *
 * @param fn - Validation function
 * @param message - Default message
 * @param code - Error code
 */
export function custom<T = unknown>(
  fn: (value: T, allValues?: unknown) => string | null,
  message?: string,
  code?: string
): DSLRule<T> {
  return {
    validate: (value, allValues) => {
      const result = fn(value, allValues);
      if (result && message) {
        return message;
      }
      return result;
    },
    message,
    code: code ?? 'custom',
  };
}

/**
 * Cross-field validation (matches another field)
 *
 * @param fieldName - Field name to compare
 * @param message - Custom message
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const all = allValues as any;
      if (all && fieldName in all) {
        if (value !== all[fieldName]) {
          return message ?? `Does not match ${fieldName}`;
        }
      }
      return null;
    },
    code: 'field_mismatch',
  };
}

/**
 * Conditional validator
 *
 * @param condition - Condition function
 * @param rules - Rules to apply when condition is true
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
  condition: (value: unknown, allValues?: unknown) => boolean,
  rules: DSLRule | DSLRule[]
): DSLRule {
  return {
    validate: (value, allValues) => {
      if (!condition(value, allValues)) {
        return null; // Condition not met, skip validation
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
