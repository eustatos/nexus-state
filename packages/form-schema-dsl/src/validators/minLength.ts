import type { DSLRule } from '../types';

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
