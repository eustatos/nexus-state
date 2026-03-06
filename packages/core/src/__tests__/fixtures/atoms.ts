/**
 * Atom Fixtures
 * Pre-built atom factories for common test scenarios
 *
 * @example
 * ```typescript
 * import { primitiveAtoms, computedAtoms } from '../fixtures/atoms';
 *
 * const numAtom = primitiveAtoms.number();
 * const doubleAtom = computedAtoms.double(numAtom);
 * ```
 */

import { atom } from '../../atom';
import type { Atom, Getter, Setter } from '../../types';

/**
 * Type for primitive atom factories
 */
export type PrimitiveAtoms = typeof primitiveAtoms;

/**
 * Type for computed atom factories
 */
export type ComputedAtoms = typeof computedAtoms;

/**
 * Type for writable atom factories
 */
export type WritableAtoms = typeof writableAtoms;

/**
 * Type for edge case atom factories
 */
export type EdgeCaseAtoms = typeof edgeCaseAtoms;

/**
 * Primitive atom fixtures
 */
export const primitiveAtoms = {
  /** Number atom with value 42 */
  number: () => atom(42, 'number'),

  /** String atom with value 'hello' */
  string: () => atom('hello', 'string'),

  /** Boolean atom with value true */
  boolean: () => atom(true, 'boolean'),

  /** Null atom */
  null: () => atom(null, 'null'),

  /** Undefined atom */
  undefined: () => atom(undefined, 'undefined'),

  /** Zero atom */
  zero: () => atom(0, 'zero'),

  /** Empty string atom */
  emptyString: () => atom('', 'empty-string'),

  /** Empty array atom */
  emptyArray: () => atom<unknown[]>([], 'empty-array'),

  /** Empty object atom */
  emptyObject: () => atom<Record<string, unknown>>({}, 'empty-object'),

  /** Negative number atom */
  negative: () => atom(-42, 'negative'),

  /** Float atom */
  float: () => atom(3.14159, 'float'),

  /** Large number atom */
  large: () => atom(Number.MAX_SAFE_INTEGER, 'large'),

  /** Infinity atom */
  infinity: () => atom(Infinity, 'infinity'),

  /** NaN atom */
  nan: () => atom(NaN, 'nan'),
};

/**
 * Computed atom fixtures
 */
export const computedAtoms = {
  /** Double the base atom value */
  double: (baseAtom: Atom<number>) =>
    atom((get: Getter) => get(baseAtom) * 2, 'double'),

  /** Triple the base atom value */
  triple: (baseAtom: Atom<number>) =>
    atom((get: Getter) => get(baseAtom) * 3, 'triple'),

  /** Base atom value plus 1 */
  increment: (baseAtom: Atom<number>) =>
    atom((get: Getter) => get(baseAtom) + 1, 'increment'),

  /** Base atom value minus 1 */
  decrement: (baseAtom: Atom<number>) =>
    atom((get: Getter) => get(baseAtom) - 1, 'decrement'),

  /** Sum of two atoms */
  sum: (atom1: Atom<number>, atom2: Atom<number>) =>
    atom((get: Getter) => get(atom1) + get(atom2), 'sum'),

  /** Difference of two atoms */
  difference: (atom1: Atom<number>, atom2: Atom<number>) =>
    atom((get: Getter) => get(atom1) - get(atom2), 'difference'),

  /** Product of two atoms */
  product: (atom1: Atom<number>, atom2: Atom<number>) =>
    atom((get: Getter) => get(atom1) * get(atom2), 'product'),

  /** Check if base atom is positive */
  isPositive: (baseAtom: Atom<number>) =>
    atom((get: Getter) => get(baseAtom) > 0, 'is-positive'),

  /** Check if base atom is negative */
  isNegative: (baseAtom: Atom<number>) =>
    atom((get: Getter) => get(baseAtom) < 0, 'is-negative'),

  /** Check if base atom is zero */
  isZero: (baseAtom: Atom<number>) =>
    atom((get: Getter) => get(baseAtom) === 0, 'is-zero'),

  /** String length of base atom */
  stringLength: (baseAtom: Atom<string>) =>
    atom((get: Getter) => get(baseAtom).length, 'string-length'),

  /** Uppercase string */
  toUpperCase: (baseAtom: Atom<string>) =>
    atom((get: Getter) => get(baseAtom).toUpperCase(), 'to-upper'),

  /** Array length */
  arrayLength: (baseAtom: Atom<unknown[]>) =>
    atom((get: Getter) => get(baseAtom).length, 'array-length'),

  /** Negate boolean */
  negate: (baseAtom: Atom<boolean>) =>
    atom((get: Getter) => !get(baseAtom), 'negate'),
};

