import type { DSLRule } from '../types';

/**
 * Unique value validator (async)
 *
 * @param table - Database table name
 * @param field - Field name in table
 */
export function unique(table: string, field: string): DSLRule {
  return {
    validate: async (value) => {
      if (!value) return null;
      
      try {
        const response = await fetch(`/api/validate/unique`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table, field, value }),
        });
        const data = await response.json() as { available: boolean };
        return data.available ? null : 'Already exists';
      } catch {
        return 'Validation failed';
      }
    },
    code: 'unique',
  };
}
