/**
 * Type-safe helpers for DevTools UI rendering
 */

import type { QuerySnapshot, MutationSnapshot } from './types';

/**
 * Format unknown value for safe display in UI
 */
export function formatDevToolsValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * Safe status getter with default value
 */
export function getQueryStatus(snapshot: QuerySnapshot | undefined | null): string {
  if (!snapshot) return 'idle';
  return snapshot.status || 'idle';
}

/**
 * Safe boolean getter
 */
export function getSafeBoolean(value: unknown, defaultValue = false): boolean {
  return Boolean(value ?? defaultValue);
}

/**
 * Safe number getter
 */
export function getSafeNumber(value: unknown, defaultValue = 0): number {
  const num = Number(value);
  return Number.isNaN(num) ? defaultValue : num;
}

/**
 * Type guard for QuerySnapshot
 */
export function isQuerySnapshot(value: unknown): value is QuerySnapshot {
  return (
    typeof value === 'object' &&
    value !== null &&
    'queryKey' in value &&
    'status' in value &&
    'data' in value &&
    'isFetching' in value
  );
}

/**
 * Type guard for MutationSnapshot
 */
export function isMutationSnapshot(value: unknown): value is MutationSnapshot {
  return (
    typeof value === 'object' &&
    value !== null &&
    'mutationId' in value &&
    'status' in value
  );
}

/**
 * Convert QuerySnapshot to display-safe object
 */
export function toDisplayableQuery(snapshot: QuerySnapshot): {
  queryKey: string;
  status: string;
  isFetching: boolean;
  isStale: boolean;
  failureCount: number;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  hasData: boolean;
  hasError: boolean;
} {
  return {
    queryKey: snapshot.queryKey || '',
    status: snapshot.status || 'idle',
    isFetching: getSafeBoolean(snapshot.isFetching, false),
    isStale: getSafeBoolean(snapshot.isStale, false),
    failureCount: getSafeNumber(snapshot.failureCount, 0),
    dataUpdatedAt: getSafeNumber(snapshot.dataUpdatedAt, 0),
    errorUpdatedAt: getSafeNumber(snapshot.errorUpdatedAt, 0),
    hasData: snapshot.data !== undefined && snapshot.data !== null,
    hasError: snapshot.error !== undefined && snapshot.error !== null,
  };
}

/**
 * Convert MutationSnapshot to display-safe object
 */
export function toDisplayableMutation(snapshot: MutationSnapshot): {
  mutationId: string;
  status: string;
  failureCount: number;
  hasVariables: boolean;
  hasData: boolean;
  hasError: boolean;
} {
  return {
    mutationId: snapshot.mutationId || '',
    status: snapshot.status || 'idle',
    failureCount: getSafeNumber(snapshot.failureCount, 0),
    hasVariables: snapshot.variables !== undefined && snapshot.variables !== null,
    hasData: snapshot.data !== undefined && snapshot.data !== null,
    hasError: snapshot.error !== undefined && snapshot.error !== null,
  };
}