/**
 * Writable atom fixtures
 */
export const writableAtoms = {
  /** Counter with inc/dec/reset actions */
  counter: () => {
    const counterAtom = atom(
      () => 0,
      (get, set, action: 'inc' | 'dec' | 'reset') => {
        switch (action) {
          case 'inc':
            set(counterAtom, get(counterAtom) + 1);
            break;
          case 'dec':
            set(counterAtom, get(counterAtom) - 1);
            break;
          case 'reset':
            set(counterAtom, 0);
            break;
        }
      },
      'counter'
    );
    return counterAtom;
  },

  /** Clamped value between min and max */
  clamped: (min: number, max: number) =>
    atom(
      () => 0,
      (get, set, value: number) => {
        const clamped = Math.max(min, Math.min(max, value));
        set(clamped, clamped);
      },
      'clamped'
    ),

  /** Positive-only value */
  positiveOnly: () =>
    atom(
      () => 0,
      (get, set, value: number) => {
        if (value < 0) {
          throw new Error('Value must be positive');
        }
        set(positiveOnly, value);
      },
      'positive-only'
    ),

  /** Doubled write - stores value * 2 */
  doubled: () =>
    atom(
      () => 0,
      (get, set, value: number) => {
        set(doubled, value * 2);
      },
      'doubled'
    ),

  /** Sync atom - updates multiple atoms */
  sync: (masterAtom: Atom<number>, slaves: Atom<number>[]) =>
    atom(
      (get: Getter) => get(masterAtom),
      (get, set, value: number) => {
        set(masterAtom, value);
        slaves.forEach((slave) => set(slave, value));
      },
      'sync'
    ),

  /** Validated string - must be non-empty */
  validatedString: () =>
    atom(
      () => '',
      (get, set, value: string) => {
        if (!value.trim()) {
          throw new Error('String cannot be empty');
        }
        set(validatedString, value);
      },
      'validated-string'
    ),
};

/**
 * Custom atom factory for edge cases
 */
export const edgeCaseAtoms = {
  /** Circular reference object */
  circular: () => {
    const obj: any = { value: 42 };
    obj.self = obj;
    return atom(obj, 'circular');
  },

  /** Deeply nested object */
  deepNested: () =>
    atom(
      {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep',
              },
            },
          },
        },
      },
      'deep-nested'
    ),

  /** Mixed types object */
  mixedObject: () =>
    atom(
      {
        string: 'hello',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, 3],
        object: { nested: 'value' },
      },
      'mixed-object'
    ),

  /** Map atom */
  map: (entries?: [string, unknown][]) =>
    atom(
      new Map(entries || [['key', 'value']]),
      'map'
    ),

  /** Set atom */
  set: (values?: unknown[]) =>
    atom(
      new Set(values || [1, 2, 3]),
      'set'
    ),

  /** Date atom */
  date: (dateString?: string) =>
    atom(
      new Date(dateString || '2024-01-01'),
      'date'
    ),

  /** RegExp atom */
  regex: (pattern?: string, flags?: string) =>
    atom(
      new RegExp(pattern || 'test', flags || 'gi'),
      'regex'
    ),

  /** Symbol atom */
  symbol: (description?: string) =>
    atom(
      Symbol(description || 'test'),
      'symbol'
    ),

  /** BigInt atom */
  bigInt: (value?: string | bigint) =>
    atom(
      BigInt(value || '9007199254740991'),
      'bigint'
    ),

  /** Function atom */
  fn: (fn?: (...args: any[]) => any) =>
    atom(
      fn || ((x: number) => x * 2),
      'function'
    ),
};
