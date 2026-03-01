// CommonJS тест для проверки реальной функции atom
const { atom, createStore } = require('@nexus-state/core');

describe('Real atom functionality', () => {
  test('creates primitive atom', () => {
    const countAtom = atom(0, 'count');
    console.log('Primitive atom:', countAtom);
    expect(countAtom).toBeDefined();
    expect(countAtom.id).toBeDefined();
    expect(typeof countAtom.read).toBe('function');
    
    const store = createStore();
    expect(store.get(countAtom)).toBe(0);
  });

  test('creates computed atom without name', () => {
    const baseAtom = atom(5, 'base');
    const doubleAtom = atom((get) => get(baseAtom) * 2);
    
    console.log('Computed atom without name:', doubleAtom);
    expect(doubleAtom).toBeDefined();
    expect(doubleAtom.id).toBeDefined();
    expect(typeof doubleAtom.read).toBe('function');
    
    const store = createStore();
    expect(store.get(baseAtom)).toBe(5);
    expect(store.get(doubleAtom)).toBe(10);
  });

  test('creates computed atom with name', () => {
    const baseAtom = atom(5, 'base');
    const doubleAtom = atom((get) => get(baseAtom) * 2, 'double');
    
    console.log('Computed atom with name:', doubleAtom);
    expect(doubleAtom).toBeDefined();
    expect(doubleAtom.id).toBeDefined();
    expect(typeof doubleAtom.read).toBe('function');
    
    const store = createStore();
    expect(store.get(doubleAtom)).toBe(10);
  });
});