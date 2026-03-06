/**
 * Fixtures for AtomRegistry tests
 */

import type { PrimitiveAtom, ComputedAtom, WritableAtom } from '../../../types';

/**
 * Creates a test primitive atom
 */
export function createPrimitiveAtom<T>(value: T, name?: string): PrimitiveAtom<T> {
  const id = Symbol(name || 'test-atom');
  return {
    id,
    type: 'primitive' as const,
    name,
    read: () => value,
  };
}

/**
 * Creates a test computed atom
 */
export function createComputedAtom<T>(
  readFn: () => T,
  name?: string
): ComputedAtom<T> {
  const id = Symbol(name || 'test-computed');
  return {
    id,
    type: 'computed' as const,
    name,
    read: readFn,
  };
}

/**
 * Creates a test writable atom
 */
export function createWritableAtom<T>(
  value: T,
  readFn: (get: any) => T,
  writeFn: (get: any, set: any, val: T) => void,
  name?: string
): WritableAtom<T> {
  const id = Symbol(name || 'test-writable');
  return {
    id,
    type: 'writable' as const,
    name,
    read: readFn,
    write: writeFn,
  };
}

/**
 * Creates a minimal mock atom for registration
 */
export function createMockAtom(
  id: symbol,
  type?: 'primitive' | 'computed' | 'writable',
  name?: string
) {
  return {
    id,
    type,
    name,
    read: () => ({}),
    write: undefined,
  };
}
