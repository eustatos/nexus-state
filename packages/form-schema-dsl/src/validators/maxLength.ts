import type { DSLRule } from '../types';

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
