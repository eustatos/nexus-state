// Time travel scenarios for testing historical state restoration
// Implements requirements from TASK-004-IMPLEMENT-TIME-TRAVEL

import { atom } from '../../packages/core/atom';

// Simple counter history scenarios
export const counterHistory = {
  initialState: atom(0, 'counter'),
  actions: [
    { type: 'INCREMENT', payload: null },
    { type: 'INCREMENT', payload: null },
    { type: 'INCREMENT', payload: null },
    { type: 'DECREMENT', payload: null },
    { type: 'RESET', payload: null },
    { type: 'SET', payload: 10 },
  ],
  states: [0, 1, 2, 3, 2, 0, 10],
};

// Todo list history scenarios
export const todoHistory = {
  initialState: atom([
    { id: 1, text: 'First task', completed: false },
  ], 'todos'),
  actions: [
    { type: 'ADD_TODO', payload: { id: 2, text: 'Second task', completed: false } },
    { type: 'ADD_TODO', payload: { id: 3, text: 'Third task', completed: false } },
    { type: 'TOGGLE_TODO', payload: 1 },
    { type: 'REMOVE_TODO', payload: 2 },
    { type: 'EDIT_TODO', payload: { id: 3, text: 'Updated third task' } },
  ],
  states: [
    [{ id: 1, text: 'First task', completed: false }],
    [
      { id: 1, text: 'First task', completed: false },
      { id: 2, text: 'Second task', completed: false },
    ],
    [
      { id: 1, text: 'First task', completed: false },
      { id: 2, text: 'Second task', completed: false },
      { id: 3, text: 'Third task', completed: false },
    ],
    [
      { id: 1, text: 'First task', completed: true },
      { id: 2, text: 'Second task', completed: false },
      { id: 3, text: 'Third task', completed: false },
    ],
    [
      { id: 1, text: 'First task', completed: true },
      { id: 3, text: 'Third task', completed: false },
    ],
    [
      { id: 1, text: 'First task', completed: true },
      { id: 3, text: 'Updated third task', completed: false },
    ],
  ],
};

// Complex nested state history
export const complexHistory = {
  initialState: atom({
    user: {
      profile: {
        name: 'John',
        settings: {
          theme: 'light',
          notifications: false,
        },
      },
      posts: [],
    },
    ui: {
      sidebar: false,
      modal: null,
    },
  }, 'app-state'),
  actions: [
    { type: 'UPDATE_THEME', payload: 'dark' },
    { type: 'ADD_POST', payload: { id: 1, title: 'First post' } },
    { type: 'TOGGLE_SIDEBAR', payload: null },
    { type: 'UPDATE_NAME', payload: 'John Doe' },
    { type: 'ADD_POST', payload: { id: 2, title: 'Second post' } },
    { type: 'TOGGLE_NOTIFICATIONS', payload: null },
  ],
  states: [
    {
      user: {
        profile: {
          name: 'John',
          settings: {
            theme: 'light',
            notifications: false,
          },
        },
        posts: [],
      },
      ui: {
        sidebar: false,
        modal: null,
      },
    },
    {
      user: {
        profile: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: false,
          },
        },
        posts: [],
      },
      ui: {
        sidebar: false,
        modal: null,
      },
    },
    {
      user: {
        profile: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: false,
          },
        },
        posts: [{ id: 1, title: 'First post' }],
      },
      ui: {
        sidebar: false,
        modal: null,
      },
    },
    {
      user: {
        profile: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: false,
          },
        },
        posts: [{ id: 1, title: 'First post' }],
      },
      ui: {
        sidebar: true,
        modal: null,
      },
    },
    {
      user: {
        profile: {
          name: 'John Doe',
          settings: {
            theme: 'dark',
            notifications: false,
          },
        },
        posts: [{ id: 1, title: 'First post' }],
      },
      ui: {
        sidebar: true,
        modal: null,
      },
    },
    {
      user: {
        profile: {
          name: 'John Doe',
          settings: {
            theme: 'dark',
            notifications: false,
          },
        },
        posts: [
          { id: 1, title: 'First post' },
          { id: 2, title: 'Second post' },
        ],
      },
      ui: {
        sidebar: true,
        modal: null,
      },
    },
    {
      user: {
        profile: {
          name: 'John Doe',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        posts: [
          { id: 1, title: 'First post' },
          { id: 2, title: 'Second post' },
        ],
      },
      ui: {
        sidebar: true,
        modal: null,
      },
    },
  ],
};

// Large state history for performance testing
export const largeStateHistory = {
  initialState: atom(
    Array.from({ length: 100 }, (_, i) => ({
      id: i,
      value: `Item ${i}`,
      counter: 0,
    })),
    'large-state'
  ),
  actions: Array.from({ length: 50 }, (_, i) => ({
    type: 'UPDATE_ITEM',
    payload: { id: i % 100, counter: i },
  })),
  states: [] as any[], // Will be computed during tests
};

// Empty and edge case histories
export const edgeCaseHistory = {
  initialState: atom({
    empty: null,
    undefined: undefined,
    emptyArray: [],
    emptyObject: {},
  }, 'edge-cases'),
  actions: [
    { type: 'SET_VALUE', payload: { key: 'empty', value: 'not empty' } },
    { type: 'SET_VALUE', payload: { key: 'undefined', value: 'defined' } },
    { type: 'ADD_ITEM', payload: { key: 'emptyArray', item: 'first' } },
    { type: 'ADD_PROPERTY', payload: { key: 'emptyObject', prop: 'first', value: 1 } },
    { type: 'CLEAR_ALL', payload: null },
  ],
  states: [
    {
      empty: null,
      undefined: undefined,
      emptyArray: [],
      emptyObject: {},
    },
    {
      empty: 'not empty',
      undefined: undefined,
      emptyArray: [],
      emptyObject: {},
    },
    {
      empty: 'not empty',
      undefined: 'defined',
      emptyArray: [],
      emptyObject: {},
    },
    {
      empty: 'not empty',
      undefined: 'defined',
      emptyArray: ['first'],
      emptyObject: {},
    },
    {
      empty: 'not empty',
      undefined: 'defined',
      emptyArray: ['first'],
      emptyObject: { first: 1 },
    },
    {
      empty: null,
      undefined: undefined,
      emptyArray: [],
      emptyObject: {},
    },
  ],
};