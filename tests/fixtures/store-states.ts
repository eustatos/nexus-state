// Store state fixtures for testing
// Implements requirements from TASK-002-ENHANCE-STORE-DEVTOOLS-INTEGRATION

import { atom } from '../../packages/core/atom';

// Simple primitive states
export const simpleStates = {
  counter: atom(0),
  text: atom('hello world'),
  flag: atom(true),
  empty: atom(null),
};

// Complex nested states
export const complexStates = {
  user: atom({
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    profile: {
      avatar: 'avatar.jpg',
      bio: 'Software developer',
      social: {
        twitter: '@johndoe',
        github: 'johndoe',
      },
    },
    preferences: {
      theme: 'dark',
      notifications: true,
      language: 'en',
    },
  }),
  
  todos: atom([
    { id: 1, text: 'Learn nexus-state', completed: false },
    { id: 2, text: 'Implement DevTools', completed: false },
    { id: 3, text: 'Write tests', completed: true },
  ]),
  
  dashboard: atom({
    widgets: [
      { id: 'stats', type: 'statistics', data: { users: 1234, revenue: 5678 } },
      { id: 'chart', type: 'line-chart', data: [1, 2, 3, 4, 5] },
      { id: 'notifications', type: 'list', data: ['Welcome!', 'New message'] },
    ],
    layout: {
      columns: 3,
      rows: 2,
    },
  }),
};

// Circular reference states (for testing serialization)
export const circularStates = {
  circular: (() => {
    const obj: Record<string, unknown> = { name: 'circular' };
    obj.self = obj;
    return atom(obj);
  })(),

  mutual: (() => {
    const a: Record<string, unknown> = { name: 'A' };
    const b: Record<string, unknown> = { name: 'B' };
    a.ref = b;
    b.ref = a;
    return atom({ a, b });
  })(),
};

// Large state trees (for performance testing)
export const largeStates = {
  largeArray: atom(Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    value: `Item ${i}`,
    nested: {
      deep: {
        value: i * 2,
      },
    },
  }))),
  
  deepNested: atom(
    Array.from({ length: 10 }, (_, level) => ({
      [`level${level}`]: Array.from({ length: 10 }, (_, i) => ({
        id: `${level}-${i}`,
        data: Array.from({ length: 100 }, (_, j) => ({
          value: `Data ${level}-${i}-${j}`,
        })),
      })),
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
  ),
};

// Computed states (for testing computed atom tracking)
export const computedStates = {
  count: atom(0),
  
  doubleCount: atom(
    (get) => get(computedStates.count) * 2
  ),
  
  tripleCount: atom(
    (get) => get(computedStates.count) * 3
  ),
  
  formattedCount: atom(
    (get) => `Count is: ${get(computedStates.count)}`
  ),
  
  // Complex computed state
  summary: atom((get) => ({
    count: get(computedStates.count),
    double: get(computedStates.doubleCount),
    triple: get(computedStates.tripleCount),
    formatted: get(computedStates.formattedCount),
    timestamp: Date.now(),
  })),
};

// Empty and edge case states
export const edgeCaseStates = {
  emptyObject: atom({}),
  emptyArray: atom([]),
  deeplyNestedEmpty: atom({ a: { b: { c: { d: {} } } } }),
  specialValues: atom({
    nan: NaN,
    infinity: Infinity,
    negativeInfinity: -Infinity,
    zero: 0,
    negativeZero: -0,
  }),
  functions: atom({
    method: () => 'result',
    arrow: () => ({ arrow: true }),
  }),
  dates: atom({
    now: new Date(),
    specific: new Date('2023-01-01T00:00:00Z'),
  }),
  regex: atom({
    simple: /test/g,
    complex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  }),
};

// State with various data types for serialization testing
export const serializationTestStates = {
  primitives: atom({
    string: 'hello',
    number: 42,
    boolean: true,
    null: null,
    undefined: undefined,
  }),
  
  collections: atom({
    map: new Map([['key1', 'value1'], ['key2', 'value2']]),
    set: new Set([1, 2, 3, 4, 5]),
    weakMap: new WeakMap(),
    weakSet: new WeakSet(),
  }),
  
  errors: atom({
    error: new Error('Test error'),
    typeError: new TypeError('Type error'),
  }),
  
  buffers: atom({
    buffer: new ArrayBuffer(16),
    uint8Array: new Uint8Array([1, 2, 3, 4]),
  }),
  
  promises: atom({
    resolved: Promise.resolve('resolved'),
    pending: new Promise(() => {}), // Never resolves
  }),
};