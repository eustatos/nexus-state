import type { DSLRule } from '../types';

/**
 * Equal to validator (value or field reference)
 *
 * @param target - Value or field name to compare
 */
export function equalTo(target: string | boolean | number): DSLRule {
  return {
    validate: (value, allValues) => {
      // Check if target is a field reference
      if (typeof target === 'string' && target in allValues) {
        const targetValue = allValues[target];
        return value === targetValue ? null : `Must match ${target}`;
      }
      
      return value === target ? null : `Must equal ${target}`;
    },
    code: 'equal_to',
  };
}
