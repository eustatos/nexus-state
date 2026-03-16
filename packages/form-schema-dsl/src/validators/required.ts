import type { DSLRule } from '../types';

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
