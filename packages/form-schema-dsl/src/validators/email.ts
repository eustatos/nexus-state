import type { DSLRule } from '../types';

/**
 * Email format validator
 */
export const email: DSLRule = {
  validate: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Invalid email format';
  },
  code: 'email',
};
