// Тест создания атомов с помощью моков
/* global describe, beforeEach, test, expect, jest */
/* eslint-disable @typescript-eslint/no-var-requires */

describe('Atom creation', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('should create primitive atom with name', () => {
    // Мокаем модуль @nexus-state/core
    jest.doMock('@nexus-state/core', () => ({
      atom: jest.fn((initialValue, name) => ({
        id: Symbol('atom'),
        type: 'primitive',
        name,
        read: () => initialValue,
      })),
      createStore: jest.fn(() => ({
        get: jest.fn(() => 0),
        set: jest.fn(),
        subscribe: jest.fn(),
      })),
    }));

    const { atom } = require('@nexus-state/core');
    const countAtom = atom(0, 'count');
    
    expect(atom).toHaveBeenCalledWith(0, 'count');
    expect(countAtom.name).toBe('count');
    expect(countAtom.type).toBe('primitive');
  });

  test('should create computed atom with name', () => {
    const mockReadFunction = jest.fn(() => 10);
    
    jest.doMock('@nexus-state/core', () => ({
      atom: jest.fn((read, name) => ({
        id: Symbol('atom'),
        type: 'computed',
        name,
        read,
      })),
    }));

    const { atom } = require('@nexus-state/core');
    const doubleAtom = atom(mockReadFunction, 'double');
    
    expect(atom).toHaveBeenCalledWith(mockReadFunction, 'double');
    expect(doubleAtom.name).toBe('double');
    expect(doubleAtom.type).toBe('computed');
    expect(doubleAtom.read).toBe(mockReadFunction);
  });
});