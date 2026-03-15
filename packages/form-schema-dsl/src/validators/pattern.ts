import type { DSLRule } from '../types';

/**
 * Pattern/regex validator
 *
 * @param regex - Regular expression
 * @param message - Custom message
 */
export function pattern(regex: RegExp, message?: string): DSLRule {
  return {
    validate: (value) => {
      if (!value) return null;
      return regex.test(value) ? null : (message ?? 'Invalid format');
    },
    code: 'pattern',
  };
}
